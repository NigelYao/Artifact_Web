/* Navigation is an overlay on phones: opening it never rescales the board. */
(function(){'use strict';
 const phone=matchMedia('(max-width:600px), (orientation:landscape) and (max-height:540px) and (max-width:1366px)');
 let open=false,queued=false;
 const toggle=document.createElement('button');
 toggle.type='button';toggle.className='battle-nav-toggle';
 toggle.setAttribute('aria-controls','battle-main-navigation');
 document.body.appendChild(toggle);
 function sync(){
  queued=false;
  const active=document.body.classList.contains('in-battle')&&phone.matches,header=document.querySelector('.topbar');
  if(!active)open=false;
  document.body.classList.toggle('battle-nav-open',active&&open);
  toggle.hidden=!active;
  const label=open?'收起导航 ▴':'导航 ▾';
  if(toggle.textContent!==label)toggle.textContent=label;
  toggle.setAttribute('aria-expanded',String(active&&open));
  if(header){header.id='battle-main-navigation';header.inert=active&&!open;}
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(sync);}}
 toggle.addEventListener('click',()=>{open=!open;sync();});
 document.addEventListener('pointerdown',event=>{if(open&&!event.target.closest('.topbar,.battle-nav-toggle')){open=false;sync();}});
 document.addEventListener('click',event=>{if(open&&event.target.closest('.topbar button,.topbar a')){open=false;schedule();}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&open){open=false;sync();toggle.focus();}});
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 phone.addEventListener('change',sync);
 sync();
})();
