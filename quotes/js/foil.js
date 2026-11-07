// Canvas foil / cellophane pack. No image assets. Look B red plus metallic greys.
// A still frame already reads as a pillow: crimped seams, bulge, crinkles, seam shadow, drop shadow.
// The moving part is one specular composite per frame. No WebGL.
window.FOIL=(()=>{
function pillow(ctx,w,h,inset){const x0=inset,x1=w-inset,y0=inset+16,y1=h-inset-16,b=w*0.045;
 ctx.beginPath();ctx.moveTo(x0+18,y0);
 ctx.quadraticCurveTo(w/2,y0-b*1.6,x1-18,y0);
 ctx.quadraticCurveTo(x1+b,h*0.5,x1-18,y1);
 ctx.quadraticCurveTo(w/2,y1+b*1.6,x0+18,y1);
 ctx.quadraticCurveTo(x0-b,h*0.5,x0+18,y0);ctx.closePath()}
function crimp(ctx,w,y,dir,teeth){ctx.beginPath();const x0=22,x1=w-22,n=Math.max(8,Math.round((x1-x0)/teeth));
 ctx.moveTo(x0,y);for(let i=0;i<n;i++){const x=x0+(x1-x0)*(i+1)/n,yy=y+dir*(i%2?0:7);ctx.lineTo(x,yy)}
 ctx.lineTo(x1,y+dir*2);ctx.lineTo(x0,y+dir*2);ctx.closePath()}
function make(w,h){const base=document.createElement('canvas');base.width=w;base.height=h;
 const spec=document.createElement('canvas');spec.width=w;spec.height=h;
 let built='',rngSeed=1;
 function rnd(){rngSeed=(rngSeed*16807)%2147483647;return (rngSeed-1)/2147483646}
 function rebuild(o){const key=(o.name||'')+'|'+(o.holo?1:0)+'|'+(o.user?1:0)+'|'+w+'x'+h;if(key===built)return;built=key;
  const x=base.getContext('2d');x.clearRect(0,0,w,h);x.save();
  x.fillStyle='rgba(0,0,0,.45)';x.beginPath();x.ellipse(w/2,h*0.93,w*0.34,h*0.035,0,0,7);x.fill();
  pillow(x,w,h,8);x.save();x.clip();
  const g=x.createRadialGradient(w*0.46,h*0.42,w*0.05,w*0.5,h*0.48,w*0.72);
  g.addColorStop(0,'#4a4a4a');g.addColorStop(0.45,'#1c1c1c');g.addColorStop(1,'#070707');
  x.fillStyle=g;x.fillRect(0,0,w,h);
  x.fillStyle='rgba(0,0,0,.28)';x.fillRect(w*0.47,18,10,h-36);
  rngSeed=7;x.lineWidth=1.2;
  for(let i=0;i<520;i++){const px=10+rnd()*(w-20),py=20+rnd()*(h-40),a=rnd()*Math.PI,len=8+rnd()*22;
   const hue=o.holo&&rnd()<0.22?`hsla(${rnd()*360|0},80%,70%,.13)`:`rgba(255,255,255,${0.03+rnd()*0.09})`;
   x.strokeStyle=hue;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*len,py+Math.sin(a)*len*0.55);x.stroke();
   if(rnd()<0.5){x.strokeStyle=`rgba(0,0,0,${0.08+rnd()*0.12})`;x.beginPath();x.moveTo(px+1,py+1);x.lineTo(px+1+Math.cos(a)*len,py+1+Math.sin(a)*len*0.55);x.stroke()}}
  const vg=x.createLinearGradient(0,0,w,0);vg.addColorStop(0,'rgba(0,0,0,.45)');vg.addColorStop(0.18,'rgba(0,0,0,0)');vg.addColorStop(0.82,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.5)');
  x.fillStyle=vg;x.fillRect(0,0,w,h);
  x.restore();
  x.lineWidth=2;x.strokeStyle=o.user?'#d4af37':'#ff2a2a';pillow(x,w,h,8);x.stroke();
  x.save();pillow(x,w,h,8);x.clip();
  const col=o.user?'#d4af37':'#c8c8c8';
  x.fillStyle='#0a0a0a';crimp(x,w,26,1,14);x.fill();x.strokeStyle=col;x.stroke();
  x.fillStyle='#0a0a0a';crimp(x,w,h-26,-1,14);x.fill();x.stroke();
  x.fillStyle='#f2f2f2';x.font=`800 ${Math.round(w*0.09)}px ui-monospace,Menlo,monospace`;x.textAlign='center';x.textBaseline='middle';
  x.fillText(String(o.name||'').slice(0,16),w/2,h*0.46);
  x.fillStyle=o.user?'#d4af37':'#ff2a2a';x.font=`700 ${Math.round(w*0.07)}px ui-monospace,Menlo,monospace`;x.fillText('\u2605',w/2,h*0.56);
  x.fillStyle='#c8c8c8';x.font=`700 ${Math.round(w*0.045)}px ui-monospace,Menlo,monospace`;x.fillText(o.sub||'7 CARDS',w/2,h*0.64);
  x.restore()}
 function draw(ctx,o){rebuild(o);ctx.clearRect(0,0,w,h);ctx.drawImage(base,0,0);
  const lx=(o.light&&o.light.x!=null?o.light.x:0.35)*w,ly=(o.light&&o.light.y!=null?o.light.y:0.32)*h;
  ctx.save();pillow(ctx,w,h,8);ctx.clip();ctx.globalCompositeOperation='screen';
  const rad=ctx.createRadialGradient(lx,ly,6,lx,ly,w*0.42);
  rad.addColorStop(0,'rgba(255,255,255,.55)');rad.addColorStop(0.35,'rgba(255,255,255,.16)');rad.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=rad;ctx.fillRect(0,0,w,h);ctx.restore();
  const tear=Math.max(0,Math.min(1,o.tear||0));
  if(tear>0.02){ctx.save();pillow(ctx,w,h,8);ctx.clip();
   const path=o.path&&o.path.length?o.path:[{x:0.08,y:0.08},{x:0.08+tear*0.84,y:0.09}];
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);
   for(let i=path.length-1;i>=0;i--){const p=path[i];ctx.lineTo(p.x*w,(p.y*h)+((i%2)?3:-2))}
   ctx.lineTo(path[0].x*w,0);ctx.closePath();ctx.fillStyle='rgba(0,0,0,.72)';ctx.fill();
   ctx.beginPath();const p0=path[0];ctx.moveTo(p0.x*w,p0.y*h);
   for(const p of path)ctx.lineTo(p.x*w,p.y*h+(Math.sin(p.x*40)*2));
   ctx.strokeStyle='#f2f2f2';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
   if(o.curl){ctx.save();ctx.globalAlpha=Math.max(0,1-o.curl);ctx.translate(w*0.55,18+o.curl*h*0.55);ctx.rotate(-0.6-o.curl*1.4);
    ctx.fillStyle='#2a2a2a';ctx.fillRect(-w*0.36,-8,w*0.7,16);ctx.strokeStyle='#888';ctx.strokeRect(-w*0.36,-8,w*0.7,16);ctx.restore()}}
  if(o.crumple>0){ctx.save();ctx.globalAlpha=1-o.crumple*0.85;const k=1-o.crumple*0.35;
   ctx.translate(w/2,h*0.55);ctx.rotate(o.crumple*0.35);ctx.scale(k,k*0.72);ctx.translate(-w/2,-h*0.55);
   ctx.drawImage(base,0,0);ctx.restore()}}
 return{draw,w,h}}
return{make}})();
