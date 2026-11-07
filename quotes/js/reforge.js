// Reforge: replace only the picture on a card. Id, words, writer, rarity, pack origin and received status stay.
// The file is redrawn on a canvas (camera location data does not survive) and kept in IndexedDB on this device.
(()=>{const $=s=>document.querySelector(s),live=$('#live'),RM=matchMedia('(prefers-reduced-motion: reduce)');
const file=$('#rfFile'),crop=$('#rfCrop'),prev=$('#rfPrev'),box=$('#rf'),cv=$('#rfCv');
let img=null,url=null,zoom=1,panX=0,panY=0,drag=null,baked=null,undo=null,undoT=0,pts=new Map();
const VW=500,VH=700;
function resetPan(){const k=Math.max(VW/img.naturalWidth,VH/img.naturalHeight)*zoom,w=img.naturalWidth*k,h=img.naturalHeight*k;
 panX=Math.min(0,Math.max(VW-w,(VW-w)/2));panY=Math.min(0,Math.max(VH-h,(VH-h)*.28))}
function clamp(){const k=Math.max(VW/img.naturalWidth,VH/img.naturalHeight)*zoom,w=img.naturalWidth*k,h=img.naturalHeight*k;
 panX=Math.min(0,Math.max(VW-w,panX));panY=Math.min(0,Math.max(VH-h,panY));return{k,w,h}}
function drawCrop(){if(!img)return;const {w,h}=clamp(),x=cv.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,VW,VH);x.drawImage(img,panX,panY,w,h)}
function srcRect(){const {k}=clamp();return{sx:-panX/k,sy:-panY/k,sw:VW/k,sh:VH/k}}
function closeUI(){box.hidden=true;crop.hidden=true;prev.hidden=true;baked=null;if(url){URL.revokeObjectURL(url);url=null}img=null;file.value='';$('#reforge').focus()}
function cancel(){closeUI();live.textContent='Reforge cancelled. The card was not changed.'}
function stripApps(buf){const parts=[buf.subarray(0,2)];let i=2;
 while(i+4<=buf.length){if(buf[i]!==255){parts.push(buf.subarray(i));break}const m=buf[i+1];
  if(m===0xDA||m===0xD9){parts.push(buf.subarray(i));break}
  const end=i+2+((buf[i+2]<<8)|buf[i+3]);if(m<0xE0||m>0xEF||m===0xE0)parts.push(buf.subarray(i,end));i=end}
 let n=0;for(const p of parts)n+=p.length;const o=new Uint8Array(n);let k=0;for(const p of parts){o.set(p,k);k+=p.length}return o}
async function bake(){const {sx,sy,sw,sh}=srcRect(),W=571,H=800,out=document.createElement('canvas');out.width=W;out.height=H;
 const x=out.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,W,H);x.drawImage(img,sx,sy,sw,sh,0,0,W,H);
 let q=.8,blob=null;for(;;){blob=await new Promise(r=>out.toBlob(r,'image/jpeg',q));if(!blob)throw new Error('could not encode');
  const clean=stripApps(new Uint8Array(await blob.arrayBuffer()));blob=new Blob([clean],{type:'image/jpeg'});
  if(blob.size<=250*1024||q<=.5)break;q=Math.round((q-.08)*100)/100}
 return blob}
function split(cut){const oldC=$('#rfOld'),newC=$('#rfNew'),d=window.VIEWER&&VIEWER.data;const ox=oldC.getContext('2d'),nx=newC.getContext('2d');
 oldC.width=VW;oldC.height=VH;newC.width=VW;newC.height=VH;ox.fillStyle='#111';ox.fillRect(0,0,VW,VH);nx.fillStyle='#111';nx.fillRect(0,0,VW,VH);
 const ph=d&&photoSrc(d);const draw=(ctx,im)=>{if(!im)return;const k=Math.max(VW/im.naturalWidth,VH/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k;ctx.drawImage(im,(VW-w)/2,(VH-h)*.22,w,h)};
 const p=new Promise(res=>{if(!ph){res();return}const i=new Image();i.onload=()=>{draw(ox,i);res()};i.onerror=()=>res();i.src=ph});
 return p.then(()=>{nx.drawImage(cv,0,0);$('#rfSplit').style.setProperty('--cut',cut+'%')})}
function showPrev(){crop.hidden=true;prev.hidden=false;box.hidden=false;$('#rfRange').value='50';split(50).then(()=>{$('#rfConfirm').focus()})}
file.addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f){cancel();return}
 if(!/^image\//.test(f.type)&&!/\.(jpe?g|png|webp|gif|heic|bmp)$/i.test(f.name)){live.textContent='That file is not an image.';file.value='';return}
 if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(f);
 try{img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=url});zoom=1;resetPan();drawCrop();
  crop.hidden=false;prev.hidden=true;box.hidden=false;$('#rfNote').textContent='Drag to move the picture. Pinch or use the zoom buttons. Cancel leaves the card as it was.';
  $('#rfCropOk').focus();live.textContent='Crop the new picture. Nothing is saved until you confirm.'}
 catch(_){live.textContent='Could not read that image.';closeUI()}});
$('#reforge').addEventListener('click',()=>{if(!window.VIEWER||!VIEWER.data)return;file.click()});
$('#rfCropCancel').addEventListener('click',cancel);$('#rfPrevCancel').addEventListener('click',cancel);
$('#rfZoomIn').addEventListener('click',()=>{zoom=Math.min(5,zoom*1.18);drawCrop()});
$('#rfZoomOut').addEventListener('click',()=>{zoom=Math.max(1,zoom/1.18);drawCrop()});
cv.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p||!img)return;const r=cv.getBoundingClientRect(),sx=VW/r.width,sy=VH/r.height;
 if(pts.size>=2){const [a,b]=[...pts.values()];const dist0=p.dist||Math.hypot(b.x-a.x,b.y-a.y);p.x=e.clientX;p.y=e.clientY;const [c,d]=[...pts.values()];
  const dist=Math.hypot(d.x-c.x,d.y-c.y);if(dist0>8){zoom=Math.max(1,Math.min(5,zoom*(dist/dist0)));drawCrop()}p.dist=dist;return}
 const dx=(e.clientX-p.x)*sx,dy=(e.clientY-p.y)*sy;p.x=e.clientX;p.y=e.clientY;panX+=dx;panY+=dy;drawCrop()});
const up=e=>{pts.delete(e.pointerId)};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
$('#rfCropOk').addEventListener('click',async()=>{try{baked=await bake();showPrev();live.textContent='Before and after. Confirm to keep the new picture, or cancel.'}
 catch(err){live.textContent='Could not prepare that image. '+(err&&err.message||'')}});
$('#rfRange').addEventListener('input',()=>{$('#rfSplit').style.setProperty('--cut',$('#rfRange').value+'%')});
function blobToData(b){return new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=()=>no(f.error);f.readAsDataURL(b)})}
function dataUrlToBlob(u){const m=/^data:([^;,]*)(;base64)?,(.*)$/s.exec(u||'');if(!m)return null;const raw=m[2]?atob(m[3]):decodeURIComponent(m[3]);const a=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return new Blob([a],{type:m[1]||'image/jpeg'})}
function findCard(id){const s=STORE.get();return s.made.find(c=>c.id===id)||s.received.find(c=>c.id===id)||SAMPLE_DECK.find(c=>c.id===id)||(VIEWER.data&&VIEWER.data.id===id?VIEWER.data:null)}
async function commit(){const d=VIEWER.data;if(!d||!baked)return;const prevPhoto=d.photo||'',prevPc=d.pc||'';
 const data=await blobToData(baked);d.photo=data;d.pc='Photo: own image';
 const held=STORE.get().made.some(c=>c.id===d.id)||STORE.get().received.some(c=>c.id===d.id);
 if(held)STORE.update(d);if(STORE.saveReforge)await STORE.saveReforge(d.id,baked);
 closeUI();await play(prevPhoto,data);VIEWER.load(d);
 undo={id:d.id,photo:prevPhoto,pc:prevPc};const btn=$('#reforgeUndo');btn.hidden=false;clearTimeout(undoT);
 undoT=setTimeout(()=>{undo=null;btn.hidden=true},10000);
 live.textContent='Card reforged';btn.focus()}
$('#rfConfirm').addEventListener('click',()=>{commit().catch(e=>{live.textContent='Reforge failed. '+(e&&e.message||'')})});
$('#reforgeUndo').addEventListener('click',async()=>{if(!undo)return;const u=undo;undo=null;clearTimeout(undoT);$('#reforgeUndo').hidden=true;
 const d=findCard(u.id);if(!d){live.textContent='That card is no longer here.';return}
 d.photo=u.photo;d.pc=u.pc;const held=STORE.get().made.some(c=>c.id===d.id)||STORE.get().received.some(c=>c.id===d.id);
 if(held)STORE.update(d);
 if(u.photo.startsWith('data:')){const blob=dataUrlToBlob(u.photo);if(blob&&STORE.saveReforge)await STORE.saveReforge(d.id,blob)}
 else if(STORE.dropReforge)await STORE.dropReforge(d.id);
 if(VIEWER.data&&VIEWER.data.id===d.id)VIEWER.load(d);live.textContent='Reforge undone.'});
function play(oldSrc,newSrc){const card=window.CARD&&CARD.card;if(!card)return Promise.resolve();
 VIEWER.stop();card.style.transform='none';card.classList.remove('show-back');
 const hero=card.querySelector('.win')||card;const layer=document.createElement('canvas');layer.className='rf-fx';layer.width=300;layer.height=420;
 hero.appendChild(layer);const x=layer.getContext('2d');
 const load=src=>new Promise(res=>{if(!src){res(null);return}const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src});
 return Promise.all([load(oldSrc),load(newSrc)]).then(([a,b])=>{
  const buf=document.createElement('canvas');buf.width=300;buf.height=420;const bx=buf.getContext('2d');
  const paint=(im,dest)=>{bx.fillStyle='#000';bx.fillRect(0,0,300,420);if(im){const k=Math.max(300/im.naturalWidth,420/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k;bx.drawImage(im,(300-w)/2,(420-h)*.22,w,h)}(dest||x).drawImage(buf,0,0)};
  if(RM.matches){paint(a);const top=document.createElement('canvas');top.className='rf-fx';top.width=300;top.height=420;top.style.opacity='0';top.style.transition='opacity .2s linear';hero.appendChild(top);
   paint(b,top.getContext('2d'));const tag=document.createElement('span');tag.className='rf-tag';tag.textContent='Reforged';hero.appendChild(tag);
   requestAnimationFrame(()=>{top.style.opacity='1'});
   return new Promise(r=>setTimeout(()=>{layer.remove();top.remove();tag.remove();r()},220))}
  if(window.SFX&&SFX.reforge)SFX.reforge();
  const t0=performance.now();return new Promise(res=>{function frame(t){const k=Math.min(1,(t-t0)/1400);x.clearRect(0,0,300,420);
   if(k<.55){const m=k/.55;paint(a);const drop=m*m*150;x.drawImage(buf,0,0,300,420-drop,0,drop,300,420-drop);
    x.fillStyle=`rgba(160,12,12,${(.12+m*.4).toFixed(3)})`;for(let y=0;y<420;y+=5)if(((y/5)|0)%2===0)x.fillRect(0,y+m*36,300,2)}
   else if(k<.72){x.fillStyle='#140000';x.fillRect(0,0,300,420);const g=x.createLinearGradient(0,350,0,418);g.addColorStop(0,'rgba(255,42,42,0)');g.addColorStop(1,'#ff2a2a');x.fillStyle=g;x.fillRect(0,330,300,90)}
   else{const m=Math.min(1,(k-.72)/.28);paint(b);x.clearRect(0,0,300,420*(1-m));
    x.fillStyle='#ff2a2a';x.fillRect(0,420* (1-m)-2,300,3);
    x.strokeStyle=`rgba(255,42,42,${(.4+.6*Math.sin(Math.min(1,m)*Math.PI)).toFixed(3)})`;x.lineWidth=5;x.strokeRect(3,3,294,414)}
   if(k<1)requestAnimationFrame(frame);else{layer.remove();res()}}requestAnimationFrame(frame)})})
  .catch(()=>{layer.remove()})}
window.REFORGE={bake,srcRect,jpegOf:async()=>baked,useImage(im){img=im;zoom=1;resetPan();drawCrop()},async bakeCurrent(){baked=await bake();return baked}}})();
