// Feedback build: rotating GIF export. Hand-written, no library, no network.
// Paints the card front and back once (export.js render), then draws 24 frames of a Y-axis turn
// (horizontal squash + simple shading), quantises to a fixed 256-colour palette and encodes GIF89a with LZW here.
(()=>{const $=s=>document.querySelector(s);
// palette: 6x6x6 colour cube (216) + 40 greys
const PAL=new Uint8Array(768);for(let i=0;i<216;i++){PAL[i*3]=(i/36|0)*51;PAL[i*3+1]=((i/6|0)%6)*51;PAL[i*3+2]=(i%6)*51}
for(let g=0;g<40;g++){const v=Math.round(g*255/39);PAL[(216+g)*3]=PAL[(216+g)*3+1]=PAL[(216+g)*3+2]=v}
function quant(d,n){const o=new Uint8Array(n);for(let i=0,p=0;i<n;i++,p+=4){const r=d[p],g=d[p+1],b=d[p+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);
 o[i]=mx-mn<14?216+Math.round((r+g+b)/3*39/255):Math.round(r/51)*36+Math.round(g/51)*6+Math.round(b/51)}return o}
// GIF LZW (min code size 8), variable code width up to 12 bits, clear on full table.
function lzw(px){const out=[];let cur=0,bits=0,size=9;const put=c=>{cur|=c<<bits;bits+=size;while(bits>=8){out.push(cur&255);cur>>=8;bits-=8}};
 const CLR=256,EOI=257;let dict=new Map(),next=258;put(CLR);let w=px[0];
 for(let i=1;i<px.length;i++){const k=px[i],key=w*256+k;const hit=dict.get(key);if(hit!==undefined){w=hit;continue}
  put(w);if(next<4096){dict.set(key,next++);if(next>(1<<size)&&size<12)size++}else{put(CLR);dict=new Map();next=258;size=9}w=k}
 put(w);put(EOI);if(bits>0)out.push(cur&255);return out}
function encode(W,H,frames,delay){const b=[];const s=t=>{for(const c of t)b.push(c.charCodeAt(0))},w16=v=>b.push(v&255,v>>8&255);
 const delays=Array.isArray(delay)?delay:frames.map(()=>delay);
 s('GIF89a');w16(W);w16(H);b.push(0xF7,0,0);for(const v of PAL)b.push(v);
 b.push(0x21,0xFF,11);s('NETSCAPE2.0');b.push(3,1,0,0,0);
 for(let fi=0;fi<frames.length;fi++){const f=frames[fi],dl=delays[fi]|0;b.push(0x21,0xF9,4,0,dl&255,dl>>8,0,0);b.push(0x2C);w16(0);w16(0);w16(W);w16(H);b.push(0);b.push(8);
  const d=lzw(f);for(let i=0;i<d.length;i+=255){const n=Math.min(255,d.length-i);b.push(n);for(let j=0;j<n;j++)b.push(d[i+j])}b.push(0)}
 b.push(0x3B);return new Uint8Array(b)}
async function make(){const F=window.exportCard('front'),B=window.exportCard('back');
 const built=await window.SPIN.build(F,B,{faceW:300,bg:'#000'}),frames=[],delays=[];
 for(const f of built.frames){const cv=f.cv,x=cv.getContext('2d',{willReadFrequently:true});
  frames.push(quant(x.getImageData(0,0,cv.width,cv.height).data,cv.width*cv.height));delays.push(f.delayCs)}
 const bytes=encode(built.layout.W,built.layout.H,frames,delays);bytes._layout=built.layout;bytes._frames=built.frames.length;return bytes}
let u=null;
$('#exportGif').addEventListener('click',async()=>{const btn=$('#exportGif'),note=$('#expNote'),live=$('#live');btn.disabled=true;btn.textContent='Making GIF\u2026';
 try{const bytes=await make(),blob=new Blob([bytes],{type:'image/gif'});if(u)URL.revokeObjectURL(u);u=URL.createObjectURL(blob);
  const fn=`${(window.CARD.short()||'card').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'card'}-spin.gif`;
  const img=$('#expImg'),dl=$('#expDl');img.src=u;img.alt='Rotating GIF of the card';dl.href=u;dl.download=fn;dl.textContent='Download GIF';$('#exp').hidden=false;
  const f=new File([blob],fn,{type:'image/gif'}),can=navigator.canShare&&navigator.canShare({files:[f]});$('#expShare').hidden=!can;$('#expShare').onclick=()=>navigator.share({files:[f],title:'Quote card'}).then(()=>window.STATS&&STATS.exported()).catch(()=>{});
  note.textContent=`Rotating GIF (not a video). Card face is 300 px wide inside a ${bytes._layout?bytes._layout.W+'×'+bytes._layout.H:''} canvas. Full 360° turn, front and back each held 0.9 s, ${bytes._frames||''} frames, black background, ${(bytes.length/1024).toFixed(0)} KB. Made on this device; nothing uploaded.`;live.textContent='GIF exported'}
 catch(e){note.textContent='GIF export failed: '+(e&&e.message);$('#exp').hidden=false;live.textContent='GIF export failed'}
 finally{btn.disabled=false;btn.textContent='Export rotating GIF'}});
// PNG run resets the download label
$('#export').addEventListener('click',()=>{$('#expDl').textContent='Download PNG'});
window.GIFX={make,encode};})();
