import { useRef, useEffect } from "react";

export default function Confetti({onDone}) {
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current; if(!canvas)return;
    const ctx=canvas.getContext("2d"); canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    const pieces=Array.from({length:120},()=>({x:Math.random()*canvas.width,y:-20-Math.random()*100,w:8+Math.random()*8,h:5+Math.random()*6,color:["#6B8CAE","#5A7A9E","#8AAAC8","#B0C8E0","#D4A96A","#9AB0C8"][Math.floor(Math.random()*6)],vx:(Math.random()-.5)*3,vy:2+Math.random()*3,angle:Math.random()*Math.PI*2,va:(Math.random()-.5)*0.2}));
    let raf,done=false;
    const draw=()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.angle+=p.va;p.vy+=0.04;ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,1-p.y/canvas.height);ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}); if(!done)raf=requestAnimationFrame(draw); };
    draw(); const t=setTimeout(()=>{done=true;cancelAnimationFrame(raf);onDone();},3000);
    return()=>{done=true;cancelAnimationFrame(raf);clearTimeout(t);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:999,pointerEvents:"none"}}/>;
}
