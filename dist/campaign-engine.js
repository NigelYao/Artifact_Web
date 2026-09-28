/* Isolated campaign rules. Classic prototypes and catalogs are never patched. */
(function(root){'use strict';
const {Game,clone}=root.ArtifactEngine,D=root.ArtifactCampaignData;
const Deck=root.ArtifactCampaignDeck;
const T=root.ArtifactI18n?root.ArtifactI18n.T:(z,e)=>z;
/* Register static messages before resumed saved logs are rendered. */
[['小鱼人必须参与每一场战斗','Slark fights in every battle',"Сларк участвует в каждом бою"],
['这位同伴目前无法同行','This companion cannot travel right now',"Этот спутник сейчас не может идти с вами"],
['最多选择 5 名英雄','At most five heroes may travel',"В отряд можно взять до пяти героев"],
['这段抉择已经作过','This choice has already been made',"Этот выбор уже сделан"],
['这段抉择的时机未到','It is not time for this choice',"Время этого выбора ещё не пришло"],
['请选择一个去留','Choose a way forward',"Выберите дальнейший путь"],
['这一幕尚未获胜','This scene is not yet won',"Эта сцена ещё не пройдена"],
['本关没有下一幕','There is no next scene',"Следующей сцены нет"],
['这场战斗尚未获胜或已经领取奖励','This battle is not won, or its reward was already claimed',"Бой ещё не выигран или награда уже получена"],
['本关还有未完成的幕','Later scenes of this stage remain',"В этой главе остались непройденные сцены"],
['请选择一种道路','Choose a path',"Выберите путь"],
['无法决裂','You cannot sever this bond',"Эту связь нельзя разорвать"],
['请先选择或跳过卡牌奖励','Choose or skip the card reward first',"Сначала выберите карту награды или пропустите её"],
['剧情存档或章节无效','The save or chapter is invalid',"Неверное сохранение или глава"],
['追猎者','the Hunters',"Охотники"],
['归航者','the Homeward',"Возвращающиеся"],
['龙族的试炼：主将每轮回复 4 生命；龙蛋为持蛋者挡下 2 点护甲','Trial of the dragonkin: the champion regenerates 4 each round; the egg grants its bearer 2 armor',"Испытание драконов: предводитель восстанавливает 4 здоровья каждый раунд; яйцо даёт носителю 2 брони"],
['同行者','companions',"спутники"],
['当前不能出牌','You cannot play right now',"Сейчас нельзя разыграть карту"],
['找不到这张牌','That card does not exist',"Такой карты нет"],
['神杖已使用','The Scepter has been used',"Скипетр уже использован"],
['当前线路魔力不足','Not enough mana in this lane',"Недостаточно маны на этой линии"],
['剧情只有玩家行动阶段','Only the player acts in the campaign',"В кампании действует только игрок"],
['只能在当前战线使用','Only usable in the current lane',"Можно применить только на текущей линии"],
['上路','Top',"Верхняя"],
['中路','Mid',"Средняя"],
['下路','Bot',"Нижняя"],
['进入战场','enters the fray',"вступает в бой"],
['装备更新','gear changed',"снаряжение изменено"],
['转移至','moves to ',"переходит на линию "],
['攻击','attack ',"атака "],
['护甲','armor ',"броня "],
['阵亡','falls',"погибает"],
['回复 +','heal +',"лечение +"],
['伤害 −','damage −',"урон −"],
['追猎者受到控制，本次闪烁取消','The hunter is controlled — the blink is cancelled',"Охотник обезврежен: прыжок отменён"],
['闪烁追杀','Blink Pursuit',"Прыжок охотника"],
['月纹宫卫就位——必须在当轮击倒，否则警报响彻','A moon-marked sentry takes post — it must fall within this round, or the alarm rings',"Лунный часовой занял пост: убейте его в этом раунде, иначе поднимется тревога"],
['出战英雄全部阵亡','Every hero on the field has fallen',"Все герои отряда погибли"],
['守护的灯火被摧毁','A warded lamp has been destroyed',"Защищаемый огонь уничтожен"],
['警戒达到 2，王宫封锁','The alarm reached 2 — the palace is sealed',"Тревога достигла 2: дворец заперт"],
['所有封印已被摧毁','Every seal has been broken',"Все печати разрушены"],
['卫长倒下，哨位无人再补','The warden has fallen; no one is left to hold the post',"Начальник стражи пал, некому сменить часовых"],
['敌人已被击败','The enemies are beaten',"Враги повержены"],
['宫卫活到了轮末——警报响彻整座宫殿','A sentry survived to round’s end — the alarm rings through the palace',"Часовой дожил до конца раунда: во дворце звучит тревога"],
['潮水退去，灯火仍在','The tide withdraws; the lamps still burn',"Прилив отступает, огни всё ещё горят"],
['时间耗尽，追猎者封锁了退路','Time ran out; the hunters sealed the way back',"Время истекло: охотники отрезали путь назад"],
['狂暴升温：敌将攻击 +1','The rampage swells — the champion gains +1 attack',"Неистовство нарастает: предводитель получает +1 атаку"],
['魅影蔽纱：一名敌人没入残纱','Sisters’ Shroud: a foe slips into the veil',"Покров сестёр: враг скрывается под вуалью"],
['魅影蔽纱',"Sisters' Shroud","Покров сестёр"],
['公会什一税抽走了力气','The Guild Tithe saps a hero’s strength',"Десятина гильдии отнимает силу героя"],
['公会什一税','Guild Tithe',"Десятина гильдии"],
['每轮只能调动一位己方英雄','Only one hero may be relocated each round',"За раунд можно переместить только одного героя"],
['战斗已经结束','The battle is over',"Бой завершён"],
['手中没有这张牌','That card is not in hand',"Этой карты нет в руке"],
['请选择己方英雄与有效目标战线','Choose one of your heroes and a valid lane',"Выберите своего героя и допустимую линию"],
['请选择当前线路的','Choose a target in this lane: ',"Выберите цель на этой линии: "],
['敌方单位','an enemy',"враг"],
['己方英雄','one of your heroes',"ваш герой"],
['己方单位','an ally',"союзник"],
['拉比克的镜像反射了 2 点伤害','Rubick’s mirror reflects 2 damage',"Зеркало Рубика отражает 2 урона"],
['烙印悬赏','Mark of the Guild',"Метка гильдии"],
['请从剧情营地开始战斗','Start battles from the campaign camp',"Начните бой из лагеря кампании"],
['暗月残片','Dark Moon Shards',"Осколки тёмной луны"],
['返回旅程','Back to the journey',"К путешествию"],
['单人剧情 · 因果构筑','Solo story · causality building',"Одиночная история · сборка колоды"],
['切换声音','Toggle sound',"Переключить звук"],
['设置','Settings',"Настройки"],
['战斗记录','Battle log',"Журнал боя"],
['警戒 ','Alarm ',"Тревога "],
['哨位 ','Sentry ',"Часовые "],
['跳刀预告：下轮追杀 ','Blink telegraphed: next round it hunts in ',"Следующий прыжок: охота на линии "],
['控制追猎者可打断','control the hunter to interrupt',"Обезвредьте охотника, чтобы прервать прыжок"],
['章节完成','CHAPTER COMPLETE','ГЛАВА ПРОЙДЕНА'],
['本幕完成','SCENE CLEAR','СЦЕНА ЗАВЕРШЕНА'],
['旅程中断','JOURNEY INTERRUPTED','ПУТЕШЕСТВИЕ ПРЕРВАНО'],
['此关告捷','Stage cleared',"Глава пройдена"],
['此幕落幕','Scene cleared',"Сцена завершена"],
['暂别此岸','Leave this shore, for now',"Пока покинем этот берег"],
['选择奖励 · 继续旅程','Choose a boon · continue',"Выбрать награду · продолжить"],
['进入下一幕','To the next scene',"К следующей сцене"],
['返回营地 · 调整构筑','Back to camp · rebuild',"В лагерь · изменить колоду"],
['查看战斗记录','View the battle log',"Посмотреть журнал боя"],
['主动撤退，关前成长与牌组保留','Withdrew — growth and deck from before the stage are kept',"Отступление: рост и колода до начала главы сохранены"]].forEach(args=>T(...args));
const laneZh=['上路','中路','下路'],laneEn=['Top','Mid','Bot'],laneRu=['Верхняя','Средняя','Нижняя'];
const canonical=v=>root.ArtifactI18n?.source?root.ArtifactI18n.source(v):v;
const SAVE_KEY='artifact.campaign.v1';
function fresh(){return {version:1,deckVersion:2,campActions:{},stage:0,scene:0,completed:[],choices:{},nextMods:null,tuning:{},drill:0,roster:['slark'],party:['slark'],loyalty:{slark:3},broken:[],growth:{attack:0,health:0},upgrades:{essence:0,guard:0},stigma:[1,1,1],resonance:0,gold:0,forge:false,scepter:false,scepterUsed:false,deck:['pounce','pounce','essence','essence','guard','guard','guard','salve','salve','blade','pact','shadow'].map(k=>'story_'+k),journal:[],battle:null};}
function sceneCount(stage){return stage&&stage.scenes?stage.scenes.length:1;}
function valid(p){
 const rosterKeys=new Set(['slark',...D.stages.flatMap(s=>[s.recruit,s.bonusRecruit]).filter(Boolean)]),spellKeys=new Set(D.cards.filter(c=>c.key!=='story_scepter').map(c=>c.key)),finite=n=>Number.isFinite(n)&&n>=0,plainObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
 if(!(p&&p.version===1&&Number.isInteger(p.stage)&&p.stage>=0&&p.stage<=D.stages.length&&Number.isInteger(p.scene)&&p.scene>=0&&Array.isArray(p.roster)&&p.roster.every(k=>rosterKeys.has(k))&&Array.isArray(p.party)&&p.party[0]==='slark'&&p.party.length<=5&&new Set(p.party).size===p.party.length&&p.party.every(k=>p.roster.includes(k))&&Array.isArray(p.broken)&&p.broken.every(k=>p.roster.includes(k)&&k!=='slark')&&!p.party.some(k=>p.broken.includes(k))&&p.loyalty&&p.roster.every(k=>finite(p.loyalty[k])&&p.loyalty[k]<=5)&&p.growth&&finite(p.growth.attack)&&finite(p.growth.health)&&p.upgrades&&finite(p.upgrades.essence)&&finite(p.upgrades.guard)&&p.stigma?.length===3&&p.stigma.every(n=>finite(n)&&n<=3)&&finite(p.gold)&&finite(p.resonance)&&finite(p.drill)&&plainObj(p.choices)&&plainObj(p.tuning)&&Object.values(p.tuning).every(finite)&&(p.nextMods===null||plainObj(p.nextMods))&&Array.isArray(p.deck)&&p.deck.length>=8&&p.deck.length<=30&&p.deck.every(k=>spellKeys.has(k))&&Array.isArray(p.completed)&&Array.isArray(p.journal)))return false;
 if(p.scene>=sceneCount(D.stages[p.stage]))return false;
 if(p.cardReward&&(!Array.isArray(p.cardReward.offers)||p.cardReward.offers.length!==3||new Set(p.cardReward.offers).size!==3||!p.cardReward.offers.every(k=>spellKeys.has(k))||p.cardReward.stage!==p.stage-1))return false;
 if(p.weapon&&!['short_sword','broadsword','claymore'].includes(p.weapon))return false;
 if(p.battle){const b=p.battle,st=D.stages[p.stage],bs=b.scene??0,unitKeys=new Set([...rosterKeys,...D.units.map(u=>u.key),...D.stages.flatMap(s=>[s.enemy,...(s.scenes||[]).map(x=>x.enemy)]).filter(Boolean),'melee_creep']);if(!st||b.chapter!==p.stage||bs!==p.scene||!Number.isInteger(bs)||bs>=sceneCount(st)||b.activeLanes!==D.scene(st,bs).lanes||!['action','ended'].includes(b.phase)||![null,0,1].includes(b.winner)||!Number.isInteger(b.lane)||b.lane<0||b.lane>=D.scene(st,bs).lanes||!Array.isArray(b.units)||!b.units.every(u=>unitKeys.has(u.k)&&[0,1].includes(u.owner)&&Number.isFinite(u.damage)&&Array.isArray(u.mods)&&u.items)||!Array.isArray(b.lanes)||b.lanes.length!==3||!b.players?.[0]?.hand?.every(h=>spellKeys.has(h.k)||h.k==='story_scepter'&&b.profile?.scepter)||!b.profile||!Number.isFinite(b.seed)||!Number.isFinite(b.serial))return false;}
 return true;
}
function chooseParty(p,key){if(key==='slark')throw Error(T('小鱼人必须参与每一场战斗','Slark fights in every battle',"Сларк участвует в каждом бою"));if(!p.roster.includes(key)||p.broken.includes(key))throw Error(T('这位同伴目前无法同行','This companion cannot travel right now',"Этот спутник сейчас не может идти с вами"));if(p.party.includes(key))p.party=p.party.filter(k=>k!==key);else{if(p.party.length>=5)throw Error(T('最多选择 5 名英雄','At most five heroes may travel',"В отряд можно взять до пяти героев"));p.party.push(key);}}
function applyChoice(p,evId,optKey){const ev=(D.events||[]).find(e=>e.id===evId);if(!ev||p.choices?.[evId])throw Error(T('这段抉择已经作过','This choice has already been made',"Этот выбор уже сделан"));if(p.stage!==ev.after+1||!p.completed.includes(ev.after))throw Error(T('这段抉择的时机未到','It is not time for this choice',"Время этого выбора ещё не пришло"));const opt=ev.options.find(o=>o.key===optKey);if(!opt)throw Error(T('请选择一个去留','Choose a way forward',"Выберите дальнейший путь"));const fx=opt.fx||{};
 p.choices[evId]=optKey;if(fx.gold)p.gold+=fx.gold;if(fx.resonance)p.resonance+=fx.resonance;if(fx.growthAttack)p.growth.attack+=fx.growthAttack;if(fx.health)p.growth.health+=fx.health;if(fx.stigma)p.stigma=p.stigma.map(n=>Math.min(3,n+fx.stigma));if(fx.loyaltyAll)for(const k of p.party)p.loyalty[k]=Math.min(5,(p.loyalty[k]||2)+fx.loyaltyAll);if(fx.card&&p.deck.length<30&&!p.deck.includes(fx.card))p.deck.push(fx.card);if(fx.next)p.nextMods=Object.assign({forStage:p.stage},fx.next);
 p.journal.push({stage:ev.after,title:ev.title,titleEn:ev.titleEn,titleRu:ev.titleRu,choice:'event',pick:opt.label,pickEn:opt.labelEn,pickRu:opt.labelRu,clue:opt.journal,clueEn:opt.journalEn,clueRu:opt.journalRu});}
function advanceScene(p,g){if(!g?.s||g.s.winner!==0||g.s.chapter!==p.stage)throw Error(T('这一幕尚未获胜','This scene is not yet won',"Эта сцена ещё не пройдена"));const st=D.stages[p.stage];if(!st?.scenes||p.scene>=st.scenes.length-1)throw Error(T('本关没有下一幕','There is no next scene',"Следующей сцены нет"));if(g.s.contracts)p.gold+=g.s.contracts;if(g.s.scepterUsed)p.scepterUsed=true;p.scene++;p.battle=null;}
function reward(p,g,choice){if(g.s.winner!==0||g.s.chapter!==p.stage||p.completed.includes(p.stage))throw Error(T('这场战斗尚未获胜或已经领取奖励','This battle is not won, or its reward was already claimed',"Бой ещё не выигран или награда уже получена"));const st=D.stages[p.stage];if(g.s.scene!==sceneCount(st)-1)throw Error(T('本关还有未完成的幕','Later scenes of this stage remain',"В этой главе остались непройденные сцены"));if(!['bond','train','power','temper'].includes(choice))throw Error(T('请选择一种道路','Choose a path',"Выберите путь"));
 p.completed.push(p.stage);p.growth.health+=1;p.gold+=35;p.resonance+=1;
 if(g.s.contracts)p.gold+=g.s.contracts;
 if(st.recruit&&!p.roster.includes(st.recruit)){p.roster.push(st.recruit);p.loyalty[st.recruit]=2;if(p.party.length<5)p.party.push(st.recruit);}
 if(st.bonusRecruit&&!p.roster.includes(st.bonusRecruit)){p.roster.push(st.bonusRecruit);p.loyalty[st.bonusRecruit]=2;}
 if(choice==='bond'){for(const k of p.party)p.loyalty[k]=Math.min(5,(p.loyalty[k]||2)+1);p.upgrades.guard=Math.min(4,p.upgrades.guard+1);if(p.stage===1)p.stigma=p.stigma.map(n=>Math.max(0,n-1));}
 if(choice==='train'){p.growth.attack+=.5;p.upgrades.essence=Math.min(4,p.upgrades.essence+1);}
 if(choice==='power'){p.resonance+=2;p.growth.attack+=1;p.stigma=p.stigma.map(n=>Math.min(3,n+1));for(const k of p.party.filter(k=>k!=='slark'))p.loyalty[k]=Math.max(0,(p.loyalty[k]||2)-1);}
 if(choice==='temper'){p.drill=(p.drill||0)+1;if(Deck)Deck.tune(p);}
 if(st.forge)p.forge=true;if(st.scepter)p.scepter=true;if(st.clearStigma!==undefined)p.stigma[st.clearStigma]=0;if(st.grant&&p.deck.length<30&&!p.deck.includes(st.grant))p.deck.push(st.grant);
 p.scepterUsed=!!g.s.scepterUsed;p.journal.push({stage:p.stage,title:st.title,titleEn:st.titleEn,titleRu:st.titleRu,choice,clue:st.clue,clueEn:st.clueEn,clueRu:st.clueRu});p.cardReward=Deck?{stage:p.stage,offers:Deck.offers(p,p.stage)}:null;p.campActions={};p.stage++;p.scene=0;p.nextMods=null;p.battle=null;
}
function abandon(p,key){if(key==='slark'||!p.roster.includes(key)||p.broken.includes(key))throw Error(T('无法决裂','You cannot sever this bond',"Эту связь нельзя разорвать"));p.broken.push(key);p.party=p.party.filter(k=>k!==key);p.loyalty[key]=0;p.gold+=50;p.growth.attack+=1;p.resonance+=2;}
class CampaignGame extends Game{
 constructor(cards){const art=Object.fromEntries([...cards,...D.heroes,...D.units].map(c=>[c.key,c.art]));super([...cards,...D.heroes,...D.units,...D.cards.map((c,i)=>({...c,id:90000+i,en:c.en||c.name,art:art[c.portrait],abilities:[],gold:0}))]);}
 scene(){return D.scene(D.stages[this.s.chapter],this.s.scene||0);}
 stage(){return D.stages[this.s.chapter];}
 begin(p,seed=91417){if(p.cardReward)throw Error(T('请先选择或跳过卡牌奖励','Choose or skip the card reward first',"Сначала выберите карту награды или пропустите её"));if(!valid(p)||p.stage>=D.stages.length)throw Error(T('剧情存档或章节无效','The save or chapter is invalid',"Неверное сохранение или глава"));const st=D.stages[p.stage],sc=D.scene(st,p.scene||0),mods=p.nextMods&&p.nextMods.forStage===p.stage?p.nextMods:null;
 this.s={version:1,chapter:p.stage,scene:p.scene||0,profile:clone(p),seed:seed+p.stage*7919+p.scene*397,serial:0,round:1,lane:0,phase:'action',turn:0,initiative:0,passes:0,winner:null,units:[],players:[0,1].map(owner=>({name:canonical(owner?T('追猎者','the Hunters',"Охотники"):T('归航者','the Homeward',"Возвращающиеся")),gold:0,deck:[],hand:[],discard:[],itemDeck:[],shop:null,heroes:[],eclipse:0})),lanes:Array.from({length:3},()=>({towers:[0,1].map(()=>({hp:sc.kind==='defend'?(sc.coreHp||34):22+p.stage,max:sc.kind==='defend'?(sc.coreHp||34):22+p.stage,fallen:false,damageRound:0,regen:0})),mana:[5,5],manaBase:[0,0],improvements:[[],[]]})),events:[],log:[],activeLanes:sc.lanes,alarm:0,rewound:false,scepterUsed:p.scepterUsed,relocated:false,nextMods:mods};
 p.party.forEach((k,i)=>{const lane=Number.isInteger(p.placements?.[k])?p.placements[k]%sc.lanes:i%sc.lanes;const u=this.spawn(k,0,lane,this.all(0,lane).length);if(k==='slark')this.buff(u,{attack:Math.floor(p.growth.attack*(sc.drain?.35:1))+(sc.drain?0:Math.floor(p.resonance/4)),health:p.growth.health});else this.buff(u,{health:8+Math.floor(p.stage/2)+(p.drill||0),attack:Math.floor(p.stage/5)+(p.loyalty[k]>=4?1:0)});if(k==='slark'&&(p.weapon||p.forge&&st.id!==8))u.items.Weapon={k:p.weapon||'short_sword'};if(sc.drain&&k==='slark')u.damage=Math.min(this.stats(u).health-1,Math.floor(p.resonance/3));});
 const slark=this.all(0).find(u=>u.k==='slark');if(mods?.slarkDamage&&slark)slark.damage=Math.min(this.stats(slark).health-1,slark.damage+mods.slarkDamage);
 // A visible ally on an otherwise empty front keeps small parties viable; never counts as a hero.
 for(let l=0;l<sc.lanes;l++)if(!this.all(0,l).length)this.spawnAlly(l);
 const n=sc.kind==='stealth'?3:sc.kind==='sentry'?2:Math.max(sc.lanes,p.party.length);for(let i=0;i<n;i++)this.spawnEnemy(i%sc.lanes,i===0?sc.enemy:'melee_creep',i===0);
 if(sc.echo)for(const k of p.broken)this.spawnEnemy(this.s.units.length%sc.lanes,k,true,.6);
 if(sc.rule==='stone')this.buff(this.all(1)[0],{armor:2,immune:1},'round');
 if(sc.rule==='web')for(let l=0;l<sc.lanes;l++)this.spawnEnemy(l,'melee_creep',false,.65);
 if(sc.elite==='trial'){const b=this.all(1)[0];if(b)this.buff(b,{regen:4,armor:1});if(slark)this.buff(slark,{armor:2});this.emit('intent',T('龙族的试炼：主将每轮回复 4 生命；龙蛋为持蛋者挡下 2 点护甲','Trial of the dragonkin: the champion regenerates 4 each round; the egg grants its bearer 2 armor',"Испытание драконов: предводитель восстанавливает 4 здоровья каждый раунд; яйцо даёт носителю 2 брони"));}
 this.s.players[0].deck=this.shuffle(p.deck);this.drawCards(mods?.drawLess?4:5);if(sc.kind==='rewind'&&!this.s.players[0].hand.some(h=>h.k.startsWith('story_rewind')))this.s.players[0].hand.push({uid:this.id(),k:'story_rewind',lock:0});
 if(sc.kind==='stealth'){for(const u of this.all(1)){const hp=u.hero?20:8;this.buff(u,{health:hp-this.stats(u).health});}this.s.players[0].hand.push({uid:this.id(),k:'story_silence',lock:0});}
 if(sc.kind==='sentry'){this.s.players[0].hand.push({uid:this.id(),k:'story_silence',lock:0},{uid:this.id(),k:'story_silence',lock:0});this.spawnSentry();}
 for(let l=0;l<sc.lanes;l++)this.assignArrows(l);if(sc.pursuit){const hunter=this.all(1).find(u=>u.hero);if(hunter)hunter.items.Weapon={k:'blink_dagger'};this.planPursuit();}this.s.players[0].heroes=[...p.party];this.s.players[1].heroes=this.all(1).filter(u=>u.hero).map(u=>u.k);this.emit('round',T(st.title+(sceneCount(st)>1?' · 第 '+(this.s.scene+1)+' 幕':'')+' · 第 1 回合',st.titleEn+(sceneCount(st)>1?' · Scene '+(this.s.scene+1):'')+' · Round 1',st.titleRu+(sceneCount(st)>1?' · Сцена '+(this.s.scene+1):'')+' · Раунд 1'));return this.s;
 }
 emit(type,text,data={}){if(type==='combat'&&!['defend','assault'].includes(this.scene().kind))data.attacks=data.attacks.filter(a=>a.target);if(type==='lane'&&this.s.lane>=this.s.activeLanes)return;if(type==='draw')text=canonical(text).replace('天辉',canonical(T('同行者','companions',"спутники")));return super.emit(type,text,data);}
 maxMana(){return Math.min(8,4+this.s.round);}
 abilities(){return [];}
 canPlay(p,h){if(p!==0||this.s.phase!=='action')return T('当前不能出牌','You cannot play right now',"Сейчас нельзя разыграть карту");const c=this.card(h?.k);if(!c)return T('找不到这张牌','That card does not exist',"Такой карты нет");if(h.k==='story_scepter'&&this.s.scepterUsed)return T('神杖已使用','The Scepter has been used',"Скипетр уже использован");return this.s.lanes[this.s.lane].mana[0]<c.mana?T('当前线路魔力不足','Not enough mana in this lane',"Недостаточно маны на этой линии"):'';}
 targets(k){const c=this.card(k);if(c.target==='move')return [{kind:'unit',side:'ally',hero:true,cross:true},{kind:'lane'}];if(c.target==='lane')return [{kind:'lane'}];return [{kind:'unit',side:c.target==='enemy'?'enemy':'ally',hero:c.target==='hero'}];}
 pass(p){if(p!==0)throw Error(T('剧情只有玩家行动阶段','Only the player acts in the campaign',"В кампании действует только игрок"));this.s.events=[];this.combat();}
 play(p,id,targets=[]){const h=this.s.players[0].hand.find(h=>h.uid===Number(id)),why=this.canPlay(p,h);if(why)throw Error(why);const c=this.card(h.k);if(c.target==='lane'&&targets[0]!==this.s.lane)throw Error(T('只能在当前战线使用','Only usable in the current lane',"Можно применить только на текущей линии"));const before=new Map(this.s.units.map(u=>[u.uid,{uid:u.uid,k:u.k,name:this.card(u.k).name,owner:u.owner,lane:u.lane,alive:u.alive,...this.stats(u),items:JSON.stringify(u.items)}]));this.cast(h.k,c.target==='lane'?null:targets[0],targets[1]);const ev=this.s.events.find(e=>e.type==='cast');ev.type='card';ev.owner=0;ev.label=c.name;ev.targets=targets.map((t,i)=>c.target==='lane'||c.target==='move'&&i===1?{kind:'lane',lane:t,name:laneZh[t]}:{kind:'unit',...before.get(t)});ev.outcomes=[];
 for(const u of this.s.units){const old=before.get(u.uid),now=this.stats(u),changes=[];if(!old)changes.push('进入战场');else{if(old.items!==JSON.stringify(u.items))changes.push('装备更新');if(old.lane!==u.lane&&u.alive)changes.push('转移至'+laneZh[u.lane]);if(old.attack!==now.attack)changes.push('攻击'+(now.attack>old.attack?'+':'')+(now.attack-old.attack));if(old.armor!==now.armor)changes.push('护甲'+(now.armor>old.armor?'+':'')+(now.armor-old.armor));if(old.alive&&!u.alive)changes.push('阵亡');}
 for(const e of this.s.events.filter(e=>e.unit===u.uid&&['damage','heal'].includes(e.type)))changes.push((e.type==='heal'?'回复 +':'伤害 −')+e.amount);if(changes.length)ev.outcomes.push({uid:u.uid,k:u.k,name:this.card(u.k).name,owner:u.owner,lane:u.alive?u.lane:old?.lane,changes});}return this.s;
 }
 planPursuit(){if(!this.scene().pursuit)return;const hunter=this.all(1).find(u=>u.hero);if(!hunter)return;const candidates=this.all(0).filter(u=>u.hero&&u.lane!==hunter.lane).sort((a,b)=>this.stats(a).hp-this.stats(b).hp||a.uid-b.uid);const target=candidates[0]||this.all(0).find(u=>u.hero);if(!target)return;this.s.pursuitIntent={unit:hunter.uid,from:hunter.lane,lane:target.lane,target:target.uid,round:this.s.round+1};this.emit('intent',T(this.card(hunter.k).name+'准备在下轮闪烁至'+laneZh[target.lane]+'追杀'+this.card(target.k).name,this.card(hunter.k).en+' will blink to '+laneEn[target.lane]+' and hunt '+this.card(target.k).en,this.card(hunter.k).nameRu+' в следующем раунде прыгнет на линию '+laneRu[target.lane]+' и начнёт охоту на '+this.card(target.k).nameRu));}
 executePursuit(){const intent=this.s.pursuitIntent,u=this.get(intent?.unit);if(!u?.alive)return;if(this.flag(u,'disarm')||this.flag(u,'stun')){this.emit('intent',T('追猎者受到控制，本次闪烁取消','The hunter is controlled — the blink is cancelled',"Охотник обезврежен: прыжок отменён"));return;}const from=u.lane;this.move(u,intent.lane);this.emit('ability',T(this.card(u.k).name+'使用跳刀：'+laneZh[from]+' → '+laneZh[u.lane],this.card(u.k).en+' blinks: '+laneEn[from]+' → '+laneEn[u.lane],this.card(u.k).nameRu+' прыгает: '+laneRu[from]+' → '+laneRu[u.lane]),{card:'blink_dagger',owner:1,label:T('闪烁追杀','Blink Pursuit',"Прыжок охотника"),source:{uid:u.uid,lane:from,name:this.card(u.k).name},targets:[{kind:'unit',uid:u.uid,lane:u.lane,name:this.card(u.k).name}],outcomes:[{uid:u.uid,lane:u.lane,name:this.card(u.k).name,changes:['转移至'+laneZh[u.lane]]}]});}
 spawnAlly(l){const u=this.spawn('melee_creep',0,l);this.buff(u,{attack:1,health:3});return u;}
 spawnSentry(){const sc=this.scene(),l=Math.floor(this.random()*sc.lanes),u=this.spawn('palace_sentry',1,l);this.buff(u,{sentry:1,health:8-this.stats(u).health});this.emit('intent',T('月纹宫卫就位——必须在当轮击倒，否则警报响彻','A moon-marked sentry takes post — it must fall within this round, or the alarm rings',"Лунный часовой занял пост: убейте его в этом раунде, иначе поднимется тревога"),{unit:u.uid});return u;}
 spawnEnemy(l,k,boss=false,scale=1){const sc=this.scene(),u=this.spawn(k,1,l);const c=this.card(k),mods=this.s.nextMods||{},pressure=sc.stigma===undefined?0:this.s.profile.stigma[sc.stigma];const hp=(boss?sc.hp+(mods.enemyHp||0):9+Math.floor(this.s.chapter*.65))*scale+pressure;const atk=(boss?sc.atk+(mods.enemyAtk||0):(3+Math.floor(this.s.chapter/6)+(mods.creepAtk||0)))*scale;this.buff(u,{health:Math.round(hp)-c.health,attack:Math.round(atk)-c.attack,armor:(boss?Math.min(2,c.armor||0):0)-(c.armor||0)});if(sc.elite==='veil')this.buff(u,{veil:1});return u;}
 drawCards(n){const pl=this.s.players[0];for(let i=0;i<n&&pl.hand.length<9;i++){if(!pl.deck.length){pl.deck=this.shuffle(pl.discard.filter(k=>D.cards.some(c=>c.key===k)));pl.discard=[];}if(!pl.deck.length)break;this.draw(0,1);}}
 beforeAction(l){if(l<this.s.activeLanes)super.beforeAction(l);}
 openShop(){} // Campaign has an out-of-battle camp, never the Classic round shop.
 ready(){return [];}
 checkWin(){if(!this.s||this.s.initializing||this.s.winner!==null)return;const st=this.scene();let win=null,reason='';
 if(!this.all(0).some(u=>u.hero)){win=1;reason=T('出战英雄全部阵亡','Every hero on the field has fallen',"Все герои отряда погибли");}
 else if(st.kind==='defend'&&this.s.lanes.slice(0,st.lanes).some(l=>l.towers[0].hp<=0)){win=1;reason=T('守护的灯火被摧毁','A warded lamp has been destroyed',"Защищаемый огонь уничтожен");}
 else if(['stealth','sentry'].includes(st.kind)&&this.s.alarm>=2){win=1;reason=T('警戒达到 2，王宫封锁','The alarm reached 2 — the palace is sealed',"Тревога достигла 2: дворец заперт");}
 else if(st.kind==='assault'&&this.s.lanes.slice(0,st.lanes).every(l=>l.towers[1].hp<=0)){win=0;reason=T('所有封印已被摧毁','Every seal has been broken',"Все печати разрушены");}
 else if(st.kind==='sentry'&&!this.all(1).some(u=>!this.flag(u,'sentry'))){win=0;reason=T('卫长倒下，哨位无人再补','The warden has fallen; no one is left to hold the post',"Начальник стражи пал, некому сменить часовых");}
 else if(!['defend','assault'].includes(st.kind)&&!this.all(1).length&&(st.kind!=='rewind'||this.s.rewound)){win=0;reason=T('敌人已被击败','The enemies are beaten',"Враги повержены");}
 if(win!==null){this.s.winner=win;this.s.phase='ended';this.emit('victory',reason);}
 }
 combatForecast(l=this.s.lane){const kind=this.scene().kind;let f;if(kind==='stealth'||kind==='sentry'){const allies=this.all(0,l);for(const u of allies)u.mods.push({disarm:1,source:'stealth-preview'});try{f=super.combatForecast(l);}finally{for(const u of allies)u.mods=u.mods.filter(m=>m.source!=='stealth-preview');}}else{f=super.combatForecast(l);if(!['defend','assault'].includes(kind))f.tower=[0,0];}
 for(const a of f.attacks){const u=this.get(a.unit);if(u&&a.target!=null&&this.flag(u,'veil')){const t=this.get(a.target);const ex=Math.ceil(this.stats(u).attack/2);if(t&&f.units[t.uid]){f.units[t.uid].damage+=ex;f.hitDamage[u.uid]=(f.hitDamage[u.uid]||0)+ex;}}}
 return f;}
 combat(){const current=this.s.lane;super.combat();if(this.s.winner!==null)return;if(current>=this.s.activeLanes-1){this.s.lane=current;this.nextRound();}else{this.s.turn=0;this.s.passes=0;}}
 nextRound(){const st=this.scene();
 if(st.kind==='sentry'&&this.all(1).some(u=>this.flag(u,'sentry'))){this.s.winner=1;this.s.phase='ended';this.emit('victory',T('宫卫活到了轮末——警报响彻整座宫殿','A sentry survived to round’s end — the alarm rings through the palace',"Часовой дожил до конца раунда: во дворце звучит тревога"));return;}
 if(st.kind==='defend'&&this.s.round>=st.rounds){this.s.winner=0;this.s.phase='ended';this.emit('victory',T('潮水退去，灯火仍在','The tide withdraws; the lamps still burn',"Прилив отступает, огни всё ещё горят"));return;}
 if(this.s.round>=st.rounds){this.s.winner=1;this.s.phase='ended';this.emit('victory',T('时间耗尽，追猎者封锁了退路','Time ran out; the hunters sealed the way back',"Время истекло: охотники отрезали путь назад"));return;}
 this.s.round++;this.s.lane=0;this.s.phase='action';this.s.turn=0;this.s.passes=0;this.s.relocated=false;
 this.executePursuit();for(const u of this.s.units)u.mods=u.mods.filter(m=>m.until!=='round');
 for(let l=0;l<st.lanes;l++){this.s.lanes[l].mana=[Math.min(8,4+this.s.round),5];if(st.kind==='defend')this.spawnEnemy(l,'melee_creep');if(st.rule==='web'&&this.s.round%2===0)this.spawnEnemy(l,'melee_creep',false,.7);this.assignArrows(l);}
 if(st.kind==='rewind'&&!this.s.rewound)for(const u of this.all(1))this.heal(u,999);
 if(st.elite==='rampage'){const b=this.all(1).find(u=>u.hero||u.k===st.enemy);if(b){this.buff(b,{attack:1});this.emit('intent',T('狂暴升温：敌将攻击 +1','The rampage swells — the champion gains +1 attack',"Неистовство нарастает: предводитель получает +1 атаку"));}}
 if(st.foe==='shroud'){const e=this.pick(this.all(1).filter(u=>!this.flag(u,'shadowRealm')));if(e){this.buff(e,{shadowRealm:1},'round');this.emit('ability',T('魅影蔽纱：一名敌人没入残纱','Sisters’ Shroud: a foe slips into the veil',"Покров сестёр: враг скрывается под вуалью"),{card:'story_foe_shroud',owner:1,label:T('魅影蔽纱',"Sisters' Shroud","Покров сестёр")});}}
 if(st.foe==='toll'){const h=this.pick(this.all(0).filter(u=>u.hero));if(h){this.buff(h,{attack:-1},'round');this.emit('ability',T('公会什一税抽走了力气','The Guild Tithe saps a hero’s strength',"Десятина гильдии отнимает силу героя"),{card:'story_foe_toll',owner:1,label:T('公会什一税','Guild Tithe',"Десятина гильдии")});}}
 if(st.kind==='sentry')this.spawnSentry();
 if(this.s.profile.deckVersion===2){const pl=this.s.players[0];pl.discard.push(...pl.hand.filter(h=>h.k!=='story_scepter').map(h=>h.k));pl.hand=[];}this.drawCards(this.s.profile.deckVersion===2?5:3);if(st.kind==='rewind'&&!this.s.rewound&&!this.s.players[0].hand.some(h=>h.k.startsWith('story_rewind')))this.s.players[0].hand.push({uid:this.id(),k:'story_rewind',lock:0});if(st.kind==='stealth'){const pl=this.s.players[0];if(pl.hand.length>=9)pl.discard.push(pl.hand.pop().k);pl.hand.push({uid:this.id(),k:'story_silence',lock:0});}if(st.kind==='sentry'){const pl=this.s.players[0];while(pl.hand.length>7)pl.discard.push(pl.hand.pop().k);pl.hand.push({uid:this.id(),k:'story_silence',lock:0},{uid:this.id(),k:'story_silence',lock:0});}this.beforeAction(0);this.planPursuit();this.emit('round',T('第 '+this.s.round+' 回合 · 抽取新牌','Round '+this.s.round+' · new cards drawn','Раунд '+this.s.round+' · получены новые карты'));
 }
 relocate(uid,l){const u=this.get(uid);if(this.s.phase!=='action'||this.s.relocated||!u?.alive||u.owner!==0||!u.hero||!Number.isInteger(l)||l<0||l>=this.s.activeLanes)throw Error(T('每轮只能调动一位己方英雄','Only one hero may be relocated each round',"За раунд можно переместить только одного героя"));this.move(u,l);this.s.relocated=true;for(let i=0;i<this.s.activeLanes;i++)this.assignArrows(i);}
 available(){const cards=[...D.cards];if(!this.s.profile.scepter||this.s.scepterUsed)return cards.filter(c=>c.key!=='story_scepter'&&!c.foe);return cards.filter(c=>!c.foe);}
 cast(key,uid,destination=null){if(this.s.phase!=='action')throw Error(T('战斗已经结束','The battle is over',"Бой завершён"));const c=this.available().find(c=>c.key===key),pl=this.s.players[0],h=pl.hand.find(h=>h.k===key);const special=key==='story_scepter'&&this.s.profile.scepter&&!this.s.scepterUsed;if(!c||!h&&!special)throw Error(T('手中没有这张牌','That card is not in hand',"Этой карты нет в руке"));const l=this.s.lane;if(this.s.lanes[l].mana[0]<c.mana)throw Error(T('当前线路魔力不足','Not enough mana in this lane',"Недостаточно маны на этой линии"));const u=this.get(uid);
 if(c.target==='move'&&(!Number.isInteger(destination)||destination<0||destination>=this.s.activeLanes||!u?.hero||u.owner!==0||!u.alive))throw Error(T('请选择己方英雄与有效目标战线','Choose one of your heroes and a valid lane',"Выберите своего героя и допустимую линию"));
 if(!['lane','move'].includes(c.target)&&(!u?.alive||u.lane!==l||(c.target==='enemy'?u.owner!==1:u.owner!==0)||c.target==='hero'&&!u.hero))throw Error(T('请选择当前线路的','Choose a target in this lane: ',"Выберите цель на этой линии: ")+(c.target==='enemy'?T('敌方单位','an enemy',"враг"):c.target==='hero'?T('己方英雄','one of your heroes',"ваш герой"):T('己方单位','an ally',"союзник")));
 this.s.events=[];if(h){pl.hand.splice(pl.hand.indexOf(h),1);if(key!=='story_scepter')pl.discard.push(key);}this.s.lanes[l].mana[0]-=c.mana;this.emit('cast',T(c.name+' → '+(u?this.card(u.k).name:'当前战线'),c.en+' → '+(u?this.card(u.k).en:'this lane'),c.nameRu+' → '+(u?this.card(u.k).nameRu:'эта линия')),{card:key,unit:u?.uid,fx:c.fx});const slark=this.all(0).find(v=>v.k==='slark'),p=this.s.profile;
 if(['stealth','sentry'].includes(this.scene().kind)&&['story_pounce','story_essence','story_pact','story_cleave','story_venom','story_ambush'].includes(c.baseKey||key))this.s.alarm++;
 const baseKey=c.baseKey||key,up=c.upgraded?1:0,tn=p.tuning?.[baseKey]||0;switch(baseKey){
 case 'story_pounce':this.damage(u,6+3*up+tn);this.buff(u,{disarm:1},'round');break;
 case 'story_essence':this.damage(u,5+p.upgrades.essence+3*up+tn,true);if(slark)this.buff(slark,{attack:1});if(p.forge)this.s.lanes[l].mana[0]+=p.upgrades.essence>=3?3:2;break;
 case 'story_pact':for(const e of this.all(1,l))this.damage(e,4+2*up+tn,true);if(slark){this.cleanse(slark);this.damage(slark,2,true);}break;
 case 'story_shadow':this.heal(u,7+3*up+tn);this.buff(u,{armor:1+up},'round');break;
 case 'story_guard':this.buff(u,{armor:3+2*up},'round');this.heal(u,p.upgrades.guard);break;
 case 'story_salve':this.heal(u,6+3*up+tn);break;
 case 'story_reinforce':{const ally=this.spawnAlly(l);if(up)this.buff(ally,{attack:2,health:2});}this.assignArrows(l);break;
 case 'story_blade':u.items.Weapon={k:up?'broadsword':'short_sword'};this.emit('equip',T(c.name+'装备完成',c.en+' equipped',c.nameRu+' надето'),{unit:u.uid});break;
 case 'story_silence':this.damage(u,['stealth','sentry'].includes(this.scene().kind)?8+3*up:3+2*up,true);this.buff(u,{disarm:1},'round');break;
 case 'story_rewind':this.heal(u,10+4*up);this.cleanse(u);this.s.rewound=true;break;
 case 'story_scepter':this.s.scepterUsed=true;for(const a of this.all(0))this.heal(a,12);for(const e of this.all(1))this.damage(e,8,true);break;
 case 'story_venom':this.damage(u,2+2*up+tn,true);this.buff(u,{poison:1});break;
 case 'story_bulwark':this.buff(u,{armor:5+2*up+tn},'round');this.drawCards(1);break;
 case 'story_insight':this.drawCards(2+up);break;
 case 'story_blink':this.move(u,destination);this.buff(u,{armor:1},'round');for(let i=0;i<this.s.activeLanes;i++)this.assignArrows(i);break;
 case 'story_cleave':for(const e of this.all(1,l))this.damage(e,5+2*up+tn);break;
 case 'story_renew':for(const a of this.all(0,l)){this.heal(a,5+3*up+tn);this.cleanse(a);}break;
 case 'story_ambush':{const extra=this.flag(u,'poison')||this.flag(u,'disarm');this.damage(u,3+2*up+tn+(extra?4+2*up:0),true);break;}
 case 'story_resolve':this.buff(u,{deathShield:1},'round');break;
 case 'story_bond':this.heal(u,(p.loyalty[u.k]===0?3:5)+up+tn);this.buff(u,{attack:(p.loyalty[u.k]>=4?3:p.loyalty[u.k]===0?1:2)+up});break;
 case 'story_veil':this.buff(u,{shadowRealm:1,armor:2+up},'round');break;
 case 'story_phantom':{this.damage(u,4+2*up+tn,true);const dead=!u.alive||this.stats(u).hp<=0&&!this.flag(u,'deathShield');if(dead){this.drawCards(1);this.s.lanes[l].mana[0]+=1;}break;}
 case 'story_mark':u.contract=12+6*up+3*tn;this.buff(u,{bountyMark:1,bounty:3+up});break;
 case 'story_wyrm':{const w=this.spawn('whelp',0,l);if(up)this.buff(w,{attack:1,health:2});}this.assignArrows(l);break;
 case 'story_scales':this.buff(u,{armor:2+up+tn,regen:2+up});break;
 case 'story_ward':{const w=this.spawn('stone_ward',0,l);if(up)this.buff(w,{health:4,armor:1});}this.assignArrows(l);break;
 case 'story_seal':this.buff(u,{armor:-(4+up+tn)});this.buff(u,{stun:1,root:1},'round');break;
 }
 if(this.scene().rule==='mirror'&&c.fx==='strike'){const target=this.all(0,l)[0];if(target)this.damage(target,2,true);this.emit('cast',T('拉比克的镜像反射了 2 点伤害','Rubick’s mirror reflects 2 damage',"Зеркало Рубика отражает 2 урона"));}
 this.sweep();
 }
 sweep(){const marked=new Set(this.all(1).filter(u=>this.flag(u,'bountyMark')).map(u=>u.uid));super.sweep();if(marked.size){const dead=[...marked].map(id=>this.get(id)).filter(u=>u&&!u.alive);if(dead.length){const gain=dead.reduce((n,u)=>n+(u.contract||12),0);this.s.contracts=(this.s.contracts||0)+gain;this.emit('ability',T('悬赏契约 +'+gain+' 旅费，幕末结算','Bounty contract +'+gain+' supplies, paid when the scene closes','Контракт +'+gain+' припасов, выплата после сцены'),{card:'story_mark',owner:0,label:T('烙印悬赏','Mark of the Guild',"Метка гильдии")});}}}
 cleanse(u){u.mods=u.mods.filter(m=>!(m.stun||m.disarm||m.silence||m.poison||m.attack<0||m.armor<0));}
}
root.ArtifactCampaign={CampaignGame,fresh,valid,chooseParty,reward,abandon,applyChoice,advanceScene,sceneCount,SAVE_KEY};
if(typeof module!=='undefined')module.exports=root.ArtifactCampaign;
})(typeof window==='undefined'?globalThis:window);
