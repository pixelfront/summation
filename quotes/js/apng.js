// 2A: HD transparent animated PNG (APNG) of the card turning front -> back -> front. Hand-written encoder, no library.
// Made on demand on this phone (never bundled, never uploaded). Frames come from export.js render(); outside the card
// is fully transparent. zlib via CompressionStream('deflate') where available, else stored (uncompressed) blocks.
(()=>{const $=s=>document.querySelector(s);
const CRC=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CRC[n]=c>>>0}
function crc(bufs){let c=0xFFFFFFFF;for(const b of bufs)for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
const u32=v=>new Uint8Array([v>>>24&255,v>>>16&255,v>>>8&255,v&255]),u16=v=>new Uint8Array([v>>>8&255,v&255]);
const asc=s=>new Uint8Array([...s].map(c=>c.charCodeAt(0)));
function cat(parts){let n=0;for(const p of parts)n+=p.length;const o=new Uint8Array(n);let i=0;for(const p of parts){o.set(p,i);i+=p.length}return o}
function chunk(type,data){const t=asc(type);return cat([u32(data.length),t,data,u32(crc([t,data]))])}
function adler(a){let s1=1,s2=0;for(let i=0;i<a.length;i++){s1=(s1+a[i])%65521;s2=(s2+s1)%65521}return((s2<<16)|s1)>>>0}
async function zlib(raw){if(typeof CompressionStream==='function'){const s=new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'));return new Uint8Array(await new Response(s).arrayBuffer())}
 const parts=[new Uint8Array([0x78,0x01])];for(let i=0;i<raw.length||i===0;i+=65535){const n=Math.min(65535,raw.length-i),last=i+n>=raw.length;
  parts.push(new Uint8Array([last?1:0,n&255,n>>8,~n&255,(~n>>8)&255]),raw.subarray(i,i+n));if(last)break}parts.push(u32(adler(raw)));return cat(parts)}
// PNG row filters: pick None/Sub/Up per row by the smallest sum of absolute values
function filter(px,w,h){const st=w*4,out=new Uint8Array((st+1)*h),a=new Uint8Array(st),b=new Uint8Array(st);
 for(let y=0;y<h;y++){const r=px.subarray(y*st,y*st+st),p=y?px.subarray((y-1)*st,y*st):null;let s0=0,s1=0,s2=0;
  for(let i=0;i<st;i++){const v=r[i],l=i>=4?r[i-4]:0,u=p?p[i]:0;a[i]=(v-l)&255;b[i]=(v-u)&255;s0+=v<128?v:256-v;s1+=a[i]<128?a[i]:256-a[i];s2+=b[i]<128?b[i]:256-b[i]}
  const o=y*(st+1);if(s1<=s0&&s1<=s2){out[o]=1;out.set(a,o+1)}else if(s2<s0){out[o]=2;out.set(b,o+1)}else{out[o]=0;out.set(r,o+1)}}return out}
// frames: [{x,y,w,h,px:Uint8ClampedArray RGBA}] ; frame 0 must cover the whole W x H canvas
async function encode(W,H,frames,delayMs,onp){const parts=[new Uint8Array([137,80,78,71,13,10,26,10])];let seq=0;
 parts.push(chunk('IHDR',cat([u32(W),u32(H),new Uint8Array([8,6,0,0,0])])));
 parts.push(chunk('acTL',cat([u32(frames.length),u32(0)])));
 for(let i=0;i<frames.length;i++){const f=frames[i];
  const ms=f.delayMs!=null?f.delayMs:delayMs;
  parts.push(chunk('fcTL',cat([u32(seq++),u32(f.w),u32(f.h),u32(f.x),u32(f.y),u16(ms),u16(1000),new Uint8Array([1,0])])));
  const z=await zlib(filter(f.px,f.w,f.h));
  parts.push(i===0?chunk('IDAT',z):chunk('fdAT',cat([u32(seq++),z])));if(onp)onp(i+1,frames.length)}
 parts.push(chunk('IEND',new Uint8Array(0)));return cat(parts)}
function bbox(d,W,H){let x0=W,y0=H,x1=-1,y1=-1;for(let y=0;y<H;y++){const o=y*W*4;for(let x=0;x<W;x++)if(d[o+x*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
 return x1<0?{x:0,y:0,w:1,h:1}:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1}}
async function make(onp,opt){opt=opt||{};const F=window.exportCard('front'),B=window.exportCard('back');
 const built=await window.SPIN.build(F,B,{faceW:opt.w||400,bg:null},onp),frames=[];
 const W=built.layout.W,H=built.layout.H;
 for(let k=0;k<built.frames.length;k++){const cv=built.frames[k].cv,x=cv.getContext('2d',{willReadFrequently:true});
  const d=x.getImageData(0,0,W,H).data,bb=k===0?{x:0,y:0,w:W,h:H}:bbox(d,W,H);
  const px=new Uint8ClampedArray(bb.w*bb.h*4);for(let y=0;y<bb.h;y++)px.set(d.subarray(((bb.y+y)*W+bb.x)*4,((bb.y+y)*W+bb.x+bb.w)*4),y*bb.w*4);
  frames.push(Object.assign(bb,{px,delayMs:built.frames[k].delayMs}))}
 const bytes=await encode(W,H,frames,0,null);bytes._layout=built.layout;bytes._frames=frames.length;return bytes}
let u=null;const btn=$('#exportApng');
btn.addEventListener('click',async()=>{const note=$('#expNote'),live=$('#live');btn.disabled=true;const lbl=btn.textContent;btn.textContent='Making APNG\u2026';
 try{const bytes=await make((i,n)=>{btn.textContent=`APNG ${i}/${n}`}),blob=new Blob([bytes],{type:'image/png'});if(u)URL.revokeObjectURL(u);u=URL.createObjectURL(blob);
  const fn=`${(window.CARD.short()||'card').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'card'}-spin-hd.png`;
  const img=$('#expImg'),dl=$('#expDl');img.src=u;img.alt='Animated transparent PNG of the card turning';dl.href=u;dl.download=fn;dl.textContent='Download APNG';$('#exp').hidden=false;
  const f=new File([blob],fn,{type:'image/png'}),can=navigator.canShare&&navigator.canShare({files:[f]});$('#expShare').hidden=!can;$('#expShare').onclick=()=>navigator.share({files:[f],title:'Quote card'}).then(()=>window.STATS&&STATS.exported()).catch(()=>{});
  const L=bytes._layout;note.textContent=`Animated PNG (APNG), not a video. Transparent background. Card face is 400 px wide inside a ${L?L.W+'\u00d7'+L.H:''} canvas. Full 360\u00b0 turn, front and back each held 0.9 s, ${bytes._frames||''} frames, ${(bytes.length/1048576).toFixed(1)} MB. Plays in Safari and Photos. Made on this device; nothing uploaded.`;live.textContent='Animated PNG exported'}
 catch(e){note.textContent='APNG export failed: '+(e&&e.message);$('#exp').hidden=false;live.textContent='APNG export failed'}
 finally{btn.disabled=false;btn.textContent=lbl}});
window.APNGX={make,encode,crc};})();
