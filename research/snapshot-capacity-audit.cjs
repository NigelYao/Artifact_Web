/* Read-only product audit. Simulates isolated games in memory; never opens a database. */
'use strict';
const {Match}=require('../server/match.cjs');
const {getMessageBytes,Protocol}=require('@colyseus/core');
require('../dist/decks.js');
const fs=require('node:fs'),path=require('node:path');
const rows=[],games=[];let wroteMidgame=false;
const bytes=value=>Buffer.byteLength(JSON.stringify(value));
for(let index=0;index<4;index++){
 const decks=[ARTIFACT_DECKS[index%ARTIFACT_DECKS.length],ARTIFACT_DECKS[(index+1)%ARTIFACT_DECKS.length]];
 const record={code:'AUDIT0',revision:0,status:'battle',seats:decks.map((deck,p)=>({token:'isolated-'+p,ready:true,deck})),state:null,shopReady:[false,false],deployPlans:[null,null],processed:[[],[]],created:0};
 const match=new Match(record,()=>{}),g=match.game;g.newGame(...decks,8000+index);
 for(let action=0;action<800;action++){
  if(!wroteMidgame&&g.s.round===4&&g.s.phase==='action'&&g.s.lane===1){fs.writeFileSync(path.join(__dirname,'perf-midgame-state.json'),JSON.stringify(g.s,null,2));wroteMidgame=true;if(process.env.PERF_SEED_ONLY==='1'){console.log('Wrote isolated round 4 middle-lane state');process.exit(0);}}
  record.state=g.s;record.revision=action;record.status=g.s.winner===null?'battle':'finished';
  const row={game:index,action,round:g.s.round,phase:g.s.phase,units:g.s.units.length,log:g.s.log.length,recordJSON:bytes(record)};
  for(const seat of [0,1,'spectator']){const s=match.snapshot(seat,[true,true],true);row['json_'+seat]=bytes(s);row['wire_'+seat]=getMessageBytes.raw(Protocol.ROOM_DATA,'snapshot',s).length;}
  rows.push(row);if(g.s.winner!==null)break;
  if(g.s.phase==='action')g.aiStep(g.s.turn);
  else if(g.s.phase==='shop'){g.aiShop(0);g.aiShop(1);g.startRound();}
  else if(g.s.phase==='deploy'){g.aiDeploy(0);g.aiDeploy(1);g.finishDeployment();}
  else throw Error('Unexpected phase '+g.s.phase);
 }
 games.push({game:index,decks:decks.map(d=>d.name),round:g.s.round,winner:g.s.winner,actions:rows.filter(r=>r.game===index).length});
}
function distribution(list){const sorted=[...list].sort((a,b)=>a-b);return {min:sorted[0],median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1),mean:Math.round(sorted.reduce((a,b)=>a+b,0)/sorted.length)};}
const stages={};for(const [name,select] of [['early_round_1_2',r=>r.round<=2],['middle_round_3_5',r=>r.round>=3&&r.round<=5],['late_round_6_plus',r=>r.round>=6],['all',()=>true]]){const group=rows.filter(select);if(!group.length)continue;stages[name]={samples:group.length,playerJSON:distribution(group.flatMap(r=>[r.json_0,r.json_1])),playerWire:distribution(group.flatMap(r=>[r.wire_0,r.wire_1])),spectatorWire:distribution(group.map(r=>r.wire_spectator)),recordJSON:distribution(group.map(r=>r.recordJSON)),outboundBitsPerSecondAtOneActionEvery5s:distribution(group.map(r=>Math.round((r.wire_0+r.wire_1)*8/5)))};}
console.log(JSON.stringify({note:'AI-selected legal games, no database or socket; wire sizes use actual Colyseus message encoder, exclude websocket/TCP overhead. Shop actions grouped, not human action-frequency weighted.',games,stages},null,2));
