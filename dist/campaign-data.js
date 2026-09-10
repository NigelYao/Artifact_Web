/* Campaign content is intentionally separate from the Classic card catalog. */
(function(root){'use strict';
const hero=(key,name,attack,health,armor=0)=>({key,name,type:'Hero',color:'Black',attack,health,armor,abilities:[],art:'assets/campaign/'+key+'.png',text:'暗月残片 · 剧情模式'});
const heroes=[hero('slark','斯拉克 · 小鱼人',5,22,1),hero('tiny','小小',6,18,2),hero('broodmother','育母蜘蛛',5,16,0),hero('slardar','斯拉达',6,19,1),hero('rubick','拉比克',4,16),hero('weaver','编织者',5,15,1),hero('phoenix','凤凰',4,18),hero('arc_warden','泽特 · 残月回声',7,26,1)];
const cards=[
 ['pounce','突袭',2,'enemy','对目标造成 6 点伤害，本轮缴械。','strike','slark'],
 ['essence','能量转移',2,'enemy','造成 5 点穿甲伤害；小鱼人本关攻击 +1。锻造后返还魔力。','strike','slark'],
 ['pact','黑暗契约',2,'enemy','当前线路所有敌人受到 4 点穿甲伤害；小鱼人失去 2 生命并驱散减益。','strike','slark'],
 ['shadow','暗影之舞',2,'ally','回复 7 生命，获得本轮 1 点护甲。','healing','slark'],
 ['guard','并肩而立',1,'ally','获得本轮 3 护甲。羁绊强化后额外回复生命。','blessing','magnus'],
 ['salve','潮汐药剂',1,'ally','回复 6 生命。','healing','enchantress'],
 ['reinforce','暗礁义勇',2,'lane','在当前线路召唤 3 攻击、7 生命的义勇。','summon','slardar'],
 ['blade','暗礁短刃',2,'hero','替换武器：攻击 +2（同槽不叠加）。','equip','slark'],
 ['silence','无声通行',1,'enemy','对守卫造成 8 点穿甲伤害，不增加警戒；其他敌人受到 3 点。','binding','phantom_assassin'],
 ['rewind','时光倒流',2,'ally','回复 10 生命并驱散减益；洞穴中解除时间茧。','movement','weaver'],
 ['scepter','阿哈利姆的承诺',0,'lane','本次旅程限一次：全队回复 12 生命，所有敌人受到 8 点穿甲伤害。','blessing','rubick'],
 ['bond','归航的约定',2,'ally','回复 5 生命，永久攻击 +2；亲密关系额外 +1。','blessing','winter_wyvern']
].map(([key,name,mana,target,text,fx,portrait])=>({key:'story_'+key,name,mana,target,text,fx,portrait,type:'Spell',color:'Black'}));
const stages=[
 {title:'暗礁破笼',act:'第一幕 · 无岸之潮',place:'暗黑之礁 / 地下囚廊',lanes:1,kind:'clear',enemy:'slardar',hp:13,atk:3,rounds:9,recruit:'slardar',intro:[['斯拉达','停下。你怀里那枚蛋，是监狱的封印。'],['斯拉克','你听见的是封印，我听见的是心跳。'],['斯拉达','那就让我看看，你拿什么承担开门的后果。']],outro:'守卫的鳞片上也刻着囚号。斯拉达放下三叉戟：“赢了我，就带我一起查清这座监狱。”',clue:'龙蛋遇见月光，响起与牢门相同的三声低鸣。囚衣里的时光牌写着“五秒”，你不记得是谁给的。'},
 {title:'三罪追缉',act:'第一幕 · 无岸之潮',place:'盐雾渡口',lanes:1,kind:'clear',enemy:'bounty_hunter',hp:18,atk:4,rounds:9,recruit:'bounty_hunter',stigma:0,intro:[['赏金猎人','金钥匙、古龙诗集、凤凰羽毛。三张赏单，落款却是同一个人。'],['斯拉克','我的口袋装不下这么多传奇。'],['赏金猎人','也许雇主付钱，要的不是失物，是让所有人相信你拿过。']],outro:'赏单背面露出银色月纹。猎人愿意跟随你，看看谁敢连佣金也作假。',clue:'三份赏单的墨迹，竟然同时变淡。'},
 {title:'灯火不退',act:'第一幕 · 无岸之潮',place:'芦苇村 / 两处堤口',lanes:2,kind:'defend',enemy:'sorla_khan',hp:18,atk:4,rounds:4,recruit:'enchantress',bonusRecruit:'sorla_khan',intro:[['魅惑魔女','先把伤口包上。这里不问囚号。'],['村民','赤雾军来了！他们说收留逃犯的村子都要烧！'],['斯拉克','把孩子带到灯塔。我来回答他们。']],outro:'四次潮涌之后，灯塔仍亮着。索拉发现伪造的军令，撤军并留下联络令。魅惑魔女收拾药包：“既然有人追你，伤药就得跟着你走。”',clue:'灯塔的老钟，与龙蛋的心跳同频。'},
 {title:'折断的月角',act:'第一幕 · 无岸之潮',place:'碎石林',lanes:1,kind:'clear',enemy:'magnus',hp:28,atk:6,rounds:9,recruit:'magnus',intro:[['马格纳斯','别靠近！那声音在我的角里！'],['魅惑魔女','不是野性，是有人把月石钉进了他的骨头。'],['斯拉克','我认识那种锁。先打断它，再谈赔树的事。']],outro:'拔出的月石上刻着村钟匠的印记。你救了马格纳斯，却也暴露了自己能触碰暗月的秘密。',clue:'月石裂口流出银光，逆着风飘向北方。'},
 {title:'离岸之夜',act:'第一幕 · 无岸之潮',place:'芦苇村外 / 三岔撤离堤道',lanes:3,pursuit:true,kind:'defend',enemy:'phantom_assassin',hp:24,atk:6,rounds:4,recruit:'phantom_assassin',stigma:1,intro:[['村长','孩子们怕你。钟一响，他们就梦见天上的裂缝。'],['斯拉克','所以你把我的名字告诉了刺客？'],['魅影刺客','我的名单上没有村民。有人改过神谕。让开，我们各查各的。']],outro:'你护送最后一辆车离开，却没有人邀请你上车。刺客折断了伪造的名单，暂时与你同行。',clue:'名单上的“逃犯”，原本写的是“容器”。'},
 {title:'山的重量',act:'第二幕 · 借来的锋刃',place:'回声山顶',lanes:1,kind:'clear',enemy:'tiny',hp:32,atk:6,rounds:10,recruit:'tiny',rule:'stone',intro:[['斯拉达','你需要一把能割断月锁的武器，不是一把杀人的刀。'],['小小','石头不免费。打得动我，我就借你山心。']],outro:'小小把山心递来：“借。不是送。等你回家，记得带我看看海。”',clue:'第一份材料不是战利品，而是一个要归还的约定。'},
 {title:'蛛丝上的名字',act:'第二幕 · 借来的锋刃',place:'空巢峡谷',lanes:2,kind:'clear',enemy:'broodmother',hp:28,atk:5,rounds:10,recruit:'broodmother',rule:'web',intro:[['育母蜘蛛','所有拿火把来的人，都说自己只是路过。'],['斯拉克','那我放下刀。你先把绑住我脚的丝松开。'],['育母蜘蛛','赢过我的孩子们，才有资格谈信任。']],outro:'她给了你一束不燃蛛丝。离开时，你看见空卵壳上同样烙着暗礁的编号。',clue:'监狱关押的，从来不只是罪犯。'},
 {title:'深海旧誓',act:'第二幕 · 借来的锋刃',place:'沉没的岗哨',lanes:1,kind:'assault',enemy:'tidehunter',hp:32,atk:6,rounds:10,recruit:'tidehunter',intro:[['潮汐猎人','斯拉达把最后一片鳞给你了？那我来试试，谁值得让守卫违誓。'],['斯拉克','我不想要新的主人。'],['潮汐猎人','很好。把旧岗哨砸了。']],outro:'山心为骨、蛛丝为脉、海鳞为锋。潮汐刃成形，第一次夺来的魔力却悄悄流向了天上。',clue:'解锁锻造：小鱼人每战携带攻击 +2 的潮汐刃；能量转移返还 1 魔力。',forge:true},
 {title:'偷走刀的人',act:'第二幕 · 借来的锋刃',place:'阿哈利姆的折镜厅',lanes:2,kind:'clear',enemy:'rubick',hp:32,atk:6,rounds:10,recruit:'rubick',rule:'mirror',intro:[['拉比克','别急着刺我。你的刀正在替别人收集能量。'],['斯拉克','所以你偷走它，是为了我的健康？'],['拉比克','是为了我的好奇心。两者偶尔一致。']],outro:'拉比克在镜中复制了刀的轨迹。每一道银线，终点都是同一轮月亮。',clue:'偷刀的人没有隐藏证据，反而逼你亲眼看见。'},
 {title:'导师的空座',act:'第二幕 · 借来的锋刃',place:'星盘穹顶',lanes:1,kind:'clear',enemy:'arc_warden',hp:42,atk:7,rounds:10,intro:[['阿哈利姆的留影','来得正好。打碎星盘上的回声，我们才有时间说话。'],['残月回声','归还容器。归还钥匙。归还尚未孵化的火。'],['拉比克','老师连道歉都藏在谜题后面。']],outro:'留影承认参与过暗礁封印。阿哈利姆留下神杖与坐标：“那颗蛋不是最后一条龙，而是记得旧封印的最后一位见证者。”',clue:'获得一次性的神杖。最好留给真正需要它的人。',scepter:true},
 {title:'金钥匙没有锁',act:'第三幕 · 失重的真相',place:'王宫档案库',lanes:1,kind:'stealth',enemy:'bounty_hunter',hp:24,atk:5,rounds:7,stigma:0,intro:[['赏金猎人','钥匙就在档案柜里。你被通缉时，它根本没离开皇宫。'],['斯拉克','那就把整座柜子搬走。'],['魅影刺客','安静。用无声通行处理守卫；两次喧哗会惊动整座宫殿。']],outro:'钥匙不是开锁，而是校准暗月坠落的方向。你留下副本，把证据交给沿海每一个港口。',clue:'潜入规则：队伍不自动攻击；每轮获得无声通行。攻击牌增加警戒，达到 2 即失败。',clearStigma:0},
 {title:'诗中尚有春天',act:'第三幕 · 失重的真相',place:'霜龙书库',lanes:2,kind:'clear',enemy:'winter_wyvern',hp:38,atk:7,rounds:10,recruit:'winter_wyvern',stigma:1,intro:[['寒冬飞龙','你怀里的是我们的记忆。人类把它称作蛋，好卖一个价钱。'],['斯拉克','它在牢里冷得发抖。'],['寒冬飞龙','那就让我确认，你没有把它变成另一件武器。']],outro:'古诗是一份封印誓约。龙蛋浮出一幅画：当年月亮碎裂，泽特把自己的一个影子锁进了海底。',clue:'“归还三物，容器归位。”这不是赃物清单，是祭仪。',clearStigma:1},
 {title:'不熄的借火',act:'第三幕 · 失重的真相',place:'灰烬圣坛',coreHp:40,lanes:2,kind:'defend',enemy:'phoenix',hp:36,atk:7,rounds:4,recruit:'phoenix',stigma:2,intro:[['凤凰','……'],['寒冬飞龙','它要你守住火种，而不是夺走羽毛。'],['斯拉克','终于有一个考官，不打算替我写罪名。']],outro:'羽毛一直在圣坛，它只是被抽走了影子。三份伪证都指向同一个月纹印章。',clue:'火种照出印章主人的脸：泽特的残影，而非泽特本身。',clearStigma:2},
 {title:'五秒以前',act:'第三幕 · 失重的真相',place:'编织者的时间茧',lanes:1,kind:'rewind',enemy:'weaver',hp:38,atk:7,rounds:9,recruit:'weaver',intro:[['编织者','你已经输过了。只是你还没记起来。'],['斯拉克','那你为什么不把我送回牢里？'],['编织者','因为每次重来，你都会去抱那颗蛋。囚衣里的时光牌是我留的。现在用它解开茧，我只再借你一次。']],outro:'你看见未来的自己倒在一圈空椅子中。编织者剪断这条线，却警告你：命运不能永远赊账。',clue:'必须施放时光倒流，才能击破时间茧。'},
 {title:'暗礁仰望天空',act:'第三幕 · 失重的真相',place:'逆潮之井',lanes:3,kind:'assault',enemy:'arc_warden',hp:44,atk:7,rounds:11,intro:[['残月回声','监狱是月亮的伤口。你不是逃出来，是替我把锁带到了人间。'],['斯拉克','赏单、村钟、月石，全是你？'],['残月回声','我只告诉世界你会偷走什么。世界就把那些东西送到了你的路上。']],outro:'钥匙、诗与羽影拼成坐标。你亲手砸碎收集井，仍来不及阻止最后一束力量回流。',clue:'下一战开始，共鸣带来的攻击与额外成长将被抽离。'},
 {title:'空手的人',act:'终幕 · 潮汐回流',place:'坠月海岸',lanes:2,kind:'defend',enemy:'arc_warden',hp:40,atk:6,rounds:4,drain:true,intro:[['斯拉克','刀里的魔力，不回应我了。'],['拉比克','因为它从来没有真正属于你。看看还留在岸上的人。'],['斯拉克','我没有力量能偿还你们。'],['同行者','先活下来。账可以慢慢算。']],outro:'银光离开了你的身体，肩膀却第一次没有那么沉。远处，被你抛下的人也在走来。',clue:'被决裂的队友会在终战作为残月幻影出现。'},
 {title:'被留下的名字',act:'终幕 · 潮汐回流',place:'碎月长桥',lanes:3,pursuit:true,kind:'clear',enemy:'phantom_assassin',hp:42,atk:7,rounds:10,drain:true,echo:true,intro:[['残月回声','他们为你付出的，我都可以还给他们。只要他们把你交出来。'],['斯拉克','我记得每一个名字。现在轮到我站在前面。']],outro:'桥的尽头没有王座，只有一个与暗礁牢房同样大小的圆环。最后的钥匙是自愿留下的人。',clue:'亲密队友的约定牌，会在最后一战保留全部力量。'},
 {title:'自由的潮汐',act:'终幕 · 潮汐回流',place:'暗月之心',lanes:3,kind:'final',enemy:'arc_warden',hp:58,atk:8,rounds:12,drain:true,echo:true,intro:[['残月回声','杀了我，月亮仍会落下。你还可以回到笼子里，成为新的锁。'],['斯拉克','你总把选择说成一人承担的事。'],['同行者','这次不是。'],['斯拉克','一起。把这道裂缝，带回海里。']],outro:'潮水淹没银色的牢门。龙蛋第一次睁开眼睛，记住了所有没有松手的人。',clue:'全队阵亡或回合耗尽即失败。击败残月回声与所有幻影，结束旅程。'}
];
stages.forEach((s,i)=>{s.id=i;s.number=i+1;});
const objectives={clear:'击败所有敌人',defend:'守住所有灯火，撑过 4 轮',assault:'摧毁所有敌方封印',stealth:'用无声通行击败守卫；无自动攻击，警戒 < 2',rewind:'使用时光倒流，再击败编织者',final:'击败残月回声与全部幻影'};
root.ArtifactCampaignData={heroes,cards,stages,objectives};
if(typeof module!=='undefined')module.exports=root.ArtifactCampaignData;
})(typeof window==='undefined'?globalThis:window);
