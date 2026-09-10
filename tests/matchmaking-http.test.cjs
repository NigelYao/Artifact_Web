'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),express=require('express');
const {Store}=require('../server/store.cjs'),{mountMatchmaking}=require('../server/matchmaking.cjs');
require('../dist/decks.js');const deck=ARTIFACT_DECKS[0];
test('HTTP matchmaking validates sessions, timings, readiness, timeout recovery and idempotent parallel requests',async()=>{
 const store=new Store(':memory:');let now=100000;const tokens=[store.identity(),store.identity(),store.identity()];
 const app=express();app.use(express.json());const mounted=mountMatchmaking(app,{store,clock:()=>now,timer:false});const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 async function request(action,index,args={},status=200){const response=await fetch(base+'/api/online/matchmaking/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:tokens[index]||'invalid',...args})});assert.equal(response.status,status);return response.json();}
 try{
  await request('join',9,{},401);assert.equal((await request('join',0)).queueCount,1);assert.equal((await request('join',0)).queueCount,1);await request('join',1);
  now+=9999;assert.equal((await request('status',0)).status,'queued');now++;const match=await request('status',1);assert.equal(match.status,'matched');assert.equal(match.deadline,now+30000);
  await request('ready',0,{matchId:'stale',deck},409);await request('ready',0,{matchId:match.matchId,deck:{}},400);
  await request('ready',0,{matchId:match.matchId,deck});now+=10000;await request('status',0);now+=10000;await request('status',0);now+=10000;
  const queued=await request('status',0);assert.equal(queued.reason,'requeued');assert.equal((await request('status',1)).reason,'timeout');await request('ready',1,{matchId:match.matchId,deck},409);
  await request('join',1);now+=10000;const second=await request('status',0);assert.notEqual(second.matchId,match.matchId);
  const responses=await Promise.all([request('ready',0,{matchId:second.matchId,deck}),request('ready',1,{matchId:second.matchId,deck}),request('ready',1,{matchId:second.matchId,deck})]);
  const battle=responses.find(r=>r.status==='battle');assert(battle);assert.equal(store.adminCounts().battle,1);assert.equal((await request('status',0)).code,battle.code);assert.equal((await request('cancel',0,{matchId:second.matchId})).status,'battle');
  const record=store.load(battle.code);record.status='finished';record.state.phase='ended';record.state.winner=0;store.save(record);
  assert.equal((await request('status',0)).reason,'completed');assert.equal((await request('join',0)).status,'queued');assert.equal((await request('cancel',0)).status,'idle');
  await request('join',2);now+=15000;assert.equal((await request('status',2)).reason,'expired');
 }finally{mounted.close();await new Promise(r=>server.close(r));store.close();}
});
