/* Anonymous activity heartbeat. Offline/static-only play never depends on it. */
(function(){'use strict';
 if(!/^https?:$/.test(location.protocol))return;
 let token=null,pending=false;
 async function heartbeat(){
  if(document.hidden||pending)return;pending=true;
  try{
   if(!token){
    if(window.ArtifactOnline)token=(await ArtifactOnline.session()).token;
    else{const saved=localStorage.getItem('artifact.online.identity');const response=await fetch('/api/online/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:saved})});if(!response.ok)return;token=(await response.json()).token;localStorage.setItem('artifact.online.identity',token);}
   }
   const name=location.pathname.split('/').pop(),page=name==='online-battle.html'?'online-battle':name==='online.html'?'online-room':name.startsWith('campaign')?'campaign':document.body.classList.contains('in-battle')?'single':'lobby';
   await fetch('/api/online/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,page}),keepalive:true});
  }catch{}finally{pending=false;}
 }
 heartbeat();setInterval(heartbeat,25000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)heartbeat();});
})();
