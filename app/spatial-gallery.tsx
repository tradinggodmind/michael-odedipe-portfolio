"use client";
import {useEffect,useRef,useState} from "react";
import {inside,paintPanel,scenePanels,type Mode,type Panel} from "./gallery-scenes";

export type GalleryWork={id:string;brand:string;concept:string;product:string;description:string;logo:string;small:string;large:string;width:number;height:number};
const TRANSITION_MS=1750,HOLD_MS=1000,STAGE_W=640,STAGE_H=419;
const easer=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

export default function SpatialGallery<T extends GalleryWork>({chapter,works,onOpen,reduced}:{chapter:{id:string;n:string;name:string;label:string;subtitle:string;mode:string};works:T[];onOpen:(w:T)=>void;reduced:boolean}){
 const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),api=useRef({go:(_d:number)=>{},focus:(_i:number)=>{},wake:()=>{},syncPause:(_p:boolean)=>{}}),retained=useRef(0),openRef=useRef(onOpen),pausedRef=useRef(false);openRef.current=onOpen;
 const [active,setActive]=useState(0),[paused,setPaused]=useState(false),mode=chapter.mode as Mode;
 pausedRef.current=paused;
 useEffect(()=>{api.current.syncPause(paused);},[paused]);
 useEffect(()=>{
  const stage=root.current,surface=canvas.current;if(!stage||!surface)return;const context=surface.getContext("2d");if(!context)return;
  const el:HTMLDivElement=stage,c:HTMLCanvasElement=surface,ctx:CanvasRenderingContext2D=context;
  let dead=false,visible=false,raf=0,last=0,phase=retained.current,w=640,h=419,holdUntil=performance.now()+HOLD_MS,tween=0,tweenStart=0,pausedAt=0,from=phase,to=phase,tweenManual=false,drag=false,moved=false,startX=0,base=phase,wheelSum=0,wheelAt=0,loaded=false;
  let panels:Panel[]=[];
  const frameInterval=mode==="warp"||mode==="stream"?1000/30:1000/40;
  const images=works.map(()=>{const im=new Image();im.decoding="async";im.onload=()=>wake();return im;});
  const buttons=[...el.querySelectorAll<HTMLButtonElement>(".panel-access")];
  function wake(){if(!raf&&!dead){last=performance.now()-frameInterval;raf=requestAnimationFrame(draw);}}
  function tweenTo(v:number,manual=true){if(reduced){phase=v;tween=0;holdUntil=performance.now()+HOLD_MS;wake();return;}from=phase;to=v;tween=.000001;tweenStart=performance.now();tweenManual=manual;holdUntil=tweenStart+TRANSITION_MS+HOLD_MS;wake();}
  function step(direction:number){const anchor=tween>0&&tweenManual?to:Math.round(phase);tweenTo(anchor+direction,true);}
  function focus(i:number){let goal=mode==="orbit"?works.length/4-i:i;const n=works.length;goal+=Math.round((phase-goal)/n)*n;tweenTo(goal,true);}
  function syncPause(next:boolean){const now=performance.now();if(next){pausedAt=now;}else if(pausedAt){if(tween>0&&!tweenManual)tweenStart+=now-pausedAt;if(tween===0)holdUntil=now+HOLD_MS;pausedAt=0;}wake();}
  api.current={go:step,focus,wake,syncPause};
  function draw(time:number){
   raf=0;if(dead)return;
   if(time-last<frameInterval&&visible&&!document.hidden){raf=requestAnimationFrame(draw);return;}
   last=time;
   const keyboardFocus=el.contains(document.activeElement)&&document.activeElement?.matches(":focus-visible"),auto=visible&&!document.hidden&&!pausedRef.current&&!reduced&&!drag&&!keyboardFocus;
   const runningTween=tween>0&&(!pausedRef.current||tweenManual);
   if(runningTween){tween=Math.min(1,Math.max(.000001,(time-tweenStart)/TRANSITION_MS));phase=from+(to-from)*easer(tween);if(tween===1){phase=to;tween=0;tweenManual=false;holdUntil=time+HOLD_MS;}}
   else if(auto&&tween===0&&time>=holdUntil)tweenTo(Math.round(phase)+1,false);
   retained.current=phase;el.dataset.phase=phase.toFixed(4);
   ctx.clearRect(0,0,w,h);ctx.fillStyle="#e9e7e7";ctx.fillRect(0,0,w,h);
   const scale=Math.max(w/STAGE_W,h/STAGE_H),ox=(w-STAGE_W*scale)/2,oy=(h-STAGE_H*scale)/2;
   ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
   panels=scenePanels(mode,phase,works.length).sort((a,b)=>a.z-b.z);
   buttons.forEach(button=>button.style.display="none");
   for(const p of panels){
    const x0=Math.min(...p.points.map(q=>q.x)),x1=Math.max(...p.points.map(q=>q.x)),y0=Math.min(...p.points.map(q=>q.y)),y1=Math.max(...p.points.map(q=>q.y)),button=buttons[p.i];
    if(x1<0||x0>STAGE_W||y1<0||y0>STAGE_H)continue;
    const im=images[p.i];if(im.complete&&im.naturalWidth)paintPanel(ctx,im,p);
    if(button)Object.assign(button.style,{display:"block",left:(ox+x0*scale)+"px",top:(oy+y0*scale)+"px",width:Math.max(0,(x1-x0)*scale)+"px",height:Math.max(0,(y1-y0)*scale)+"px",zIndex:String(20+Math.round(p.z*10))});
   }
   ctx.restore();
   let central:Panel|undefined;
   if(mode==="orbit")central=panels.at(-1);
   else if(mode==="warp")central=panels.find(p=>p.shape.kind==="turn"&&p.z>=5);
   else central=[...panels].sort((a,b)=>Math.abs((a.points[0].x+a.points[Math.floor(a.points.length/2)].x)/2-320)-Math.abs((b.points[0].x+b.points[Math.floor(b.points.length/2)].x)/2-320))[0];
   if(central)setActive(v=>v===central!.i?v:central!.i);
   if(visible&&!document.hidden&&(runningTween||auto||drag))raf=requestAnimationFrame(draw);
  }
  function size(){w=el.clientWidth;h=el.clientHeight;const d=Math.min(devicePixelRatio,mode==="warp"||mode==="stream"?1.15:1.35,Math.sqrt(2600000/Math.max(1,w*h)));c!.width=Math.max(1,Math.round(w*d));c!.height=Math.max(1,Math.round(h*d));ctx!.setTransform(d,0,0,d,0,0);wake();}
  const ro=new ResizeObserver(size);ro.observe(el);size();
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){if(!loaded){loaded=true;holdUntil=performance.now()+HOLD_MS;images.forEach((im,i)=>im.src=works[i].small);}wake();}else if(raf){cancelAnimationFrame(raf);raf=0;}},{rootMargin:"160px"});io.observe(el);
  const down=(e:PointerEvent)=>{if((e.target as Element).closest(".scene-ui"))return;drag=true;tween=0;startX=e.clientX;base=phase;moved=false;el.setPointerCapture(e.pointerId);};
  const move=(e:PointerEvent)=>{if(!drag)return;const dx=e.clientX-startX;if(Math.abs(dx)>5)moved=true;phase=base+(mode==="strip"?1:-1)*dx/Math.max(90,w/6.5);holdUntil=performance.now()+HOLD_MS;wake();};
  const up=(e:PointerEvent)=>{if(!drag)return;drag=false;if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);
   if(moved){tweenTo(Math.round(phase),true);return;}
   const r=el.getBoundingClientRect(),scale=Math.max(w/STAGE_W,h/STAGE_H),point={x:(e.clientX-r.left-(w-STAGE_W*scale)/2)/scale,y:(e.clientY-r.top-(h-STAGE_H*scale)/2)/scale};
   const hit=[...panels].reverse().find(p=>inside(point,p.points));if(hit)openRef.current(works[hit.i]);else if(mode==="orbit")setPaused(v=>!v);wake();};
  const cancel=()=>{drag=false;};
  const wheel=(e:WheelEvent)=>{if(mode!=="warp")return;const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;wheelSum+=delta;if(Math.abs(wheelSum)>90&&performance.now()-wheelAt>900){step(Math.sign(wheelSum));wheelAt=performance.now();wheelSum=0;}/* Native page scrolling remains available. */};
  const key=(e:KeyboardEvent)=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();step(e.key==="ArrowRight"?1:-1);}else if(e.key===" "&&mode==="orbit"){e.preventDefault();setPaused(v=>!v);}};
  el.addEventListener("pointerdown",down);el.addEventListener("pointermove",move);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",cancel);el.addEventListener("wheel",wheel,{passive:true});el.addEventListener("keydown",key);document.addEventListener("visibilitychange",wake);
  return()=>{dead=true;cancelAnimationFrame(raf);io.disconnect();ro.disconnect();el.removeEventListener("pointerdown",down);el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",cancel);el.removeEventListener("wheel",wheel);el.removeEventListener("keydown",key);document.removeEventListener("visibilitychange",wake);images.forEach(im=>im.onload=null);};
 },[works,mode,reduced]);
 const current=works[active];return <section id={chapter.id} className={`chapter spatial-chapter spatial-${mode}`} data-chapter={chapter.id}>
  <div className="spatial-stage" ref={root} tabIndex={0} aria-label={`${chapter.label} interactive gallery. Drag or use arrow keys to explore.`}>
   <canvas ref={canvas} aria-hidden="true"/>{works.map((work,i)=><button key={work.id} className="panel-access" data-work-id={work.id} aria-label={`View ${work.brand}: ${work.concept}`} onFocus={e=>{if(e.currentTarget.matches(":focus-visible"))api.current.focus(i);}} onClick={e=>{if(e.detail===0)onOpen(work);}}><span>{work.brand} — {work.concept}</span></button>)}
   <header className="spatial-heading"><span className="eyebrow">Michael Odedipe / {chapter.n}</span><h2>{chapter.label}</h2><p>{chapter.subtitle}</p></header>
   <div className="scene-ui scene-top"><span>{mode==="orbit"?"VISUAL ARCHIVE":mode==="strip"?"LIFE IN MOTION":mode==="reel"?"REEL FLUX":mode==="warp"?"FORM / MOTION":"NEON ARCHIVE"} &nbsp; +</span><span>10 independent studies · 2026</span></div>
   <div className="scene-ui scene-bottom"><span>{mode==="orbit"?"Tap empty space to pause / resume":mode==="warp"?"Drag, scroll or use ← →":"Drag or use ← →"}</span><div><button onClick={()=>api.current.go(-1)} aria-label={`Previous ${chapter.label} image`}>←</button><button onClick={()=>setPaused(v=>!v)} aria-label={`${paused?"Play":"Pause"} ${chapter.label} animation`} aria-pressed={paused}>{paused?"Play":"Pause"}</button><button onClick={()=>api.current.go(1)} aria-label={`Next ${chapter.label} image`}>→</button></div></div>
  </div>
  <div className="spatial-caption"><img src={current.logo} alt={`${current.brand} logo`} width="110" height="34" loading="lazy"/><div><span>{current.brand}</span><button onClick={()=>onOpen(current)}>{current.concept} ↗</button></div><p>{current.product}<small>Concept garment · Independent study</small></p><span>{String(active+1).padStart(2,"0")} / 10</span></div>
 </section>;
}
