// Shared turntable for the rotating GIF and the animated PNG (APNG). Not a video.
// One continuous 360 degree turn in one direction: hold the front, turn to the back,
// hold the back upright and unmirrored, turn the same way back to the front.
// The canvas is padded so the card, including its edge and the perspective taper, stays inside every frame.
(()=>{
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
// 42 frames on each turn (inside 36-48). Holds are single long frames, not extra turn frames.
function timeline(){const N=42,frames=[{angle:0,delayCs:90,delayMs:900,hold:'front'}];
 for(let i=1;i<=N;i++){const e=ease(i/(N+1));frames.push({angle:e*180,delayCs:2,delayMs:21,hold:null})}
 frames.push({angle:180,delayCs:90,delayMs:900,hold:'back'});
 for(let i=1;i<=N;i++){const e=ease(i/(N+1));frames.push({angle:180+e*180,delayCs:2,delayMs:21,hold:null})}
 return frames}
function layout(fw,fh){const t=Math.max(14,fw*0.055),D=fw*4.6,m=10;
 let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
 for(let deg=0;deg<360;deg+=2){const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  for(const x of [-fw/2,fw/2])for(const y of [-fh/2,fh/2])for(const z of [-t/2,t/2]){
   const xr=x*c+z*s,zr=-x*s+z*c,sc=D/(D-zr),px=xr*sc,py=y*sc;
   if(px<minX)minX=px;if(px>maxX)maxX=px;if(py<minY)minY=py;if(py>maxY)maxY=py}}
 const W=Math.ceil(maxX-minX+m*2),H=Math.ceil(maxY-minY+m*2);
 return{fw,fh,t,D,W,H,ox:m-minX,oy:m-minY}}
function paint(ctx,F,B,angleDeg,L,opt){opt=opt||{};
 const a=angleDeg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const {fw,fh,t,D,W,H,ox,oy}=L,hw=fw/2,hh=fh/2,ht=t/2;
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
 if(opt.bg){ctx.fillStyle=opt.bg;ctx.fillRect(0,0,W,H)}
 const proj=(x,y,z)=>{const xr=x*c+z*s,zr=-x*s+z*c,sc=D/(D-zr);return[xr*sc+ox,y*sc+oy,zr]};
 const faces=[];
 const solid=(pts,col)=>{let z=0;for(const p of pts)z+=p[2];faces.push({z:z/4,pts,col})};
 solid([proj(-hw,-hh,ht),proj(-hw,-hh,-ht),proj(-hw,hh,-ht),proj(-hw,hh,ht)],'#3a1818');
 solid([proj(hw,-hh,-ht),proj(hw,-hh,ht),proj(hw,hh,ht),proj(hw,hh,-ht)],'#542020');
 solid([proj(-hw,-hh,-ht),proj(hw,-hh,-ht),proj(hw,-hh,ht),proj(-hw,-hh,ht)],'#241010');
 solid([proj(-hw,hh,ht),proj(hw,hh,ht),proj(hw,hh,-ht),proj(-hw,hh,-ht)],'#140808');
 if(c>0.035)faces.push({z:proj(0,0,ht)[2],img:F,z0:ht,mirror:false,shade:0.38+0.62*c});
 if(c<-0.035)faces.push({z:proj(0,0,-ht)[2],img:B,z0:-ht,mirror:true,shade:0.38+0.62*(-c)});
 faces.sort((p,q)=>p.z-q.z);
 const off=paint._off||(paint._off=document.createElement('canvas'));
 for(const f of faces){if(!f.img){ctx.beginPath();ctx.moveTo(f.pts[0][0],f.pts[0][1]);for(let i=1;i<4;i++)ctx.lineTo(f.pts[i][0],f.pts[i][1]);ctx.closePath();ctx.fillStyle=f.col;ctx.fill();
   ctx.strokeStyle='#6a3030';ctx.lineWidth=1.25;ctx.stroke();continue}
  if(off.width!==W||off.height!==H){off.width=W;off.height=H}
  const o=off.getContext('2d');o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,W,H);o.imageSmoothingEnabled=true;
  // One piece when the face is square to the camera. In perspective, strips overlap by 2px
  // so canvas rounding cannot open a transparent slit between them (the shutter lines).
  const img=f.img,faceOn=Math.abs(c)>0.985;
  const strip=(u0,u1,x0,x1,grow)=>{
   const p00=proj(x0,-hh,f.z0),p10=proj(x1,-hh,f.z0),p01=proj(x0,hh,f.z0);
   let vx=p10[0]-p00[0],vy=p10[1]-p00[1];const len=Math.hypot(vx,vy)||1;
   if(grow){vx*=1+grow/len;vy*=1+grow/len}
   o.setTransform(vx,vy,p01[0]-p00[0],p01[1]-p00[1],p00[0],p00[1]);
   let sx=u0*img.width,sw=(u1-u0)*img.width;if(grow){sx=Math.max(0,sx-1);sw=Math.min(img.width-sx,sw+2)}
   o.drawImage(img,sx,0,Math.max(1,sw),img.height,0,0,1,1)};
  if(faceOn){const x0=f.mirror?hw:-hw,x1=f.mirror?-hw:hw;strip(0,1,x0,x1,0)}
  else{const cols=64;for(let i=0;i<cols;i++){const u0=i/cols,u1=(i+1)/cols;
   const x0=f.mirror?(0.5-u0)*fw:(u0-0.5)*fw,x1=f.mirror?(0.5-u1)*fw:(u1-0.5)*fw;
   strip(u0,u1,x0,x1,i===cols-1?0:2)}}
  o.setTransform(1,0,0,1,0,0);
  if(f.shade<0.995){o.globalCompositeOperation='source-atop';o.fillStyle=`rgba(0,0,0,${((1-f.shade)*0.72).toFixed(3)})`;o.fillRect(0,0,W,H);o.globalCompositeOperation='source-over'}
  ctx.drawImage(off,0,0)}}
async function build(F,B,opt,onp){opt=opt||{};const faceW=opt.faceW||300,fh=Math.round(F.height*faceW/F.width),L=layout(faceW,fh),tl=timeline(),frames=[];
 for(let i=0;i<tl.length;i++){const cv=document.createElement('canvas');cv.width=L.W;cv.height=L.H;
  paint(cv.getContext('2d'),F,B,tl[i].angle,L,opt);frames.push(Object.assign({cv},tl[i]));
  if(i%4===3)await new Promise(r=>setTimeout(r,0));if(onp)onp(i+1,tl.length)}
 return{frames,layout:L,timeline:tl}}
window.SPIN={timeline,layout,paint,build,ease}})();
