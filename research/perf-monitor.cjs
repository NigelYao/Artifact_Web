// Instrument only the isolated benchmark child, never the running production process.
const fs=require('node:fs'),{monitorEventLoopDelay}=require('node:perf_hooks');
const lag=monitorEventLoopDelay({resolution:10});lag.enable();let cpu=process.cpuUsage(),at=Date.now();
setInterval(()=>{const now=Date.now(),next=process.cpuUsage();fs.appendFileSync(process.env.PERF_METRICS,JSON.stringify({at:now,cpuPercent:(next.user-cpu.user+next.system-cpu.system)/((now-at)*10),rss:process.memoryUsage().rss,heap:process.memoryUsage().heapUsed,loopP95ms:lag.percentile(95)/1e6,loopMaxms:lag.max/1e6})+'\n');cpu=next;at=now;lag.reset();},1000).unref();
