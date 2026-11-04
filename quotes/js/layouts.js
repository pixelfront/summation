// Layouts milestone: card layout math (Fan default, Grid, Gallery, Pickup) + on-device prefs. Loaded before box.js.
// Ported from design mock layouts-v1/js/app.js. Positions are card centres in the cards zone (W x H); box.js converts.
window.LAYOUTS=(()=>{
const NAMES=['fan','grid','gallery','pickup'],KEY='qc-layout';
const P=new URLSearchParams(location.search);
let name=P.get('layout');if(!NAMES.includes(name)){try{name=localStorage.getItem(KEY)}catch(_){name=null}}if(!NAMES.includes(name))name='fan';
let pile={},fs=false;
let seed=+(P.get('seed')||Date.now()%1e9);const rnd=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const wrapD=(d,N)=>{d=((d%N)+N)%N;return d>N/2?d-N:d};
function spot(id,N){if(!pile[id])pile[id]={fx:rnd(),fy:rnd(),r:(rnd()-.5)*70,z:1+Math.floor(rnd()*N)};return pile[id]}
const L={
 fan(k,N,off,W,H){const s=Math.min(W*(fs?.38:.3)/300,H*.4/420),R=fs?H*.9:H*1.1,cy=H*(fs?.36:.46),st=fs?11:9,d=wrapD(k-off,N),a=d*st*Math.PI/180,c=Math.abs(d)<.5;
  return{x:W/2+Math.sin(a)*R,y:cy+(1-Math.cos(a))*R*.9+(c?-10:0),r:d*st,s:s*(c?1.22:1),z:50-Math.round(Math.abs(d)*2)+(d<0?0:1),o:Math.abs(d)>3.2?0:1}},
 grid(k,N,off,W,H){const pad=12,gap=10;let b=null;
  for(let c=2;c<=6;c++){const rows=Math.ceil(N/c);let cw=(W-pad*2-gap*(c-1))/c;cw=Math.min(cw,((H-pad*2-gap*(rows-1))/rows)/1.4);if(!b||cw>b.cw)b={c,rows,cw}}
  const{c,rows,cw}=b,ch=cw*1.4,tw=c*cw+(c-1)*gap,th=rows*ch+(rows-1)*gap,x0=(W-tw)/2,y0=(H-th)/2;
  return{x:x0+(k%c)*(cw+gap)+cw/2,y:y0+Math.floor(k/c)*(ch+gap)+ch/2,r:0,s:cw/300,z:10,o:1}},
 gallery(k,N,off,W,H){const gap=12,th=Math.min(H*.19,120),ts=th/420,tw=300*ts,bs=Math.min((H-th-gap*3)/420,W*.74/300),d=wrapD(k-off,N);
  if(Math.abs(d)<.5)return{x:W/2+d*60,y:gap+420*bs/2,r:0,s:bs,z:60,o:1};
  const x=W/2+d*(tw+8);return{x,y:H-gap-th/2,r:0,s:ts,z:30-Math.round(Math.abs(d)),o:(x<-tw||x>W+tw)?0:1}},
 pickup(k,N,off,W,H,id){const s=Math.min(W*.3/300,H*.34/420),mx=300*s*.5,my=420*s*.5,p=spot(id,N);
  return{x:mx+p.fx*(W-mx*2),y:my+p.fy*(H-my*2),r:p.r,s,z:p.z,o:1}}};
return{NAMES,get name(){return name},get fs(){return fs},set fs(v){fs=!!v},
 set(n,persist){if(!NAMES.includes(n))n='fan';name=n;if(persist!==false){try{localStorage.setItem(KEY,n)}catch(_){}}return n},
 pos(k,N,off,W,H,id){return L[name](k,N,off,W,H,id)},
 drop(){pile={}},spot,
 lift(id,N){const p=spot(id,N);p.z=Math.max(0,...Object.values(pile).map(q=>q.z))+1;return p},
 stackScale(W,H){return Math.min(W*.3/300,H*.34/420)},
 scrolls(){return name==='fan'||name==='gallery'}}})();
