/* Explicit remote/local release smoke: never reads or changes an existing user's room. */
const assert=require('node:assert/strict');
const {Client}=require('colyseus.js');
require('../dist/decks.js');
const base=process.argv[2];if(!base)throw Error('Provide the deployed base URL');
const peers=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function post(path,value){const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)});assert(r.ok);return r.json();}
async function until(fn){for(let i=0;i<150;i++){if(fn())return;await pause(50);}throw Error('Timed out waiting for deployed match');}
async function join(code,token,spectate=false){const room=await new Client(base).joinOrCreate('battle',{code,token,spectate});const p={room,s:null,error:null};peers.push(p);room.onMessage('snapshot',s=>p.s=s);room.onMessage('error',e=>p.error=e);await until(()=>p.s);return p;}
async function action(p,name,args={}){const revision=p.s.revision;p.room.send('command',{id:require('node:crypto').randomUUID(),revision,action:name,args});await until(()=>p.s.revision>revision||p.error);assert(!p.error,JSON.stringify(p.error));}
(async()=>{try{
 const health=await fetch(base+'/health');assert.equal(health.status,200);assert((await health.json()).ok);
 for(const file of ['/index.html','/online.html','/campaign.html','/touch-cards.js','/hero-skills.js','/vendor/colyseus.js'])assert.equal((await fetch(base+file)).status,200,file);
 assert.equal((await fetch(base+'/_admin/incorrect')).status,404);
 const identities=await Promise.all([post('/api/online/session',{}),post('/api/online/session',{})]);
 const queue=await post('/api/online/matchmaking/status',{token:identities[0].token});assert.equal(queue.status,'idle');assert(Number.isInteger(queue.queueCount));
 const {code}=await post('/api/online/rooms',{token:identities[0].token});
 const a=await join(code,identities[0].token),b=await join(code,identities[1].token);
 const watcher=await join(code,identities[0].token,true);assert.equal(watcher.s.spectator,true);
 await action(a,'ready',{deck:{...ARTIFACT_DECKS[0],name:'上线验证 · 苍翠锋线'}});await until(()=>b.s.revision===a.s.revision);
 await action(b,'ready',{deck:{...ARTIFACT_DECKS[1],name:'上线验证 · 暗月密谋'}});await until(()=>a.s.status==='battle');
 await until(()=>watcher.s.status==='battle');assert(watcher.s.state.players.every(p=>p.hand.every(c=>c.k==='hidden')));
 await action(a,'pass');await until(()=>b.s.revision===a.s.revision);assert.equal(b.s.state.turn,1);
 await action(b,'concede');await until(()=>a.s.status==='finished');assert.equal(a.s.state.winner,0);
 await until(()=>watcher.s.status==='finished');assert.equal(watcher.s.state.winner,0);assert.deepEqual(a.s.state.deckSpecs[1].main,ARTIFACT_DECKS[1].main);
 const revision=a.s.revision;await a.room.leave();const restored=await join(code,identities[0].token);assert.equal(restored.s.seat,0);assert.equal(restored.s.revision,revision);assert.equal(restored.s.state.events.length,0);
 console.log(JSON.stringify({ok:true,base,room:code,status:restored.s.status,revision,verified:['HTTP','assets','WebSocket','two players','ready','pass','winner','rejoin','admin route hidden']}));
 }finally{for(const p of peers)if(p.room.connection?.isOpen)await p.room.leave();}
})().catch(e=>{console.error(e);process.exitCode=1;});
