'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const cards=require('../dist/cards.json'),{Game}=require('../dist/engine.js');require('../dist/effects.js');require('../dist/decks.js');
const game=new Game(cards);game.newGame(ARTIFACT_DECKS[0],ARTIFACT_DECKS[1],43);game.s.turn=0;game.s.lanes[0].mana[0]=50;
const source=fs.readFileSync('dist/app.js','utf8'),ctx={game,ui:{route:'battle',busy:false,intro:false},online:null,C:Object.fromEntries(cards.map(c=>[c.key,c])),render(){},toast(){},commit(){ctx.ui.selection=null;},sound:{play(){}},document:{elementFromPoint:()=>ctx.hit}};
vm.createContext(ctx);for(const [a,b] of [['function validUnit(','function heroSkills('],['function selectTarget(','// Touch drag'],['function beginHandDrag(','function addDeck(']])vm.runInContext(source.slice(source.indexOf(a),source.indexOf(b)),ctx);
function hit(selector,data){ctx.hit={dataset:data,closest(s){if(s.includes('[inert]'))return null;return s===selector?this:null;}};}
function card(k){game.s.turn=0;const h={k,uid:game.id(),lock:0};game.s.players[0].hand=[h];ctx.ui.selection=null;return h.uid;}
let id=card('short_sword');const before=JSON.stringify(game.s);assert(ctx.beginHandDrag(id));assert.equal(JSON.stringify(game.s),before);
const foe=game.all(1,0).find(u=>u.hero);hit('[data-unit]',{unit:foe.uid});assert.equal(ctx.dropHandAt(1,1),false);assert.equal(JSON.stringify(game.s),before);
assert(ctx.beginHandDrag(id));const ally=game.all(0,0).find(u=>u.hero),attack=game.stats(ally).attack;hit('[data-unit]',{unit:ally.uid});assert(ctx.dropHandAt(1,1));assert.equal(game.s.players[0].hand.length,0);assert.equal(game.stats(ally).attack,attack+2);
id=card('bronze_legionnaire');assert(ctx.beginHandDrag(id));const saved=JSON.stringify(game.s);hit('[data-slot]',{owner:'0',lane:'1',slot:'30'});assert.equal(ctx.dropHandAt(1,1),false);assert.equal(JSON.stringify(game.s),saved);
assert(ctx.beginHandDrag(id));hit('[data-slot]',{owner:'0',lane:'0',slot:String(ally.pos)});assert.equal(ctx.dropHandAt(1,1),false);assert.equal(JSON.stringify(game.s),saved);
assert(ctx.beginHandDrag(id));hit('[data-slot]',{owner:'0',lane:'0',slot:String(game.placementPositions(0,0)[0])});assert(ctx.dropHandAt(1,1));assert(game.all(0,0).some(u=>u.k==='bronze_legionnaire'));assert.equal(game.s.players[0].hand.length,0);
id=card('clear_the_deck');assert(ctx.beginHandDrag(id));const noTarget=JSON.stringify(game.s);hit('.lane',{lane:'2'});assert.equal(ctx.dropHandAt(1,1),false);assert.equal(JSON.stringify(game.s),noTarget);assert(ctx.beginHandDrag(id));hit('.lane',{lane:'0'});assert(ctx.dropHandAt(1,1));assert.equal(game.s.players[0].hand.length,0);
ctx.online={isSpectator:()=>true};assert.equal(ctx.beginHandDrag(id),false);
console.log('PASS dragging spends nothing until legal release; equipment ownership, occupied slots, cross-lane rejection, summon placement and spectator guard');
