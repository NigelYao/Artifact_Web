'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),express=require('express');
const {Store}=require('./store.cjs'),{mountDeckShare}=require('./deck-share.cjs');
require('../dist/decks.js');
(async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'artifact-deck-share-')),filename=path.join(directory,'online.sqlite');let store=new Store(filename),server;
 try{
  const app=express();app.use(express.json({limit:'128kb'}));mountDeckShare(app,{store});
  app.use((error,req,res,next)=>res.status(error.status||500).json({error:error.message}));
  server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+server.address().port;
  const post=deck=>fetch(base+'/api/decks/share',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({deck})});
  const deck=structuredClone(global.ARTIFACT_DECKS[0]);deck.name='朋友的构筑';deck.heroes.reverse();deck.token='must-not-leak';
  let response=await post(deck);assert.equal(response.status,201);const shared=await response.json();assert.match(shared.code,/^AFD-[A-HJ-NP-Z2-9]{8}$/);assert.deepEqual(shared.deck.heroes,deck.heroes);assert.deepEqual(shared.deck.main,deck.main);assert.deepEqual(shared.deck.items,deck.items);assert.equal(shared.deck.name,deck.name);assert(!JSON.stringify(shared).includes('must-not-leak'));
  assert.equal((await (await post(deck)).json()).code,shared.code);
  response=await fetch(base+'/api/decks/share/'+shared.code.toLowerCase());assert.equal(response.status,200);assert.deepEqual(await response.json(),shared);
  assert.equal((await fetch(base+'/api/decks/share/ABC123')).status,404);assert.equal((await fetch(base+'/api/decks/share/AFD-AAAAAAAA')).status,404);
  for(const invalid of [null,[],{}, {...deck,heroes:'invalid'}, {...deck,main:{}}, {...deck,items:[]},{...deck,heroes:[1,2,3,4,5]},{...deck,main:['__proto__',...deck.main.slice(1)]},{...deck,main:Array(201).fill(deck.main[0])},{...deck,heroes:Array(5).fill(deck.heroes[0])}])assert.equal((await post(invalid)).status,400);
  const renamed=await (await post({...deck,name:'\u0000<另一个构筑>\n'})).json();assert.equal(renamed.deck.name,'另一个构筑');assert.notEqual(renamed.code,shared.code);
  assert.equal((await post({...deck,name:'x'.repeat(140000)})).status,413);
  await new Promise(resolve=>server.close(resolve));server=null;store.close();store=new Store(filename);
  assert.deepEqual(store.sharedDeck(shared.code),shared.deck);assert.deepEqual(store.sharedDeck(renamed.code),renamed.deck);assert.equal(store.shareDeck(shared.deck),shared.code);assert.equal(store.db.prepare('SELECT count(*) AS n FROM shared_decks').get().n,2);
  console.log('PASS share/import HTTP, complete ordered decks, duplicate reuse, immutable persistence after reopening, malformed input, size limit and no identity leakage');
 }finally{if(server)await new Promise(resolve=>server.close(resolve));store.close();fs.rmSync(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
