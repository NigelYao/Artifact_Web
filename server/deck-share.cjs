'use strict';
const {Game}=require('../dist/engine.js');
const cards=require('../dist/cards.json');
const game=new Game(cards),keys=new Set(cards.map(card=>card.key));
function validateSharedDeck(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('构筑格式不正确');
 for(const [field,max] of [['heroes',5],['main',200],['items',100]]){
  if(!Array.isArray(input[field])||input[field].length>max||input[field].some(key=>typeof key!=='string'||!keys.has(key)))throw Error('构筑包含无效卡牌或格式不正确');
 }
 const errors=game.validateDeck(input);if(errors.length)throw Error(errors.join('；'));
 const name=(typeof input.name==='string'?input.name:'').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,80)||'分享构筑';
 return {name,heroes:[...input.heroes],main:[...input.main],items:[...input.items]};
}
function mountDeckShare(app,{store}){
 app.post('/api/decks/share',(req,res)=>{
  let deck;try{deck=validateSharedDeck(req.body?.deck);}catch(error){return res.status(400).json({error:error.message});}
  const code=store.shareDeck(deck);res.set('Cache-Control','no-store').status(201).json({code,deck});
 });
 app.get('/api/decks/share/:code',(req,res)=>{
  const code=req.params.code.trim().toUpperCase();
  if(!/^AFD-[A-HJ-NP-Z2-9]{8}$/.test(code))return res.status(404).json({error:'分享码无效或不存在，请检查完整分享码'});
  const deck=store.sharedDeck(code);if(!deck)return res.status(404).json({error:'分享码不存在，请确认来自当前服务器'});
  res.set('Cache-Control','no-store').json({code,deck});
 });
}
module.exports={mountDeckShare,validateSharedDeck};
