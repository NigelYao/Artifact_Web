(function(){
'use strict';
const key='artifact.online.identity',roomKey='artifact.online.room';
let token=localStorage.getItem(key),sessionPromise,room,snapshot,status='offline',code='',reconnectTimer,stopped=false,spectating=false;
const listeners=new Set(),errors=new Set(),statuses=new Set(),pending=new Map();
function setStatus(s){status=s;statuses.forEach(fn=>fn(s));}
function report(e){errors.forEach(fn=>fn(e.message||String(e)));}
async function api(path,body){const r=await fetch('/api/online/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data;try{data=await r.json();}catch{throw Error('联机服务未启动，请使用 Node.js 服务访问。');}if(!r.ok)throw Error(data.message||data.error||'请求失败');return data;}
async function session(){if(!sessionPromise)sessionPromise=api('session',{token}).then(s=>{token=s.token;localStorage.setItem(key,token);return s;}).finally(()=>{sessionPromise=null;});return sessionPromise;}
function rejectPending(message){for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error(message));}pending.clear();}
function release(){const old=room;room=null;old?.leave();}
function retry(){clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{if(!stopped)connect(code,{spectate:spectating}).catch(e=>{report(e);if(!stopped)retry();});},2500);}
async function connect(requestedCode,options={}){
 spectating=options.spectate===true;
 code=String(requestedCode||new URLSearchParams(location.search).get('code')||localStorage.getItem(roomKey)||'').trim().toUpperCase();if(!code)throw Error('请输入匹配码');
 stopped=false;clearTimeout(reconnectTimer);release();rejectPending('连接已更换，请确认操作结果。');snapshot=null;setStatus('connecting');
 try{
  await session();if(!window.Colyseus)throw Error('联机通信组件加载失败，请使用 Node.js 服务访问。');
  const client=new Colyseus.Client(location.origin.replace(/^http/,'ws')),active=await client.joinOrCreate('battle',{code,token,spectate:spectating});
  if(stopped){active.leave();throw Error('已取消连接');}room=active;if(!spectating)localStorage.setItem(roomKey,code);
  return await new Promise((resolve,reject)=>{
   let first=true;const timeout=setTimeout(()=>{if(first){first=false;release();reject(Error('等待房间状态超时，请重试。'));}},15000);
   active.onMessage('snapshot',s=>{if(active!==room)return;snapshot=s;setStatus('connected');if(s.ack&&pending.has(s.ack)){const p=pending.get(s.ack);clearTimeout(p.timer);pending.delete(s.ack);p.resolve(s);}listeners.forEach(fn=>fn(s));if(first){first=false;clearTimeout(timeout);resolve(s);}});
   active.onMessage('replaced',()=>{if(active!==room)return;stopped=true;clearTimeout(reconnectTimer);clearTimeout(timeout);rejectPending('此对局已在其他页面打开');release();setStatus('replaced');report(Error('此对局已在其他页面打开，请在另一页面继续。'));if(first){first=false;reject(Error('此对局已在其他页面打开'));}});
   active.onMessage('error',e=>{if(active!==room)return;const p=pending.get(e.id);if(p){clearTimeout(p.timer);pending.delete(e.id);p.reject(Error(e.message));}else report(Error(e.message));});
   active.onError((_,message)=>{if(active===room)report(Error(message||'连接异常'));});
   active.onLeave(()=>{if(active!==room)return;room=null;setStatus('offline');rejectPending('连接已中断，请重连后确认操作结果。');if(first){first=false;clearTimeout(timeout);reject(Error('房间连接中断'));}else if(!stopped)retry();});
  });
 }catch(e){if(status!=='replaced')setStatus('offline');throw e;}
}
function command(action,args={}){if(spectating)return Promise.reject(Error('观战模式无法操作对局')); if(status!=='connected'||!room||!snapshot)return Promise.reject(Error('正在重新连接，请稍候。'));const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('操作确认超时，请检查当前棋盘后重试。'));},15000);pending.set(id,{resolve,reject,timer});try{room.send('command',{id,revision:snapshot.revision,action,args});}catch(e){clearTimeout(timer);pending.delete(id);reject(e);}});}
window.ArtifactOnline={session,connect,command,create:async()=>{await session();return api('rooms',{token});},subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},onError:fn=>{errors.add(fn);return()=>errors.delete(fn);},onStatus:fn=>{statuses.add(fn);return()=>statuses.delete(fn);},getSnapshot:()=>snapshot,getStatus:()=>status,lastCode:()=>localStorage.getItem(roomKey),disconnect:()=>{stopped=true;clearTimeout(reconnectTimer);release();setStatus('offline');rejectPending('已离开房间');}};
})();
