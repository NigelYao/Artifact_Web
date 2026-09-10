'use strict';
const {randomUUID}=require('node:crypto');
const {Match}=require('./match.cjs');
const {validateSharedDeck}=require('./deck-share.cjs');
const WAIT=10000,READY=30000,HEARTBEAT=15000;
function conflict(message){const error=Error(message);error.status=409;throw error;}
class Matchmaker {
 constructor(store,{clock=Date.now}={}){this.store=store;this.clock=clock;this.data=store.loadMatchmaking();this.lastSaved=JSON.stringify(this.data);}
 save(){const json=JSON.stringify(this.data);if(json!==this.lastSaved){this.store.saveMatchmaking(this.data);this.lastSaved=json;}}
 activeBattle(token){return this.store.activeBattle(token);}
 idle(token,reason){this.data.players[token]={status:'idle',reason};}
 enqueue(token,now,reason){this.data.players[token]={status:'queued',queuedAt:now,lastSeen:now,...(reason?{reason}:{})};}
 dissolve(match,now,cancelled){for(const token of match.tokens){const player=this.data.players[token];if(token===cancelled)this.idle(token,'cancelled');else if(now-player.lastSeen<HEARTBEAT&&(cancelled||player.ready))this.enqueue(token,now,'requeued');else this.idle(token,cancelled?'opponent_cancelled':'timeout');}delete this.data.matches[match.id];}
 tick(){const now=this.clock();
  for(const [token,p] of Object.entries(this.data.players)){if(p.status==='battle'&&this.store.load(p.code)?.status!=='battle')this.idle(token,'completed');if(p.status==='queued'){
   if(now-p.lastSeen>=HEARTBEAT)this.idle(token,'expired');
   else {const room=this.activeBattle(token);if(room)this.data.players[token]={status:'battle',code:room.code};}
  }
  }
  for(const match of Object.values(this.data.matches)){const occupied=match.tokens.map(token=>({token,room:this.activeBattle(token)})).filter(x=>x.room);if(occupied.length){this.dissolve(match,now,occupied[0].token);for(const {token,room} of occupied)this.data.players[token]={status:'battle',matchId:match.id,code:room.code};}else if(now>=match.deadline)this.dissolve(match,now);}
  const eligible=Object.entries(this.data.players).filter(([,p])=>p.status==='queued'&&now-p.queuedAt>=WAIT).sort((a,b)=>a[1].queuedAt-b[1].queuedAt);
  while(eligible.length>=2){const pair=eligible.splice(0,2),id=randomUUID(),match={id,tokens:pair.map(([token])=>token),deadline:now+READY};this.data.matches[id]=match;for(const [token,p] of pair)this.data.players[token]={status:'matched',matchId:id,deadline:match.deadline,lastSeen:p.lastSeen,ready:false};}
  this.save();
 }
 response(token){const p=this.data.players[token]||{status:'idle'},now=this.clock(),result={status:p.status,now,queueCount:Object.values(this.data.players).filter(p=>p.status==='queued').length};
  for(const key of ['queuedAt','matchId','deadline','code','reason'])if(p[key]!==undefined)result[key]=p[key];
  if(p.status==='matched'){const match=this.data.matches[p.matchId],other=match.tokens.find(t=>t!==token);result.mineReady=!!p.ready;if(p.ready)result.ownDeck=JSON.parse(JSON.stringify(p.deck));result.opponentReady=!!this.data.players[other].ready;}
  return result;
 }
 request(action,token,args={}){this.tick();const now=this.clock();let p=this.data.players[token];
  if(action==='join'){
   const battle=this.activeBattle(token);if(battle){if(p?.status==='matched')this.dissolve(this.data.matches[p.matchId],now,token);this.data.players[token]={status:'battle',code:battle.code,...(p?.status==='battle'&&p.matchId?{matchId:p.matchId}:{})};}
   else if(!p||p.status==='idle'||p.status==='battle')this.enqueue(token,now);
  }else if(action==='ready'){
   if(!args.matchId||p?.matchId!==args.matchId)conflict('匹配已更新，请刷新当前匹配状态');
   if(p.status==='battle')return this.response(token);
   if(p.status!=='matched')conflict('当前匹配已结束');
   if(!p.ready){let deck;try{deck=validateSharedDeck(args.deck);}catch(error){error.status=400;throw error;}p.deck=deck;p.ready=true;}
  }else if(action==='cancel'){
   if(p?.status==='battle')return this.response(token);
   if(args.matchId&&args.matchId!==p?.matchId)conflict('匹配已更新，不能取消新的匹配');
   if(p?.status==='matched')this.dissolve(this.data.matches[p.matchId],now,token);else this.idle(token,'cancelled');
  }else if(action!=='status')throw Error('Unsupported matchmaking action');
  p=this.data.players[token];if(p&&(p.status==='queued'||p.status==='matched'))p.lastSeen=now;
  if(p?.status==='matched'){
   const match=this.data.matches[p.matchId];if(match.tokens.every(t=>this.data.players[t].ready))this.start(match);
  }
  this.save();return this.response(token);
 }
 start(match){const backup=JSON.stringify(this.data);this.store.db.exec('BEGIN IMMEDIATE');
  try{
   const record=this.store.create(match.tokens[0]);record.seats[1]={token:match.tokens[1],deck:null,ready:false};
   const game=new Match(record,r=>this.store.save(r));
   match.tokens.forEach((token,seat)=>game.command(seat,{id:'matchmaking-ready-'+seat,revision:game.record.revision,action:'ready',args:{deck:this.data.players[token].deck}}));
   for(const token of match.tokens)this.data.players[token]={status:'battle',matchId:match.id,code:record.code};
   delete this.data.matches[match.id];this.store.saveMatchmaking(this.data);this.store.db.exec('COMMIT');this.lastSaved=JSON.stringify(this.data);
  }catch(error){this.store.db.exec('ROLLBACK');this.data=JSON.parse(backup);throw error;}
 }
}
function mountMatchmaking(app,{store,clock=Date.now,timer=true}){
 const maker=new Matchmaker(store,{clock});maker.tick();
 for(const action of ['join','status','ready','cancel'])app.post('/api/online/matchmaking/'+action,(req,res)=>{
  if(!store.authenticate(req.body?.token))return res.status(401).json({error:'恢复凭证无效，请重新进入大厅'});
  try{res.set('Cache-Control','no-store').json(maker.request(action,req.body.token,req.body));}catch(error){res.status(error.status||500).json({error:error.message});}
 });
 const interval=timer?setInterval(()=>{try{maker.tick();}catch(error){console.error('Matchmaking tick failed:',error.message);}},1000):null;interval?.unref();
 return {maker,close:()=>clearInterval(interval)};
}
module.exports={Matchmaker,mountMatchmaking,WAIT,READY,HEARTBEAT};
