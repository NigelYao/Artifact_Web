const assert=require('node:assert/strict');const {resolveFx}=require('../dist/elemental-fx.js');const cards=require('../dist/cards.json'),byKey=Object.fromEntries(cards.map(c=>[c.key,c]));
const el=k=>resolveFx(byKey[k]);
// Chinese element keywords on real catalog cards.
assert.equal(el('ignite'),'fire');assert.equal(el('conflagration'),'fire');assert.equal(el('burning_oil'),'fire');
console.log('PASS fire keywords map to fire');
assert.equal(el('lightning_strike'),'lightning');assert.equal(el('thundergods_wrath'),'lightning');assert.equal(el('thunderstorm'),'lightning');assert.equal(el('ball_lightning'),'lightning');
console.log('PASS lightning keywords map to lightning');
assert.equal(el('gust'),'wind');assert.equal(el('rolling_storm'),'lightning');assert.equal(el('storm_spirit'),'lightning');assert.equal(el('sow_venom'),'wind');assert.equal(el('soul_of_spring'),'wind');
console.log('PASS wind/nature keywords map to wind; 雷霆风暴/风暴之灵 stay lightning');
assert.equal(el('chain_frost'),'ice');assert.equal(el('frostbite'),'ice');assert.equal(el('crystal_maiden'),'ice');assert.equal(el('winter_wyvern'),'ice');assert.equal(el('winters_curse'),'ice');
console.log('PASS ice keywords map to ice');
assert.equal(el('eclipse'),'shadow');assert.equal(el('phantom_assassin'),'shadow');assert.equal(el('dark_seer'),'shadow');assert.equal(el('dark_willow'),'shadow');assert.equal(el('bloodseeker'),'shadow');assert.equal(el('the_cover_of_night'),'shadow');
console.log('PASS shadow/moon keywords map to shadow');
// fx tag fallbacks (campaign-style cards carry an explicit fx field).
assert.equal(resolveFx({name:'突袭',fx:'strike'}),'arcane');
assert.equal(resolveFx({name:'潮汐药剂',fx:'healing'}),'wind');
assert.equal(resolveFx({name:'时光倒流',fx:'movement'}),'wind');
assert.equal(resolveFx({name:'无声通行',fx:'binding'}),'ice');
assert.equal(resolveFx({name:'归航的约定',fx:'blessing'}),'shadow');
assert.equal(resolveFx({name:'义勇军',fx:'summon'}),'arcane');
assert.equal(resolveFx({name:'铁剑',fx:'equip'}),'arcane');
console.log('PASS fx tags fall back to sensible elements');
// Color fallbacks and neutral arcane.
assert.equal(resolveFx({name:'普通打击',color:'Red'}),'fire');
assert.equal(resolveFx({name:'普通生长',color:'Green'}),'wind');
assert.equal(resolveFx({name:'普通秘术',color:'Blue'}),'arcane');
assert.equal(resolveFx({name:'普通刺客',color:'Black'}),'shadow');
assert.equal(resolveFx({name:'普通物品',color:'Neutral'}),'arcane');
assert.equal(resolveFx({}),'arcane');assert.equal(resolveFx(null),'arcane');
assert.equal(el('melee_creep'),'arcane');assert.equal(el('travelers_cloak'),'arcane');
console.log('PASS colors fall back by faction and unknown cards resolve to arcane');
console.log('resolveFx coverage:',Object.fromEntries(['fire','lightning','wind','ice','shadow','arcane'].map(e=>[e,cards.filter(c=>resolveFx(c)===e).length])));
