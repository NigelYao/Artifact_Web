/* Local soundtrack playback with procedural skill effects. Starts after a user gesture. */
(function(root){'use strict';
const SAMPLES={"draw": "draw.wav", "card": "card.wav", "summon": "summon.wav", "swing": "swing.wav", "damage": "damage.wav", "combat": "combat.wav", "death": "death.wav", "pass": "pass.wav", "select": "select.wav", "error": "error.wav", "buy": "buy.wav", "hold": "hold.wav", "shop-open": "shop-open.wav", "shop-close": "shop-close.wav", "lane": "lane.wav", "round": "round.wav", "equip": "equip.wav", "buff": "buff.wav", "heal": "heal.wav", "frostbite": "frostbite.wav", "gust": "gust.wav", "duel": "duel.wav", "berserkers_call": "berserkers_call.wav", "axe-voice": "axe-voice.mp3"};
const ACTION_AUDIO=root.ARTIFACT_ACTION_AUDIO||{cards:{},abilities:{},samples:{}};Object.assign(SAMPLES,ACTION_AUDIO.samples);
class Soundscape{
 constructor(){this.ctx=null;this.music=.28;this.effects=.6;this.enabled=true;this.step=0;this.timer=null;this.scene='menu';this.trackIndex=0;this.trackKey=null;this.slots=[];this.fallback=false;this.duckUntil=0;this.samples=new Map();this.sampleTimes=new Map();this.voiceUntil=0;}
 setScene(scene){if(scene!==this.scene){if(scene==='shop')this.play('shop-open');else if(this.scene==='shop')this.play('shop-close');}this.scene=scene;if(this.ctx)this.updateTrack();}
 updateTrack(force=false){
  const lists={menu:['immortal-dreams'],intro:['opening'],battle:['two-towers','red-mist','fires-of-rebellion','aghanims-obsession'],shop:['caravan'],victory:['victory'],defeat:['defeat'],draw:['immortal-dreams']};
  const list=lists[this.scene]||lists.menu,key=list[this.trackIndex%list.length];if(!force&&this.trackKey===key)return;
  this.trackKey=key;this.fallback=false;const t=this.ctx.currentTime;
  for(const slot of this.slots){slot.gain.gain.cancelScheduledValues(t);slot.gain.gain.setValueAtTime(slot.gain.gain.value,t);slot.gain.gain.linearRampToValueAtTime(0,t+.9);clearTimeout(slot.cleanup);slot.cleanup=setTimeout(()=>{slot.audio.pause();slot.audio.remove();slot.source.disconnect();slot.gain.disconnect();this.slots=this.slots.filter(s=>s!==slot);},1000);}
  const audio=new Audio('assets/music/'+key+'.mp3');audio.preload='auto';audio.hidden=true;audio.dataset.soundtrack=key;document.body.appendChild(audio);const source=this.ctx.createMediaElementSource(audio),gain=this.ctx.createGain();gain.gain.value=0;source.connect(gain);gain.connect(this.musicBus);const slot={audio,source,gain};this.slots.push(slot);this.currentSlot=slot;
  audio.addEventListener('ended',()=>{if(this.currentSlot!==slot||['victory','defeat','intro'].includes(this.scene))return;this.trackIndex++;this.updateTrack(true);});
  audio.addEventListener('error',()=>{if(this.currentSlot===slot){this.fallback=true;console.warn('Soundtrack unavailable:',key);}});
  audio.play().then(()=>{if(this.currentSlot===slot){gain.gain.setValueAtTime(0,this.ctx.currentTime);gain.gain.linearRampToValueAtTime(1,this.ctx.currentTime+1.2);}}).catch(()=>{if(this.currentSlot===slot)this.fallback=true;});
 }
 duck(){if(!this.ctx)return;this.duckUntil=this.ctx.currentTime+1.15;this.setVolumes();clearTimeout(this.duckTimer);this.duckTimer=setTimeout(()=>this.setVolumes(),1200);}
 visibility(hidden){for(const s of this.slots){if(hidden)s.audio.pause();else if(s===this.currentSlot&&!s.audio.ended)s.audio.play().catch(()=>{});}if(hidden)this.ctx?.suspend();else this.ctx?.resume();}
 hasAction(key,type='card'){return !!(type==='ability'?ACTION_AUDIO.abilities:ACTION_AUDIO.cards)[key]?.effect;}
 prepareAction(key,type='card'){
  if(!this.ctx||!this.enabled)return;const action=(type==='ability'?ACTION_AUDIO.abilities:ACTION_AUDIO.cards)[key];
  for(const name of [action?.effect,action?.voice])if(name)this.loadSample(name);
 }
 spell(kind,color='Blue',key='',type='card'){
  const action=(type==='ability'?ACTION_AUDIO.abilities:ACTION_AUDIO.cards)[key];
  if(action?.voice)this.play(action.voice);
  if(action?.effect){this.duck();this.play(action.effect);return;}
  if(type!=='ability'&&SAMPLES[key]){this.play(key);return;}
  if(SAMPLES[kind]){this.play(kind);return;}
  if(!this.ctx||!this.enabled)return;this.duck();const t=this.ctx.currentTime+.01;
  if(kind==='heal'){this.play('heal');return;}
  if(kind==='buff'||kind==='equip'){[330,495,660,990].forEach((f,i)=>this.tone(f,t+i*.07,.55,.10,'sine'));this.noise(t,.18,.09,4500);return;}
  if(kind==='control'){this.tone(640,t,.65,.15,'triangle',this.fxBus,65);this.noise(t,.55,.12,1400);return;}
  if(kind==='summon'){this.play('summon');return;}
  if(color==='Red'){this.noise(t,.42,.32,1600);this.tone(180,t,.48,.25,'sawtooth',this.fxBus,35);}
  else if(color==='Black'){this.tone(800,t,.45,.13,'triangle',this.fxBus,80);this.noise(t+.09,.24,.21,4200);}
  else if(color==='Green'){[220,330,440].forEach((f,i)=>this.tone(f,t+i*.06,.4,.12,'triangle'));this.noise(t,.3,.15,1100);}
  else{this.noise(t,.12,.3,6500);[940,470,180].forEach((f,i)=>this.tone(f,t+i*.07,.26,.12,'triangle',this.fxBus,f/2));}
 }
 async start(){if(!this.ctx){const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.72;this.master.connect(this.ctx.destination);this.musicBus=this.ctx.createGain();this.fxBus=this.ctx.createGain();this.musicBus.connect(this.master);this.fxBus.connect(this.master);this.reverb=this.ctx.createConvolver();let b=this.ctx.createBuffer(2,this.ctx.sampleRate*2.5,this.ctx.sampleRate);for(let c=0;c<2;c++){let d=b.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);}this.reverb.buffer=b;this.wet=this.ctx.createGain();this.wet.gain.value=.25;this.reverb.connect(this.wet);this.wet.connect(this.master);this.fxBus.connect(this.reverb);this.setVolumes();}
 await this.ctx.resume();this.updateTrack(this.fallback);if(!this.timer){this.timer=setInterval(()=>this.tick(),520);}}
 setVolumes(){if(!this.ctx)return;this.musicBus.gain.setTargetAtTime(this.enabled?this.music*(this.previewing?.1:1)*(this.ctx.currentTime<this.duckUntil?.38:1):0,this.ctx.currentTime,.08);this.fxBus.gain.setTargetAtTime(this.enabled?this.effects:0,this.ctx.currentTime,.03);}
 tone(f,t,d,g,type='sine',bus=this.fxBus,end=null){if(!this.ctx||!bus)return;const o=this.ctx.createOscillator(),a=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+d);a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(Math.max(.0002,g),t+Math.min(.08,d*.2));a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(bus);o.start(t);o.stop(t+d+.03);}
 noise(t,d,g,cut=2000){if(!this.ctx)return;const b=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*d),this.ctx.sampleRate),v=b.getChannelData(0);for(let i=0;i<v.length;i++)v[i]=(Math.random()*2-1)*Math.pow(1-i/v.length,2);const n=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),a=this.ctx.createGain();n.buffer=b;f.type='lowpass';f.frequency.value=cut;a.gain.value=g;n.connect(f);f.connect(a);a.connect(this.fxBus);n.start(t);}
 tick(){if(!this.fallback||!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime+.02,s=this.step++,chords=[[38,45,50,53],[34,41,46,50],[41,48,53,57],[36,43,48,52]],ch=chords[Math.floor(s/16)%4],hz=n=>440*Math.pow(2,(n-69)/12);
 if(s%8===0)for(const [i,n] of ch.entries()){this.tone(hz(n),t+i*.035,5,.15,'sine',this.musicBus);this.tone(hz(n+.07),t+i*.04,4.6,.025,'triangle',this.musicBus);}
 const melody=[12,19,15,12,7,12,10,7,12,15,19,22,19,15,14,10];if(s%2===0)this.tone(hz(ch[0]+melody[Math.floor(s/2)%16]+12),t,1.5,this.scene==='shop'?.12:.075,'sine',this.musicBus);
 if(this.scene==='battle'&&s%4===0)this.tone(70,t,.36,.23,'sine',this.musicBus,30);
 }
 loadSample(name){
  if(!this.samples.has(name))this.samples.set(name,fetch('assets/sfx/'+SAMPLES[name]).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}).then(b=>this.ctx.decodeAudioData(b)).catch(()=>null));
  return this.samples.get(name);
 }
 sample(name){
  if(!SAMPLES[name]||!this.ctx||!this.enabled)return false;
  const now=performance.now();if(now-(this.sampleTimes.get(name)||-1000)<100)return true;this.sampleTimes.set(name,now);
  const voice=name.startsWith('voice-')||name==='axe-voice';if(voice&&now<this.voiceUntil)return true;
  this.loadSample(name).then(buffer=>{if(!buffer||!this.enabled||this.ctx.state!=='running'||performance.now()-now>900)return;if(voice&&performance.now()<this.voiceUntil)return;const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;gain.gain.value=voice?.48:.65;if(voice)this.voiceUntil=performance.now()+buffer.duration*1000;source.connect(gain);gain.connect(this.fxBus);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();});return true;
 }
 play(name){if(!this.ctx||!this.enabled)return;if(this.sample(name))return;const t=this.ctx.currentTime+.008;
 if(name==='swing'){this.noise(t,.3,.14,3600);this.tone(300,t,.3,.09,'triangle',this.fxBus,90);}
 else if(name==='hover')this.tone(520,t,.06,.035);
 else if(name==='select'){this.tone(390,t,.12,.10,'sine');this.tone(780,t+.04,.15,.055);}
 else if(name==='card'||name==='summon'){this.noise(t,.19,.19,1700);this.tone(150,t,.23,.22,'triangle',this.fxBus,70);this.tone(630,t+.07,.25,.10);}
 else if(name==='damage'||name==='combat'){this.noise(t,.32,.48,900);this.tone(90,t,.4,.36,'sine',this.fxBus,28);if(name==='combat'){this.noise(t+.14,.3,.25,2200);this.tone(180,t+.12,.35,.18,'triangle',this.fxBus,42);}}
 else if(name==='ability'){for(let i=0;i<5;i++)this.tone(260*Math.pow(1.26,i),t+i*.065,.32,.08,'triangle');this.noise(t,.4,.1,5000);}
 else if(name==='heal'){[523,659,784].forEach((f,i)=>this.tone(f,t+i*.08,.5,.10));}
 else if(name==='buy'){[980,1470,1960].forEach((f,i)=>this.tone(f,t+i*.065,.32,.12,'sine'));}
 else if(name==='pass'){this.noise(t,.11,.08,2200);this.tone(230,t,.17,.10,'triangle');}
 else if(name==='round'||name==='lane'){[196,294,392].forEach((f,i)=>this.tone(f,t+i*.17,.9,.15,'triangle'));}
 else if(name==='victory'){[196,247,294,392,494,587].forEach((f,i)=>this.tone(f,t+i*.2,1.6,.17,'triangle'));}
 else if(name==='destroy'||name==='death'){this.noise(t,.7,.48,700);this.tone(110,t,.8,.24,'sawtooth',this.fxBus,24);}
 else if(name==='error')this.tone(100,t,.16,.12,'triangle');
 }
}
root.ArtifactAudio=Soundscape;
})(window);
