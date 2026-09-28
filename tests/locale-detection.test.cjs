'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../dist/i18n.js'), 'utf8');
function boot(navigator, saved, blocked = false) {
  const writes = [];
  const scope = { navigator, localStorage: { getItem() { if (blocked) throw Error('blocked'); return saved; }, setItem(k,v) { writes.push([k,v]); } } };
  vm.runInNewContext(source, scope);
  return { i: scope.ArtifactI18n, writes };
}
assert.equal(boot({language:'ru-RU',languages:['ru-RU','en']}).i.lang(), 'ru');
assert.equal(boot({language:'zh-TW'}).i.lang(), 'zh');
assert.equal(boot({languages:['de-DE','ru-KZ']}).i.lang(), 'ru');
assert.equal(boot({language:'fr-FR'}).i.lang(), 'en');
assert.equal(boot({language:'ru'}, 'en').i.lang(), 'en');
assert.equal(boot({language:'en'}, 'ru').i.lang(), 'ru');
assert.equal(boot({language:'ru'}, 'invalid').i.lang(), 'ru');
assert.equal(boot({language:'ru'}, null, true).i.lang(), 'ru');
assert.equal(boot(undefined).i.lang(), 'zh', 'server engine retains stable source language');
const {i, writes} = boot({language:'ru'});
assert.equal(writes.length, 0, 'auto-detection must not persist an explicit preference');
assert.equal(i.T('开始游戏','Start game','Начать игру'), 'Начать игру');
assert.equal(i.pick({name:'斧王',en:'Axe',nameRu:'Акс'},'name'), 'Акс');
assert.equal(i.pick({text:'甲',textEn:'Untranslated text'},'text'), 'Untranslated text');
i.setLang('en');
assert.equal(i.localize('Начать игру'),'Start game');
i.setLang('zh');
assert.equal(i.localize('Начать игру'),'开始游戏');
i.setLang('ru');
assert.equal(i.localize('天辉抽取 2 张牌'), 'Силы Света берут карты: 2');
assert.equal(i.localize('Dire passes'), 'Силы Тьмы пропускают ход');
assert.equal(i.localize('上路'), 'Верхняя линия');
assert.equal(i.localize('Stunned'), 'Оглушение');
assert.equal(writes.at(-1)[1], 'ru');
i.setLang('xx');
assert.equal(i.lang(), 'ru');
console.log('Locale detection and Russian i18n tests passed');
// Existing static source text and accessibility attributes survive all switches.
const makeElement = (textContent, attrs) => ({
  textContent,
  dataset: Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v])),
  attributes: Object.entries(attrs).map(([name,value])=>({name,value})),
  getAttribute(name) { return attrs[name] ?? null; },
  setAttribute(name,value) { attrs[name]=value; }
});
const label = makeElement('开始游戏', {'data-en':'Start game','data-ru':'Начать игру'});
const field = makeElement('', {'aria-label':'名字','data-en-aria-label':'Name','data-ru-aria-label':'Имя'});
const doc = {documentElement:{dataset:{}},readyState:'loading',addEventListener(){},querySelectorAll(selector){return selector==='[data-en]'?[label]:[label,field];}};
const scope = {document:doc,navigator:{language:'ru'}};
vm.runInNewContext(source,scope);
const staticI18n = scope.ArtifactI18n;
staticI18n.applyStatic(doc);
assert.equal(doc.documentElement.lang,'ru');
assert.equal(label.textContent,'Начать игру');
assert.equal(field.getAttribute('aria-label'),'Имя');
staticI18n.setLang('en');
assert.equal(label.textContent,'Start game');
assert.equal(field.getAttribute('aria-label'),'Name');
staticI18n.setLang('zh');
assert.equal(label.textContent,'开始游戏');
assert.equal(field.getAttribute('aria-label'),'名字');
staticI18n.setLang('ru');
assert.equal(label.textContent,'Начать игру');
const server = {process:{versions:{node:'23'}}, navigator:{language:'en-US'}};
vm.runInNewContext(source,server);
assert.equal(server.ArtifactI18n.lang(),'zh');
console.log('Static localization and server language isolation passed');

// Identical source words can mean different things in different UI contexts.
i.setLang('ru');
i.T('对战','Play','Играть');
i.T('对战','VS','ПРОТИВ');
assert.equal(i.T('对战','Play'), 'Играть');
assert.equal(i.T('对战','VS'), 'ПРОТИВ');
