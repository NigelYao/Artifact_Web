(function(root){'use strict';
const I18N=(typeof ArtifactI18n!=='undefined'?ArtifactI18n:null)||(typeof require==='function'?(function(){try{return require('./i18n.js')}catch(e){return null}})():null);
const T=I18N?I18N.T:(z,e)=>z,pick=I18N?I18N.pick:(o,b)=>o?o[b]:'',cardName=I18N?I18N.cardName:c=>c?c.name:'',cardText=I18N?I18N.cardText:c=>c?c.text||'':'';
const L=I18N?I18N.localize:v=>v;
class MatchmakingClient{
 constructor({session,fetcher,onState,onError,timeoutMs=8000}){this.session=session;this.fetcher=fetcher;this.onState=onState;this.onError=onError;this.timeoutMs=timeoutMs;this.token=null;this.epoch=0;this.chain=Promise.resolve();}
 request(action,extra={}){if(action==='cancel')this.epoch++;const epoch=this.epoch;const work=async()=>{const controller=new AbortController();let timer;try{const operation=async()=>{if(!this.token)this.token=(await this.session()).token;const response=await this.fetcher('/api/online/matchmaking/'+action,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({token:this.token,...extra})});const data=await response.json();if(response.status===401)this.token=null;if(!response.ok)throw Error(data.message||data.error||T('匹配服务暂时不可用','Matchmaking is temporarily unavailable'));return data;};const data=await Promise.race([operation(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error(T('连接超时，请重试恢复匹配','Connection timed out — retry to resume matchmaking')));},this.timeoutMs);})]);if(epoch===this.epoch)this.onState(data);return data;}catch(e){if(epoch===this.epoch)this.onError(e);throw e;}finally{clearTimeout(timer);}};const pending=this.chain.then(work);this.chain=pending.catch(()=>{});return pending;}
}
const remaining=(deadline,now)=>Math.max(0,Math.ceil((Number(deadline)-now)/1000));
const sameDeck=(a,b)=>['heroes','main','items'].every(k=>Array.isArray(a?.[k])&&Array.isArray(b?.[k])&&a[k].length===b[k].length&&a[k].every((value,i)=>value===b[k][i]));
const api={MatchmakingClient,remaining,sameDeck};if(typeof module==='object'&&module.exports)module.exports=api;else root.ArtifactMatchmaking=api;
})(typeof window!=='undefined'?window:globalThis);
