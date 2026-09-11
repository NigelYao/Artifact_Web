/* Capture presentation metadata around successful actions, including AI actions.
   No rule mutation: snapshots survive death, movement, control and equipment changes. */
(function(){'use strict';
const G=ArtifactEngine.Game.prototype,lanes=['上路','中路','下路'];
const flags={flipped:'恐惧翻牌',shadowRealm:'暗影之境',shield:'伤害护盾',stun:'眩晕',silence:'沉默',disarm:'缴械',immune:'伤害免疫',root:'缠绕',deathShield:'死亡护盾'};
function snapshot(game,u){const s=game.stats(u);return {uid:u.uid,k:u.k,name:game.card(u.k).name,owner:u.owner,lane:u.lane,alive:u.alive,attack:s.attack,armor:s.armor,health:s.health,regen:s.regen,cleave:s.cleave,retaliate:s.retaliate,siege:s.siege,hp:s.hp,mods:JSON.stringify(u.mods),items:JSON.stringify(u.items),flags:Object.fromEntries(Object.keys(flags).map(k=>[k,game.flag(u,k)]))};}
for(const method of ['play','activate']){const original=G[method];G[method]=function(p,id,...args){
 const k=method==='play'?this.s.players[p].hand.find(h=>h.uid===Number(id))?.k:args[0],raw=method==='play'?(args[0]||[]):(args[1]||[]);
 const before=new Map(this.s.units.map(u=>[u.uid,snapshot(this,u)]));
 const spec=k?this.targets(k,p,method==='activate'?this.get(id):null):[];
 const targets=raw.map((v,i)=>{const kind=spec[i]?.kind;if(kind==='lane')return {kind,lane:v,name:lanes[v]};if(kind==='position')return {kind,lane:v.lane,name:lanes[v.lane]+'召唤位'};const unit=before.get(v);if(unit)return {kind:'unit',...unit};return {kind:'improvement',uid:v,name:'战线强化'};});
 const result=original.call(this,p,id,...args),cast=this.s.events.find(e=>e.type===(method==='play'?'card':'ability'));
 if(!cast)return result;
 cast.owner=p;cast.targets=targets;cast.source=method==='activate'?before.get(id):null;
 cast.label=method==='activate'?(this.card(k).abilities?.[0]?.name||this.card(k).name):this.card(k).name;
 cast.outcomes=[];
 for(const u of this.s.units){const old=before.get(u.uid),now=snapshot(this,u),changes=[];
  if(!old||!old.alive&&u.alive)changes.push('进入战场');
  if(old?.alive){
   if(!u.alive)changes.push(this.s.events.some(e=>e.type==='return'&&e.unit===u.uid)?'返回泉水':'阵亡');
   if(u.alive&&old.lane!==u.lane)changes.push('转移至'+lanes[u.lane]);
   if(old.owner!==u.owner)changes.push('转为'+(u.owner?'夜魇':'天辉'));
   if(u.alive)for(const [key,name] of [['attack','攻击'],['armor','护甲'],['health','生命上限'],['regen','恢复'],['cleave','溅射'],['retaliate','反伤'],['siege','攻城']]){const d=now[key]-old[key];if(d)changes.push(name+(d>0?'+':'')+d);}
   for(const [key,name] of Object.entries(flags))if(!old.flags[key]&&now.flags[key])changes.push(name);else if(old.flags[key]&&!now.flags[key])changes.push('解除'+name);
   if(old.items!==now.items)changes.push('装备更新');
   if(!changes.length&&old.mods!==now.mods)changes.push('状态更新');
  }
  for(const type of ['damage','heal']){const amount=this.s.events.filter(e=>e.type===type&&e.unit===u.uid).reduce((n,e)=>n+e.amount,0);if(amount)changes.unshift((type==='heal'?'回复 +':'伤害 −')+amount);}
  if(changes.length)cast.outcomes.push({...now,lane:old?.alive?old.lane:now.lane,changes});
 }
 for(const e of this.s.events.filter(e=>e.type==='tower'))cast.outcomes.push({kind:'tower',owner:e.owner,lane:e.lane,name:(e.owner?'夜魇':'天辉')+lanes[e.lane]+'建筑',changes:['伤害 −'+e.amount]});
 const names=targets.map(t=>(t.owner===undefined?'':t.owner?'夜魇·':'天辉·')+t.name);
 cast.text+=(names.length?' → '+names.join('、'):'');
 if(cast.outcomes.length)cast.text+='；'+cast.outcomes.map(o=>o.name+'：'+o.changes.join(' / ')).join('；');
 return result;
};}
})();
