'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dist = path.join(__dirname,'../dist');
const ctx = { navigator: {language:'ru-RU'} };
ctx.window = ctx;
vm.createContext(ctx);
for (const file of ['ru-ui.js','i18n.js','data.js','decks.js','hero-skills.js','campaign-data.js','campaign-deck.js']) {
  vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),ctx,{filename:file});
}
const I = ctx.ArtifactI18n;
const cards = ctx.ARTIFACT_CARDS;
assert.equal(I.lang(),'ru');
assert(cards.length >= 323);
for (const c of cards) {
  assert(c.nameRu, `Russian name missing: ${c.key}`);
  if (c.text) assert(c.textRu, `Russian rules missing: ${c.key}`);
  assert.equal(I.cardName(c),c.nameRu);
  if (c.text) assert.equal(I.cardText(c),c.textRu);
}
for (const list of Object.values(ctx.ArtifactHeroSkills.all)) for (const a of list) {
  assert(a.nameRu, `Russian ability name missing: ${a.key}`);
  assert.equal(I.cardName(a),a.nameRu);
}
for (const d of ctx.ARTIFACT_DECKS) assert(d.nameRu, `Russian deck name missing: ${d.id || d.name}`);
assert.equal(I.T('开始对局','Start match'), 'Начать матч');
assert(!/[\u3400-\u9fff]/.test(I.localize('天辉上路防御塔倒塌，遗迹出现')));
const english = cards[0].en;
I.setLang('en');
assert.equal(I.cardName(cards[0]),english);
I.setLang('zh');
assert.equal(I.cardName(cards[0]),cards[0].name);
I.setLang('ru');
assert.equal(I.cardName(cards[0]),cards[0].nameRu);
const htmlFiles = fs.readdirSync(dist).filter(f=>f.endsWith('.html'));
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(dist,file),'utf8');
  assert(html.indexOf('ru-ui.js') >= 0 && html.indexOf('ru-ui.js') < html.indexOf('i18n.js'), `${file}: translations must load before i18n`);
}
console.log(`Russian catalog coverage passed: ${cards.length} cards, skills, decks and ${htmlFiles.length} entry pages`);

// Persist canonical events so a new browser session can render another language.
vm.runInContext(fs.readFileSync(path.join(dist,'engine.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(dist,'effects.js'),'utf8'),ctx);
I.setLang('en');
const g = new ctx.ArtifactEngine.Game(cards);
g.newGame(ctx.ARTIFACT_DECKS[0],ctx.ARTIFACT_DECKS[1],1234);
I.setLang('ru');
const summon = g.s.log.find(e=>e.type==='summon');
assert(!/[A-Za-z\u3400-\u9fff]/.test(I.localize(summon.text)), 'switching EN game to RU must translate interpolated names');
const russianGame = new ctx.ArtifactEngine.Game(cards);
russianGame.newGame(ctx.ARTIFACT_DECKS[0],ctx.ARTIFACT_DECKS[1],1234);
assert(!russianGame.s.log.some(e=>/[А-Яа-яЁё]/.test(e.text)), 'stored events must not depend on selected locale');
const reloaded = {window:null,navigator:{language:'en'}}; reloaded.window=reloaded; vm.createContext(reloaded);
for (const file of ['ru-ui.js','i18n.js','data.js','hero-skills.js']) vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),reloaded);
const restoredSummon = JSON.parse(JSON.stringify(russianGame.s.log)).find(e=>e.type==='summon');
assert.match(reloaded.ArtifactI18n.localize(restoredSummon.text), / enters .* Lane$/);
assert(!/[\u3400-\u9fffА-Яа-яЁё]/.test(reloaded.ArtifactI18n.localize(restoredSummon.text)));
console.log('Persisted game logs translate after language changes and fresh sessions');
// Campaign saves use the same canonical log contract, including first scene/round.
vm.runInContext(fs.readFileSync(path.join(dist,'campaign-engine.js'),'utf8'),ctx);
const journey = ctx.ArtifactCampaign.fresh();
const campaign = new ctx.ArtifactCampaign.CampaignGame(cards);
campaign.begin(journey);
assert(!campaign.s.log.some(e=>/[А-Яа-яЁё]/.test(e.text)), 'campaign logs must be canonical');
for (const file of ['decks.js','campaign-data.js','campaign-deck.js','engine.js','effects.js','campaign-engine.js']) vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),reloaded);
const lastRound = campaign.s.log.findLast(e=>e.type==='round').text;
assert.match(reloaded.ArtifactI18n.localize(lastRound), /Scene 1 · Round 1$/);
reloaded.ArtifactI18n.setLang('ru');
const roundRu = reloaded.ArtifactI18n.localize(lastRound);
assert.match(roundRu, /Сцена 1 · Раунд 1$/);
assert(!/[\u3400-\u9fff]/.test(roundRu));
assert(!/[\u3400-\u9fff]/.test(reloaded.ArtifactI18n.localize('悬赏契约 +12 旅费，幕末结算')));
assert(!/[\u3400-\u9fff]/.test(reloaded.ArtifactI18n.localize('宫卫活到了轮末——警报响彻整座宫殿')));
const label = I.T('测试标签','Test label','Тестовая метка');
const event = russianGame.emit('ability',I.T('测试事件','Test event','Тестовое событие'),{label,source:{name:label},outcomes:[{name:label,changes:[label]}]});
assert.equal(event.label,'测试标签');
assert.equal(event.source.name,'测试标签');
assert.equal(event.outcomes[0].changes[0],'测试标签');
console.log('Campaign logs and event labels survive locale changes and reloads');
// Real campaign play fills its feedback outcomes after emit().
const target = campaign.all(1,0)[0];
const hand = {uid:campaign.id(),k:'story_pounce',lock:0};
campaign.s.players[0].hand.push(hand);
campaign.s.lanes[0].mana[0] = 9;
campaign.play(0,hand.uid,[target.uid]);
const cast = campaign.s.events.find(e=>e.type==='card');
assert(cast.outcomes.some(v=>v.changes.length));
reloaded.ArtifactI18n.setLang('en');
for(const outcome of cast.outcomes) for(const change of outcome.changes) {
  assert(!/[А-Яа-яЁё]/.test(change));
  assert(!/[\u3400-\u9fffА-Яа-яЁё]/.test(reloaded.ArtifactI18n.localize(change)), change);
}
const numericTargets = russianGame.emit('ability','test',{targets:[48]});
assert.equal(numericTargets.targets[0],48,'canonicalization must preserve numeric target identifiers');
console.log('Actual campaign card feedback and numeric target identifiers verified');
