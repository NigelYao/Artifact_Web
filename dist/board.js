/* Camera geometry and reversible deployment planning, independent of the DOM. */
(function(root){'use strict';
function layout(width,height,focus,deploy=false,reserved=0,fronts=3){
 // Recover the empty upper band while keeping the artwork and pass socket in
 // the same coordinate system. Short landscape leaves a dedicated hand shelf.
 const narrow=width<=550,short=height<=540,top=short?28:narrow?72:Math.max(42,height*.16-80),baseBottom=deploy?(short?136:narrow?214:202):(short?77:narrow?170:108);
 const bottom=Math.max(baseBottom,reserved),available=Math.max(80,height-top-bottom),gap=4,ratio=focus!==null&&!narrow?1510/867:670/510;
 const count=focus===null?fronts:1,maxWidth=width*(narrow?.98:.96),laneWidth=Math.min((maxWidth-gap*(count-1))/count,available*ratio);
 const w=laneWidth*count+gap*(count-1),h=laneWidth/ratio,x=(width-w)/2,y=top+(available-h)*.38;
 const original=focus!==null&&!narrow;
 return {x,y,width:w,height:h,laneWidth,ratio,portalX:x+w*(original?1260/1510:550/670),portalY:y+h*(original?792/867:425/510),portalSize:Math.max(38,w*(original?106/1510:48/670)),unitHeight:h*(original?.224:.215)};
}
class DeploymentPlan{
 constructor(game){this.game=game;this.assignments={};for(const u of game.ready(0)){const l=game.s.deploymentPlan?.[u.uid];if(Number.isInteger(l)&&l>=0&&l<3)this.assignments[u.uid]=l;}}
 get ready(){return this.game.ready(0);}
 get complete(){return this.ready.every(u=>Number.isInteger(this.assignments[u.uid]));}
 lane(id){return this.assignments[id];}
 assign(id,lane){if(this.game.s.phase!=='deploy'||!this.ready.some(u=>u.uid===Number(id)))throw Error('该英雄不在待部署列表中');if(lane!==null&&(!Number.isInteger(lane)||lane<0||lane>2))throw Error('请选择有效战线');if(lane===null)delete this.assignments[id];else this.assignments[id]=lane;this.game.s.deploymentPlan={...this.assignments};}
 reset(){this.assignments={};this.game.s.deploymentPlan={};}
 confirm(){if(this.game.s.phase!=='deploy'||!this.complete)throw Error('请先安排所有待回归英雄');const saved=JSON.parse(JSON.stringify(this.game.s));try{this.game.s.events=[];this.game.aiDeploy(1);for(const u of this.ready)this.game.deploy(u.uid,this.assignments[u.uid]);this.game.finishDeployment();delete this.game.s.deploymentPlan;}catch(e){this.game.s=saved;throw e;}}
}
const api={layout,DeploymentPlan};root.ArtifactBoard=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
