// i18n contract checks — plain node, no deps, no DOM/localStorage (lang stays 'zh').
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const dist = p => path.join(__dirname, '..', 'dist', p);

// Load i18n.js in a window-like sandbox (also covers vm/CJS use).
const vm = require('node:vm');
const sandbox = {};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(require('node:fs').readFileSync(dist('i18n.js'), 'utf8'), sandbox);
const I18N = sandbox.ArtifactI18n;
assert(I18N, 'i18n.js must export ArtifactI18n');

// T registers a pair and returns the active locale (zh under Node).
assert.equal(I18N.T('开始游戏', 'Start game'), '开始游戏');
assert.equal(I18N.lang(), 'zh');

// Emulate an English session by re-running T with lang forced.
// (No localStorage under Node — pair registration is the observable part.)
const pairCheck = vm.runInContext(`(function(){
  ArtifactI18n.setLang('en');
  const en = ArtifactI18n.T('开始游戏','Start game');
  ArtifactI18n.setLang('zh');
  const zh = ArtifactI18n.T('开始游戏','Start game');
  return {en, zh};
})()`, sandbox);
assert.equal(pairCheck.en, 'Start game', 'T must return English once registered');
assert.equal(pairCheck.zh, '开始游戏', 'T must round-trip back to Chinese');

// Unregistered fallback returns the zh source, never blank.
vm.runInContext(`ArtifactI18n.setLang('en')`, sandbox);
assert.equal(I18N.T('未注册字符串'), '未注册字符串');
assert.equal(I18N.T('未注册字符串', ''), '未注册字符串');
vm.runInContext(`ArtifactI18n.setLang('zh')`, sandbox);

// pick / cardName / cardText choose *En fields in English, zh otherwise.
const card = { name: '斧王', en: 'Axe', text: '嘲讽', textEn: 'Taunt' };
assert.equal(I18N.cardName(card), '斧王');
assert.equal(I18N.cardText(card), '嘲讽');
vm.runInContext(`ArtifactI18n.setLang('en')`, sandbox);
assert.equal(I18N.cardName(card), 'Axe');
assert.equal(I18N.cardText(card), 'Taunt');
assert.equal(I18N.pick({ name: '甲盾冲击', nameEn: 'Shield Crash' }, 'name'), 'Shield Crash');
// Fallback: no *En field → zh source.
assert.equal(I18N.pick({ name: '无英文' }, 'name'), '无英文');
vm.runInContext(`ArtifactI18n.setLang('zh')`, sandbox);

// localize() renders stored engine text in the active locale.
vm.runInContext(`ArtifactI18n.setLang('en')`, sandbox);
assert.equal(I18N.localize('上路'), 'Top Lane');
assert.equal(I18N.localize('天辉'), 'Radiant');
vm.runInContext(`ArtifactI18n.setLang('zh')`, sandbox);
assert.equal(I18N.localize('上路'), '上路');
assert.equal(I18N.localize('Radiant'), '天辉');

// Every card with rules text must ship English text.
const cards = require(dist('cards.json'));
const list = Array.isArray(cards) ? cards : cards.cards || Object.values(cards);
assert(list.length > 0, 'cards.json must list cards');
const missing = list.filter(c => c.text && !c.textEn).map(c => c.name || c.id);
assert.deepEqual(missing, [], `cards missing textEn: ${missing.slice(0, 5).join(', ')}`);
const missingName = list.filter(c => c.name && !c.en).map(c => c.name || c.id);
assert.deepEqual(missingName, [], `cards missing en name: ${missingName.slice(0, 5).join(', ')}`);

console.log('i18n tests passed:', list.length, 'cards bilingual');
