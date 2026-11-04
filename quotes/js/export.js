// Export the face you are looking at as a 900x1260 PNG. Hand-rolled: no html2canvas. Ported from design sandbox v2 src/export.js.
// It lays the card flat for one synchronous moment, reads the DOM boxes and per-letter text boxes,
// and repaints them onto a canvas. Holo is a static frame at the current tilt.
(()=>{const $=s=>document.querySelector(s);const OUT=900;
const SVGNS='http://www.w3.org/2000/svg';
function col(c){return c&&c!=='transparent'&&!/rgba\([^)]*,\s*0\)$/.test(c)}
function rays(x,cx,cy,R,step,on,color,alpha){x.save();x.globalAlpha*=alpha;x.fillStyle=color;
 for(let a=0;a<360;a+=step){const a0=(a-90)*Math.PI/180,a1=(a+on-90)*Math.PI/180;x.beginPath();x.moveTo(cx,cy);x.arc(cx,cy,R,a0,a1);x.closePath();x.fill()}x.restore()}
function svgPaint(x,svg,r){const vb=svg.viewBox.baseVal;if(!vb||!vb.width)return;const sx=r.width/vb.width,sy=r.height/vb.height;
 const keep=svg.getAttribute('preserveAspectRatio')!=='none',s=keep?Math.min(sx,sy):1;
 svg.querySelectorAll('path,polygon').forEach(el=>{const cs=getComputedStyle(el);if(cs.display==='none')return;
  let d=el.getAttribute('d');if(!d){const p=el.getAttribute('points').trim().split(/[\s,]+/).map(Number);d='M'+p.slice(0,2).join(' ')+p.slice(2).reduce((a,v,i)=>a+(i%2?' '+v:' L'+v),'')+' Z'}
  x.save();x.translate(r.left,r.top);x.scale(keep?s:sx,keep?s:sy);const path=new Path2D(d);
  const fill=el.getAttribute('fill')||cs.fill;if(fill&&fill!=='none'){x.fillStyle=fill;x.fill(path)}
  let st=el.getAttribute('stroke')||cs.stroke;if(st&&st!=='none'){if(/url\(/.test(st)){const g=x.createLinearGradient(0,0,vb.width,vb.height);[[0,'#fff'],[.25,'#7a7a7a'],[.5,'#f2f2f2'],[.75,'#5a5a5a'],[1,'#d8d8d8']].forEach(c=>g.addColorStop(...c));st=g}
   x.strokeStyle=st;x.lineJoin='round';const nss=(el.getAttribute('vector-effect')||cs.vectorEffect)==='non-scaling-stroke';x.lineWidth=(parseFloat(el.getAttribute('stroke-width')||cs.strokeWidth)||1)/(nss?(keep?s:Math.min(sx,sy)):1);x.stroke(path)}
  x.restore()})}
function text(x,el,cs){const tn=[...el.childNodes].filter(n=>n.nodeType===3&&n.data.trim());if(!tn.length)return null;
 x.font=`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;x.fillStyle=cs.color;x.textBaseline='alphabetic';
 const m=x.measureText('Hg'),desc=m.fontBoundingBoxDescent!=null?m.fontBoundingBoxDescent:parseFloat(cs.fontSize)*.22,up=cs.textTransform==='uppercase';
 const rg=document.createRange();let first=null,last=null;
 for(const n of tn){for(let i=0;i<n.data.length;i++){const ch=n.data[i];rg.setStart(n,i);rg.setEnd(n,i+1);const r=rg.getClientRects()[0];if(!r||!r.width)continue;
  if(/\s/.test(ch))continue;if(!first)first=r;last=r;x.fillText(up?ch.toUpperCase():ch,r.left,r.bottom-desc)}}
 return{first,last,desc}}
function pseudo(x,el,t){if(!t||!t.first)return;for(const w of['::before','::after']){const p=getComputedStyle(el,w),c=p.content;if(!c||c==='none'||c==='normal')continue;
 const s=c.replace(/^["']|["']$/g,'').replace(/\\([0-9a-f]{4})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));if(!s)continue;
 x.save();x.font=`${p.fontStyle} ${p.fontWeight} ${p.fontSize} ${p.fontFamily}`;x.fillStyle=p.color;const wd=x.measureText(s).width;
 if(w==='::before')x.fillText(s,t.first.left-wd,t.first.bottom-t.desc);else x.fillText(s,t.last.right,t.last.bottom-t.desc);x.restore()}}
function paint(x,el,a,ctx){const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return;
 if(el.classList.contains('fx'))return; // effects are painted on purpose below
 const r=el.getBoundingClientRect();a*=parseFloat(cs.opacity);if(a<=0)return;
 x.save();x.globalAlpha=a;
 if(cs.overflow!=='visible'||el.classList.contains('win')){x.beginPath();x.rect(r.left,r.top,r.width,r.height);x.clip()}
 if(cs.filter&&cs.filter!=='none'&&'filter'in x)x.filter=cs.filter;
 if(col(cs.backgroundColor)){x.fillStyle=cs.backgroundColor;x.fillRect(r.left,r.top,r.width,r.height)}
 if(el.classList.contains('grid')){const ho=ctx.card.classList.contains('holo-on');const cx=r.left+r.width/2,cy=r.top+r.height*.92,R=Math.hypot(r.width,r.height);
  const g=x.createRadialGradient(cx,ho?r.top+r.height*.7:cy,0,cx,ho?r.top+r.height*.7:cy,R*.75);g.addColorStop(0,ho?'#4a4a4a':'#1a0000');g.addColorStop(1,ho?'#141414':'#000');
  x.fillStyle=g;x.fillRect(r.left,r.top,r.width,r.height);rays(x,cx,cy,R,9,1.4,'#ff2a2a',1)}
 if(el.classList.contains('bk')){rays(x,r.left+r.width/2,r.top+r.height*1.2,r.height*2,10,2,'rgba(255,42,42,.08)',1)}
 if(el.classList.contains('bk-notes')){x.save();x.fillStyle='#262626';for(let y=r.top+24+21;y<r.bottom;y+=22)x.fillRect(r.left,y,r.width,1);x.restore()}
 if(el.classList.contains('mid')){x.strokeStyle='#f2f2f2';x.lineWidth=2;x.beginPath();x.ellipse(r.left+r.width/2,r.top+r.height/2,r.width/2-1,r.height/2-1,0,0,7);x.stroke()}
 if(el.tagName==='IMG'&&el.complete&&el.naturalWidth){const k=Math.max(r.width/el.naturalWidth,r.height/el.naturalHeight),w=el.naturalWidth*k,h=el.naturalHeight*k;const op=(cs.objectPosition||'50% 50%').split(' ').map(v=>/%$/.test(v)?parseFloat(v)/100:.5);x.drawImage(el,r.left+(r.width-w)*op[0],r.top+(r.height-h)*(op[1]==null?.5:op[1]),w,h)}
 // borders
 for(const[s,f]of[['Top',(w)=>[r.left,r.top,r.width,w]],['Bottom',(w)=>[r.left,r.bottom-w,r.width,w]],['Left',(w)=>[r.left,r.top,w,r.height]],['Right',(w)=>[r.right-w,r.top,w,r.height]]]){
  const w=parseFloat(cs['border'+s+'Width']);if(w>0&&cs['border'+s+'Style']!=='none'&&col(cs['border'+s+'Color'])){x.fillStyle=cs['border'+s+'Color'];x.fillRect(...f(w))}}
 x.filter='none';
 if(el instanceof SVGSVGElement){svgPaint(x,el,r);x.restore();return}
 const t=text(x,el,cs);
 for(const c of el.children)paint(x,c,1,ctx);
 pseudo(x,el,t||lastText(el));
 if(el.classList.contains('win')&&ctx.card.classList.contains('holo-on'))foil(x,r,ctx);
 x.restore()}
function lastText(el){// for pseudo quotes on spans, find text box of own text
 return null}
function foil(x,r,ctx){const s=getComputedStyle(ctx.card),v=n=>s.getPropertyValue(n).trim();
 const ang=(115+parseFloat(v('--ang')||0))*Math.PI/180,t=parseFloat(v('--tilt'))||0,sx=parseFloat(v('--sx'))/100,sy=parseFloat(v('--sy'))/100;
 const C=ctx.cr,W3=C.width*3,H3=C.height*3,cx=C.left-2*C.width*sx+W3/2,cy=C.top-2*C.height*sy+H3/2; // background-size:300%, background-position:sx sy
 const half=(Math.abs(W3*Math.sin(ang))+Math.abs(H3*Math.cos(ang)))/2,dx=Math.sin(ang)*half,dy=-Math.cos(ang)*half,g=x.createLinearGradient(cx-dx,cy-dy,cx+dx,cy+dy);
 ['#ff2a2a','#ffcf4a','#5dffb0','#4ac8ff','#a46bff','#ff4ad8','#ff2a2a','#ffcf4a'].forEach((c,i)=>g.addColorStop([0,.14,.28,.42,.56,.7,.84,1][i],c));
 x.save();x.globalAlpha=.25+t*.75;x.globalCompositeOperation='color-dodge';x.fillStyle=g;x.fillRect(r.left,r.top,r.width,r.height);
 x.globalCompositeOperation='screen';x.globalAlpha=t*.6;const px=C.left+C.width*sx,py=C.top+C.height*sy,rr=C.width*.42;
 x.fillStyle='#fff';for(let yy=r.top;yy<r.bottom;yy+=9)for(let xx=r.left;xx<r.right;xx+=9){const d=Math.hypot(xx-px,yy-py);if(d<rr){x.globalAlpha=t*.6*(1-d/rr);x.fillRect(xx,yy,1.2,1.2)}}
 x.globalCompositeOperation='overlay';x.globalAlpha=1;const gl=x.createRadialGradient(px,py,0,px,py,C.width*.6);gl.addColorStop(0,'rgba(255,255,255,.5)');gl.addColorStop(.58,'rgba(255,255,255,.08)');gl.addColorStop(1,'rgba(255,255,255,0)');
 x.fillStyle=gl;x.fillRect(r.left,r.top,r.width,r.height);x.restore()}
function render(){const {card}=window.CARD,b=window.CARD.showingBack,face=b?window.CARD.back:window.CARD.front;
 const keep=card.style.transform;card.style.transform=b?'rotateY(180deg)':'none';
 const cr=card.getBoundingClientRect(),S=OUT/cr.width,cv=document.createElement('canvas');cv.width=OUT;cv.height=Math.round(cr.height*S);
 const x=cv.getContext('2d');x.scale(S,S);x.translate(-cr.left,-cr.top);
 const W=cr.width,H=cr.height,L=cr.left,T=cr.top;x.beginPath();[[.06,0],[1,0],[1,.95714],[.94,1],[0,1],[0,.04286]].forEach(([a,c],i)=>x[i?'lineTo':'moveTo'](L+a*W,T+c*H));x.closePath();x.clip();
 x.fillStyle='#000';x.fillRect(L,T,W,H);
 try{for(const c of face.children)paint(x,c,1,{card,cr})}finally{card.style.transform=keep}
 return cv}
const box=$('#exp'),img=$('#expImg'),dl=$('#expDl'),note=$('#expNote');let blob=null,u=null;
async function run(){SFX.shutter();window.CARD.card.classList.remove('flash');void window.CARD.card.offsetWidth;window.CARD.card.classList.add('flash');
 const cv=render(),side=window.CARD.showingBack?'back':'front',fn=`${(window.CARD.short()||'card').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'card'}-${side}.png`;
 // A portrait loaded from a file:// page taints the canvas in Chrome/Safari. Over http(s) (GitHub Pages, local server) it is same-origin and fine.
 try{blob=await new Promise((r,j)=>{try{cv.toBlob(b=>b?r(b):j(new Error('empty')),'image/png')}catch(err){j(err)}})}
 catch(err){box.hidden=false;img.removeAttribute('src');img.alt='';dl.removeAttribute('href');$('#expShare').hidden=true;
  note.textContent='Export blocked: this page was opened as a file, so the browser will not let the photo be copied. Open it from a local server or the live site instead.';
  document.getElementById('live').textContent='Export failed';return}if(u)URL.revokeObjectURL(u);u=URL.createObjectURL(blob);
 img.src=u;img.alt=`Exported ${side} of the card, ${cv.width} by ${cv.height} pixels`;dl.href=u;dl.download=fn;box.hidden=false;
 const f=new File([blob],fn,{type:'image/png'});const can=navigator.canShare&&navigator.canShare({files:[f]});$('#expShare').hidden=!can;
 $('#expShare').onclick=()=>navigator.share({files:[f],title:'Quote card'}).catch(()=>{});
 note.textContent=`${cv.width}\u00d7${cv.height} PNG of the ${side}. ${can?'Share opens the iPhone share sheet (Save Image is in there).':'Download saves the file.'} Made on this device; nothing uploaded.`;
 document.getElementById('live').textContent='Card exported';if(!document.body.classList.contains('shot'))box.scrollIntoView({behavior:'smooth',block:'nearest'})}
$('#export').addEventListener('click',run);$('#expClose').addEventListener('click',()=>{box.hidden=true;$('#export').focus()});
window.exportCard=render;window.runExport=run;
})();
