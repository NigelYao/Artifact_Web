const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8788/tests/icon-tooltips-browser.html');await page.waitForTimeout(600);
  const saved=await page.evaluate(()=>JSON.stringify(ArtifactApp.game.s));
  const luna=page.locator('.unit-wrapper').filter({has:page.locator('.game-card[data-card="luna"]')});
  const meepo=page.locator('.unit-wrapper').filter({has:page.locator('.game-card[data-card="meepo"]')});
  const sniper=page.locator('.unit-wrapper').filter({has:page.locator('.game-card[data-card="sniper"]')});
  async function preview(locator,text){
   await locator.hover();await page.waitForTimeout(450);
   assert(await page.locator('#card-tooltip.visible').isVisible(),text);
   assert((await page.locator('#card-tooltip').innerText()).includes(text),text);
   assert.equal(await locator.getAttribute('title'),null,'no competing native title');
  }
  await preview(luna.locator('[data-hero-skill]'),'月光');
  await page.screenshot({path:'research/tooltip-passive.png'});
  await preview(meepo.locator('[data-hero-skill="0"]'),'忽悠');
  await preview(meepo.locator('[data-hero-skill="1"]'),'合则倒');
  await preview(sniper.locator('[data-hero-skill]'),'剩余 2 回合');
  await preview(sniper.locator('[data-equipment-slot="Weapon"]'),'闪烁匕首');
  assert.equal(await page.locator('#card-tooltip .deployment-equipment').count(),0,'item does not inherit hero stats/equipment');
  await page.screenshot({path:'research/tooltip-equipment.png'});
  await preview(sniper.locator('[data-equipment-slot="Armor"]'),'护甲栏 · 未装备');
  await preview(sniper.locator('[data-equipment-abilities]'),'闪烁匕首');
  assert.equal(await page.evaluate(()=>JSON.stringify(ArtifactApp.game.s)),saved,'hover never changes game state');
  await page.mouse.move(2,160);await page.waitForTimeout(300);
  assert.equal(await page.locator('#card-tooltip.visible').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS passive, dual skills, cooldown, equipment, empty slots, gear shortcut, hover exit and no gameplay mutations');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
