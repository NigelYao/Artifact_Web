/* Real HTTP/WebSocket clients, isolated database, restart and recovery. */
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {mkdtempSync, rmSync} = require('node:fs');
const {tmpdir} = require('node:os');
const path = require('node:path');
const {Client} = require('colyseus.js');
require('../dist/decks.js');
const directory = mkdtempSync(path.join(tmpdir(), 'artifact-online-'));
const port = 8791;
const base = `http://127.0.0.1:${port}`;
const clients = [];
let server, output = '', serial = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, label) {
  const start = Date.now();
  while(Date.now() - start < 12000) {if(fn()) return fn(); await delay(25);}
  throw Error(`Timeout: ${label}\n${output.slice(-3000)}`);
}
async function start() {
  server = spawn(process.execPath, ['server/index.cjs'], {cwd:path.join(__dirname, '..'), env:{...process.env, PORT:String(port), HOST:'127.0.0.1', ARTIFACT_DB:path.join(directory,'matches.sqlite')}, stdio:['ignore','pipe','pipe']});
  server.stdout.on('data', b => {output += b;});server.stderr.on('data', b => {output += b;});
  for(let i=0;i<100;i++) {try {const r = await fetch(base+'/api/online/health');if(r.ok)return;}catch {}await delay(100);}
  throw Error('Server failed to start: '+output);
}
async function stop() {if(!server||server.exitCode!==null)return;const done=new Promise(resolve=>server.once('exit',resolve));server.kill();await done;}
async function post(url,body) {const r=await fetch(base+url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const value=await r.json();assert(r.ok,JSON.stringify(value));return value;}
async function join(code, token, spectate=false) {
  const room=await new Client(base).joinOrCreate('battle',{code,token,spectate});
  const peer={room,snapshot:null,errors:[],acks:[]};clients.push(peer);
  room.onMessage('snapshot',value=>peer.snapshot=value);
  room.onMessage('error',value=>peer.errors.push(value));
  room.onMessage('ack',value=>peer.acks.push(value));
  room.onError((code,message)=>peer.errors.push({code,message}));
  await until(()=>peer.snapshot,'join snapshot');return peer;
}
async function command(peer,action,args={}) {
  const revision=peer.snapshot.revision,id=`test-${++serial}`;
  const errorCount=peer.errors.length;
  peer.room.send('command',{id,revision,action,args});
  await until(()=>peer.snapshot.revision>revision||peer.errors.length>errorCount,action);
  assert.equal(peer.errors.length,errorCount,JSON.stringify(peer.errors.at(-1)));
  return {id,revision,action,args};
}
async function synced(a,b) {await until(()=>a.snapshot.revision===b.snapshot.revision,'both clients same revision');}
(async()=>{
 try {
  await start();
  const tokens=await Promise.all([post('/api/online/session',{}),post('/api/online/session',{}),post('/api/online/session',{})]);
  assert.notEqual(tokens[0].token,tokens[1].token);
  await post('/api/online/matchmaking/join',{token:tokens[0].token});
  const {code}=await post('/api/online/rooms',{token:tokens[0].token});
  assert.equal((await post('/api/online/matchmaking/status',{token:tokens[0].token})).status,'idle','manual room creation cancels queue');assert.match(code,/^[A-Z0-9]{6}$/);
  await post('/api/online/matchmaking/join',{token:tokens[2].token});
  const watcher=await join(code,tokens[2].token,true);
  assert.equal((await post('/api/online/matchmaking/status',{token:tokens[2].token})).status,'queued','spectating preserves queue');
  await post('/api/online/matchmaking/join',{token:tokens[1].token});
  assert.equal(watcher.snapshot.spectator,true);assert.equal(watcher.snapshot.players[1].occupied,false,'spectator does not take vacant seat');
  let a=await join(code,tokens[0].token),b=await join(code,tokens[1].token);
  const secondWatcher=await join(code,tokens[0].token,true);assert.equal(secondWatcher.snapshot.spectator,true,'player can also watch without replacing player connection');
  assert.equal(a.snapshot.seat,0);assert.equal(b.snapshot.seat,1);
  assert.equal((await post('/api/online/matchmaking/status',{token:tokens[1].token})).status,'idle','manual joining cancels queue');
  await post('/api/online/matchmaking/cancel',{token:tokens[2].token});
  await assert.rejects(()=>new Client(base).joinOrCreate('battle',{code,token:tokens[2].token}));
  await command(a,'ready',{deck:ARTIFACT_DECKS[0]});await synced(a,b);
  await command(b,'ready',{deck:ARTIFACT_DECKS[1]});await synced(a,b);
  assert.equal(a.snapshot.status,'battle');assert.equal(a.snapshot.state.players[0].hand.length,5);
  assert(a.snapshot.state.players[1].hand.every(card=>card.k==='hidden'),'opponent cards are hidden');
  await synced(a,watcher);assert(watcher.snapshot.state.players.every(p=>p.hand.every(c=>c.k==='hidden')&&p.deck.every(c=>c.k==='hidden')&&p.shop===null));assert(watcher.snapshot.state.deckSpecs.every(d=>d.main.length===0&&d.items.length===0));
  const spectatorRevision=watcher.snapshot.revision;watcher.room.send('command',{id:'spectator-cheat',revision:spectatorRevision,action:'concede'});await until(()=>watcher.errors.length,'spectator command rejected');assert.equal(watcher.snapshot.revision,spectatorRevision);
  console.log('PASS anonymous rooms, two seats, spectator isolation and hidden hands');
  const first=await command(a,'pass');await synced(a,b);
  const rev=a.snapshot.revision;
  a.room.send('command',first);await delay(150);assert.equal(a.snapshot.revision,rev,'retry must not apply twice');
  const errors=a.errors.length;
  a.room.send('command',{id:'stale-unique',revision:0,action:'pass',args:{}});
  await until(()=>a.errors.length>errors,'stale command rejected');assert.equal(a.snapshot.revision,rev);
  while(a.snapshot.state.phase==='action') {const peer=a.snapshot.state.turn===0?a:b;await command(peer,'pass');await synced(a,b);}
  assert.equal(a.snapshot.state.phase,'shop');
  const hp=a.snapshot.state.lanes.map(l=>l.towers.map(t=>t.hp));
  await command(a,'shopReady');await synced(a,b);
  assert.equal(b.snapshot.state.phase,'shop');assert.deepEqual(b.snapshot.state.lanes.map(l=>l.towers.map(t=>t.hp)),hp);
  await command(b,'shopReady');await synced(a,b);assert.equal(a.snapshot.state.phase,'deploy');
  const assignments=peer=>peer.snapshot.state.units.filter(u=>u.owner===peer.snapshot.seat&&u.hero&&!u.copy&&!u.alive&&u.readyRound<=peer.snapshot.state.round).map(u=>({uid:u.uid,lane:peer.snapshot.seat===0?2:1}));
  const plan=assignments(a);assert(plan.length);
  await command(a,'deployReady',{assignments:plan});await synced(a,b);
  assert.equal(b.snapshot.state.phase,'deploy');
  for(const entry of plan)assert.equal(b.snapshot.state.units.find(u=>u.uid===entry.uid).alive,false,'deployment not revealed early');
  await synced(a,watcher);assert.equal(watcher.snapshot.state.deploymentPlan,undefined);for(const entry of plan)assert.equal(watcher.snapshot.state.units.find(u=>u.uid===entry.uid).alive,false);
  await synced(a,secondWatcher);assert.equal(secondWatcher.snapshot.state.deploymentPlan,undefined);
  await command(b,'deployReady',{assignments:assignments(b)});await synced(a,b);
  assert.equal(a.snapshot.state.phase,'action');for(const entry of plan)assert.equal(a.snapshot.state.units.find(u=>u.uid===entry.uid).lane,2);
  console.log('PASS command deduplication, stale rejection, shop barrier, simultaneous deployment');
  const saved=JSON.stringify(a.snapshot.state),savedRevision=a.snapshot.revision;
  await a.room.leave();a=await join(code,tokens[0].token);
  assert.equal(a.snapshot.revision,savedRevision);assert.equal(a.snapshot.seat,0);assert.deepEqual({...a.snapshot.state,events:[]},{...JSON.parse(saved),events:[]});
  await a.room.leave();await b.room.leave();await watcher.room.leave();await secondWatcher.room.leave();await stop();await start();
  const restored=await post('/api/online/session',{token:tokens[0].token});assert(restored.rooms.some(r=>r.code===code));
  a=await join(code,tokens[0].token);b=await join(code,tokens[1].token);
  assert.equal(a.snapshot.revision,savedRevision);assert.deepEqual({...a.snapshot.state,events:[]},{...JSON.parse(saved),events:[]});
  await command(b,'concede');await synced(a,b);assert.equal(a.snapshot.state.winner,0);assert.equal(a.snapshot.status,'finished');
  const resumedWatcher=await join(code,tokens[2].token,true);assert.equal(resumedWatcher.snapshot.status,'finished');assert.equal(resumedWatcher.snapshot.state.winner,0);assert(resumedWatcher.snapshot.state.players.every(p=>p.hand.every(c=>c.k==='hidden')));assert.deepEqual(a.snapshot.state.deckSpecs[1].main,ARTIFACT_DECKS[1].main);
  console.log('PASS browser reconnect, server restart persistence, surrender and spectator recovery');
 } finally {for(const p of clients)try{if(p.room.connection?.isOpen)await p.room.leave();}catch{}await stop();rmSync(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
