/* Board gestures deliberately ignore cards, targeting, overlays and combat locks. */
(function(){'use strict';
const app=window.ArtifactApp;let clickTimer=null,touch=null,suppressClickUntil=0;
const available=()=>app.ui.route==='battle'&&!app.ui.busy&&!app.ui.intro&&!document.querySelector('#modal[open]')&&!document.querySelector('.phase-overlay');
const blankLane=e=>e.target.closest('.lane')&&!e.target.closest('[data-unit],[data-action],[data-deploy-hero],.game-card,.improvement,.tower-bar,.deploy-lane-target')?e.target.closest('.lane'):null;
document.addEventListener('click',e=>{
 clearTimeout(clickTimer);if(Date.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();return;}
 if(!available()||app.ui.selection)return;const lane=blankLane(e);if(!lane||app.ui.focus!==null||e.detail>1)return;
 const id=Number(lane.dataset.lane);clickTimer=setTimeout(()=>{if(available()&&!app.ui.selection&&app.ui.focus===null)app.focus(id);},290);
},true);
document.addEventListener('dblclick',e=>{clearTimeout(clickTimer);if(!available()||app.ui.selection)return;const lane=blankLane(e);if(!lane)return;e.preventDefault();app.focus(app.ui.focus===null?Number(lane.dataset.lane):null);});
function highlight(target){document.querySelectorAll('.deploy-drop-hover').forEach(e=>e.classList.remove('deploy-drop-hover'));const lane=target?.closest('.lane');if(lane)lane.classList.add('deploy-drop-hover');return lane;}
function cleanup(){highlight(null);document.querySelectorAll('.is-dragging').forEach(e=>e.classList.remove('is-dragging'));document.querySelector('.deployment-touch-ghost')?.remove();}
document.addEventListener('dragstart',e=>{if(e.target.closest('[data-deploy-hero]')){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('pointerdown',e=>{if(!available()||app.game.s.phase!=='deploy')return;const hero=e.target.closest('[data-deploy-hero]');if(!hero)return;if(e.pointerType==='mouse')e.preventDefault();touch={id:Number(hero.dataset.deployHero),x:e.clientX,y:e.clientY,hero,active:false};});
document.addEventListener('pointermove',e=>{if(!touch)return;if(!touch.active&&Math.hypot(e.clientX-touch.x,e.clientY-touch.y)<8)return;if(!touch.active){touch.active=true;touch.hero.setPointerCapture(e.pointerId);const ghost=touch.hero.cloneNode(true);ghost.classList.add('deployment-touch-ghost');ghost.removeAttribute('data-deploy-hero');ghost.inert=true;document.body.appendChild(ghost);touch.hero.classList.add('is-dragging');}e.preventDefault();const ghost=document.querySelector('.deployment-touch-ghost');ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';highlight(document.elementFromPoint(e.clientX,e.clientY));},{passive:false});
document.addEventListener('pointerup',e=>{if(!touch)return;const t=touch;touch=null;if(t.active){const lane=document.elementFromPoint(e.clientX,e.clientY)?.closest('.lane');cleanup();suppressClickUntil=Date.now()+350;if(lane)app.assignDeployment(t.id,Number(lane.dataset.lane));}});
document.addEventListener('pointercancel',()=>{touch=null;cleanup();});
document.addEventListener('keydown',e=>{clearTimeout(clickTimer);if(e.key==='Escape'&&touch){touch=null;cleanup();suppressClickUntil=Date.now()+350;}},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){touch=null;cleanup();clearTimeout(clickTimer);}});
})();
