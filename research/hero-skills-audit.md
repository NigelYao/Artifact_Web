# 英雄本体技能核对（Artifact Classic）

规则依据：项目 latest_00/01_english/schinese.txt（Valve 当前 Classic 卡牌文本），以及 open-set-0/1-set.json 的 ability references。2026-09-09 在线重新取得 SteamDatabase/GameTracking-Artifact 的 Valve 游戏资源镜像；Luna、Timbersaw、Viper、Lion 原文保存在 hero-skills-web-check.json。Fandom 页面对自动请求返回403，未把未读取页面当作证据。

## 版本与交互

截图的 Luna 是被动而非主动：在行动阶段之前触发，不显示虚构的回合冷却。截图 each Eclipse 是旧文本；当前 Classic 文本明确 three random Eclipse，本项目遵循当前三张随机，保留一致性。主动技能保留原有初始冷却、每回合递减、使用后冷却和回合交换。米波同时有忽悠主动与合则倒被动。斧王、基弗、梅兹、马格纳斯原版无本体技能，不凭空赋予 Dota2 技能。

## 引擎改动

- 现有16种英雄主动均有执行处理与全部主动技能代表测试，复用 activate，不增加独立计算系统。
- 新增只读 canActivate 用于按钮可用性、冷却与目标条件解释。
- 离散被动触发新增 passive 事件，携带 unit/card/owner/skill/可选target；不改变 card/ability 事件，不在 stats 渲染查询中发送事件。
- 修复 Viper 被动被攻击者的沉默错误阻断。
- 合并 Timbersaw 减甲到基础 stats，与攻击者缴械/眩晕状态一致，避免扩展包装重复计算。
- 死亡前快照真实阻挡者，修复斜向攻击的 Bloodseeker/Bristleback 触发遗漏及瞄准别处时的误触发。

## 全英雄覆盖

下表无本体技能为明确原版设计；主动执行已有完整代表测试，被动按生命、战斗、光环、部署、出牌事件审计，不表示每一随机组合均已穷举。

| 英雄 | 技能 | 类型 | 冷却 |
|---|---|---|---|
| 梦者法夫涵 | 兽群领袖 | passive | — |
| 勇者基弗 | 无本体技能 | none | — |
| 诈者德比 | 缜密策士 | passive | — |
| 智者吉姆伊 | 长者的智慧 | active | 4 |
| 剧毒术士 | 剧毒本性 | passive | — |
| 米波 | 忽悠 | active | 2 |
| 米波 | 合则倒 | passive | — |
| 露娜 | 月光 | passive | — |
| 寒冬飞龙 | 严寒烧灼 | active | 2 |
| 狼人 | 野性驱使 | passive | — |
| 亚巴顿 | 回光返照 | active | 2 |
| 陈 | 神圣劝化 | active | 4 |
| 血魔 | 屠戮 | passive | — |
| 斧王 | 无本体技能 | none | — |
| 半人马战行者 | 反击 | passive | — |
| 伐木机 | 活性护甲 | passive | — |
| 赏金猎人 | 忍术 | passive | — |
| 潮汐猎人 | 毁灭 | active | 4 |
| 修补匠 | 激光 | active | 3 |
| 瑞克斯 | 不懈叛军 | passive | — |
| 冥界亚龙 | 腐蚀皮肤 | passive | — |
| 兽王 | 野性呼唤 | active | 3 |
| 钢背兽 | 酒馆醉拳 | passive | — |
| 卡娜 | 征服使者 | passive | — |
| 卓尔游侠 | 精准灵气 | passive | — |
| 撼地者 | 沟壑 | active | 4 |
| 魅惑魔女 | 自然之助 | passive | — |
| 巫妖 | 献祭 | active | 2 |
| 食人魔魔法师 | 多重施法 | passive | — |
| 全知骑士 | 洗礼 | active | 2 |
| 殁境神蚀者 | 精华灵气 | passive | — |
| 幻影刺客 | 杀戮高手 | passive | — |
| 帕格纳 | 幽冥爆轰 | active | 3 |
| 狙击手 | 爆头 | active | 3 |
| 梅兹 | 无本体技能 | none | — |
| 普瑞蕾斯 | 信仰使者 | passive | — |
| 斯温 | 巨力挥舞 | passive | — |
| 树精卫士 | 钢铁树枝 | passive | — |
| 索尔拉可汗 | 好战者 | passive | — |
| 瘟疫法师 | 施虐之心 | passive | — |
| 莱恩 | 死亡之指 | active | 4 |
| 天怒法师 | 震荡光弹 | active | 2 |
| 冰晶圣女 | 奥术灵气 | passive | — |
| 宙斯 | 静电场 | passive | — |
| 马格纳斯 | 无本体技能 | none | — |
| 黑暗贤者 | 奔腾 | active | 2 |
| 军团指挥官 | 勇气之霎 | passive | — |
| 熊战士 | 怒意狂击 | passive | — |
| 风暴之灵 | 超负荷 | passive | — |
