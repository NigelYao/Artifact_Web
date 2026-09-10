'use strict';
const path=require('node:path');
const http=require('node:http');
const express=require('express');
const {Server,Room,ServerError}=require('@colyseus/core');
const {WebSocketTransport}=require('@colyseus/ws-transport');
const {Store}=require('./store.cjs');
const {Match}=require('./match.cjs');
const {adminToken,mountAdmin}=require('./admin.cjs');
const {mountDeckShare}=require('./deck-share.cjs');
const {mountMatchmaking}=require('./matchmaking.cjs');
const database=process.env.ARTIFACT_DB||path.join(__dirname,'data','online.sqlite');
const store=new Store(database),liveRooms=new Map();
class BattleRoom extends Room {
 onCreate(options){const record=store.load(options.code);if(!record)throw new ServerError(404,'找不到匹配码');this.autoDispose=true;this.maxClients=128;this.match=new Match(record,r=>store.save(r));this.sessions=new Map();liveRooms.set(record.code,this);this.onMessage('command',(client,message)=>{const seat=this.sessions.get(client.sessionId);try{const result=this.match.command(seat,message);this.publish(result.duplicate?client:null,message.id,client,!result.duplicate);}catch(e){client.send('error',{id:message?.id,message:e.message,revision:this.match.record.revision});this.sendSnapshot(client,false);}});this.onMessage('sync',client=>this.sendSnapshot(client,false));}
 onAuth(client,options){if(!store.authenticate(options.token))throw new ServerError(401,'恢复凭证无效，请重新进入大厅');return {token:options.token};}
 onJoin(client,options,auth){let seat;try{seat=options.spectate===true?'spectator':this.match.join(auth.token);}catch(e){throw new ServerError(403,e.message);}if(seat!=='spectator')matchmaking.maker.request('cancel',auth.token);for(const old of this.clients){if(seat!=='spectator'&&old!==client&&this.sessions.get(old.sessionId)===seat){this.sessions.delete(old.sessionId);old.send('replaced',{message:'该席位已在另一个页面打开'});old.leave(4001);}}this.sessions.set(client.sessionId,seat);this.publish();}
 onLeave(client){this.sessions.delete(client.sessionId);this.publish();}
 connected(){return [0,1].map(p=>[...this.sessions.values()].includes(p));}
 onDispose(){if(liveRooms.get(this.match.record.code)===this)liveRooms.delete(this.match.record.code);}
 sendSnapshot(client,events=false,ack){const seat=this.sessions.get(client.sessionId);if(seat===undefined)return;client.send('snapshot',this.match.snapshot(seat,this.connected(),events,ack));}
 publish(only=null,ack=null,actor=null,events=false){for(const client of this.clients)if(!only||client===only)this.sendSnapshot(client,events,client===actor?ack:undefined);}
}
const app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'128kb'}));
mountDeckShare(app,{store});
const matchmaking=mountMatchmaking(app,{store});
const admin=mountAdmin(app,{store,liveRooms,token:adminToken(process.env.ARTIFACT_ADMIN_TOKEN_FILE||path.join(path.dirname(database),'admin-token'),process.env.ARTIFACT_ADMIN_TOKEN)});
app.get(['/health','/api/online/health'],(req,res)=>res.json({ok:true,mode:'online',protocol:1}));
app.post('/api/online/session',(req,res)=>{const token=store.identity(req.body?.token);admin.touch(token);res.set('Cache-Control','no-store').json({token,rooms:store.rooms(token)});});
app.post('/api/online/rooms',(req,res)=>{if(!store.authenticate(req.body?.token))return res.status(401).json({error:'恢复凭证无效'});matchmaking.maker.request('cancel',req.body.token);const record=store.create(req.body.token);res.status(201).json({code:record.code});});
app.get('/vendor/colyseus.js',(req,res)=>res.sendFile(path.join(__dirname,'..','node_modules','colyseus.js','dist','colyseus.js')));
app.use(express.static(path.join(__dirname,'..','dist'),{setHeaders(res,file){if(/\.(html|js|css)$/.test(file))res.setHeader('Cache-Control','no-cache');}}));
app.use((error,req,res,next)=>{res.status(error.status||500).json({error:error.status===413?'请求过大':error.message});});
const server=http.createServer(app);
const gameServer=new Server({transport:new WebSocketTransport({server,maxPayload:128*1024}),greet:false});
gameServer.define('battle',BattleRoom).filterBy(['code']);
const port=Number(process.env.PORT||8787),host=process.env.HOST||'0.0.0.0';
gameServer.listen(port,host).then(()=>console.log(`Artifact Threefold online listening http://${host}:${port}`)).catch(error=>{console.error(error);process.exit(1);});
