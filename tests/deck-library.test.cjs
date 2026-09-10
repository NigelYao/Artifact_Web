'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=new Map([['artifact.customDeck','original'],['artifact.online.identity','identity']]);
const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
function load(){const ctx={window:{},localStorage:storage,crypto:require('node:crypto').webcrypto};vm.runInNewContext(fs.readFileSync('dist/deck-share.js','utf8'),ctx);return ctx.window.ArtifactDeckShare;}
let library=load();const deck={name:'对手构筑',heroes:['a','b','c','d','e'],main:['x','x','y'],items:['i','j']};
const saved=library.saveDeck(deck);assert.match(saved.id,/^saved-/);deck.main.reverse();
library=load();assert.deepEqual(Array.from(library.savedDecks()[0].main),['x','x','y']);
assert.equal(library.saveDeck({...saved,name:'改名'}).id,saved.id);assert.equal(library.savedDecks().length,1);
library.saveDeck(deck);assert.equal(library.savedDecks().length,2);assert.equal(data.get('artifact.customDeck'),'original');assert.equal(data.get('artifact.online.identity'),'identity');
storage.setItem=()=>{throw Error('quota');};assert.throws(()=>library.saveDeck({...deck,main:['new']}),/quota/);
console.log('PASS opponent deck collection persists ordered snapshots, deduplicates, preserves custom deck and propagates storage failure');
