/* Explicit card effects and heuristic offline opponent. No network dependency. */
(function(root){
'use strict';
const {Game,clone}=root.ArtifactEngine;
const I18N=(typeof ArtifactI18n!=='undefined'&&ArtifactI18n)||(typeof require==='function'?(function(){try{return require('./i18n.js')}catch(e){return null}})():null);
const T=I18N?I18N.T:(z,e)=>z;
const NM=c=>T(c.name,c.en||''),EN=c=>c.en||c.name;
const G=Game.prototype;
const previousTargets=G.targets;
G.targets=function(k,p,source=null){
 if(!source){if(k==='pangolier_lucky_shot')return [{kind:'unit',side:'enemy'}];if(k==='dark_willow_bramble_maze')return [];if(k==='monkey_king_command')return [];if(k==='pangolier_gyroshell')return [{kind:'position',cross:false,free:true}];if(k==='dark_willow_terrorize')return [{kind:'position',cross:false,free:true,occupied:true}];}
 if(source){if(['tinker','cheating_death','monkey_king'].includes(k))return [{kind:'unit',side:'any'}];if(k==='monkey_king_spring')return [{kind:'position',cross:false,free:true}];if(k==='winter_wyvern')return [{kind:'position',cross:false}];}
 if(!source){if(k==='shop_deed')return [];if(k==='gust')return [{kind:'unit',side:'enemy',hero:true}];if(['arm_the_rebellion','routed'].includes(k))return [];if(k==='astral_imprisonment')return [{kind:'unit',side:'any'}];}
 return previousTargets.call(this,k,p,source);
};
G.removeImp=function(id){for(let l=0;l<3;l++)for(let p=0;p<2;p++){const a=this.imps(p,l),i=a.findIndex(v=>v.uid===id);if(i>=0){const [c]=a.splice(i,1);this.emit('destroy',T(this.card(c.k).name+'被摧毁',EN(this.card(c.k))+' is destroyed'));return;}}};
G.chooseCombat=function(a,b){if(!a||!b||a.owner===b.owner||a.lane!==b.lane)throw Error(T('战斗目标须为同路敌方单位','Combat target must be an enemy in the same lane'));a.target=b.uid;a.arrow=b.pos-a.pos;};
G.takeControl=function(u,p){const l=u.lane;u.owner=p;const occupied=this.all(p,l).filter(v=>v!==u);if(occupied.some(v=>v.pos===u.pos)){let pos=0;while(occupied.some(v=>v.pos===pos))pos++;u.pos=pos;}u.target=null;u.arrow=0;this.emit('control',T(this.card(u.k).name+'改变阵营',EN(this.card(u.k))+' changes allegiance'),{unit:u.uid});};
// Persisted, seeded path: damage and displacement use exactly the curve displayed by the client.
G.rollThunder=function(u,destination){
 if(!this.canMove(u))throw Error(T('缠绕或翻牌期间无法滚动','Cannot roll while rooted or flipped'));
 const p=u.owner,l=u.lane,start=u.pos,end=destination.pos,max=Math.max(end,...this.all(null,l).map(v=>v.pos));
 const points=[{x:start,y:0},{x:this.random()*(max+.5),y:1},{x:this.random()*(max+.5),y:0},{x:this.random()*(max+.5),y:1},{x:end,y:0}],path=[];
 for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];for(let n=0;n<24;n++){const t=n/24,t2=t*t,t3=t2*t;const coordinate=k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3);path.push({pos:Math.max(0,Math.min(max,coordinate('x'))),row:Math.max(0,Math.min(1,coordinate('y')))});}}
 path.push({pos:end,row:0});
 const event=this.emit('rolling',T(this.card(u.k).name+' · 地雷滚滚',EN(this.card(u.k))+' · Rolling Thunder'),{unit:u.uid,owner:p,lane:l,start,end,columns:max+1,path,hits:[]}),counts=new Map(),touching=new Set();
 for(const [step,point] of path.entries())for(const v of this.all(null,l)){
  if(v===u||!this.selectable(v)||this.stats(v).hp<=0)continue;
  const close=Math.hypot(v.pos-point.pos,(v.owner===p?0:1)-point.row)<.52;
  if(!close){touching.delete(v.uid);continue;}if(touching.has(v.uid)||(counts.get(v.uid)||0)>=2)continue;touching.add(v.uid);
  const damage=this.damage(v,1,false,u.uid);if(!damage)continue;counts.set(v.uid,(counts.get(v.uid)||0)+1);
  const from=v.pos,options=[from-1,from+1].filter(pos=>pos>=0&&pos<=max&&!this.at(v.owner,l,pos)&&!(v.owner===p&&pos===end));
  if(options.length&&this.canMove(v)){v.pos=this.pick(options);this.resetArrow(v);this.emit('displace',T(this.card(v.k).name+'移动一格',EN(this.card(v.k))+' shifts one slot'),{unit:v.uid,fromPos:from,toPos:v.pos,lane:l});}
  event.hits.push({unit:v.uid,step,fromPos:from,toPos:v.pos,amount:damage});
 }
 this.move(u,l,end);
};
G.triggerJex=function(p,handId){
 const ready=(this.s.jex||[]).filter(j=>j.owner===p&&j.createdBy!==handId);
 this.s.jex=(this.s.jex||[]).filter(j=>!ready.includes(j));
 for(const j of ready){const target=this.at(1-p,j.lane,j.pos);this.emit('jex',T(j.enhanced?'杰克斯 · 恐吓':'杰克斯 · 作祟',j.enhanced?'Jex · Menace':'Jex · Hijinks'),{owner:p,lane:j.lane,pos:j.pos,enhanced:j.enhanced,target:target?.uid});if(!this.selectable(target))continue;this.damage(target,j.enhanced?3:2);this.buff(target,j.enhanced?{flipped:1}:{disarm:1},'round');}
};
G.resolve=function(k,p,t,h){
 const l=this.s.lane,pl=this.s.players[p],op=this.s.players[1-p],a=this.get(t[0]),b=this.get(t[1]);
 const allies=()=>this.all(p,l),enemies=()=>this.all(1-p,l),units=()=>this.all(null,l);
 const buff=(u,v,d='permanent')=>this.buff(u,v,d,k),hit=(u,n,pierce=false)=>this.damage(u,n,pierce),spawn=(name,n=1,lane=l)=>{for(let i=0;i<n;i++)this.spawn(name,p,lane);},other=()=>this.pick([0,1,2].filter(v=>v!==a.lane));
 switch(k){
 case 'pangolier_lucky_shot':hit(a,2);if(this.random()<.5)buff(a,{disarm:1},'round');break;
 case 'pangolier_gyroshell':{const u=this.named(p,'pangolier',l).find(v=>this.canMove(v));if(!u)throw Error(T('本路需要可行动且未被缠绕的石鳞剑士','Requires a ready, unrooted Pangolier in this lane'));this.rollThunder(u,t[0]);break;}
 case 'dark_willow_bramble_maze':{const max=Math.max(0,...units().map(u=>u.pos),...(this.s.jex||[]).filter(j=>j.lane===l).map(j=>j.pos));for(let pos=0;pos<=max;pos++)if(!this.at(p,l,pos)){const flower=this.spawn('dark_willow_bramble',p,l,pos);flower.expiresRound=this.s.round;}break;}
 case 'dark_willow_terrorize':{const pos=t[0].pos,flower=this.at(p,l,pos);(this.s.jex||=[]).push({uid:this.id(),owner:p,lane:l,pos,enhanced:flower?.k==='dark_willow_bramble',createdBy:h.uid});this.emit('jex-summon',T('杰克斯等待下一张技能牌','Jex awaits the next allied spell'),{owner:p,lane:l,pos,enhanced:flower?.k==='dark_willow_bramble'});break;}
 case 'monkey_king_command':{for(const pos of this.positionTargets(p,l,{free:true}))this.spawn('monkey_soldier',p,l,pos);break;}
 case 'and_one_for_me':{const i=this.pick(Object.values(a.items));if(!i)throw Error(T('目标英雄没有装备','Target hero has no equipment'));pl.hand.push({uid:this.id(),k:i.k,lock:0});break;}
 case 'act_of_defiance':buff(a,{silence:1},'round');break;
 case 'allseeing_ones_favor':buff(a,{auraRegen:2});break;
 case 'annihilation':units().forEach(u=>this.condemn(u));break;
 case 'aphotic_shield':this.purge(a);buff(a,{armor:2,retaliate:2},'round');break;
 case 'arcane_assault':this.towerDamage(1-p,l,2);this.draw(p,1);break;
 case 'arcane_censure':this.s.lanes[l].manaBase[1-p]--;this.s.lanes[l].mana[1-p]=Math.max(0,this.s.lanes[l].mana[1-p]-1);break;
 case 'arm_the_rebellion':allies().filter(u=>!u.hero).forEach(u=>buff(u,{attack:2,armor:1}));break;
 case 'assassinate':hit(a,10,true);break;
 case 'astral_imprisonment':buff(a,{stun:1,immune:1},'round');break;
 case 'at_any_cost':units().forEach(u=>hit(u,6));break;
 case 'avernus_blessing':buff(a,{attack:2});break;
 case 'ball_lightning':if(a.lane===t[1])throw Error(T('请选择另一条战线','Choose a different lane'));this.move(a,t[1]);break;
 case 'battlefield_control':this.chooseCombat(a,b);break;
 case 'bellow':this.move(a,other());break;
 case 'berserkers_call':for(const e of this.neighbors(a,true))if(a.alive)this.battle(a,e);break;
 case 'better_late_than_never':spawn('melee_creep',1,t[0]);break;
 case 'blood_rage':buff(a,{silence:1,attack:4},'round');break;
 case 'bolt_of_damocles':this.towerDamage(1-p,l,20);break;
 case 'buying_time':for(const v of this.shuffle(op.hand).slice(0,2))v.lock+=2;break;
 case 'call_the_reserves':spawn('melee_creep',2,t[0]);break;
 case 'caught_unprepared':buff(a,{stun:1,unprepared:1},'death');break;
 case 'chain_frost':{let u=a;for(let i=0;i<8&&u;i++){hit(u,3);const next=this.pick(this.neighbors(u));this.sweep();u=next?.alive?next:null;}break;}
 case 'cleansing_rite':this.purge(a);break;
 case 'clear_the_deck':allies().filter(u=>u.hero).forEach(u=>buff(u,{cleave:4},'round'));break;
 case 'collateral_damage':buff(a,{siege:3});break;
 case 'combat_training':buff(a,{attack:2});break;
 case 'compel':this.chooseCombat(a,b);this.draw(p,1);break;
 case 'coordinated_assault':buff(a,{coordinated:1});break;
 case 'corrosive_mist':units().forEach(u=>u.items={});break;
 case 'coup_de_grace':this.condemn(a);if(pl.hand.length){const i=Math.floor(this.random()*pl.hand.length);pl.discard.push(pl.hand.splice(i,1)[0].k);}break;
 case 'crippling_blow':buff(a,{attack:-2});break;
 case 'cunning_plan':if(Math.abs(a.pos-b.pos)!==1)throw Error(T('只能交换相邻友军','Can only swap adjacent allies'));this.swap(a,b);this.draw(p,1);break;
 case 'curse_of_atrophy':enemies().filter(u=>u.hero).forEach(u=>buff(u,{attack:-2}));break;
 case 'defend_the_weak':buff(a,{neighborArmor:2});break;
 case 'defensive_bloom':spawn('roseleaf_wall',2);break;
 case 'defensive_stance':buff(a,{armor:3},'round');break;
 case 'diabolic_revelation':this.draw(p,2);this.all(p).forEach(u=>hit(u,2));break;
 case 'dimensional_portal':spawn('melee_creep',3);break;
 case 'dirty_deeds':this.towerDamage(1-p,l,2*this.imps(1-p,l).length);break;
 case 'divided_we_stand':this.spawn('meepo',p,l,null,{copy:true});break;
 case 'divine_intervention':allies().forEach(u=>buff(u,{immune:1},'round'));break;
 case 'divine_purpose':buff(a,{immune:1});break;
 case 'double_edge':buff(a,{attack:8,armor:-8},'round');break;
 case 'duel':this.battle(a,b);break;
 case 'echo_slam':{const es=enemies();es.forEach(u=>hit(u,es.length));break;}
 case 'eclipse':for(let i=0;i<(h.charges||0);i++){const u=this.pick(enemies());if(!u)break;hit(u,3,true);this.sweep();}break;
 case 'empower':buff(a,{attack:3,cleave:3});break;
 case 'enough_magic':this.s.pendingCombat=true;break;
 case 'enrage':buff(a,{attack:4,armor:4},'round');break;
 case 'fight_through_the_pain':buff(a,{armor:2},'round');break;
 case 'fighting_instinct':buff(a,{attack:1,armor:1});break;
 case 'fog_of_war':enemies().forEach(u=>{if(this.random()<.5)buff(u,{disarm:1},'round');});break;
 case 'foresight':this.draw(p,2);break;
 case 'forward_charge':allies().forEach(u=>{buff(u,{siege:2},'round');u.target=null;u.arrow=0;});break;
 case 'friendly_fire':this.battle(a,b);break;
 case 'frostbite':hit(a,2);buff(a,{disarm:1},'round');break;
 case 'gank':this.battle(a,b);break;
 case 'gods_strength':buff(a,{attack:4});break;
 case 'grazing_shot':hit(a,2);break;
 case 'gust':this.neighbors(a,false,true).forEach(u=>buff(u,{silence:1},'round'));break;
 case 'hand_of_god':allies().forEach(u=>{this.heal(u,999);buff(u,{immune:1},'round');});break;
 case 'heartstopper_aura':buff(a,{heartstopper:1});break;
 case 'heroic_resolve':buff(a,{heroicResolve:1});break;
 case 'hip_fire':hit(a,4);break;
 case 'intimidation':this.move(a,other());break;
 case 'ion_shell':buff(a,{retaliate:3});break;
 case 'iron_branch_protection':buff(a,{armor:3},'combat');break;
 case 'juke':if(Math.abs(a.pos-b.pos)!==1)throw Error(T('请选择相邻友方单位','Choose adjacent allied units'));this.swap(a,b);break;
 case 'kraken_shell':buff(a,{armor:1});break;
 case 'lightning_strike':this.towerDamage(1-p,l,6);break;
 case 'lodestone_demolition':this.towerDamage(1-p,l,Math.max(0,enemies().reduce((n,u)=>n+this.stats(u).armor,0)));break;
 case 'lost_in_time':for(const v of this.shuffle(op.hand).slice(0,3))v.lock+=3;break;
 case 'mana_drain':this.s.lanes[l].mana[1-p]=Math.max(0,this.s.lanes[l].mana[1-p]-2);this.s.lanes[l].mana[p]+=2;break;
 case 'murder_plot':buff(a,{attack:8},'round');this.chooseCombat(a,b);break;
 case 'mystic_flare':{const ns=this.neighbors(a,false,true);const damage=Math.floor(12/ns.length),rem=12%ns.length;this.shuffle(ns).forEach((u,i)=>hit(u,damage+(i<rem?1:0)));break;}
 case 'new_orders':this.chooseCombat(a,b);break;
 case 'no_accident':hit(a,3);break;
 case 'payday':pl.gold*=2;break;
 case 'pick_off':hit(a,4);break;
 case 'pick_a_fight':buff(a,{taunt:1},'round');this.taunt(a);this.chooseCombat(a,b);break;
 case 'poised_to_strike':buff(a,{attack:4},'round');break;
 case 'prey_on_the_weak':spawn('hound_of_war',units().filter(u=>u.damage>0).length);break;
 case 'primal_roar':{const e=this.target(a);if(!e)throw Error(T('此英雄没有阻挡单位','That hero has no blocker'));for(const u of this.neighbors(e))this.move(u,this.pick([0,1,2].filter(v=>v!==l)));buff(e,{stun:1},'round');break;}
 case 'raze':this.imps(1-p,l).splice(0);break;
 case 'relentless_pursuit':{if(a.lane===l)throw Error(T('目标须在另一战线','Target must be in another lane'));const u=this.pick(allies().filter(u=>u.hero&&this.card(u.k).color==='Black'));if(!u)throw Error(T('本路没有黑色英雄','No black hero in this lane'));this.move(u,a.lane);hit(a,2);break;}
 case 'remote_detonation':enemies().filter(u=>!this.at(p,l,u.pos)).forEach(u=>hit(u,5));break;
 case 'rend_armor':buff(a,{armor:-this.stats(a).armor});break;
 case 'restoration_effort':this.healTower(p,l,8);break;
 case 'rising_anger':buff(a,{risingAnger:1});break;
 case 'rolling_storm':for(let j=0;j<3;j++)for(let q=0;q<2;q++)this.towerDamage(q,j,2);break;
 case 'routed':for(const u of this.s.units.filter(u=>u.owner!==p&&u.hero&&!u.alive)){buff(u,{attack:-Math.floor(this.stats(u).attack/2),towerMana:-1});}break;
 case 'rumusque_blessing':this.all(p,t[0]).forEach(u=>buff(u,{health:3}));break;
 case 'self_sabotage':for(const v of this.shuffle(op.hand).slice(0,2))v.sabotage=true;break;
 case 'slay':this.condemn(a);break;
 case 'smash_their_defenses':this.removeImp(t[0]);this.draw(p,1);break;
 case 'soul_of_spring':buff(a,{soulSpring:1});break;
 case 'sow_venom':spawn('plague_ward',2);break;
 case 'spot_weakness':this.neighbors(a,false,true).forEach(u=>buff(u,{pierce:true},'round'));this.draw(p,1);break;
 case 'spring_the_trap':spawn('centaur_hunter',2,t[0]);break;
 case 'stars_align':this.s.lanes[l].mana[p]+=3;break;
 case 'steal_strength':buff(a,{attack:-4},'round');buff(b,{attack:4},'round');break;
 case 'strafing_run':enemies().filter(u=>!u.hero).forEach(u=>hit(u,2));break;
 case 'sucker_punch':{const e=this.target(a);if(!e)throw Error(T('此英雄没有阻挡单位','That hero has no blocker'));hit(e,2);buff(e,{stun:1},'round');break;}
 case 'the_cover_of_night':if(a.lane===t[1])throw Error(T('请选择另一条战线','Choose a different lane'));this.move(a,t[1]);buff(a,{attack:4,siege:7},'combat');break;
 case 'thundergods_wrath':this.all(1-p).filter(u=>u.hero).forEach(u=>hit(u,4,true));break;
 case 'thunderstorm':enemies().forEach(u=>hit(u,4));break;
 case 'time_of_triumph':allies().filter(u=>u.hero).forEach(u=>buff(u,{attack:4,armor:4,health:4,cleave:4,retaliate:4,siege:4}));break;
 case 'tower_barrage':enemies().forEach(u=>hit(u,2));break;
 case 'track':buff(a,{bounty:10},'death');break;
 case 'tresdins_standards':buff(a,{standards:1});break;
 case 'ventriloquy':buff(a,{taunt:1},'round');this.taunt(a);break;
 case 'viper_strike':buff(a,{poison:1},'death');break;
 case 'viscous_nasal_goo':buff(a,{armor:-2});break;
 case 'whirling_death':this.neighbors(a,true).forEach(u=>{hit(u,2);buff(u,{attack:-2},'round');});break;
 case 'whispers_of_madness':buff(a,{stun:1},'round');this.all(p).filter(u=>u.hero).forEach(u=>buff(u,{stun:1},'round'));break;
 case 'winters_curse':buff(a,{disarm:1},'round');for(const u of this.neighbors(a))if(a.alive)this.battle(u,a);break;
 case 'wrath_of_gold':{const gold=pl.gold;pl.gold=0;for(let i=0;i<gold;i++){const u=this.pick(units());if(!u)break;hit(u,4);this.sweep();}break;}
 case 'fountain_flask':this.heal(a,999);break;
 case 'healing_salve':this.heal(a,6);break;
 case 'golden_ticket':{const c=this.pick(Object.values(this.cards).filter(c=>c.type==='Item'&&c.itemType!=='Consumable'));pl.hand.push({uid:this.id(),k:c.key,lock:0});break;}
 case 'obliterating_orb':this.removeImp(t[0]);break;
 case 'potion_of_knowledge':this.draw(p,1);break;
 case 'shop_deed':pl.freeShop=true;break;
 case 'town_portal_scroll':this.returnHero(a);break;
 default:throw Error(T('尚未实现的卡牌效果：','Card effect not implemented: ')+k);
 }
};
G.taunt=function(u){for(const e of this.neighbors(u,true)){e.target=u.uid;e.arrow=u.pos-e.pos;}};
G.abilities=function(u){const a=[];const c=this.card(u.k);for(const ab of c?.abilities||[])a.push({k:ab.key||u.k,...ab,remaining:u.cooldowns?.[ab.key||u.k]||u.cooldown||0});for(const it of Object.values(u.items||{})){const c=this.card(it.k);if(c.abilities?.length)a.push({k:it.k,...c.abilities[0],remaining:u.cooldowns?.[it.k]||0});}return a;};
// Read-only availability for both hero icons and equipment controls.
G.canActivate=function(p,uid,k){
 if(!this.s||this.s.phase!=='action'||this.s.turn!==p)return T('尚未轮到你行动','Not your turn to act');
 const l=this.s.lane,u=this.get(uid)||this.imps(p,l).find(i=>i.uid===Number(uid));
 if(!u)return T('找不到技能来源','Ability source not found');
 if(u.hero!==undefined&&(u.owner!==p||u.lane!==l||!this.enabled(u)))return T('该单位当前无法使用技能','This unit cannot use abilities right now');
 const a=this.abilities(u).find(a=>a.k===k);if(!a)return T('这是自动生效的被动技能','This passive ability triggers automatically');
 if(a.remaining>0)return T('冷却剩余 '+a.remaining+' 回合','Cooldown: '+a.remaining+' rounds remaining');
 if(['blink_dagger','winter_wyvern','meepo','phase_boots','monkey_king_spring'].includes(k)&&!this.canMove(u))return T('缠绕期间无法移动','Cannot move while rooted');
 if(k==='dark_willow'&&this.flag(u,'shadowRealm'))return T('已经处于暗影之境','Already in Shadow Realm');
 if(k==='monkey_king'&&(u.charges||0)<3)return T('棒击蓄势需要 3 点能量（当前 '+(u.charges||0)+' 点）','Primed Strike needs 3 energy (currently '+(u.charges||0)+')');
 if(['pugna','demagicking_maul'].includes(k)&&!this.imps(1-p,l).length)return T('敌方没有强化','The enemy has no improvements');
 if(k==='demagicking_maul'&&this.target(u))return T('英雄被阻挡，无法使用','Hero is blocked and cannot use it');
 if(k==='meepo'&&!this.all(p).some(v=>v.k==='meepo'&&v.lane!==l))return T('其他战线没有友方米波','No allied Meepo in another lane');
 if(!this.candidateTargets(k,p,u).some(t=>{try{this.validateTargets({key:k},p,t,u);return !(k==='dark_seer'&&t[1]===l)&&!(k==='blink_dagger'&&t[0]===l);}catch{return false;}}))return T('没有可选择的有效目标','No valid targets available');
 return '';
};
G.activate=function(p,uid,k,t=[]){const backup=clone(this.s);try{
 if(this.s.phase!=='action'||this.s.turn!==p)throw Error(T('尚未轮到你行动','Not your turn to act'));this.s.events=[];let u=this.get(uid),imp=false,l=this.s.lane;
 if(!u){u=this.imps(p,l).find(i=>i.uid===uid);imp=true;}if(!u)throw Error(T('找不到技能来源','Ability source not found'));
 if(!imp&&(u.owner!==p||u.lane!==l||!this.enabled(u)))throw Error(T('该单位当前无法使用技能','This unit cannot use abilities right now'));
 const ability=this.abilities(u).find(a=>a.k===k);if(!ability||ability.remaining>0)throw Error(T('技能尚在冷却','Ability is still on cooldown'));
 if(k==='dark_willow'&&this.flag(u,'shadowRealm'))throw Error(T('已经处于暗影之境','Already in Shadow Realm'));
 if(k==='monkey_king'&&(u.charges||0)<3)throw Error(T('棒击蓄势需要 3 点能量','Primed Strike needs 3 energy'));
 if(k==='monkey_king_spring'&&!this.canMove(u))throw Error(T('缠绕或翻牌期间无法移动','Cannot move while rooted or flipped'));
 this.validateTargets({key:k},p,t,u);const a=this.get(t[0]),b=this.get(t[1]),it=Object.values(u.items||{}).find(i=>i.k===k);
 this.emit('ability',NM(this.card(u.k))+' · '+T(ability.name,(root.ArtifactHeroSkills?.all?.[u.k]||[]).find(a=>a.name===ability.name)?.en||''),{unit:uid,card:this.card(k)?k:u.k,skill:k});
 switch(k){
 case 'pangolier':{let shield=0;for(const v of this.neighbors(u,true))if(this.damage(v,2,false,u.uid)>0)shield+=v.hero?2:1;if(shield)this.buff(u,{shield},'round');this.emit('shield-crash',T('甲盾冲击 · 护盾 '+shield,'Shield Crash · Shield '+shield),{unit:u.uid,owner:p,lane:l,shield});break;}
 case 'monkey_king':{u.charges-=3;this.damage(a,4,false,u.uid);this.s.players[p].monkeyBonus=(this.s.players[p].monkeyBonus||0)+1;this.emit('buff',T('此后召唤的猴子猴孙攻击永久 +1（当前 +'+this.s.players[p].monkeyBonus+'）','Monkey Soldiers summoned later gain +1 attack permanently (now +'+this.s.players[p].monkeyBonus+')'),{unit:u.uid});break;}
 case 'monkey_king_spring':{const from=u.pos;this.move(u,t[0].lane,t[0].pos);this.spawn('monkey_soldier',p,l,from);break;}
 case 'dark_willow':this.buff(u,{shadowRealm:1,shadowBonus:1},'death');break;
 case 'abaddon':this.heal(u,999);this.buff(u,{immune:1},'round');break;
 case 'beastmaster':this.spawn('loyal_beast',p,l);break;
 case 'chen':case 'helm_of_the_dominator':this.takeControl(a,p);break;
 case 'dark_seer':if(t[1]===l)throw Error(T('请选择另一条战线','Choose a different lane'));this.move(a,t[1]);break;
 case 'earthshaker':this.neighbors(u,true).forEach(v=>this.buff(v,{stun:1},'round'));break;
 case 'jmuy_the_wise':this.draw(p,1);break;
 case 'lich':{if(a.uid===u.uid)throw Error(T('不能献祭自己','Cannot condemn itself'));const n=this.stats(a).attack>=6?2:1;this.condemn(a);this.draw(p,n);break;}
 case 'lion':this.damage(a,8,true);u.quicken=(u.quicken||0)+1;break;
 case 'meepo':if(t[0]===l||!this.named(p,'meepo',t[0]).length)throw Error(T('另一条战线必须有友方米波','Another lane must have an allied Meepo'));this.move(u,t[0]);this.neighbors(u,true).forEach(v=>this.damage(v,2));break;
 case 'omniknight':this.heal(a,3);break;
 case 'pugna':case 'demagicking_maul':{if(k==='demagicking_maul'&&this.target(u))throw Error('英雄被阻挡，无法使用');const i=this.pick(this.imps(1-p,l));if(!i)throw Error(T('敌方没有强化','The enemy has no improvements'));this.removeImp(i.uid);break;}
 case 'skywrath_mage':this.neighbors(a,false,true).forEach(v=>this.buff(v,{armor:-2},'round'));break;
 case 'sniper':this.damage(a,5);break;
 case 'tidehunter':this.all(1-p,l).forEach(v=>{if(Math.abs(v.pos-u.pos)<=1||this.random()<.5)this.buff(v,{stun:1},'round');});break;
 case 'tinker':this.damage(a,3);this.buff(a,{disarm:1},'round');break;
 case 'winter_wyvern':if(t[0].lane!==l)throw Error(T('严寒烧灼只能改变本路位置','Cold Embrace can only move within this lane'));this.move(u,l,t[0].pos);this.buff(u,{attack:4},'round');break;
 case 'assassins_apprentice':case 'sister_of_the_veil':case 'assassins_veil':this.chooseCombat(u,a);break;
 case 'emissary_of_the_quorum':this.all(p,l).forEach(v=>this.buff(v,{attack:2,health:2}));break;
 case 'mercenary_exiles':{const n=Math.floor(this.s.players[p].gold/2);this.s.players[p].gold=0;this.buff(u,{attack:n,health:n});break;}
 case 'ravenhook':{const e=this.target(u);if(!e)throw Error(T('没有阻挡单位','No blocking unit'));const slots=Object.keys(e.items);if(!slots.length)throw Error(T('目标没有装备','Target has no equipment'));const slot=this.pick(slots),v=e.items[slot];delete e.items[slot];this.s.players[p].gold+=this.card(v.k).gold;break;}
 case 'ravenous_mass':for(const v of this.neighbors(u)){const s=this.stats(v);this.buff(u,{attack:s.attack,health:s.health});this.condemn(v);}break;
 case 'rebel_decoy':case 'phase_boots':if(a===u)throw Error(T('请选择另一个友军','Choose a different ally'));this.swap(u,a);break;
 case 'satyr_magician':case 'aghanims_sanctum':this.s.lanes[l].mana[p]=this.maxMana(p,l);break;
 case 'escape_route':this.returnHero(a);break;
 case 'messenger_rookery':this.chooseCombat(a,b);break;
 case 'cheating_death':if(!this.all(p,l).some(v=>v.hero&&this.card(v.k).color==='Green'&&this.enabled(v)))throw Error(T('本路需要绿色友方英雄','Requires an allied green hero in this lane'));this.buff(a,{deathShield:1},'round');break;
 case 'keenfolk_turret':this.damage(a,2,true);break;
 case 'steam_cannon':this.damage(a,4,true);break;
 case 'revtel_investments':this.s.players[p].gold+=4*u.charges;this.removeImp(u.uid);break;
 case 'unsupervised_artillery':if(this.all(1-p,l).some(v=>!this.target(v)))throw Error(T('有未被阻挡的敌人','Some enemies are unblocked'));this.towerDamage(1-p,l,4,true);break;
 case 'apotheosis_blade':this.imps(1-p,l).splice(0);{const e=this.target(u);if(e)e.items={};}break;
 case 'blink_dagger':if(t[0]===l)throw Error(T('请选择另一条战线','Choose a different lane'));this.move(u,t[0]);break;
 case 'book_of_the_dead':for(let n=0;n<(it.charges||0);n++)this.spawn('zombie',p,l);it.charges=0;break;
 case 'bracers_of_sacrifice':this.neighbors(u,true).forEach(v=>this.damage(v,6));this.condemn(u);break;
 case 'horn_of_the_alpha':this.spawn('thunderhide_pack',p,l);break;
 case 'keenfolk_musket':this.damage(a,2);break;
 case 'nyctashas_guard':for(const v of this.neighbors(u,true))this.move(v,this.pick([0,1,2].filter(j=>j!==l)));break;
 case 'rumusque_vestments':this.heal(a,4);break;
 case 'shivas_guard':this.neighbors(a,false,true).forEach(v=>this.buff(v,{attack:-2}));break;
 case 'wingfall_hammer':{const n=Math.floor(this.stats(u).attack/2);this.neighbors(u,false,true).forEach(v=>this.buff(v,{regen:n},'round'));break;}
 default:throw Error(T('尚未实现的主动技能：','Active ability not implemented: ')+k);
 }
 if(imp)u.cooldown=ability.cooldown;else u.cooldowns[k]=k==='lion'?Math.max(1,ability.cooldown-(u.quicken||0)):ability.cooldown;
 this.s.passes=0;this.s.turn=1-p;this.sweep();return this.s;
 }catch(e){this.s=backup;throw e;}};
// Heuristic AI uses the same public action API and validation as the player.
G.candidateTargets=function(k,p,source=null){const spec=this.targets(k,p,source),choices=[];for(const s of spec){let a=[];
 if(s.kind==='lane')a=[0,1,2];
 else if(s.kind==='position'){for(const l of s.cross?[0,1,2]:[this.s.lane])for(const pos of this.positionTargets(p,l,s,source))a.push({lane:l,pos});}
 else if(s.kind==='improvement'){for(let l=0;l<3;l++)if(s.cross||l===this.s.lane)for(let q=0;q<2;q++)if(!s.enemy||q!==p)a.push(...this.imps(q,l).map(i=>i.uid));}
 else a=this.all(null,s.cross?null:this.s.lane).filter(u=>this.selectable(u)&&(s.side!=='ally'||u.owner===p)&&(s.side!=='enemy'||u.owner!==p)&&(!s.hero||u.hero)&&(!s.creep||!u.hero)&&(!s.color||this.card(u.k).color===s.color)&&(!s.other||u.uid!==source?.uid)).map(u=>u.uid);
 if(!a.length)return [];choices.push(a);}
 let out=[[]];for(const a of choices)out=out.flatMap(t=>a.filter(v=>!t.includes(v)).map(v=>[...t,v])).slice(0,150);return out;
};
G.evaluate=function(p){let n=0;for(let l=0;l<3;l++){for(let q=0;q<2;q++){const sign=q===p?1:-1,t=this.s.lanes[l].towers[q];n+=sign*((t.fallen?-55:0)+t.hp*.42);for(const u of this.all(q,l)){const st=this.stats(u);n+=sign*(st.attack*1.1+st.hp*.55+st.armor*1.3+(u.hero?7:1)+(st.immune?12:0)-(this.flag(u,'stun')?st.attack+3:0)-(this.flag(u,'silence')&&u.hero?4:0));}n+=sign*this.imps(q,l).reduce((x,i)=>x+(this.card(i.k).mana||1)*1.7,0);}const f=this.combatForecast(l);n+=(f.tower[1-p]-f.tower[p])*.65;}n+=(this.s.players[p].gold-this.s.players[1-p].gold)*.28+(this.s.players[p].hand.length-this.s.players[1-p].hand.length)*1.3;for(const u of this.all()){const sign=u.owner===p?1:-1;n+=sign*(this.shield(u)*.55+(this.flag(u,'shadowRealm')?3:0)-(this.flag(u,'flipped')?this.stats(u).attack+3:0));}for(const j of this.s.jex||[])n+=(j.owner===p?1:-1)*(j.enhanced?4:3);if(this.s.winner!==null)n+=this.s.winner===p?100000:this.s.winner===2?0:-100000;return n;};
G.bestAction=function(p){if(this.s.phase!=='action'||this.s.turn!==p)return null;const saved=clone(this.s),baseline=this.evaluate(p);let best=null,bestScore=.1;const actions=[];
 for(const h of this.s.players[p].hand){if(this.canPlay(p,h))continue;for(const t of this.candidateTargets(h.k,p))actions.push({kind:'play',id:h.uid,k:h.k,t});}
 for(const u of [...this.all(p,this.s.lane),...this.imps(p,this.s.lane)]){if(u.alive&&!this.enabled(u))continue;for(const a of this.abilities(u))if(!a.remaining)for(const t of this.candidateTargets(a.k,p,u))actions.push({kind:'ability',id:u.uid,k:a.k,t});}
 for(const a of actions.slice(0,600)){this.s=clone(saved);try{if(a.kind==='play')this.play(p,a.id,a.t);else this.activate(p,a.id,a.k,a.t);let score=this.evaluate(p)-baseline;if(a.kind==='play')score-=this.card(a.k).mana*.10;if(this.card(a.k).initiative)score+=.7;if(score>bestScore){bestScore=score;best=a;}}catch{}}
 this.s=saved;return best;
};
G.aiStep=function(p=1){const a=this.bestAction(p);if(!a)this.pass(p);else if(a.kind==='play')this.play(p,a.id,a.t);else this.activate(p,a.id,a.k,a.t);return a;};
G.aiShop=function(p=1){let n=0;while(n++<12){const pl=this.s.players[p],s=pl.shop;const opts=['deck','secret','consumable'].filter(slot=>s[slot]&&!(slot==='secret'&&s.secretBought)&&!(slot==='consumable'&&s.consumed)).map(slot=>({slot,c:this.card(s[slot]),price:slot==='secret'&&pl.freeShop?0:this.card(s[slot]).gold})).filter(v=>v.price<=pl.gold);const useful=opts.filter(o=>o.c.itemType!=='Consumable'||o.c.key==='healing_salve');if(!useful.length)break;useful.sort((a,b)=>b.c.gold-a.c.gold);try{this.buy(p,useful[0].slot);}catch{break;}}};
G.aiDeploy=function(p=1){for(const u of this.ready(p)){const scores=[0,1,2].map(l=>{const own=this.all(p,l),enemy=this.all(1-p,l);let score=enemy.reduce((n,v)=>n+this.stats(v).attack,0)-own.reduce((n,v)=>n+this.stats(v).attack,0);if(!own.some(v=>v.hero&&this.card(v.k).color===this.card(u.k).color))score+=4;score+=(40-this.s.lanes[l].towers[p].hp)*.1;return {l,score};}).sort((a,b)=>b.score-a.score);this.deploy(u.uid,scores[0].l);}};
// Current Classic changes, plus aura properties that were absent from older data archives.
const baseStats=G.itemStats;G.itemStats=function(k){if(k==='shield_of_aquila')return {armor:2};if(k==='assassins_veil')return {health:4};return baseStats.call(this,k);};
const oldStats=G.stats;G.stats=function(u){const r=oldStats.call(this,u);if(u.alive)for(const v of this.neighbors(u))if(this.equipment(v,'shield_of_aquila'))r.armor+=3;return r;};
const oldMax=G.maxMana;G.maxMana=function(p,l){return Math.max(0,oldMax.call(this,p,l)+this.all(p,l).reduce((n,u)=>n+this.value(u,'towerMana'),0));};
const oldBefore=G.beforeAction;G.beforeAction=function(l){for(let p=0;p<2;p++)for(const i of this.imps(p,l))if(i.k==='march_of_the_machines'&&i.charges>0){i.charges--;this.towerDamage(1-p,l,2);this.all(1-p,l).forEach(u=>this.damage(u,2));}oldBefore.call(this,l);};
root.ArtifactEngine.SPELL_KEYS=Object.keys(Game.prototype.resolve.toString().match(/case '[^']+'/g)?.reduce((o,v)=>(o[v.slice(6,-1)]=1,o),{})||{});
})(typeof window!=='undefined'?window:globalThis);
