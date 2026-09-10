'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes,timingSafeEqual,createHash}=require('node:crypto');
const heroes=new Map(require('../dist/cards.json').map(card=>[card.key,card.name]));
function adminToken(filename,envToken){
 if(envToken){if(!/^[a-zA-Z0-9_-]{32,128}$/.test(envToken))throw Error('ARTIFACT_ADMIN_TOKEN must contain 32–128 URL-safe characters');return envToken;}
 fs.mkdirSync(path.dirname(filename),{recursive:true});
 try{fs.writeFileSync(filename,randomBytes(32).toString('hex'),{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;}
 const value=fs.readFileSync(filename,'utf8').trim();if(!/^[a-zA-Z0-9_-]{32,128}$/.test(value))throw Error('Invalid persisted administrator token');return value;
}
function safeEqual(a,b){const x=Buffer.from(String(a||'')),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function summarize(record,updated,live){const s=record.state;return {code:record.code,status:record.status,revision:record.revision,created:record.created,updated,round:s?.round??null,lane:s?.lane??null,phase:s?.phase??null,winner:s?.winner??null,connected:live?.connected()||[false,false],players:record.seats.map((seat,index)=>({occupied:!!seat,name:seat?.deck?.name||`玩家 ${index+1}`,ready:!!seat?.ready,heroes:(seat?.deck?.heroes||[]).map(key=>heroes.get(key)||key)}))};}
function mountAdmin(app,{store,liveRooms,token,clock=Date.now}){
 const presence=new Map(),started=clock();
 const pages=new Set(['lobby','single','campaign','online-room','online-battle']);
 const touch=(identity,page)=>presence.set(identity,{seen:clock(),page:pages.has(page)?page:(presence.get(identity)?.page||'lobby')});
 app.post('/api/online/presence',(req,res)=>{if(!store.authenticate(req.body?.token))return res.status(401).json({error:'恢复凭证无效'});if(req.body.page!==undefined&&!pages.has(req.body.page))return res.status(400).json({error:'无效页面类别'});touch(req.body.token,req.body.page);res.status(204).end();});
 app.use('/_admin',(req,res,next)=>{res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'});next();});
 const authorize=(req,res,next)=>{if(!safeEqual(req.params.token,token))return res.status(404).end();next();};
 app.get('/_admin/:token',authorize,(req,res)=>{res.set('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");res.sendFile(path.join(__dirname,'admin.html'));});
 app.get('/_admin/:token/data',authorize,(req,res)=>{
  const status=['all','lobby','battle','finished'].includes(req.query.status)?req.query.status:'all';
  const page=Math.max(1,Math.min(100000,parseInt(req.query.page,10)||1));
  for(const [identity,value] of presence)if(clock()-value.seen>75000)presence.delete(identity);
  const connectedTokens=new Set(),roomsByToken=new Map();let connections=0;
  for(const room of liveRooms.values())for(const seat of room.sessions.values()){connections++;const identity=room.match.record.seats[seat]?.token;if(identity){connectedTokens.add(identity);const list=roomsByToken.get(identity)||[];list.push(room.match.record.code);roomsByToken.set(identity,list);}}
  const online=new Set([...presence.keys(),...connectedTokens]);
  const visitors=[...online].map(identity=>({id:createHash('sha256').update(identity).digest('hex').slice(0,12),lastSeen:presence.get(identity)?.seen??null,page:presence.get(identity)?.page||(connectedTokens.has(identity)?'online-room':'lobby'),connected:connectedTokens.has(identity),rooms:roomsByToken.get(identity)||[]})).sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0));
  const data=store.adminRooms(status,page,20);
  res.json({now:clock(),uptimeSeconds:Math.floor((clock()-started)/1000),online:{users:online.size,roomUsers:connectedTokens.size,roomConnections:connections,recentVisitors:presence.size,heartbeatSeconds:75,visitors},counts:store.adminCounts(),page:data.page,size:data.size,total:data.total,rooms:data.rows.map(row=>summarize(row.record,row.updated,liveRooms.get(row.record.code)))});
 });
 return {touch};
}
module.exports={adminToken,safeEqual,summarize,mountAdmin};
