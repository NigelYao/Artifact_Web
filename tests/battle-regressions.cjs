const assert=require('node:assert/strict');
const cards=require('../dist/cards.json');
const {Game,clone}=require('../dist/engine.js');
require('../dist/effects.js');require('../dist/decks.js');
let passed=0;
function test(name,fn){fn();console.log('PASS',name);passed++;}
function fresh(){const g=new Game(cards);g.newGame(global.ARTIFACT_DECKS[0],global.ARTIFACT_DECKS[1],1234);g.s.units=[];g.s.events=[];return g;}
const health=g=>({units:g.s.units.map(u=>({uid:u.uid,damage:u.damage,alive:u.alive})),towers:clone(g.s.lanes.map(l=>l.towers))});
test('only shared empty columns close and normalization is idempotent',()=>{
 const g=fresh(),a=g.spawn('axe',0,0,1),b=g.spawn('zeus',1,0,8),c=g.spawn('melee_creep',0,0,5);
 g.compactLane(0);assert.equal(a.pos,0);assert.equal(c.pos,1);assert.equal(b.pos,2);assert.equal(g.target(a),null);
 const before=clone(g.s);g.compactLane(0);assert.deepEqual(g.s,before);
});
test('existing opposing pairs remain aligned while gaps collapse',()=>{
 const g=fresh(),a=g.spawn('axe',0,0,4),b=g.spawn('zeus',1,0,4),c=g.spawn('melee_creep',0,0,9),d=g.spawn('melee_creep',1,0,12);
 g.compactLane(0);assert.equal(a.pos,b.pos);assert.equal(d.pos,2);assert.equal(a.pos,0);assert.equal(c.pos,1);
});
test('a one-sided lane becomes a compact rank and still attacks the tower',()=>{
 const g=fresh();g.spawn('melee_creep',0,0,3);g.spawn('melee_creep',0,0,9);g.compactLane(0);
 assert.deepEqual(g.all(0,0).map(u=>u.pos),[0,1]);assert.equal(g.combatForecast(0).tower[1],4);
});
test('combat records attackers and targets before simultaneous deaths',()=>{
 const g=fresh(),a=g.spawn('zombie',0,0,0),b=g.spawn('zombie',1,0,0);g.combat();
 assert(!a.alive&&!b.alive);assert.deepEqual(g.s.events.find(e=>e.type==='combat').attacks,[{unit:a.uid,target:b.uid,owner:0},{unit:b.uid,target:a.uid,owner:1}]);
});
test('disarmed and stunned units do not produce attack animations',()=>{
 const g=fresh(),a=g.spawn('axe',0,0,0),b=g.spawn('zeus',1,0,0);g.buff(a,{disarm:1},'round');g.buff(b,{stun:1},'round');g.combat();assert.deepEqual(g.s.events.find(e=>e.type==='combat').attacks,[]);
});
test('shopping after third-lane combat cannot replay damage or mutate health',()=>{
 const g=fresh();g.s.lane=2;g.spawn('axe',0,2,0);g.spawn('zeus',1,2,0);g.combat();assert.equal(g.s.phase,'shop');assert(g.s.events.some(e=>e.type==='combat'));
 g.s.players[0].gold=100;const before=health(g);g.buy(0,'consumable');assert.deepEqual(health(g),before);assert.deepEqual(g.s.events.map(e=>e.type),['buy']);
 g.hold(0);assert.deepEqual(health(g),before);assert.deepEqual(g.s.events.map(e=>e.type),['buy']);
 const snapshot=clone(g.s);assert.throws(()=>g.combat(),/行动阶段/);assert.throws(()=>g.pass(0));assert.deepEqual(g.s,snapshot);
});
test('invalid shop slots are rejected without changing state',()=>{
 const g=fresh();g.s.phase='shop';g.openShop();const before=clone(g.s);assert.throws(()=>g.buy(0,'hold'));assert.deepEqual(g.s,before);
});
console.log(`${passed} battle regression suites passed.`);
