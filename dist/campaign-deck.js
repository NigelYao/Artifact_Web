/* Reward-driven deck building. Card instances are strings; '+' variants upgrade one copy only. */
(function(root){'use strict';const D=root.ArtifactCampaignData;
const extra=[
 ['venom','淬毒之刃',1,'enemy','造成 2 点穿甲伤害并施加毒性；每轮开始受到 2 点伤害。','binding','slark'],
 ['bulwark','海鳞壁垒',2,'ally','获得本轮 5 护甲，抽 1 张牌。','blessing','slardar'],
 ['insight','深海洞察',1,'lane','抽 2 张牌。','blessing','rubick'],
 ['blink','闪烁匕首',1,'move','将一位己方英雄移到选择的战线；本轮护甲 +1。','movement','phantom_assassin'],
 ['cleave','碎浪横扫',2,'enemy','对当前战线所有敌人造成 5 点伤害。','strike','tiny'],
 ['renew','凤凰余温',2,'lane','当前战线友军回复 5 生命，驱散减益。','healing','phoenix'],
 ['ambush','伏击本能',1,'enemy','造成 3 点穿甲伤害；目标已中毒或被缴械时再造成 4 点。','strike','slark'],
 ['resolve','不屈意志',2,'ally','获得一次免死护盾，持续至本轮结束。','blessing','magnus']
].map(([key,name,mana,target,text,fx,portrait])=>({key:'story_'+key,name,mana,target,text,fx,portrait,type:'Spell',color:'Black'}));
D.cards.push(...extra);const rare=new Set(['story_rewind','story_bond','story_renew','story_resolve']);
for(const c of D.cards){c.rarity=rare.has(c.key)?'Rare':['story_bulwark','story_cleave','story_blink','story_venom'].includes(c.key)?'Uncommon':'Common';c.baseKey=c.key;c.upgraded=false;}
const upgrades={pounce:'伤害提高至 9。',essence:'额外伤害 +3。',pact:'群体伤害提高至 6。',shadow:'回复提高至 10，护甲提高至 2。',guard:'护甲提高至 5。',salve:'回复提高至 9。',reinforce:'召唤物额外 +2 攻击、+2 生命。',blade:'改为装备攻击 +4 的阔剑。',silence:'守卫伤害提高至 11；其他伤害提高至 5。',rewind:'魔力降为 1，回复提高至 14。',bond:'治疗与攻击增益各 +1。',venom:'初始伤害提高至 4。',bulwark:'护甲提高至 7。',insight:'抽牌提高至 3。',blink:'魔力降为 0。',cleave:'群体伤害提高至 7。',renew:'回复提高至 8。',ambush:'基础伤害提高至 5，条件额外伤害提高至 6。',resolve:'魔力降为 1。'};
D.cards.push(...D.cards.filter(c=>c.key!=='story_scepter').map(c=>({...c,key:c.key+'_plus',name:c.name+'＋',upgraded:true,mana:c.mana-(['story_blink','story_rewind','story_resolve'].includes(c.key)?1:0),text:c.text+' 升级：'+upgrades[c.key.slice(6)]})));
function migrate(p){p.deckVersion=2;p.campActions||={};if(p.battle&&D.stages[p.stage]&&p.battle.activeLanes!==D.stages[p.stage].lanes){p.battle=null;p.migrationNotice='该关已升级为三路追杀，已保留成长与队伍，请重新进入本关。';}return p;}
function offers(p,stage){const pool=D.cards.filter(c=>!c.upgraded&&c.key!=='story_scepter'&&(stage>=3||c.rarity!=='Rare'));let x=(stage+1)*7919+(p.resonance||0)*31+(p.gold||0);const pick=a=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return a.splice(x%a.length,1)[0];};return Array.from({length:3},(_,i)=>{const c=pick(pool);return c.key+(stage>=10&&i===2?'_plus':'');});}
function claim(p,key){if(!p.cardReward)throw Error('没有待领取的卡牌奖励');if(key!=='skip'&&!p.cardReward.offers.includes(key))throw Error('只能选择本次提供的卡牌');if(key!=='skip'){if(p.deck.length>=30)throw Error('牌组已达 30 张，请跳过奖励或先在营地精简');p.deck.push(key);}p.journal.at(-1).card=key;p.cardReward=null;}
function upgrade(p,key){if(p.battle)throw Error('战斗中不能升级卡牌');if(p.campActions?.upgrade)throw Error('本次营地已经升级过卡牌');if(p.gold<50)throw Error('升级需要 50 旅费');const c=D.cards.find(c=>c.key===key),i=p.deck.indexOf(key);if(!c||c.upgraded||i<0||key==='story_scepter')throw Error('请选择牌组中尚未升级的一张牌');p.deck[i]=key+'_plus';p.gold-=50;p.campActions||={};p.campActions.upgrade=true;}
function remove(p,key){if(p.battle)throw Error('战斗中不能移除卡牌');if(p.deck.length<=8)throw Error('至少保留 8 张牌');if(p.gold<35)throw Error('精简需要 35 旅费');if(p.campActions?.remove)throw Error('本次营地已经精简过卡牌');const i=p.deck.indexOf(key);if(i<0)throw Error('牌组中没有这张牌');p.deck.splice(i,1);p.gold-=35;p.campActions||={};p.campActions.remove=true;}
function describe(c,p){const up=c.upgraded?1:0,key=c.baseKey||c.key;if(key==='story_essence')return `造成 ${5+(p.upgrades?.essence||0)+3*up} 点穿甲伤害；小鱼人本关攻击 +1。${p.forge?'返还 '+((p.upgrades?.essence||0)>=3?2:1)+' 魔力。':''}`;if(key==='story_guard')return `本轮护甲 +${3+2*up}，回复 ${p.upgrades?.guard||0} 生命。`;return c.text;}
root.ArtifactCampaignDeck={describe,migrate,offers,claim,upgrade,remove};if(typeof module!=='undefined')module.exports=root.ArtifactCampaignDeck;
})(typeof window==='undefined'?globalThis:window);
