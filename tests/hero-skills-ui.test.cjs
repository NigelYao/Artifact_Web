'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},console};vm.createContext(ctx);for(const file of ['data.js','engine.js','effects.js','hero-skills.js','decks.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),ctx);
ctx.window.ArtifactHeroSkills=ctx.ArtifactHeroSkills;
vm.runInContext(`const C=Object.fromEntries(window.ARTIFACT_CARDS.map(c=>[c.key,c])),game=new window.ArtifactEngine.Game(window.ARTIFACT_CARDS),ui={busy:false};game.newGame(window.ARTIFACT_DECKS[0],window.ARTIFACT_DECKS[1],42);const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;'),T=(z,e)=>z,L=v=>v,pick=(o,b)=>o?.[b]??'',cardName=c=>pick(c,'name'),cardText=c=>pick(c,'text'),ABNAME=a=>pick(a,'name'),ABDESC=a=>pick(a,'description');`,ctx);
const app=fs.readFileSync('dist/app.js','utf8');vm.runInContext(app.slice(app.indexOf('function heroSkills('),app.indexOf('function heroSkillDetails(')),ctx);
function run(code){return vm.runInContext(code,ctx);}
run(`game.s.turn=0;game.s.phase='action';game.s.lane=0;var luna=game.spawn('luna',0,0,8),sniper=game.spawn('sniper',0,0,9);`);
assert.match(run('heroSkillHTML(luna)'),/passive/);assert.match(run('heroSkillHTML(luna)'),/月光/);assert.match(run('heroSkillHTML(luna)'),/查看说明/);
run('sniper.cooldowns={}');assert.match(run('heroSkillHTML(sniper)'),/active ready/);
run('sniper.cooldowns={sniper:2}');assert.match(run('heroSkillHTML(sniper)'),/<b>2<\/b>/);assert.match(run('heroSkillHTML(sniper)'),/unavailable/);
run('sniper.cooldowns={};game.buff(sniper,{silence:1})');assert.match(run('heroSkillHTML(sniper)'),/unavailable/);
for(const c of run('window.ARTIFACT_CARDS.filter(c=>c.type==="Hero")')){const metadata=ctx.window.ArtifactHeroSkills.get(c.key);assert.ok(metadata,c.key);if(metadata.type!=='none')assert.ok(fs.existsSync('dist/'+metadata.icon),metadata.icon);}
assert.ok(app.includes("case 'hero-skill':case 'unit-ability':"));assert.ok(app.includes("ui.inspectSkill=true;render();break;"));
console.log('PASS native hero skills: passive description, ready/cooldown/silenced states, all icon files, explicit activation');
// Exercise lightweight passive feedback without advancing game state.
const created=[],animated=[];
const unit={closest:()=>null,querySelector:()=>({animate:(...a)=>animated.push(a)}),getBoundingClientRect:()=>({left:10,top:30,width:40,height:60})};
ctx.document={querySelector:()=>unit,createElement:()=>({style:{},remove(){}})};ctx.setTimeout=()=>0;ctx.$=()=>({textContent:''});
vm.runInContext(app.slice(app.indexOf('function playPassiveEvents('),app.indexOf('function playEvents(')),ctx);
ctx.layer={appendChild:x=>created.push(x)};run("playPassiveEvents([{type:'passive',unit:luna.uid,card:'luna',skill:'月光',target:sniper.uid}],layer)");
assert.equal(animated.length,1);assert.equal(created.length,2);assert.match(created[0].textContent,/月光 · 自动触发 →/);assert.match(created[1].className,/moonlight/);
console.log('PASS passive skill source pulse, readable trigger and distinct lunar target effect');
