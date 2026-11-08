// 6A packs + 10A PDF -> packs.
// Packs: 7 cards from one writer's bundled pool (data/packs.json: massline.info first, marxists.org fill; Mao also gets the
// bundled Quotations from Chairman Mao, data/redbook.json). Every pulled card is saved straight into the box as your card.
// Odds per card: holo ~1/50, gold trim ~1/10, else common. Rares are dealt last. Duplicates are allowed.
// Tear: swipe across the top >= 60% of the pack width (or the Open pack button). Cards rise and fan one by one (90 ms stagger),
// face down; tap flips one; tap a face-up card to open it in the card view.
// Holo shimmer follows the finger + slow idle sweep; phone tilt is opt-in (iOS asks permission on that tap).
// Reduced motion: no fan/fly animation, foil stays (static gradient).
// PDF import: js/pdf/pdftext.js is loaded only on the first Import PDF (the service worker then caches it); text stays on this phone.
// URL for tests/shots: ?view=packs[&pack=mao][&rig=ch|gh|...][&tear=1][&flip=all]
window.PACKS=(()=>{const $=s=>document.querySelector(s),live=$('#live'),RM=matchMedia('(prefers-reduced-motion: reduce)');
const UKEY='qc-userpacks',wait=ms=>new Promise(r=>setTimeout(r,RM.matches?0:ms));
let DATA=null,RED=null,cur=null,dealt=[],tilt=null,idleRaf=0,rig=null,P0=null,foil=null,foilOn=0,foilSeen=true;
const foilCv=$('#foilCv');
if(foilCv&&window.IntersectionObserver)new IntersectionObserver(es=>{foilSeen=!!es[0]&&es[0].isIntersecting},{threshold:.05}).observe(foilCv);
function drawFoil(){if(!foilCv||!cur||!window.FOIL)return;if(!foil)foil=FOIL.make(foilCv.width,foilCv.height);
 const x=foilCv.getContext('2d');foil.draw(x,{name:(cur.a.sh||'').toUpperCase(),sub:'7 CARDS',user:!!cur.a.user,tear:cur.tear||0,path:cur.path||[],light:cur.light||{x:.36,y:.32},curl:cur.curl||0,sweep:cur.sweep,flash:cur.flash||0,lift:cur.lift||0,shake:cur.shake||0})}
function foilLoop(t){if(!foilOn)return;foilOn=requestAnimationFrame(foilLoop);
 if(document.hidden||!foilSeen)return;if(!cur||cur.hold)return;
 if(!cur.lightHold||performance.now()-cur.lightHold>700){if(!RM.matches){const k=t/1500;cur.light={x:.38+Math.sin(k)*.22,y:.33+Math.cos(k*.7)*.05};cur.sweep=(t/1800)%1}}
 drawFoil()}
function startFoil(){if(foilOn)return;drawFoil();if(RM.matches)return;foilOn=requestAnimationFrame(foilLoop)}
function stopFoil(){cancelAnimationFrame(foilOn);foilOn=0}
async function load(){if(DATA)return DATA;const r=await fetch('data/packs.json');DATA=await r.json();return DATA}
async function red(){if(RED)return RED;const r=await fetch('data/redbook.json');RED=await r.json();return RED}
function upacks(){try{return JSON.parse(localStorage.getItem(UKEY)||'[]')}catch(_){return[]}}
function saveU(a){try{localStorage.setItem(UKEY,JSON.stringify(a));return true}catch(_){return false}}
const left=u=>Math.max(0,Math.ceil((u.q.length-u.opened*7)/7));
function nextNo(){const s=STORE.get();return Math.max(0,...SAMPLE_DECK.filter(d=>!s.burned.includes(d.id)).map(d=>d.no),...s.received.map(d=>d.no||0),...(s.made||[]).map(d=>d.no||0))+1}
// ---------- chooser ----------
function grid(){const a=DATA.authors.map(x=>{const n=DATA.pools[x.id].length+(x.id==='mao'&&RED?RED.q.length:x.id==='mao'?424:0);
  return `<button type="button" class="packbtn" data-pack="${x.id}"><span class="pb-foil"><b>${esc(x.sh.toUpperCase())}</b><i>7 CARDS</i></span><span class="pb-n">${n} quotes</span></button>`});
 const u=upacks().map(x=>`<button type="button" class="packbtn user" data-pack="u:${esc(x.id)}"${left(x)?'':' disabled'}><span class="pb-foil"><b>${esc(x.sh.toUpperCase())}</b><i>PDF</i></span><span class="pb-n">${left(x)} left</span></button>`);
 $('#packGrid').innerHTML=a.concat(u).join('');
 $('#packGrid').querySelectorAll('.packbtn').forEach(b=>b.addEventListener('click',()=>pick(b.dataset.pack)))}
async function enter(P){P0=P||null;APP.show('pack');$('#packPick').hidden=false;$('#packOpen').hidden=true;$('#pdfReview').hidden=true;
 try{await load()}catch(e){$('#packGrid').textContent='Packs did not load.';return}grid();red().then(grid).catch(()=>{});
 if(P&&P.get('rig'))rig=P.get('rig').split('');
 if(P&&P.get('pack')){await pick(P.get('pack'));const shot=P.get('shot');
  if(shot==='1'){cur.hold=true;cur.light={x:.34,y:.3};cur.sweep=.2;drawFoil();document.documentElement.dataset.packShot='1'}
  else if(shot==='3'){cur.hold=true;cur.tear=.72;cur.flash=.9;cur.light={x:.5,y:.16};drawFoil();document.documentElement.dataset.packShot='3'}
  else if(shot==='5'){await showProofStack();document.documentElement.dataset.packShot='5'}
  else{if(P.get('tear'))await tear();if(P.get('flip')==='all')for(const c of dealt)flip(c,true)}}}
function leave(){stopIdle();stopFoil();$('#packOpen').hidden=true}
// ---------- one pack ----------
function info(id){if(id.startsWith('u:')){const u=upacks().find(x=>'u:'+x.id===id);return u&&{id,who:u.who,sh:u.sh,user:u}}
 const a=DATA.authors.find(x=>x.id===id);return a&&Object.assign({},a)}
async function pick(id){const a=info(id);if(!a)return;if(a.user&&!left(a.user)){live.textContent='That PDF pack is used up.';return}
 if(id==='mao')await red().catch(()=>{});
 opening=false;cur={a,torn:false,tear:0,path:[],curl:0,flash:0,lift:0,shake:0,sweep:.2,light:{x:.36,y:.32},rolls:Array.from({length:7},()=>roll())};cur.holo=cur.rolls.some(r=>r==='h');dealt=[];
 try{await POOL.load()}catch(_){}
 $('#packPick').hidden=true;$('#packOpen').hidden=false;$('#pkFan').innerHTML='';
 $('#foilName').textContent=a.sh.toUpperCase();$('#foilSub').textContent='7 CARDS';
 if(foilCv){foilCv.hidden=false;foilCv.style.transition='none';foilCv.style.transform='';foilCv.style.opacity='1'}
 $('#tearZone').hidden=false;$('#tearZone').setAttribute('aria-label',`${a.who} pack, 7 cards, sealed foil wrapper. Drag along the top crimp to tear it, or use Open pack.`);
 $('#pkOpenBtn').hidden=false;$('#pkAnother').hidden=true;$('#pkDone').hidden=true;$('#pkCardOpen').hidden=true;packFocus=null;$('#pkNote').textContent='';
 startFoil();document.documentElement.dataset.packReady='1';live.textContent=`${a.who} pack. Drag along the top to tear the wrapper, or tap Open pack.`;window.scrollTo(0,0)}
function roll(){if(rig&&rig.length){const c=rig.shift();return c==='h'?'h':c==='g'?'g':''}const r=Math.random();return r<.02?'h':r<.12?'g':''}
function pool(a){if(a.user){const u=a.user,s=u.opened*7;return u.q.slice(s,s+7).map(q=>({q,src:u.src}))}
 let p=DATA.pools[a.id].slice();if(a.id==='mao'&&RED)p=p.concat(RED.q.map(([q,src])=>({q,src,url:RED.source,via:'marxists.org',rb:1})));
 const out=[];for(let k=0;k<7&&p.length;k++)out.push(p.splice(Math.random()*p.length|0,1)[0]);return out}
function mkCard(a,e,no,ph){const d={id:newCardId(),no,who:a.who,sh:a.sh,q:e.q,src:e.src||'',pk:1};
 if(e.url)d.notes=`${e.rb?'Quotations from Chairman Mao \u00b7 ':''}Source: ${e.url}${e.via?` (via ${e.via})`:''}`;
 if(ph){d.photo='p:'+ph.id;d.pc=ph.credit||''}
 else if(a.photo){d.photo='a:'+a.photo;if(a.pc)d.pc=a.pc;else d.author=a.id}
 const r=(cur.rolls&&cur.rolls.length)?cur.rolls.shift():roll();if(r)d.rar=r;if(r==='h')d.holo=1;return d}
async function playTear(){if(RM.matches){cur.tear=1;cur.flash=0;drawFoil();foilCv.style.transition='opacity .18s linear';foilCv.style.opacity='0';await wait(180);return}
 const t0=performance.now();
 await new Promise(res=>{const step=t=>{const k=Math.min(1,(t-t0)/380);cur.lift=Math.sin(k*Math.PI)*.9;cur.shake=(1-k)*k*4;drawFoil();if(k<1)requestAnimationFrame(step);else{cur.lift=0;cur.shake=0;res()}};requestAnimationFrame(step)});
 const t1=performance.now();
 await new Promise(res=>{const step=t=>{const k=Math.min(1,(t-t1)/520);cur.tear=k;cur.flash=k<.72?k*1.2:Math.max(0,1-(k-.72)/.28);drawFoil();if(k<1)requestAnimationFrame(step);else res()};requestAnimationFrame(step)});
 cur.flash=0;drawFoil();
 foilCv.style.transition='transform .55s ease-in, opacity .55s ease-in';foilCv.style.transform='translateY(70px) rotate(8deg) scale(.82)';foilCv.style.opacity='0';await wait(520)}
async function showProofStack(){cur.hold=true;cur.torn=true;foilCv.style.opacity='0';const fan=$('#pkFan');fan.innerHTML='';
 for(let k=0;k<7;k++){const b=document.createElement('div');b.className='pk-card in pk-proof';b.style.zIndex=10+k;
  b.style.setProperty('--fx','0px');b.style.setProperty('--fy',(36-k*4)+'px');b.style.setProperty('--fr','0deg');
  b.innerHTML='<span class="pk-in"><span class="pk-back" aria-hidden="true"><b>\u2605</b><i>QUOTE</i></span></span>';fan.appendChild(b)}
 const glow=document.createElement('div');glow.className='pk-rare on';fan.appendChild(glow);$('#tearZone').hidden=true;$('#pkOpenBtn').hidden=true}
let opening=false;
async function tear(){if(!cur||cur.torn||opening)return;opening=true;cur.torn=true;const a=cur.a;
 $('#tearZone').hidden=true;$('#pkOpenBtn').hidden=true;
 if(window.SFX&&!SFX.muted)try{(SFX.tear||SFX.click)()}catch(_){}
 if((cur.tear||0)<.98)await playTear();else if(!RM.matches){const t1=performance.now();await new Promise(res=>{const step=t=>{cur.curl=Math.min(1,(t-t1)/460);if(cur.curl<1)requestAnimationFrame(step);else res()};requestAnimationFrame(step)})}
 const es=pool(a);if(!es.length){$('#pkNote').textContent='This pack is empty.';return}
 let photos=[];try{await POOL.load();photos=POOL.take(a.user?'':a.id,es.length)}catch(_){}
 const s=STORE.get();let no=nextNo();const cards=es.map((e,i)=>mkCard(a,e,no++,photos[i]));
 const rank=d=>d.rar==='h'?2:d.rar==='g'?1:0;cards.sort((x,y)=>rank(x)-rank(y)); // rares last
 s.made=(s.made||[]).concat(cards);STORE.set(s);if(window.STATS){if(a.user)cards.forEach(c=>STATS.made(c.id));STATS.pack(cards[0].id)}
 if(a.user){const all=upacks(),u=all.find(x=>x.id===a.user.id);if(u){u.opened++;saveU(all)}}
 await wait(RM.matches?40:80);
 const fan=$('#pkFan'),N=cards.length;
 cards.forEach((d,k)=>{const b=document.createElement('button');b.type='button';b.className='pk-card'+(d.rar==='g'?' r-gold':d.rar==='h'?' r-holo':'');
  const mid=(N-1)/2,t=k-mid;b._fan={fx:(RM.matches?0:t*33).toFixed(1)+'px',fy:(RM.matches?k*6:Math.abs(t)*Math.abs(t)*3).toFixed(1)+'px',fr:(RM.matches?0:t*5).toFixed(1)+'deg'};
  b.style.setProperty('--fx','0px');b.style.setProperty('--fy',(40-k*4)+'px');b.style.setProperty('--fr','0deg');b.style.zIndex=10+k;
  b.innerHTML=`<span class="pk-in"><span class="pk-back" aria-hidden="true"><b>\u2605</b><i>${esc(a.sh.toUpperCase())}</i></span><span class="pk-front">${cardHTML(d)}</span></span>`;
  b.setAttribute('aria-label',`Card ${k+1} of ${N}, face down. Tap to flip.`);b.dataset.k=k;b._d=d;fan.appendChild(b);fitQuote(b.querySelector('.card'),d);
  b.addEventListener('pointerdown',e=>{b._g={x:e.clientX,y:e.clientY,t:performance.now(),moved:false}});
  b.addEventListener('pointermove',e=>{if(b._g&&Math.hypot(e.clientX-b._g.x,e.clientY-b._g.y)>10)b._g.moved=true});
  b.addEventListener('pointercancel',()=>{if(b._g)b._g.moved=true});
  b.addEventListener('click',()=>{const g=b._g;b._g=null;if(!g||g.moved||performance.now()-g.t>400)return;if(!b.classList.contains('up'))flip(b)});
  b.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();if(!b.classList.contains('up'))flip(b)}else if(e.key==='Enter'){e.preventDefault();openDealt(b)}});
  dealt.push(b)});
 for(const b of dealt)b.classList.add('in');
 const rare=cards.some(d=>d.rar);
 if(rare){const glow=document.createElement('div');glow.className='pk-rare on';fan.appendChild(glow)}
 await wait(RM.matches?60:680);
 if(rare){const g=fan.querySelector('.pk-rare');if(g)g.remove()}
 if(!RM.matches){for(const b of dealt){b.style.setProperty('--fx',b._fan.fx);b.style.setProperty('--fy',b._fan.fy);b.style.setProperty('--fr',b._fan.fr);await wait(70)}
 }else dealt.forEach(b=>{b.style.setProperty('--fx',b._fan.fx);b.style.setProperty('--fy',b._fan.fy);b.style.setProperty('--fr',b._fan.fr)})
 SFX.done&&SFX.done();$('#pkAnother').hidden=false;$('#pkDone').hidden=false;
 const g=cards.filter(d=>d.rar==='g').length,h=cards.filter(d=>d.rar==='h').length;
 $('#pkNote').textContent=`${N} cards added to your box${g?` \u00b7 ${g} gold`:''}${h?` \u00b7 ${h} holo rare`:''}. Tap a card to flip it. Open reads it.`;
 document.documentElement.dataset.packTorn='1';live.textContent=`Pack open. ${N} cards fanned out face down and saved to your box. ${h?'A holo rare is in this pack! ':g?'A gold card is in this pack! ':''}Tap a card to flip it. Open reads it.`;
 startIdle()}
let packFocus=null;
function openDealt(b){const d0=b&&b._d;if(!d0)return;APP.view(STORE.get().made.find(x=>x.id===d0.id)||d0)}
function flip(b,quiet){b.classList.add('up');packFocus=b;const d=b._d;b.setAttribute('aria-label',`${d.rar==='h'?'Holo rare: ':d.rar==='g'?'Gold: ':''}${d.who}: \u201c${d.q}\u201d, ${d.src}. Open reads this card.`);
 const ob=$('#pkCardOpen');if(ob){ob.hidden=false;ob.setAttribute('aria-label',`Open ${d.who} in the card view`)}
 if(!quiet){if(d.rar&&SFX.done)SFX.done();else SFX.click&&SFX.click();live.textContent=`${d.rar==='h'?'Holo rare! ':d.rar==='g'?'Gold trim! ':''}${d.who}: ${d.q.length>120?d.q.slice(0,117)+'\u2026':d.q}`}}
$('#pkCardOpen').addEventListener('click',()=>openDealt(packFocus));
$('#pkFan').addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;const cards=[...$('#pkFan').querySelectorAll('.pk-card')];
 const i=cards.indexOf(document.activeElement);if(i<0)return;e.preventDefault();cards[(i+(e.key==='ArrowRight'?1:-1)+cards.length)%cards.length].focus()});
// ---------- holo shimmer: finger + idle sweep + optional tilt ----------
function setV(c,mx,my,t){const s=c.style;s.setProperty('--sx',(50+mx*50).toFixed(1)+'%');s.setProperty('--sy',(50+my*50).toFixed(1)+'%');s.setProperty('--ang',(mx*60-my*30).toFixed(1)+'deg');s.setProperty('--tilt',t.toFixed(3))}
let touchT=0;
$('#pkFan').addEventListener('pointermove',e=>{const b=e.target.closest&&e.target.closest('.pk-card.up');if(!b)return;const c=b.querySelector('.card'),r=b.getBoundingClientRect();
 const mx=Math.max(-1,Math.min(1,((e.clientX-r.left)/r.width)*2-1)),my=Math.max(-1,Math.min(1,((e.clientY-r.top)/r.height)*2-1));setV(c,mx,my,Math.min(1,.4+Math.hypot(mx,my)*.6));touchT=performance.now()},{passive:true});
function startIdle(){stopIdle();const tick=t=>{idleRaf=requestAnimationFrame(tick);if(performance.now()-touchT<1500)return;
  const k=RM.matches?0:t/2600;dealt.forEach((b,i)=>{if(!b.classList.contains('up')||!b._d.rar)return;const c=b.querySelector('.card');
   if(tilt){setV(c,tilt.x,tilt.y,Math.min(1,.35+Math.hypot(tilt.x,tilt.y)));return}
   setV(c,Math.sin(k+i)*.9,Math.cos(k*.7+i)*.5,RM.matches?.45:.55+.35*Math.sin(k*1.3))})};idleRaf=requestAnimationFrame(tick)}
function stopIdle(){cancelAnimationFrame(idleRaf);idleRaf=0}
$('#pkTilt').addEventListener('click',async()=>{const btn=$('#pkTilt');if(tilt){tilt=null;btn.setAttribute('aria-pressed','false');btn.textContent='Tilt shimmer';live.textContent='Tilt shimmer off.';return}
 try{if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){if(await DeviceOrientationEvent.requestPermission()!=='granted'){live.textContent='Tilt permission was not given. Drag a finger over a rare instead.';return}}
  if(!window.DeviceOrientationEvent){live.textContent='Phone tilt is not available here.';return}
  tilt={x:0,y:0};addEventListener('deviceorientation',e=>{if(!tilt||e.gamma==null)return;tilt.x=Math.max(-1,Math.min(1,e.gamma/30));tilt.y=Math.max(-1,Math.min(1,(e.beta-45)/30))});
  btn.setAttribute('aria-pressed','true');btn.textContent='Tilt shimmer on';live.textContent='Tilt your phone to move the foil.'}catch(_){live.textContent='Phone tilt is not available here.'}});
// ---------- tear gesture: horizontal swipe across the top band; vertical moves are left to page scroll ----------
(()=>{const z=$('#tearZone');let st=null;
 function spring(){if(!cur||cur.torn)return;const from=cur.tear||0;if(RM.matches){cur.tear=0;cur.path=[];drawFoil();return}
  const t0=performance.now();const step=t=>{if(!cur||cur.torn)return;const k=Math.min(1,(t-t0)/260);cur.tear=from*(1-k);if(k<1)requestAnimationFrame(step);else{cur.tear=0;cur.path=[]}};requestAnimationFrame(step)}
 z.addEventListener('pointerdown',e=>{if(!cur||cur.torn||opening)return;const r=foilCv.getBoundingClientRect();st={x:e.clientX,y:e.clientY,t:performance.now(),w:r.width,top:r.top,h:r.height,id:e.pointerId,moved:false}});
 z.addEventListener('pointermove',e=>{if(!st||!cur||e.pointerId!==st.id||cur.torn)return;const dx=e.clientX-st.x,dy=e.clientY-st.y;
  if(Math.hypot(dx,dy)>10)st.moved=true;
  if(Math.abs(dy)>18&&Math.abs(dy)>Math.abs(dx)*1.15){st=null;spring();return}
  const p=Math.max(0,Math.min(1,dx/(st.w*.62)));cur.tear=p;cur.lightHold=performance.now();
  const nx=(e.clientX-(foilCv.getBoundingClientRect().left))/st.w,ny=Math.max(.04,Math.min(.2,(e.clientY-st.top)/st.h));
  cur.path=(cur.path||[]).concat([{x:Math.max(0,Math.min(1,nx)),y:ny}]).slice(-24);
  cur.light={x:nx,y:ny};if(RM.matches)drawFoil();if(p>=1){st=null;tear()}},{passive:true});
 const end=e=>{if(!st||!cur||cur.torn){st=null;return}const s0=st;st=null;const dist=e&&e.clientX!=null?Math.hypot(e.clientX-s0.x,e.clientY-s0.y):99;
  if(!s0.moved&&dist<10&&performance.now()-s0.t<400){tear();return}if((cur.tear||0)<1)spring()};z.addEventListener('pointerup',end);z.addEventListener('pointercancel',()=>{if(st){st=null;spring()}});
 z.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tear()}})})();
$('#pkStage').addEventListener('pointermove',e=>{if(!cur||cur.torn||!foilCv)return;const r=foilCv.getBoundingClientRect();
 cur.light={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};cur.lightHold=performance.now();if(RM.matches)drawFoil()},{passive:true});
$('#pkOpenBtn').addEventListener('click',tear);
$('#pkAnother').addEventListener('click',()=>{const id=cur&&(cur.a.user?'u:'+cur.a.user.id:cur.a.id);if(id)pick(id).then(()=>{if(cur&&cur.a.user&&!left(upacks().find(x=>'u:'+x.id===id)||{q:[],opened:0}))grid()})});
$('#pkDone').addEventListener('click',()=>{APP.show('box');BOX.rebuild();BOX.initState('open');live.textContent='Back to the box. Your pack cards are in it.'});
$('#packBack').addEventListener('click',()=>{if(!$('#packOpen').hidden||!$('#pdfReview').hidden){$('#packOpen').hidden=true;$('#pdfReview').hidden=true;$('#packPick').hidden=false;stopIdle();grid();return}
 APP.show('box');BOX.rebuild();BOX.initState('open')});
$('#packs').addEventListener('click',()=>enter());
// ---------- 10A: PDF -> packs ----------
let rev=[];
function loadReader(){if(window.PDFTEXT)return Promise.resolve();return new Promise((res,rej)=>{const s=document.createElement('script');s.src='js/pdf/pdftext.js';s.onload=()=>res();s.onerror=()=>rej(new Error('PDF reader did not load'));document.head.appendChild(s)})}
$('#pdfPick').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;const st=$('#pdfStat');
 if(f.size>40*1024*1024){st.textContent='That PDF is over 40 MB. Try a smaller one.';return}
 st.textContent='Loading the PDF reader (first time only)\u2026';
 try{await loadReader();st.textContent='Reading text on this phone\u2026';
  const r=await PDFTEXT.extract(await f.arrayBuffer(),(i,n)=>{st.textContent=`Reading page ${i} of ${n} on this phone\u2026`});
  if(!r.text||r.chars<20){st.textContent=`No text found in ${r.pages||0} page${r.pages===1?'':'s'}. This looks like a scanned PDF (pictures of pages). Only text PDFs work; nothing was uploaded.`;return}
  const qs=PDFTEXT.split(r.text);if(!qs.length){st.textContent='Text found, but no quote-sized passages (30\u2013700 characters). Nothing was uploaded.';return}
  st.textContent='';review(qs,f.name,r)}
 catch(err){st.textContent=/encrypt/i.test(err.message)?'This PDF is password-protected or encrypted, so its text cannot be read.':'Could not read this PDF ('+err.message+'). Only text PDFs work.'}});
function review(qs,name,r){rev=qs.map(q=>({q,keep:true}));$('#packPick').hidden=true;$('#pdfReview').hidden=false;
 $('#pdfRevInfo').textContent=`${r.pages} page${r.pages===1?'':'s'} read on this phone \u00b7 ${qs.length} possible quotes. Keep, edit or drop each one, then make packs of 7. Check every quote against the PDF: splitting is automatic.`;
 $('#pdfSrc').value=name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').slice(0,120);$('#pdfWho').value='';drawRev();window.scrollTo(0,0);$('#pdfWho').focus({preventScroll:true})}
function drawRev(){const ol=$('#pdfList');ol.innerHTML=rev.map((x,i)=>`<li class="${x.keep?'':'off'}"><label class="keep"><input type="checkbox" data-i="${i}"${x.keep?' checked':''}> Keep</label><button type="button" class="drop" data-i="${i}" aria-label="Drop quote ${i+1}">Drop</button><textarea data-i="${i}" rows="3" aria-label="Quote ${i+1}">${esc(x.q)}</textarea></li>`).join('');
 ol.querySelectorAll('input').forEach(c=>c.addEventListener('change',()=>{rev[+c.dataset.i].keep=c.checked;c.closest('li').classList.toggle('off',!c.checked);cnt()}));
 ol.querySelectorAll('textarea').forEach(t=>t.addEventListener('input',()=>{rev[+t.dataset.i].q=t.value}));
 ol.querySelectorAll('.drop').forEach(b=>b.addEventListener('click',()=>{rev.splice(+b.dataset.i,1);drawRev()}));cnt()}
function cnt(){const k=rev.filter(x=>x.keep&&x.q.trim()).length;$('#pdfCount').textContent=`${k} kept \u2192 ${Math.ceil(k/7)} pack${Math.ceil(k/7)===1?'':'s'} of up to 7.`}
$('#pdfAll').addEventListener('click',()=>{rev.forEach(x=>x.keep=true);drawRev()});$('#pdfNone').addEventListener('click',()=>{rev.forEach(x=>x.keep=false);drawRev()});
$('#pdfCancel').addEventListener('click',()=>{rev=[];$('#pdfReview').hidden=true;$('#packPick').hidden=false;$('#pdfStat').textContent='Cancelled. Nothing was saved.'});
$('#pdfMake').addEventListener('click',()=>{const who=$('#pdfWho').value.trim().slice(0,80);if(!who){$('#pdfCount').textContent='Type who said these first.';$('#pdfWho').focus();return}
 const q=rev.filter(x=>x.keep).map(x=>x.q.trim().replace(/\s+/g,' ')).filter(x=>x.length>=2).map(x=>x.slice(0,900)).slice(0,1400);if(!q.length){$('#pdfCount').textContent='Keep at least one quote.';return}
 for(let i=q.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[q[i],q[j]]=[q[j],q[i]]}
 const sh=who.split(/\s+/).pop().slice(0,40),all=upacks();all.push({id:newCardId(),who,sh,src:$('#pdfSrc').value.trim().slice(0,160),q,opened:0});
 if(!saveU(all)){$('#pdfCount').textContent='Not enough room on this phone to save these packs.';return}
 rev=[];$('#pdfReview').hidden=true;$('#packPick').hidden=false;grid();{const n=Math.ceil(q.length/7);$('#pdfStat').textContent=`${n} ${sh} pack${n>1?'s':''} made from your PDF. ${n>1?'They stay':'It stays'} on this phone.`};live.textContent=$('#pdfStat').textContent});
return{enter,leave,tear,pick,review,get dealt(){return dealt}}})();
