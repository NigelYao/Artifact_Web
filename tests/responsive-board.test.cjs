const assert=require('node:assert/strict');
const {layout}=require('../dist/board.js');
// Desktop gains the formerly empty top band without moving the hand shelf.
const desktop=layout(1280,800,0);
assert(desktop.y<=50);
assert(desktop.height>=640);
assert(desktop.y+desktop.height<=800-108);
console.log('PASS desktop board recovers approximately 80px above the hand shelf');
for(const [width,height] of [[667,375],[844,390],[932,430],[1024,512],[1366,540]]){
 const focus=layout(width,height,0);
 assert(focus.y<50);
 assert(focus.height>=height-140);
 assert(focus.y+focus.height<=height-77+.01);
 assert(Math.abs(focus.width/focus.height-1510/867)<1e-8);
 assert(Math.abs((focus.portalY-focus.y)/focus.height-792/867)<1e-8);
}
console.log('PASS phone landscape enlarges artwork and leaves hand space with aligned pass socket');
for(const [width,height] of [[768,1024],[1024,768],[1180,820],[1366,1024]]){
 for(const lanes of [1,2,3])for(const focus of [null,0]){
  const b=layout(width,height,focus,false,0,lanes);
  assert(b.x>=0&&b.y>=0&&b.x+b.width<=width+.01&&b.y+b.height<=height-108+.01);
  assert(Math.abs(b.laneWidth/b.height-b.ratio)<1e-8);
 }
}
console.log('PASS tablet portrait and landscape preserve all campaign lane counts');
for(const [width,height,reserved] of [[844,390,165],[1024,768,230],[1920,1080,260]]){
 const b=layout(width,height,null,true,reserved);
 assert(b.y+b.height<=height-reserved+.01);
}
console.log('PASS deployment keeps the measured return-hero tray unobstructed');
