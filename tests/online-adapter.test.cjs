const assert=require('node:assert/strict'),fs=require('node:fs');
const {Game}=require('../dist/engine.js');require('../dist/effects.js');require('../dist/decks.js');require('../dist/feedback.js');
const {project}=require('../dist/online-bridge.js'),cards=require('../dist/cards.json');
const g=new Game(cards);g.newGame(global.ARTIFACT_DECKS[0],global.ARTIFACT_DECKS[1],91021);
g.s.events=[{type:'card',owner:1,text:'夜魇打出技能，目标天辉',targets:[{owner:0,uid:17}],outcomes:[{owner:1,uid:19}],source:{owner:1}}];
const before=JSON.stringify(g.s),a=project(g.s,1),view=new Game(cards);view.s=a;
assert.equal(a.players[0].name,g.s.players[1].name);assert.equal(a.turn,1-g.s.turn);
assert.deepEqual(a.lanes[0].towers[0],g.s.lanes[0].towers[1]);
assert.equal(a.events[0].owner,0);assert.equal(a.events[0].targets[0].owner,1);assert.equal(a.events[0].source.owner,0);
for(const u of g.all()){assert.deepEqual(view.stats(view.get(u.uid)),g.stats(u));assert.equal(view.target(view.get(u.uid))?.uid,g.target(u)?.uid);}
for(let l=0;l<3;l++){const one=g.combatForecast(l),two=view.combatForecast(l);assert.deepEqual(two.tower,[...one.tower].reverse());assert.deepEqual(two.units,one.units);}
assert.deepEqual(project(a,1),g.s);assert.equal(JSON.stringify(g.s),before);
console.log('PASS seat projection: identities, owner metadata, towers, stats, forecasts, reversibility, no source mutation');
const app=fs.readFileSync('dist/app.js','utf8');assert(app.includes("if(bridge||online)return"));assert(app.includes("if(online&&k==='artifact.match')return"));
for(const path of ['index.html','campaign-battle.html']){const html=fs.readFileSync('dist/'+path,'utf8');assert(!html.includes('online-bridge.js'));assert(!html.includes('online-client.js'));}
assert(!fs.readFileSync('dist/online-battle.html','utf8').includes('campaign-bridge.js'));
console.log('PASS online save writes and AI isolated; offline pages do not load online runtime');
const vm=require('node:vm');
(async()=>{
 const initial={code:'ABC123',revision:9,seat:0,state:JSON.parse(before),players:[{connected:true},{connected:false}],shopReady:[false,false],deployReady:[false,false]};
 const latest=structuredClone(initial);latest.players[1].connected=true;
 let listener,applied=0,statusUpdates=0;
 const fakeApp={ui:{busy:false},receiveOnline(){applied++;},onlineStatus(){statusUpdates++;},onlineError(){}};
 const context={ArtifactEngine:{Game},ARTIFACT_CARDS:cards,URLSearchParams,location:{search:'?code=ABC123'},setTimeout,console};context.window=context;
 context.ArtifactOnline={connect:async()=>initial,getSnapshot:()=>latest,getStatus:()=> 'connected',lastCode:()=> 'ABC123',subscribe:fn=>listener=fn,onStatus(){},onError(){}};
 context.document={createElement:()=>({}),body:{appendChild(script){if(script.src.startsWith('app.js'))context.ArtifactOnlineBridge.mount(fakeApp);script.onload();}}};
 vm.runInNewContext(fs.readFileSync('dist/online-bridge.js','utf8'),context);await new Promise(resolve=>setImmediate(resolve));
 assert(context.ArtifactOnlineBridge.status().includes('双方已连接'));
 listener({...latest,players:[{connected:true},{connected:false}]});assert.equal(applied,0);assert.equal(statusUpdates,1);assert(context.ArtifactOnlineBridge.status().includes('对方暂时离线'));
 console.log('PASS same-revision presence during dynamic app loading is retained; presence never reapplies combat state');
})().catch(e=>{console.error(e);process.exitCode=1;});
