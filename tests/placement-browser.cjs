const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 for(const mode of ['gap','left','right','native']){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8788/tests/touch-browser.html');await page.waitForTimeout(400);
  await page.evaluate(mode=>{const g=ArtifactApp.game;g.s.units=[];for(const p of g.s.players)p.heroes=['axe'];g.s.turn=0;g.s.lanes[0].mana[0]=50;
   for(const p of [0,1]){g.spawn('axe',p,0,0);g.spawn('melee_creep',p,0,1);}
   if(mode==='gap'){const u=g.at(0,0,1);g.condemn(u);g.sweep();}
   const h={k:'bronze_legionnaire',uid:g.id(),lock:0};g.s.players[0].hand=[h];ArtifactApp.beginHandDrag(h.uid);
   if(mode==='native')ArtifactApp.cancelHandDrag();
  },mode);
  if(mode==='native'){
   const hand=page.locator('[data-hand]').first();await hand.hover({position:{x:20,y:35}});await page.mouse.down();await page.mouse.move(500,650,{steps:8});await page.waitForTimeout(250);
  }
  const legal=await page.locator('.lane[data-lane="0"] .slot.targetable').evaluateAll(els=>els.map(e=>Number(e.dataset.slot)));
  assert.deepEqual(legal,mode==='gap'?[1]:[-1,2],mode+' only legal slots highlighted');
  const pos=mode==='gap'?1:mode==='right'?2:-1,target=page.locator(`.lane[data-lane="0"] .slot.targetable[data-slot="${pos}"]`);
  if(mode==='native'){const r=await target.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2,{steps:8});await page.mouse.up();}
  else await target.click();
  await page.waitForTimeout(180);
  assert(await page.evaluate(()=>ArtifactApp.game.all(0,0).some(u=>u.k==='bronze_legionnaire')),mode+' placement succeeds');
  assert.deepEqual(errors,[]);console.log('PASS '+mode+' placement: DOM targets and real pointer/click');await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
