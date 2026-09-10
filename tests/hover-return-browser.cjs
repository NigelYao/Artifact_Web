// Run against the isolated fixture origin, never a user's saved-match origin.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const config of [{name:'desktop',width:1440,height:900,touch:false},{name:'hybrid',width:1280,height:800,touch:true},{name:'phone',width:844,height:390,touch:true}]){
   const context=await browser.newContext({viewport:{width:config.width,height:config.height},hasTouch:config.touch});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8788/tests/touch-browser.html');
   await page.waitForTimeout(500);
   const hand=page.locator('.hand-cards [data-hand]').first();
   await hand.hover({position:{x:25,y:35}});await page.waitForTimeout(850);
   assert(await page.locator('#card-tooltip.visible').isVisible(),config.name+' hand tooltip');
   assert(await page.locator('.hand-wrap').first().evaluate(e=>getComputedStyle(e).transform!=='none'),config.name+' hand lift');
   const r=await page.locator('#card-tooltip').boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=config.width&&r.y+r.height<=config.height,config.name+' tooltip within viewport');
   await page.locator('.ally-unit .game-card').first().hover();await page.waitForTimeout(400);
   assert(await page.locator('#card-tooltip .tooltip-stats').isVisible(),config.name+' unit stats');
   if(config.touch){
    for(const id of ['touch-tap','touch-hold','touch-scroll','touch-drag-cancel']){
     await page.locator('#'+id).click();await page.waitForTimeout(500);
     assert.equal(await page.locator('#fixture-result').getAttribute('data-result'),'pass',config.name+' '+id);
    }
    // A real mouse move must restore hover without requiring a mouse click.
    await page.mouse.move(1,150);await hand.hover({position:{x:25,y:35}});await page.waitForTimeout(500);
    assert(await page.locator('#card-tooltip.visible').isVisible(),config.name+' mouse after touch');
   }
   await page.screenshot({path:'research/hover-'+config.name+'.png'});
   await page.evaluate(()=>{
    const g=ArtifactApp.game;g.s.phase='deploy';g.s.round=3;
    const u=g.s.units.find(u=>u.owner===0&&u.k==='axe');u.alive=false;u.lane=-1;u.readyRound=3;u.items.Weapon={k:'short_sword'};
    ArtifactApp.assignDeployment(u.uid,0);
   });
   const hero=page.locator('.deployment-hero[data-card="axe"]');
   assert(await hero.count(),config.name+' returning hero');
   assert.equal(await hero.locator('.deployment-equipment>span').count(),3);
   assert.equal(await hero.locator('.deployment-equipment .equipped img').getAttribute('alt'),'短剑');
   assert(await hero.evaluate(e=>getComputedStyle(e).borderTopWidth==='5px'||getComputedStyle(e).borderTopWidth==='4px'));
   assert.equal(await hero.evaluate(e=>getComputedStyle(e).borderTopColor),'rgb(174, 85, 70)',config.name+' selected hero retains red color');
   const id=await hero.getAttribute('data-deploy-hero');
   await page.evaluate(id=>ArtifactApp.assignDeployment(Number(id),0),id);
   assert.equal(await page.locator('.deploy-preview[data-card="axe"] .deployment-equipment>span').count(),3);
   await page.screenshot({path:'research/return-'+config.name+'.png'});
   assert.deepEqual(errors,[]);console.log('PASS '+config.name+' hover, input switching, return hero color/equipment');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
