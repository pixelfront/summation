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
function fitFanQuote(card,d){if(!card)return;const r=fitQuote(card,d);if(!r||r.mode!=='scroll')return;
 const slot=card.querySelector('.qslot');if(!slot)return;slot.innerHTML=quoteBlock(d,'fit');const q=slot.querySelector('.b-q');
 let size=14;q.style.fontSize=size+'px';
 while(size>6.5&&q.scrollHeight>q.clientHeight+1){size-=0.5;q.style.fontSize=size+'px'}
 card.dataset.qmode='fit'}
const vis=()=>order;
function build(){const prev=order.map(i=>deck[i]&&deck[i].id);deck=currentDeck();wrap.innerHTML='';
 els=deck.map((d,i)=>{const b=document.createElement('div');b.className='mc';b.dataset.i=i;b.setAttribute('role','group');
  b.setAttribute('aria-label',`${cardNo(d)}, ${d.who}${d.recv?', received':''}: \u201c${d.q}\u201d`);
  const tape=document.body.dataset.skin==='cassette';b.innerHTML=`<span class="mc-sway" style="animation-delay:${(-i*.41).toFixed(2)}s">${tape?tapeHTML(d):cardHTML(d,'fan')}</span>`;wrap.appendChild(b);
  if(!tape)fitFanQuote(b.querySelector('.card'),d);return b});
 // keep the shuffled order across a rebuild (e.g. back from the card view); new cards join at the end
 const ids=deck.map(d=>d.id),kept=prev.map(id=>ids.indexOf(id)).filter(i=>i>=0);
 order=kept.concat(deck.map((_,i)=>i).filter(i=>!kept.includes(i)));if(off>=order.length)off=0;
 els.forEach(el=>el.addEventListener('click',()=>onCardClick(el)));
 $('#deckCount').textContent=`DECK_${String(deck.length).padStart(2,'0')}`;const nn=String(deck.length).padStart(2,'0');document.querySelectorAll('#scene .cnt').forEach(e=>{e.textContent=e.id==='bCmd'?`> DECK_${nn} `:e.classList.contains('c-no')?`DECK_${nn}`:nn})}
const T=t=>`translate3d(${(t.x||0).toFixed(1)}px,${((t.y||0)-210).toFixed(1)}px,${(t.z||0).toFixed(1)}px) rotateX(${t.rx||0}deg) rotateY(${(t.ry||0).toFixed(2)}deg) rotateZ(${(t.rz||0).toFixed(2)}deg) scale(${(t.s||.34).toFixed(3)})`;
function put(el,t,dur,delay,ease){if(dur==null)dur=.55;delay=delay||0;if(RM.matches){dur=0;delay=0}
 el.style.transition=`transform ${dur}s ${ease||'cubic-bezier(.2,1.35,.35,1)'} ${delay}s,opacity ${Math.min(dur,.28)}s linear ${delay}s`;
 el.style.transform=T(t);el.style.opacity=t.o==null?1:t.o;el.style.zIndex=t.zi||0}
const n=()=>order.length;
// Layouts milestone: Fan/Grid/Gallery/Pickup from js/layouts.js. Zone = the cards box (inline scene or full-screen stage).
function dims(){return[wrap.clientWidth||390,wrap.clientHeight||380]}
function lay(k,N,i){const[W,H]=dims(),p=LAYOUTS.pos(k,N,off,W,H,deck[i].id);return{x:p.x-W/2,y:p.y,rz:p.r,s:p.s,o:p.o,zi:p.z}}
const ringMod=k=>((k%n())+n())%n();
const focusK=()=>n()?ringMod(Math.round(off)):0;
function layout(o){o=o||{};const N=n();
 order.forEach((i,k)=>{const el=els[i];let t,delay=0;
  if(!open&&!LAYOUTS.fs){t=C.closed(k,N);delay=(N-k)*.018}
  else if(sel===i)t=C.selected();
  else{t=lay(k,N,i);delay=(o.rise?C.rise:0)+k*(o.stagger||0);if(sel>=0){t=Object.assign({},t,{o:.16,y:t.y+24})}
   else if(LAYOUTS.name==='fan'&&el.classList.contains('is-flip')&&k===focusK()){const[W]=dims();t=Object.assign({},t,{s:Math.max(t.s,Math.min(0.82,(W-28)/300)),rz:0,zi:80})}}
  put(el,t,o.dur,o.delay!=null?o.delay:delay,o.ease)});
 const fk=focusK();
 els.forEach((el,i)=>{const k=order.indexOf(i),on=(open||LAYOUTS.fs)&&k>=0&&(sel<0||sel===i);el.tabIndex=on?0:-1;el.setAttribute('aria-hidden',String(!on));
  if(k<0){el.style.opacity=0;el.style.pointerEvents='none'}
  el.classList.toggle('is-sel',sel===i);el.classList.toggle('is-focus',open&&k===fk&&sel<0);
  if(on)el.setAttribute('aria-pressed',String(sel===i));else el.removeAttribute('aria-pressed')});
 wrap.setAttribute('aria-hidden',String(!(open||LAYOUTS.fs)));$('#empty').hidden=!(open&&!N);syncFanOpen()}
function syncFanOpen(){const btn=$('#fanOpen');if(!btn)return;const show=(open||LAYOUTS.fs)&&LAYOUTS.name==='fan'&&n()>0&&sel<0;
 btn.hidden=!show;if(!show)return;const el=fanSubject(),d=el?deck[+el.dataset.i]:null;
 if(d)btn.setAttribute('aria-label',`Open ${d.who} in the card view`)}
function announceFocus(){const i=order[focusK()];if(i!=null)live.textContent=`${deck[i].sh}, card ${focusK()+1} of ${n()}`}
function setOpen(v){if(busy||v===open)return;open=v;sel=-1;scene.dataset.open=v?'1':'0';
 hit.setAttribute('aria-expanded',String(v));hit.setAttribute('aria-label',v?'Card box, open. Tap to close':'Card box, closed. Tap to open');tog.textContent=v?'Close box':'Open box';
 if(v){SFX.open();layout({rise:1,stagger:.045})}
 else{SFX.close();layout({dur:.32,ease:'cubic-bezier(.5,0,.8,.2)'});if(!RM.matches)setTimeout(()=>{scene.classList.remove('thud');void scene.offsetWidth;scene.classList.add('thud')},C.thud)}
 showPick();live.textContent=v?`Box open. ${n()} cards float above it.`:'Box closed.'}
function select(i){if(busy)return;if(i>=0&&LAYOUTS.fs&&window.LAYOUTUI){LAYOUTUI.exitFS(true)}sel=i;i>=0?SFX.select():SFX.click();layout({dur:.5});showPick();
 if(i>=0){live.textContent=`Picked ${deck[i].who}.`;setTimeout(()=>{$('#pickView').focus({preventScroll:true});pick.scrollIntoView({block:'nearest',behavior:RM.matches?'auto':'smooth'})},RM.matches?0:300)}}
function showPick(){const i=sel;pick.hidden=i<0;if(i<0)return;const d=deck[i];
 const ps=$('#pickSend');ps.hidden=ps.disabled=isSample(d.id);$('#pickNoSend').hidden=!isSample(d.id); /* demo cards: no Send */
 $('#pickH').textContent=`PICKED \u00b7 ${cardNo(d)}`;
 const ce=els[i].querySelector('.card'),m=ce?ce.dataset.qmode:'tape';
 $('#pickTxt').textContent=`\u201c${d.q.length>140?d.q.slice(0,137)+'\u2026':d.q}\u201d \u2014 ${d.who}, ${d.src}`;
 $('#pickMeta').textContent=`${d.q.length} chars \u00b7 ${m==='tape'?'on cassette':m==='scroll'?'scroll well':'shrink to fit'}${photoSrc(d)?' \u00b7 has photo':''}${d.recv?' \u00b7 Received by QR':''}${d.rar==='g'?' \u00b7 gold trim':d.rar==='h'?' \u00b7 holo rare':''}${d.pk?' \u00b7 from a pack':''}`;
 const pb=$('#pickBurn');if(pb)pb.setAttribute('aria-label',`Burn ${d.sh} for good`)}
async function shuffle(){if(busy||!n())return;if(!open){setOpen(true);await wait(RM.matches?0:700)}
 busy=true;sel=-1;showPick();if(LAYOUTS.name==='pickup')LAYOUTS.drop();const v=order.slice(),N=v.length,nv=v.slice();
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
function step(dk){if(!(open||LAYOUTS.fs)||sel>=0||!n())return;fanHeld=null;off=Math.round(off)+dk;SFX.tick(off);layout({dur:.45});announceFocus()}
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
let cd=null,dragged=false,lastTick=0,fanHeld=null;
function topFanCard(x,y){const stack=document.elementsFromPoint?document.elementsFromPoint(x,y):[];
 for(const n of stack){const el=n.closest&&n.closest('.mc');if(!el||!wrap.contains(el))continue;if(el.getAttribute('aria-hidden')==='true')continue;
  if(parseFloat(getComputedStyle(el).opacity)<.2)continue;return el}return null}
function fanSubject(){if(fanHeld&&fanHeld.isConnected&&fanHeld.getAttribute('aria-hidden')!=='true')return fanHeld;const i=order[focusK()];return i==null?null:els[i]}
wrap.addEventListener('pointerdown',e=>{dragged=false;if(!(open||LAYOUTS.fs)||busy)return;if(e.target.closest&&e.target.closest('#fanOpen'))return;
 const el=topFanCard(e.clientX,e.clientY)||(e.target.closest&&e.target.closest('.mc'));cd={x0:e.clientX,y0:e.clientY,t0:performance.now(),off0:off,moved:false,id:e.pointerId,card:el};
 if(LAYOUTS.name==='pickup'&&el&&sel<0){const d=deck[+el.dataset.i],p=LAYOUTS.lift(d.id,n());cd.el=el;cd.id0=d.id;cd.p0={fx:p.fx,fy:p.fy};layout({dur:0})}});
wrap.addEventListener('pointermove',e=>{if(!cd)return;const dx=e.clientX-cd.x0,dy=e.clientY-cd.y0;
 if(!cd.moved&&Math.hypot(dx,dy)>10){/* a mostly vertical pan (not a Pickup grab, not full screen) stays a page scroll */if(!cd.el&&!LAYOUTS.fs&&Math.abs(dy)>Math.abs(dx)*1.2){dragged=true;cd=null;return}cd.moved=true;dragged=true;try{wrap.setPointerCapture(cd.id)}catch(_){}}
 if(cd.moved&&cd.el){const[W,H]=dims(),p=LAYOUTS.spot(cd.id0,n());cd.el.classList.add('dragging');p.fx=Math.min(1,Math.max(0,cd.p0.fx+dx/(W*.7)));p.fy=Math.min(1,Math.max(0,cd.p0.fy+dy/(H*.7)));layout({dur:0});return}
 if(cd.moved&&sel<0&&LAYOUTS.scrolls()&&Math.abs(dx)>Math.abs(dy)*.7){off=cd.off0-dx/C.step;const r=Math.round(off);if(r!==lastTick){lastTick=r;SFX.tick(r)}layout({dur:0})}});
function endDrag(e,cancel){if(!cd)return;const C0=cd;cd=null;if(C0.el)C0.el.classList.remove('dragging');
 if(cancel){dragged=true;if(C0.card)C0.card._tap=false;return}
 if(C0.moved){setTimeout(()=>{dragged=false},0);if(C0.el){layout({dur:0});return}const dx=e.clientX-C0.x0,dy=e.clientY-C0.y0;
  if(dy>50&&dy>Math.abs(dx)&&!LAYOUTS.fs&&LAYOUTS.scrolls()){sel>=0?select(-1):setOpen(false);return}
  if(sel<0){off=Math.round(off);layout({dur:.45});announceFocus()}return}
 const dist=Math.hypot(e.clientX-C0.x0,e.clientY-C0.y0),up=topFanCard(e.clientX,e.clientY);
 if(C0.card&&up===C0.card&&dist<10&&performance.now()-C0.t0<400)C0.card._tap=true}
wrap.addEventListener('pointerup',e=>endDrag(e,false));wrap.addEventListener('pointercancel',e=>endDrag(e,true));
function flipInPlace(el){const card=el.querySelector('.card');if(!card)return false;const on=card.classList.toggle('show-back');el.classList.toggle('is-flip',on);
 const d=deck[+el.dataset.i];const bit=d.q.length>140?d.q.slice(0,137)+'\u2026':d.q;
 el.setAttribute('aria-label',on?`${d.who}, quote side. ${bit}. Open reads the card.`:`${cardNo(d)}, ${d.who}${d.recv?', received':''}: \u201c${d.q}\u201d`);
 layout({dur:RM.matches?0:.28});live.textContent=on?`Quote side. ${d.who}. ${bit}`:`Photo side. ${d.who}.`;return true}
function fanTap(el){if(sel>=0){select(-1);return}fanHeld=el;if(!flipInPlace(el))select(+el.dataset.i);else{el.focus({preventScroll:true});syncFanOpen()}}
function onCardClick(el){if(dragged){dragged=false;return}
 if(LAYOUTS.name==='fan'){if(!el._tap)return;el._tap=false;fanTap(el);return}
 el._tap=false;const i=+el.dataset.i;
 if(sel>=0){select(-1);return}
 const k=order.indexOf(i);if(k!==focusK()&&LAYOUTS.scrolls()){let d=k-focusK();const N=n();d=((d%N)+N+N/2)%N-N/2;step(Math.round(d));return}
 select(i)}
scene.addEventListener('keydown',e=>{if(e.target&&e.target.id==='fanOpen')return;
 if(e.key==='ArrowLeft'){e.preventDefault();step(-1);focusFront()}else if(e.key==='ArrowRight'){e.preventDefault();step(1);focusFront()}
 else if(e.key==='Escape'){sel>=0?select(-1):setOpen(false)}
 else if((e.key===' '||e.key==='Enter')&&LAYOUTS.name==='fan'&&(open||LAYOUTS.fs)&&sel<0){e.preventDefault();const el=document.activeElement&&document.activeElement.classList&&document.activeElement.classList.contains('mc')?document.activeElement:fanSubject();if(!el)return;
  if(e.key===' '){fanHeld=el;flipInPlace(el)}else APP.view(deck[+el.dataset.i])}});
const fanOpenBtn=$('#fanOpen');if(fanOpenBtn)fanOpenBtn.addEventListener('click',()=>{const el=fanSubject();if(el)APP.view(deck[+el.dataset.i])});
function focusFront(){const i=order[focusK()];if(i!=null)els[i].focus({preventScroll:true})}
tog.addEventListener('click',()=>setOpen(!open));
$('#shuffle').addEventListener('click',shuffle);
$('#pickBack').addEventListener('click',()=>{const i=sel;select(-1);if(i>=0)els[i].focus({preventScroll:true})});
$('#pickView').addEventListener('click',()=>{if(sel>=0)APP.view(deck[sel])});
$('#pickSend').addEventListener('click',()=>{if(sel>=0&&!isSample(deck[sel].id))APP.send(deck[sel])});
// 3A: burn any card by hand (char + curl + embers). Made/received cards ask once first; demo cards just burn (Restore brings them back).
async function incinerate(id){const i=deck.findIndex(d=>d.id===id);if(i<0||busy)return false;const d=deck[i];
 if(BURNFX.needsAsk(d)&&!(await BURNFX.ask(d)))return false;
 window.SPEAK&&SPEAK.stop('burn');busy=true;pick.hidden=true;const host=(window.CASES&&CASES.active()&&CASES.el(id))||els[i].querySelector('.card')||els[i];
 await BURNFX.play(host);STORE.burn(id);busy=false;sel=-1;build();layout({dur:.4});showPick();if(window.CASES)CASES.refresh();
 $('#restore').hidden=!STORE.sampleBurned();live.textContent=`${d.sh} burned. ${isSample(d.id)?'Restore samples brings demo cards back.':'It is gone from this phone.'}`;return true}
$('#pickBurn').addEventListener('click',()=>{if(sel>=0)incinerate(deck[sel].id)});
$('#restore').addEventListener('click',()=>{STORE.reset();build();sel=-1;$('#restore').hidden=true;layout({rise:open?1:0,stagger:.04});SFX.click();live.textContent='Sample cards restored. Your own cards are kept.'});
$('#prev').addEventListener('click',()=>step(-1));$('#next').addEventListener('click',()=>step(1));
build();layout({dur:0});
$('#restore').hidden=!STORE.sampleBurned();
// Pickup entry: stack in the middle, then fly out (reduced motion: straight to the spots)
async function fanSelfTest(){const out=document.createElement('pre');out.id='fantestOut';out.style.cssText='white-space:pre-wrap;font:12px monospace;color:#fff;background:#000;padding:12px';
 document.body.appendChild(out);const lines=[];const say=(n,ok,x)=>{lines.push((ok?'PASS ':'FAIL ')+n+(x?' — '+x:''));out.textContent=lines.join('\n')};
 if(!open)setOpen(true);await wait(40);
 if(P.has('colourshot')||P.has('flipshot')){document.querySelectorAll('#cards .ph-img,#cards .ph-bg').forEach(img=>{img.src='assets/packs/kim-banquet.jpg'});
  await wait(200);if(P.has('flipshot'))flipInPlace(els[order[focusK()]]);out.dataset.done='1';out.textContent='SHOT';return}
 const focus=()=>els[order[focusK()]];
 const pt=(el,type,x,y)=>{el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:1,pointerType:'touch'}))};
 const tap=(el,dx)=>{const b=el.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+Math.min(b.height/2,40);pt(el,'pointerdown',x,y);pt(el,'pointerup',x+(dx||0),y);el.click()};
 const front=focus();const was=front.classList.contains('is-flip');tap(front,2);
 say('quick tap flips the front card',front.classList.contains('is-flip')!==was);
 say('tap does not hard-select',sel<0&&$('#pick').hidden);
 say('Open is visible',!$('#fanOpen').hidden);
 const flipped=front.classList.contains('is-flip');
 const side=els.find(el=>el!==front&&el.getAttribute('aria-hidden')!=='true');
 let sidePt=null;if(side){const r=side.getBoundingClientRect();
  for(let x=r.left+2;x<r.right-2&&!sidePt;x+=6)for(let y=r.top+2;y<r.bottom-2&&!sidePt;y+=6){if(topFanCard(x,y)===side)sidePt={x,y}}}
 say('a side card has its own visible point',!!sidePt);
 if(sidePt){const off0=off,sideWas=side.classList.contains('is-flip');
  pt(side,'pointerdown',sidePt.x,sidePt.y);pt(side,'pointerup',sidePt.x+1,sidePt.y);side.click();
  say('tap flips that side card',side.classList.contains('is-flip')!==sideWas);
  say('side tap does not spin the fan',off===off0);
  say('side tap does not flip the front card',front.classList.contains('is-flip')===flipped)}
 pt(front,'pointerdown',20,20);pt(front,'pointermove',70,24);pt(front,'pointerup',90,24);front.click();
 say('drag does not flip',front.classList.contains('is-flip')===flipped);
 const nFlip=()=>els.filter(e=>e.classList.contains('is-flip')).length,n0=nFlip();
 pt(front,'pointerdown',30,30);pt(front,'pointermove',32,80);pt(front,'pointerup',34,120);front.click();
 say('vertical drag does not flip',nFlip()===n0);
 pt(front,'pointerdown',40,40);document.body.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:8,clientY:8,pointerId:1}));
 say('pointerup outside does not flip',nFlip()===n0);
 const beforeArrow=focus();scene.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
 say('arrow moves focus',focus()!==beforeArrow);
 const long=els.find(el=>deck[+el.dataset.i].q.length>200)||front;
 if(!long.classList.contains('is-flip')){long.focus();const k=order.indexOf(+long.dataset.i);off=k;layout({dur:0});tap(long,1)}
 const back=long.querySelector('.face.back'),q=long.querySelector('.b-q');
 say('long quote is on the back',!!back&&back.textContent.indexOf(deck[+long.dataset.i].q.slice(0,24))>=0);
 say('long quote fits without a scroll well',!!q&&q.scrollHeight<=q.clientHeight+2&&!long.querySelector('.more'),q?q.scrollHeight+'/'+q.clientHeight:'none');
 const face=long.querySelector('.face.back');
 say('flip swaps the face instead of spinning it',getComputedStyle(face).visibility==='visible'&&(getComputedStyle(face).transform==='none'||getComputedStyle(face).transform==='matrix(1, 0, 0, 1, 0, 0)'));
 long.focus();const beforeSpace=long.classList.contains('is-flip');
 long.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));
 say('space flips',long.classList.contains('is-flip')!==beforeSpace);
 const afterSpace=long.classList.contains('is-flip');long.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));
 say('space toggles the quote side',long.classList.contains('is-flip')!==afterSpace);
 long.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
 say('enter opens the card',!$('#cardView').hidden);
 out.dataset.done='1'}
function scatter(){if(RM.matches||!open||sel>=0){layout({dur:0});return}const[W,H]=dims(),s=LAYOUTS.stackScale(W,H);
 order.forEach((i,k)=>put(els[i],{x:0,y:H/2,rz:(k-n()/2)*2,s,zi:k},0));void wrap.offsetWidth;requestAnimationFrame(()=>layout({stagger:.03,dur:.55}))}
return{setOpen,select,layout,shuffle,burn,incinerate,scatter,get els(){return els},rebuild(){build();layout({dur:0});$('#restore').hidden=!STORE.sampleBurned()},
 focusId(id){const i=deck.findIndex(d=>d.id===id),k=order.indexOf(i);if(k<0)return;sel=-1;off=k;layout({dur:0});showPick();announceFocus()},
 get deck(){return deck},get sel(){return sel},get open(){return open},get order(){return order.map(i=>deck[i].id)},
 initState(st){if(P.has('lidnow'))scene.classList.add('nolidanim');
  if(P.has('fantest'))setTimeout(fanSelfTest,30);
  if(st==='open'||st==='sel'||st==='shuffle'){open=true;scene.dataset.open='1';hit.setAttribute('aria-expanded','true');tog.textContent='Close box';if(P.get('off'))off=+P.get('off');layout({dur:0})}
  if(st==='sel'){const k=+(P.get('sel')||0);sel=deck.findIndex(d=>d.id===P.get('id'));if(sel<0)sel=order[k]??0;layout({dur:0});showPick()}
  if(st==='shuffle')setTimeout(shuffle,50)}}
})();
