const {test}=require('node:test'),assert=require('node:assert/strict');
const cards=require('../dist/cards.json'),{Game,clone}=require('../dist/engine.js');
require('../dist/effects.js');require('../dist/decks.js');
function arena(){const g=new Game(cards);g.newGame(ARTIFACT_DECKS[0],ARTIFACT_DECKS[1],123);g.s.units=[];g.s.events=[];g.s.turn=0;g.s.lane=0;g.s.lanes[0].mana[0]=50;return g;}
function hand(g,k){const h={uid:g.id(),k,lock:0};g.s.players[0].hand=[h];return h;}
test('user example: single-sided vacancy remains, double-empty pair disappears together',()=>{
 const g=arena(),own=[0,1,2,3].map(pos=>g.spawn('melee_creep',0,0,pos));
 const enemy=[0,2,3].map(pos=>g.spawn('melee_creep',1,0,pos));
 g.condemn(own[2]);g.sweep();assert.deepEqual(g.all(0,0).map(u=>u.pos),[0,1,3]);assert.deepEqual(enemy.map(u=>u.pos),[0,2,3]);
 g.condemn(enemy[1]);g.sweep();assert.deepEqual(g.all(0,0).map(u=>u.pos),[0,1,2]);assert.deepEqual(g.all(1,0).map(u=>u.pos),[0,2]);
 const before=clone(g.s);g.compactLane(0);assert.deepEqual(g.s,before);
});
test('opposite one-sided columns never merge into a new pair',()=>{
 const g=arena(),a=g.spawn('axe',0,0,2),b=g.spawn('axe',1,0,8);g.compactLane(0);assert.equal(a.pos,0);assert.equal(b.pos,1);
});
test('hand creeps must fill enemy gaps; invalid placement rolls back all state',()=>{
 const g=arena();g.spawn('axe',0,0,0);g.spawn('axe',1,0,0);g.spawn('melee_creep',1,0,1);
 const h=hand(g,'bronze_legionnaire'),before=clone(g.s);assert.deepEqual(g.placementPositions(0,0),[1]);
 for(const pos of [-1,2,30]){assert.throws(()=>g.play(0,h.uid,[{lane:0,pos}]),/优先/);assert.deepEqual(g.s,before);}
 assert.deepEqual(g.candidateTargets(h.k,0),[[{lane:0,pos:1}]]);
 g.play(0,h.uid,[{lane:0,pos:1}]);assert.equal(g.at(0,0,1).k,h.k);assert.equal(g.at(0,0,1).arrow,0);assert.equal(g.s.lanes[0].mana[0],50-g.card(h.k).mana);
});
test('without opposing vacancies, player can extend either edge preserving every existing pair',()=>{
 for(const edge of [-1,2]){const g=arena();for(const p of [0,1]){g.spawn('axe',p,0,0);g.spawn('melee_creep',p,0,1);}
  const old=g.all().map(u=>({uid:u.uid,pos:u.pos}));assert.deepEqual(g.placementPositions(0,0),[-1,2]);
  g.play(0,hand(g,'bronze_legionnaire').uid,[{lane:0,pos:edge}]);
  for(const u of old)assert.equal(g.get(u.uid).pos,u.pos+(edge===-1?1:0));
  assert.equal(g.at(0,0,edge===-1?0:2).k,'bronze_legionnaire');
 }
});
test('summons, cross-lane arrivals and returning heroes prioritize opposing vacancies',()=>{
 for(const mode of ['spawn','move','deploy']){const g=arena();g.spawn('melee_creep',0,0,0);g.spawn('melee_creep',1,0,0);g.spawn('melee_creep',1,0,1);let u;
  if(mode==='spawn')u=g.spawn('melee_creep',0,0);
  else{u=g.spawn('axe',0,1,0);if(mode==='move')g.move(u,0);else{u.alive=false;u.lane=-1;u.readyRound=1;g.s.phase='deploy';g.deploy(u.uid,0);}}
  assert.equal(u.pos,1,mode);assert.equal(u.arrow,0);
 }
});
test('dead hand creeps leave the board and cannot enter hero deployment',()=>{
 const g=arena();g.spawn('axe',0,0,0);g.play(0,hand(g,'bronze_legionnaire').uid,[{lane:0,pos:1}]);const u=g.all().find(u=>u.k==='bronze_legionnaire');
 g.condemn(u);g.sweep();assert(!g.all().includes(u));assert(g.s.players[0].discard.includes(u.k));g.s.round=99;g.s.phase='deploy';assert(!g.ready(0).includes(u));assert.throws(()=>g.deploy(u.uid,0),/英雄/);
});
test('unblocked arrows retain the 25/50/25 distribution even without neighboring enemies',()=>{
 const g=arena(),u=g.spawn('melee_creep',0,0,0),counts={'-1':0,0:0,1:0};
 for(let i=0;i<12000;i++){g.resetArrow(u);counts[u.arrow]++;}
 assert(counts[0]>5600&&counts[0]<6400);assert(counts[-1]>2600&&counts[-1]<3400);assert(counts[1]>2600&&counts[1]<3400);
 g.spawn('melee_creep',1,0,0);assert.equal(u.arrow,0);
});
