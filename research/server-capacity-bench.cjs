'use strict';
// Same released server, loopback only, separate generated SQLite database per stage.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process'),{createRequire}=require('node:module');
const release=fs.realpathSync(process.env.PERF_RELEASE||'/opt/artifact-threefold/current'),req=createRequire(path.join(release,'package.json'));
const {Client}=req('colyseus.js'),{Store}=req('./server/store.cjs'),{Game}=req('./dist/engine.js');req('./dist/effects.js');
const cards=req('./dist/cards.json'),seed=JSON.parse(fs.readFileSync(path.join(__dirname,'perf-midgame-state.json'),'utf8'));
const base='http://127.0.0.1:8799',work=fs.mkdtempSync('/tmp/artifact-perf-'),report={release,started:new Date().toISOString(),seed:{round:seed.round,units:seed.units.length,log:seed.log.length},intervalMs:5000,notes:['same-host load generator; loopback excludes public bandwidth/latency','all rooms seeded at legal midgame; matchmaking battle tickets retained; 25s presence heartbeats','test service and generator lower scheduling priority; combined cgroup CPU quota 140%, memory limit 2GB'],stages:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms)),percentile=(a,p)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))]:0;
let child,peers=[],abortReason=null;
async function stop(){for(const p of peers)try{p.room.connection?.close();}catch{}peers=[];if(child&&child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await Promise.race([done,pause(2500)]);if(child.exitCode===null){child.kill('SIGKILL');await done;}}child=null;}
process.on('SIGTERM',()=>{abortReason='terminated';stop().finally(()=>process.exit(2));});
async function until(fn,timeout=15000){const start=Date.now();while(Date.now()-start<timeout){if(abortReason)throw Error(abortReason);if(fn())return;await pause(15);}throw Error('timeout');}
async function post(route,data){const r=await fetch(base+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('HTTP '+r.status);return r.status===204?null:r.json();}
async function stage(count){
 const directory=path.join(work,'rooms-'+count);fs.mkdirSync(directory);const db=path.join(directory,'load.sqlite'),metricsFile=path.join(directory,'metrics.jsonl');
 const store=new Store(db),fixtures=[],tickets={players:{},matches:{}};
 for(let i=0;i<count;i++){const tokens=[store.identity(),store.identity()],r=store.create(tokens[0]);r.seats=tokens.map((token,p)=>({token,ready:true,deck:seed.deckSpecs[p]}));r.state=JSON.parse(JSON.stringify(seed));r.state.seed+=i;r.state.events=[];r.status='battle';store.save(r);for(const token of tokens)tickets.players[token]={status:'battle',code:r.code};fixtures.push({code:r.code,tokens});}store.saveMatchmaking(tickets);store.close();
 child=spawn(process.execPath,['--max-old-space-size=768','--require',path.join(__dirname,'perf-monitor.cjs'),path.join(release,'server/index.cjs')],{cwd:release,env:{...process.env,HOST:'127.0.0.1',PORT:'8799',ARTIFACT_DB:db,ARTIFACT_ADMIN_TOKEN_FILE:path.join(directory,'admin-token'),PERF_METRICS:metricsFile},stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',v=>log+=v);child.stderr.on('data',v=>log+=v);
 for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await pause(100);if(i===99)throw Error('server start failed '+log.slice(-1000));}
 const rooms=[],rtts=[],bytes={total:0,messages:0},actions={},errors=[],health=[],hostCpu=[];let measuring=false,commands=0,cpuStart=process.cpuUsage();
 for(const f of fixtures){const pair=[];for(const token of f.tokens){const room=await new Client(base).joinOrCreate('battle',{code:f.code,token});const p={room,s:null,error:null};peers.push(p);pair.push(p);room.onMessage('snapshot',s=>{p.s=s;p.after?.();});room.onMessage('error',e=>{p.error=e;p.after?.();});room.connection.transport.ws.addEventListener('message',e=>{if(measuring){bytes.total+=e.data.byteLength||e.data.length||0;bytes.messages++;}});await until(()=>p.s);}rooms.push({pair,g:new Game(cards),next:0,busy:false,shop:new Set(),tokens:f.tokens});}
 await pause(1500);cpuStart=process.cpuUsage();const started=Date.now();for(let i=0;i<rooms.length;i++)rooms[i].next=started+i*5000/count;measuring=true;
 let lastCpu=fs.readFileSync('/proc/stat','utf8').split('\n')[0].trim().split(/\s+/).slice(1).map(Number),healthFailures=0,nextHealth=0,nextPresence=started+25000;const duration=35000;
 while(Date.now()-started<duration&&!abortReason){const now=Date.now();
  if(now>=nextHealth){nextHealth=now+1000;const t=performance.now();try{const r=await fetch('http://127.0.0.1/health',{signal:AbortSignal.timeout(1000)});const ms=performance.now()-t;health.push(ms);healthFailures=!r.ok||ms>100?healthFailures+1:0;}catch{healthFailures++;}if(healthFailures>=3){abortReason='production health guard';break;}
   const cur=fs.readFileSync('/proc/stat','utf8').split('\n')[0].trim().split(/\s+/).slice(1).map(Number),delta=cur.map((v,i)=>v-lastCpu[i]);lastCpu=cur;hostCpu.push(100*(1-(delta[3]+delta[4])/delta.reduce((a,b)=>a+b,0)));const mem=Number(fs.readFileSync('/proc/meminfo','utf8').match(/MemAvailable:\s+(\d+)/)[1]);if(mem<2*1024*1024){abortReason='memory guard';break;}
  }
  if(now>=nextPresence){nextPresence=now+25000;for(const r of rooms)for(const token of r.tokens)post('/api/online/presence',{token,page:'online-battle'}).catch(e=>errors.push(e.message));}
  for(const r of rooms){if(r.busy||now<r.next||r.pair[0].s.status==='finished')continue;r.next+=5000;r.busy=true;
   (async()=>{try{const s=r.pair[0].s.state;let p=s.turn,action,args={};
    if(s.phase==='action'){const peer=r.pair[p];r.g.s=peer.s.state;const h=peer.s.state.players[p].hand.find(h=>!r.g.canPlay(p,h));const target=h?r.g.candidateTargets(h.k,p)[0]:null;if(h&&target){action='play';args={handId:h.uid,targets:target};}else action='pass';}
    else if(s.phase==='shop'){p=r.pair[0].s.shopReady[0]?1:0;action='shopReady';}
    else if(s.phase==='deploy'){p=r.pair[0].s.deployReady[0]?1:0;action='deployReady';args={assignments:s.units.filter(u=>u.owner===p&&u.hero&&!u.copy&&!u.alive&&u.readyRound<=s.round).map(u=>({uid:u.uid,lane:u.uid%3}))};}
    else return;
    const peer=r.pair[p],revision=peer.s.revision,id=require('node:crypto').randomUUID();peer.error=null;const begin=performance.now();await new Promise((resolve,reject)=>{let timer;const done=error=>{clearTimeout(timer);for(const q of r.pair)q.after=null;error?reject(error):resolve();};const check=()=>{if(peer.error)done(Error(peer.error.message));else if(r.pair.every(q=>q.s.revision>revision))done();};for(const q of r.pair)q.after=check;timer=setTimeout(()=>done(Error('command timeout')),5000);peer.room.send('command',{id,revision,action,args});});rtts.push(performance.now()-begin);commands++;actions[action]=(actions[action]||0)+1;
   }catch(e){errors.push(e.message);}finally{r.busy=false;}})();
  }await pause(10);
 }
 await until(()=>rooms.every(r=>!r.busy),7000).catch(e=>errors.push(e.message));measuring=false;const seconds=(Date.now()-started)/1000;
 const metrics=fs.readFileSync(metricsFile,'utf8').trim().split('\n').map(JSON.parse).filter(m=>m.at>=started),cpu=process.cpuUsage(cpuStart);
 const result={rooms:count,players:count*2,seconds,completedCommands:commands,actions,errors:errors.slice(0,10),errorCount:errors.length,finishedRooms:rooms.filter(r=>r.pair[0].s.status==='finished').length,commandRate:commands/seconds,rttMs:{median:percentile(rtts,.5),p95:percentile(rtts,.95),max:Math.max(0,...rtts)},outboundMbps:bytes.total*8/seconds/1e6,bytesPerRoomPerSec:bytes.total/seconds/count,snapshotMessages:bytes.messages,server:{cpuMean:metrics.reduce((s,m)=>s+m.cpuPercent,0)/metrics.length,cpuP95:percentile(metrics.map(m=>m.cpuPercent),.95),rssMaxMB:Math.max(...metrics.map(m=>m.rss))/1048576,loopP95ms:percentile(metrics.map(m=>m.loopP95ms),.95),loopMaxMs:Math.max(...metrics.map(m=>m.loopMaxms))},hostCpuP95:percentile(hostCpu,.95),productionHealthP95ms:percentile(health,.95),driverCpuPercent:(cpu.user+cpu.system)/(seconds*10000),stopReason:abortReason};
 report.stages.push(result);fs.writeFileSync('/tmp/artifact-capacity-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(result));await stop();
 if(result.rttMs.p95>250||result.errorCount||result.server.cpuMean>75)abortReason=abortReason||'headroom threshold';
 // Only remove generated benchmark directories, never a production path.
 if(directory.startsWith(work+'/rooms-'))fs.rmSync(directory,{recursive:true,force:true});
}
(async()=>{try{console.log('PERF_START '+work);for(const count of [10,30,60,100]){await stage(count);if(abortReason)break;await pause(2000);}}catch(e){report.failure=e.stack;console.error(e.stack);}finally{await stop();report.finished=new Date().toISOString();report.stopReason=abortReason;fs.writeFileSync('/tmp/artifact-capacity-report.json',JSON.stringify(report,null,2));console.log('PERF_DONE');}})();
