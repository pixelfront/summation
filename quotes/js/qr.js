// Multi-frame QR hand-off. Ported from design sandbox v2 src/qr.js; M5 adds pc (photo credit) to the card meta
// and a strict sanitiser for what a receiver accepts (cleanCard).
// Multi-frame QR hand-off (v2). Encoder: vendored qrcodegen (Nayuki, MIT). Decoder: vendored jsQR (Apache-2.0).
// Wire format, one QR per frame, byte mode, ECC M:
//   [0x51 'Q'][ver=2][tid:4][idx:1][total:1][crc32(bundle):4][chunk <= CHUNK bytes]
// bundle = [flags:1 (bit0 = meta deflated)][metaLen:2][meta (deflate-raw JSON)][photo JPEG bytes]
// Accept code (single QR, text): QCA2:<tid hex>:<nonce>:<h>  where h = first 8 bytes of SHA-256(bundle) in hex.
window.QRX=(()=>{
const MAGIC=0x51,VER=2,HDR=12,CHUNK=300;
const CT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=~0;for(let i=0;i<b.length;i++)c=CT[(c^b[i])&255]^(c>>>8);return(~c)>>>0};
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const rand=n=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return a};
const enc=new TextEncoder(),dec=new TextDecoder();
async function deflate(b){if(window.CompressionStream){try{const s=new Blob([b]).stream().pipeThrough(new CompressionStream('deflate-raw'));return{b:new Uint8Array(await new Response(s).arrayBuffer()),z:1}}catch(_){}}return{b,z:0}}
async function inflate(b){const s=new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Uint8Array(await new Response(s).arrayBuffer())}
async function digest(b){try{if(crypto.subtle){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',b)).slice(0,8))}}catch(_){}
 const c=crc32(b);return(c.toString(16).padStart(8,'0')+crc32(b.slice().reverse()).toString(16).padStart(8,'0'))}
const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src});
// Hard photo compression for the wire: cover-crop to W x H (portrait, uniform scale), JPEG, step quality down until under budget.
async function squeezePhoto(src,W=168,H=236,budget=5600){const img=await loadImg(src),cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
 const k=Math.max(W/img.naturalWidth,H/img.naturalHeight),w=img.naturalWidth*k,h=img.naturalHeight*k;x.drawImage(img,(W-w)/2,(H-h)*.22,w,h); // uniform scale (never stretched), portrait 5:7 like the card front, crop biased to the face
 let q=.55,b;for(;;){const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',q));b=new Uint8Array(await blob.arrayBuffer());if(b.length<=budget||q<=.2)break;q-=.07}
 return{bytes:b,q:Math.round(q*100)/100,W,H,srcBytes:src.startsWith('data:')?Math.round((src.length-src.indexOf(',')-1)*3/4):0,srcW:img.naturalWidth,srcH:img.naturalHeight}}
async function buildOffer(d){const tid=rand(4),nonce=hex(rand(4));
 const meta={t:'offer',v:VER,id:d.id,n:nonce,c:{who:d.who,sh:d.sh,q:d.q,src:d.src,notes:d.notes||'',holo:d.holo?1:0,trot:d.trot?1:0,au:d.author||'',pc:d.pc||''}};
 const raw=enc.encode(JSON.stringify(meta)),z=await deflate(raw);
 const ph=photoSrc(d)?await squeezePhoto(photoSrc(d)):null,pb=ph?ph.bytes:new Uint8Array(0);
 const bundle=new Uint8Array(3+z.b.length+pb.length);bundle[0]=z.z;bundle[1]=z.b.length>>8;bundle[2]=z.b.length&255;bundle.set(z.b,3);bundle.set(pb,3+z.b.length);
 const crc=crc32(bundle),total=Math.max(1,Math.ceil(bundle.length/CHUNK));if(total>255)throw new Error('too big');
 const frames=[];for(let i=0;i<total;i++){const ch=bundle.subarray(i*CHUNK,(i+1)*CHUNK),f=new Uint8Array(HDR+ch.length);
  f.set([MAGIC,VER,...tid,i,total,crc>>>24,(crc>>>16)&255,(crc>>>8)&255,crc&255]);f.set(ch,HDR);frames.push(f)}
 const qrs=frames.map(f=>qrcodegen.QrCode.encodeBinary(Array.from(f),qrcodegen.QrCode.Ecc.MEDIUM));
 return{tid:hex(tid),nonce,frames,qrs,bundle,h:await digest(bundle),
  stats:{metaRaw:raw.length,metaZ:z.b.length,deflated:!!z.z,photo:ph&&{w:ph.W,h:ph.H,q:ph.q,bytes:pb.length,srcBytes:ph.srcBytes,srcW:ph.srcW,srcH:ph.srcH},total:bundle.length,frames:total,chunk:CHUNK,version:Math.max(...qrs.map(q=>q.version))}}}
// Receiver side: collect frames in any order, reassemble, verify.
function Assembler(){let tid=null,total=0,crc=0,parts=[],got=0;
 return{push(bytes){const b=bytes instanceof Uint8Array?bytes:Uint8Array.from(bytes);if(b.length<HDR||b[0]!==MAGIC||b[1]!==VER)return{kind:'junk'};
   const t=hex(b.subarray(2,6)),i=b[6],n=b[7],c=((b[8]<<24)|(b[9]<<16)|(b[10]<<8)|b[11])>>>0;
   if(t!==tid){tid=t;total=n;crc=c;parts=new Array(n);got=0}
   if(parts[i])return{kind:'dup',i,got,total};parts[i]=b.slice(HDR);got++;
   return{kind:'new',i,got,total,done:got===total}},
  get state(){return{tid,total,got,have:parts.map(p=>!!p)}},
  async finish(){const len=parts.reduce((a,p)=>a+p.length,0),bundle=new Uint8Array(len);let o=0;parts.forEach(p=>{bundle.set(p,o);o+=p.length});
   if(crc32(bundle)!==crc)throw new Error('checksum mismatch');
   const z=bundle[0],ml=(bundle[1]<<8)|bundle[2],mb=bundle.subarray(3,3+ml),pb=bundle.subarray(3+ml);
   const meta=JSON.parse(dec.decode(z?await inflate(mb):mb));
   let photo='';if(pb.length){photo=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(new Blob([pb],{type:'image/jpeg'}))})}
   return{meta,photo,tid,bundle,h:await digest(bundle),photoBytes:pb.length}}}}
// Received meta is untrusted input: keep only known fields, as plain strings/numbers with length caps.
// The photo is never taken from the meta; it is rebuilt locally from the JPEG bytes as a data:image/jpeg URL.
function cleanCard(meta,photo){const c=(meta&&meta.c)||{},S=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,n);
 const id=S(meta&&meta.id,40).replace(/[^A-Za-z0-9_-]/g,'');if(!id)throw new Error('offer has no card id');
 const d={id,who:S(c.who,120),sh:S(c.sh,40)||'Card',q:S(c.q,1200),src:S(c.src,200),notes:S(c.notes,300),holo:c.holo?1:0,
  trot:c.trot?1:0,author:S(c.au,60).replace(/[^a-z0-9_-]/gi,''),pc:S(c.pc,200),photo:/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo||'')?photo:'',recv:1};
 if(!d.photo)d.pc='';return d}
const acceptText=(tid,nonce,h)=>`QCA2:${tid}:${nonce}:${h}`;
function parseAccept(s){const m=/^QCA2:([0-9a-f]{8}):([0-9a-f]{8}):([0-9a-f]{16})$/.exec(s||'');return m&&{tid:m[1],nonce:m[2],h:m[3]}}
// Draw a QR into a canvas: dark modules on white with a 4-module quiet zone, as large as the canvas allows.
function draw(cv,qr){const N=qr.size+8,px=Math.floor(cv.width/N),off=Math.floor((cv.width-px*N)/2),x=cv.getContext('2d',{willReadFrequently:true});
 x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#000';
 for(let r=0;r<qr.size;r++)for(let c=0;c<qr.size;c++)if(qr.getModule(c,r))x.fillRect(off+(c+4)*px,off+(r+4)*px,px,px)}
function decodeCanvas(cv){const x=cv.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,cv.width,cv.height);return jsQR(d.data,cv.width,cv.height,{inversionAttempts:'dontInvert'})}
// Simulated phone camera: re-photographs the source canvas with tilt, wobble, noise and glare, then really decodes it with jsQR.
function simScan(src,vf,onHit,opt){opt=opt||{};const x=vf.getContext('2d',{willReadFrequently:true});let t0=performance.now(),stop=false,miss=opt.miss==null?.12:opt.miss;
 const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function tick(){if(stop)return;const t=(performance.now()-t0)/1000,W=vf.width;
  x.fillStyle='#1b1b1b';x.fillRect(0,0,W,W);
  x.save();x.translate(W/2+(RM?0:Math.sin(t*1.7)*6),W/2+(RM?0:Math.cos(t*1.3)*5));x.rotate((RM?2:Math.sin(t*.9)*4)*Math.PI/180);
  const s=W*.86/src.width;x.scale(s,s*(RM?1:.97+Math.sin(t*.7)*.02));x.drawImage(src,-src.width/2,-src.height/2);x.restore();
  const glare=Math.random()<miss;const g=x.createRadialGradient(W*.7,W*.25,0,W*.7,W*.25,W*(glare?.7:.35));g.addColorStop(0,glare?'rgba(255,255,255,.96)':'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,W,W);
  const r=decodeCanvas(vf);if(r)onHit(r,vf);
  // viewfinder chrome (drawn after decode so it never helps or hurts)
  x.strokeStyle='#ff2a2a';x.lineWidth=3;const m=W*.06,L=W*.14;[[m,m,1,1],[W-m,m,-1,1],[m,W-m,1,-1],[W-m,W-m,-1,-1]].forEach(([a,b,sx,sy])=>{x.beginPath();x.moveTo(a,b+L*sy);x.lineTo(a,b);x.lineTo(a+L*sx,b);x.stroke()});
  if(r){x.strokeStyle='#5dffb0';x.lineWidth=2;const l=r.location;x.beginPath();[l.topLeftCorner,l.topRightCorner,l.bottomRightCorner,l.bottomLeftCorner].forEach((p,i)=>x[i?'lineTo':'moveTo'](p.x,p.y));x.closePath();x.stroke()}
  setTimeout(tick,opt.every||110)}
 tick();return()=>{stop=true}}
// Real camera path (getUserMedia). iPhone Safari has no BarcodeDetector, so frames go through jsQR.
async function camScan(video,work,onHit){const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}},audio:false});
 video.srcObject=stream;video.setAttribute('playsinline','');video.muted=true;await video.play();let stop=false;const x=work.getContext('2d',{willReadFrequently:true});
 function tick(){if(stop)return;const vw=video.videoWidth,vh=video.videoHeight;if(vw){const k=Math.min(1,640/Math.max(vw,vh));work.width=vw*k|0;work.height=vh*k|0;x.drawImage(video,0,0,work.width,work.height);
  const d=x.getImageData(0,0,work.width,work.height),r=jsQR(d.data,work.width,work.height,{inversionAttempts:'dontInvert'});if(r)onHit(r)}
  setTimeout(tick,90)}
 tick();return()=>{stop=true;stream.getTracks().forEach(t=>t.stop());video.srcObject=null}}
return{buildOffer,cleanCard,Assembler,acceptText,parseAccept,draw,simScan,camScan,decodeCanvas,CHUNK,qrText:s=>qrcodegen.QrCode.encodeText(s,qrcodegen.QrCode.Ecc.MEDIUM)}})();
