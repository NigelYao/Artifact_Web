/* Original procedural effects. This module never mutates game state. */
(function(root){'use strict';
const landingRects=new WeakMap();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function fragment(layer,cls,x,y,vars={},life=900){const e=document.createElement('i');e.className=cls;e.style.left=x+'px';e.style.top=y+'px';for(const [k,v] of Object.entries(vars))e.style.setProperty(k,v);layer.appendChild(e);setTimeout(()=>e.remove(),life);return e;}
function effectKind(card,cast,outcome){
 const text=(outcome?.changes||[]).join(' · ');
 if(/进入战场/.test(text))return 'summon';
 if(/装备更新/.test(text))return 'equip';
 if(/回复 \+/.test(text))return 'healing';
 if(/伤害 −/.test(text))return /frost|ice|freezing/.test(card.key)?'frost':'strike';
 if(/返回泉水|转移至/.test(text))return 'movement';
 if(/沉默|眩晕|缴械|转为|攻击-|护甲-/.test(text))return /frost|ice|freezing/.test(card.key)?'frost':'binding';
 if(cast.type==='card'&&card.type==='Item'&&card.itemType!=='Consumable')return 'equip';
 if(card.type==='Creep'&&cast.type==='card')return 'summon';
 if(/治疗|回复.*生命/.test(card.text||''))return 'healing';
 return 'blessing';
}
root.ArtifactScene={
 effectKind,
 deal(card,index,elapsed=0){
  if(reduced())return;
  const animation=card.animate([{opacity:0,transform:'translate(180px,-160px) rotate(18deg) scale(.65)'},{opacity:1,transform:'translate(0,0) rotate(0) scale(1)'}],{duration:560,delay:index*110,fill:'backwards',easing:'cubic-bezier(.2,.7,.2,1)'});animation.currentTime=elapsed;
 },
 cast(layer,cast,c,escape){
  if(!layer)return;layer.querySelectorAll('.skill-reveal').forEach(e=>e.remove());const e=document.createElement('section');e.className='skill-reveal';e.style.setProperty('--spell-color',({Blue:'#8ddaff',Red:'#ffad63',Green:'#b7ed8c',Black:'#caadff'})[c.color]||'#ffe4a0');
  const targets=cast.targets||[],outcomes=cast.outcomes||[];
  e.innerHTML=`<img src="${c.art}" alt=""><div><small>${cast.owner?'夜魇':'天辉'} · ${cast.type==='ability'?'主动技能':'出牌'}${cast.source?' · '+escape(cast.source.name):''}</small><strong>${escape(cast.label||c.name)}</strong><p>${targets.length?'目标：'+targets.map(t=>escape((t.owner===undefined?'':t.owner?'夜魇 · ':'天辉 · ')+(t.kind==='unit'?['上路','中路','下路'][t.lane]+' · ':'')+t.name)).join('、'):'作用于'+['上路','中路','下路'][cast.lane]}</p><div class="skill-results">${outcomes.map(o=>`<span>${escape((o.owner?'夜魇 · ':'天辉 · ')+o.name)} <b>${escape(o.changes.join(' · '))}</b></span>`).join('')||`<span>${escape(c.text||c.description||'效果已结算，详见卡牌说明')}</span>`}</div></div>`;
  layer.appendChild(e);setTimeout(()=>e.remove(),cast.owner?6500:2500);
  const ids=new Set([...targets,...outcomes].map(t=>t.uid).filter(Boolean));
  for(const id of ids){const target=document.querySelector(`[data-unit="${id}"]`);if(!target||target.closest('[inert]'))continue;target.classList.add('spell-target');const kind=effectKind(c,cast,outcomes.find(o=>o.uid===id));target.style.setProperty('--spell-color',({healing:'#86efac',equip:'#ffcf70',summon:'#b7abff',blessing:'#f5da8b',binding:'#c9a3f7',movement:'#8edcdb',frost:'#99e7ff'})[kind]||e.style.getPropertyValue('--spell-color'));setTimeout(()=>target.classList.remove('spell-target'),2400);}
 },
 resolve(layer,cast,c){
  layer.querySelector('.skill-reveal')?.classList.add('resolved');
  const outcomes=cast.outcomes||[],targets=[...(cast.targets||[]),...outcomes];const seen=new Set();
  for(const o of targets){const key=o.uid||`${o.lane}:${o.owner}`;if(seen.has(key))continue;seen.add(key);
   const target=o.uid?(document.querySelector(`[data-unit="${o.uid}"]`)||document.querySelector(`.improvement[data-id="${o.uid}"]`)):o.kind==='tower'?document.querySelector(`.lane[data-lane="${o.lane}"] .tower-bar.${o.owner?'dire':'radiant'}`):null;if(!target||target.closest('[inert]'))continue;
   const outcome=outcomes.find(v=>v.uid===o.uid&&v.lane===o.lane),text=outcome?.changes.join(' · ')||'',r=landingRects.get(target)||target.getBoundingClientRect();
   const origin=cast.source?document.querySelector(`[data-unit="${cast.source.uid}"]`):layer.querySelector('.skill-reveal>img');
   const kind=effectKind(c,cast,outcome);
   if(kind==='strike')this.spell(layer,target,c.color,cast.owner,origin);
   else this.support(layer,target,kind);
   if(/伤害/.test(text)){this.burst(layer,r.left+r.width/2,r.top+r.height/2);if(!reduced())target.animate([{translate:'0 0'},{translate:'-5px 2px',filter:'brightness(1.8)'},{translate:'4px -1px'},{translate:'0 0'}],{duration:320});}
   if(!reduced()&&['strike','frost','binding'].includes(kind)){const seal=fragment(layer,'skill-seal '+kind,r.left+r.width/2,r.top+r.height/2,{},1100);seal.style.width=r.width+26+'px';seal.style.height=r.height+18+'px';for(let i=0;i<6;i++)fragment(layer,'skill-mote '+kind,r.left+r.width/2,r.top+r.height/2,{'--dx':Math.cos(i*Math.PI/3)*(r.width/2+20)+'px','--dy':Math.sin(i*Math.PI/3)*(r.height/2+15)+'px','--angle':i*60+'deg'},1100);}
   if(outcome){const label=document.createElement('span');label.className='skill-target-label';label.textContent=text;label.style.left=r.left+r.width/2+'px';label.style.top=r.top-18+'px';layer.appendChild(label);setTimeout(()=>label.remove(),1400);}
  }
 },
 support(layer,target,kind){
  if(reduced())return;
  const r=landingRects.get(target)||target.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  const aura=fragment(layer,'support-aura '+kind,x,y,{'--aura-w':r.width+20+'px','--aura-h':r.height+18+'px'},1400);
  aura.dataset.effect=kind;
  if(kind==='equip'){
   const badge=fragment(layer,'equipment-lock',x,y,{},1100);badge.textContent='◇';
   const image=target.querySelector('.equipment-dots .equipped');if(image)image.animate([{filter:'brightness(2.5)',scale:1.5},{filter:'brightness(1)',scale:1}],{duration:650});
  }
  if(kind==='frost'||kind==='binding')return;
  for(let i=0;i<7;i++){
   const mote=fragment(layer,'support-mote '+kind,x+(i-3)*r.width/7,r.bottom-8,{'--drift':(i%2?1:-1)*(12+i*3)+'px','--rise':(-r.height-20-i*5)+'px','--delay':i*55+'ms'},1700);
   if(kind==='healing')mote.textContent='+';
  }
 },
 burst(layer,x,y,type='hit'){
  if(!layer||reduced())return;
  fragment(layer,'impact-ring',x,y);fragment(layer,'impact-slash',x,y);
  for(let i=0;i<14;i++){const a=i*Math.PI*2/14,dist=30+(i%4)*18;fragment(layer,'impact-spark',x,y,{'--dx':Math.cos(a)*dist+'px','--dy':Math.sin(a)*dist+'px','--angle':a+'rad'});}
 },
 summon(unit,owner){
  if(reduced())return;landingRects.set(unit,unit.getBoundingClientRect());setTimeout(()=>landingRects.delete(unit),700);
  unit.animate([{transform:`perspective(600px) translateY(${owner?-95:95}px) rotateX(${owner?22:-22}deg) scale(1.18)`,opacity:0,filter:'drop-shadow(0 0 18px #7ee3d3)'},{transform:'translateY(0) scale(1)',opacity:1}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});
 },
 spell(layer,target,color,owner,source){
  if(reduced())return;const r=landingRects.get(target)||target.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,origin=source&&!source.closest('[inert]')?source.getBoundingClientRect():null,sx=origin?origin.left+origin.width/2:innerWidth/2,sy=origin?origin.top+origin.height/2:owner?45:innerHeight-50;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('spell-trail');svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
  const path=document.createElementNS(svg.namespaceURI,'path');let d=`M ${sx} ${sy}`;
  for(let i=1;i<=9;i++){const t=i/9;d+=` L ${sx+(x-sx)*t+(i===9?0:Math.sin(i*2.5)*20)} ${sy+(y-sy)*t}`;}
  path.setAttribute('d',d);path.setAttribute('stroke',({Blue:'#8ddaff',Red:'#ffad63',Green:'#b7ed8c',Black:'#caadff'})[color]||'#ffe4a0');path.setAttribute('fill','none');path.setAttribute('stroke-width','3');svg.appendChild(path);layer.appendChild(svg);setTimeout(()=>svg.remove(),600);
 },
 purchase(layer,target,from){
  if(!layer||reduced())return;const to=target.getBoundingClientRect(),ghost=target.cloneNode(true);ghost.inert=true;ghost.removeAttribute('data-hand');Object.assign(ghost.style,{position:'fixed',left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px',zIndex:'22',pointerEvents:'none'});layer.appendChild(ghost);
  const a=ghost.animate([{transform:'translate(0,0) scale(1)',opacity:1,filter:'brightness(1.6) drop-shadow(0 0 12px #f6d67b)'},{transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(${to.width/from.width},${to.height/from.height})`,opacity:0}],{duration:650,easing:'cubic-bezier(.3,.1,.35,1)',fill:'forwards'});a.onfinish=()=>ghost.remove();
  for(let i=0;i<8;i++)fragment(layer,'purchase-coin',from.left+from.width/2,from.top+from.height/2,{'--dx':(i-3.5)*18+'px','--dy':(-35-(i%3)*20)+'px','--angle':i*40+'deg'});
 }
};
})(window);
