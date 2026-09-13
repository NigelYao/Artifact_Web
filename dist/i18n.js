/* Bilingual UI layer (zh default, en optional). No build step: load before other scripts.
   Conventions:
   - T('中文', 'English') registers the pair and returns the text for the active locale.
     Call it at render time (inside template/render functions), not at module top level,
     so a language switch is reflected on the next render.
   - Data objects carry parallel English fields: cards use `en` (name) and `textEn`;
     other content uses `<field>En` (e.g. titleEn, descriptionEn, outroEn).
   - Static markup uses data-en="English" to swap textContent, and
     data-en-<attr>="English" to swap an attribute (data-en-aria-label, data-en-title, ...).
   - English falls back to the Chinese source string when a translation is missing,
     so new untranslated copy never renders blank. */
(function (root) {
'use strict';
const KEY = 'artifact.lang';
const pairs = new Map();
const reverse = new Map();
const subs = [];
let lang = 'zh';
try {
  const v = root.localStorage && root.localStorage.getItem(KEY);
  if (v === 'en' || v === 'zh') lang = v;
} catch (e) { /* private mode */ }

function T(zh, en) {
  if (en !== undefined && en !== null && en !== '') { pairs.set(zh, en); reverse.set(en, zh); }
  if (lang !== 'en') return zh;
  return pairs.get(zh) ?? zh;
}

/* pick(obj, 'name') -> obj.nameEn ?? (name only: obj.en) ?? obj.name in English mode. */
function pick(obj, base) {
  if (!obj) return '';
  if (lang !== 'en') return obj[base];
  return obj[base + 'En'] ?? (base === 'name' ? obj.en : undefined) ?? obj[base];
}

const cardName = c => pick(c, 'name');
const cardText = c => pick(c, 'text');

function applyStatic(scope) {
  const rootEl = scope || root.document;
  if (!rootEl || !rootEl.querySelectorAll) return;
  rootEl.querySelectorAll('[data-en]').forEach(el => {
    if (el.dataset.zh === undefined) el.dataset.zh = el.textContent;
    el.textContent = lang === 'en' ? el.dataset.en : el.dataset.zh;
  });
  rootEl.querySelectorAll('*').forEach(el => {
    for (const { name, value } of Array.from(el.attributes || [])) {
      if (!name.startsWith('data-en-')) continue;
      const attr = name.slice(8);
      const zhKey = 'zh' + attr.replace(/(^|-)([a-zA-Z])/g, (m, p, c) => c.toUpperCase());
      if (el.dataset[zhKey] === undefined) el.dataset[zhKey] = el.getAttribute(attr) || '';
      el.setAttribute(attr, lang === 'en' ? value : el.dataset[zhKey]);
    }
  });
}

function onChange(fn) { subs.push(fn); }

/* localize(s) renders stored engine text (event log lines, cast summaries, outcome
   changes, error templates) in the active locale. Engine emitters register both
   directions through T() so exact lookups cover anything emitted this session;
   the pattern rules below cover server-generated Chinese text the client never
   registered (online games) and free compounds of those templates. */
const ZH_LANES = ['上路', '中路', '下路'];
const EN_LANES = ['Top Lane', 'Middle Lane', 'Bottom Lane'];
const ZH_SIDE = { '天辉': 'Radiant', '夜魇': 'Dire' };
const EN_SIDE = { 'Radiant': '天辉', 'Dire': '夜魇' };
const ZH_STATS = { '攻击': 'Attack', '护甲': 'Armor', '生命上限': 'Health', '生命': 'Health', '恢复': 'Regeneration', '溅射': 'Cleave', '反伤': 'Retaliate', '攻城': 'Siege' };
const ZH_FLAGS = { '恐惧翻牌': 'Feared', '暗影之境': 'Shadow Realm', '伤害护盾': 'Damage shield', '眩晕': 'Stunned', '沉默': 'Silenced', '缴械': 'Disarmed', '伤害免疫': 'Damage immune', '缠绕': 'Rooted', '死亡护盾': 'Death shield', '中毒': 'Poisoned', '免疫': 'Immune' };
let namesZhEn = null;
function namePairs() {
  if (namesZhEn) return namesZhEn;
  const m = new Map([['天辉', 'Radiant'], ['夜魇', 'Dire'], ['上路', 'Top Lane'], ['中路', 'Middle Lane'], ['下路', 'Bottom Lane'], ['防御塔', 'tower'], ['遗迹', 'Ancient'], ['近战小兵', 'Melee Creep'], ['杰克斯', 'Jex']]);
  try {
    for (const c of (root.ARTIFACT_CARDS || [])) if (c.name && c.en && c.name !== c.en) m.set(c.name, c.en);
    for (const list of Object.values(root.ArtifactHeroSkills?.all || {})) for (const a of list || []) if (a.name && a.en) m.set(a.name, a.en);
    for (const d of (root.ARTIFACT_DECKS || [])) if (d.name && d.nameEn) m.set(d.name, d.nameEn);
  } catch (e) { /* data not loaded yet */ }
  namesZhEn = [...m.entries()].sort((a, b) => b[0].length - a[0].length);
  return namesZhEn;
}
function swapNames(s, reverseDir) {
  for (const [zh, en] of namePairs()) s = s.split(reverseDir ? en : zh).join(reverseDir ? zh : en);
  return s;
}
/* Ordered zh→en rules for engine templates. Each regex must match only zh text. */
const rules = [
  [/^第 (\d+) 回合 · (.+)开始$/, m => `Round ${m[1]} · ${seg(m[2])} begins`],
  [/^第 (\d+) 回合 · (.+)$/, m => `Round ${m[1]} · ${seg(m[2])}`],
  [/^(天辉|夜魇)打出 (.*)$/, m => `${ZH_SIDE[m[1]]} plays ${seg(m[2])}`],
  [/^(天辉|夜魇)抽取 (\d+) 张牌$/, m => `${ZH_SIDE[m[1]]} draws ${m[2]} cards`],
  [/^(天辉|夜魇)购买了 (.*)$/, m => `${ZH_SIDE[m[1]]} buys ${seg(m[2])}`],
  [/^(天辉|夜魇)让过$/, m => `${ZH_SIDE[m[1]]} passes`],
  [/^(天辉|夜魇)(上路|中路|下路)受到 (\d+) 点伤害$/, m => `${ZH_SIDE[m[1]]} takes ${m[3]} damage in ${seg(m[2])}`],
  [/^(天辉|夜魇)(上路|中路|下路)防御塔倒塌，遗迹出现$/, m => `${ZH_SIDE[m[1]]}'s ${seg(m[2])} tower falls — the Ancient is exposed`],
  [/^(天辉|夜魇)防御建筑受到 (\d+) 点战斗伤害$/, m => `${ZH_SIDE[m[1]]}'s tower takes ${m[2]} combat damage`],
  [/^(天辉|夜魇)(上路|中路|下路)建筑$/, m => `${ZH_SIDE[m[1]]}'s ${seg(m[2])} tower`],
  [/^双方同时摧毁目标 · 平局$/, () => 'Both objectives destroyed at once · Draw'],
  [/^(天辉|夜魇)胜利$/, m => `${ZH_SIDE[m[1]]} victory`],
  [/^(上路|中路|下路)战斗结算$/, m => `${seg(m[1])} combat resolves`],
  [/^(上路|中路|下路)行动阶段$/, m => `${seg(m[1])} action phase`],
  [/^(上路|中路|下路)召唤位$/, m => `${seg(m[1])} summon slot`],
  [/^(\S[^；：，、→]*?)进入(上路|中路|下路)$/, m => `${seg(m[1])} enters ${seg(m[2])}`],
  [/^(\S[^；：，、→]*?)部署至(上路|中路|下路)$/, m => `${seg(m[1])} deploys to ${seg(m[2])}`],
  [/^(\S[^；：，、→]*?)转移至(上路|中路|下路)$/, m => `${seg(m[1])} moves to ${seg(m[2])}`],
  [/^(\S[^；：，、→]*?)回复 (\d+)$/, m => `${seg(m[1])} heals ${m[2]}`],
  [/^(\S[^；：，、→]*?)受到 (\d+) 点伤害$/, m => `${seg(m[1])} takes ${m[2]} damage`],
  [/^(\S[^；：，、→]*?)受到 (\d+) 点战斗伤害$/, m => `${seg(m[1])} takes ${m[2]} combat damage`],
  [/^(\S[^；：，、→]*?)阵亡$/, m => `${seg(m[1])} dies`],
  [/^(\S[^；：，、→]*?)返回泉水$/, m => `${seg(m[1])} returns to the Fountain`],
  [/^(\S[^；：，、→]*?)消散$/, m => `${seg(m[1])} dissipates`],
  [/^(\S[^；：，、→]*?)被摧毁$/, m => `${seg(m[1])} is destroyed`],
  [/^(\S[^；：，、→]*?)改变阵营$/, m => `${seg(m[1])} changes allegiance`],
  [/^(\S[^；：，、→]*?)移动一格$/, m => `${seg(m[1])} shifts one slot`],
  [/^商店开张 · 使用战斗获得的金币购买物品$/, () => 'Shop opens · spend gold earned in combat'],
  [/^支付 1 金币，保留物品牌组商品$/, () => 'Pays 1 gold to hold the item-deck offer'],
  [/^杰克斯等待下一张技能牌$/, () => 'Jex awaits the next allied spell'],
  [/^(\S[^；：，、→]*?) · 地雷滚滚$/, m => `${seg(m[1])} · Rolling Thunder`],
  [/^甲盾冲击 · 护盾 (\d+)$/, m => `Shield Crash · Shield ${m[1]}`],
  [/^(\S[^；：，、→]*?)使用跳刀：(\S[^；：，、→]*?) → (\S[^；：，、→]*?)$/, m => `${seg(m[1])} uses Blink Dagger: ${seg(m[2])} → ${seg(m[3])}`],
  [/^进入战场$/, () => 'Enters the battlefield'],
  [/^返回泉水$/, () => 'Returns to the Fountain'],
  [/^阵亡$/, () => 'Dies'],
  [/^转为(天辉|夜魇)$/, m => `Turns to ${ZH_SIDE[m[1]]}`],
  [/^(攻击|护甲|生命上限|生命|恢复|溅射|反伤|攻城)([+-]\d+)$/, m => `${ZH_STATS[m[1]]} ${m[2]}`],
  [/^解除(\S[^；：，、→]*)$/, m => `Removes ${seg(m[1])}`],
  [/^装备更新$/, () => 'Equipment updated'],
  [/^状态更新$/, () => 'Status updated'],
  [/^回复 \+(\d+)$/, m => `Heal +${m[1]}`],
  [/^伤害 −(\d+)$/, m => `Damage −${m[1]}`],
  [/^战线强化$/, () => 'lane improvement'],
  [/^(天辉|夜魇)·(\S[^；：，、→]*?)$/, m => `${ZH_SIDE[m[1]]} · ${seg(m[2])}`],
  [/^护盾 (\d+)$/, m => `Shield ${m[1]}`],
  [/^(\S[^；：，、→]*?)变成了(.*)$/, m => `${seg(m[1])} becomes ${seg(m[2])}`],
  [/^(\S[^；：，、→]*?)无法行动，持续 (\d+) 回合$/, m => `${seg(m[1])} cannot act for ${m[2]} more rounds`],
  [/^回合 (\d+)$/, m => `Round ${m[1]}`],
  [/^为武器充能$/, () => 'charges its weapon'],
  [/^能量 (\d+)$/, m => `Energy ${m[1]}`],
  [/^(\S[^；：，、→]*?)出击完成，消散$/, m => `${seg(m[1])} finishes its attacks and vanishes`],
  [/^此后召唤的猴子猴孙攻击永久 \+(\d+)（当前 \+(\d+)）$/, m => `Monkey Soldiers summoned later gain +${m[1]} attack permanently (now +${m[2]})`],
  [/^棒击蓄势需要 3 点能量（当前 (\d+) 点）$/, m => `Primed Strike needs 3 energy (currently ${m[1]})`],
  [/^棒击蓄势需要 3 点能量$/, () => 'Primed Strike needs 3 energy'],
];
function seg(s) {
  if (!s || typeof s !== 'string') return s;
  const exact = pairs.get(s);
  if (exact !== undefined) return exact;
  for (const [re, fn] of rules) { const m = s.match(re); if (m) return fn(m); }
  if (ZH_FLAGS[s]) return ZH_FLAGS[s];
  if (ZH_STATS[s]) return ZH_STATS[s];
  if (ZH_SIDE[s]) return ZH_SIDE[s];
  return swapNames(s, false);
}
/* Mirror rules for en→zh, covering the English templates produced above plus the
   engine's English emits, so stored English text renders back in Chinese. */
const backRules = [
  [/^Round (\d+) · (.+) begins$/, m => `第 ${m[1]} 回合 · ${segZh(m[2])}开始`],
  [/^Round (\d+) · (.+)$/, m => `第 ${m[1]} 回合 · ${segZh(m[2])}`],
  [/^(Radiant|Dire) plays (.*)$/, m => `${EN_SIDE[m[1]]}打出 ${segZh(m[2])}`],
  [/^(Radiant|Dire) draws (\d+) cards$/, m => `${EN_SIDE[m[1]]}抽取 ${m[2]} 张牌`],
  [/^(Radiant|Dire) buys (.*)$/, m => `${EN_SIDE[m[1]]}购买了 ${segZh(m[2])}`],
  [/^(Radiant|Dire) passes$/, m => `${EN_SIDE[m[1]]}让过`],
  [/^(Radiant|Dire) takes (\d+) damage in (Top|Middle|Bottom) Lane$/, m => `${EN_SIDE[m[1]]}${EN_LANES[['Top','Middle','Bottom'].indexOf(m[3])]}受到 ${m[2]} 点伤害`],
  [/^(Radiant|Dire)'s (Top|Middle|Bottom) Lane tower falls — the Ancient is exposed$/, m => `${EN_SIDE[m[1]]}${segZh(m[2] + ' Lane')}防御塔倒塌，遗迹出现`],
  [/^(Radiant|Dire)'s tower takes (\d+) combat damage$/, m => `${EN_SIDE[m[1]]}防御建筑受到 ${m[2]} 点战斗伤害`],
  [/^(Radiant|Dire)'s (Top|Middle|Bottom) Lane tower$/, m => `${EN_SIDE[m[1]]}${segZh(m[2] + ' Lane')}建筑`],
  [/^Both objectives destroyed at once · Draw$/, () => '双方同时摧毁目标 · 平局'],
  [/^(Radiant|Dire) victory$/, m => `${EN_SIDE[m[1]]}胜利`],
  [/^(Top|Middle|Bottom) Lane combat resolves$/, m => `${segZh(m[1] + ' Lane')}战斗结算`],
  [/^(Top|Middle|Bottom) Lane action phase$/, m => `${segZh(m[1] + ' Lane')}行动阶段`],
  [/^(Top|Middle|Bottom) Lane summon slot$/, m => `${segZh(m[1] + ' Lane')}召唤位`],
  [/^(\S[^；：，、→]*?) enters (Top|Middle|Bottom) Lane$/, m => `${segZh(m[1])}进入${segZh(m[2] + ' Lane')}`],
  [/^(\S[^；：，、→]*?) deploys to (Top|Middle|Bottom) Lane$/, m => `${segZh(m[1])}部署至${segZh(m[2] + ' Lane')}`],
  [/^(\S[^；：，、→]*?) moves to (Top|Middle|Bottom) Lane$/, m => `${segZh(m[1])}转移至${segZh(m[2] + ' Lane')}`],
  [/^(\S[^；：，、→]*?) heals (\d+)$/, m => `${segZh(m[1])}回复 ${m[2]}`],
  [/^(\S[^；：，、→]*?) takes (\d+) damage$/, m => `${segZh(m[1])}受到 ${m[2]} 点伤害`],
  [/^(\S[^；：，、→]*?) takes (\d+) combat damage$/, m => `${segZh(m[1])}受到 ${m[2]} 点战斗伤害`],
  [/^(\S[^；：，、→]*?) dies$/, m => `${segZh(m[1])}阵亡`],
  [/^(\S[^；：，、→]*?) returns to the Fountain$/, m => `${segZh(m[1])}返回泉水`],
  [/^(\S[^；：，、→]*?) dissipates$/, m => `${segZh(m[1])}消散`],
  [/^(\S[^；：，、→]*?) is destroyed$/, m => `${segZh(m[1])}被摧毁`],
  [/^(\S[^；：，、→]*?) changes allegiance$/, m => `${segZh(m[1])}改变阵营`],
  [/^(\S[^；：，、→]*?) shifts one slot$/, m => `${segZh(m[1])}移动一格`],
  [/^Shop opens · spend gold earned in combat$/, () => '商店开张 · 使用战斗获得的金币购买物品'],
  [/^Pays 1 gold to hold the item-deck offer$/, () => '支付 1 金币，保留物品牌组商品'],
  [/^Turns to (Radiant|Dire)$/, m => `转为${EN_SIDE[m[1]]}`],
  [/^(Attack|Armor|Health|Regeneration|Cleave|Retaliate|Siege) ([+-]\d+)$/, m => `${{ Attack: '攻击', Armor: '护甲', Health: '生命上限', Regeneration: '恢复', Cleave: '溅射', Retaliate: '反伤', Siege: '攻城' }[m[1]]}${m[2]}`],
  [/^Removes (\S[^；：，、→]*)$/, m => `解除${segZh(m[1])}`],
  [/^Equipment updated$/, () => '装备更新'],
  [/^Status updated$/, () => '状态更新'],
  [/^Heal \+(\d+)$/, m => `回复 +${m[1]}`],
  [/^Damage −(\d+)$/, m => `伤害 −${m[1]}`],
  [/^Energy (\d+)$/, m => `能量 ${m[1]}`],
  [/^(\S[^;：，、→]*?) finishes its attacks and vanishes$/, m => `${segZh(m[1])}出击完成，消散`],
  [/^Monkey Soldiers summoned later gain \+(\d+) attack permanently \(now \+(\d+)\)$/, m => `此后召唤的猴子猴孙攻击永久 +${m[1]}（当前 +${m[2]}）`],
  [/^Primed Strike needs 3 energy \(currently (\d+)\)$/, m => `棒击蓄势需要 3 点能量（当前 ${m[1]} 点）`],
  [/^Primed Strike needs 3 energy$/, () => '棒击蓄势需要 3 点能量'],
];
function segZh(s) {
  if (!s || typeof s !== 'string') return s;
  const back = reverse.get(s);
  if (back !== undefined) return back;
  for (const [re, fn] of backRules) { const m = s.match(re); if (m) return fn(m); }
  const flags = { 'Feared': '恐惧翻牌', 'Shadow Realm': '暗影之境', 'Damage shield': '伤害护盾', 'Stunned': '眩晕', 'Silenced': '沉默', 'Disarmed': '缴械', 'Damage immune': '伤害免疫', 'Rooted': '缠绕', 'Death shield': '死亡护盾', 'Dies': '阵亡', 'Enters the battlefield': '进入战场', 'Returns to the Fountain': '返回泉水', 'Equipment updated': '装备更新', 'Status updated': '状态更新', 'lane improvement': '战线强化', 'Top Lane': '上路', 'Middle Lane': '中路', 'Bottom Lane': '下路' };
  if (flags[s]) return flags[s];
  if (EN_SIDE[s]) return EN_SIDE[s];
  const lane = { 'Top Lane': '上路', 'Middle Lane': '中路', 'Bottom Lane': '下路' };
  if (lane[s]) return lane[s];
  return swapNames(s, true);
}
function localize(text) {
  if (typeof text !== 'string' || !text) return text;
  const SEP = /(；|; |：|: | → | \/ |、|, |，| · )/;
  if (lang === 'en') {
    const exact = pairs.get(text);
    if (exact !== undefined) return exact;
    for (const [re, fn] of rules) { const m = text.match(re); if (m) return fn(m); }
    const ZH_SEP = { '；': '; ', '：': ': ', ' / ': ' / ', '、': ', ', '，': ', ' };
    return text.split(SEP).map(part => SEP.test(part) ? (ZH_SEP[part] ?? part) : seg(part)).join('');
  }
  const back = reverse.get(text);
  if (back !== undefined) return back;
  for (const [re, fn] of backRules) { const m = text.match(re); if (m) return fn(m); }
  return text.split(SEP).map(part => SEP.test(part) ? part : segZh(part)).join('');
}


function setLang(next) {
  if (next !== 'en' && next !== 'zh') return;
  lang = next;
  try { root.localStorage && root.localStorage.setItem(KEY, next); } catch (e) {}
  if (root.document) {
    root.document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN';
    root.document.documentElement.dataset.locale = next;
    applyStatic(root.document);
  }
  subs.forEach(fn => { try { fn(next); } catch (e) { /* keep other subscribers alive */ } });
}

let switcher = null;
function mountSwitcher(host) {
  if (!root.document) return null;
  if (!switcher) {
    const btn = root.document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-toggle';
    btn.setAttribute('aria-label', 'Switch language / 切换语言');
    const paint = () => { btn.textContent = lang === 'en' ? '中 文' : 'EN'; btn.title = lang === 'en' ? '切换到中文' : 'Switch to English'; };
    btn.addEventListener('click', () => { setLang(lang === 'en' ? 'zh' : 'en'); paint(); });
    paint();
    onChange(paint);
    switcher = btn;
  }
  if (host && host.appendChild) {
    switcher.style.cssText = 'cursor:pointer;font:600 12px/1 system-ui,sans-serif;letter-spacing:.08em;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(10,16,18,.55);color:#dfe8e6;';
    host.appendChild(switcher);
  } else {
    switcher.style.cssText = 'cursor:pointer;font:600 12px/1 system-ui,sans-serif;letter-spacing:.08em;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(10,16,18,.55);color:#dfe8e6;position:fixed;top:10px;right:10px;z-index:9999;';
    root.document.body.appendChild(switcher);
  }
  return switcher;
}

root.ArtifactI18n = { T, t: T, pick, cardName, cardText, localize, lang: () => lang, setLang, onChange, mountSwitcher, applyStatic };
if (root.document) {
  root.document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  root.document.documentElement.dataset.locale = lang;
  const boot = () => { applyStatic(root.document); mountSwitcher(root.document.querySelector('.header-tools')); };
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
  else boot();
}
if (typeof module !== 'undefined') module.exports = root.ArtifactI18n;
})(typeof window === 'undefined' ? globalThis : window);
