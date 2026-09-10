// Local browser fixture; two disposable players controlled from a local signal file.
const fs=require('node:fs'),path=require('node:path'),{Client}=require('colyseus.js');
require('../dist/decks.js');
const base='http://127.0.0.1:8790',signal=path.join(__dirname,'spectator-signal.json');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function post(p,b){const r=await fetch(base+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});if(!r.ok)throw Error(await r.text());return r.json();}
(async()=>{const ids=await Promise.all([post('/api/online/session',{}),post('/api/online/session',{})]);const {code}=await post('/api/online/rooms',{token:ids[0].token});const peers=[];for(const id of ids){const room=await new Client(base).joinOrCreate('battle',{code,token:id.token});const peer={room,s:null};room.onMessage('snapshot',s=>peer.s=s);room.onMessage('error',e=>console.error(e));peers.push(peer);}
async function action(p,action,args={}){while(!p.s)await pause(50);const rev=p.s.revision;p.room.send('command',{id:require('node:crypto').randomUUID(),revision:rev,action,args});while(peers.some(p=>!p.s||p.s.revision<=rev))await pause(50);}
fs.writeFileSync(signal,JSON.stringify({code,action:'wait'}));console.log('WATCH_ROOM '+code);
let prior='wait';for(let n=0;n<600;n++){await pause(500);const cmd=JSON.parse(fs.readFileSync(signal)).action;if(cmd===prior)continue;prior=cmd;if(cmd==='ready'){await action(peers[0],'ready',{deck:{...ARTIFACT_DECKS[0],name:'观战验证天辉'}});await action(peers[1],'ready',{deck:{...ARTIFACT_DECKS[1],name:'观战验证夜魇'}});}if(cmd.startsWith('pass'))await action(peers[peers[0].s.state.turn],'pass');if(cmd==='finish')await action(peers[1],'concede');if(cmd==='stop')break;console.log(cmd+' revision '+peers[0].s.revision);}for(const p of peers)await p.room.leave();
})().catch(e=>{console.error(e);process.exitCode=1;});
