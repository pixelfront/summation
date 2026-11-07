// Canvas foil / cellophane pack. No image assets. Look B red plus metallic greys.
// The sealed pack is a pillow of folded foil: faceted crinkles, a lit belly, a dark rim,
// and crimped seams. The tear lifts that seam into a curled strip. No WebGL.
window.FOIL=(()=>{
function pillow(ctx,w,h){const x0=46,x1=w-46,y0=58,y1=h-58,sx=18,sy=16;
 ctx.beginPath();ctx.moveTo(x0+22,y0);
 ctx.quadraticCurveTo(w*0.5,y0-sy,x1-22,y0);
 ctx.quadraticCurveTo(x1+sx,h*0.22,x1+sx*0.45,h*0.5);
 ctx.quadraticCurveTo(x1+sx,h*0.78,x1-22,y1);
 ctx.quadraticCurveTo(w*0.5,y1+sy,x0+22,y1);
 ctx.quadraticCurveTo(x0-sx,h*0.78,x0-sx*0.45,h*0.5);
 ctx.quadraticCurveTo(x0-sx,h*0.22,x0+22,y0);ctx.closePath()}
function make(w,h){const base=document.createElement('canvas');base.width=w;base.height=h;
 let built='',seed=1;
 function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
 function crimpBand(x,y,dir){const x0=52,x1=w-52,tw=18,n=Math.max(8,Math.round((x1-x0)/tw));
  x.save();
  for(let i=0;i<n;i++){const a=x0+i*(x1-x0)/n,b=a+(x1-x0)/n,mid=(a+b)/2,up=i%2===0,flap=dir*(up?18:8);
   const g=x.createLinearGradient(mid,y,mid,y+flap);
   g.addColorStop(0,up?'#f4f4f4':'#2a2a2a');g.addColorStop(0.45,up?'#8d8d8d':'#6e6e6e');g.addColorStop(1,up?'#3a3a3a':'#141414');
   x.fillStyle=g;x.beginPath();x.moveTo(a,y);x.lineTo(mid,y+flap);x.lineTo(b,y);x.closePath();x.fill();
   x.strokeStyle='rgba(0,0,0,.55)';x.lineWidth=1;x.stroke();
   x.strokeStyle=up?'rgba(255,255,255,.55)':'rgba(0,0,0,.2)';x.beginPath();x.moveTo(a+1,y);x.lineTo(mid,y+flap*0.65);x.stroke()}
  x.restore();
  x.save();x.strokeStyle='rgba(0,0,0,.55)';x.lineWidth=8;x.beginPath();x.moveTo(30,y+dir*3);x.lineTo(w-30,y+dir*3);x.stroke();
  x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=1.5;x.beginPath();x.moveTo(34,y+dir*8);x.lineTo(w-34,y+dir*8);x.stroke();x.restore()}
 function rebuild(o){const key=(o.name||'')+'|'+(o.holo?1:0)+'|'+(o.user?1:0)+'|'+w+'x'+h;if(key===built)return;built=key;seed=3;
  const x=base.getContext('2d');x.clearRect(0,0,w,h);
  x.save();x.fillStyle='rgba(0,0,0,.55)';x.beginPath();x.ellipse(w*0.52,h*0.93,w*0.38,h*0.045,0,0,7);x.fill();
  x.fillStyle='rgba(0,0,0,.28)';x.beginPath();x.ellipse(w*0.5,h*0.9,w*0.3,18,0,0,7);x.fill();x.restore();
  pillow(x,w,h);x.save();x.clip();
  const belly=x.createRadialGradient(w*0.42,h*0.40,w*0.02,w*0.5,h*0.48,w*0.78);
  belly.addColorStop(0,'#8a8a8a');belly.addColorStop(0.28,'#3a3a3a');belly.addColorStop(0.62,'#161616');belly.addColorStop(1,'#050505');
  x.fillStyle=belly;x.fillRect(0,0,w,h);
  const rim=x.createLinearGradient(0,0,w,0);
  rim.addColorStop(0,'rgba(0,0,0,.72)');rim.addColorStop(0.08,'rgba(255,255,255,.18)');rim.addColorStop(0.16,'rgba(0,0,0,0)');
  rim.addColorStop(0.84,'rgba(0,0,0,0)');rim.addColorStop(0.93,'rgba(255,255,255,.10)');rim.addColorStop(1,'rgba(0,0,0,.78)');
  x.fillStyle=rim;x.fillRect(0,0,w,h);
  const cols=16,rows=26,x0=24,y0=40,cw=(w-48)/cols,ch=(h-80)/rows;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const jx=(rnd()-0.5)*cw*0.85,jy=(rnd()-0.5)*ch*0.85;
   const ax=x0+i*cw+jx,ay=y0+j*ch+jy,bx=x0+(i+1)*cw+(rnd()-0.5)*cw*0.4,by=y0+j*ch+(rnd()-0.5)*ch*0.4;
   const cxp=x0+(i+1)*cw+(rnd()-0.5)*cw*0.5,cyp=y0+(j+1)*ch+(rnd()-0.5)*ch*0.45,dx=x0+i*cw+(rnd()-0.5)*cw*0.4,dy=y0+(j+1)*ch+(rnd()-0.5)*ch*0.4;
   const nx=(rnd()-0.5)*2,ny=(rnd()-0.5)*2,nd=Math.max(0,Math.min(1,0.42+nx*0.55+ny*0.28));
   const v=Math.round(12+nd*168);
   x.globalAlpha=0.62;x.fillStyle=o.holo&&rnd()<0.16?`hsla(${rnd()*360|0},70%,${40+nd*40}%,.55)`:`rgb(${v},${v},${Math.min(255,v+8)})`;
   x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.lineTo(cxp,cyp);x.lineTo(dx,dy);x.closePath();x.fill();
   if(nd>0.82){x.globalAlpha=0.9;x.strokeStyle='#fff';x.lineWidth=1.2;x.beginPath();x.moveTo(ax,ay);x.lineTo((ax+bx)/2,(ay+by)/2);x.stroke()}}
  x.globalAlpha=1;
  for(let k=0;k<5;k++){const yy=h*(0.22+k*0.13),g=x.createLinearGradient(0,yy-10,0,yy+16);
   g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(0.45,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.28)');
   x.fillStyle=g;x.beginPath();x.moveTo(30,yy);x.quadraticCurveTo(w*0.5,yy+(k%2?14:-12),w-30,yy);x.lineTo(w-30,yy+18);x.quadraticCurveTo(w*0.5,yy+18+(k%2?14:-12),30,yy+18);x.closePath();x.fill()}
  const seam=x.createLinearGradient(w*0.46,0,w*0.58,0);
  seam.addColorStop(0,'rgba(0,0,0,0)');seam.addColorStop(0.35,'rgba(0,0,0,.55)');seam.addColorStop(0.5,'rgba(255,255,255,.28)');seam.addColorStop(0.68,'rgba(0,0,0,.62)');seam.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=seam;x.fillRect(w*0.42,40,w*0.2,h-80);
  const edge=x.createRadialGradient(w*0.5,h*0.46,w*0.2,w*0.5,h*0.5,w*0.62);
  edge.addColorStop(0,'rgba(0,0,0,0)');edge.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=edge;x.fillRect(0,0,w,h);
  x.restore();
  x.save();x.lineJoin='round';x.lineWidth=14;x.strokeStyle='#0a0a0a';pillow(x,w,h);x.stroke();
  x.lineWidth=7;x.strokeStyle='#5c5c5c';x.stroke();
  x.lineWidth=2.5;x.strokeStyle=o.user?'#d4af37':'#ff2a2a';x.stroke();
  x.lineWidth=1;x.strokeStyle='rgba(255,255,255,.45)';x.stroke();x.restore();
  crimpBand(x,58,1);crimpBand(x,h-58,-1);
  x.save();pillow(x,w,h);x.clip();
  x.fillStyle='rgba(0,0,0,.45)';x.fillRect(w*0.14,h*0.36,w*0.72,h*0.30);
  x.fillStyle='#f2f2f2';x.font=`800 ${Math.round(w*0.086)}px ui-monospace,Menlo,monospace`;x.textAlign='center';x.textBaseline='middle';
  x.fillText(String(o.name||'').slice(0,16),w/2,h*0.44);
  x.fillStyle=o.user?'#d4af37':'#ff2a2a';x.font=`700 ${Math.round(w*0.064)}px ui-monospace,Menlo,monospace`;x.fillText('\u2605',w/2,h*0.53);
  x.fillStyle='#d8d8d8';x.font=`700 ${Math.round(w*0.04)}px ui-monospace,Menlo,monospace`;x.fillText(o.sub||'7 CARDS',w/2,h*0.60);
  x.restore()}
 function ribbon(ctx,o){const tear=Math.max(0,Math.min(1,o.tear||0)),curl=Math.max(0,Math.min(1,o.curl||0));if(tear<0.04&&curl<0.04)return;
  const lift=Math.max(tear*0.35,curl);
  ctx.save();ctx.translate(w*(0.62+curl*0.08),28+curl*h*0.04);ctx.rotate(-0.35-lift*1.15);
  const bands=2+Math.round(curl*3);
  for(let i=0;i<bands;i++){const yy=i*15,gw=92-i*10,g=ctx.createLinearGradient(0,yy-8,0,yy+12);
   g.addColorStop(0,'#1a1a1a');g.addColorStop(0.22,'#f7f7f7');g.addColorStop(0.48,'#7a7a7a');g.addColorStop(0.72,'#f0f0f0');g.addColorStop(1,'#111');
   ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(-10,yy,gw,9+i,0.15,0,7);ctx.fill();
   ctx.strokeStyle=o.user?'#d4af37':'#ff2a2a';ctx.lineWidth=1.4;ctx.stroke()}
  ctx.restore()}
 function draw(ctx,o){rebuild(o);ctx.clearRect(0,0,w,h);ctx.drawImage(base,0,0);
  const lx=(o.light&&o.light.x!=null?o.light.x:0.32)*w,ly=(o.light&&o.light.y!=null?o.light.y:0.28)*h;
  ctx.save();pillow(ctx,w,h);ctx.clip();ctx.globalCompositeOperation='screen';
  const rad=ctx.createRadialGradient(lx,ly,4,lx,ly,w*0.34);
  rad.addColorStop(0,'rgba(255,255,255,.7)');rad.addColorStop(0.25,'rgba(255,255,255,.22)');rad.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=rad;ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation='soft-light';
  const streak=ctx.createLinearGradient(lx-80,ly-20,lx+100,ly+30);
  streak.addColorStop(0,'rgba(255,255,255,0)');streak.addColorStop(0.5,'rgba(255,255,255,.35)');streak.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=streak;ctx.fillRect(0,0,w,h);ctx.restore();
  const tear=Math.max(0,Math.min(1,o.tear||0));
  if(tear>0.02){ctx.save();pillow(ctx,w,h);ctx.clip();
   const path=o.path&&o.path.length>1?o.path:[{x:0.08,y:0.07},{x:0.08+tear*0.84,y:0.09}];
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);
   for(let i=path.length-1;i>=0;i--){const p=path[i];ctx.lineTo(p.x*w,Math.max(18,p.y*h)+(i%2?5:-4))}
   ctx.lineTo(path[0].x*w,0);ctx.closePath();ctx.fillStyle='#040404';ctx.fill();
   ctx.beginPath();ctx.moveTo(path[0].x*w,path[0].y*h);
   for(const p of path)ctx.lineTo(p.x*w,Math.max(18,p.y*h)+(Math.sin(p.x*30)*3));
   ctx.strokeStyle='#f2f2f2';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#111';ctx.lineWidth=1;ctx.stroke();ctx.restore();ribbon(ctx,o)}
  else if(o.curl>0)ribbon(ctx,o)}
 return{draw,w,h}}
return{make}})();
