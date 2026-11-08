// Quote Deck pack. Original foil wrapper: printed wordmark, red star, silhouette band,
// heat-sealed crimps, and a holo film drawn on top each frame. Not a faceted pillow reskin.
// No borrowed pack layout. No WebGL.
window.FOIL=(()=>{
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function make(w,h){const base=document.createElement('canvas');base.width=w;base.height=h;
 const bx=54,by=86,bw=w-108,bh=h-168,rad=22;
 let built='';
 function crimp(ctx,y,dir){const x0=bx+8,x1=bx+bw-8,n=18,tw=(x1-x0)/n;
  for(let i=0;i<n;i++){const a=x0+i*tw,b=a+tw,mid=(a+b)/2,tooth=dir*(i%2?16:9);
   const g=ctx.createLinearGradient(mid,y,mid,y+tooth);
   g.addColorStop(0,'#f3f3f3');g.addColorStop(.35,'#9a9a9a');g.addColorStop(.7,'#3a3a3a');g.addColorStop(1,'#141414');
   ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(a,y);ctx.lineTo(mid,y+tooth);ctx.lineTo(b,y);ctx.closePath();ctx.fill();
   ctx.strokeStyle='rgba(0,0,0,.65)';ctx.lineWidth=1;ctx.stroke()}
  ctx.strokeStyle='#ff2a2a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y+dir*2);ctx.lineTo(x1,y+dir*2);ctx.stroke()}
 function bust(ctx,cx,cy,s){ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);ctx.fillStyle='#0a0a0a';
  ctx.beginPath();ctx.ellipse(0,-18,16,18,0,0,7);ctx.fill();
  ctx.beginPath();ctx.moveTo(-28,28);ctx.quadraticCurveTo(-22,-2,0,-6);ctx.quadraticCurveTo(22,-2,28,28);ctx.closePath();ctx.fill();ctx.restore()}
 function rebuild(o){const key=(o.name||'')+'|'+(o.user?1:0)+'|'+w+'x'+h;if(key===built)return;built=key;
  const x=base.getContext('2d');x.clearRect(0,0,w,h);
  x.fillStyle='rgba(0,0,0,.45)';x.beginPath();x.ellipse(w*.52,by+bh+46,bw*.42,16,0,0,7);x.fill();
  rr(x,bx,by,bw,bh,rad);x.save();x.clip();
  const foil=x.createLinearGradient(bx,by,bx+bw,by+bh);
  foil.addColorStop(0,'#2a2a2a');foil.addColorStop(.18,'#0c0c0c');foil.addColorStop(.5,'#1a1a1a');foil.addColorStop(1,'#070707');
  x.fillStyle=foil;x.fillRect(bx,by,bw,bh);
  x.fillStyle='#140404';x.fillRect(bx,by+bh*.58,bw,bh*.2);
  bust(x,bx+bw*.5,by+bh*.7,3.1);
  x.fillStyle='#f4f4f4';x.textAlign='center';x.textBaseline='middle';
  x.font='800 34px ui-monospace,Menlo,monospace';x.fillText('QUOTE DECK',bx+bw/2,by+52);
  x.fillStyle='#ff2a2a';x.font='700 42px ui-monospace,Menlo,monospace';x.fillText('\u2605',bx+bw/2,by+102);
  x.fillStyle='#f2f2f2';x.font='800 40px ui-monospace,Menlo,monospace';x.fillText(String(o.name||'SERIES').slice(0,14),bx+bw/2,by+168);
  x.fillStyle='#c8c8c8';x.font='700 18px ui-monospace,Menlo,monospace';x.fillText(o.sub||'7 CARDS',bx+bw/2,by+206);
  x.strokeStyle=o.user?'#d4af37':'#ff2a2a';x.lineWidth=3;x.strokeRect(bx+18,by+18,bw-36,bh-36);
  x.restore();
  x.save();x.lineWidth=10;x.strokeStyle='#0a0a0a';rr(x,bx,by,bw,bh,rad);x.stroke();
  x.lineWidth=3;x.strokeStyle=o.user?'#d4af37':'#ff2a2a';x.stroke();
  x.lineWidth=1;x.strokeStyle='rgba(255,255,255,.4)';x.stroke();x.restore();
  crimp(x,by,-1);crimp(x,by+bh,1)}
 function holo(ctx,o){const lx=(o.light&&o.light.x!=null?o.light.x:.35),ly=(o.light&&o.light.y!=null?o.light.y:.3);
  const sweep=(o.sweep!=null?o.sweep:lx);
  ctx.save();rr(ctx,bx,by,bw,bh,rad);ctx.clip();
  ctx.globalCompositeOperation='screen';
  const g=ctx.createLinearGradient(bx+bw*(sweep-.2),by,bx+bw*(sweep+.45),by+bh);
  g.addColorStop(0,'rgba(255,40,40,0)');g.addColorStop(.35,'rgba(255,60,90,.18)');g.addColorStop(.5,'rgba(255,220,160,.28)');
  g.addColorStop(.66,'rgba(80,180,255,.16)');g.addColorStop(1,'rgba(255,40,40,0)');
  ctx.fillStyle=g;ctx.fillRect(bx,by,bw,bh);
  const radg=ctx.createRadialGradient(bx+bw*lx,by+bh*ly,8,bx+bw*lx,by+bh*ly,bw*.45);
  radg.addColorStop(0,'rgba(255,255,255,.55)');radg.addColorStop(.4,'rgba(255,255,255,.08)');radg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=radg;ctx.fillRect(bx,by,bw,bh);
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<7;i++){const sx=bx+28+(i*97)% (bw-40),sy=by+40+((i*53)% (bh-80));
   const near=1-Math.min(1,Math.abs(((sx-bx)/bw)-sweep)*3);
   ctx.globalAlpha=.15+near*.75;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx,sy,1.6+near*1.4,0,7);ctx.fill()}
  ctx.restore()}
 function tear(ctx,o){const t=Math.max(0,Math.min(1,o.tear||0));if(t<0.02)return;
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillRect(bx-4,by-28,(bw+8)*t,34);ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';
  const flash=Math.max(.25,(o.flash||0));
  ctx.strokeStyle=`rgba(255,255,255,${flash.toFixed(3)})`;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+bw*t,by);ctx.stroke();
  ctx.strokeStyle=`rgba(255,40,40,${(flash*.7).toFixed(3)})`;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+bw*t,by);ctx.stroke();ctx.restore();
  if(t>0.15){ctx.save();ctx.translate(bx+bw*t,by-8);ctx.rotate(-0.55-t*.9);
   const gw=78;const g=ctx.createLinearGradient(0,-8,0,10);g.addColorStop(0,'#f7f7f7');g.addColorStop(.5,'#8a8a8a');g.addColorStop(1,'#222');
   ctx.fillStyle=g;ctx.fillRect(-4,-7,gw,14);ctx.strokeStyle='#ff2a2a';ctx.lineWidth=1.5;ctx.strokeRect(-4,-7,gw,14);ctx.restore()}}
 function draw(ctx,o){rebuild(o);ctx.clearRect(0,0,w,h);
  ctx.save();
  const lift=(o.lift||0)*18,shake=Math.sin((o.shake||0)*12)*(o.shake||0)*6;
  ctx.translate(shake,-lift);
  ctx.drawImage(base,0,0);holo(ctx,o);tear(ctx,o);ctx.restore()}
 return{draw,w,h}}
return{make}})();
