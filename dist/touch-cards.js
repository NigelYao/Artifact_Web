(function(root){'use strict';
// Gesture decisions are independent of rendering so accidental-play regressions can be tested.
class HandGesture {
 constructor(x,y,at){this.x=x;this.y=y;this.at=at;this.mode='pending';}
 hold(at){if(this.mode==='pending'&&at-this.at>=340)this.mode='read';return this.mode;}
 move(x,y,at){this.hold(at);if(this.mode==='pending'&&Math.hypot(x-this.x,y-this.y)>8)this.mode='scroll';if(this.mode==='read'&&this.y-y>36)this.mode='drag';return this.mode;}
}
if(typeof module==='object'&&module.exports){module.exports={HandGesture};return;}
const I18N=(typeof ArtifactI18n!=='undefined'?ArtifactI18n:null)||(typeof require==='function'?(function(){try{return require('./i18n.js')}catch(e){return null}})():null);
const T=I18N?I18N.T:(z,e)=>z,cardName=I18N?I18N.cardName:c=>c?c.name:'',cardText=I18N?I18N.cardText:c=>c?c.text||'':'';
const L=I18N?I18N.localize:v=>v;
const app=root.ArtifactApp;if(!app)return;
const cards=new Map((root.ArtifactCampaignBridge?.cards||root.ARTIFACT_CARDS).map(c=>[c.key,c]));
const types={Hero:['英雄','Hero'],Creep:['小兵','Creep'],Spell:['法术','Spell'],Improvement:['强化','Improvement'],Item:['装备 / 物品','Equipment / Item']};
let active=null,selected=null,panel=null,ghost=null,holdTimer=0,ignoreUntil=0,frame=0;
const hand=()=>document.querySelector('.hand-scroll');
function close(){selected=null;panel?.remove();panel=null;document.querySelectorAll('.touch-card-reading').forEach(c=>c.classList.remove('touch-card-reading'));}
function clearDrag(){ghost?.remove();ghost=null;document.querySelectorAll('.touch-drop-hover').forEach(el=>el.classList.remove('touch-drop-hover'));}
function finish(cancel=true){clearTimeout(holdTimer);cancelAnimationFrame(frame);if(cancel&&active?.dragStarted)app.cancelHandDrag?.();clearDrag();active=null;}
function refresh(){
 if(!selected)return;
 const h=app.game.s?.players[0].hand.find(c=>c.uid===selected.uid);
 if(!h||app.ui.route!=='battle'||app.ui.intro||document.querySelector('#modal[open]')){close();return;}
 const why=app.ui.busy?T('战场结算中…','Resolving combat…'):app.game.canPlay(0,h);
 panel.querySelector('.touch-card-use').disabled=!!why;
 panel.querySelector('.touch-card-hint').textContent=L(why)||T('长按向上拖出牌，或点击使用选择目标','Hold and drag up to play, or tap Use to pick targets');
}
function show(el){
 if(!el)return;const c=cards.get(el.dataset.card);if(!c)return;
 const uid=Number(el.dataset.hand);if(selected?.uid===uid){refresh();return;}
 close();selected={uid};panel=document.createElement('aside');panel.className='touch-card-preview';panel.setAttribute('aria-label',T('手牌说明','Card details'));
 panel.innerHTML=`<div class="touch-card-heading"><span></span><button type="button" class="touch-card-close" aria-label="${T('关闭手牌说明','Close card details')}">×</button></div><img class="touch-card-art" alt="" draggable="false"><strong class="touch-card-name"></strong><p class="touch-card-description"></p><small class="touch-card-hint"></small><button type="button" class="touch-card-use">${T('使用此牌','Play this card')}</button>`;
 panel.querySelector('.touch-card-heading span').textContent=`${types[c.type]?T(types[c.type][0],types[c.type][1]):T('卡牌','Card')} · ${c.type==='Item'?T('不消耗魔力','No mana cost'):`${c.mana||0} ${T('魔力','mana')}`}`;
 panel.querySelector('.touch-card-name').textContent=cardName(c);panel.querySelector('.touch-card-art').src=c.art;panel.querySelector('.touch-card-art').alt=cardName(c);
 panel.querySelector('.touch-card-description').textContent=cardText(c)||T('无额外技能。','No additional abilities.');
 panel.querySelector('.touch-card-close').onclick=close;
 panel.querySelector('.touch-card-use').onclick=()=>{const id=selected?.uid;close();if(id!=null)app.playHand(id);};
 document.body.appendChild(panel);el.classList.add('touch-card-reading');refresh();
}
I18N&&I18N.onChange&&I18N.onChange(()=>close());
function readAt(x){
 const strip=hand();if(!strip)return;const bounds=strip.getBoundingClientRect();
 const visible=[...strip.querySelectorAll('[data-hand]')].filter(el=>{const r=el.getBoundingClientRect();return r.right>bounds.left&&r.left<bounds.right;});
 // Use visible card intervals, including overlap, so the card under the finger is selected.
 const hit=visible.filter(el=>{const r=el.getBoundingClientRect();return x>=r.left&&x<=r.right;}).at(-1);
 show(hit||visible.reduce((best,el)=>{const r=el.getBoundingClientRect(),d=Math.abs(x-(r.left+r.right)/2);return !best||d<best.d?{el,d}:best;},null)?.el);
}
function edgeRead(){
 if(!active||active.gesture.mode!=='read')return;
 const strip=hand();if(!strip)return;const r=strip.getBoundingClientRect(),x=active.lastX;
 const delta=x<r.left+28?-5:x>r.right-28?5:0;
 if(delta){strip.scrollLeft+=delta;readAt(x);}frame=requestAnimationFrame(edgeRead);
}
document.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='touch'&&e.pointerType!=='pen'){document.body.classList.remove('touch-hand-input');if(!panel?.contains(e.target))close();return;}
 if(panel?.contains(e.target))return;
 const el=e.target.closest('.hand-cards [data-hand]');
 if(!el){close();return;}if(active||app.ui.intro)return;
 e.preventDefault();e.stopImmediatePropagation();document.body.classList.add('touch-hand-input');
 active={id:e.pointerId,gesture:new HandGesture(e.clientX,e.clientY,performance.now()),lastX:e.clientX,scroll:hand().scrollLeft,el};
 try{document.documentElement.setPointerCapture(e.pointerId);}catch{}show(el);ignoreUntil=Date.now()+1200;
 holdTimer=setTimeout(()=>{if(active&&active.gesture.hold(performance.now())==='read'){panel?.classList.add('is-scrubbing');edgeRead();}},345);
},{capture:true,passive:false});
document.addEventListener('pointermove',e=>{
 if(!active||e.pointerId!==active.id)return;e.preventDefault();e.stopImmediatePropagation();
 const mode=active.gesture.move(e.clientX,e.clientY,performance.now());active.lastX=e.clientX;
 if(mode==='scroll'){clearTimeout(holdTimer);const strip=hand();if(strip)strip.scrollLeft=active.scroll+active.gesture.x-e.clientX;readAt(e.clientX);}
 else if(mode==='read')readAt(e.clientX);
 else if(mode==='drag'){
  if(!active.dragStarted){const id=selected?.uid;if(id==null||!app.beginHandDrag){finish();return;}const c=app.game.s.players[0].hand.find(h=>h.uid===id),art=cards.get(c?.k);if(!art){finish();return;}active.dragStarted=true;close();if(!app.beginHandDrag(id)){finish(false);return;}ghost=document.createElement('div');ghost.className='touch-drag-ghost';const image=document.createElement('img');image.src=art.art;image.alt='';const name=document.createElement('strong');name.textContent=art.name;ghost.append(image,name);document.body.appendChild(ghost);}
  ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';document.querySelectorAll('.touch-drop-hover').forEach(el=>el.classList.remove('touch-drop-hover'));const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.targetable,.lane-target,.lane');if(target)target.classList.add('touch-drop-hover');
 }
},{capture:true,passive:false});
document.addEventListener('pointerup',e=>{if(!active||e.pointerId!==active.id)return;e.preventDefault();e.stopImmediatePropagation();ignoreUntil=Date.now()+800;const dropping=active.dragStarted;clearDrag();if(dropping){app.dropHandAt(e.clientX,e.clientY);finish(false);}else finish();panel?.classList.remove('is-scrubbing');},{capture:true,passive:false});
document.addEventListener('pointercancel',e=>{if(active?.id===e.pointerId){finish();close();}},true);
document.addEventListener('click',e=>{if(Date.now()<ignoreUntil&&e.target.closest('.hand-cards [data-hand]')){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest('.hand-cards [data-hand]')&&(active||document.body.classList.contains('touch-hand-input')))e.preventDefault();});
document.addEventListener('dragstart',e=>{if(active&&e.target.closest('[data-hand]'))e.preventDefault();},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){finish();close();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){finish();close();}});
window.addEventListener('resize',()=>{finish();close();});
new MutationObserver(()=>{if(active&&!active.dragStarted&&!active.el.isConnected)finish();refresh();}).observe(document.getElementById('app'),{childList:true,subtree:true});
})(typeof window!=='undefined'?window:globalThis);
