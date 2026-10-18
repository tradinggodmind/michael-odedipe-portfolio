// Five independent scene geometries reconstructed from the supplied 0–4.MOV
// frames. Coordinates belong to the finished 640 × 419 reference stage.
export type Mode = "orbit" | "float" | "reel" | "warp" | "stream";
export type Point = {x:number;y:number};
type Box = {x:number;y:number;w:number;h:number;rot?:number};
type Shape =
 | {kind:"flat";box:Box}
 | {kind:"bow";box:Box;bow:number}
 | {kind:"reel";left:number;right:number}
 | {kind:"flare";neck:number;outer:number;strength:number}
 | {kind:"turn";box:Box;skew:number}
 | {kind:"stream";box:Box;effect:number};
export type Panel = {i:number;z:number;points:Point[];shape:Shape};
const W=640,H=419,CY=203,TAU=Math.PI*2;
export const mod=(a:number,n:number)=>(a%n+n)%n;
export const nearest=(a:number,n:number)=>mod(a+n/2,n)-n/2;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=(t:number)=>{t=clamp(t);return t*t*(3-2*t);};
function corners(b:Box,skew=0):Point[]{const c=Math.cos(b.rot||0),s=Math.sin(b.rot||0),w=b.w/2,h=b.h/2;return [[-w,-h],[w,-h],[w,h],[-w,h]].map(([x,y],j)=>({x:b.x+x*c-y*s,y:b.y+x*s+y*c+(j<2?skew:-skew)*(j===0||j===3?-1:1)}));}
function flat(i:number,z:number,box:Box,kind:"flat"|"bow"|"turn"|"stream"="flat",extra=0):Panel{
 const shape:Shape=kind==="bow"?{kind,box,bow:extra}:kind==="turn"?{kind,box,skew:extra}:kind==="stream"?{kind,box,effect:extra}:{kind,box};
 return{i,z,points:corners(box,kind==="turn"?extra:0),shape};
}
function reelHeight(x:number){return H*(.38+.37*Math.pow(Math.abs(2*x/W-1),2.6));}
function reelPanel(i:number,centre:number):Panel{const left=centre-132,right=centre+132,shape:Shape={kind:"reel",left,right};const points:Point[]=[];for(let j=0;j<=20;j++){const x=mix(left,right,j/20),h=reelHeight(x);points.push({x,y:H/2-h/2});}for(let j=20;j>=0;j--){const x=mix(left,right,j/20),h=reelHeight(x);points.push({x,y:H/2+h/2});}return{i,z:0,points,shape};}
function flareHeight(s:number,strength:number){return mix(138,419,.0+smooth((s-.12)/.88)*strength);}
function flarePanel(i:number,neck:number,outer:number,strength:number,z:number):Panel{
 const shape:Shape={kind:"flare",neck,outer,strength},points:Point[]=[];
 for(let j=0;j<=24;j++){const s=j/24,x=mix(neck,outer,s),h=flareHeight(s,strength);points.push({x,y:CY-h/2});}
 for(let j=24;j>=0;j--){const s=j/24,x=mix(neck,outer,s),h=flareHeight(s,strength);points.push({x,y:CY+h/2});}
 return{i,z,points,shape};
}
const FLUX:Record<number,[number,number,number,number,number,number]>={
 [-5]:[-110,360,78,106,-.13,-5],[-4]:[72,462,105,116,.20,-3],[-3]:[103,82,78,102,-.22,-2],[-2]:[229,48,94,112,.13,1],[-1]:[178,216,94,124,-.08,3],
 0:[330,213,154,150,-.10,8],1:[484,271,112,131,.20,4],2:[511,43,108,119,-.16,2],3:[607,175,76,110,.25,-1],4:[599,445,120,130,-.12,-3],5:[760,60,80,100,.1,-5]
};
function fluxPose(d:number){const a=Math.floor(d),t=smooth(d-a),p=FLUX[Math.max(-5,Math.min(5,a))],q=FLUX[Math.max(-5,Math.min(5,a+1))];return p.map((v,j)=>mix(v,q[j],t)) as [number,number,number,number,number,number];}
function ring(phase:number,count:number):Panel[]{return Array.from({length:count},(_,i)=>{const a=TAU*(i+phase)/count-Math.PI/2,depth=(1+Math.cos(a))/2,k=.045+.955*Math.pow(depth,1.1),base=82+(i%4)*7;return flat(i,depth,{x:337+138*Math.cos(a),y:209+135*Math.sin(a),w:base*k,h:(base*.88+(i%3)*8)*k});});}
function floating(phase:number,count:number):Panel[]{return Array.from({length:count},(_,i)=>{const d=nearest(i-phase,count),[x,y,w,h,rot,z]=fluxPose(d),width=w*Math.max(.08,Math.cos(Math.min(1,Math.abs(d)/4)*Math.PI/2));return flat(i,z,{x,y,w:width,h,rot},"bow",(d<0?-1:1)*(10+Math.abs(d)*3));});}
function ribbon(phase:number,count:number):Panel[]{return Array.from({length:count},(_,i)=>reelPanel(i,320+nearest(i-phase,count)*264));}
function warp(phase:number,count:number):Panel[]{
 const i=Math.floor(phase),q=phase-i,old=mod(i-1,count),current=mod(i,count),next=mod(i+1,count),following=mod(i+2,count),out:Panel[]=[];
 // The four roles share one handoff progress. The outgoing poster becomes the
 // left flare while the incoming right flare turns into the centre poster.
 if(q<.52){const t=smooth(q/.52);if(t<.98)out.push(flarePanel(old,198-210*t,-8-210*t,1-t,-2));}
 if(q<.54){const t=smooth(q/.54);out.push(flat(current,5,{x:320-125*t,y:203,w:mix(165,2,t),h:209,rot:-.08*t},"turn",13*t));}
 else{const t=smooth((q-.54)/.46);out.push(flarePanel(current,197,197-205*t,t,2));}
 if(q<.48){const t=smooth(q/.48);out.push(flarePanel(next,443,443+205*(1-t),1-t,1));}
 else{const t=smooth((q-.48)/.52);out.push(flat(next,6,{x:440-120*t,y:203,w:mix(2,165,t),h:209,rot:.08*(1-t)},"turn",-13*(1-t)));}
 if(q>.48){const t=smooth((q-.48)/.52);out.push(flarePanel(following,650-207*t,650, t,0));}
 return out;
}
function diagonal(phase:number,count:number):Panel[]{return Array.from({length:count},(_,i)=>{const d=nearest(i-phase,count),e=clamp((Math.abs(d)-1.7)/2.6),w=111+56*e,y=216+61*d+12*Math.sin(d*1.9),x=334+94*d+6*Math.sin(d*2.3),rot=d<-.5?mix(-.08,-.38,clamp((-d-.5)/4)):mix(.03,.36,clamp((d+.5)/4));return flat(i,-Math.abs(d)+.001*i,{x,y,w,h:w*1.32,rot},"stream",e);});}
export function scenePanels(mode:Mode,phase:number,count:number):Panel[]{if(mode==="orbit")return ring(phase,count);if(mode==="float")return floating(phase,count);if(mode==="reel")return ribbon(phase,count);if(mode==="warp")return warp(phase,count);return diagonal(phase,count);}

function crop(img:HTMLImageElement,ratio:number){const iw=img.naturalWidth,ih=img.naturalHeight;let sw=iw,sh=iw/ratio;if(sh>ih){sh=ih;sw=ih*ratio;}return {sx:(iw-sw)/2,sy:(ih-sh)/2,sw,sh};}
function drawBox(ctx:CanvasRenderingContext2D,img:HTMLImageElement,b:Box){const {sx,sy,sw,sh}=crop(img,b.w/b.h);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot||0);ctx.drawImage(img,sx,sy,sw,sh,-b.w/2,-b.h/2,b.w,b.h);ctx.restore();}
function drawBow(ctx:CanvasRenderingContext2D,img:HTMLImageElement,b:Box,bow:number){
 const {sx,sy,sw,sh}=crop(img,b.w/b.h),steps=Math.max(96,Math.ceil(b.w));ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot||0);
 // A continuous silhouette hides the per-column stair steps that become
 // visible when the 640px scene is enlarged to fill a desktop viewport.
 ctx.beginPath();for(let j=0;j<=128;j++){const u=j/128,dy=bow*Math.sin(Math.PI*u),x=-b.w/2+b.w*u,y=-b.h/2-dy;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}
 for(let j=128;j>=0;j--){const u=j/128,dy=bow*Math.sin(Math.PI*u);ctx.lineTo(-b.w/2+b.w*u,b.h/2+dy);}ctx.closePath();ctx.clip();
 for(let j=0;j<steps;j++){const u=j/steps,v=(j+1)/steps,mid=(u+v)/2,dy=bow*Math.sin(Math.PI*mid),x=-b.w/2+b.w*u;
  ctx.drawImage(img,sx+sw*u,sy,sw/steps+.15,sh,x-.12,-b.h/2-dy-2,b.w/steps+.32,b.h+2*dy+4);
 }ctx.restore();
}
function drawReel(ctx:CanvasRenderingContext2D,img:HTMLImageElement,left:number,right:number){
 if(right<0||left>W)return;const {sx,sy,sw,sh}=crop(img,(right-left)/(H*.38));
 // Clip each card to one continuous hourglass contour. Each image column is
 // extended under the clip so enlarged canvas rendering cannot leave steps.
 ctx.save();ctx.beginPath();for(let j=0;j<=128;j++){const x=mix(left,right,j/128),h=reelHeight(x),y=H/2-h/2;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}
 for(let j=128;j>=0;j--){const x=mix(left,right,j/128),h=reelHeight(x);ctx.lineTo(x,H/2+h/2);}ctx.closePath();ctx.clip();
 const step=2;for(let x=Math.max(0,left);x<Math.min(W,right);x+=step){const dx=Math.min(step+.35,right-x,W-x),h=reelHeight(x+dx/2),u=(x-left)/(right-left);
  ctx.drawImage(img,sx+sw*u,sy,sw*dx/(right-left)+.15,sh,x-.12,H/2-h/2-3,dx+.25,h+6);
 }ctx.restore();
}
function flarePath(ctx:CanvasRenderingContext2D,neck:number,outer:number,strength:number){ctx.beginPath();for(let j=0;j<=96;j++){const s=j/96,x=mix(neck,outer,s),h=flareHeight(s,strength);j?ctx.lineTo(x,CY-h/2):ctx.moveTo(x,CY-h/2);}for(let j=96;j>=0;j--){const s=j/96,x=mix(neck,outer,s),h=flareHeight(s,strength);ctx.lineTo(x,CY+h/2);}ctx.closePath();}
function drawFlare(ctx:CanvasRenderingContext2D,img:HTMLImageElement,neck:number,outer:number,strength:number){if(Math.abs(outer-neck)<.8)return;const left=outer<neck,{sx,sy,sw,sh}=crop(img,1.1),n=128;
 const tex=(s:number)=>.5+(left?-1:1)*.28*(1-Math.exp(-8*s));
 const surface=()=>{ctx.save();flarePath(ctx,neck,outer,strength);ctx.clip();for(let j=0;j<n;j++){const s=j/n,t=(j+1)/n,x=mix(neck,outer,s),nx=mix(neck,outer,t),mid=(s+t)/2,h=flareHeight(mid,strength),u=tex(s),v=tex(t),sourceX=sx+sw*Math.min(u,v),sourceW=Math.max(.5,sw*Math.abs(v-u));ctx.drawImage(img,sourceX,sy,sourceW,sh,Math.min(x,nx)-.25,CY-h/2-4,Math.abs(nx-x)+.7,h+8);}ctx.restore();};
 // Subtle displaced sheets carry the photographic colour behind the warped
 // boundary. The centre poster and the stage itself are never processed.
 for(const [dx,alpha,blur] of [[left?-10:10,.08,6],[left?-4:4,.12,2]] as const){ctx.save();ctx.translate(dx,0);ctx.globalAlpha=alpha;ctx.filter=`blur(${blur}px)`;surface();ctx.restore();}
 surface();
 for(const [dx,dy,color,alpha] of [[-2,-1,"#17c9da",.28],[2,1,"#ff4eaa",.23]] as const){ctx.save();ctx.translate(dx,dy);flarePath(ctx,neck,outer,strength);ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.globalAlpha=alpha;ctx.stroke();ctx.restore();}
}
function drawTurn(ctx:CanvasRenderingContext2D,img:HTMLImageElement,b:Box,skew:number){if(b.w<1)return;const {sx,sy,sw,sh}=crop(img,165/209),n=40;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot||0);for(let j=0;j<n;j++){const u=j/n,x=-b.w/2+b.w*u,dy=skew*(u-.5)*2;ctx.drawImage(img,sx+sw*u,sy,sw/n+.1,sh,x,-b.h/2+dy,b.w/n+.45,b.h);}ctx.restore();}
function drawStream(ctx:CanvasRenderingContext2D,img:HTMLImageElement,b:Box,effect:number){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot||0);const {sx,sy,sw,sh}=crop(img,b.w/b.h),x=-b.w/2,y=-b.h/2;
 if(effect>.01){ctx.globalAlpha=.13*effect;ctx.filter=`blur(${3*effect}px)`;ctx.drawImage(img,sx,sy,sw,sh,x-12*effect,y-9*effect,b.w,b.h);ctx.globalAlpha=.17*effect;ctx.drawImage(img,sx,sy,sw,sh,x-6*effect,y-4*effect,b.w,b.h);ctx.filter="none";ctx.globalAlpha=.4*effect;ctx.fillStyle="#18c9eb";ctx.fillRect(x-2.5*effect,y-1,b.w,2);ctx.fillStyle="#ed427e";ctx.fillRect(x+b.w,y,2.5*effect,b.h);}
 ctx.globalAlpha=1;ctx.drawImage(img,sx,sy,sw,sh,x,y,b.w,b.h);ctx.restore();}
export function paintPanel(ctx:CanvasRenderingContext2D,img:HTMLImageElement,p:Panel){const s=p.shape;if(s.kind==="flat")drawBox(ctx,img,s.box);else if(s.kind==="bow")drawBow(ctx,img,s.box,s.bow);else if(s.kind==="reel")drawReel(ctx,img,s.left,s.right);else if(s.kind==="flare")drawFlare(ctx,img,s.neck,s.outer,s.strength);else if(s.kind==="turn")drawTurn(ctx,img,s.box,s.skew);else drawStream(ctx,img,s.box,s.effect);}
export function inside(p:Point,polygon:Point[]){let ok=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)ok=!ok;}return ok;}
