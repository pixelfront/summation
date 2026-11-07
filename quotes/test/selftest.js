// Runs from quotes/index.html?view=card&card=5&selftest=1
// Checks the saved GIF and APNG, not the on-screen viewer.
(()=>{const $=s=>document.querySelector(s);
const out=document.createElement('pre');out.id='selftestOut';out.style.cssText='white-space:pre-wrap;font:12px ui-monospace,monospace;color:#f2f2f2;background:#000;padding:12px';
document.body.appendChild(out);
const lines=[];let failed=0;
function ok(name,cond,extra){lines.push((cond?'PASS ':'FAIL ')+name+(extra?' — '+extra:''));if(!cond)failed++;out.textContent=lines.join('\n');}
function pxCount(cv,fn){const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(fn(d[i],d[i+1],d[i+2],d[i+3]))n++;return n}
function bbox(cv,mode){const w=cv.width,h=cv.height,d=cv.getContext('2d').getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,a=d[i+3],s=d[i]+d[i+1]+d[i+2];
  const on=mode==='gif'?s>24:a>16;if(!on)continue;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 return x1<0?null:{x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1}}
function mean(cv,x,y,rw,rh){const d=cv.getContext('2d').getImageData(x,y,rw,rh).data;let r=0,g=0,b=0,n=0;
 for(let i=0;i<d.length;i+=4){if(d[i+3]<16)continue;r+=d[i];g+=d[i+1];b+=d[i+2];n++}return n?{r:r/n,g:g/n,b:b/n,n}:{r:0,g:0,b:0,n:0}}
async function decode(buf,type){const dec=new ImageDecoder({data:buf,type});await dec.tracks.ready;const track=dec.tracks.selectedTrack;const frames=[];
 for(let i=0;i<track.frameCount;i++){const r=await dec.decode({frameIndex:i});const img=r.image;const cv=document.createElement('canvas');
  cv.width=img.displayWidth;cv.height=img.displayHeight;cv.getContext('2d').drawImage(img,0,0);frames.push({cv,duration:img.duration});img.close()}
 dec.close();return frames}
function jpegApps(bytes){const apps=[];let i=2;if(bytes[0]!==0xFF||bytes[1]!==0xD8)return null;
 while(i+4<bytes.length){if(bytes[i]!==0xFF)break;const m=bytes[i+1];if(m===0xD9||m===0xDA)break;if(m===0xD8){i+=2;continue}const ln=(bytes[i+2]<<8)|bytes[i+3];
  if(m>=0xE0&&m<=0xEF)apps.push(m);i+=2+ln}return apps}
async function waitImgs(){const imgs=[...document.querySelectorAll('#card img')];await Promise.all(imgs.map(i=>i.complete&&i.naturalWidth?Promise.resolve():new Promise(r=>{i.onload=i.onerror=r})))}
async function run(){
 try{
  const tl=SPIN.timeline();
  ok('timeline length',tl.length===86,String(tl.length));
  ok('holds',tl[0].hold==='front'&&tl[0].delayMs===900&&tl[43].hold==='back'&&tl[43].angle===180&&tl[43].delayMs===900);
  ok('one direction',tl.every((f,i)=>i===0||f.angle>tl[i-1].angle));
  ok('turn frame counts',tl.filter(f=>f.angle>0&&f.angle<180).length===42&&tl.filter(f=>f.angle>180&&f.angle<360).length===42);
  ok('buttons are GIF and APNG',$('#exportGif').textContent.indexOf('GIF')>=0&&$('#exportApng').textContent.indexOf('APNG')>=0&&!/video/i.test($('#exportGif').textContent+$('#exportApng').textContent));
  const F=document.createElement('canvas');F.width=200;F.height=280;const B=document.createElement('canvas');B.width=200;B.height=280;
  const fx=F.getContext('2d');fx.fillStyle='#ff2040';fx.fillRect(0,0,100,280);fx.fillStyle='#2040ff';fx.fillRect(100,0,100,280);
  const bx=B.getContext('2d');bx.fillStyle='#f2f2f2';bx.fillRect(0,0,100,280);bx.fillStyle='#101010';bx.fillRect(100,0,100,280);
  const built=await SPIN.build(F,B,{faceW:160,bg:null});
  let marginFail=0,frontOk=false,backOk=false,minW=1e9,holdW=0;
  built.frames.forEach(f=>{const bb=bbox(f.cv,'a');if(!bb||bb.x0<4||bb.y0<4||f.cv.width-1-bb.x1<4||f.cv.height-1-bb.y1<4)marginFail++;
   if(!bb)return;if(bb.w<minW)minW=bb.w;if(f.angle===0)holdW=bb.w;
   if(f.angle===0){const L=mean(f.cv,bb.x0+4,bb.y0+8,20,40),R=mean(f.cv,bb.x1-24,bb.y0+8,20,40);frontOk=L.r>L.b+30&&R.b>R.r+30}
   if(f.angle===180){const L=mean(f.cv,bb.x0+4,bb.y0+8,16,40),R=mean(f.cv,bb.x1-20,bb.y0+8,16,40);backOk=L.r>R.r+40}});
  ok('synthetic margin ≥4 px',marginFail===0,marginFail+' frames failed');
  ok('front not mirrored',frontOk);
  ok('back upright, not mirrored',backOk);
  ok('edge-on is a strip',minW>=8&&holdW>0&&minW<holdW*0.45,minW+' vs '+holdW);
  await waitImgs();
  const back=exportCard('back'),front=exportCard('front');
  const red=pxCount(back,(r,g,b)=>r>180&&g<80&&b<80),light=pxCount(back,(r,g,b)=>r>170&&g>170&&b>170);
  ok('back export is not blank',red>200&&light>80,`red ${red} light ${light}`);
  const fMean=mean(front,front.width*0.3|0,front.height*0.45|0,40,40),bMean=mean(back,back.width*0.3|0,back.height*0.45|0,40,40);
  ok('front and back differ',Math.abs(fMean.r-bMean.r)+Math.abs(fMean.g-bMean.g)+Math.abs(fMean.b-bMean.b)>25,JSON.stringify(fMean)+' '+JSON.stringify(bMean));
  const photo=document.querySelector('#card .ph-img');
  ok('photo card loaded',!!photo&&photo.naturalWidth>0,photo?photo.naturalWidth+'px':'missing');
  const gif=await GIFX.make();
  ok('GIF bytes',gif[0]===0x47&&gif[1]===0x49&&gif[2]===0x46,gif.length+' bytes');
  const fit=window.__exportFit;
  ok('saved back fits the whole quote',!!(fit&&fit.ok&&fit.scroll<=fit.client&&!fit.more),fit?`px ${fit.px} ${fit.scroll}/${fit.client} more=${fit.more} tail=${fit.bodyTail}`:'no fit record');
  ok('saved back includes the quote ending',!!(fit&&/contending classes/.test(fit.bodyTail)),fit&&fit.bodyTail);
  ok('saved back keeps author and credit',!!(fit&&/marx/i.test(fit.author)&&/photo/i.test(fit.credit)),fit&&(fit.author+' | '+fit.credit));
  ok('on-screen long quote still scrolls',document.querySelector('#card').dataset.qmode==='scroll'&&!!document.querySelector('#card .more'));
  const gFrames=await decode(gif,'image/gif');
  ok('GIF frame count',gFrames.length===86,String(gFrames.length));
  const gDur=gFrames.map(f=>f.duration);
  ok('GIF hold duration',gDur[0]>=800000&&gDur[43]>=800000,gDur[0]+' / '+gDur[43]);
  let gMargin=0;gFrames.forEach(f=>{const bb=bbox(f.cv,'gif');if(!bb||bb.x0<4||bb.y0<4||f.cv.width-1-bb.x1<4||f.cv.height-1-bb.y1<4)gMargin++});
  ok('GIF decoded margin ≥4',gMargin===0,gMargin+' frames');
  const gFront=bbox(gFrames[0].cv,'gif'),gBack=bbox(gFrames[43].cv,'gif'),gEdge=bbox(gFrames[22].cv,'gif');
  ok('GIF faces are wide',gFront&&gBack&&gFront.w>200&&gBack.w>200,`front ${gFront&&gFront.w} back ${gBack&&gBack.w}`);
  ok('GIF edge is thin',gEdge&&gEdge.w<gFront.w*0.45&&gEdge.w>=8,gEdge&&String(gEdge.w));
  const backCv=gFrames[43].cv,bw=backCv.width,bh=backCv.height,bd=backCv.getContext('2d').getImageData(0,0,bw,bh).data;
  let badge=0,lowText=0;
  for(let y=(bh*0.50)|0;y<(bh*0.72)|0;y++)for(let x=(bw*0.55)|0;x<(bw*0.94)|0;x++){const i=(y*bw+x)*4;if(bd[i]>200&&bd[i+1]<80&&bd[i+2]<80)badge++}
  for(let y=(bh*0.58)|0;y<(bh*0.74)|0;y++)for(let x=(bw*0.14)|0;x<(bw*0.86)|0;x++){const i=(y*bw+x)*4;if(bd[i]>165&&bd[i+1]>165&&bd[i+2]>165)lowText++}
  ok('saved GIF back has no SCROLL badge',badge<120,'red pixels '+badge);
  ok('saved GIF back has the lower quote',lowText>80,'light pixels '+lowText);
  const apng=await APNGX.make();
  ok('APNG signature',apng[0]===137&&apng[1]===80, (apng.length/1048576).toFixed(2)+' MB');
  const aFrames=await decode(apng,'image/png');
  ok('APNG frame count',aFrames.length===86,String(aFrames.length));
  ok('APNG hold duration',aFrames[0].duration>=800000&&aFrames[43].duration>=800000,aFrames[0].duration+' / '+aFrames[43].duration);
  let aMargin=0,aClear=0;aFrames.forEach(f=>{const bb=bbox(f.cv,'a');if(!bb||bb.x0<4||bb.y0<4||f.cv.width-1-bb.x1<4||f.cv.height-1-bb.y1<4)aMargin++;
   const c=f.cv.getContext('2d').getImageData(2,2,1,1).data;if(c[3]!==0)aClear++});
  ok('APNG decoded margin ≥4',aMargin===0,aMargin+' frames');
  ok('APNG corner is transparent',aClear===0,aClear+' opaque corners');
  const man=await (await fetch('photos/manifest.json')).json();
  ok('manifest images',Array.isArray(man.images)&&man.images.length>=20,String(man.images.length));
  ok('manifest fields',man.images.every(p=>p.licence&&p.credit&&p.file&&p.author&&p.id&&(p.provenance==='contributor-supplied-unverified'?p.source==='':!!p.source)));
  await POOL.load();POOL.reset();
  const lenin=POOL.take('lenin',7).map(p=>p.id);
  ok('lenin no early repeat',new Set(lenin.slice(0,6)).size===6&&lenin[6]===lenin[0],lenin.join(','));
  const castro=POOL.take('castro',7).map(p=>p.id);
  ok('castro repeats only after pool',castro.length===7&&new Set(castro).size===1,castro[0]);
  const hosts=performance.getEntriesByType('resource').map(e=>new URL(e.name).host).filter(h=>h&&h!==location.host);
  ok('no third-party requests',hosts.length===0,hosts.slice(0,4).join(','));
  const sw=await (await fetch('/sw.js')).text();
  ok('pack photos are not precached',sw.indexOf('assets/packs/')<0);
  const src=document.createElement('canvas');src.width=80;src.height=80;const sx=src.getContext('2d');sx.fillStyle='#884422';sx.fillRect(0,0,80,80);sx.fillStyle='#e8d0b0';sx.fillRect(20,10,40,30);
  const blob=await new Promise(r=>src.toBlob(r,'image/jpeg',.9));
  const probe=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(blob)});
  REFORGE.useImage(probe);const baked=await REFORGE.bakeCurrent();
  ok('reforge jpeg ≤250KB',baked.size<=250*1024,baked.size+' bytes');
  const jb=new Uint8Array(await baked.arrayBuffer()),apps=jpegApps(jb);
  ok('reforge JPEG is APP0 only',apps&&apps.length===1&&apps[0]===0xE0,apps&&apps.map(n=>n.toString(16)).join(','));
  const before={id:VIEWER.data.id,q:VIEWER.data.q,who:VIEWER.data.who,sh:VIEWER.data.sh,src:VIEWER.data.src,rar:VIEWER.data.rar||'',holo:VIEWER.data.holo||0,pk:VIEWER.data.pk||0,photo:VIEWER.data.photo,pc:VIEWER.data.pc||''};
  const gold=Object.assign({},SAMPLE_DECK[4],{id:'selftest-gold',rar:'g',holo:1});
  const origPhoto=gold.photo, origPc=gold.pc||'';
  VIEWER.load(gold);await waitImgs();
  const gcv=exportCard('front');
  const goldN=pxCount(gcv,(r,g,b)=>r>170&&g>130&&b<120&&r>b+40);
  ok('gold trim survives export',goldN>30,String(goldN));
  document.getElementById('rfConfirm').click();
  await new Promise(r=>{const t0=performance.now(),t=setInterval(()=>{if(live().indexOf('Card reforged')>=0||live().indexOf('failed')>=0||performance.now()-t0>8000){clearInterval(t);r()}},40)});
  const after=VIEWER.data;
  ok('reforge keeps identity',after.id===gold.id&&after.q===gold.q&&after.who===gold.who&&after.rar==='g'&&after.holo===1&&after.pc==='Photo: own image'&&String(after.photo).indexOf('data:image/jpeg')===0, live());
  document.getElementById('reforgeUndo').click();
  await new Promise(r=>setTimeout(r,200));
  ok('undo restores the picture',VIEWER.data.photo===origPhoto&&(VIEWER.data.pc||'')===origPc);
  ok('sample card 5 identity untouched',before.id==='c05'&&SAMPLE_DECK.find(d=>d.id==='c05').q===before.q);
  const strip=document.createElement('canvas');strip.width=gFrames[0].cv.width*4;strip.height=gFrames[0].cv.height;const sctx=strip.getContext('2d');
  [0,22,43,64].forEach((n,i)=>sctx.drawImage(gFrames[n].cv,i*gFrames[0].cv.width,0));
  strip.id='gifStrip';document.body.appendChild(strip);
  lines.push('GIF '+gif.length+' bytes, APNG '+apng.length+' bytes, canvas '+gif._layout.W+'×'+gif._layout.H);
 }catch(e){ok('selftest threw',false,e&&(e.stack||e.message)||String(e))}
 out.textContent=lines.join('\n')+'\n'+(failed?'FAILED '+failed:'ALL PASS');
 document.documentElement.dataset.selftest=failed?'fail':'pass';
}
function live(){return ($('#live')&&$('#live').textContent)||''}
if(document.readyState==='complete')setTimeout(run,400);else addEventListener('load',()=>setTimeout(run,400));
})();
