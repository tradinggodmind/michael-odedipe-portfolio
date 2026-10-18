"use client";
import {useEffect,useRef} from "react";
type Body={x:number;y:number;z:number;vx:number;vy:number;vz:number;r:number;color:string};
const colors=["#1029f0","#1029f0","#1735f5","#782cf1","#782cf1","#e8e9ed","#e8e9ed","#e8e9ed","#e8e9ed","#252631","#252631","#252631"];
function sphereSprite(color:string){
 const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d")!;
 const rgb=color.match(/\w\w/g)!.map(n=>parseInt(n,16));const tint=(s:number)=>`rgb(${rgb.map(v=>Math.round(Math.min(255,v*s))).join(",")})`;
 g.beginPath();g.arc(128,128,120,0,Math.PI*2);g.clip();
 const shade=g.createRadialGradient(85,67,8,143,153,158);shade.addColorStop(0,tint(1.65));shade.addColorStop(.36,tint(1.12));shade.addColorStop(.67,tint(.72));shade.addColorStop(.9,tint(.19));shade.addColorStop(1,tint(.44));g.fillStyle=shade;g.fillRect(0,0,256,256);
 const rim=g.createRadialGradient(170,186,16,170,186,105);rim.addColorStop(0,"#a4b4e83a");rim.addColorStop(.7,"#e4ecff08");rim.addColorStop(1,"#ffffff00");g.fillStyle=rim;g.fillRect(0,0,256,256);
 g.save();g.translate(85,62);g.rotate(-.5);g.scale(1,.52);const shine=g.createRadialGradient(0,0,3,0,0,52);shine.addColorStop(0,"#ffffffe0");shine.addColorStop(.4,"#ffffffa0");shine.addColorStop(.72,"#ffffff20");shine.addColorStop(1,"#ffffff00");g.fillStyle=shine;g.fillRect(-60,-60,120,120);g.restore();
 g.save();g.translate(183,128);g.rotate(.2);g.scale(.15,1);const strip=g.createRadialGradient(0,0,1,0,0,58);strip.addColorStop(0,"#ffffff70");strip.addColorStop(.5,"#ffffff18");strip.addColorStop(1,"#ffffff00");g.fillStyle=strip;g.fillRect(-60,-60,120,120);g.restore();return c;
}
export default function HeroScene({reduced}:{reduced:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const host=ref.current;if(!host)return;let dead=false,raf=0,visible=true,last=0,w=1,h=1;let render:()=>void=()=>{},resizeRenderer:()=>void=()=>{},disposeRenderer:()=>void=()=>{};
 const bodies:Body[]=Array.from({length:40},(_,i)=>{const a=i*2.39996,r=1.8+Math.sqrt(i)*.54;return{x:Math.cos(a)*r,y:Math.sin(a)*r*.65,z:Math.sin(i*1.7)*2,vx:-Math.cos(a),vy:-Math.sin(a),vz:0,r:.84+(i%5)*.08,color:colors[i%colors.length]};});
 const pointer={x:99,y:99,vx:0,vy:0,last:0,active:false};
 const step=(dt:number)=>{for(const b of bodies){b.vx-=b.x*1.8*dt;b.vy-=b.y*1.8*dt;b.vz-=b.z*1.4*dt;if(pointer.active){const dx=b.x-pointer.x,dy=b.y-pointer.y,d=Math.hypot(dx,dy);if(d<3.4){const influence=(3.4-d)/3.4,f=influence*23*dt/Math.max(d,.35);b.vx+=dx*f+pointer.vx*influence*1.1*dt;b.vy+=dy*f+pointer.vy*influence*1.1*dt;}}b.vx*=Math.pow(.34,dt);b.vy*=Math.pow(.34,dt);b.vz*=Math.pow(.34,dt);b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;}pointer.vx*=Math.exp(-7*dt);pointer.vy*=Math.exp(-7*dt);
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,d=Math.max(.001,Math.hypot(dx,dy,dz)),min=(a.r+b.r)*1.01;if(d<min){const f=(min-d)*.46/d;a.x-=dx*f;a.y-=dy*f;a.z-=dz*f;b.x+=dx*f;b.y+=dy*f;b.z+=dz*f;const push=dt*2/d;a.vx-=dx*push;a.vy-=dy*push;b.vx+=dx*push;b.vy+=dy*push;}}
 };
 // Let collisions settle once, including reduced-motion visitors.
 for(let i=0;i<150;i++)step(1/60);
 const canvasFallback=()=>{const c=document.createElement("canvas"),ctx=c.getContext("2d")!;c.setAttribute("aria-hidden","true");host.insertBefore(c,host.firstChild);host.dataset.renderer="canvas-fallback";const sprites=new Map(colors.map(color=>[color,sphereSprite(color)]));
  resizeRenderer=()=>{const d=Math.min(devicePixelRatio,2);c.width=Math.round(w*d);c.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);};
  render=()=>{ctx.clearRect(0,0,w,h);const scale=Math.min(h/7.2,w/6.4);for(const b of [...bodies].sort((a,b)=>a.z-b.z)){const k=17.5/(17.5-b.z),size=b.r*scale*k*2.12;const x=w/2+b.x*scale*k,y=h/2-b.y*scale*k;ctx.shadowBlur=18*k;ctx.shadowColor="#16182624";ctx.shadowOffsetY=12*k;ctx.drawImage(sprites.get(b.color)!,x-size/2,y-size/2,size,size);}ctx.shadowBlur=0;};disposeRenderer=()=>c.remove();resizeRenderer();render();};
 const webgl=async()=>{const test=document.createElement("canvas");if(!test.getContext("webgl2")){canvasFallback();return;}try{const T=await import("three");if(dead)return;const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;host.insertBefore(renderer.domElement,host.firstChild);host.dataset.renderer="webgl";
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,w/h,.1,100);camera.position.z=17.5;
   // Original studio environment: luminous softboxes reflected by solid clear-coated spheres.
   const env=document.createElement("canvas");env.width=1024;env.height=512;const eg=env.getContext("2d")!;eg.fillStyle="#535969";eg.fillRect(0,0,1024,512);const glow=eg.createLinearGradient(0,0,0,512);glow.addColorStop(0,"#c9d5ed");glow.addColorStop(.5,"#727887");glow.addColorStop(1,"#141721");eg.fillStyle=glow;eg.fillRect(0,0,1024,512);eg.fillStyle="#ffffff";eg.fillRect(170,55,130,170);eg.fillRect(640,90,38,230);eg.fillStyle="#c3cfff";eg.fillRect(850,200,70,80);
   const tex=new T.CanvasTexture(env);tex.mapping=T.EquirectangularReflectionMapping;tex.colorSpace=T.SRGBColorSpace;const pmrem=new T.PMREMGenerator(renderer);const target=pmrem.fromEquirectangular(tex);scene.environment=target.texture;tex.dispose();pmrem.dispose();
   scene.add(new T.HemisphereLight(0xffffff,0x151622,2));const key=new T.DirectionalLight(0xffffff,3);key.position.set(-5,7,10);scene.add(key);const fill=new T.DirectionalLight(0xb3bdff,1.3);fill.position.set(5,0,6);scene.add(fill);
   const geometry=new T.SphereGeometry(1,48,32);const meshes=bodies.map(b=>{const material=new T.MeshPhysicalMaterial({color:b.color,metalness:.18,roughness:.13,clearcoat:1,clearcoatRoughness:.07,envMapIntensity:1.3});const m=new T.Mesh(geometry,material);m.scale.setScalar(b.r);scene.add(m);return m;});
   resizeRenderer=()=>{renderer.setSize(w,h);camera.aspect=w/h;camera.fov= 30-Math.max(0,Math.min(1,(w/h-.67)/1.53))*12;camera.updateProjectionMatrix();};render=()=>{bodies.forEach((b,i)=>meshes[i].position.set(b.x,b.y,b.z));renderer.render(scene,camera);};disposeRenderer=()=>{meshes.forEach(m=>m.material.dispose());geometry.dispose();target.dispose();renderer.dispose();renderer.domElement.remove();};resizeRenderer();render();
  }catch{if(!dead)canvasFallback();}};
 const draw=(time:number)=>{raf=0;if(dead)return;const dt=Math.min(.04,(time-last)/1000||.016);last=time;if(!reduced)step(dt);render();if(visible&&!document.hidden&&!reduced)raf=requestAnimationFrame(draw);};
 const wake=()=>{if(!raf&&!dead){last=performance.now();raf=requestAnimationFrame(draw);}};
 const size=()=>{w=host.clientWidth;h=host.clientHeight;resizeRenderer();render();};const ro=new ResizeObserver(size);ro.observe(host);size();void webgl().then(wake);
 const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake();});io.observe(host);
 const move=(e:PointerEvent)=>{const r=host.getBoundingClientRect(),s=Math.min(h/7.2,w/6.4),x=(e.clientX-r.left-w/2)/s,y=-(e.clientY-r.top-h/2)/s,time=performance.now(),dt=Math.max(.016,(time-pointer.last)/1000);if(pointer.active){pointer.vx=Math.max(-18,Math.min(18,(x-pointer.x)/dt));pointer.vy=Math.max(-18,Math.min(18,(y-pointer.y)/dt));}pointer.x=x;pointer.y=y;pointer.last=time;pointer.active=true;wake();};const leave=()=>{pointer.active=false;pointer.vx=pointer.vy=0;};const disperse=()=>{for(const b of bodies){b.vx+=b.x*2.6;b.vy+=b.y*2.6;b.vz+=b.z*1.5;}if(reduced){step(.16);render();}else wake();};
 host.addEventListener("pointermove",move);host.addEventListener("pointerleave",leave);host.addEventListener("click",disperse);document.addEventListener("visibilitychange",wake);
 return()=>{dead=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();disposeRenderer();host.removeEventListener("pointermove",move);host.removeEventListener("pointerleave",leave);host.removeEventListener("click",disperse);document.removeEventListener("visibilitychange",wake);};
 },[reduced]);
 return <div ref={ref} className="hero-scene" role="img" aria-label="Interactive solid glossy 3D spheres in black, white, blue and purple"><span className="sphere-hint">Move to disturb · Click to disperse</span></div>;
}
