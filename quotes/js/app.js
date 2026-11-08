// M4: boot waits for STORE.ready (IndexedDB load) before the first box build is used.
// M2 app shell: two views on one page. Box (Box B carousel) -> Card (M1 viewer: rotate, flip, export).
// URL params: ?state=open|sel|shuffle [&id=c03|&sel=k] [&off=k] [&lidnow]  ·  ?view=card&card=1..7 [&side=back]
//   ·  ?view=make [&q=search] [&filt=all|photo] [&author=id] [&flip=1] [&open]   (no quote/src prefill since M5)
//   ·  ?view=send&card=<id> [&auto=1&stop=frames|rx|got]  ·  ?view=receive  ·  &shot
window.APP=(()=>{const $=s=>document.querySelector(s);const P=new URLSearchParams(location.search);
if(P.has('shot'))document.body.classList.add('shot');
document.body.insertAdjacentHTML('beforeend',CHROME_DEFS);wireMute($('#mute'));
const live=$('#live'),views={box:$('#boxView'),card:$('#cardView'),make:$('#makeView'),send:$('#sendView'),pack:$('#packView'),guess:$('#guessView')},holo=$('#holo');let cur='box';
function show(v,focusEl){Object.entries(views).forEach(([k,el])=>el.hidden=k!==v);cur=v;
 $('#crumb').textContent={box:'CARD BOX \u00b7 '+(window.SKINUI?SKINUI.crumb():'B TERMINAL DRAWER'),card:'CARD \u00b7 ROTATE + EXPORT',make:'NEW CARD',send:'SEND BY QR \u00b7 ONE COPY',pack:'PACKS \u00b7 TEAR + FAN',guess:'GUESS THE WRITER'}[v];
 window.SPEAK&&SPEAK.stop('view');if(v!=='pack'&&window.PACKS)PACKS.leave();if(v==='box'&&window.CASES)CASES.refresh();
 if(v!=='card')VIEWER.stop();window.scrollTo(0,0);if(focusEl)setTimeout(()=>focusEl.focus({preventScroll:true}),30)}
function view(d,rot){show('card');VIEWER.load(d,rot);$('#exp').hidden=true;holo.checked=!!d.holo;
 $('#cardH').textContent=`${cardNo(d)} \u00b7 ${d.sh.toUpperCase()}`;
 $('#stage').focus({preventScroll:true});live.textContent=`Card view. ${d.who}. Drag to spin it.`}
$('#cardBack').addEventListener('click',()=>{const id=VIEWER.data&&VIEWER.data.id;show('box');BOX.rebuild();BOX.initState('open');
 const i=BOX.deck.findIndex(d=>d.id===id);if(i>=0)BOX.select(i)});
holo.addEventListener('change',()=>{const d=VIEWER.data;if(!d)return;d.holo=holo.checked?1:0;const c=window.CARD.card;c&&c.classList.toggle('holo-on',holo.checked);
 STORE.update(d);live.textContent=holo.checked?'Holo foil on':'Holo foil off'});
// ---------- M5 send sheet: multi-frame QR offer -> receive -> accept -> burn (ported from design sandbox v2 src/app.js) ----------
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const A={qr:$('#qrA'),vf:$('#vfA'),vid:$('#camA'),work:document.createElement('canvas'),strip:$('#stripA'),stat:$('#statA'),thumb:$('#thumbA')};
const B={qr:$('#qrB'),vf:$('#vfB'),vid:$('#camB'),work:document.createElement('canvas'),strip:$('#stripB'),stat:$('#statB'),got:$('#gotB')};
let S=null;const FPS=RM.matches?3:6,TIMEOUT=+P.get('timeout')||120;
function steps(k){document.querySelectorAll('#steps li').forEach((li,i)=>{li.classList.toggle('done',i<k);li.classList.toggle('on',i===k);li.setAttribute('aria-current',i===k?'step':'false')})}
function strip(el,n,lit,curI){if(el.childElementCount!==n)el.innerHTML='<i></i>'.repeat(n);[...el.children].forEach((c,i)=>{c.classList.toggle('on',!!lit[i]);c.classList.toggle('cur',i===curI)})}
function stopAll(){if(!S)return;['cyc','scanB','scanA','camA','camB','timer'].forEach(k=>{if(S[k]){typeof S[k]==='function'?S[k]():clearInterval(S[k]);S[k]=null}})}
const kb=n=>n<1024?n+' B':(n/1024).toFixed(1)+' KB';
function showOnly(pane,which){pane.qr.hidden=which!=='qr';pane.vf.hidden=which!=='vf';pane.vid.hidden=which!=='vid'}
function clearVF(cv,txt){const x=cv.getContext('2d',{willReadFrequently:true}),W=cv.width;x.fillStyle='#0b0b0b';x.fillRect(0,0,W,W);x.fillStyle='#ff2a2a';x.font=`700 ${W/16|0}px ui-monospace,Menlo,monospace`;x.textAlign='center';x.fillText(txt,W/2,W/2)}
const NO_SEND='Demo cards stay on this phone and cannot be sent. Make your own card to send one.';
async function send(d,mode){mode=mode||'send';if(mode==='send'&&!d)return false;
 if(mode==='send'&&isSample(d.id)){if(S)closeSend();live.textContent=NO_SEND;return false} // Chair decision: demo cards are never sendable (no wire rekey)
 stopAll();show('send');
 S={d,mode,phase:'build',asm:QRX.Assembler(),rx:null,accepted:false};
 $('#paneA').hidden=mode==='receive';$('#sendH').textContent=mode==='receive'?'RECEIVE A CARD':'SEND BY QR \u00b7 ONE COPY';
 $('#crumb').textContent=mode==='receive'?'RECEIVE BY QR':'SEND BY QR \u00b7 ONE COPY';
 $('#bTitle').textContent=mode==='receive'?'THIS PHONE \u00b7 RECEIVER':'PHONE B \u00b7 RECEIVER (SIMULATED HERE)';
 $('#aRow').hidden=false;$('#bRow').hidden=false;B.got.hidden=true;B.got.innerHTML='';$('#sendDone').hidden=true;$('#sendClose').hidden=false;$('#sendClose').textContent='Cancel';
 $('#bSim').hidden=mode==='receive';$('#aSim').disabled=true;$('#aCam').disabled=true;$('#bSim').disabled=false;$('#bCam').disabled=false;
 document.body.classList.toggle('solo',mode!=='receive'&&!$('#soloB').checked);$('#soloB').parentElement.hidden=mode==='receive';
 strip(B.strip,0,[]);strip(A.strip,0,[]);B.stat.textContent=mode==='receive'?'Tap Use camera, then hold this phone over the sender\u2019s screen.':'Waiting. Tap \u201cPoint at Phone A\u201d to scan the cycling code.';showOnly(B,'vf');clearVF(B.vf,'NO SIGNAL');
 if(mode==='receive'){steps(1);setTimeout(()=>$('#bCam').focus(),40);return}
 steps(0);A.thumb.innerHTML=cardHTML(d);fitQuote(A.thumb.firstElementChild,d);A.thumb.classList.remove('burning','burned');
 A.stat.textContent='Packing card and squeezing photo\u2026';showOnly(A,'qr');clearVF(A.qr,'PACKING');
 // old M3/M4 ids were 'm'+time: those travel under a fresh random id so no clock leaves the phone. The local copy still burns by its own id.
 const wire=LEGACY_ID.test(d.id)?Object.assign({},d,{id:newCardId()}):d;
 try{S.offer=await QRX.buildOffer(wire)}catch(e){A.stat.textContent='Could not pack this card: '+e.message;return}
 if(!S||S.d!==d)return;S.wireId=wire.id;
 const o=S.offer,st=o.stats;$('#plStats').innerHTML=
  `<dt>Card text</dt><dd>${kb(st.metaRaw)} JSON \u2192 ${kb(st.metaZ)} ${st.deflated?'deflate':'raw (no CompressionStream)'}</dd>`+
  (st.photo?`<dt>Photo</dt><dd>${st.photo.srcW}\u00d7${st.photo.srcH} \u2192 ${st.photo.w}\u00d7${st.photo.h} JPEG q${st.photo.q} ${kb(st.photo.bytes)}</dd>`:`<dt>Photo</dt><dd>none on this card (placeholder bust)</dd>`)+
  `<dt>Payload</dt><dd>${kb(st.total)} \u2192 <b>${st.frames} frame${st.frames>1?'s':''}</b> \u00d7 \u2264${st.chunk} B, QR v${st.version} ECC M</dd>`+
  `<dt>Loop</dt><dd>${(st.frames/FPS).toFixed(1)} s at ${FPS} fps</dd>`;
 S.phase='offer';S.idx=0;S.left=TIMEOUT;SFX.offer();$('#aCam').disabled=false; /* real two-phone use: the sender can scan the receiver's accept code any time during the offer */
 const draw=()=>{QRX.draw(A.qr,o.qrs[S.idx]);A.qr.setAttribute('aria-label',`Offer QR code, frame ${S.idx+1} of ${o.qrs.length}. Hold the other phone over it.`);strip(A.strip,o.qrs.length,o.qrs.map((_,i)=>i===S.idx),S.idx);SFX.frame(S.idx)};
 draw();const cy=setInterval(()=>{S.idx=(S.idx+1)%o.qrs.length;draw()},1000/FPS);S.cyc=()=>clearInterval(cy);
 S.timer=setInterval(()=>{S.left--;if(S.phase==='offer')statA();if(S.left<=0&&!S.accepted)expire()},1000);
 statA();live.textContent=`Offering ${d.sh}. ${o.qrs.length} QR frames are cycling. The card is locked until the receiver's accept code is scanned.`;
 if(P.get('auto'))autoRun()}
function statA(){const m=Math.floor(S.left/60),s=String(S.left%60).padStart(2,'0');A.stat.innerHTML=`<b>OFFERING</b> \u00b7 card locked \u00b7 unlocks in ${m}:${s} if no accept`}
function expire(){stopAll();S.phase='expired';S.offer=null;A.stat.innerHTML='<b class="bad">OFFER EXPIRED</b> \u00b7 card unlocked, nothing burned';showOnly(A,'qr');clearVF(A.qr,'EXPIRED');$('#aSim').disabled=true;$('#aCam').disabled=true;SFX.deny();live.textContent='Offer expired. Your card is unlocked.';steps(-1)}
// receiver: every decoded frame goes here (simulated or real camera)
async function onFrame(r){if(!S||S.phase==='done'||S.rxDone)return;const res=S.asm.push(r.binaryData);if(res.kind!=='new')return;
 if(S.mode!=='receive')steps(1);const st=S.asm.state;strip(B.strip,st.total,st.have);SFX.got(res.i);
 B.stat.innerHTML=`<b>RECEIVING</b> \u00b7 ${res.got}/${res.total} frames \u00b7 ${Math.round(res.got/res.total*100)}%`;
 if(res.got===1||res.got===res.total||(res.got%Math.max(1,Math.round(res.total/4))===0))live.textContent=`Receiving: ${res.got} of ${res.total} frames.`;
 if(res.done){S.rxDone=true;stopRx();try{S.rx=await S.asm.finish();S.got=QRX.cleanCard(S.rx.meta,S.rx.photo)}catch(e){B.stat.textContent='Checksum failed. Scan again.';S.asm=QRX.Assembler();S.rxDone=false;SFX.deny();return}
  gotCard()}}
function stopRx(){['scanB','camB'].forEach(k=>{if(S[k]){S[k]();S[k]=null}})}
function gotCard(){const m=S.rx.meta;let d=S.got;
 // the wire carries no card number (Privacy): the receiver numbers it from its own live cards
 if(S.mode!=='receive')d=Object.assign({},d,{no:nextNo()});
 // a real receiver keeps the card only if this phone has never burned that id and does not hold it already; refused = no accept code, so the sender keeps theirs
 if(S.mode==='receive'){const why=STORE.receive(Object.assign({},d,{no:nextNo()}));
  if(why!=='ok'){SFX.deny();$('#bRow').hidden=true;showOnly(B,'vf');clearVF(B.vf,'REFUSED');
   B.stat.innerHTML=why==='burned'?'<b class="bad">REFUSED</b> \u00b7 this card already left this phone once (tombstone), so it cannot come back. No accept code, so the sender keeps it.':'<b class="bad">REFUSED</b> \u00b7 this phone already has this card. No accept code, so the sender keeps it.';
   live.textContent='Card refused. No accept code shown.';$('#sendDone').hidden=false;$('#sendClose').hidden=true;steps(-1);return}
  S.got=d=STORE.get().received.find(x=>x.id===d.id)||d}
 SFX.done();B.got.hidden=false;$('#bRow').hidden=true;B.got.innerHTML=cardHTML(d);const c=B.got.firstElementChild;c.classList.add('interactive');c.removeAttribute('aria-hidden');c.setAttribute('role','img');c.setAttribute('aria-label',`Received card: ${d.who}, \u201c${d.q}\u201d${d.photo?', with photo':''}`);fitQuote(c,d);
 const acc=QRX.acceptText(S.rx.tid,m.n,S.rx.h);S.acceptText=acc;showOnly(B,'qr');QRX.draw(B.qr,QRX.qrText(acc));B.qr.setAttribute('aria-label','Accept QR code. Show this to the sender so their copy burns.');
 B.stat.innerHTML=`<b>GOT IT</b> \u00b7 ${kb(S.rx.bundle.length)}${S.rx.photoBytes?`, photo ${kb(S.rx.photoBytes)}`:''} \u00b7 checksum OK \u00b7 ${S.mode==='receive'?'saved to your box. ':''}Show this accept code to the sender.`;
 live.textContent=`Card received${d.photo?' with its photo':''}. An accept code is now showing for the sender to scan.`;
 if(S.mode==='receive'){$('#sendDone').hidden=false;$('#sendClose').hidden=true;steps(2)}
 else{steps(2);$('#aSim').disabled=false;$('#aCam').disabled=false;A.stat.innerHTML='<b>WAITING FOR ACCEPT</b> \u00b7 scan the code on Phone B to finish. Card still locked.'}}
function nextNo(){const s=STORE.get();return Math.max(0,...BASE_DECK.filter(d=>!s.burned.includes(d.id)).map(d=>d.no),...s.received.map(d=>d.no||0),...s.made.map(d=>d.no||0))+1}
// sender: scan the receiver's accept code; only an exact match (transfer id, nonce, hash) burns
async function onAccept(r){if(!S||S.accepted||!S.offer)return;const a=QRX.parseAccept(r.data);if(!a)return;
 const o=S.offer;if(a.tid!==o.tid||a.nonce!==o.nonce||a.h!==o.h){A.stat.innerHTML='<b class="bad">WRONG CODE</b> \u00b7 that accept is for a different offer. Nothing burned.';SFX.deny();return}
 S.accepted=true;stopAll();S.phase='done';steps(3);showOnly(A,'qr');clearVF(A.qr,'ACCEPT \u2713');
 A.stat.innerHTML='<b>ACCEPT VERIFIED</b> \u00b7 id, nonce and hash match. Burning your copy\u2026';
 await new Promise(r=>setTimeout(r,RM.matches?0:350));SFX.burn();A.thumb.classList.add('burning');
 setTimeout(()=>{A.thumb.classList.remove('burning');A.thumb.classList.add('burned');A.thumb.innerHTML='';if(window.STATS)STATS.handed(S.d.id);STORE.burn(S.d.id);
  $('#aRow').hidden=true;A.stat.innerHTML=`<b>BURNED</b> \u00b7 ${esc(S.d.sh)} is gone from this phone. Tombstone written.`;
  B.stat.innerHTML+=' <b class="ok">Sender confirmed \u2713</b>';$('#sendDone').hidden=false;$('#sendClose').hidden=true;
  live.textContent=`Sent. ${S.d.sh} left your box. The other phone has it now.`;$('#sendDone').focus({preventScroll:true})},RM.matches?0:780)}
$('#bSim').addEventListener('click',()=>{if(!S||!S.offer||S.rxDone)return;stopRx();showOnly(B,'vf');B.stat.textContent='Scanning Phone A\u2026';$('#bSim').disabled=true;S.scanB=QRX.simScan(A.qr,B.vf,onFrame,{every:P.has('auto')?80:110})});
$('#aSim').addEventListener('click',()=>{if(!S||!S.acceptText)return;if(S.cyc){S.cyc();S.cyc=null}showOnly(A,'vf');A.stat.innerHTML='<b>SCANNING</b> \u00b7 looking for the accept code\u2026';$('#aSim').disabled=true;S.scanA=QRX.simScan(B.qr,A.vf,onAccept,{miss:.05})});
async function cam(pane,key,handler,btn){try{if(S.cyc&&pane===A){S.cyc();S.cyc=null}showOnly(pane,'vid');btn.disabled=true;const s0=S,stop=await QRX.camScan(pane.vid,pane.work,handler);
  // the first frame can decode before camScan resolves: if that already finished the job, turn the camera straight off
  if(S!==s0||(pane===B&&s0.rxDone)||(pane===A&&s0.accepted)){stop();return}S[key]=stop;pane.stat.innerHTML='<b>CAMERA ON</b> \u00b7 hold steady over the other screen'}
 catch(e){showOnly(pane,'vf');clearVF(pane.vf,'NO CAMERA');btn.disabled=false;pane.stat.textContent=`Camera unavailable (${e.name||e.message}). Use the simulate button, or open this page over https on a phone.`}}
$('#bCam').addEventListener('click',()=>{if(S)cam(B,'camB',onFrame,$('#bCam'))});
$('#aCam').addEventListener('click',()=>{if(S)cam(A,'camA',onAccept,$('#aCam'))});
function closeSend(){stopAll();if(S&&!S.accepted&&S.mode!=='receive')live.textContent='Send cancelled. Card unlocked, nothing burned.';S=null;$('#sendClose').hidden=false;
 [A.qr,B.qr].forEach(cv=>clearVF(cv,''));B.got.innerHTML='';A.thumb.innerHTML='';$('#plStats').innerHTML='';show('box');BOX.rebuild();BOX.initState('open')}
$('#sendClose').addEventListener('click',closeSend);$('#sendDone').addEventListener('click',closeSend);
$('#soloB').addEventListener('change',e=>document.body.classList.toggle('solo',!e.target.checked));
$('#receive').addEventListener('click',()=>send(null,'receive'));
$('#guess').addEventListener('click',()=>{show('guess');GUESS.open()});
$('#guessBack').addEventListener('click',()=>{show('box');if(window.STATS)STATS.render()});
$('#cardSend').addEventListener('click',()=>{if(VIEWER.data&&!isSample(VIEWER.data.id))send(VIEWER.data)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&cur==='send')closeSend()});
// scripted run for screenshots/tests: ?view=send&card=<id>&auto=1[&stop=frames|rx|got]
async function autoRun(){const stp=P.get('stop');if(stp==='frames')return;await new Promise(r=>setTimeout(r,300));$('#bSim').click();
 const until=f=>new Promise(r=>{const t=setInterval(()=>{if(!S||f()){clearInterval(t);r()}},60)});
 if(stp==='rx'){await until(()=>S.asm.state.got>=Math.ceil(S.asm.state.total*.6));stopRx();return}
 await until(()=>S.acceptText);if(stp==='got')return;await new Promise(r=>setTimeout(r,300));$('#aSim').click();await until(()=>S.phase==='done')}
function boot(){if(P.get('view')==='make'){show('make');CREATOR.preset()}
else if(P.get('view')==='send'){const d=currentDeck().find(d=>d.id===P.get('card'));if(!d||isSample(d.id)){show('box');BOX.rebuild();BOX.initState();live.textContent=d?NO_SEND:'That card is not in your box.'}else send(d)}
else if(P.get('view')==='receive')send(null,'receive');
else if(P.get('view')==='packs'){show('pack');if(window.PACKS)PACKS.enter(P);else document.addEventListener('DOMContentLoaded',()=>PACKS.enter(P))} // boot can run before packs.js has loaded
else if(P.get('view')==='guess'){show('guess');if(window.GUESS)GUESS.open()}
else if(P.get('view')==='card'){const k=Math.max(0,Math.min(SAMPLE_DECK.length-1,(parseInt(P.get('card'),10)||1)-1));
 view(SAMPLE_DECK[k],P.get('side')==='back'?{ry:180}:null)}
else{show('box');BOX.rebuild();BOX.initState(P.get('state'))}
document.documentElement.dataset.store=STORE.persistent?'idb':'memory';
if(window.STATS)STATS.render();
if(P.get('selftest')){const sc=document.createElement('script');sc.src='test/selftest.js';document.body.appendChild(sc)}}
show(({make:'make',card:'card',send:'send',receive:'send',packs:'pack'})[P.get('view')]||'box');STORE.ready.then(boot);
return{show,view,send,get sending(){return S}}})();
