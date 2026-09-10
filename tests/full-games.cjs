const assert=require('node:assert/strict');
const cards=require('../dist/cards.json');const {Game}=require('../dist/engine.js');require('../dist/effects.js');require('../dist/decks.js');
const results=[];
for(const [seed,a,b] of [[77,0,1],[195,2,3],[823,1,0],[419,3,2]]){
 const g=new Game(cards);g.newGame(ARTIFACT_DECKS[a],ARTIFACT_DECKS[b],seed);let steps=0,lastRound=0;
 while(g.s.winner===null&&steps++<750){
  if(g.s.phase==='action')g.aiStep(g.s.turn);
  else if(g.s.phase==='shop'){g.aiShop(0);g.aiShop(1);g.startRound();g.aiDeploy(0);g.aiDeploy(1);g.finishDeployment();}
  else if(g.s.phase==='deploy'){g.aiDeploy(0);g.aiDeploy(1);g.finishDeployment();}
  else throw Error('stalled phase '+g.s.phase);
  for(const u of g.all()){const s=g.stats(u);assert(Number.isFinite(s.attack)&&Number.isFinite(s.hp));assert(g.all(u.owner,u.lane).filter(v=>v.pos===u.pos).length===1);}
  assert(g.s.players.every(p=>p.gold>=0));
  if(g.s.round!==lastRound){lastRound=g.s.round;console.log(`seed ${seed} · round ${lastRound} · units ${g.all().length}`);}
 }
 assert.notEqual(g.s.winner,null,'game must terminate');results.push({seed,deckA:ARTIFACT_DECKS[a].name,deckB:ARTIFACT_DECKS[b].name,rounds:g.s.round,steps,winner:g.s.winner});console.log('COMPLETE',JSON.stringify(results.at(-1)));
}
console.log('Four deterministic full games completed.',JSON.stringify(results));
