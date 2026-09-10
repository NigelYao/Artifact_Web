const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const timers=new Map();let tid=0;
class Param{constructor(){this.value=0;}setValueAtTime(v){this.value=v;}linearRampToValueAtTime(v){this.value=v;}setTargetAtTime(v){this.value=v;}cancelScheduledValues(){}}
class Node{constructor(){this.gain=new Param();}connect(){}disconnect(){this.disconnected=true;}}
class Audio{constructor(src){this.src=src;this.dataset={};this.listeners={};this.paused=true;this.ended=false;}addEventListener(k,fn){this.listeners[k]=fn;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}remove(){this.removed=true;}}
const root={performance,fetch:async()=>({ok:false,status:404}),Audio,document:{body:{appendChild(){}}},console,setTimeout(fn){timers.set(++tid,fn);return tid;},clearTimeout(id){timers.delete(id);}};root.window=root;
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/audio.js'),'utf8'),root);
const a=new root.ArtifactAudio();a.ctx={currentTime:10,createGain:()=>new Node(),createMediaElementSource:()=>new Node(),suspend(){},resume(){}};a.musicBus=new Node();a.fxBus=new Node();
a.setScene('battle');assert(a.currentSlot.audio.src.endsWith('two-towers.mp3'));const first=a.currentSlot;a.setScene('battle');assert.equal(a.currentSlot,first);console.log('PASS repeated renders do not restart music');
for(const track of ['red-mist','fires-of-rebellion','aghanims-obsession','two-towers']){a.currentSlot.audio.listeners.ended();assert(a.currentSlot.audio.src.endsWith(track+'.mp3'));}console.log('PASS all four battle tracks rotate and loop');
for(const [scene,track] of [['menu','immortal-dreams'],['intro','opening'],['shop','caravan'],['victory','victory'],['defeat','defeat']]){a.setScene(scene);assert(a.currentSlot.audio.src.endsWith(track+'.mp3'));if(['intro','victory','defeat'].includes(scene)){const old=a.currentSlot;a.currentSlot.audio.listeners.ended();assert.equal(a.currentSlot,old);}}console.log('PASS stage mapping and one-shot intro/victory/defeat');
for(const fn of [...timers.values()])fn();assert.equal(a.slots.length,1);assert(first.audio.paused&&first.audio.removed&&first.source.disconnected);console.log('PASS crossfade releases old media and audio nodes');
a.enabled=false;a.setVolumes();assert.equal(a.musicBus.gain.value,0);assert.equal(a.fxBus.gain.value,0);a.enabled=true;a.music=.5;a.effects=.7;a.duck();assert.equal(a.musicBus.gain.value,.19);assert.equal(a.fxBus.gain.value,.7);a.ctx.currentTime=12;a.setVolumes();assert.equal(a.musicBus.gain.value,.5);console.log('PASS mute and temporary music duck preserve effect volume');
a.visibility(true);assert(a.currentSlot.audio.paused);a.visibility(false);assert(!a.currentSlot.audio.paused);console.log('PASS hidden tab pauses media and returns without restarting');
a.currentSlot.audio.listeners.error();assert(a.fallback);console.log('PASS missing media enables procedural fallback');

a.enabled=true;a.music=.4;a.duckUntil=0;a.previewing=true;a.setVolumes();assert(Math.abs(a.musicBus.gain.value-.04)<1e-9);a.previewing=false;a.setVolumes();assert(Math.abs(a.musicBus.gain.value-.4)<1e-9);console.log('PASS audition ducks background music and restores its configured volume');
