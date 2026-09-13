/* Artifact Threefold — deterministic, browser-independent Classic rules engine. */
(function (root) {
'use strict';
const clone=o=>JSON.parse(JSON.stringify(o));
const slug=s=>s.toLowerCase().replace(/['’’.]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
class Game {
 constructor(cards){this.cards=Object.fromEntries(cards.map(c=>[c.key,c]));this.s=null;}
 card(k){return this.cards[k];}
 random(){let x=this.s.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.s.seed=x;return (x>>>0)/4294967296;}
 pick(a){return a.length?a[Math.floor(this.random()*a.length)]:null;}
 shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(this.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 id(){return ++this.s.serial;}
 emit(type,text,data={}){const e={id:this.id(),type,text,round:this.s.round,lane:this.s.lane,...data};this.s.events.push(e);this.s.log.push(e);this.s.log=this.s.log.slice(-240);return e;}
 all(p=null,l=null){return this.s.units.filter(u=>u.alive&&(p===null||u.owner===p)&&(l===null||u.lane===l));}
 get(id){return this.s.units.find(u=>u.uid===Number(id));}
 at(p,l,pos){return this.all(p,l).find(u=>u.pos===pos);}
 neighbors(u,enemy=false,self=false){return this.all(enemy?1-u.owner:u.owner,u.lane).filter(v=>Math.abs(v.pos-u.pos)<=1&&(enemy||self||v.uid!==u.uid));}
 imps(p,l){return this.s.lanes[l].improvements[p];}
 hasImp(p,l,k){return this.imps(p,l).filter(i=>i.k===k).length;}
 named(p,k,l=null){return this.all(p,l).filter(u=>u.k===k&&this.enabled(u));}
 passive(u,name,data={}){this.emit('passive',this.card(u.k).name+' · '+name,{unit:u.uid,card:u.k,owner:u.owner,skill:name,...data});}
 enabled(u){return u.alive&&!this.flag(u,'silence')&&!this.flag(u,'stun')&&!this.flag(u,'flipped');}
 selectable(u){return !!u?.alive&&!this.flag(u,'flipped');}
 canAttack(u){return this.selectable(u)&&!this.flag(u,'stun')&&!this.flag(u,'disarm');}
 attackable(u){return this.selectable(u)&&!this.flag(u,'shadowRealm');}
 canMove(u){return this.selectable(u)&&!this.flag(u,'root');}
 shield(u){return Math.max(0,this.value(u,'shield'));}
 absorb(u,n){let left=n;for(const m of u.mods){if(m.shield>0){const used=Math.min(left,m.shield);m.shield-=used;left-=used;}}return left;}
 consumeShadow(u){u.mods=u.mods.filter(m=>!m.shadowRealm);}
 positionTargets(p,l,s={},source=null){
  if(!s.free)return this.placementPositions(p,l,source);
  const max=Math.max(0,...this.all(null,l).map(u=>u.pos),...(this.s.jex||[]).filter(j=>j.lane===l).map(j=>j.pos));
  return Array.from({length:max+2},(_,i)=>i).filter(pos=>s.occupied?this.selectable(this.at(p,l,pos))||!this.at(p,l,pos):!this.at(p,l,pos));
 }
 flag(u,k){return u.mods.some(m=>m[k]);}
 buff(u,values,duration='permanent',source=null){if(!u)return;u.mods.push({...values,until:duration,round:this.s.round,source});}
 value(u,k){return u.mods.reduce((n,m)=>n+(Number(m[k])||0),0);}
 equipment(u,k){return Object.values(u.items).filter(Boolean).some(it=>it.k===k);}
 maxMana(p,l){let n=this.s.lanes[l].manaBase[p]+this.s.round+2+2*this.hasImp(p,l,'selemenes_favor')-2*(this.hasImp(0,l,'the_tyler_estate')+this.hasImp(1,l,'the_tyler_estate'));n+=this.named(p,'roseleaf_druid',l).length-this.named(1-p,'tyler_estate_censor',l).length;return Math.max(0,n);}
 stats(u){
  const c=this.card(u.k);let r={attack:c.attack||0,armor:c.armor||0,health:c.health||1,cleave:0,retaliate:0,siege:0,regen:0,towerBonus:0,heroBonus:0,pierce:false,immune:this.flag(u,'immune')};
  for(const m of u.mods){for(const k of ['attack','armor','health','cleave','retaliate','siege','regen','towerBonus','heroBonus'])r[k]+=Number(m[k])||0;if(m.pierce)r.pierce=true;}
  for(const it of Object.values(u.items).filter(Boolean)){const b=this.itemStats(it.k);for(const k in b)if(typeof b[k]==='number')r[k]=(r[k]||0)+b[k];else r[k]=b[k];if(it.k==='stonehall_cloak')r.health+=2*(it.growth||0);if(it.k==='stonehall_pike')r.attack+=it.growth||0;if(it.k==='stonehall_plate')r.armor+=it.growth||0;}
  if(!u.alive){r.hp=Math.max(0,r.health-u.damage);return r;}
  const p=u.owner,l=u.lane,own=this.all(p,l),opp=this.all(1-p,l);
  for(const v of this.all(p))if(v.uid!==u.uid&&v.k==='drow_ranger'&&this.enabled(v))r.attack++;
  for(const v of own){if(!this.enabled(v))continue;const near=v.uid!==u.uid&&Math.abs(v.pos-u.pos)<=1;
   if(v.k==='disciple_of_nevermore'&&v!==u){r.attack+=2;r.armor-=2;}
   if(v.k==='enchantress'&&(v===u||near))r.regen+=2;
   if(near){if(['farvhan_the_dreamer','fahrvhan_the_dreamer','prowler_vanguard'].includes(v.k))r.armor++;if(v.k==='treant_protector')r.armor+=2;if(v.k==='lycan')r.attack+=2;if(v.k==='legion_standard_bearer')r.attack+=4;r.armor+=this.value(v,'neighborArmor');}
   r.regen+=this.value(v,'auraRegen');
  }
  for(const v of this.all(null,l)){if(this.equipment(v,'seraphim_shield'))r.attack-=2;if(v.owner===p&&v!==u&&Math.abs(v.pos-u.pos)<=1&&this.equipment(v,'shield_of_basilius'))r.armor++;if(v.owner!==p&&this.equipment(v,'ristul_emblem')&&this.target(v)?.uid===u.uid)r.armor-=2;}
  if(this.enabled(u)){
   if(u.k==='assassins_shadow')r.attack-=2*(own.length-1);if(u.k==='revtel_convoy')r.attack+=Math.floor(this.s.players[p].gold/2);
   if(u.k==='centaur_warrunner'||u.k==='legion_commander')r.retaliate+=2;
   if(u.k==='thunderhide_pack')r.siege+=6;if(u.k==='assassins_shadow')r.siege+=5;
   if(u.k==='debbi_the_cunning'){r.heroBonus+=2;r.towerBonus+=2;}if(u.k==='phantom_assassin')r.heroBonus+=4;if(u.k==='sorla_khan')r.towerBonus+=4;
  }
  if(!this.flag(u,'disarm')&&!this.flag(u,'stun')){const blocker=this.target(u);if(blocker?.k==='timbersaw'&&this.enabled(blocker))r.armor--;}
  if(u.k==='timbersaw'&&this.enabled(u)||this.equipment(u,'keenfolk_plate'))r.armor+=opp.filter(v=>this.target(v)?.uid===u.uid&&!this.flag(v,'disarm')&&!this.flag(v,'stun')).length;
  r.armor+=this.hasImp(p,l,'verdant_refuge');r.towerBonus+=2*this.hasImp(p,l,'assault_ladders');
  if(u.k==='melee_creep')r.regen+=2*this.hasImp(p,l,'altar_of_the_mad_moon');
  if(c.type==='Hero'){r.siege+=4*(this.hasImp(0,l,'assured_destruction')+this.hasImp(1,l,'assured_destruction'));for(let q=0;q<2;q++)if(this.all(q,l).some(v=>this.card(v.k).color==='Red'&&this.card(v.k).type==='Hero'&&this.enabled(v)))r.cleave+=2*this.hasImp(q,l,'grand_melee');}
  if(Object.keys(u.items).length){let n=this.hasImp(0,l,'temple_of_war')+this.hasImp(1,l,'temple_of_war');r.attack+=2*n;r.armor+=n;}
  if(this.all(p,l).some(v=>this.card(v.k).type==='Hero'&&this.card(v.k).color==='Black'&&this.enabled(v)))r.attack+=4*this.hasImp(p,l,'the_oath');
  r.attack=Math.max(0,r.attack)+this.value(u,'shadowBonus');if(u.k==='sven'&&this.enabled(u))r.cleave+=Math.floor(r.attack/2);r.health=Math.max(1,r.health);r.hp=Math.max(0,r.health-u.damage);return r;
 }
 itemStats(k){
  const map={apotheosis_blade:{attack:8,siege:4},barbed_mail:{armor:1,retaliate:2},blade_of_the_vigil:{attack:2,cleave:2},blink_dagger:{attack:2},book_of_the_dead:{health:4},bracers_of_sacrifice:{armor:2},broadsword:{attack:4},chainmail:{armor:2},claszureme_hourglass:{health:4},claymore:{attack:8},cloak_of_endless_carnage:{health:8},demagicking_maul:{attack:2},fur_lined_mantle:{health:8},helm_of_the_dominator:{armor:3},heros_cape:{health:16},horn_of_the_alpha:{health:4},jasper_daggers:{attack:2,pierce:true},keenfolk_musket:{attack:2},keenfolk_plate:{armor:1},leather_armor:{armor:1},nyctashas_guard:{armor:1},phase_boots:{health:4},platemail:{armor:4},poaching_knife:{attack:2},red_mist_maul:{attack:2,siege:5},revtel_signet_ring:{health:4},ring_of_tarrasque:{health:4,regen:6},ristul_emblem:{health:4,armor:-2},rumusque_vestments:{armor:1},seraphim_shield:{armor:2},shield_of_basilius:{armor:2},shivas_guard:{armor:2},short_sword:{attack:2},stonehall_cloak:{health:4},stonehall_pike:{attack:2},stonehall_plate:{armor:1},travelers_cloak:{health:4},vesture_of_the_tyrant:{armor:3},wingfall_hammer:{attack:4}};
  return map[k]||{};
 }
 towerArmor(p,l){return this.hasImp(p,l,'steel_reinforcement')+3*this.all(p,l).filter(u=>this.equipment(u,'vesture_of_the_tyrant')).length;}
 target(u){if(u.target){const t=this.get(u.target);if(t?.alive&&t.lane===u.lane&&t.owner!==u.owner)return t;}return this.at(1-u.owner,u.lane,u.pos+(u.arrow||0))||null;}
 placementPositions(p,l,exclude=null){
  const units=this.all(null,l).filter(u=>u!==exclude),own=new Set(units.filter(u=>u.owner===p).map(u=>u.pos));
  const gaps=[...new Set(units.filter(u=>u.owner!==p&&!own.has(u.pos)).map(u=>u.pos))].sort((a,b)=>a-b);
  if(gaps.length)return gaps;
  if(!units.length)return [0];
  const positions=units.map(u=>u.pos);return [Math.min(...positions)-1,Math.max(...positions)+1];
 }
 placementPosition(p,l,pos=null,exclude=null){
  if(pos===null)pos=this.pick(this.placementPositions(p,l,exclude));
  if(!Number.isInteger(pos)||pos< -1)throw Error('请选择有效位置');
  if(this.all(p,l).some(u=>u!==exclude&&u.pos===pos))throw Error('这个位置已被占用');
  if(pos===-1){for(const u of this.all(null,l))if(u!==exclude)u.pos++;for(const j of this.s.jex||[])if(j.lane===l)j.pos++;return 0;}
  return pos;
 }
 resetArrow(u){u.target=null;u.arrow=this.at(1-u.owner,u.lane,u.pos)?0:(()=>{const n=this.random();return n<.25?-1:n<.75?0:1;})();}
 compactLane(l){
  // Remove only columns empty on BOTH sides. Never slide one rank independently.
  const units=this.all(null,l),markers=(this.s.jex||[]).filter(j=>j.lane===l),positions=[...new Set([...units,...markers].map(u=>u.pos))].sort((a,b)=>a-b);
  const targets=new Map(units.map(u=>[u.uid,this.target(u)?.uid]));
  const columns=new Map(positions.map((pos,index)=>[pos,index]));
  for(const u of units)u.pos=columns.get(u.pos);
  for(const j of markers)j.pos=columns.get(j.pos);
  for(const u of units)if(!u.target&&targets.get(u.uid)!==this.target(u)?.uid)this.resetArrow(u);
 }
 assignArrows(l){this.compactLane(l);for(const u of this.all(null,l))this.resetArrow(u);}
 spawn(k,p,l,pos=null,{hero=false,copy=false}={}){
  if(!this.card(k))throw Error('找不到卡牌：'+k);pos=this.placementPosition(p,l,pos);const u={uid:this.id(),k,owner:p,lane:l,pos,alive:true,hero:hero||this.card(k).type==='Hero',copy,damage:0,mods:[],items:{},cooldowns:{},arrow:0,target:null,readyRound:0};this.s.units.push(u);this.resetArrow(u);const opponent=this.at(1-p,l,pos);if(opponent&&!opponent.target)opponent.arrow=0;if(u.hero)for(const a of this.card(k).abilities||[])u.cooldowns[a.key||k]=a.cooldown;
  if(k==='monkey_soldier'&&this.s.players[p].monkeyBonus)this.buff(u,{attack:this.s.players[p].monkeyBonus});
  if(k==='relentless_zombie')this.buff(u,{deathShield:1},'death');
  if(k==='champion_of_the_ancient'){const n=this.all(1-p,l).length;this.buff(u,{attack:n,health:n,cleave:n});}
  if(k==='keenfolk_golem'){this.s.players[p].discard.push(...this.s.players[p].hand.map(h=>h.k));this.s.players[p].hand=[];}
  if(k==='oglodi_vandal')this.towerDamage(1-p,l,4);
  if(k==='roseleaf_rejuvenator')this.healTower(p,l,7);
  if(k==='smeevil_armsmaster')this.buff(this.pick(this.all(p,l).filter(x=>x.hero)),{attack:2});
  if(k==='smeevil_blacksmith')this.buff(this.pick(this.all(p,l).filter(x=>x.hero)),{armor:1});
  if(this.hasImp(0,l,'glyph_of_confusion')||this.hasImp(1,l,'glyph_of_confusion'))this.buff(u,{stun:1},'round');
  this.emit('summon',this.card(k).name+'进入'+['上路','中路','下路'][l],{unit:u.uid});return u;
 }
 newGame(deck,enemy,seed=Date.now()){
  this.s={version:1,seed:seed|0||1,serial:0,round:1,lane:0,phase:'action',turn:0,initiative:0,passes:0,winner:null,units:[],players:[deck,enemy].map(d=>({name:d.name,gold:0,deck:[],hand:[],discard:[],itemDeck:[],shop:null,freeShop:false,heroes:[...d.heroes],eclipse:0})),lanes:Array.from({length:3},()=>({towers:[{hp:40,max:40,fallen:false,damageRound:0,regen:0},{hp:40,max:40,fallen:false,damageRound:0,regen:0}],mana:[3,3],manaBase:[0,0],improvements:[[],[]]})),events:[],log:[],deckSpecs:[clone(deck),clone(enemy)]};
  [deck,enemy].forEach((d,p)=>{const err=this.validateDeck(d);if(err.length)throw Error(err.join('；'));let list=[...d.main];for(const k of d.heroes){const sig=this.card(k).signature;if(sig)list.push(sig,sig,sig);}this.s.players[p].deck=this.shuffle(list.map(k=>({k,charges:0})));this.s.players[p].itemDeck=this.shuffle(d.items);const lanes=this.shuffle([0,1,2]);d.heroes.forEach((k,i)=>{if(i<3)this.spawn(k,p,lanes[i]);else{const u=this.spawn(k,p,0);u.alive=false;u.lane=-1;u.readyRound=i-1;}});for(let i=0;i<3;i++)this.spawn('melee_creep',p,i);this.draw(p,5);});
  for(let l=0;l<3;l++)this.assignArrows(l);this.beforeAction(0);this.emit('round','第 1 回合 · 上路开始');return this.s;
 }
 validateDeck(d){const e=[];if(!d||!Array.isArray(d.heroes)||!Array.isArray(d.main)||!Array.isArray(d.items))return ['牌组格式错误'];if(d.heroes.length!==5||new Set(d.heroes).size!==5)e.push('需要 5 位不同英雄');if(d.main.length+15<40)e.push('主牌组含专属牌至少 40 张');if(d.items.length<9)e.push('物品牌组至少 9 张');const colors=new Set(d.heroes.map(k=>this.card(k)?.color));for(const k of d.heroes)if(this.card(k)?.type!=='Hero')e.push('英雄选择无效');for(const list of [d.main,d.items]){const count={};for(const k of list){const c=this.card(k);if(!c){e.push('未知卡牌');continue;}count[k]=(count[k]||0)+1;if(count[k]>3)e.push(c.name+'超过 3 张');if(list===d.main&&c.requiredHero&&!d.heroes.includes(c.requiredHero))e.push(c.name+'需要在牌组中加入'+this.card(c.requiredHero).name);if(list===d.main&&(c.signatureOf||c.token||['Item','Hero'].includes(c.type)||!colors.has(c.color)))e.push(c.name+'无法加入主牌组');if(list===d.items&&(c.type!=='Item'||c.itemType==='Consumable'))e.push(c.name+'无法加入物品牌组');}}return [...new Set(e)];}
 draw(p,n){const pl=this.s.players[p];for(let i=0;i<n;i++){if(!pl.deck.length)break;let lock=this.all(1-p).filter(u=>this.equipment(u,'claszureme_hourglass')).length;const c=pl.deck.pop();pl.hand.push({uid:this.id(),k:typeof c==='string'?c:c.k,charges:typeof c==='string'?0:c.charges||0,lock});}this.emit('draw',`${p?'夜魇':'天辉'}抽取 ${n} 张牌`);}
 heal(u,n){if(!u?.alive)return;const before=u.damage;u.damage=Math.max(0,u.damage-n);if(before!==u.damage)this.emit('heal',this.card(u.k).name+'回复 '+(before-u.damage),{unit:u.uid,amount:before-u.damage});}
 healTower(p,l,n){const t=this.s.lanes[l].towers[p];t.hp=Math.min(t.max,t.hp+n);}
 damage(u,n,pierce=false,source=null){if(n<=0)return 0;if(!this.selectable(u))return 0;const st=this.stats(u);if(st.immune)return 0;const d=this.absorb(u,Math.max(0,n-(pierce?0:st.armor)));if(n<=0)return 0;u.damage+=d;if(d)this.emit('damage',this.card(u.k).name+'受到 '+d+' 点伤害',{unit:u.uid,amount:d,source});return d;}
 towerDamage(p,l,n,pierce=false){const t=this.s.lanes[l].towers[p];const d=Math.max(0,n-(pierce?0:this.towerArmor(p,l)));t.hp-=d;t.damageRound+=d;this.emit('tower',`${p?'夜魇':'天辉'}${['上路','中路','下路'][l]}受到 ${d} 点伤害`,{owner:p,lane:l,amount:d});}
 checkWin(){if(this.s.winner!==null)return;const lost=[false,false];for(let p=0;p<2;p++){for(let l=0;l<3;l++){const t=this.s.lanes[l].towers[p];if(t.hp<=0){if(t.fallen){lost[p]=true;}else{t.fallen=true;t.hp=80;t.max=80;this.emit('destroy',`${p?'夜魇':'天辉'}${['上路','中路','下路'][l]}防御塔倒塌，遗迹出现`,{owner:p,lane:l});}}}if(this.s.lanes.filter(l=>l.towers[p].fallen).length>=2)lost[p]=true;}if(lost[0]||lost[1]){this.s.winner=lost[0]&&lost[1]?2:lost[0]?1:0;this.s.phase='ended';this.emit('victory',this.s.winner===2?'双方同时摧毁目标 · 平局':this.s.winner===0?'天辉胜利':'夜魇胜利');}}
 sweep(){
  const priorTargets=new Map(this.all().map(u=>[u.uid,this.target(u)?.uid]));
  for(let iteration=0;iteration<20;iteration++){for(let l=0;l<3;l++)this.compactLane(l);const dead=this.all().filter(u=>this.stats(u).hp<=0||this.flag(u,'condemned'));if(!dead.length)break;
   for(const u of dead){if(!u.alive)continue;const shield=u.mods.find(m=>m.deathShield>0);if(shield&&!this.flag(u,'ignoreShield')){shield.deathShield--;u.damage=Math.max(0,this.stats(u).health-1);u.mods=u.mods.filter(m=>!m.condemned);continue;}

    const p=u.owner,l=u.lane,neighbors=this.neighbors(u),opponents=this.all(1-p,l),watchers=this.all(null,l),blockers=new Set(opponents.filter(v=>this.target(v)?.uid===u.uid).map(v=>v.uid));u.alive=false;
    let bounty=(u.hero?5:1)+this.value(u,'bounty')-(this.equipment(u,'revtel_signet_ring')?3:0);this.s.players[1-p].gold+=Math.max(0,bounty);this.emit('death',this.card(u.k).name+'阵亡',{unit:u.uid});
    for(const v of opponents){if(this.equipment(v,'poaching_knife'))this.s.players[1-p].gold+=u.hero?5:1;const blocked=blockers.has(v.uid);if(blocked&&this.enabled(v)){if(v.k==='bloodseeker'){this.heal(v,999);this.passive(v,'屠戮');}if(v.k==='bristleback'&&u.hero){this.buff(v,{armor:2});this.passive(v,'酒馆醉拳');}if(v.k==='stonehall_elite')this.buff(v,{attack:2,health:2});}if(v.k==='necrophos'&&Math.abs(v.pos-u.pos)<=1&&this.enabled(v)){this.buff(v,{health:1});this.passive(v,'施虐之心');}}
    for(const v of neighbors){if(v.k==='pit_fighter_of_quoidge'&&this.enabled(v))this.buff(v,{attack:2});if(this.equipment(v,'cloak_of_endless_carnage'))this.draw(p,1);}
    if(u.k==='melee_creep')for(const v of this.all(p,l)){if(v.k==='ogre_corpse_tosser'&&this.enabled(v))this.towerDamage(1-p,l,2,true);for(const it of Object.values(v.items))if(it.k==='book_of_the_dead')it.charges=(it.charges||0)+1;}
    if(u.k==='vhoul_martyr')for(const v of this.all(p,l))this.buff(v,{attack:1,health:1});
    if(u.hero)for(let q=0;q<2;q++)if(this.hasImp(q,l,'the_omexe_arena'))this.draw(q,this.hasImp(q,l,'the_omexe_arena'));
    if(u.k==='meepo')this.passive(u,'合则倒');if(u.k==='meepo')for(const v of this.all(p).filter(v=>v.k==='meepo'))this.buff(v,{condemned:1,ignoreShield:1},'death');
    u.mods=u.mods.filter(m=>m.until==='permanent');u.readyRound=this.s.round+(u.k==='rix'||this.equipment(u,'vesture_of_the_tyrant')?1:2);u.lane=-1;u.target=null;
    if(!u.hero||u.copy)this.s.players[p].discard.push(u.k);
   }
  }for(const u of this.all())if(priorTargets.get(u.uid)!==this.target(u)?.uid&&(!u.target||!this.get(u.target)?.alive))this.resetArrow(u);this.checkWin();
 }
 condemn(u){if(this.selectable(u))this.buff(u,{condemned:1},'death');}
 returnHero(u){if(!u?.hero)return;if(!this.canMove(u))throw Error('缠绕或翻牌期间无法回城');u.alive=false;u.lane=-1;u.readyRound=this.s.round+1;u.mods=u.mods.filter(m=>m.until==='permanent');u.target=null;this.emit('return',this.card(u.k).name+'返回泉水',{unit:u.uid});}
 move(u,l,pos=null){if(!u?.alive)return;if(!this.canMove(u))throw Error('缠绕或翻牌期间无法移动');if(l<0||l>2)throw Error('无效战线');const old=u.lane;pos=this.placementPosition(u.owner,l,pos,u);u.lane=l;u.pos=pos;this.resetArrow(u);const opposite=this.at(1-u.owner,l,pos);if(opposite&&!opposite.target)opposite.arrow=0;if(this.hasImp(0,l,'glyph_of_confusion')||this.hasImp(1,l,'glyph_of_confusion'))this.buff(u,{stun:1},'round');this.emit('move',this.card(u.k).name+'转移至'+['上路','中路','下路'][l],{unit:u.uid,from:old,to:l});}
 swap(a,b){if(!a||!b||a.owner!==b.owner||a.lane!==b.lane)throw Error('只能交换同路友方单位');if(!this.canMove(a)||!this.canMove(b))throw Error('缠绕或翻牌期间无法移动');[a.pos,b.pos]=[b.pos,a.pos];a.target=null;b.target=null;}
 battle(a,b){if(!a?.alive||!b?.alive||a===b)return;const sa=this.stats(a),sb=this.stats(b),aa=this.canAttack(a)&&this.attackable(b)&&sa.attack>0,ab=this.canAttack(b)&&this.attackable(a)&&sb.attack>0;let da=0,db=0;if(aa)da=this.damage(b,sa.attack+(b.hero?sa.heroBonus:0),sa.pierce,a.uid);if(ab)db=this.damage(a,sb.attack+(a.hero?sb.heroBonus:0),sb.pierce,b.uid);if(da)this.onBattleHit(a,b);if(db)this.onBattleHit(b,a);if(da&&sb.retaliate)this.damage(a,sb.retaliate);if(db&&sa.retaliate)this.damage(b,sa.retaliate);for(const [attacker,target,attacked] of [[a,b,aa],[b,a,ab]])if(attacked){if(target.k==='dark_willow_bramble'){this.damage(attacker,1,true,target.uid);this.buff(attacker,{root:1},'round');}this.consumeShadow(attacker);}this.countAttack(a,aa);this.countAttack(b,ab);for(const x of [a,b])this.expireSoldier(x);this.sweep();}
 countAttack(u,attacked){if(!attacked||!u?.alive)return;if(u.k==='monkey_king'&&this.enabled(u)){u.charges=(u.charges||0)+1;this.passive(u,'棒击蓄势 · 能量 '+u.charges);}if(u.k==='monkey_soldier')u.attacks=(u.attacks||0)+1;}
 expireSoldier(u){if(u?.alive&&u.k==='monkey_soldier'&&(u.attacks||0)>=2){u.alive=false;u.lane=-1;u.target=null;this.emit('expire',this.card(u.k).name+'出击完成，消散',{unit:u.uid});}}
 onBattleHit(a,b){if(this.equipment(a,'apotheosis_blade'))this.condemn(b);if(b.k==='viper'&&this.enabled(b)){this.buff(a,{attack:-1});this.passive(b,'腐蚀皮肤',{target:a.uid});}if(!this.enabled(a))return;if(a.k==='ursa'){this.buff(b,{armor:-1});this.passive(a,'怒意狂击',{target:b.uid});}if(['hellbear_crippler','loyal_beast'].includes(a.k))this.buff(b,{attack:-1});a.hitType=b.hero?'Hero':'Creep';}
 beforeAction(l){
  const units=[...this.all(null,l)];for(const u of units){if(!this.enabled(u))continue;const p=u.owner;
   if(u.k==='bounty_hunter'&&this.random()<.5){this.buff(u,{attack:4},'round');this.passive(u,'忍术');}
   if(u.k==='luna'){const pl=this.s.players[p];const es=[...pl.hand,...pl.deck].filter(c=>c.k==='eclipse');this.shuffle(es).slice(0,3).forEach(c=>c.charges=(c.charges||0)+1);const target=this.pick(this.all(1-p,l));this.passive(u,'月光',{target:target?.uid});this.damage(target,1,true,u.uid);}
   if(u.k==='plague_ward')this.damage(this.pick(this.neighbors(u,true)),2,true);
   if(u.k==='oglodi_catapult')this.towerDamage(1-p,l,2,true);
   if(this.value(u,'heartstopper'))for(const e of this.neighbors(u,true))this.damage(e,2*this.value(u,'heartstopper'),true);
  }
  for(const u of units)if(this.value(u,'poison'))this.damage(u,2*this.value(u,'poison'),true);
  for(let p=0;p<2;p++)for(const i of [...this.imps(p,l)]){switch(i.k){case 'conflagration':for(const e of this.all(1-p,l))this.damage(e,2);break;case 'ignite':for(const e of this.all(1-p,l))this.damage(e,1,true);break;case 'mist_of_avernus':for(const u of this.all(p,l))this.buff(u,{attack:1});break;case 'trebuchets':this.towerDamage(1-p,l,2,true);break;case 'bitter_enemies':if(i.charges<=0){this.towerDamage(0,l,6);this.towerDamage(1,l,6);}break;case 'homefield_advantage':this.buff(this.pick(this.all(1-p,l)),{disarm:1},'round');break;case 'fractured_timeline':{const h=this.pick(this.s.players[1-p].hand);if(h)h.lock++;break;}}}
  this.sweep();
 }
 combatForecast(l=this.s.lane){const result={tower:[0,0],units:{},attacks:[],roots:[],hitDamage:{}};const active=this.all(null,l);for(const u of active)result.units[u.uid]={damage:0,shieldSpent:0,heal:this.flag(u,'flipped')?0:Math.min(u.damage,this.stats(u).regen)};
  const hit=(u,n,pierce=false,attack=false)=>{if(!this.selectable(u)||attack&&!this.attackable(u))return;const st=this.stats(u);if(st.immune||n<=0)return;const f=result.units[u.uid],raw=Math.max(0,n-(pierce?0:st.armor)),absorbed=Math.min(raw,Math.max(0,this.shield(u)-f.shieldSpent));f.shieldSpent+=absorbed;f.damage+=raw-absorbed;return raw-absorbed;};
  for(const u of active){if(!this.canAttack(u))continue;const st=this.stats(u),t=this.target(u);if(t&&!this.flag(t,'flipped')){if(!this.attackable(t))continue;result.hitDamage[u.uid]=hit(t,st.attack+(t.hero?st.heroBonus:0),st.pierce,true)||0;if(st.attack>0){result.attacks.push({unit:u.uid,target:t.uid,owner:u.owner});for(const v of this.neighbors(t))hit(v,st.cleave,false,true);hit(u,this.stats(t).retaliate);if(t.k==='dark_willow_bramble'){hit(u,1,true);result.roots.push(u.uid);}result.tower[1-u.owner]+=Math.max(0,st.siege-this.towerArmor(1-u.owner,l));}}else{if(t&&!u.hero)continue;const n=st.attack+st.towerBonus,amount=Math.max(0,n-this.towerArmor(1-u.owner,l))*(t ? .5 : 1);result.tower[1-u.owner]+=amount;if(n>0){result.attacks.push({unit:u.uid,target:null,owner:u.owner});hit(u,2*this.hasImp(1-u.owner,l,'burning_oil'));}}}
  return result;
 }
 combat(){
  if(this.s.phase!=='action')throw Error('只能在行动阶段结算战斗');
  const l=this.s.lane;this.s.phase='combat';const f=this.combatForecast(l),active=[...this.all(null,l)];this.emit('combat',['上路','中路','下路'][l]+'战斗结算',{attacks:f.attacks});
  for(const u of active){this.heal(u,f.units[u.uid].heal);const d=f.units[u.uid].damage;this.absorb(u,f.units[u.uid].shieldSpent);u.damage+=d;if(d)this.emit('damage',this.card(u.k).name+'受到 '+d+' 点战斗伤害',{unit:u.uid,amount:d});}
  for(let p=0;p<2;p++){const t=this.s.lanes[l].towers[p];t.hp-=f.tower[p];t.damageRound+=f.tower[p];if(f.tower[p])this.emit('tower',`${p?'夜魇':'天辉'}防御建筑受到 ${f.tower[p]} 点战斗伤害`,{owner:p,lane:l,amount:f.tower[p]});}
  for(const attack of f.attacks){const u=this.get(attack.unit),st=this.stats(u),t=this.get(attack.target);if(t&&f.hitDamage[u.uid]>0)this.onBattleHit(u,t);if(!t)u.hitType='Tower';this.consumeShadow(u);this.countAttack(u,true);}
  for(const id of f.roots)this.buff(this.get(id),{root:1},'round');
  this.sweep();if(this.s.winner!==null)return;
  for(const u of this.all(null,l)){this.expireSoldier(u);if(!u.alive)continue;if(this.enabled(u)){if(u.k==='rampaging_hellbear')this.buff(u,{attack:4});if(u.k==='satyr_duelist')this.buff(u,{attack:2});if(u.k==='savage_wolf')this.buff(u,{attack:1,health:2});if(u.k==='selfish_cleric')this.heal(u,999);if(u.k==='cursed_satyr')this.spawn('zombie',1-u.owner,l);if(u.k==='red_mist_pillager'&&u.hitType==='Tower')this.spawn(u.k,u.owner,l);if(u.k==='rebel_instigator'&&u.hitType==='Creep')this.spawn(u.k,u.owner,l);}
   for(const it of Object.values(u.items))if(['stonehall_cloak','stonehall_pike','stonehall_plate'].includes(it.k))it.growth=(it.growth||0)+1;
   u.mods=u.mods.filter(m=>m.until!=='combat');u.hitType=null;
  }
  for(let p=0;p<2;p++){for(const i of this.imps(p,l)){if(i.k==='iron_fog_goldmine')this.s.players[p].gold+=3;if(i.k==='bitter_enemies')i.charges--;if(i.k==='revtel_investments')i.charges++;if(i.k==='unearthed_secrets'&&this.s.lanes[l].towers[p].damageRound)this.draw(p,1);}this.healTower(p,l,this.s.lanes[l].towers[p].regen);}
  this.sweep();if(this.s.winner!==null)return;
  if(l===2){this.s.phase='shop';this.openShop();}else{this.s.lane++;this.s.turn=this.s.initiative;this.s.passes=0;this.s.phase='action';this.beforeAction(this.s.lane);this.emit('lane',['上路','中路','下路'][this.s.lane]+'行动阶段');}
 }
 openShop(){const items=Object.values(this.cards).filter(c=>c.type==='Item'&&c.itemType!=='Consumable'&&!c.token);const consumables=['healing_salve','town_portal_scroll','potion_of_knowledge'];for(let p=0;p<2;p++){const pl=this.s.players[p];const old=pl.shop;pl.shop={secret:this.pick(items).key,deck:old?.hold?old.deck:(pl.itemDeck[0]||null),consumable:this.pick(consumables),hold:false,consumed:false,secretBought:false};}this.emit('shop','商店开张 · 使用战斗获得的金币购买物品');}
 buy(p,slot){if(this.s.phase!=='shop')throw Error('现在不是购物阶段');if(!['deck','secret','consumable'].includes(slot))throw Error('无效商品');const pl=this.s.players[p],shop=pl.shop,k=shop[slot],c=this.card(k);if(!c||slot==='secret'&&shop.secretBought||slot==='consumable'&&shop.consumed)throw Error('本轮该商品已售罄');const price=slot==='secret'&&pl.freeShop?0:c.gold;if(pl.gold<price)throw Error('金币不足');this.s.events=[];pl.gold-=price;pl.hand.push({uid:this.id(),k,lock:0});if(slot==='deck'){pl.itemDeck.splice(pl.itemDeck.indexOf(k),1);shop.deck=pl.itemDeck[0]||null;}else if(slot==='secret')shop.secretBought=true;else shop.consumed=true;this.emit('buy',`${p?'夜魇':'天辉'}购买了 ${c.name}`,{card:k});}
 hold(p){const pl=this.s.players[p];if(this.s.phase!=='shop'||pl.shop.hold||!pl.shop.deck||pl.gold<1)throw Error('无法保留商品');this.s.events=[];pl.gold--;pl.shop.hold=true;this.emit('buy','支付 1 金币，保留物品牌组商品');}
 startRound(){if(this.s.phase!=='shop')throw Error('先完成本轮购物');this.s.round++;this.s.lane=0;this.s.passes=0;this.s.events=[];
  for(const u of this.s.units){u.mods=u.mods.filter(m=>m.until!=='round');for(const k in u.cooldowns)u.cooldowns[k]=Math.max(0,u.cooldowns[k]-1);}
  for(const u of this.all().filter(u=>u.expiresRound&&u.expiresRound<this.s.round)){u.alive=false;u.lane=-1;this.emit('expire',this.card(u.k).name+'消散',{unit:u.uid});}
  for(let p=0;p<2;p++){const pl=this.s.players[p];for(const h of pl.hand)h.lock=Math.max(0,(h.lock||0)-1);let extra=this.named(p,'troll_soothsayer').length;for(let l=0;l<3;l++)extra+=this.hasImp(0,l,'howling_mind')+this.hasImp(1,l,'howling_mind');this.draw(p,2+extra);
   const kanna=this.named(p,'kanna')[0];if(kanna)this.passive(kanna,'征服使者');for(let n=0;n<2;n++)this.spawn('melee_creep',p,kanna?kanna.lane:Math.floor(this.random()*3));
   for(const u of [...this.all(p)]){if(!this.enabled(u))continue;if(u.k==='prellex'){this.spawn('melee_creep',p,u.lane);this.passive(u,'信仰使者');}if(u.k==='venomancer'){this.spawn('plague_ward',p,u.lane);this.passive(u,'剧毒本性');}}
   for(let l=0;l<3;l++){for(let n=0;n<this.hasImp(p,l,'barracks');n++)this.spawn('melee_creep',p,l);this.s.lanes[l].mana[p]=this.maxMana(p,l);this.s.lanes[l].towers[p].damageRound=0;this.s.lanes[l].towers[p].regen=0;for(const i of this.imps(p,l))i.cooldown=Math.max(0,(i.cooldown||0)-1);}
  }
  this.s.phase='deploy';this.emit('round','第 '+this.s.round+' 回合 · 部署英雄');
 }
 ready(p){return this.s.units.filter(u=>u.owner===p&&u.hero&&!u.copy&&!u.alive&&u.readyRound<=this.s.round);}
 deploy(id,l,pos=null){if(this.s.phase!=='deploy')throw Error('现在不是部署阶段');const u=this.get(id);if(!u||!u.hero||u.copy||u.alive||u.readyRound>this.s.round)throw Error('英雄尚未复活');if(!Number.isInteger(l)||l<0||l>2)throw Error('无效战线');pos=this.placementPosition(u.owner,l,pos,u);u.damage=0;u.alive=true;u.lane=l;u.pos=pos;this.resetArrow(u);const opposite=this.at(1-u.owner,l,pos);if(opposite&&!opposite.target)opposite.arrow=0;if(this.hasImp(0,l,'glyph_of_confusion')||this.hasImp(1,l,'glyph_of_confusion'))this.buff(u,{stun:1},'round');this.emit('summon',this.card(u.k).name+'部署至'+['上路','中路','下路'][l],{unit:u.uid});}
 finishDeployment(){if(this.ready(0).length||this.ready(1).length)throw Error('请部署所有待命英雄');for(let l=0;l<3;l++){this.assignArrows(l);for(let p=0;p<2;p++)this.s.lanes[l].mana[p]=this.maxMana(p,l);}this.s.phase='action';this.s.turn=this.s.initiative;this.beforeAction(0);this.emit('lane','上路行动阶段');}
 pass(p){if(this.s.phase!=='action'||this.s.turn!==p)throw Error('尚未轮到你行动');this.s.events=[];this.emit('pass',`${p?'夜魇':'天辉'}让过`);if(this.s.passes===0)this.s.initiative=p;this.s.passes++;if(this.s.passes>=2)this.combat();else this.s.turn=1-p;}
 canPlay(p,h){const c=this.card(h?.k);if(!c)return '找不到这张牌';if(this.s.phase!=='action'||this.s.turn!==p)return '等待你的行动机会';if(h.lock>0)return '此牌仍被锁定 '+h.lock+' 回合';if(c.type==='Item')return '';const l=this.s.lane;if(c.requiredHero&&!this.named(p,c.requiredHero,l).some(u=>c.key!=='pangolier_gyroshell'||this.canMove(u)))return '本路需要可行动的'+this.card(c.requiredHero).name+(c.key==='pangolier_gyroshell'?'且不能被缠绕':'');if(this.s.lanes[l].mana[p]<c.mana)return '当前战线魔力不足';if(this.hasImp(p,l,'the_oath')&&['Spell','Creep'].includes(c.type))return '誓约阻止施放法术和小兵';if(!this.all(p,l).some(u=>u.hero&&this.card(u.k).color===c.color&&this.enabled(u)))return '当前战线需要可行动的'+({Red:'红',Blue:'蓝',Green:'绿',Black:'黑'}[c.color]||'对应')+'色英雄';return '';}
 targets(k,p,source=null){return targetSpec(this.card(k),p,source);}
 validateTargets(c,p,t,source=null){const spec=this.targets(c.key,p,source);for(let n=0;n<spec.length;n++){const s=spec[n],v=t[n];if(s.kind==='lane'){if(!Number.isInteger(v)||v<0||v>2)throw Error('请选择战线');continue;}if(s.kind==='position'){if(!v||!Number.isInteger(v.lane)||!Number.isInteger(v.pos)||v.pos< -1||v.lane<0||v.lane>2)throw Error('请选择空位');if(!s.occupied&&this.at(p,v.lane,v.pos))throw Error('位置已被占用');if(!this.positionTargets(p,v.lane,s,source).includes(v.pos))throw Error('必须优先补对位空缺；没有空缺时只能从两端扩展');if(!s.cross&&v.lane!==this.s.lane)throw Error('只能在当前战线召唤');continue;}if(s.kind==='improvement'){let found=false;for(let l=0;l<3;l++)for(let q=0;q<2;q++)if((s.cross||l===this.s.lane)&&(!s.enemy||q!==p)&&this.imps(q,l).some(i=>i.uid===v))found=true;if(!found)throw Error('请选择有效强化');continue;}const u=this.get(v);if(!this.selectable(u))throw Error('请选择可选中的场上单位（翻牌单位无法选中）');if(!s.cross&&u.lane!==this.s.lane)throw Error('目标必须在当前战线');if(s.side==='ally'&&u.owner!==p||s.side==='enemy'&&u.owner===p)throw Error('目标阵营不符');if(s.hero&&!u.hero||s.creep&&u.hero)throw Error(s.hero?'请选择英雄':'请选择小兵');if(s.color&&this.card(u.k).color!==s.color)throw Error('目标英雄颜色不符');if(s.other&&source&&u.uid===source.uid)throw Error('请选择另一个单位');if(n>0&&t.slice(0,n).includes(v))throw Error('请选择不同单位');}}
 play(p,handId,t=[]){const backup=clone(this.s);try{this.s.events=[];const pl=this.s.players[p],idx=pl.hand.findIndex(h=>h.uid===Number(handId)),h=pl.hand[idx];const why=this.canPlay(p,h);if(why)throw Error(why);const c=this.card(h.k);this.validateTargets(c,p,t);pl.hand.splice(idx,1);if(c.type!=='Item')this.s.lanes[this.s.lane].mana[p]-=c.mana;
   for(const u of this.all(p))if(c.color===this.card(u.k).color){const shadow=u.mods.find(m=>m.shadowRealm);if(shadow)shadow.shadowBonus=Math.min(3,shadow.shadowBonus+1);}
   this.emit('card',`${p?'夜魇':'天辉'}打出 ${c.name}`,{card:c.key,owner:p});
   if(c.type==='Creep'){this.spawn(c.key,p,t[0].lane,t[0].pos);}else if(c.type==='Improvement'){const l=t[0];this.imps(p,l).push({uid:this.id(),k:c.key,charges:['bitter_enemies','march_of_the_machines'].includes(c.key)?3:0,cooldown:0});this.draw(p,0);const n=this.hasImp(1-p,l,'watchtower');if(n)this.draw(1-p,n);if(c.key==='selemenes_favor')this.s.lanes[l].mana[p]+=2;if(c.key==='the_tyler_estate')for(let q=0;q<2;q++)this.s.lanes[l].mana[q]=Math.max(0,this.s.lanes[l].mana[q]-2);
   }else if(c.type==='Item'&&!['Consumable','Deed'].includes(c.itemType)){const u=this.get(t[0]);u.items[c.itemType||'Accessory']={k:c.key,charges:0,growth:0};u.mods=u.mods.filter(m=>!m.unprepared);if(c.key==='jasper_daggers')this.purge(u);}
   else{this.resolve(c.key,p,t,h);pl.discard.push(c.key);}
   if(h.sabotage)this.towerDamage(p,Math.floor(this.random()*3),6);this.afterCard(p,c,h.uid);this.sweep();if(this.s.pendingCombat){delete this.s.pendingCombat;if(this.s.winner===null)this.combat();return this.s;}if(this.s.winner===null&&this.s.phase==='action'){this.s.passes=0;this.s.turn=c.initiative?p:1-p;if(c.initiative)this.s.initiative=p;}return this.s;
  }catch(e){this.s=backup;throw e;}}
 purge(u){u.mods=u.mods.filter(m=>!m.root&&!m.stun&&!m.silence&&!m.disarm&&!m.poison&&!m.unprepared&&!(m.attack<0)&&!(m.armor<0));}
 afterCard(p,c,handId){const l=this.s.lane;
 for(const u of this.all(p)){if(!this.enabled(u))continue;const local=u.lane===l;
  if(c.type==='Spell'&&u.k==='crystal_maiden'){u.arcaneUsed=u.arcaneUsed||{};const tag=this.s.round+':'+l;if(!u.arcaneUsed[tag]){u.arcaneUsed[tag]=true;this.passive(u,'奥术灵气');this.s.lanes[l].mana[p]=Math.min(this.maxMana(p,l),this.s.lanes[l].mana[p]+2);}}
  if(c.type==='Spell'&&c.color==='Blue'&&u.k==='ogre_magi'&&local&&this.random()<.25){this.s.players[p].hand.push({uid:this.id(),k:c.key,lock:0});this.passive(u,'多重施法');}
  if(c.color==='Blue'&&u.k==='outworld_devourer'&&local&&this.random()<.5){this.s.lanes[l].mana[p]=Math.min(this.maxMana(p,l),this.s.lanes[l].mana[p]+2);this.passive(u,'精华灵气');}
  if(c.color==='Blue'&&c.type==='Spell'&&u.k==='zeus'&&local){this.passive(u,'静电场');for(const e of this.neighbors(u,true))this.damage(e,1,true,u.uid);}
  if(c.color==='Black'&&u.k==='storm_spirit'){this.buff(u,{attack:2},'combat');this.passive(u,'超负荷');}
  if(u.k==='incarnation_of_selemene'&&local)this.s.lanes[l].mana[p]=this.maxMana(p,l);
  if(c.type!=='Item'&&c.mana<=2){if(this.value(u,'heroicResolve'))this.buff(u,{health:2*this.value(u,'heroicResolve')});if(this.value(u,'risingAnger'))this.buff(u,{attack:this.value(u,'risingAnger')});}
  for(const [color,tag,vals] of [['Black','coordinated',{attack:2}],['Green','soulSpring',{regen:4}],['Red','standards',{attack:1,armor:1}]])if(c.color===color&&this.value(u,tag))for(const v of this.neighbors(u,false,true))this.buff(v,Object.fromEntries(Object.entries(vals).map(([k,v])=>[k,v*this.value(u,tag)])),'round');
 }
 for(const i of this.imps(p,l)){if(i.k==='path_of_the_bold'&&c.color==='Red')this.buff(this.pick(this.all(p,l)),{attack:1});if(i.k==='path_of_the_cunning'&&c.color==='Black')this.buff(this.pick(this.all(p,l)),{siege:1});if(i.k==='path_of_the_dreamer'&&c.color==='Green')this.s.lanes[l].towers[p].regen+=3;if(i.k==='path_of_the_wise'&&c.color==='Blue')this.damage(this.pick(this.all(1-p,l)),1,true);}
 if(c.type==='Spell'){for(let n=0;n<this.hasImp(1-p,l,'nether_ward');n++)this.towerDamage(p,l,3);this.triggerJex(p,handId);}
 }
}
// Target descriptors drive both validation and the mouse/touch target picker.
const U=(side='any',extra={})=>({kind:'unit',side,...extra}),L=()=>({kind:'lane'}),I=(enemy=false)=>({kind:'improvement',enemy}),P=(cross=false)=>({kind:'position',cross});
function targetSpec(c,p,source){
 if(!c)return [];if(source)return activeTargetSpec(c.key);if(c.type==='Creep')return [P(!!c.cross)];if(c.type==='Improvement'&&!source)return [L()];if(c.type==='Item'&&c.itemType!=='Consumable'&&!source)return [U('ally',{hero:true})];
 const k=c.key,red=()=>U('ally',{hero:true,color:'Red'}),black=()=>U('ally',{hero:true,color:'Black'});
 if(source)return activeTargetSpec(k);
 if(['annihilation','arcane_assault','arcane_censure','at_any_cost','bolt_of_damocles','buying_time','clear_the_deck','corrosive_mist','curse_of_atrophy','defensive_bloom','diabolic_revelation','dimensional_portal','dirty_deeds','divided_we_stand','divine_intervention','echo_slam','eclipse','enough_magic','fog_of_war','foresight','forward_charge','gust','hand_of_god','lightning_strike','lodestone_demolition','lost_in_time','mana_drain','payday','prey_on_the_weak','raze','remote_detonation','restoration_effort','rolling_storm','self_sabotage','sow_venom','stars_align','strafing_run','thundergods_wrath','thunderstorm','time_of_triumph','tower_barrage','wrath_of_gold','potion_of_knowledge','golden_ticket','shop_deed'].includes(k))return [];
 if(['better_late_than_never','call_the_reserves','rumusque_blessing','spring_the_trap'].includes(k))return [L()];
 if(['smash_their_defenses','obliterating_orb'].includes(k))return [I()];
 if(['ball_lightning','the_cover_of_night'].includes(k))return [black(),L()];
 if(['assassinate','grazing_shot','pick_off','iron_branch_protection'].includes(k))return [U('any',{cross:true})];
 if(k==='relentless_pursuit')return [U('enemy',{cross:true})];
 if(k==='duel')return [red(),U()];if(k==='gank')return [black(),U('any',{cross:true})];if(k==='friendly_fire')return [U('enemy'),U('enemy')];
 if(['battlefield_control','compel'].includes(k))return [U(),U('any')];
 if(k==='new_orders')return [U('ally'),U('enemy')];
 if(k==='pick_a_fight')return [U('ally',{hero:true}),U('enemy')];
 if(k==='murder_plot')return [black(),U('enemy')];
 if(k==='cunning_plan')return [U(),U()];if(k==='juke')return [U('ally'),U('ally')];
 if(k==='steal_strength')return [U(),U()];
 if(['berserkers_call','double_edge','enrage','fight_through_the_pain','fighting_instinct','gods_strength','heroic_resolve','kraken_shell','poised_to_strike','primal_roar','rising_anger','sucker_punch','tresdins_standards','whirling_death'].includes(k))return [red()];
 if(['collateral_damage','coordinated_assault','heartstopper_aura'].includes(k))return [U('any',{hero:true,color:'Black'})];
 if(k==='allseeing_ones_favor')return [U('any',{hero:true,color:'Green'})];
 if(['and_one_for_me','caught_unprepared','cleansing_rite','combat_training','coup_de_grace','crippling_blow','defensive_stance','soul_of_spring','spot_weakness','track'].includes(k))return [U('any',{hero:true})];
 if(k==='town_portal_scroll')return [U('ally',{hero:true})];if(['slay','bellow'].includes(k))return [U('any',{creep:true})];
 if(k==='whispers_of_madness')return [U('enemy')];return [U()];
}
function activeTargetSpec(k){
 if(['chen','helm_of_the_dominator'].includes(k))return [U('enemy',{creep:true})];
 if(k==='dark_seer')return [U('ally',{other:true}),L()];if(['blink_dagger','winter_wyvern','meepo'].includes(k))return [L()];
 if(k==='lich')return [U('ally',{other:true})];
 if(['lion','sniper','skywrath_mage','keenfolk_turret','keenfolk_musket'].includes(k))return [U()];
 if(['omniknight','rumusque_vestments'].includes(k))return [U()];if(k==='steam_cannon')return [U('any',{cross:true})];
 if(['assassins_apprentice','sister_of_the_veil','assassins_veil'].includes(k))return [U('enemy')];
 if(['rebel_decoy','phase_boots'].includes(k))return [U('ally',{other:true})];
 if(k==='shivas_guard')return [U()];if(k==='escape_route')return [U('ally',{hero:true})];if(k==='messenger_rookery')return [U('ally'),U('enemy')];return [];
}
root.ArtifactEngine={Game,slug,clone,targetSpec};if(typeof module!=='undefined')module.exports=root.ArtifactEngine;
})(typeof window!=='undefined'?window:globalThis);
