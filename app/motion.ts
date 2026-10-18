const jobs = new Set<(time:number)=>void>();
let frameId = 0;
export function frame(job:(time:number)=>void) {jobs.add(job);if(!frameId)frameId=requestAnimationFrame(run);}
function run(time:number) {frameId=0;const current=[...jobs];jobs.clear();for(const job of current)job(time);if(jobs.size&&!frameId)frameId=requestAnimationFrame(run);}
export function cancelFrame(job:(time:number)=>void){jobs.delete(job);}
export const clamp=(n:number,a=0,b=1)=>Math.min(b,Math.max(a,n));
export const wrap=(n:number,count:number)=>((n%count)+count)%count;
export const nearest=(n:number,count:number)=>wrap(n+count/2,count)-count/2;
