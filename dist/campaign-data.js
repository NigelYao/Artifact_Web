/* Campaign content is intentionally separate from the Classic card catalog. */
(function(root){'use strict';
const hero=(key,name,en,attack,health,armor=0)=>({key,name,en,type:'Hero',color:'Black',attack,health,armor,abilities:[],art:'assets/campaign/'+key+'.png',text:'暗月残片 · 剧情模式',textEn:'Dark Moon Fragments · story mode'});
const heroes=[hero('slark','斯拉克 · 小鱼人','Slark the Fish-Person',5,22,1),hero('tiny','小小','Tiny',6,18,2),hero('broodmother','育母蜘蛛','Broodmother',5,16,0),hero('slardar','斯拉达','Slardar',6,19,1),hero('rubick','拉比克','Rubick',4,16),hero('weaver','编织者','Weaver',5,15,1),hero('phoenix','凤凰','Phoenix',4,18),hero('arc_warden','泽特 · 残月回声','Zet, the Waning Echo',7,26,1)];
/* Non-hero units spawned by scenes and cards. Art reuses the local Classic card gallery. */
const unit=(key,name,en,attack,health,armor,art)=>({key,name,en,type:'Creep',color:'Black',attack,health,armor,art,abilities:[],text:'暗月残片 · 剧情单位',textEn:'Dark Moon Fragments · story unit'});
const units=[unit('gaoler','石面狱卒','Stonefaced Gaoler',3,12,1,'assets/cards/10133.webp'),unit('palace_warden','月宫卫长','Palace Warden',4,14,1,'assets/cards/10133.webp'),unit('palace_sentry','月纹宫卫','Moon-Marked Sentry',3,8,0,'assets/cards/10133.webp'),unit('veil_blade','魅影之刃','Blade of the Veil',5,8,0,'assets/cards/10077.webp'),unit('guild_tollman','公会税吏','Guild Tollman',4,9,0,'assets/cards/10094.webp'),unit('moon_cultist','残月信徒','Waning Cultist',4,9,0,'assets/cards/10086.webp'),unit('whelp','龙裔幼龙','Dragonkin Whelp',4,8,0,'assets/cards/10010.webp'),unit('stone_ward','石印守卫','Seal-Stone Warden',0,12,3,'assets/cards/10133.webp'),unit('red_mist_raider','赤雾掠兵','Red-Mist Raider',4,9,0,'assets/cards/10094.webp')];
/* Cast triples in intro/interlude reference people by key: [who, 中文, English]. */
const people={slark:['斯拉克','Slark'],slardar:['斯拉达','Slardar'],bounty_hunter:['赏金猎人','Bounty Hunter'],phantom_assassin:['魅影刺客','Phantom Assassin'],enchantress:['魅惑魔女','Enchantress'],villager:['村民','Villager'],chief:['村长','Village Elder'],sorla:['索拉','Sorla Khan'],magnus:['马格纳斯','Magnus'],tiny:['小小','Tiny'],broodmother:['育母蜘蛛','Broodmother'],tidehunter:['潮汐猎人','Tidehunter'],rubick:['拉比克','Rubick'],portrait:['阿哈利姆的留影',"Aghanim's Echo"],echo:['残月回声','Waning Echo'],winter_wyvern:['寒冬飞龙','Winter Wyvern'],phoenix:['凤凰','Phoenix'],weaver:['编织者','Weaver'],companion:['同行者','Companion'],gaoler:['石面狱卒','Stonefaced Gaoler'],tollman:['公会税吏','Guild Tollman'],sentry:['月纹宫卫','Moon-Marked Sentry'],cultist:['残月信徒','Waning Cultist'],whelp:['龙裔幼龙','Dragonkin Whelp']};
const cards=[
 ['pounce','突袭','Pounce',2,'enemy','对目标造成 6 点伤害，本轮缴械。','Deal 6 damage to a target and disarm it this round.','strike','slark'],
 ['essence','能量转移','Essence Shift',2,'enemy','造成 5 点穿甲伤害；小鱼人本关攻击 +1。锻造后返还魔力。','Deal 5 piercing damage; Slark gains +1 attack this stage. Once forged, it returns mana.','strike','slark'],
 ['pact','黑暗契约','Dark Pact',2,'enemy','当前线路所有敌人受到 4 点穿甲伤害；小鱼人失去 2 生命并驱散减益。','Every enemy in this lane takes 4 piercing damage; Slark loses 2 health and sheds his debuffs.','strike','slark'],
 ['shadow','暗影之舞','Shadow Dance',2,'ally','回复 7 生命，获得本轮 1 点护甲。','Heal 7 and gain 1 armor this round.','healing','slark'],
 ['guard','并肩而立','Shoulder to Shoulder',1,'ally','获得本轮 3 护甲。羁绊强化后额外回复生命。','Gain 3 armor this round. Strengthened bonds add healing.','blessing','magnus'],
 ['salve','潮汐药剂','Tide Salve',1,'ally','回复 6 生命。','Heal 6.','healing','enchantress'],
 ['reinforce','暗礁义勇','Reeffolk Muster',2,'lane','在当前线路召唤 3 攻击、7 生命的义勇。','Summon a 3-attack, 7-health reeffolk volunteer into this lane.','summon','slardar'],
 ['blade','暗礁短刃','Reef Shiv',2,'hero','替换武器：攻击 +2（同槽不叠加）。','Swap weapon: +2 attack (the same slot does not stack).','equip','slark'],
 ['silence','无声通行','Silent Passage',1,'enemy','对守卫造成 8 点穿甲伤害，不增加警戒；其他敌人受到 3 点。','Deal 8 piercing damage to a guard without raising the alarm; other enemies take 3.','binding','phantom_assassin'],
 ['rewind','时光倒流','Rewind',2,'ally','回复 10 生命并驱散减益；洞穴中解除时间茧。','Heal 10 and shed debuffs; inside the cave it unravels the time-cocoon.','movement','weaver'],
 ['scepter','阿哈利姆的承诺',"Aghanim's Promise",0,'lane','本次旅程限一次：全队回复 12 生命，所有敌人受到 8 点穿甲伤害。','Once per journey: heal the whole party 12 and deal 8 piercing damage to all enemies.','blessing','rubick'],
 ['bond','归航的约定','The Homeward Vow',2,'ally','回复 5 生命，永久攻击 +2；亲密关系额外 +1。','Heal 5 and gain +2 permanent attack; close companions grant a further +1.','blessing','winter_wyvern'],
 ['veil','魅影残纱','Veil Remnant',1,'ally','使一位己方单位披上残纱：本轮无法被选为攻击目标，护甲 +2。','Wrap an ally in the remnant: it cannot be attacked this round and gains +2 armor.','binding','phantom_assassin'],
 ['phantom','幻刺回响',"Phantom's Echo",2,'enemy','造成 4 点穿甲伤害；若目标阵亡，抽 1 张牌并返还 1 魔力。潜入中使用不增加警戒。','Deal 4 piercing damage; if the target falls, draw a card and refund 1 mana. Raises no alarm during infiltration.','strike','phantom_assassin'],
 ['mark','烙印悬赏','Mark of the Guild',1,'enemy','烙下悬赏印记：本幕内若目标阵亡，结算时每份契约 +12 旅费。','Brand a bounty mark: if the target falls this scene, each contract pays +12 supplies at tally.','binding','bounty_hunter'],
 ['wyrm','龙裔盟誓','Wyrmkin Oath',3,'lane','召唤 4 攻击、8 生命的龙裔幼龙加入当前战线。','Summon a 4-attack, 8-health dragonkin whelp into this lane.','summon','winter_wyvern'],
 ['scales','龙鳞誓约','Scalebound Vow',2,'ally','目标友军本关护甲 +2、每轮回复 2；龙蛋记得这句真名。','An ally gains +2 armor and 2 regen for the rest of the stage; the egg remembers the true name.','blessing','winter_wyvern'],
 ['ward','石印卫戍','Seal-Stone Vigil',2,'lane','召唤 0 攻击、12 生命、3 护甲的遗迹守卫阻挡战线。','Summon a 0-attack, 12-health, 3-armor seal-stone warden to hold this lane.','summon','gaoler'],
 ['seal','缄月封印','Moon-Mute Seal',2,'enemy','击碎目标 4 点护甲并禁锢一轮（无法攻击或移动）。','Shatter 4 armor on a target and bind it for a round (it cannot attack or move).','binding','arc_warden'],
 ['foe_shroud','魅影蔽纱',"Sisters' Shroud",0,'enemy','敌方专用：每轮开始，一名敌人隐入残纱，本轮无法被选为攻击目标。','Foe only: each round one enemy slips into the veil and cannot be attacked this round.','binding','phantom_assassin'],
 ['foe_toll','公会什一税','Guild Tithe',0,'enemy','敌方专用：每轮开始，一名己方英雄被抽走 1 点攻击。','Foe only: each round one of your heroes is taxed -1 attack.','binding','bounty_hunter']
].map(([key,name,en,mana,target,text,textEn,fx,portrait])=>({key:'story_'+key,name,en,mana,target,text,textEn,fx,portrait,type:'Spell',color:'Black',foe:key.startsWith('foe_')||undefined}));
const stages=[
 {title:'暗礁破笼',titleEn:'The Reef Unlocked',act:'第一幕 · 无岸之潮',actEn:'Act I · The Shoreless Tide',place:'暗黑之礁 / 地下囚廊',placeEn:'Dark Reef / the Undercells',lanes:1,kind:'clear',enemy:'slardar',hp:14,atk:3,rounds:9,recruit:'slardar',
  lore:'暗黑之礁从不放人。石面狱卒数了你的囚号三十年，而深水守卫斯拉达守着最后一道门——他不是看守，是另一枚棋子。',
  loreEn:'The Dark Reef never releases anyone. The stonefaced gaoler has counted your prison number for thirty years, and Slardar, warden of the deep, holds the last door — he is no jailer, only another piece on the board.',
  scenes:[
   {enemy:'gaoler',kind:'clear',lanes:1,hp:10,atk:2,rounds:7},
   {enemy:'slardar',kind:'clear',lanes:1,hp:14,atk:3,rounds:9,interlude:[['gaoler','囚号作废……门轴要自己转了。','Your number is void... the hinge turns on its own now.'],['slardar','放下那枚蛋。它认得整座监狱的锁。','Set down the egg. It knows every lock in this prison.']]}],
  intro:[['slardar','停下。你怀里那枚蛋，是监狱的封印。','Stop. The egg in your arms is this prison’s seal.'],['slark','你听见的是封印，我听见的是心跳。','You hear a seal. I hear a heartbeat.'],['slardar','它每一次跳动，牢门就松一寸。你是故意的，还是不知情？','Every beat loosens the doors an inch. Are you doing this on purpose, or in ignorance?'],['slark','我只知道，它在牢里冷得发抖。','I only know it shivered in the cold down there.'],['slardar','那就让我看看，你拿什么承担开门的后果。','Then show me what you will pay for opening the door.']],
  outro:'守卫的鳞片上也刻着囚号。斯拉达放下三叉戟：“赢了我，就带我一起查清这座监狱。”',outroEn:'The warden’s own scales bear a prison number. Slardar lowers his trident: “Beat me, and take me along to unmask this prison.”',
  clue:'龙蛋遇见月光，响起与牢门相同的三声低鸣。囚衣里的时光牌写着“五秒”，你不记得是谁给的。',clueEn:'Under moonlight the egg hums the same three low notes as the cell doors. Inside your prison shirt sits a time card that reads “five seconds” — you do not remember who gave it to you.'},
 {title:'三罪追缉',titleEn:'Three Stolen Names',act:'第一幕 · 无岸之潮',actEn:'Act I · The Shoreless Tide',place:'盐雾渡口',placeEn:'Salt-Mist Crossing',lanes:1,kind:'clear',enemy:'bounty_hunter',hp:20,atk:4,rounds:9,recruit:'bounty_hunter',stigma:0,
  lore:'通缉令比潮水更快。金钥匙、龙诗、凤凰羽毛——三桩你从未犯下的罪，已经把价码挂上了你的背鳍。',
  loreEn:'The warrants outran the tide. A golden key, a dragon poem, a phoenix feather — three thefts you never committed, already priced against your dorsal fin.',
  scenes:[
   {enemy:'guild_tollman',kind:'clear',lanes:1,hp:12,atk:3,rounds:8,foe:'toll'},
   {enemy:'bounty_hunter',kind:'clear',lanes:1,hp:20,atk:4,rounds:9,interlude:[['tollman','公会只认契，不认脸。你的价码今天涨了三倍。','The guild honors contracts, not faces. Your price tripled today.'],['bounty_hunter','让开，税吏。这条猎物背上写的是我的名字。','Step aside, tollman. This quarry bears my name.']]}],
  intro:[['bounty_hunter','金钥匙、古龙诗集、凤凰羽毛。三张赏单，落款却是同一个人。','A golden key, an elder dragon’s poems, a phoenix feather. Three warrants — signed by one hand.'],['slark','我的口袋装不下这么多传奇。','My pockets could never hold so many legends.'],['bounty_hunter','每张赏单还附了你的鳞片拓印，比你出生时按的都清楚。','Each warrant carries a rubbing of your scales — clearer than the one pressed at your birth.'],['slark','有人在我之前，先把我“偷”了一遍。','Someone stole me once already, before I ever stole anything.'],['bounty_hunter','也许雇主付钱，要的不是失物，是让所有人相信你拿过。','Maybe the employer pays not for lost goods, but for a world that believes you took them.']],
  outro:'赏单背面露出银色月纹。猎人愿意跟随你，看看谁敢连佣金也作假。',outroEn:'A silver moon-mark surfaces on the back of the warrants. The hunter joins you, curious who would dare forge even the bounty.',
  clue:'三份赏单的墨迹，竟然同时变淡。',clueEn:'The ink on all three warrants fades in the same instant.'},
 {title:'灯火不退',titleEn:'The Light Holds',act:'第一幕 · 无岸之潮',actEn:'Act I · The Shoreless Tide',place:'芦苇村 / 两处堤口',placeEn:'Reed Village / the Two Dikes',lanes:2,kind:'defend',enemy:'sorla_khan',hp:20,atk:5,rounds:4,recruit:'enchantress',bonusRecruit:'sorla_khan',
  lore:'芦苇村收留过一个逃犯，便再没有退出的资格。赤雾军的火把分两路压境——他们要的不是你，是让所有村庄学会害怕。',
  loreEn:'Reed Village sheltered a fugitive and forfeited its right to stay neutral. The Red-Mist army presses in from two dikes — they want not you, but to teach every village how to be afraid.',
  scenes:[
   {enemy:'red_mist_raider',kind:'defend',lanes:2,hp:16,atk:4,rounds:4},
   {enemy:'sorla_khan',kind:'defend',lanes:2,hp:20,atk:5,rounds:4,interlude:[['villager','第二波！他们带着战旗上来了！','A second wave! They’re marching under the war-banner!'],['sorla','令上说烧村。可我读不出令尾的月纹是谁盖的。','The order says burn the village. Yet I cannot read whose moon-mark seals it.']]}],
  intro:[['enchantress','先把伤口包上。这里不问囚号。','Bind your wounds first. This house asks no prison number.'],['villager','赤雾军来了！他们说收留逃犯的村子都要烧！','The Red-Mist is here! They say every village that harbors a fugitive burns!'],['sorla','逃犯，站出来。或者看着灯一盏盏灭掉。','Fugitive. Show yourself, or watch the lamps go out one by one.'],['slark','把孩子带到灯塔。我来回答他们。','Take the children to the lighthouse. I will answer them.'],['enchantress','你回答不了的，用绷带也缝不上。但至少——先让灯亮着。','What you cannot answer, no bandage can sew shut. But first — keep the light burning.']],
  outro:'四次潮涌之后，灯塔仍亮着。索拉发现伪造的军令，撤军并留下联络令。魅惑魔女收拾药包：“既然有人追你，伤药就得跟着你走。”',outroEn:'Four surges later, the lighthouse still burns. Sorla finds the forged order, withdraws, and leaves a signal token behind. Enchantress packs her satchel: “If someone hunts you, your medicine has to travel with you.”',
  clue:'灯塔的老钟，与龙蛋的心跳同频。',clueEn:'The lighthouse’s old bell beats in time with the dragon egg’s heart.'},
 {title:'折断的月角',titleEn:'The Broken Moonhorn',act:'第一幕 · 无岸之潮',actEn:'Act I · The Shoreless Tide',place:'碎石林',placeEn:'the Stonebreak',lanes:1,kind:'clear',enemy:'magnus',hp:30,atk:6,rounds:9,recruit:'magnus',elite:'rampage',
  lore:'马格纳斯撞穿了半座碎石林，不是因为疯，是因为有人把月石钉进了他的角骨。每一块碎石都朝着同一个方向倒下。',
  loreEn:'Magnus has gored through half the Stonebreak — not from madness, but because someone drove a moonstone into his horn. Every shattered rock leans the same way.',
  intro:[['magnus','别靠近！那声音在我的角里！','Stay back! The sound is inside my horn!'],['enchantress','不是野性，是有人把月石钉进了他的骨头。','Not savagery — someone has spiked a moonstone into his skull.'],['magnus','每撞一次，它就唱得更大声。它在数我。','Every charge makes it sing louder. It is counting me.'],['slark','我认识那种锁。先打断它，再谈赔树的事。','I know that kind of lock. Break it first, argue about the trees later.'],['magnus','那你最好快些。我已经快听不清自己的蹄声了。','Then be quick. I can barely hear my own hooves anymore.']],
  outro:'拔出的月石上刻着村钟匠的印记。你救了马格纳斯，却也暴露了自己能触碰暗月的秘密。',outroEn:'The drawn-out moonstone bears the village bellsmith’s mark. You saved Magnus — and revealed that you can touch the dark moon.',
  clue:'月石裂口流出银光，逆着风飘向北方。',clueEn:'Silver light leaks from the stone’s crack and drifts north against the wind.'},
 {title:'离岸之夜',titleEn:'Night of Leavetaking',act:'第一幕 · 无岸之潮',actEn:'Act I · The Shoreless Tide',place:'芦苇村外 / 三岔撤离堤道',placeEn:'Beyond Reed Village / the Triple Causeway',lanes:3,kind:'defend',enemy:'phantom_assassin',hp:26,atk:6,rounds:4,recruit:'phantom_assassin',stigma:1,elite:'veil',
  lore:'村子把你送上马车，不是因为恨你，是因为龙蛋的鸣声已经开始叫醒不该醒的东西。魅影之纱从月下现身——她们从来不是刺客，是回收队。',
  loreEn:'The village puts you on a cart — not from hatred, but because the egg’s hum has begun waking what should sleep. The Sisters of the Veil step out of moonlight — they were never assassins, but a retrieval crew.',
  scenes:[
   {enemy:'veil_blade',kind:'clear',lanes:3,hp:30,atk:5,rounds:9,elite:'veil',foe:'shroud'},
   {enemy:'phantom_assassin',kind:'defend',lanes:3,hp:26,atk:6,rounds:4,pursuit:true,elite:'veil',interlude:[['phantom_assassin','残刃只是引路的哨音。真正的回收队在你背后下车。','The blades were only a guiding whistle. The real retrieval steps off behind you.'],['slark','所以名单要三岔口——你们想让我看不清哪辆车上是孩子。','So the list needs three causeways — you want me unsure which cart holds the children.']]}],
  intro:[['chief','孩子们怕你。钟一响，他们就梦见天上的裂缝。','The children fear you. When the bell rings they dream of a crack in the sky.'],['slark','所以你把我的名字告诉了刺客？','So you gave my name to the assassins?'],['chief','她们不是来杀人的。她们拿着名册，说收容了你的地方都欠了债。','They did not come to kill. They carried a ledger, and said every place that sheltered you owes a debt.'],['phantom_assassin','我的名单上没有村民。有人改过神谕。让开，我们各查各的。','No villager is on my list. Someone has revised the oracle. Step aside — we each hunt our own truth.'],['slark','我先送完这三岔口的车。你要查的路，跟在我背后。','I see the carts across the causeways first. Your road runs behind my back.']],
  outro:'你护送最后一辆车离开，却没有人邀请你上车。刺客折断了伪造的名单，暂时与你同行。',outroEn:'You see the last cart off, and no one invites you aboard. The assassin snaps the forged list and walks beside you, for now.',
  clue:'名单上的“逃犯”，原本写的是“容器”。',clueEn:'Where the list reads “fugitive”, it once read “vessel”.'},
 {title:'山的重量',titleEn:"The Mountain's Weight",act:'第二幕 · 借来的锋刃',actEn:'Act II · A Borrowed Edge',place:'回声山顶',placeEn:'Echo Summit',lanes:1,kind:'clear',enemy:'tiny',hp:34,atk:6,rounds:10,recruit:'tiny',rule:'stone',
  lore:'潮汐刃需要三种誓约：山的骨、蛛的脉、海的鳞。小小掌着山心——石头从不出售，只出借，而且利息是一个承诺。',
  loreEn:'The tide blade needs three oaths: a mountain for bone, silk for sinew, sea for edge. Tiny keeps the mountain-heart — stone is never sold, only lent, and its interest is a promise.',
  intro:[['slardar','你需要一把能割断月锁的武器，不是一把杀人的刀。','You need a blade that cuts moon-locks, not men.'],['tiny','石头不免费。打得动我，我就借你山心。','Stone is never free. Move me, and the mountain-heart is yours on loan.'],['slark','我打不动山。但我可以让山愿意动。','I cannot move a mountain. But I can ask it to want to.'],['tiny','那就试试看，小鱼。山顶已经一百年没人问过问题了。','Then try, little fish. A hundred years since anyone asked the summit a question.']],
  outro:'小小把山心递来：“借。不是送。等你回家，记得带我看看海。”',outroEn:'Tiny hands you the mountain-heart: “A loan. Not a gift. When you reach home, show me the sea.”',
  clue:'第一份材料不是战利品，而是一个要归还的约定。',clueEn:'The first ingredient is not spoils but a promise that must be returned.'},
 {title:'蛛丝上的名字',titleEn:'A Name in the Web',act:'第二幕 · 借来的锋刃',actEn:'Act II · A Borrowed Edge',place:'空巢峡谷',placeEn:'the Hollow Brood Canyon',lanes:2,kind:'clear',enemy:'broodmother',hp:28,atk:5,rounds:10,recruit:'broodmother',rule:'web',
  lore:'空巢峡谷的卵壳全都烙着编号——蛛群的第一批孩子，早被暗礁登记收走。育母蜘蛛认得每一种脚印，除了你的。',
  loreEn:'Every eggshell in the canyon bears a stamped number — the brood’s first children were registered and taken by the Reef. Broodmother knows every footprint except yours.',
  intro:[['broodmother','所有拿火把来的人，都说自己只是路过。','Everyone who carries a torch claims they are only passing through.'],['slark','那我放下刀。你先把绑住我脚的丝松开。','Then I set down my blade. Loosen the silk around my ankles first.'],['broodmother','你的脚印上没有编号。暗礁从不漏记活物。','Your footprints carry no number. The Reef never forgets a living thing.'],['slark','也许它试过。也许我就是那道漏掉的缝。','Maybe it tried. Maybe I am the crack it missed.'],['broodmother','赢过我的孩子们，才有资格谈信任。','Best my children first. Then we can speak of trust.']],
  outro:'她给了你一束不燃蛛丝。离开时，你看见空卵壳上同样烙着暗礁的编号。',outroEn:'She gives you a skein of fireproof silk. As you leave, you see the empty shells stamped with the Reef’s own serial numbers.',
  clue:'监狱关押的，从来不只是罪犯。',clueEn:'The prison never held only criminals.'},
 {title:'深海旧誓',titleEn:'Old Oaths of the Deep',act:'第二幕 · 借来的锋刃',actEn:'Act II · A Borrowed Edge',place:'沉没的岗哨',placeEn:'the Drowned Watchpost',lanes:1,kind:'assault',enemy:'tidehunter',hp:34,atk:7,rounds:10,recruit:'tidehunter',
  lore:'沉没岗哨下压着旧誓言的封印：一名守卫曾发誓不让任何暗礁之物回到海上。潮汐猎人等的不是你，是这个誓言松动的这一天。',
  loreEn:'Beneath the drowned watchpost lies the seal of an old oath: a warden once swore nothing of the Reef would return to the sea. Tidehunter has waited not for you, but for the day that oath finally loosened.',
  intro:[['tidehunter','斯拉达把最后一片鳞给你了？那我来试试，谁值得让守卫违誓。','Slardar gave you his last scale? Then let me test who a warden should break his oath for.'],['slark','我不想要新的主人。','I want no new master.'],['tidehunter','海鳞认的不是主人，是潮汐还欠谁一次回头。','A sea-scale serves no master — it counts who the tide still owes one return.'],['slark','那就把旧岗哨砸了。让海欠我一个新家。','Then break the old watchpost. Let the sea owe me a new home.']],
  outro:'山心为骨、蛛丝为脉、海鳞为锋。潮汐刃成形，第一次夺来的魔力却悄悄流向了天上。',outroEn:'Mountain-heart for bone, brood-silk for sinew, sea-scale for edge. The tide blade takes shape — and the first mana it steals slips quietly skyward.',
  clue:'解锁锻造：小鱼人每战携带攻击 +2 的潮汐刃；能量转移返还 2 魔力。',clueEn:'Forge unlocked: Slark carries a +2 tide blade into every battle; Essence Shift refunds 2 mana.',forge:true},
 {title:'偷走刀的人',titleEn:'The Man Who Stole the Knife',act:'第二幕 · 借来的锋刃',actEn:'Act II · A Borrowed Edge',place:'阿哈利姆的折镜厅',placeEn:"Aghanim's Mirrorhall",lanes:2,kind:'clear',enemy:'rubick',hp:34,atk:7,rounds:10,recruit:'rubick',rule:'mirror',
  lore:'拉比克能复制任何法术，却专程潜入你的行囊，只为偷一把刚成形的刀。折镜厅里每一面镜子都在录下魔力的去向。',
  loreEn:'Rubick can copy any spell, yet he slipped into your pack for one newborn blade. Every mirror in the Mirrorhall is recording where its mana goes.',
  intro:[['rubick','别急着刺我。你的刀正在替别人收集能量。','Sheathe that temper. Your blade is harvesting energy for someone else.'],['slark','所以你偷走它，是为了我的健康？','So you stole it out of concern for my health?'],['rubick','是为了我的好奇心。两者偶尔一致。','For my curiosity. The two coincide on occasion.'],['slark','那就让我看镜子。它替谁收的？','Then show me the mirror. Who does it harvest for?'],['rubick','问得好。答案在天上，不在我手里——先把刀赢回去。','Good question. The answer hangs in the sky, not in my hand — win back your blade first.']],
  outro:'拉比克在镜中复制了刀的轨迹。每一道银线，终点都是同一轮月亮。',outroEn:'Rubick copies the blade’s path in the mirror. Every silver thread ends at the same moon.',
  clue:'偷刀的人没有隐藏证据，反而逼你亲眼看见。',clueEn:'The thief hid no evidence — he forced you to see it with your own eyes.'},
 {title:'导师的空座',titleEn:"The Mentor's Empty Seat",act:'第二幕 · 借来的锋刃',actEn:'Act II · A Borrowed Edge',place:'星盘穹顶',placeEn:'the Astrolabe Dome',lanes:1,kind:'clear',enemy:'arc_warden',hp:44,atk:8,rounds:10,
  lore:'阿哈利姆留下的留影在星盘穹顶等着被质询。当年封印月亮的计划签过三个名字，他的在最上面。',
  loreEn:'The echo Aghanim left behind waits to be questioned beneath the Astrolabe Dome. Three names signed the plan to seal the moon; his sits on top.',
  intro:[['portrait','来得正好。打碎星盘上的回声，我们才有时间说话。','You arrive on cue. Shatter the echo on the astrolabe, and we will have time to talk.'],['echo','归还容器。归还钥匙。归还尚未孵化的火。','Return the vessel. Return the key. Return the unhatched fire.'],['slark','“容器”有名字。它有心跳。','“The vessel” has a name. It has a heartbeat.'],['rubick','老师连道歉都藏在谜题后面。','Even my mentor’s apologies hide behind riddles.'],['portrait','谜题是为了拖住天上那位。听完就走。','The riddles exist to stall the one in the sky. Listen, then go.']],
  outro:'留影承认参与过暗礁封印。阿哈利姆留下神杖与坐标：“那颗蛋不是最后一条龙，而是记得旧封印的最后一位见证者。”',outroEn:'The echo admits its part in the Reef sealing. Aghanim leaves a scepter and coordinates: “That egg is not the last dragon — it is the last witness who remembers the old seal.”',
  clue:'获得一次性的神杖。最好留给真正需要它的人。',clueEn:'You gain the one-use Scepter. Save it for whoever truly needs it.',scepter:true},
 {title:'金钥匙没有锁',titleEn:'A Key Without a Lock',act:'第三幕 · 失重的真相',actEn:'Act III · Weightless Truths',place:'王宫档案库',placeEn:'the Palace Archives',lanes:1,kind:'stealth',enemy:'bounty_hunter',hp:24,atk:5,rounds:7,stigma:0,
  lore:'金钥匙从未离开皇宫——你被通缉的每一天，它都躺在档案柜的丝绒上。今夜宫卫换防，档案库只有月光守门。',
  loreEn:'The golden key never left the palace — every day you were hunted, it lay on velvet in the archives. Tonight the guard rotation changes; only moonlight keeps the door.',
  scenes:[
   {enemy:'palace_warden',kind:'sentry',lanes:1,hp:22,atk:4,rounds:7},
   {enemy:'bounty_hunter',kind:'stealth',lanes:1,hp:24,atk:5,rounds:7,interlude:[['phantom_assassin','门廊空了。下一层是档案柜——公会的人也到了。','The gallery is empty. The cabinets wait below — and the guild got here first.'],['slark','那把钥匙在等我。它被造出来那天就在等我。','That key has been waiting for me. Since the day it was cut.']]}],
  intro:[['bounty_hunter','钥匙就在档案柜里。你被通缉时，它根本没离开皇宫。','The key sits in the archive cabinet. While you were wanted, it never left the palace.'],['slark','那就把整座柜子搬走。','Then I will carry off the whole cabinet.'],['phantom_assassin','安静。宫卫换岗只有一轮空隙；用无声通行处理守卫。','Quietly. The changing of the guard leaves one round of gaps; use Silent Passage on the sentries.'],['sentry','月纹在上——凡影皆现形。','By the moon-mark — let every shadow show itself.'],['phantom_assassin','宫卫会一轮接一轮地补上哨位。每一位活过当轮的守卫，都会拉响警钟。','Sentries will rejoin their posts round after round. Any guard left alive at round’s end rings the bell.']],
  outro:'钥匙不是开锁，而是校准暗月坠落的方向。你留下副本，把证据交给沿海每一个港口。',outroEn:'The key opens no lock — it calibrates where the dark moon falls. You leave a copy and hand the evidence to every port along the coast.',
  clue:'潜入规则：队伍不自动攻击；每轮获得无声通行。攻击牌增加警戒，达到 2 即失败；前庭哨位上，当轮未倒的守卫会立刻拉响警报。',clueEn:'Infiltration rules: the party never attacks on its own; gain a Silent Passage each round. Attack cards raise the alarm — at 2 you fail; on the gallery watch, any guard alive at round’s end sounds it instantly.',clearStigma:0},
 {title:'诗中尚有春天',titleEn:'Spring Still Lives in the Poem',act:'第三幕 · 失重的真相',actEn:'Act III · Weightless Truths',place:'霜龙书库',placeEn:'the Frostwyrm Library',lanes:2,kind:'clear',enemy:'winter_wyvern',hp:40,atk:7,rounds:10,recruit:'winter_wyvern',stigma:1,elite:'trial',grant:'story_wyrm',
  lore:'古龙诗集不是失窃的文物，是龙族记忆的封印。寒冬飞龙守着最后一份抄本——她要亲眼确认，抱着蛋的逃犯配不配读它。',
  loreEn:'The elder poem is no stolen relic — it is the seal on dragon memory. Winter Wyvern guards the last copy, and she must see with her own eyes whether the egg-bearing fugitive deserves to read it.',
  intro:[['winter_wyvern','你怀里的是我们的记忆。人类把它称作蛋，好卖一个价钱。','What you carry is our memory. Men call it an egg so they can price it.'],['slark','它在牢里冷得发抖。','It shivered in that cell.'],['winter_wyvern','蛋里锁着一位见证者。抱错了方向，它会记住你的冷。','A witness sleeps in that shell. Cradle it wrong, and it will remember your cold.'],['slark','那你看看我的手。它们抱它的方式，和抱自己孩子一样。','Then look at my hands. They hold it the way they would hold my own child.'],['winter_wyvern','那就让我确认，你没有把它变成另一件武器。','Then let me make sure you have not turned it into another weapon.']],
  outro:'古诗是一份封印誓约。龙蛋浮出一幅画：当年月亮碎裂，泽特把自己的一个影子锁进了海底。龙族认下了这个抱蛋的人——一只幼龙愿意随行。',outroEn:'The poem proves to be a covenant of sealing. The egg projects a vision: when the moon shattered, Zet locked one of his own shadows beneath the sea. The dragonkin accept the egg-bearer — a whelp offers to follow.',
  clue:'“归还三物，容器归位。”这不是赃物清单，是祭仪。龙裔盟誓已加入你的牌组。',clueEn:'“Return the three things, and the vessel is restored.” This is no list of loot — it is a rite. Wyrmkin Oath has joined your deck.',clearStigma:1},
 {title:'不熄的借火',titleEn:'Borrowed Fire, Unquenched',act:'第三幕 · 失重的真相',actEn:'Act III · Weightless Truths',place:'灰烬圣坛',placeEn:'the Ashen Shrine',coreHp:40,lanes:2,kind:'defend',enemy:'phoenix',hp:38,atk:7,rounds:4,recruit:'phoenix',stigma:2,
  lore:'凤凰羽毛从不在任何人的行囊里——它在灰烬圣坛，被抽走影子后仍替整片海岸取暖。残月回声派来的冷暗，正一波波压向火种。',
  loreEn:'The phoenix feather was never in anyone’s pack — it hangs in the Ashen Shrine, still warming the coast after its shadow was stripped away. Now the Waning Echo sends waves of cold against the flame.',
  intro:[['phoenix','……','...'],['winter_wyvern','它要你守住火种，而不是夺走羽毛。','It asks you to keep the flame, not to take the feather.'],['phoenix','……','...'],['slark','终于有一个考官，不打算替我写罪名。','At last, an examiner who does not write my charges for me.'],['enchantress','它在发抖——不是冷的。火苗认得那天来取影子的人。','It trembles — not from cold. The flame remembers who came for its shadow.']],
  outro:'羽毛一直在圣坛，它只是被抽走了影子。三份伪证都指向同一个月纹印章。',outroEn:'The feather never left the shrine — only its shadow was drawn out. All three forgeries point to the same moon-mark seal.',
  clue:'火种照出印章主人的脸：泽特的残影，而非泽特本身。',clueEn:'The flame reveals the seal-owner’s face: Zet’s remnant, not Zet himself.',clearStigma:2},
 {title:'五秒以前',titleEn:'Five Seconds Ago',act:'第三幕 · 失重的真相',actEn:'Act III · Weightless Truths',place:'编织者的时间茧',placeEn:"Weaver's Time-Cocoon",lanes:1,kind:'rewind',enemy:'weaver',hp:40,atk:8,rounds:9,recruit:'weaver',
  lore:'你已经在这条时间线上输过一次。编织者把败局织成茧，只为让你亲口说出哪五秒钟值得重来。',
  loreEn:'You have already lost once on this thread of time. Weaver wove the defeat into a cocoon, only to make you say aloud which five seconds deserve to be rewoven.',
  intro:[['weaver','你已经输过了。只是你还没记起来。','You have already lost. You simply do not remember yet.'],['slark','那你为什么不把我送回牢里？','Then why not send me back to my cell?'],['weaver','送回牢里一百次，你都会去抱那颗蛋。','Send you back a hundred times — you would still reach for that egg.'],['weaver','囚衣里的时光牌是我留的。现在用它解开茧，我只再借你一次。','The time card in your prison shirt was mine. Now use it to unweave the cocoon — I lend it once more, and only once.'],['slark','如果这五秒不够，我就用自己的命去补。','If five seconds are not enough, I will pay the rest with my life.']],
  outro:'你看见未来的自己倒在一圈空椅子中。编织者剪断这条线，却警告你：命运不能永远赊账。',outroEn:'You see your future self fallen among a ring of empty chairs. Weaver cuts that thread, but warns: fate cannot be put on credit forever.',
  clue:'必须施放时光倒流，才能击破时间茧。',clueEn:'You must cast Rewind before the cocoon can be broken.'},
 {title:'暗礁仰望天空',titleEn:'The Reef Looks Up',act:'第三幕 · 失重的真相',actEn:'Act III · Weightless Truths',place:'逆潮之井',placeEn:'the Counterflow Well',lanes:3,kind:'assault',enemy:'arc_warden',hp:46,atk:8,rounds:11,
  lore:'逆潮之井把整片海岸的力量抽向月亮。残月信徒已经跪拜了三个满月——你一路夺回的所有银线，都将在今夜回流天上。',
  loreEn:'The Counterflow Well draws the whole coast’s strength up to the moon. The waning cultists have knelt through three full moons — every silver thread you reclaimed tonight will flow back into the sky.',
  scenes:[
   {enemy:'moon_cultist',kind:'clear',lanes:2,hp:34,atk:6,rounds:10},
   {enemy:'arc_warden',kind:'assault',lanes:3,hp:46,atk:8,rounds:11,interlude:[['cultist','井底没有水。井底是一扇门，门上是你囚号的原稿。','There is no water in the well. At its bottom stands a door, inscribed with the first draft of your prison number.'],['slark','原来他们从第一天起，就在替月亮量我的笼子。','So from the very first day, they were measuring my cage for the moon.']]}],
  intro:[['echo','监狱是月亮的伤口。你不是逃出来，是替我把锁带到了人间。','The prison is the moon’s wound. You did not escape — you carried my lock into the world.'],['slark','赏单、村钟、月石，全是你？','The warrants, the village bell, the moonstone — all of it was you?'],['echo','我只告诉世界你会偷走什么。世界就把那些东西送到了你的路上。','I merely told the world what you would steal. The world delivered those things to your path.'],['cultist','拜了三轮满月，就为这一刻。献出容器。','Three full moons of kneeling were for this hour. Give up the vessel.'],['slark','我走的路，每一步都站在别人门前。这一回，是我敲门。','Every road I walked began at someone else’s door. This time, I knock.']],
  outro:'钥匙、诗与羽影拼成坐标。你亲手砸碎收集井，仍来不及阻止最后一束力量回流。',outroEn:'The key, the poem and the feather’s shadow form coordinates. You smash the well yourself — too late to stop the last surge of power flowing home.',
  clue:'下一战开始，共鸣带来的攻击与额外成长将被抽离。',clueEn:'From the next battle onward, the attack that resonance granted will be drawn out of you.'},
 {title:'空手的人',titleEn:'Empty Hands',act:'终幕 · 潮汐回流',actEn:'Final Act · The Tide Returns',place:'坠月海岸',placeEn:'Moonfall Shore',lanes:2,kind:'defend',enemy:'arc_warden',hp:42,atk:7,rounds:4,drain:true,
  lore:'潮汐刃里的魔力一夜之间回了天上。坠月海岸上，你还站着的理由只剩下那些没有松手的人。',
  loreEn:'Overnight, the mana in the tide blade went home to the sky. On Moonfall Shore, the only reasons left to stand are the people who never let go.',
  intro:[['slark','刀里的魔力，不回应我了。','The mana in my blade no longer answers me.'],['rubick','因为它从来没有真正属于你。看看还留在岸上的人。','Because it was never truly yours. Look at who stayed on this shore.'],['slark','我没有力量能偿还你们。','I have no power left to repay you.'],['companion','先活下来。账可以慢慢算。','Stay alive first. Debts can be settled slowly.'],['enchantress','你终于空手了。空手的人才知道该握什么。','At last your hands are empty. Empty hands finally know what to hold.']],
  outro:'银光离开了你的身体，肩膀却第一次没有那么沉。远处，被你抛下的人也在走来。',outroEn:'The silver light leaves your body, and for the first time your shoulders feel lighter. Far off, the ones you abandoned are walking toward you.',
  clue:'被决裂的队友会在终战作为残月幻影出现。',clueEn:'Companions you severed will return as waning phantoms in the last battles.'},
 {title:'被留下的名字',titleEn:'The Names That Stayed',act:'终幕 · 潮汐回流',actEn:'Final Act · The Tide Returns',place:'碎月长桥',placeEn:'the Long Bridge of Shards',lanes:3,kind:'clear',enemy:'phantom_assassin',hp:44,atk:8,rounds:10,drain:true,elite:'veil',
  lore:'碎月长桥两端，残月回声开出一笔旧账：把你交出去，所有人的名字都能从借据上划掉。魅影之纱列阵于桥上，执行她们真正的那张名单。',
  loreEn:'At both ends of the Long Bridge of Shards, the Waning Echo calls in an old debt: hand you over, and every name is struck from the ledger. The Sisters of the Veil form ranks on the bridge, serving their true list at last.',
  scenes:[
   {enemy:'veil_blade',kind:'clear',lanes:3,hp:38,atk:6,rounds:10,elite:'veil',foe:'shroud',drain:true},
   {enemy:'phantom_assassin',kind:'clear',lanes:3,hp:44,atk:8,rounds:10,pursuit:true,elite:'veil',drain:true,echo:true,interlude:[['phantom_assassin','残刃挡不住桥。名单的最后一行，要由我亲手念完。','The blades cannot hold this bridge. The last line of the list must be read by my own hand.'],['slark','那一行写的是谁，你我都已经知道了。','We both know whose name that last line holds.']]}],
  intro:[['echo','他们为你付出的，我都可以还给他们。只要他们把你交出来。','Whatever they paid for you, I can repay. They need only hand you over.'],['phantom_assassin','名单上的名字全是借据。撕掉它们的办法只有一个。','Every name on this list is a debt-note. There is only one way to tear them up.'],['slark','我记得每一个名字。现在轮到我站在前面。','I remember every name. Now it is my turn to stand in front.'],['echo','桥会塌。你会连回家的方向都失去。','The bridge will fall. You will lose even the direction of home.'],['slark','海从不问来处。方向是他们替我记住的。','The sea never asks where you came from. My direction is kept by them.']],
  outro:'桥的尽头没有王座，只有一个与暗礁牢房同样大小的圆环。最后的钥匙是自愿留下的人。',outroEn:'No throne waits at the bridge’s end — only a ring the size of your old reef cell. The last key is whoever chooses to stay.',
  clue:'亲密队友的约定牌，会在最后一战保留全部力量。',clueEn:'The vow cards of close companions keep their full strength in the final battle.'},
 {title:'自由的潮汐',titleEn:'The Tide of the Free',act:'终幕 · 潮汐回流',actEn:'Final Act · The Tide Returns',place:'暗月之心',placeEn:'Heart of the Dark Moon',lanes:3,kind:'final',enemy:'arc_warden',hp:62,atk:9,rounds:12,drain:true,echo:true,
  lore:'泽特被封进海底的那个影子，只想让“独自承担”成为唯一答案。可你一路借来的每一样东西——山心、蛛丝、海鳞、名单上所有名字——都在等一个不同的结尾。',
  loreEn:'The shadow Zet sealed under the sea wants “carry it alone” to be the only answer. But everything you borrowed along the way — mountain-heart, silk, sea-scale, every name on the list — waits for a different ending.',
  intro:[['echo','杀了我，月亮仍会落下。你还可以回到笼子里，成为新的锁。','Kill me and the moon still falls. You could return to the cage and become the new lock.'],['slark','你总把选择说成一人承担的事。','You always describe choices as things one person must carry alone.'],['companion','这次不是。','Not this time.'],['echo','连锁都会骗你。锁只认得一种忠心：独自。','Even chains lie to you. A lock knows one loyalty: solitude.'],['slark','一起。把这道裂缝，带回海里。','Together. We carry this rift back into the sea.']],
  outro:'潮水淹没银色的牢门。龙蛋第一次睁开眼睛，记住了所有没有松手的人。',outroEn:'The tide drowns the silver door. The dragon egg opens its eyes for the first time, and remembers every hand that never let go.',
  clue:'全队阵亡或回合耗尽即失败。击败残月回声与所有幻影，结束旅程。',clueEn:'A party wipe or an exhausted clock means defeat. Defeat the Waning Echo and every phantom to end the journey.'}
];
stages.forEach((s,i)=>{s.id=i;s.number=i+1;});
/* scene(st, i) merges a scene entry over its stage; stage-level battle fields are the defaults. */
function scene(st,i=0){const sc=st?.scenes?.[i];return sc?Object.assign({},st,sc):st;}
const sceneCount=st=>st?.scenes?.length||1;
const objectives={clear:{name:'击败所有敌人',en:'Defeat every enemy'},defend:{name:'守住所有灯火，撑过规定轮数',en:'Keep every beacon lit for the allotted rounds'},assault:{name:'摧毁所有敌方封印',en:'Destroy every enemy seal'},stealth:{name:'用无声通行击败守卫；无自动攻击，警戒 < 2',en:'Slay the guards with Silent Passage; no auto-attacks, alarm < 2'},sentry:{name:'当轮出现的宫卫必须在当轮倒下；警戒 < 2，主将阵亡即胜',en:'Each round’s sentry must fall within that round; alarm < 2, and slaying the warden wins'},rewind:{name:'使用时光倒流，再击败编织者',en:'Cast Rewind, then defeat Weaver'},final:{name:'击败残月回声与全部幻影',en:'Defeat the Waning Echo and every phantom'}};
/* 抉择 — branching choices offered after a stage is cleared; every option is a trade-off. */
const events=[
 {id:'crossroads',after:4,title:'三岔口的灯',titleEn:'Lamps at the Crossroads',prompt:[['slark','追上去，能查出名单是谁改的；留下来，孩子们能活着走完堤道。','Press on and learn who rewrote the list; stay, and the children live to cross the causeway.'],['phantom_assassin','我不管你的选择。但名单会等，孩子不会。','Your choice is yours. But the list can wait — the children cannot.']],options:[
  {key:'pursue',label:'追猎流言',labelEn:'Pursue the rumor',detail:'旅费 +45、共鸣 +1；下一关敌将 +4 生命、+1 攻击。',detailEn:'+45 supplies, +1 resonance; the next stage’s champion gains +4 health and +1 attack.',fx:{gold:45,resonance:1,next:{enemyHp:4,enemyAtk:1}},journal:'你选择了追猎。流言的尽头是一枚月纹——代价由下一战的路先付。',journalEn:'You chose pursuit. The rumor ends at a moon-mark — the next road pays its toll first.'},
  {key:'escort',label:'守夜护送',labelEn:'Escort the night watch',detail:'全队羁绊 +1、旅费 +20；下一关敌将 +2 生命。',detailEn:'+1 bond for the whole party, +20 supplies; the next stage’s champion gains +2 health.',fx:{gold:20,loyaltyAll:1,next:{enemyHp:2}},journal:'你留下了。堤道尽头没有谢礼，只有没熄的灯。',journalEn:'You stayed. No reward waited at the causeway’s end — only lamps still burning.'}]},
 {id:'mirrorhall',after:9,title:'折镜里的捷径',titleEn:'The Mirrorhall Shortcut',prompt:[['rubick','镜廊能把你们直接送进皇宫——只是镜子按惯例要抽一点过路费。','The mirror-gallery can put you inside the palace — though the mirrors charge their usual toll.'],['slark','过路费？','A toll?'],['rubick','从你身上抽一点血。或者绕远路，把月亮的位置看清楚了再进城。','A little of your blood. Or take the long road and map the moon before entering the city.']],options:[
  {key:'mirror',label:'穿过镜廊',labelEn:'Take the gallery',detail:'旅费 +35；下一关小鱼人开局已受 4 点伤。',detailEn:'+35 supplies; Slark begins the next stage already wounded for 4.',fx:{gold:35,next:{slarkDamage:4}},journal:'镜子收走的热度，在档案库的月光里才慢慢回来。',journalEn:'The warmth the mirrors took only returns under the archive moonlight.'},
  {key:'around',label:'绕开折镜',labelEn:'Walk around the mirrors',detail:'全队羁绊 +1；下一关敌方小兵 +1 攻击。',detailEn:'+1 bond for the whole party; enemy underlings gain +1 attack next stage.',fx:{loyaltyAll:1,next:{creepAtk:1}},journal:'远路让你们看清了月纹哨位，也让追兵看清了你们。',journalEn:'The long road showed you the moon-marked posts — and showed the hunters where you were.'}]},
 {id:'borrowed_fire',after:12,title:'赊来的火',titleEn:'Fire on Credit',prompt:[['phoenix','……','...'],['winter_wyvern','凤凰愿意把火种赊给你。火焰记账的方式，只有灰烬知道。','Phoenix offers you its fire on credit. Only the ash knows how the flame keeps its ledger.'],['slark','我借的东西已经够多了。还差这一把火？','I have borrowed so much already. What is one more flame?']],options:[
  {key:'borrow',label:'借下火种',labelEn:'Borrow the ember',detail:'共鸣 +2；下一关敌将 +2 攻击。',detailEn:'+2 resonance; the next stage’s champion gains +2 attack.',fx:{resonance:2,next:{enemyAtk:2}},journal:'火种在你掌心记账。它不催，只是越来越沉。',journalEn:'The ember keeps its ledger in your palm. It never presses — only grows heavier.'},
  {key:'decline',label:'只看一眼',labelEn:'Just look once',detail:'生命成长 +2；获得一张石印卫戍（若牌组未满）。',detailEn:'+2 health growth; gain a Seal-Stone Vigil card (if the deck has room).',fx:{health:2,card:'story_ward'},journal:'你没有借火。圣坛回赠了一块石印——它记得每个拒绝赊账的人。',journalEn:'You did not borrow the fire. The shrine gave you a seal-stone in return — it remembers everyone who refuses credit.'}]},
 {id:'last_lamp',after:15,title:'最后一桶火油',titleEn:'The Last Flask of Oil',prompt:[['companion','火油只够一处。给灯，还是给刀？','There is oil for one thing only. The lamp, or the blade?'],['slark','给他们。我把暗月借来的力气，快用完了。','For them. What the dark moon lent me is nearly spent.']],options:[
  {key:'share',label:'分给同行者',labelEn:'Share it with companions',detail:'全队羁绊 +1；下一关敌将 +2 攻击。',detailEn:'+1 bond for the whole party; the next stage’s champion gains +2 attack.',fx:{loyaltyAll:1,next:{enemyAtk:2}},journal:'火光照亮了同行的人，也照亮了桥上等着你的名单。',journalEn:'The fire lit the ones beside you — and lit the list waiting on the bridge.'},
  {key:'keep',label:'握住火种',labelEn:'Keep the ember',detail:'攻击成长 +1、共鸣 +1；三类污名 +1。',detailEn:'+1 attack growth, +1 resonance; all three stigmas +1.',fx:{growthAttack:1,resonance:1,stigma:1},journal:'你把最后一点热留给了自己。月亮认得这种贪心。',journalEn:'You kept the last warmth for yourself. The moon knows this kind of hunger.'}]}
];
/* Russian story text: language-neutral identifiers and mechanics remain shared. */
heroes[0]["nameRu"]="Сларк";
heroes[0]["textRu"]="Осколки тёмной луны · сюжетный режим";
heroes[1]["nameRu"]="Тини";
heroes[1]["textRu"]="Осколки тёмной луны · сюжетный режим";
heroes[2]["nameRu"]="Брудмать";
heroes[2]["textRu"]="Осколки тёмной луны · сюжетный режим";
heroes[3]["nameRu"]="Слардар";
heroes[3]["textRu"]="Осколки тёмной луны · сюжетный режим";
heroes[4]["nameRu"]="Рубик";
heroes[4]["textRu"]="Осколки тёмной луны · сюжетный режим";
heroes[5]["nameRu"]="Ткач";
heroes[5]["textRu"]="Осколки тёмной луны · сюжетный режим";
heroes[6]["nameRu"]="Феникс";
heroes[6]["textRu"]="Осколки тёмной луны · сюжетный режим";
heroes[7]["nameRu"]="Зет, угасающее эхо";
heroes[7]["textRu"]="Осколки тёмной луны · сюжетный режим";
units[0]["nameRu"]="Каменнолицый тюремщик";
units[0]["textRu"]="Осколки тёмной луны · сюжетный боец";
units[1]["nameRu"]="Начальник дворцовой стражи";
units[1]["textRu"]="Осколки тёмной луны · сюжетный боец";
units[2]["nameRu"]="Лунный часовой";
units[2]["textRu"]="Осколки тёмной луны · сюжетный боец";
units[3]["nameRu"]="Клинок Вуали";
units[3]["textRu"]="Осколки тёмной луны · сюжетный боец";
units[4]["nameRu"]="Сборщик гильдии";
units[4]["textRu"]="Осколки тёмной луны · сюжетный боец";
units[5]["nameRu"]="Сектант угасающей луны";
units[5]["textRu"]="Осколки тёмной луны · сюжетный боец";
units[6]["nameRu"]="Дракончик";
units[6]["textRu"]="Осколки тёмной луны · сюжетный боец";
units[7]["nameRu"]="Страж каменной печати";
units[7]["textRu"]="Осколки тёмной луны · сюжетный боец";
units[8]["nameRu"]="Налётчик Красного тумана";
units[8]["textRu"]="Осколки тёмной луны · сюжетный боец";
people["slark"][2]="Сларк";
people["slardar"][2]="Слардар";
people["bounty_hunter"][2]="Охотник за головами";
people["phantom_assassin"][2]="Призрачная убийца";
people["enchantress"][2]="Чародейка";
people["villager"][2]="Житель деревни";
people["chief"][2]="Староста";
people["sorla"][2]="Сорла Хан";
people["magnus"][2]="Магнус";
people["tiny"][2]="Тини";
people["broodmother"][2]="Брудмать";
people["tidehunter"][2]="Охотник прилива";
people["rubick"][2]="Рубик";
people["portrait"][2]="Эхо Аганима";
people["echo"][2]="Угасающее эхо";
people["winter_wyvern"][2]="Зимняя виверна";
people["phoenix"][2]="Феникс";
people["weaver"][2]="Ткач";
people["companion"][2]="Спутник";
people["gaoler"][2]="Каменнолицый тюремщик";
people["tollman"][2]="Сборщик гильдии";
people["sentry"][2]="Лунный часовой";
people["cultist"][2]="Сектант угасающей луны";
people["whelp"][2]="Дракончик";
cards[0]["nameRu"]="Прыжок";
cards[0]["textRu"]="Наносит цели 6 урона и обезоруживает её на этот раунд.";
cards[1]["nameRu"]="Перенос сущности";
cards[1]["textRu"]="Наносит 5 пробивающего урона; Сларк получает +1 атаку до конца главы. После ковки возвращает ману.";
cards[2]["nameRu"]="Тёмный пакт";
cards[2]["textRu"]="Все враги на линии получают 4 пробивающего урона; Сларк теряет 2 здоровья и снимает ослабления.";
cards[3]["nameRu"]="Танец теней";
cards[3]["textRu"]="Восстанавливает 7 здоровья и даёт 1 броню на этот раунд.";
cards[4]["nameRu"]="Плечом к плечу";
cards[4]["textRu"]="Даёт 3 брони на этот раунд. Крепкие связи добавляют лечение.";
cards[5]["nameRu"]="Бальзам прилива";
cards[5]["textRu"]="Восстанавливает 6 здоровья.";
cards[6]["nameRu"]="Ополчение Рифа";
cards[6]["textRu"]="Призывает на линию добровольца с 3 атаки и 7 здоровья.";
cards[7]["nameRu"]="Заточка Рифа";
cards[7]["textRu"]="Заменяет оружие: +2 атаки. Бонусы одного слота не складываются.";
cards[8]["nameRu"]="Бесшумный проход";
cards[8]["textRu"]="Наносит стражу 8 пробивающего урона без повышения тревоги; другим врагам — 3.";
cards[9]["nameRu"]="Возврат времени";
cards[9]["textRu"]="Восстанавливает 10 здоровья и снимает ослабления; в пещере расплетает кокон времени.";
cards[10]["nameRu"]="Обещание Аганима";
cards[10]["textRu"]="Раз за путешествие: восстанавливает всему отряду 12 здоровья и наносит всем врагам 8 пробивающего урона.";
cards[11]["nameRu"]="Клятва возвращения";
cards[11]["textRu"]="Восстанавливает 5 здоровья и навсегда даёт +2 атаки; близкие спутники добавляют ещё +1.";
cards[12]["nameRu"]="Остаток вуали";
cards[12]["textRu"]="Укрывает союзника вуалью: в этом раунде его нельзя атаковать, он получает +2 брони.";
cards[13]["nameRu"]="Призрачное эхо";
cards[13]["textRu"]="Наносит 4 пробивающего урона. Если цель гибнет, возьмите карту и верните 1 ману. При проникновении не повышает тревогу.";
cards[14]["nameRu"]="Метка гильдии";
cards[14]["textRu"]="Накладывает метку: если цель погибнет в этой сцене, каждый контракт принесёт +12 припасов при подведении итогов.";
cards[15]["nameRu"]="Клятва драконьего рода";
cards[15]["textRu"]="Призывает на линию дракончика с 4 атаки и 8 здоровья.";
cards[16]["nameRu"]="Клятва чешуи";
cards[16]["textRu"]="До конца главы союзник получает +2 брони и восстанавливает 2 здоровья каждый раунд. Яйцо помнит истинное имя.";
cards[17]["nameRu"]="Дозор каменной печати";
cards[17]["textRu"]="Призывает на линию стража каменной печати с 0 атаки, 12 здоровья и 3 брони.";
cards[18]["nameRu"]="Печать безмолвной луны";
cards[18]["textRu"]="Разрушает 4 брони цели и сковывает её на раунд: она не может атаковать или двигаться.";
cards[19]["nameRu"]="Покров сестёр";
cards[19]["textRu"]="Только для врага: в начале каждого раунда один враг скрывается под вуалью, и его нельзя атаковать.";
cards[20]["nameRu"]="Десятина гильдии";
cards[20]["textRu"]="Только для врага: в начале каждого раунда один ваш герой теряет 1 атаку.";
stages[0]["titleRu"]="Отпертый Риф";
stages[0]["actRu"]="Акт I · Прилив без берегов";
stages[0]["placeRu"]="Тёмный Риф / подземные камеры";
stages[0]["loreRu"]="Тёмный Риф никого не отпускает. Каменнолицый тюремщик тридцать лет повторяет твой номер. Последнюю дверь охраняет Слардар, страж глубин. Он не тюремщик — лишь ещё одна фигура на доске.";
stages[0]["scenes"][1]["interlude"][0][3]="Твой номер недействителен… теперь петли поворачиваются сами.";
stages[0]["scenes"][1]["interlude"][1][3]="Положи яйцо. Оно знает каждый замок этой тюрьмы.";
stages[0]["intro"][0][3]="Стой. Яйцо у тебя в руках — печать этой тюрьмы.";
stages[0]["intro"][1][3]="Ты слышишь печать. Я слышу сердцебиение.";
stages[0]["intro"][2][3]="Каждый удар ослабляет двери. Ты делаешь это намеренно или по незнанию?";
stages[0]["intro"][3][3]="Я знаю только, что там, в холоде, оно дрожало.";
stages[0]["intro"][4][3]="Тогда покажи, чем заплатишь за открытую дверь.";
stages[0]["outroRu"]="На чешуе самого стража тоже выбит номер заключённого. Слардар опускает трезубец: «Победил меня — возьми с собой узнать правду об этой тюрьме».";
stages[0]["clueRu"]="В лунном свете яйцо гудит теми же тремя низкими нотами, что и двери камер. В тюремной рубахе лежит карта времени с надписью «пять секунд». Ты не помнишь, кто её дал.";
stages[1]["titleRu"]="Три украденных имени";
stages[1]["actRu"]="Акт I · Прилив без берегов";
stages[1]["placeRu"]="Переправа солёного тумана";
stages[1]["loreRu"]="Объявления о розыске опередили прилив. Золотой ключ, поэма драконов, перо феникса — три кражи, которых ты не совершал, уже назначили цену за твой плавник.";
stages[1]["scenes"][1]["interlude"][0][3]="Гильдия признаёт контракты, а не лица. Сегодня твоя цена утроилась.";
stages[1]["scenes"][1]["interlude"][1][3]="Посторонись, сборщик. Эта добыча записана на меня.";
stages[1]["intro"][0][3]="Золотой ключ, стихи древнего дракона, перо феникса. Три ордера подписаны одной рукой.";
stages[1]["intro"][1][3]="В мои карманы не поместится столько легенд.";
stages[1]["intro"][2][3]="На каждом ордере оттиск твоей чешуи — чётче, чем снятый при рождении.";
stages[1]["intro"][3][3]="Кто-то уже украл меня самого, ещё до моей первой кражи.";
stages[1]["intro"][4][3]="Может, заказчик платит не за пропажу, а за то, чтобы весь мир поверил в твою вину.";
stages[1]["outroRu"]="На обороте ордеров проступает серебряный лунный знак. Охотник идёт с тобой: ему любопытно, кто посмел подделать даже награду.";
stages[1]["clueRu"]="Чернила на всех трёх ордерах бледнеют одновременно.";
stages[2]["titleRu"]="Огонь держится";
stages[2]["actRu"]="Акт I · Прилив без берегов";
stages[2]["placeRu"]="Камышовая деревня / две дамбы";
stages[2]["loreRu"]="Камышовая деревня приютила беглеца и потеряла право на нейтралитет. Войско Красного тумана наступает по двум дамбам. Им нужен не ты — они хотят научить каждую деревню бояться.";
stages[2]["scenes"][1]["interlude"][0][3]="Вторая волна! Они идут под боевым знаменем!";
stages[2]["scenes"][1]["interlude"][1][3]="Приказ велит сжечь деревню. Но я не могу разобрать, чей лунный знак его скрепляет.";
stages[2]["intro"][0][3]="Сначала перевяжи раны. Здесь не спрашивают тюремных номеров.";
stages[2]["intro"][1][3]="Красный туман здесь! Они обещают сжечь каждую деревню, укрывшую беглеца!";
stages[2]["intro"][2][3]="Беглец, выходи. Или смотри, как огни гаснут один за другим.";
stages[2]["intro"][3][3]="Отведите детей к маяку. Я им отвечу.";
stages[2]["intro"][4][3]="То, на что ты не сумеешь ответить, повязкой не затянешь. Но сперва сохраним огонь.";
stages[2]["outroRu"]="После четырёх волн маяк всё ещё горит. Сорла обнаруживает поддельный приказ, уводит войска и оставляет сигнальный жетон. Чародейка собирает сумку: «Если за тобой охотятся, лекарства должны идти с тобой».";
stages[2]["clueRu"]="Старый колокол маяка бьётся в такт сердцу драконьего яйца.";
stages[3]["titleRu"]="Сломанный лунный рог";
stages[3]["actRu"]="Акт I · Прилив без берегов";
stages[3]["placeRu"]="Каменный лес";
stages[3]["loreRu"]="Магнус разнёс половину Каменного леса не от безумия: кто-то вбил лунный камень в его рог. Все обломки лежат в одном направлении.";
stages[3]["intro"][0][3]="Не подходи! Этот звук внутри моего рога!";
stages[3]["intro"][1][3]="Это не дикость. Кто-то вогнал лунный камень ему в череп.";
stages[3]["intro"][2][3]="С каждым ударом он поёт громче. Он считает меня.";
stages[3]["intro"][3][3]="Я знаю такие замки. Сначала сломаем его, потом обсудим деревья.";
stages[3]["intro"][4][3]="Тогда быстрее. Я уже почти не слышу собственных копыт.";
stages[3]["outroRu"]="На извлечённом камне стоит клеймо деревенского мастера колоколов. Ты спас Магнуса и раскрыл секрет: ты можешь касаться тёмной луны.";
stages[3]["clueRu"]="Из трещины камня сочится серебряный свет и плывёт на север против ветра.";
stages[4]["titleRu"]="Ночь прощания";
stages[4]["actRu"]="Акт I · Прилив без берегов";
stages[4]["placeRu"]="За Камышовой деревней / тройная дамба";
stages[4]["loreRu"]="Деревня сажает тебя в повозку не из ненависти: гул яйца будит то, чему положено спать. Из лунного света выходят Сёстры Вуали. Они не убийцы — они команда по возврату имущества.";
stages[4]["scenes"][1]["interlude"][0][3]="Клинки были лишь путеводным свистом. Настоящая команда высаживается у тебя за спиной.";
stages[4]["scenes"][1]["interlude"][1][3]="Так вот зачем три дамбы: вы хотите, чтобы я не понял, в какой повозке дети.";
stages[4]["intro"][0][3]="Дети тебя боятся. Когда звонит колокол, им снится трещина в небе.";
stages[4]["intro"][1][3]="Поэтому ты назвал моё имя убийцам?";
stages[4]["intro"][2][3]="Они пришли не убивать. У них была книга, и они сказали: все, кто тебя приютил, теперь должники.";
stages[4]["intro"][3][3]="В моём списке нет жителей деревни. Кто-то изменил пророчество. Отойди, каждый ищет свою правду.";
stages[4]["intro"][4][3]="Сначала я проведу повозки через дамбы. Твоя дорога идёт за моей спиной.";
stages[4]["outroRu"]="Ты провожаешь последнюю повозку, но никто не зовёт тебя с собой. Убийца рвёт поддельный список и пока идёт рядом.";
stages[4]["clueRu"]="Там, где в списке написано «беглец», раньше было «сосуд».";
stages[5]["titleRu"]="Вес горы";
stages[5]["actRu"]="Акт II · Заёмный клинок";
stages[5]["placeRu"]="Вершина эха";
stages[5]["loreRu"]="Клинку прилива нужны три клятвы: кость горы, жила паутины и морское лезвие. Тини хранит сердце горы. Камень не продают, а одалживают, и плата за него — обещание.";
stages[5]["intro"][0][3]="Тебе нужен клинок, разрезающий лунные замки, а не людей.";
stages[5]["intro"][1][3]="Камень не бывает даром. Сдвинешь меня — одолжу сердце горы.";
stages[5]["intro"][2][3]="Я не могу сдвинуть гору. Но могу попросить её захотеть этого.";
stages[5]["intro"][3][3]="Тогда попробуй, рыбёшка. Сто лет никто не задавал вершине вопросов.";
stages[5]["outroRu"]="Тини отдаёт сердце горы: «Взаймы, не в подарок. Когда вернёшься домой, покажи мне море».";
stages[5]["clueRu"]="Первый материал — не трофей, а обещание, которое придётся исполнить.";
stages[6]["titleRu"]="Имя в паутине";
stages[6]["actRu"]="Акт II · Заёмный клинок";
stages[6]["placeRu"]="Каньон пустых гнёзд";
stages[6]["loreRu"]="На каждой скорлупке в каньоне выбит номер: первых детей выводка зарегистрировал и забрал Риф. Брудмать узнаёт каждый след, кроме твоего.";
stages[6]["intro"][0][3]="Каждый, кто несёт факел, говорит, что только проходит мимо.";
stages[6]["intro"][1][3]="Тогда я положу клинок. Сначала ослабь паутину у моих ног.";
stages[6]["intro"][2][3]="В твоих следах нет номера. Риф не забывает ни одно живое существо.";
stages[6]["intro"][3][3]="Может, он пытался. Может, я — пропущенная им трещина.";
stages[6]["intro"][4][3]="Сначала одолей моих детей. Потом поговорим о доверии.";
stages[6]["outroRu"]="Она даёт тебе моток огнеупорной паутины. Уходя, ты замечаешь на пустых скорлупках серийные номера самого Рифа.";
stages[6]["clueRu"]="В тюрьме держали не только преступников.";
stages[7]["titleRu"]="Старые клятвы глубин";
stages[7]["actRu"]="Акт II · Заёмный клинок";
stages[7]["placeRu"]="Затонувшая застава";
stages[7]["loreRu"]="Под затонувшей заставой покоится печать старой клятвы: страж обещал, что ничто из Рифа не вернётся в море. Охотник прилива ждал не тебя, а дня, когда клятва наконец ослабнет.";
stages[7]["intro"][0][3]="Слардар отдал тебе последнюю чешуйку? Тогда проверим, ради кого стражу стоит нарушить клятву.";
stages[7]["intro"][1][3]="Мне не нужен новый хозяин.";
stages[7]["intro"][2][3]="Морская чешуя не служит хозяевам. Она помнит тех, кому прилив задолжал возвращение.";
stages[7]["intro"][3][3]="Тогда разрушим старую заставу. Пусть море задолжает мне новый дом.";
stages[7]["outroRu"]="Сердце горы становится костью, паутина — жилой, морская чешуя — лезвием. Клинок прилива готов. Первая украденная им мана незаметно ускользает к небу.";
stages[7]["clueRu"]="Открыта ковка: Сларк получает клинок прилива с +2 атаки в каждом бою; перенос сущности возвращает 2 маны.";
stages[8]["titleRu"]="Тот, кто украл нож";
stages[8]["actRu"]="Акт II · Заёмный клинок";
stages[8]["placeRu"]="Зеркальный зал Аганима";
stages[8]["loreRu"]="Рубик умеет копировать любое заклинание, но ради нового клинка залез в твой мешок. Все зеркала зала следят, куда уходит его мана.";
stages[8]["intro"][0][3]="Умерь пыл. Твой клинок собирает энергию для другого.";
stages[8]["intro"][1][3]="И ты украл его из заботы о моём здоровье?";
stages[8]["intro"][2][3]="Из любопытства. Иногда это совпадает.";
stages[8]["intro"][3][3]="Тогда покажи зеркало. Для кого он собирает силу?";
stages[8]["intro"][4][3]="Хороший вопрос. Ответ висит в небе, а не у меня в руке. Сначала верни свой клинок в бою.";
stages[8]["outroRu"]="Рубик повторяет в зеркале путь клинка. Все серебряные нити ведут к одной луне.";
stages[8]["clueRu"]="Вор не спрятал улики — он заставил тебя увидеть их своими глазами.";
stages[9]["titleRu"]="Пустое место наставника";
stages[9]["actRu"]="Акт II · Заёмный клинок";
stages[9]["placeRu"]="Купол астролябии";
stages[9]["loreRu"]="Под куполом ждёт вопросов эхо, оставленное Аганимом. План лунной печати подписали трое; его имя стоит первым.";
stages[9]["intro"][0][3]="Ты вовремя. Разбей эхо на астролябии, и у нас будет время поговорить.";
stages[9]["intro"][1][3]="Верни сосуд. Верни ключ. Верни невылупившийся огонь.";
stages[9]["intro"][2][3]="У «сосуда» есть имя. У него бьётся сердце.";
stages[9]["intro"][3][3]="Даже извинения моего наставника прячутся за загадками.";
stages[9]["intro"][4][3]="Загадки задерживают того, кто в небе. Слушай, а потом уходи.";
stages[9]["outroRu"]="Эхо признаёт свою роль в заточении Рифа. Аганим оставляет скипетр и координаты: «Это яйцо — не последний дракон, а последний свидетель, помнящий старую печать».";
stages[9]["clueRu"]="Получен одноразовый скипетр. Сбереги его для того, кому он действительно понадобится.";
stages[10]["titleRu"]="Ключ без замка";
stages[10]["actRu"]="Акт III · Невесомая правда";
stages[10]["placeRu"]="Дворцовые архивы";
stages[10]["loreRu"]="Золотой ключ никогда не покидал дворец. Всё время, пока тебя преследовали, он лежал на бархате в архиве. Сегодня сменяется караул; дверь сторожит лишь луна.";
stages[10]["scenes"][1]["interlude"][0][3]="Галерея пуста. Шкафы внизу, и гильдия пришла первой.";
stages[10]["scenes"][1]["interlude"][1][3]="Этот ключ ждал меня с того дня, как его выковали.";
stages[10]["intro"][0][3]="Ключ лежит в архивном шкафу. Пока тебя разыскивали, он не покидал дворца.";
stages[10]["intro"][1][3]="Тогда я унесу весь шкаф.";
stages[10]["intro"][2][3]="Тихо. При смене караула есть окно в один раунд. Примени бесшумный проход к часовым.";
stages[10]["intro"][3][3]="Именем лунной печати — пусть каждая тень покажется.";
stages[10]["intro"][4][3]="Часовые будут возвращаться каждый раунд. Любой страж, доживший до конца раунда, ударит в колокол.";
stages[10]["outroRu"]="Ключ не открывает замок, а настраивает место падения тёмной луны. Ты оставляешь копию и передаёшь улики во все порты побережья.";
stages[10]["clueRu"]="Проникновение: отряд не атакует автоматически; каждый раунд выдаётся бесшумный проход. Атакующие карты повышают тревогу; при 2 — поражение. В галерее выживший к концу раунда часовой поднимает тревогу сразу.";
stages[11]["titleRu"]="В поэме ещё живёт весна";
stages[11]["actRu"]="Акт III · Невесомая правда";
stages[11]["placeRu"]="Библиотека ледяного дракона";
stages[11]["loreRu"]="Древняя поэма — не украденная реликвия, а печать драконьей памяти. Зимняя виверна хранит последнюю копию и хочет убедиться, достоин ли беглец с яйцом её прочесть.";
stages[11]["intro"][0][3]="Ты несёшь нашу память. Люди зовут её яйцом, чтобы назначить цену.";
stages[11]["intro"][1][3]="В камере оно дрожало.";
stages[11]["intro"][2][3]="В скорлупе спит свидетель. Держи его небрежно, и он запомнит твой холод.";
stages[11]["intro"][3][3]="Тогда посмотри на мои руки. Они держат его так, как держали бы собственного ребёнка.";
stages[11]["intro"][4][3]="Позволь убедиться, что ты не превратил его в очередное оружие.";
stages[11]["outroRu"]="Поэма оказывается договором о печати. Яйцо показывает видение: когда луна раскололась, Зет заточил одну из своих теней под морем. Драконы принимают хранителя яйца, и дракончик вызывается сопровождать его.";
stages[11]["clueRu"]="«Верни три вещи, и сосуд встанет на место». Это не список добычи, а обряд. В колоду добавлена клятва драконьего рода.";
stages[12]["titleRu"]="Заёмный огонь не гаснет";
stages[12]["actRu"]="Акт III · Невесомая правда";
stages[12]["placeRu"]="Святилище пепла";
stages[12]["loreRu"]="Перо феникса никогда не лежало в чужом мешке. Оно в святилище пепла и всё ещё согревает берег, хотя его тень украли. Теперь угасающее эхо шлёт волны холода к пламени.";
stages[12]["intro"][0][3]="…";
stages[12]["intro"][1][3]="Он просит сохранить пламя, а не забрать перо.";
stages[12]["intro"][2][3]="…";
stages[12]["intro"][3][3]="Наконец-то испытатель, который не сочиняет мне обвинения.";
stages[12]["intro"][4][3]="Он дрожит не от холода. Пламя помнит того, кто пришёл за его тенью.";
stages[12]["outroRu"]="Перо не покидало святилища — забрали лишь тень. Все три подделки ведут к одной лунной печати.";
stages[12]["clueRu"]="Пламя показывает лицо владельца печати: это осколок Зета, а не сам Зет.";
stages[13]["titleRu"]="Пять секунд назад";
stages[13]["actRu"]="Акт III · Невесомая правда";
stages[13]["placeRu"]="Кокон времени Ткача";
stages[13]["loreRu"]="На этой нити времени ты уже проиграл. Ткач сплёл поражение в кокон, чтобы ты вслух назвал пять секунд, которые стоит соткать заново.";
stages[13]["intro"][0][3]="Ты уже проиграл. Просто ещё не вспомнил.";
stages[13]["intro"][1][3]="Тогда почему не отправишь меня обратно в камеру?";
stages[13]["intro"][2][3]="Верни тебя хоть сто раз — ты всё равно потянешься к этому яйцу.";
stages[13]["intro"][3][3]="Карту времени в твоей рубахе оставил я. Расплети ею кокон. Одалживаю ещё один раз — последний.";
stages[13]["intro"][4][3]="Если пяти секунд не хватит, я доплачу своей жизнью.";
stages[13]["outroRu"]="Ты видишь себя в будущем: павшего в кругу пустых стульев. Ткач обрезает нить, но предупреждает: судьбу нельзя вечно брать в долг.";
stages[13]["clueRu"]="Прежде чем разрушить кокон, нужно применить возврат времени.";
stages[14]["titleRu"]="Риф смотрит в небо";
stages[14]["actRu"]="Акт III · Невесомая правда";
stages[14]["placeRu"]="Колодец обратного течения";
stages[14]["loreRu"]="Колодец вытягивает силу всего побережья к луне. Сектанты преклоняли колени три полнолуния. Сегодня все возвращённые тобой серебряные нити потекут обратно в небо.";
stages[14]["scenes"][1]["interlude"][0][3]="В колодце нет воды. На дне — дверь с первым наброском твоего тюремного номера.";
stages[14]["scenes"][1]["interlude"][1][3]="Значит, с первого дня они мерили мою клетку для луны.";
stages[14]["intro"][0][3]="Тюрьма — рана луны. Ты не сбежал, а вынес мой замок в мир.";
stages[14]["intro"][1][3]="Ордера, деревенский колокол, лунный камень — всё это ты?";
stages[14]["intro"][2][3]="Я лишь сказал миру, что ты украдёшь. Мир сам положил эти вещи на твоём пути.";
stages[14]["intro"][3][3]="Мы стояли на коленях три полнолуния ради этого часа. Отдай сосуд.";
stages[14]["intro"][4][3]="Каждая моя дорога начиналась у чужой двери. На этот раз стучу я.";
stages[14]["outroRu"]="Ключ, поэма и тень пера складываются в координаты. Ты разбиваешь колодец, но не успеваешь остановить последний поток силы, устремившийся домой.";
stages[14]["clueRu"]="Со следующего боя атака, полученная от резонанса, будет изъята.";
stages[15]["titleRu"]="Пустые руки";
stages[15]["actRu"]="Финал · Возвращение прилива";
stages[15]["placeRu"]="Берег падающей луны";
stages[15]["loreRu"]="За ночь мана клинка прилива вернулась в небо. На берегу падающей луны тебя держат на ногах лишь те, кто не разжал рук.";
stages[15]["intro"][0][3]="Мана в моём клинке больше не отвечает.";
stages[15]["intro"][1][3]="Потому что она никогда не была твоей. Посмотри, кто остался на берегу.";
stages[15]["intro"][2][3]="У меня больше нет силы, чтобы отплатить вам.";
stages[15]["intro"][3][3]="Сначала выживи. С долгами разберёмся потом.";
stages[15]["intro"][4][3]="Наконец твои руки пусты. Только пустые руки понимают, за что держаться.";
stages[15]["outroRu"]="Серебряный свет покидает тело, и впервые плечам становится легче. Вдали к тебе идут те, кого ты бросил.";
stages[15]["clueRu"]="Спутники, с которыми ты разорвал связь, вернутся призраками угасающей луны в последних боях.";
stages[16]["titleRu"]="Имена, которые остались";
stages[16]["actRu"]="Финал · Возвращение прилива";
stages[16]["placeRu"]="Длинный мост осколков";
stages[16]["loreRu"]="На обоих концах моста угасающее эхо требует старый долг: выдайте тебя, и все имена исчезнут из долговой книги. Сёстры Вуали строятся на мосту, наконец исполняя настоящий список.";
stages[16]["scenes"][1]["interlude"][0][3]="Клинки не удержат мост. Последнюю строку списка я прочту сама.";
stages[16]["scenes"][1]["interlude"][1][3]="Мы оба знаем, чьё имя стоит в этой строке.";
stages[16]["intro"][0][3]="Я могу вернуть всё, что они заплатили за тебя. Пусть только выдадут тебя.";
stages[16]["intro"][1][3]="Каждое имя в этом списке — долговая расписка. Разорвать их можно лишь одним способом.";
stages[16]["intro"][2][3]="Я помню каждое имя. Теперь моя очередь встать впереди.";
stages[16]["intro"][3][3]="Мост рухнет. Ты потеряешь даже направление к дому.";
stages[16]["intro"][4][3]="Море не спрашивает, откуда я пришёл. Они помнят мой путь за меня.";
stages[16]["outroRu"]="В конце моста нет трона — лишь кольцо размером с твою прежнюю камеру. Последний ключ — тот, кто решит остаться.";
stages[16]["clueRu"]="Карты клятвы близких спутников сохраняют полную силу в последнем бою.";
stages[17]["titleRu"]="Прилив свободных";
stages[17]["actRu"]="Финал · Возвращение прилива";
stages[17]["placeRu"]="Сердце тёмной луны";
stages[17]["loreRu"]="Тень, заточённая Зетом под морем, хочет оставить единственный ответ: «неси всё один». Но всё одолженное тобой — сердце горы, паутина, чешуя и каждое имя в списке — ждёт другого конца.";
stages[17]["intro"][0][3]="Убей меня, и луна всё равно упадёт. Ты можешь вернуться в клетку и стать новым замком.";
stages[17]["intro"][1][3]="Ты всегда говоришь о выборе так, будто его должен нести один.";
stages[17]["intro"][2][3]="Не в этот раз.";
stages[17]["intro"][3][3]="Даже цепи лгут тебе. Замок знает одну верность: одиночество.";
stages[17]["intro"][4][3]="Вместе. Мы вернём этот разлом морю.";
stages[17]["outroRu"]="Прилив затапливает серебряную дверь. Драконье яйцо впервые открывает глаза и запоминает каждую руку, которая не отпустила.";
stages[17]["clueRu"]="Гибель отряда или истечение времени означает поражение. Победите угасающее эхо и всех призраков, чтобы завершить путешествие.";
objectives["clear"]["nameRu"]="Победите всех врагов";
objectives["defend"]["nameRu"]="Сохраните все огни до конца отведённых раундов";
objectives["assault"]["nameRu"]="Разрушьте все вражеские печати";
objectives["stealth"]["nameRu"]="Убейте стражей бесшумным проходом; автоатак нет, тревога < 2";
objectives["sentry"]["nameRu"]="Убейте каждого часового в раунд его появления; тревога < 2, гибель начальника стражи даёт победу";
objectives["rewind"]["nameRu"]="Примените возврат времени, затем победите Ткача";
objectives["final"]["nameRu"]="Победите угасающее эхо и всех призраков";
events[0]["titleRu"]="Огни на развилке";
events[0]["prompt"][0][3]="Продолжу погоню — узнаю, кто переписал список. Останусь — дети живыми перейдут дамбу.";
events[0]["prompt"][1][3]="Решай сам. Но список подождёт, а дети — нет.";
events[0]["options"][0]["labelRu"]="Преследовать слух";
events[0]["options"][0]["detailRu"]="+45 припасов, +1 резонанс; предводитель следующей главы получит +4 здоровья и +1 атаку.";
events[0]["options"][0]["journalRu"]="Ты выбрал погоню. В конце слуха — лунный знак, и следующая дорога первой потребует плату.";
events[0]["options"][1]["labelRu"]="Остаться с ночным дозором";
events[0]["options"][1]["detailRu"]="+1 связь всему отряду, +20 припасов; предводитель следующей главы получит +2 здоровья.";
events[0]["options"][1]["journalRu"]="Ты остался. В конце дамбы не ждали подарки — только негаснущие огни.";
events[1]["titleRu"]="Короткий путь через зеркала";
events[1]["prompt"][0][3]="Зеркальная галерея перенесёт вас во дворец. Разумеется, зеркала возьмут обычную плату за проход.";
events[1]["prompt"][1][3]="Плату?";
events[1]["prompt"][2][3]="Немного твоей крови. Или идите длинной дорогой и изучите положение луны перед входом в город.";
events[1]["options"][0]["labelRu"]="Пройти через галерею";
events[1]["options"][0]["detailRu"]="+35 припасов; Сларк начнёт следующую главу с 4 полученного урона.";
events[1]["options"][0]["journalRu"]="Тепло, забранное зеркалами, возвращается лишь под лунным светом архива.";
events[1]["options"][1]["labelRu"]="Обойти зеркала";
events[1]["options"][1]["detailRu"]="+1 связь всему отряду; вражеские бойцы получат +1 атаку в следующей главе.";
events[1]["options"][1]["journalRu"]="Длинная дорога показала вам лунные посты, а охотникам — ваше местонахождение.";
events[2]["titleRu"]="Огонь в долг";
events[2]["prompt"][0][3]="…";
events[2]["prompt"][1][3]="Феникс предлагает пламя в долг. Только пепел знает, как огонь ведёт счета.";
events[2]["prompt"][2][3]="Я уже столько одолжил. Что изменит ещё одно пламя?";
events[2]["options"][0]["labelRu"]="Одолжить уголёк";
events[2]["options"][0]["detailRu"]="+2 резонанса; предводитель следующей главы получит +2 атаки.";
events[2]["options"][0]["journalRu"]="Уголёк ведёт счёт на твоей ладони. Он не торопит — лишь становится тяжелее.";
events[2]["options"][1]["labelRu"]="Только взглянуть";
events[2]["options"][1]["detailRu"]="Рост здоровья +2; получите дозор каменной печати, если в колоде есть место.";
events[2]["options"][1]["journalRu"]="Ты не взял огонь в долг. Святилище подарило каменную печать: оно помнит всех, кто отказался от займа.";
events[3]["titleRu"]="Последняя фляга масла";
events[3]["prompt"][0][3]="Масла хватит только на одно. На лампу или на клинок?";
events[3]["prompt"][1][3]="Им. Сила, одолженная тёмной луной, почти иссякла.";
events[3]["options"][0]["labelRu"]="Поделиться со спутниками";
events[3]["options"][0]["detailRu"]="+1 связь всему отряду; предводитель следующей главы получит +2 атаки.";
events[3]["options"][0]["journalRu"]="Огонь осветил спутников и список, ждущий тебя на мосту.";
events[3]["options"][1]["labelRu"]="Оставить уголёк себе";
events[3]["options"][1]["detailRu"]="Рост атаки +1, резонанс +1; все три клейма +1.";
events[3]["options"][1]["journalRu"]="Ты оставил последнее тепло себе. Луна знает такую жадность.";
root.ArtifactCampaignData={heroes,units,people,cards,stages,objectives,events,scene,sceneCount};
if(typeof module!=='undefined')module.exports=root.ArtifactCampaignData;
})(typeof window==='undefined'?globalThis:window);
