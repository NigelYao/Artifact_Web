/* Artifact Classic innate abilities: rules from bundled latest Valve card texts. */
(function(root){'use strict';
const all={
  "farvhan_the_dreamer": [
    {
      "key": "farvhan_the_dreamer",
      "k": "farvhan_the_dreamer",
      "id": 4001,
      "name": "兽群领袖",
      "en": "Pack Leadership",
      "type": "passive",
      "description": "梦者法夫涵的友方近邻+1护甲。",
      "descriptionEn": "Farvhan the Dreamer's allied neighbors have +1 Armor.",
      "cooldown": 0,
      "icon": "assets/hero-skills/farvhan_the_dreamer.webp"
    }
  ],
  "keefe_the_bold": [
    {
      "key": "keefe_the_bold",
      "k": "keefe_the_bold",
      "name": "无本体技能",
      "en": "No innate ability",
      "type": "none",
      "description": "该英雄在 Artifact Classic 中没有本体技能；其专属卡牌从手牌使用。",
      "descriptionEn": "This hero has no innate ability in Artifact Classic; its signature cards are played from hand.",
      "cooldown": 0,
      "icon": null
    }
  ],
  "debbi_the_cunning": [
    {
      "key": "debbi_the_cunning",
      "k": "debbi_the_cunning",
      "id": 4006,
      "name": "缜密策士",
      "en": "Work the Knife",
      "type": "passive",
      "description": "诈者德比攻击英雄或塔时，造成+2伤害。",
      "descriptionEn": "Debbi the Cunning deals +2 damage when attacking a hero or tower.",
      "cooldown": 0,
      "icon": "assets/hero-skills/debbi_the_cunning.webp"
    }
  ],
  "jmuy_the_wise": [
    {
      "key": "jmuy_the_wise",
      "k": "jmuy_the_wise",
      "id": 4009,
      "name": "长者的智慧",
      "en": "Wisdom of the Elders",
      "type": "active",
      "description": "抽一张牌。",
      "descriptionEn": "Draw a card.",
      "cooldown": 4,
      "icon": "assets/hero-skills/jmuy_the_wise.webp"
    }
  ],
  "venomancer": [
    {
      "key": "venomancer",
      "k": "venomancer",
      "id": 10491,
      "name": "剧毒本性",
      "en": "Venomous Nature",
      "type": "passive",
      "description": "每次部署阶段，召唤一名瘟疫守卫至剧毒术士的兵线。",
      "descriptionEn": "Summon a Plague Ward into Venomancer's lane each deployment phase.",
      "cooldown": 0,
      "icon": "assets/hero-skills/venomancer.webp"
    }
  ],
  "meepo": [
    {
      "key": "meepo",
      "k": "meepo",
      "id": 10429,
      "name": "忽悠",
      "en": "Poof",
      "type": "active",
      "description": "将米波移至友方米波的兵线，对新的敌方近邻造成2伤害。",
      "descriptionEn": "Move Meepo to an allied Meepo's lane. Deal 2 damage to the new enemy neighbors.",
      "cooldown": 2,
      "icon": "assets/hero-skills/meepo.webp"
    },
    {
      "key": "meepo",
      "k": "meepo",
      "id": 10490,
      "name": "合则倒",
      "en": "United We Fall",
      "type": "passive",
      "description": "米波具有灵魂束缚。（如果米波死亡，每条兵线上的所有其他友方米波也会死亡。）",
      "descriptionEn": "Meepo has Soulbound. (If Meepo dies, other allied Meepos in every lane also die.)",
      "cooldown": 0,
      "icon": "assets/hero-skills/meepo.webp"
    }
  ],
  "luna": [
    {
      "key": "luna",
      "k": "luna",
      "id": 10489,
      "name": "月光",
      "en": "Lucent Beam",
      "type": "passive",
      "description": "行动阶段前，对一个随机敌人造成1透甲伤害，并使你手牌和牌组中的三张随机月蚀卡牌增加1能量。",
      "descriptionEn": "Before the action phase, deal 1 piercing damage to a random enemy and add a charge to three random Eclipse cards in your hand or deck.",
      "cooldown": 0,
      "icon": "assets/hero-skills/luna.webp"
    }
  ],
  "winter_wyvern": [
    {
      "key": "winter_wyvern",
      "k": "winter_wyvern",
      "id": 10430,
      "name": "严寒烧灼",
      "en": "Arctic Burn",
      "type": "active",
      "description": "将寒冬飞龙移至一个空白战斗位置，并使其在本回合+4攻击。",
      "descriptionEn": "Move Winter Wyvern to an empty combat position and give it +4 Attack this round.",
      "cooldown": 2,
      "icon": "assets/hero-skills/winter_wyvern.webp"
    }
  ],
  "lycan": [
    {
      "key": "lycan",
      "k": "lycan",
      "id": 10494,
      "name": "野性驱使",
      "en": "Feral Impulse",
      "type": "passive",
      "description": "狼人的友方近邻+2攻击。",
      "descriptionEn": "Lycan's allied neighbors have +2 Attack.",
      "cooldown": 0,
      "icon": "assets/hero-skills/lycan.webp"
    }
  ],
  "abaddon": [
    {
      "key": "abaddon",
      "k": "abaddon",
      "id": 10431,
      "name": "回光返照",
      "en": "Borrowed Time",
      "type": "active",
      "description": "完整治疗亚巴顿，并使其在本回合获得伤害免疫。",
      "descriptionEn": "Fully heal Abaddon and give it Damage Immunity this round.",
      "cooldown": 2,
      "icon": "assets/hero-skills/abaddon.webp"
    }
  ],
  "chen": [
    {
      "key": "chen",
      "k": "chen",
      "id": 10432,
      "name": "神圣劝化",
      "en": "Holy Persuasion",
      "type": "active",
      "description": "控制一名敌方小兵。",
      "descriptionEn": "Get control of an enemy creep.",
      "cooldown": 4,
      "icon": "assets/hero-skills/chen.webp"
    }
  ],
  "bloodseeker": [
    {
      "key": "bloodseeker",
      "k": "bloodseeker",
      "id": 10496,
      "name": "屠戮",
      "en": "Blood Bath",
      "type": "passive",
      "description": "当阻挡其前的单位死亡后，完整治疗血魔。",
      "descriptionEn": "Fully heal Bloodseeker after a unit blocking it dies.",
      "cooldown": 0,
      "icon": "assets/hero-skills/bloodseeker.webp"
    }
  ],
  "axe": [
    {
      "key": "axe",
      "k": "axe",
      "name": "无本体技能",
      "en": "No innate ability",
      "type": "none",
      "description": "该英雄在 Artifact Classic 中没有本体技能；其专属卡牌从手牌使用。",
      "descriptionEn": "This hero has no innate ability in Artifact Classic; its signature cards are played from hand.",
      "cooldown": 0,
      "icon": null
    }
  ],
  "centaur_warrunner": [
    {
      "key": "centaur_warrunner",
      "k": "centaur_warrunner",
      "id": 10497,
      "name": "反击",
      "en": "Return",
      "type": "passive",
      "description": "半人马战行者+2反伤。",
      "descriptionEn": "Centaur Warrunner has +2 Retaliate.",
      "cooldown": 0,
      "icon": "assets/hero-skills/centaur_warrunner.webp"
    }
  ],
  "timbersaw": [
    {
      "key": "timbersaw",
      "k": "timbersaw",
      "id": 10498,
      "name": "活性护甲",
      "en": "Reactive Armor",
      "type": "passive",
      "description": "每有一个攻击者，伐木机便+1护甲。伐木机的攻击者-1护甲。",
      "descriptionEn": "Timbersaw has +1 Armor for each of its attackers. Timbersaw's attackers have -1 Armor.",
      "cooldown": 0,
      "icon": "assets/hero-skills/timbersaw.webp"
    }
  ],
  "bounty_hunter": [
    {
      "key": "bounty_hunter",
      "k": "bounty_hunter",
      "id": 10499,
      "name": "忍术",
      "en": "Jinada",
      "type": "passive",
      "description": "行动阶段前，赏金猎人在本回合有50%几率+4攻击。",
      "descriptionEn": "Before the action phase, there is a 50% chance to give Bounty Hunter +4 Attack this round.",
      "cooldown": 0,
      "icon": "assets/hero-skills/bounty_hunter.webp"
    }
  ],
  "tidehunter": [
    {
      "key": "tidehunter",
      "k": "tidehunter",
      "id": 10434,
      "name": "毁灭",
      "en": "Ravage",
      "type": "active",
      "description": "在本回合晕眩潮汐猎人的敌方近邻，其他敌人也有50%几率被晕眩。",
      "descriptionEn": "Stun Tidehunter's enemy neighbors this round and each other enemy has a 50% chance of being stunned this round.",
      "cooldown": 4,
      "icon": "assets/hero-skills/tidehunter.webp"
    }
  ],
  "tinker": [
    {
      "key": "tinker",
      "k": "tinker",
      "id": 10435,
      "name": "激光",
      "en": "Laser",
      "type": "active",
      "description": "对一个单位造成3伤害，并在本回合使其缴械。",
      "descriptionEn": "Deal 3 damage to a unit and disarm it this round.",
      "cooldown": 3,
      "icon": "assets/hero-skills/tinker.webp"
    }
  ],
  "rix": [
    {
      "key": "rix",
      "k": "rix",
      "id": 10500,
      "name": "不懈叛军",
      "en": "Relentless Rebel",
      "type": "passive",
      "description": "瑞克斯具有快速部署。",
      "descriptionEn": "Rix has Rapid Deployment.",
      "cooldown": 0,
      "icon": "assets/hero-skills/rix.webp"
    }
  ],
  "viper": [
    {
      "key": "viper",
      "k": "viper",
      "id": 10501,
      "name": "腐蚀皮肤",
      "en": "Corrosive Skin",
      "type": "passive",
      "description": "当一个单位对冥界亚龙造成战斗伤害时，修改该单位，使其-1攻击。",
      "descriptionEn": "When a unit deals battle damage to Viper, modify that unit with -1 Attack.",
      "cooldown": 0,
      "icon": "assets/hero-skills/viper.webp"
    }
  ],
  "beastmaster": [
    {
      "key": "beastmaster",
      "k": "beastmaster",
      "id": 10437,
      "name": "野性呼唤",
      "en": "Call of the Wild",
      "type": "active",
      "description": "召唤一头忠诚野兽。",
      "descriptionEn": "Summon a Loyal Beast.",
      "cooldown": 3,
      "icon": "assets/hero-skills/beastmaster.webp"
    }
  ],
  "bristleback": [
    {
      "key": "bristleback",
      "k": "bristleback",
      "id": 10502,
      "name": "酒馆醉拳",
      "en": "Barroom Brawler",
      "type": "passive",
      "description": "当阻挡其前的英雄死亡后，修改钢背兽，使其+2护甲。",
      "descriptionEn": "Modify Bristleback with +2 Armor after a hero blocking it dies.",
      "cooldown": 0,
      "icon": "assets/hero-skills/bristleback.webp"
    }
  ],
  "kanna": [
    {
      "key": "kanna",
      "k": "kanna",
      "id": 10503,
      "name": "征服使者",
      "en": "Bringer of Conquest",
      "type": "passive",
      "description": "将随机友方近战小兵部署至卡娜的兵线。",
      "descriptionEn": "The random allied Melee Creeps are deployed into Kanna's lane.",
      "cooldown": 0,
      "icon": "assets/hero-skills/kanna.webp"
    }
  ],
  "drow_ranger": [
    {
      "key": "drow_ranger",
      "k": "drow_ranger",
      "id": 10504,
      "name": "精准灵气",
      "en": "Precision Aura",
      "type": "passive",
      "description": "所有兵线上的其他友方单位+1攻击。",
      "descriptionEn": "Other allies in all lanes have +1 Attack.",
      "cooldown": 0,
      "icon": "assets/hero-skills/drow_ranger.webp"
    }
  ],
  "earthshaker": [
    {
      "key": "earthshaker",
      "k": "earthshaker",
      "id": 10438,
      "name": "沟壑",
      "en": "Fissure",
      "type": "active",
      "description": "在本回合晕眩撼地者的敌方近邻。",
      "descriptionEn": "Stun Earthshaker's enemy neighbors this round.",
      "cooldown": 4,
      "icon": "assets/hero-skills/earthshaker.webp"
    }
  ],
  "enchantress": [
    {
      "key": "enchantress",
      "k": "enchantress",
      "id": 10506,
      "name": "自然之助",
      "en": "Nature's Attendants",
      "type": "passive",
      "description": "魅惑魔女+2恢复。魅惑魔女的友方近邻+2恢复。",
      "descriptionEn": "Enchantress has +2 Regeneration. Enchantress's allied neighbors have +2 Regeneration.",
      "cooldown": 0,
      "icon": "assets/hero-skills/enchantress.webp"
    }
  ],
  "lich": [
    {
      "key": "lich",
      "k": "lich",
      "id": 10440,
      "name": "献祭",
      "en": "Sacrifice",
      "type": "active",
      "description": "惩处另一个友方单位并抽一张牌。如果该友方单位的攻击为6或以上，则多抽一张牌。",
      "descriptionEn": "Condemn another ally and draw a card. If that ally has 6 or more Attack, draw an extra card.",
      "cooldown": 2,
      "icon": "assets/hero-skills/lich.webp"
    }
  ],
  "ogre_magi": [
    {
      "key": "ogre_magi",
      "k": "ogre_magi",
      "id": 10509,
      "name": "多重施法",
      "en": "Multicast",
      "type": "passive",
      "description": "打出一张蓝色法术后，有25%几率将该卡牌的基础副本加入你的手牌。",
      "descriptionEn": "After you play a [color:blue[blue spell]], there is a 25% chance to put a base copy of that card into your hand.",
      "cooldown": 0,
      "icon": "assets/hero-skills/ogre_magi.webp"
    }
  ],
  "omniknight": [
    {
      "key": "omniknight",
      "k": "omniknight",
      "id": 10443,
      "name": "洗礼",
      "en": "Purification",
      "type": "active",
      "description": "对一个单位进行3治疗。",
      "descriptionEn": "Heal a unit 3.",
      "cooldown": 2,
      "icon": "assets/hero-skills/omniknight.webp"
    }
  ],
  "outworld_devourer": [
    {
      "key": "outworld_devourer",
      "k": "outworld_devourer",
      "id": 10511,
      "name": "精华灵气",
      "en": "Essence Aura",
      "type": "passive",
      "description": "打出一张蓝色卡牌后，有50%几率恢复2魔力。",
      "descriptionEn": "After you play a blue card, there is a 50% chance to restore 2 Mana.",
      "cooldown": 0,
      "icon": "assets/hero-skills/outworld_devourer.webp"
    }
  ],
  "phantom_assassin": [
    {
      "key": "phantom_assassin",
      "k": "phantom_assassin",
      "id": 10512,
      "name": "杀戮高手",
      "en": "Efficient Killer",
      "type": "passive",
      "description": "幻影刺客攻击英雄时，造成+4伤害。",
      "descriptionEn": "Phantom Assassin deals +4 damage when attacking a hero.",
      "cooldown": 0,
      "icon": "assets/hero-skills/phantom_assassin.webp"
    }
  ],
  "pugna": [
    {
      "key": "pugna",
      "k": "pugna",
      "id": 10444,
      "name": "幽冥爆轰",
      "en": "Nether Blast",
      "type": "active",
      "description": "惩处一个随机敌方强化。",
      "descriptionEn": "Condemn a random enemy improvement.",
      "cooldown": 3,
      "icon": "assets/hero-skills/pugna.webp"
    }
  ],
  "sniper": [
    {
      "key": "sniper",
      "k": "sniper",
      "id": 10446,
      "name": "爆头",
      "en": "Headshot",
      "type": "active",
      "description": "对一个单位造成5伤害。",
      "descriptionEn": "Deal 5 damage to a unit.",
      "cooldown": 3,
      "icon": "assets/hero-skills/sniper.webp"
    }
  ],
  "mazzie": [
    {
      "key": "mazzie",
      "k": "mazzie",
      "name": "无本体技能",
      "en": "No innate ability",
      "type": "none",
      "description": "该英雄在 Artifact Classic 中没有本体技能；其专属卡牌从手牌使用。",
      "descriptionEn": "This hero has no innate ability in Artifact Classic; its signature cards are played from hand.",
      "cooldown": 0,
      "icon": null
    }
  ],
  "prellex": [
    {
      "key": "prellex",
      "k": "prellex",
      "id": 10523,
      "name": "信仰使者",
      "en": "Bringer of the Faithful",
      "type": "passive",
      "description": "每次部署阶段，召唤一名近战小兵至普瑞蕾斯的兵线。",
      "descriptionEn": "Summon a Melee Creep into Prellex's lane each deployment phase.",
      "cooldown": 0,
      "icon": "assets/hero-skills/prellex.webp"
    }
  ],
  "sven": [
    {
      "key": "sven",
      "k": "sven",
      "id": 10513,
      "name": "巨力挥舞",
      "en": "Great Cleave",
      "type": "passive",
      "description": "斯温+X顺势，X为其攻击的一半。",
      "descriptionEn": "Sven has +X Cleave where X is equal to half its Attack.",
      "cooldown": 0,
      "icon": "assets/hero-skills/sven.webp"
    }
  ],
  "treant_protector": [
    {
      "key": "treant_protector",
      "k": "treant_protector",
      "id": 10514,
      "name": "钢铁树枝",
      "en": "Branches of Iron",
      "type": "passive",
      "description": "树精卫士的友方近邻+2护甲。",
      "descriptionEn": "Treant Protector's allied neighbors have +2 Armor.",
      "cooldown": 0,
      "icon": "assets/hero-skills/treant_protector.webp"
    }
  ],
  "sorla_khan": [
    {
      "key": "sorla_khan",
      "k": "sorla_khan",
      "id": 10516,
      "name": "好战者",
      "en": "Warmonger",
      "type": "passive",
      "description": "索尔拉可汗攻击塔时，造成+4伤害。",
      "descriptionEn": "Sorla Khan deals +4 damage when attacking a tower.",
      "cooldown": 0,
      "icon": "assets/hero-skills/sorla_khan.webp"
    }
  ],
  "necrophos": [
    {
      "key": "necrophos",
      "k": "necrophos",
      "id": 10517,
      "name": "施虐之心",
      "en": "Sadist",
      "type": "passive",
      "description": "一个敌方近邻死亡后，修改瘟疫法师，使其+1生命。",
      "descriptionEn": "Modify Necrophos with +1 Health after an enemy neighbor dies.",
      "cooldown": 0,
      "icon": "assets/hero-skills/necrophos.webp"
    }
  ],
  "lion": [
    {
      "key": "lion",
      "k": "lion",
      "id": 10449,
      "name": "死亡之指",
      "en": "Finger of Death",
      "type": "active",
      "description": "对一个单位造成8透甲伤害。加速（减少1冷却，但不会低于1）。",
      "descriptionEn": "Deal 8 piercing damage to a unit. Quicken (reduce cooldown by 1, but not below 1).",
      "cooldown": 4,
      "icon": "assets/hero-skills/lion.webp"
    }
  ],
  "skywrath_mage": [
    {
      "key": "skywrath_mage",
      "k": "skywrath_mage",
      "id": 10451,
      "name": "震荡光弹",
      "en": "Concussive Shot",
      "type": "active",
      "description": "在本回合使一名英雄及其友方近邻-2护甲。",
      "descriptionEn": "Give a hero and its allied neighbors -2 Armor this round.",
      "cooldown": 2,
      "icon": "assets/hero-skills/skywrath_mage.webp"
    }
  ],
  "crystal_maiden": [
    {
      "key": "crystal_maiden",
      "k": "crystal_maiden",
      "id": 10518,
      "name": "奥术灵气",
      "en": "Arcane Aura",
      "type": "passive",
      "description": "在各兵线上首次打出友方法术后，该兵线上的塔恢复2魔力。",
      "descriptionEn": "After the first time an allied spell is played in each lane, restore 2 Mana to the tower in that lane.",
      "cooldown": 0,
      "icon": "assets/hero-skills/crystal_maiden.webp"
    }
  ],
  "zeus": [
    {
      "key": "zeus",
      "k": "zeus",
      "id": 10519,
      "name": "静电场",
      "en": "Static Field",
      "type": "passive",
      "description": "打出一张蓝色法术后，对宙斯的敌方近邻造成1透甲伤害。",
      "descriptionEn": "Deal 1 piercing damage to Zeus's enemy neighbors after you play a [color:blue[blue spell]].",
      "cooldown": 0,
      "icon": "assets/hero-skills/zeus.webp"
    }
  ],
  "magnus": [
    {
      "key": "magnus",
      "k": "magnus",
      "name": "无本体技能",
      "en": "No innate ability",
      "type": "none",
      "description": "该英雄在 Artifact Classic 中没有本体技能；其专属卡牌从手牌使用。",
      "descriptionEn": "This hero has no innate ability in Artifact Classic; its signature cards are played from hand.",
      "cooldown": 0,
      "icon": null
    }
  ],
  "dark_seer": [
    {
      "key": "dark_seer",
      "k": "dark_seer",
      "id": 10452,
      "name": "奔腾",
      "en": "Surge",
      "type": "active",
      "description": "将另一个友方单位移至另一条兵线。",
      "descriptionEn": "Move another ally to another lane.",
      "cooldown": 2,
      "icon": "assets/hero-skills/dark_seer.webp"
    }
  ],
  "legion_commander": [
    {
      "key": "legion_commander",
      "k": "legion_commander",
      "id": 10520,
      "name": "勇气之霎",
      "en": "Moment of Courage",
      "type": "passive",
      "description": "军团指挥官+2反伤。",
      "descriptionEn": "Legion Commander has +2 Retaliate.",
      "cooldown": 0,
      "icon": "assets/hero-skills/legion_commander.webp"
    }
  ],
  "ursa": [
    {
      "key": "ursa",
      "k": "ursa",
      "id": 10521,
      "name": "怒意狂击",
      "en": "Fury Swipes",
      "type": "passive",
      "description": "当熊战士对一个单位造成战斗伤害时，修改该单位，使其-1护甲。",
      "descriptionEn": "When Ursa deals battle damage to a unit, modify that unit with -1 Armor.",
      "cooldown": 0,
      "icon": "assets/hero-skills/ursa.webp"
    }
  ],
  "storm_spirit": [
    {
      "key": "storm_spirit",
      "k": "storm_spirit",
      "id": 10537,
      "name": "超负荷",
      "en": "Overload",
      "type": "passive",
      "description": "在任意兵线上打出一张黑色卡牌后，使风暴之灵+2攻击，直至其下个战斗阶段结束为止。",
      "descriptionEn": "Give Storm Spirit +2 Attack until end of its next combat phase after you play a black card in any lane.",
      "cooldown": 0,
      "icon": "assets/hero-skills/storm_spirit.webp"
    }
  ]
};
const api={all,get:key=>all[key]?.[0]||null,list:key=>all[key]||[]};
all.pangolier=[{key:'pangolier',k:'pangolier',name:'甲盾冲击',en:'Shield Crash',type:'active',description:'跃起对正对及相邻敌人造成2点伤害。每个实际受伤的英雄提供2点护盾，小兵提供1点护盾，本回合有效。',descriptionEn:'Deal 2 damage to the enemy blocking Pangolier and its neighbors. Each hero actually damaged grants 2 Shield and each creep grants 1 Shield this round.',cooldown:1,icon:'assets/dota2/pangolier_shield_crash.png'}];
all.dark_willow=[{key:'dark_willow',k:'dark_willow',name:'暗影之境',en:'Shadow Realm',type:'active',description:'无法被攻击；下次攻击额外造成1点伤害，期间每使用一张与自身英雄颜色相同的卡牌再+1，额外伤害最多3点。攻击后结束。',descriptionEn:'Cannot be attacked. Her next attack deals +1 bonus damage, plus +1 more for each card played matching her color while this is active (max +3). Ends after she attacks.',cooldown:2,icon:'assets/dota2/dark_willow_shadow_realm.png'}];
all.monkey_king=[{key:'monkey_king',k:'monkey_king',name:'棒击蓄势',en:'Primed Strike',type:'active',description:'齐天大圣每次攻击获得1点能量，能量随回合保留。能量达到3点后可主动施放：消耗3点能量对一个单位造成4点伤害，此后召唤的猴子猴孙永久+1攻击，可叠加。',descriptionEn:'Monkey King gains 1 energy per attack, persisting across rounds. At 3+ energy he may cast: spend 3 energy to deal 4 damage to a unit; Monkey Soldiers summoned afterwards gain +1 attack permanently, stacking.',cooldown:0,counter:'charges',icon:'assets/dota2/monkey_king_boundless_strike.png'}];
root.ArtifactHeroSkills=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
