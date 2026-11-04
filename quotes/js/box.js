// Box B engine. Ported from design sandbox v2 src/box2.js.
// M2: deck comes from the STORE (js/store.js; IndexedDB-backed since M4). M5: #pickSend opens the QR send sheet (APP.send).
window.BOXCFG={scroll:'ring',step:56,stackY:300,rise:.2,thud:300,
 layout(k,n,off){const th=(k-off)/n*2*Math.PI,c=Math.cos(th),s=Math.sin(th);
  return{x:s*118,y:205-(1-c)*30,z:(c-1)*110,ry:-s*30,s:.36*(.8+.2*(c+1)/2),o:c<-.35?.45:1,zi:Math.round(c*50)+50}},
 closed(k){return{x:0,y:420,z:40,s:.26,o:0,zi:k}},
 selected(){return{y:220,s:.64,zi:200}}};
window.BOX=(()=>{
const C=window.BOXCFG,$=s=>document.querySelector(s);
const P=new URLSearchParams(location.search),RM=matchMedia('(prefers-reduced-motion: reduce)');
const scene=$('#scene'),wrap=$('#cards'),hit=$('#boxHit'),live=$('#live'),pick=$('#pick'),tog=$('#toggle');
let deck=[],els=[],order=[],open=false,sel=-1,off=0,busy=false;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const vis=()=>order;
function build(){const prev=order.map(i=>deck[i]&&deck[i].id);deck=currentDeck();wrap.innerHTML='';
 els=deck.map((d,i)=>{const b=document.createElement('button');b.type='button';b.className='mc';b.dataset.i=i;
  b.setAttribute('aria-label',`${cardNo(d)}, ${d.who}${d.recv?', received':''}: \u201c${d.q}\u201d`);
  b.innerHTML=`<span class="mc-sway" style="animation-delay:${(-i*.41).toFixed(2)}s">${cardHTML(d)}</span>`;wrap.appendChild(b);
  fitQuote(b.querySelector('.card'),d);return b});
 // keep the shuffled order across a rebuild (e.g. back from the card view); new cards join at the end
 const ids=deck.map(d=>d.id),kept=prev.map(id=>ids.indexOf(id)).filter(i=>i>=0);
 order=kept.concat(deck.map((_,i)=>i).filter(i=>!kept.includes(i)));if(off>=order.length)off=0;
 els.forEach(el=>el.addEventListener('click',()=>onCardClick(el)));
 $('#deckCount').textContent=`DECK_${String(deck.length).padStart(2,'0')}`;const cmd=$('#bCmd');if(cmd)cmd.textContent=`> DECK_${String(deck.length).padStart(2,'0')} `}
const T=t=>`translate3d(${(t.x||0).toFixed(1)}px,${((t.y||0)-210).toFixed(1)}px,${(t.z||0).toFixed(1)}px) rotateX(${t.rx||0}deg) rotateY(${(t.ry||0).toFixed(2)}deg) rotateZ(${(t.rz||0).toFixed(2)}deg) scale(${(t.s||.34).toFixed(3)})`;
function put(el,t,dur,delay,ease){if(dur==null)dur=.55;delay=delay||0;if(RM.matches){dur=0;delay=0}
 el.style.transition=`transform ${dur}s ${ease||'cubic-bezier(.2,1.35,.35,1)'} ${delay}s,opacity ${Math.min(dur,.28)}s linear ${delay}s`;
 el.style.transform=T(t);el.style.opacity=t.o==null?1:t.o;el.style.zIndex=t.zi||0}
const n=()=>order.length;
const ringMod=k=>((k%n())+n())%n();
const focusK=()=>n()?ringMod(Math.round(off)):0;
function layout(o){o=o||{};const N=n();
 order.forEach((i,k)=>{const el=els[i];let t,delay=0;
  if(!open){t=C.closed(k,N);delay=(N-k)*.018}
  else if(sel===i)t=C.selected();
  else{t=C.layout(k,N,off);delay=(o.rise?C.rise:0)+k*(o.stagger||0);if(sel>=0){t=Object.assign({},t,{o:.16,y:t.y+24})}}
  put(el,t,o.dur,o.delay!=null?o.delay:delay,o.ease)});
 const fk=focusK();
 els.forEach((el,i)=>{const k=order.indexOf(i),on=open&&k>=0&&(sel<0||sel===i);el.tabIndex=on?0:-1;el.setAttribute('aria-hidden',String(!on));
  if(k<0){el.style.opacity=0;el.style.pointerEvents='none'}
  el.classList.toggle('is-sel',sel===i);el.classList.toggle('is-focus',open&&k===fk&&sel<0);
  if(on)el.setAttribute('aria-pressed',String(sel===i));else el.removeAttribute('aria-pressed')});
 wrap.setAttribute('aria-hidden',String(!open));$('#empty').hidden=!(open&&!N)}
function announceFocus(){const i=order[focusK()];if(i!=null)live.textContent=`${deck[i].sh}, card ${focusK()+1} of ${n()}`}
function setOpen(v){if(busy||v===open)return;open=v;sel=-1;scene.dataset.open=v?'1':'0';
 hit.setAttribute('aria-expanded',String(v));hit.setAttribute('aria-label',v?'Card box, open. Tap to close':'Card box, closed. Tap to open');tog.textContent=v?'Close box':'Open box';
 if(v){SFX.open();layout({rise:1,stagger:.045})}
 else{SFX.close();layout({dur:.32,ease:'cubic-bezier(.5,0,.8,.2)'});if(!RM.matches)setTimeout(()=>{scene.classList.remove('thud');void scene.offsetWidth;scene.classList.add('thud')},C.thud)}
 showPick();live.textContent=v?`Box open. ${n()} cards float above it.`:'Box closed.'}
function select(i){if(busy)return;sel=i;i>=0?SFX.select():SFX.click();layout({dur:.5});showPick();
 if(i>=0){live.textContent=`Picked ${deck[i].who}.`;setTimeout(()=>$('#pickView').focus({preventScroll:true}),RM.matches?0:300)}}
function showPick(){const i=sel;pick.hidden=i<0;if(i<0)return;const d=deck[i];
 const ps=$('#pickSend');ps.hidden=ps.disabled=isSample(d.id); /* demo cards: no Send */
 $('#pickH').textContent=`PICKED \u00b7 ${cardNo(d)}${d.recv?' \u00b7 RECEIVED':''}`;
 const m=els[i].querySelector('.card').dataset.qmode;
 $('#pickTxt').textContent=`\u201c${d.q.length>140?d.q.slice(0,137)+'\u2026':d.q}\u201d \u2014 ${d.who}, ${d.src}`;
 $('#pickMeta').textContent=`${d.q.length} chars \u00b7 ${m==='scroll'?'scroll well':'shrink to fit'}${photoSrc(d)?' \u00b7 has photo':''}`}
async function shuffle(){if(busy||!n())return;if(!open){setOpen(true);await wait(RM.matches?0:700)}
 busy=true;sel=-1;showPick();const v=order.slice(),N=v.length,nv=v.slice();
 for(let k=N-1;k>0;k--){const j=Math.random()*(k+1)|0;[nv[k],nv[j]]=[nv[j],nv[k]]}
 const done=()=>{order=nv;off=0;busy=false;layout({stagger:.035,dur:.55});live.textContent=`Shuffled. Top card: ${deck[nv[0]].who}.`};
 if(RM.matches){SFX.knock();done();return}
 const sy=C.stackY,h=Math.ceil(N/2);scene.classList.add('shuffling');
 v.forEach((i,k)=>{const L=k<h;put(els[i],{x:L?-62:62,y:sy-(k%h)*2,rz:L?-8:8,s:.3,zi:k},.24,k*.012,'cubic-bezier(.3,.7,.4,1)')});
 SFX.gather();await wait(290);
 nv.forEach((i,k)=>{put(els[i],{x:(Math.random()-.5)*8,y:sy-k*2.4,rz:(Math.random()-.5)*6,s:.3,zi:20+k},.15,k*.055,'cubic-bezier(.2,.9,.3,1)');SFX.tick(k,k*.055)});
 await wait(N*55+180);
 if(P.has('freeze'))return;
 SFX.knock();nv.forEach((i,k)=>put(els[i],{x:0,y:sy-k*1.2,s:.3,zi:20+k},.1,0,'ease-out'));await wait(150);
 scene.classList.remove('shuffling');done()}
function step(dk){if(!open||sel>=0||!n())return;off=Math.round(off)+dk;SFX.tick(off);layout({dur:.45});announceFocus()}
// burn: the sender's copy is wiped after the receiver's accept code checks out
function burn(id){return new Promise(res=>{const i=deck.findIndex(d=>d.id===id);if(i<0){STORE.burn(id);res();return}
 if(!open){open=true;scene.dataset.open='1';tog.textContent='Close box';hit.setAttribute('aria-expanded','true')}
 sel=i;layout({dur:RM.matches?0:.4});pick.hidden=true;busy=true;
 setTimeout(()=>{const el=els[i];SFX.burn();el.classList.add('burning');
  setTimeout(()=>{STORE.burn(id);el.classList.remove('burning');order=order.filter(k=>k!==i);sel=-1;busy=false;layout({dur:.5});showPick();
   $('#restore').hidden=!STORE.sampleBurned();live.textContent=`Sent. ${deck[i].sh} is gone from your box. ${n()} cards left.`;tog.focus({preventScroll:true});res()},RM.matches?0:760)},RM.matches?0:450)})}
// gestures on the box body: tap = toggle, flick up = open, flick down = close, scrub sideways = shuffle
let g=null,gest=false;
hit.addEventListener('pointerdown',e=>{g={x0:e.clientX,y0:e.clientY,x:e.clientX,travel:0,rev:0,dir:0};try{hit.setPointerCapture(e.pointerId)}catch(_){}});
hit.addEventListener('pointermove',e=>{if(!g)return;const dx=e.clientX-g.x;if(Math.abs(dx)<2)return;g.x=e.clientX;g.travel+=Math.abs(dx);const d=Math.sign(dx);if(g.dir&&d!==g.dir)g.rev++;g.dir=d});
hit.addEventListener('pointerup',e=>{if(!g)return;const G=g;g=null;const dx=e.clientX-G.x0,dy=e.clientY-G.y0;
 if(G.travel>110&&G.rev>=1){gest=true;shuffle()}
 else if(Math.abs(dy)>28&&Math.abs(dy)>Math.abs(dx)){gest=true;setOpen(dy<0)}});
hit.addEventListener('pointercancel',()=>{g=null});
hit.addEventListener('click',()=>{if(gest){gest=false;return}setOpen(!open)});
let cd=null,dragged=false,lastTick=0;
wrap.addEventListener('pointerdown',e=>{dragged=false;if(!open||busy)return;cd={x0:e.clientX,y0:e.clientY,off0:off,moved:false,id:e.pointerId}});
wrap.addEventListener('pointermove',e=>{if(!cd)return;const dx=e.clientX-cd.x0,dy=e.clientY-cd.y0;
 if(!cd.moved&&Math.hypot(dx,dy)>9){cd.moved=true;dragged=true;try{wrap.setPointerCapture(cd.id)}catch(_){}}
 if(cd.moved&&sel<0&&Math.abs(dx)>Math.abs(dy)*.7){off=cd.off0-dx/C.step;const r=Math.round(off);if(r!==lastTick){lastTick=r;SFX.tick(r)}layout({dur:0})}});
function endDrag(e){if(!cd)return;const C0=cd;cd=null;if(!C0.moved)return;const dx=e.clientX-C0.x0,dy=e.clientY-C0.y0;
 if(dy>50&&dy>Math.abs(dx)){sel>=0?select(-1):setOpen(false);return}
 if(sel<0){off=Math.round(off);layout({dur:.45});announceFocus()}}
wrap.addEventListener('pointerup',endDrag);wrap.addEventListener('pointercancel',endDrag);
function onCardClick(el){if(dragged){dragged=false;return}const i=+el.dataset.i;
 if(sel>=0){select(-1);return}
 const k=order.indexOf(i);if(k!==focusK()){let d=k-focusK();const N=n();d=((d%N)+N+N/2)%N-N/2;step(Math.round(d));return}
 select(i)}
scene.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();step(-1);focusFront()}else if(e.key==='ArrowRight'){e.preventDefault();step(1);focusFront()}
 else if(e.key==='Escape'){sel>=0?select(-1):setOpen(false)}});
function focusFront(){const i=order[focusK()];if(i!=null)els[i].focus({preventScroll:true})}
tog.addEventListener('click',()=>setOpen(!open));
$('#shuffle').addEventListener('click',shuffle);
$('#pickBack').addEventListener('click',()=>{const i=sel;select(-1);if(i>=0)els[i].focus({preventScroll:true})});
$('#pickView').addEventListener('click',()=>{if(sel>=0)APP.view(deck[sel])});
$('#pickSend').addEventListener('click',()=>{if(sel>=0&&!isSample(deck[sel].id))APP.send(deck[sel])});
$('#restore').addEventListener('click',()=>{STORE.reset();build();sel=-1;$('#restore').hidden=true;layout({rise:open?1:0,stagger:.04});SFX.click();live.textContent='Sample cards restored. Your own cards are kept.'});
$('#prev').addEventListener('click',()=>step(-1));$('#next').addEventListener('click',()=>step(1));
build();layout({dur:0});
$('#restore').hidden=!STORE.sampleBurned();
return{setOpen,select,layout,shuffle,burn,rebuild(){build();layout({dur:0});$('#restore').hidden=!STORE.sampleBurned()},
 focusId(id){const i=deck.findIndex(d=>d.id===id),k=order.indexOf(i);if(k<0)return;sel=-1;off=k;layout({dur:0});showPick();announceFocus()},
 get deck(){return deck},get sel(){return sel},get open(){return open},get order(){return order.map(i=>deck[i].id)},
 initState(st){if(P.has('lidnow'))scene.classList.add('nolidanim');
  if(st==='open'||st==='sel'||st==='shuffle'){open=true;scene.dataset.open='1';hit.setAttribute('aria-expanded','true');tog.textContent='Close box';if(P.get('off'))off=+P.get('off');layout({dur:0})}
  if(st==='sel'){const k=+(P.get('sel')||0);sel=deck.findIndex(d=>d.id===P.get('id'));if(sel<0)sel=order[k]??0;layout({dur:0});showPick()}
  if(st==='shuffle')setTimeout(shuffle,50)}}
})();
