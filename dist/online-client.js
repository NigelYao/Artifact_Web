(function(){
'use strict';
const I18N=(typeof ArtifactI18n!=='undefined'?ArtifactI18n:null)||(typeof require==='function'?(function(){try{return require('./i18n.js')}catch(e){return null}})():null);
const T=I18N?I18N.T:(z,e)=>z,pick=I18N?I18N.pick:(o,b)=>o?o[b]:'',cardName=I18N?I18N.cardName:c=>c?c.name:'',cardText=I18N?I18N.cardText:c=>c?c.text||'':'';
const L=I18N?I18N.localize:v=>v;

const key='artifact.online.identity',roomKey='artifact.online.room';
let token=localStorage.getItem(key),sessionPromise,room,snapshot,status='offline',code='',reconnectTimer,stopped=false,spectating=false;
const listeners=new Set(),errors=new Set(),statuses=new Set(),pending=new Map();
function setStatus(s){status=s;statuses.forEach(fn=>fn(s));}
function report(e){errors.forEach(fn=>fn(e.message||String(e)));}
async function api(path,body){const r=await fetch('/api/online/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data;try{data=await r.json();}catch{throw Error(T('联机服务未启动，请使用 Node.js 服务访问。','Online service is not running — use the Node.js server.'));}if(!r.ok)throw Error(data.message||data.error||T('请求失败','Request failed'));return data;}
async function session(){if(!sessionPromise)sessionPromise=api('session',{token}).then(s=>{token=s.token;localStorage.setItem(key,token);return s;}).finally(()=>{sessionPromise=null;});return sessionPromise;}
function rejectPending(message){for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error(message));}pending.clear();}
function release(){const old=room;room=null;old?.leave();}
function retry(){clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{if(!stopped)connect(code,{spectate:spectating}).catch(e=>{report(e);if(!stopped)retry();});},2500);}
async function connect(requestedCode,options={}){
 spectating=options.spectate===true;
 code=String(requestedCode||new URLSearchParams(location.search).get('code')||localStorage.getItem(roomKey)||'').trim().toUpperCase();if(!code)throw Error(T('请输入匹配码','Enter a match code'));
 stopped=false;clearTimeout(reconnectTimer);release();rejectPending(T('连接已更换，请确认操作结果。','Connection changed — please confirm the result.'));snapshot=null;setStatus('connecting');
 try{
  await session();if(!window.Colyseus)throw Error(T('联机通信组件加载失败，请使用 Node.js 服务访问。','Online transport failed to load — use the Node.js server.'));
  const client=new Colyseus.Client(location.origin.replace(/^http/,'ws')),active=await client.joinOrCreate('battle',{code,token,spectate:spectating});
  if(stopped){active.leave();throw Error(T('已取消连接','Connection cancelled'));}room=active;if(!spectating)localStorage.setItem(roomKey,code);
  return await new Promise((resolve,reject)=>{
   let first=true;const timeout=setTimeout(()=>{if(first){first=false;release();reject(Error(T('等待房间状态超时，请重试。','Timed out waiting for room state — please retry.')));}},15000);
   active.onMessage('snapshot',s=>{if(active!==room)return;snapshot=s;setStatus('connected');if(s.ack&&pending.has(s.ack)){const p=pending.get(s.ack);clearTimeout(p.timer);pending.delete(s.ack);p.resolve(s);}listeners.forEach(fn=>fn(s));if(first){first=false;clearTimeout(timeout);resolve(s);}});
   active.onMessage('replaced',()=>{if(active!==room)return;stopped=true;clearTimeout(reconnectTimer);clearTimeout(timeout);rejectPending(T('此对局已在其他页面打开','This match is open in another tab'));release();setStatus('replaced');report(Error(T('此对局已在其他页面打开，请在另一页面继续。','This match is open in another tab — continue there.')));if(first){first=false;reject(Error(T('此对局已在其他页面打开','This match is open in another tab')));}});
   active.onMessage('error',e=>{if(active!==room)return;const p=pending.get(e.id);if(p){clearTimeout(p.timer);pending.delete(e.id);p.reject(Error(e.message));}else report(Error(e.message));});
   active.onError((_,message)=>{if(active===room)report(Error(message||T('连接异常','Connection error')));});
   active.onLeave(()=>{if(active!==room)return;room=null;setStatus('offline');rejectPending(T('连接已中断，请重连后确认操作结果。','Connection lost — reconnect, then confirm the result.'));if(first){first=false;clearTimeout(timeout);reject(Error(T('房间连接中断','Room connection lost')));}else if(!stopped)retry();});
  });
 }catch(e){if(status!=='replaced')setStatus('offline');throw e;}
}
function command(action,args={}){if(spectating)return Promise.reject(Error(T('观战模式无法操作对局','Spectators cannot act'))); if(status!=='connected'||!room||!snapshot)return Promise.reject(Error(T('正在重新连接，请稍候。','Reconnecting, please wait.')));const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error(T('操作确认超时，请检查当前棋盘后重试。','Action confirmation timed out — check the board and retry.')));},15000);pending.set(id,{resolve,reject,timer});try{room.send('command',{id,revision:snapshot.revision,action,args});}catch(e){clearTimeout(timer);pending.delete(id);reject(e);}});}
window.ArtifactOnline={session,connect,command,create:async()=>{await session();return api('rooms',{token});},subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},onError:fn=>{errors.add(fn);return()=>errors.delete(fn);},onStatus:fn=>{statuses.add(fn);return()=>statuses.delete(fn);},getSnapshot:()=>snapshot,getStatus:()=>status,lastCode:()=>localStorage.getItem(roomKey),disconnect:()=>{stopped=true;clearTimeout(reconnectTimer);release();setStatus('offline');rejectPending(T('已离开房间','Left the room'));}};
})();
