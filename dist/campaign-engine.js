/* Isolated campaign rules. Classic prototypes and catalogs are never patched. */
(function(root){'use strict';
const {Game,clone}=root.ArtifactEngine,D=root.ArtifactCampaignData;
const Deck=root.ArtifactCampaignDeck;
const SAVE_KEY='artifact.campaign.v1';
function fresh(){return {version:1,deckVersion:2,campActions:{},stage:0,completed:[],roster:['slark'],party:['slark'],loyalty:{slark:3},broken:[],growth:{attack:0,health:0},upgrades:{essence:0,guard:0},stigma:[1,1,1],resonance:0,gold:0,forge:false,scepter:false,scepterUsed:false,deck:['pounce','pounce','essence','essence','guard','guard','guard','salve','salve','blade','pact','shadow'].map(k=>'story_'+k),journal:[],battle:null};}
function valid(p){
 const rosterKeys=new Set(['slark',...D.stages.flatMap(s=>[s.recruit,s.bonusRecruit]).filter(Boolean)]),spellKeys=new Set(D.cards.filter(c=>c.key!=='story_scepter').map(c=>c.key)),finite=n=>Number.isFinite(n)&&n>=0;
 if(!(p&&p.version===1&&Number.isInteger(p.stage)&&p.stage>=0&&p.stage<=D.stages.length&&Array.isArray(p.roster)&&p.roster.every(k=>rosterKeys.has(k))&&Array.isArray(p.party)&&p.party[0]==='slark'&&p.party.length<=5&&new Set(p.party).size===p.party.length&&p.party.every(k=>p.roster.includes(k))&&Array.isArray(p.broken)&&p.broken.every(k=>p.roster.includes(k)&&k!=='slark')&&!p.party.some(k=>p.broken.includes(k))&&p.loyalty&&p.roster.every(k=>finite(p.loyalty[k])&&p.loyalty[k]<=5)&&p.growth&&finite(p.growth.attack)&&finite(p.growth.health)&&p.upgrades&&finite(p.upgrades.essence)&&finite(p.upgrades.guard)&&p.stigma?.length===3&&p.stigma.every(n=>finite(n)&&n<=3)&&finite(p.gold)&&finite(p.resonance)&&Array.isArray(p.deck)&&p.deck.length>=8&&p.deck.length<=30&&p.deck.every(k=>spellKeys.has(k))&&Array.isArray(p.completed)&&Array.isArray(p.journal)))return false;
 if(p.cardReward&&(!Array.isArray(p.cardReward.offers)||p.cardReward.offers.length!==3||new Set(p.cardReward.offers).size!==3||!p.cardReward.offers.every(k=>spellKeys.has(k))||p.cardReward.stage!==p.stage-1))return false;
 if(p.weapon&&!['short_sword','broadsword','claymore'].includes(p.weapon))return false;
 if(p.battle){const b=p.battle,st=D.stages[p.stage],unitKeys=new Set([...rosterKeys,...D.stages.map(s=>s.enemy),'melee_creep']);if(!st||b.chapter!==p.stage||b.activeLanes!==st.lanes||!['action','ended'].includes(b.phase)||![null,0,1].includes(b.winner)||!Number.isInteger(b.lane)||b.lane<0||b.lane>=st.lanes||!Array.isArray(b.units)||!b.units.every(u=>unitKeys.has(u.k)&&[0,1].includes(u.owner)&&Number.isFinite(u.damage)&&Array.isArray(u.mods)&&u.items)||!Array.isArray(b.lanes)||b.lanes.length!==3||!b.players?.[0]?.hand?.every(h=>spellKeys.has(h.k)||h.k==='story_scepter'&&b.profile?.scepter)||!b.profile||!Number.isFinite(b.seed)||!Number.isFinite(b.serial))return false;}
 return true;
}
function chooseParty(p,key){if(key==='slark')throw Error('小鱼人必须参与每一场战斗');if(!p.roster.includes(key)||p.broken.includes(key))throw Error('这位同伴目前无法同行');if(p.party.includes(key))p.party=p.party.filter(k=>k!==key);else{if(p.party.length>=5)throw Error('最多选择 5 名英雄');p.party.push(key);}}
function reward(p,g,choice){if(g.s.winner!==0||g.s.chapter!==p.stage||p.completed.includes(p.stage))throw Error('这场战斗尚未获胜或已经领取奖励');if(!['bond','train','power'].includes(choice))throw Error('请选择一种道路');const st=D.stages[p.stage];
 p.completed.push(p.stage);p.growth.health+=1;p.gold+=35;p.resonance+=1;
 if(st.recruit&&!p.roster.includes(st.recruit)){p.roster.push(st.recruit);p.loyalty[st.recruit]=2;if(p.party.length<5)p.party.push(st.recruit);}
 if(st.bonusRecruit&&!p.roster.includes(st.bonusRecruit)){p.roster.push(st.bonusRecruit);p.loyalty[st.bonusRecruit]=2;}
 if(choice==='bond'){for(const k of p.party)p.loyalty[k]=Math.min(5,(p.loyalty[k]||2)+1);p.upgrades.guard=Math.min(4,p.upgrades.guard+1);if(p.stage===1)p.stigma=p.stigma.map(n=>Math.max(0,n-1));}
 if(choice==='train'){p.growth.attack+=.5;p.upgrades.essence=Math.min(4,p.upgrades.essence+1);}
 if(choice==='power'){p.resonance+=2;p.growth.attack+=1;p.stigma=p.stigma.map(n=>Math.min(3,n+1));for(const k of p.party.filter(k=>k!=='slark'))p.loyalty[k]=Math.max(0,(p.loyalty[k]||2)-1);}
 if(st.forge)p.forge=true;if(st.scepter)p.scepter=true;if(st.clearStigma!==undefined)p.stigma[st.clearStigma]=0;
 p.scepterUsed=!!g.s.scepterUsed;p.journal.push({stage:p.stage,title:st.title,choice,clue:st.clue});p.cardReward=Deck?{stage:p.stage,offers:Deck.offers(p,p.stage)}:null;p.campActions={};p.stage++;p.battle=null;
}
function abandon(p,key){if(key==='slark'||!p.roster.includes(key)||p.broken.includes(key))throw Error('无法决裂');p.broken.push(key);p.party=p.party.filter(k=>k!==key);p.loyalty[key]=0;p.gold+=50;p.growth.attack+=1;p.resonance+=2;}
class CampaignGame extends Game{
 constructor(cards){const art=Object.fromEntries([...cards,...D.heroes].map(c=>[c.key,c.art]));super([...cards,...D.heroes,...D.cards.map((c,i)=>({...c,id:90000+i,en:c.name,art:art[c.portrait],abilities:[],gold:0}))]);}
 begin(p,seed=91417){if(p.cardReward)throw Error('请先选择或跳过卡牌奖励');if(!valid(p)||p.stage>=D.stages.length)throw Error('剧情存档或章节无效');const st=D.stages[p.stage];this.s={version:1,chapter:p.stage,profile:clone(p),seed:seed+p.stage*7919,serial:0,round:1,lane:0,phase:'action',turn:0,initiative:0,passes:0,winner:null,units:[],players:[0,1].map(owner=>({name:owner?'追猎者':'归航者',gold:0,deck:[],hand:[],discard:[],itemDeck:[],shop:null,heroes:[],eclipse:0})),lanes:Array.from({length:3},()=>({towers:[0,1].map(()=>({hp:st.kind==='defend'?(st.coreHp||34):22+p.stage,max:st.kind==='defend'?(st.coreHp||34):22+p.stage,fallen:false,damageRound:0,regen:0})),mana:[5,5],manaBase:[0,0],improvements:[[],[]]})),events:[],log:[],activeLanes:st.lanes,alarm:0,rewound:false,scepterUsed:p.scepterUsed,relocated:false};
 p.party.forEach((k,i)=>{const lane=Number.isInteger(p.placements?.[k])?p.placements[k]%st.lanes:i%st.lanes;const u=this.spawn(k,0,lane,this.all(0,lane).length);const c=this.card(k);if(k==='slark')this.buff(u,{attack:Math.floor(p.growth.attack*(st.drain?.35:1))+(st.drain?0:Math.floor(p.resonance/4)),health:p.growth.health});else this.buff(u,{health:8+Math.floor(p.stage/2),attack:Math.floor(p.stage/5)+(p.loyalty[k]>=4?1:0)});if(k==='slark'&&(p.weapon||p.forge&&st.id!==8))u.items.Weapon={k:p.weapon||'short_sword'};if(st.drain&&k==='slark')u.damage=Math.min(this.stats(u).health-1,Math.floor(p.resonance/3));});
 // A visible ally on an otherwise empty front keeps small parties viable; never counts as a hero.
 for(let l=0;l<st.lanes;l++)if(!this.all(0,l).length)this.spawnAlly(l);
 const n=st.kind==='stealth'?3:Math.max(st.lanes,p.party.length);for(let i=0;i<n;i++)this.spawnEnemy(i%st.lanes,i===0?st.enemy:'melee_creep',i===0);
 if(st.echo)for(const k of p.broken)this.spawnEnemy(this.s.units.length%st.lanes,k,true,.6);
 if(st.rule==='stone')this.buff(this.all(1)[0],{armor:2,immune:1},'round');
 if(st.rule==='web')for(let l=0;l<st.lanes;l++)this.spawnEnemy(l,'melee_creep',false,.65);
 this.s.players[0].deck=this.shuffle(p.deck);this.drawCards(5);if(st.kind==='rewind'&&!this.s.players[0].hand.some(h=>h.k.startsWith('story_rewind')))this.s.players[0].hand.push({uid:this.id(),k:'story_rewind',lock:0});if(st.kind==='stealth'){for(const u of this.all(1)){const hp=u.hero?20:8;this.buff(u,{health:hp-this.stats(u).health});}this.s.players[0].hand.push({uid:this.id(),k:'story_silence',lock:0});}for(let l=0;l<st.lanes;l++)this.assignArrows(l);if(st.pursuit){const hunter=this.all(1).find(u=>u.hero);if(hunter)hunter.items.Weapon={k:'blink_dagger'};this.planPursuit();}this.s.players[0].heroes=[...p.party];this.s.players[1].heroes=this.all(1).filter(u=>u.hero).map(u=>u.k);this.emit('round',st.title+' · 第 1 回合');return this.s;
 }
 emit(type,text,data={}){if(type==='combat'&&!['defend','assault'].includes(this.stage().kind))data.attacks=data.attacks.filter(a=>a.target);if(type==='lane'&&this.s.lane>=this.s.activeLanes)return;if(type==='draw')text=text.replace('天辉','同行者');return super.emit(type,text,data);}
 stage(){return D.stages[this.s.chapter];}
 maxMana(){return Math.min(8,4+this.s.round);}
 abilities(){return [];}
 canPlay(p,h){if(p!==0||this.s.phase!=='action')return '当前不能出牌';const c=this.card(h?.k);if(!c)return '找不到这张牌';if(h.k==='story_scepter'&&this.s.scepterUsed)return '神杖已使用';return this.s.lanes[this.s.lane].mana[0]<c.mana?'当前线路魔力不足':'';}
 targets(k){const c=this.card(k);if(c.target==='move')return [{kind:'unit',side:'ally',hero:true,cross:true},{kind:'lane'}];if(c.target==='lane')return [{kind:'lane'}];return [{kind:'unit',side:c.target==='enemy'?'enemy':'ally',hero:c.target==='hero'}];}
 pass(p){if(p!==0)throw Error('剧情只有玩家行动阶段');this.s.events=[];this.combat();}
 play(p,id,targets=[]){const h=this.s.players[0].hand.find(h=>h.uid===Number(id)),why=this.canPlay(p,h);if(why)throw Error(why);const c=this.card(h.k);if(c.target==='lane'&&targets[0]!==this.s.lane)throw Error('只能在当前战线使用');const before=new Map(this.s.units.map(u=>[u.uid,{uid:u.uid,k:u.k,name:this.card(u.k).name,owner:u.owner,lane:u.lane,alive:u.alive,...this.stats(u),items:JSON.stringify(u.items)}]));this.cast(h.k,c.target==='lane'?null:targets[0],targets[1]);const ev=this.s.events.find(e=>e.type==='cast');ev.type='card';ev.owner=0;ev.label=c.name;ev.targets=targets.map((t,i)=>c.target==='lane'||c.target==='move'&&i===1?{kind:'lane',lane:t,name:['上路','中路','下路'][t]}:{kind:'unit',...before.get(t)});ev.outcomes=[];
 for(const u of this.s.units){const old=before.get(u.uid),now=this.stats(u),changes=[];if(!old)changes.push('进入战场');else{if(old.items!==JSON.stringify(u.items))changes.push('装备更新');if(old.lane!==u.lane&&u.alive)changes.push('转移至'+['上路','中路','下路'][u.lane]);if(old.attack!==now.attack)changes.push('攻击'+(now.attack-old.attack));if(old.armor!==now.armor)changes.push('护甲'+(now.armor-old.armor));if(old.alive&&!u.alive)changes.push('阵亡');}
 for(const e of this.s.events.filter(e=>e.unit===u.uid&&['damage','heal'].includes(e.type)))changes.push((e.type==='heal'?'回复 +':'伤害 −')+e.amount);if(changes.length)ev.outcomes.push({uid:u.uid,k:u.k,name:this.card(u.k).name,owner:u.owner,lane:u.alive?u.lane:old?.lane,changes});}return this.s;
 }
 planPursuit(){if(!this.stage().pursuit)return;const hunter=this.all(1).find(u=>u.hero);if(!hunter)return;const candidates=this.all(0).filter(u=>u.hero&&u.lane!==hunter.lane).sort((a,b)=>this.stats(a).hp-this.stats(b).hp||a.uid-b.uid);const target=candidates[0]||this.all(0).find(u=>u.hero);if(!target)return;this.s.pursuitIntent={unit:hunter.uid,from:hunter.lane,lane:target.lane,target:target.uid,round:this.s.round+1};this.emit('intent',this.card(hunter.k).name+'准备在下轮闪烁至'+['上路','中路','下路'][target.lane]+'追杀'+this.card(target.k).name);}
 executePursuit(){const intent=this.s.pursuitIntent,u=this.get(intent?.unit);if(!u?.alive)return;if(this.flag(u,'disarm')||this.flag(u,'stun')){this.emit('intent','追猎者受到控制，本次闪烁取消');return;}const from=u.lane;this.move(u,intent.lane);this.emit('ability',this.card(u.k).name+'使用跳刀：'+['上路','中路','下路'][from]+' → '+['上路','中路','下路'][u.lane],{card:'blink_dagger',owner:1,label:'闪烁追杀',source:{uid:u.uid,lane:from,name:this.card(u.k).name},targets:[{kind:'unit',uid:u.uid,lane:u.lane,name:this.card(u.k).name}],outcomes:[{uid:u.uid,lane:u.lane,name:this.card(u.k).name,changes:['转移至'+['上路','中路','下路'][u.lane]]}]});}

 spawnAlly(l){const u=this.spawn('melee_creep',0,l);this.buff(u,{attack:1,health:3});return u;}
 spawnEnemy(l,k,boss=false,scale=1){const st=this.stage(),u=this.spawn(k,1,l);const c=this.card(k),pressure=st.stigma===undefined?0:this.s.profile.stigma[st.stigma];const hp=(boss?st.hp:9+Math.floor(st.id*.65))*scale+pressure;const atk=(boss?st.atk:3+Math.floor(st.id/6))*scale;this.buff(u,{health:Math.round(hp)-c.health,attack:Math.round(atk)-c.attack,armor:(boss?Math.min(2,c.armor||0):0)-(c.armor||0)});return u;}
 drawCards(n){const pl=this.s.players[0];for(let i=0;i<n&&pl.hand.length<9;i++){if(!pl.deck.length){pl.deck=this.shuffle(pl.discard.filter(k=>D.cards.some(c=>c.key===k)));pl.discard=[];}if(!pl.deck.length)break;this.draw(0,1);}}
 beforeAction(l){if(l<this.s.activeLanes)super.beforeAction(l);}
 openShop(){} // Campaign has an out-of-battle camp, never the Classic round shop.
 ready(){return [];}
 checkWin(){if(!this.s||this.s.initializing||this.s.winner!==null)return;const st=this.stage();let win=null,reason='';
 if(!this.all(0).some(u=>u.hero)){win=1;reason='出战英雄全部阵亡';}
 else if(st.kind==='defend'&&this.s.lanes.slice(0,st.lanes).some(l=>l.towers[0].hp<=0)){win=1;reason='守护的灯火被摧毁';}
 else if(st.kind==='stealth'&&this.s.alarm>=2){win=1;reason='警戒达到 2，王宫封锁';}
 else if(st.kind==='assault'&&this.s.lanes.slice(0,st.lanes).every(l=>l.towers[1].hp<=0)){win=0;reason='所有封印已被摧毁';}
 else if(!['defend','assault'].includes(st.kind)&&!this.all(1).length&&(st.kind!=='rewind'||this.s.rewound)){win=0;reason='敌人已被击败';}
 if(win!==null){this.s.winner=win;this.s.phase='ended';this.emit('victory',reason);}
 }
 combatForecast(l=this.s.lane){if(this.stage().kind!=='stealth'){const f=super.combatForecast(l);if(!['defend','assault'].includes(this.stage().kind))f.tower=[0,0];return f;}const allies=this.all(0,l);for(const u of allies)u.mods.push({disarm:1,source:'stealth-preview'});try{return super.combatForecast(l);}finally{for(const u of allies)u.mods=u.mods.filter(m=>m.source!=='stealth-preview');}}
 combat(){const current=this.s.lane;super.combat();if(this.s.winner!==null)return;if(current>=this.s.activeLanes-1){this.s.lane=current;this.nextRound();}else{this.s.turn=0;this.s.passes=0;}}
 nextRound(){const st=this.stage();if(st.kind==='defend'&&this.s.round>=st.rounds){this.s.winner=0;this.s.phase='ended';this.emit('victory','潮水退去，灯火仍在');return;}
 if(this.s.round>=st.rounds){this.s.winner=1;this.s.phase='ended';this.emit('victory','时间耗尽，追猎者封锁了退路');return;}
 this.s.round++;this.s.lane=0;this.s.phase='action';this.s.turn=0;this.s.passes=0;this.s.relocated=false;
 this.executePursuit();for(const u of this.s.units)u.mods=u.mods.filter(m=>m.until!=='round');
 for(let l=0;l<st.lanes;l++){this.s.lanes[l].mana=[Math.min(8,4+this.s.round),5];if(st.kind==='defend')this.spawnEnemy(l,'melee_creep');if(st.rule==='web'&&this.s.round%2===0)this.spawnEnemy(l,'melee_creep',false,.7);this.assignArrows(l);}
 if(st.kind==='rewind'&&!this.s.rewound)for(const u of this.all(1))this.heal(u,999);
 if(this.s.profile.deckVersion===2){const pl=this.s.players[0];pl.discard.push(...pl.hand.filter(h=>h.k!=='story_scepter').map(h=>h.k));pl.hand=[];}this.drawCards(this.s.profile.deckVersion===2?5:3);if(st.kind==='rewind'&&!this.s.rewound&&!this.s.players[0].hand.some(h=>h.k.startsWith('story_rewind')))this.s.players[0].hand.push({uid:this.id(),k:'story_rewind',lock:0});if(st.kind==='stealth'){const pl=this.s.players[0];if(pl.hand.length>=9)pl.discard.push(pl.hand.pop().k);pl.hand.push({uid:this.id(),k:'story_silence',lock:0});}this.beforeAction(0);this.planPursuit();this.emit('round','第 '+this.s.round+' 回合 · 抽取新牌');
 }
 relocate(uid,l){const u=this.get(uid);if(this.s.phase!=='action'||this.s.relocated||!u?.alive||u.owner!==0||!u.hero||!Number.isInteger(l)||l<0||l>=this.s.activeLanes)throw Error('每轮只能调动一位己方英雄');this.move(u,l);this.s.relocated=true;for(let i=0;i<this.s.activeLanes;i++)this.assignArrows(i);}
 available(){const cards=[...D.cards];if(!this.s.profile.scepter||this.s.scepterUsed)return cards.filter(c=>c.key!=='story_scepter');return cards;}
 cast(key,uid,destination=null){if(this.s.phase!=='action')throw Error('战斗已经结束');const c=this.available().find(c=>c.key===key),pl=this.s.players[0],h=pl.hand.find(h=>h.k===key);const special=key==='story_scepter'&&this.s.profile.scepter&&!this.s.scepterUsed;if(!c||!h&&!special)throw Error('手中没有这张牌');const l=this.s.lane;if(this.s.lanes[l].mana[0]<c.mana)throw Error('当前线路魔力不足');const u=this.get(uid);
 if(c.target==='move'&&(!Number.isInteger(destination)||destination<0||destination>=this.s.activeLanes||!u?.hero||u.owner!==0||!u.alive))throw Error('请选择己方英雄与有效目标战线');
 if(!['lane','move'].includes(c.target)&&(!u?.alive||u.lane!==l||(c.target==='enemy'?u.owner!==1:u.owner!==0)||c.target==='hero'&&!u.hero))throw Error('请选择当前线路的'+(c.target==='enemy'?'敌方单位':c.target==='hero'?'己方英雄':'己方单位'));
 this.s.events=[];if(h){pl.hand.splice(pl.hand.indexOf(h),1);if(key!=='story_scepter')pl.discard.push(key);}this.s.lanes[l].mana[0]-=c.mana;this.emit('cast',c.name+' → '+(u?this.card(u.k).name:'当前战线'),{card:key,unit:u?.uid,fx:c.fx});const slark=this.all(0).find(v=>v.k==='slark'),p=this.s.profile;
 if(this.stage().kind==='stealth'&&['story_pounce','story_essence','story_pact','story_cleave','story_venom','story_ambush'].includes(c.baseKey||key))this.s.alarm++;
 const baseKey=c.baseKey||key,up=c.upgraded?1:0;switch(baseKey){
 case 'story_pounce':this.damage(u,6+3*up);this.buff(u,{disarm:1},'round');break;
 case 'story_essence':this.damage(u,5+p.upgrades.essence+3*up,true);if(slark)this.buff(slark,{attack:1});if(p.forge)this.s.lanes[l].mana[0]+=p.upgrades.essence>=3?2:1;break;
 case 'story_pact':for(const e of this.all(1,l))this.damage(e,4+2*up,true);if(slark){this.cleanse(slark);this.damage(slark,2,true);}break;
 case 'story_shadow':this.heal(u,7+3*up);this.buff(u,{armor:1+up},'round');break;
 case 'story_guard':this.buff(u,{armor:3+2*up},'round');this.heal(u,p.upgrades.guard);break;
 case 'story_salve':this.heal(u,6+3*up);break;
 case 'story_reinforce':{const ally=this.spawnAlly(l);if(up)this.buff(ally,{attack:2,health:2});}this.assignArrows(l);break;
 case 'story_blade':u.items.Weapon={k:up?'broadsword':'short_sword'};this.emit('equip',c.name+'装备完成',{unit:u.uid});break;
 case 'story_silence':this.damage(u,this.stage().kind==='stealth'?8+3*up:3+2*up,true);this.buff(u,{disarm:1},'round');break;
 case 'story_rewind':this.heal(u,10+4*up);this.cleanse(u);this.s.rewound=true;break;
 case 'story_scepter':this.s.scepterUsed=true;for(const a of this.all(0))this.heal(a,12);for(const e of this.all(1))this.damage(e,8,true);break;
 case 'story_venom':this.damage(u,2+2*up,true);this.buff(u,{poison:1});break;
 case 'story_bulwark':this.buff(u,{armor:5+2*up},'round');this.drawCards(1);break;
 case 'story_insight':this.drawCards(2+up);break;
 case 'story_blink':this.move(u,destination);this.buff(u,{armor:1},'round');for(let i=0;i<this.s.activeLanes;i++)this.assignArrows(i);break;
 case 'story_cleave':for(const e of this.all(1,l))this.damage(e,5+2*up);break;
 case 'story_renew':for(const a of this.all(0,l)){this.heal(a,5+3*up);this.cleanse(a);}break;
 case 'story_ambush':{const extra=this.flag(u,'poison')||this.flag(u,'disarm');this.damage(u,3+2*up+(extra?4+2*up:0),true);break;}
 case 'story_resolve':this.buff(u,{deathShield:1},'round');break;
 case 'story_bond':this.heal(u,(p.loyalty[u.k]===0?3:5)+up);this.buff(u,{attack:(p.loyalty[u.k]>=4?3:p.loyalty[u.k]===0?1:2)+up});break;
 }
 if(this.stage().rule==='mirror'&&c.fx==='strike'){const target=this.all(0,l)[0];if(target)this.damage(target,2,true);this.emit('cast','拉比克的镜像反射了 2 点伤害');}
 this.sweep();
 }
 cleanse(u){u.mods=u.mods.filter(m=>!(m.stun||m.disarm||m.silence||m.poison||m.attack<0||m.armor<0));}
}
root.ArtifactCampaign={CampaignGame,fresh,valid,chooseParty,reward,abandon,SAVE_KEY};
if(typeof module!=='undefined')module.exports=root.ArtifactCampaign;
})(typeof window==='undefined'?globalThis:window);
