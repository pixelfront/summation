// Quote Deck v2, milestone 1: card face markup + quote fitting.
// Ported from design sandbox v2 src/deck2.js (BUST, FRAME, frontHTML, backHTML, cardHTML, fitQuote, wireWell).
// No network, no libraries.
const BUST='<svg viewBox="0 0 200 210" aria-hidden="true" focusable="false"><path class="s" d="M14 210 L30 168 L70 148 L100 158 L130 148 L170 168 L186 210 Z"/><path class="s" d="M82 126 L84 150 L100 158 L116 150 L118 126 Z"/><path class="s" d="M100 26 L133 39 L144 72 L139 104 L122 127 L100 137 L78 127 L61 104 L56 72 L67 39 Z"/><path class="f" d="M100 26 L100 137 M67 39 L100 68 L133 39 M56 72 L100 68 L144 72 M61 104 L100 110 L139 104 M78 127 L100 110 L122 127 M30 168 L100 158 L170 168 M70 148 L84 150 M130 148 L116 150"/></svg>';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cardNo=d=>'N\u00ba '+String(d.no||0).padStart(2,'0');
// Photos ship as files under assets/authors/<id>.jpg (5:7 JPEG), not inlined data URIs.
// d.photo: 'data:...' (received by QR, M5) | 'a:<authorId>' (creator, M3) | '<authorId>' (sample deck).
const PHOTO_DIR='assets/authors/';
// Pack bytes changed in place (same ids). A query keeps saved p: ids and skips a browser HTTP cache entry left by v12.
const PACK_REV='14';
// M5: random card ids (no clock). 72 random bits, base64url, prefix 'q'. Old 'm'+time ids from M3/M4 still load.
const newCardId=()=>{const a=new Uint8Array(9);crypto.getRandomValues(a);return 'q'+btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const LEGACY_ID=/^m[0-9a-z]{6,10}$/;
const photoSrc=d=>!d.photo?'':d.photo.startsWith('data:')?d.photo:d.photo.startsWith('p:')?'assets/packs/'+encodeURIComponent(d.photo.slice(2))+'.jpg?v='+PACK_REV:PHOTO_DIR+encodeURIComponent(d.photo.replace(/^a:/,''))+'.jpg';
const FRAME='<svg class="frame" aria-hidden="true" viewBox="0 0 300 420" preserveAspectRatio="none"><polygon class="fr-matte" points="18,1 299,1 299,402 282,419 1,419 1,18" stroke="#ff2a2a" stroke-width="2"/><polygon class="fr-holo" points="18,1 299,1 299,402 282,419 1,419 1,18" stroke="url(#chrome)" stroke-width="2"/><polygon class="fr-holo" points="22,6 294,6 294,399 279,414 6,414 6,22" stroke="#ffffff40" stroke-width="1"/></svg>';
const CHROME_DEFS='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#7a7a7a"/><stop offset=".5" stop-color="#f2f2f2"/><stop offset=".75" stop-color="#5a5a5a"/><stop offset="1" stop-color="#d8d8d8"/></linearGradient></defs></svg>';
// ---- long quotes: shrink-to-fit by default, scroll well for huge excerpts.
const LQ={HUGE:320,FLOOR:12,WELL:15,COMPACT:130};
const qmark=t=>`<i class="qm">\u201c</i>${esc(t)}<i class="qm">\u201d</i>`;
function quoteBlock(d,mode){return mode==='scroll'
 ?`<div class="lq-well"><div class="lq-scroll" tabindex="-1" role="region" aria-label="Quote, scrolls. ${esc(d.q)}">${qmark(d.q)}</div><div class="rail" aria-hidden="true"><i></i></div><span class="more" aria-hidden="true">SCROLL \u2193</span></div>`
 :`<div class="b-q"><span>${esc(d.q)}</span></div>`}
// Front = the person: full-bleed portrait (natural aspect, object-fit cover, face in the upper third), number chip and a slim name plate.
// Back = the words: name bar, the quote (shrink-to-fit / scroll well), attribution, notes, credit. The quote never sits on the photo.
function frontHTML(d,id){const ph=photoSrc(d);
 return `<div class="face front"${id?` id="${id}"`:''}>
 <div class="win hero"><div class="lyr bgl"><div class="grid"></div><div class="mid"></div>${ph?`<img class="ph-bg" alt="" src="${ph}">`:''}</div><div class="lyr subj"><div class="bust">${BUST}</div>${ph?`<img class="ph-img" alt="" src="${ph}">`:''}</div><span class="tag">NO PHOTO</span></div>
 <span class="f-no">${cardNo(d)}</span>
 <div class="f-plate"><b>${esc(d.sh)}</b>${d.trot?'<i class="f-trot">(TROTSKYITE)</i>':''}</div>
 <div class="fx shine"></div><div class="fx holo"></div><div class="fx spark"></div><div class="fx glare"></div>${FRAME}${d.rar==='g'?'<i class="gold-trim" aria-hidden="true"><i></i></i>':''}</div>`}
function backHTML(d,id){return `<div class="face back"${id?` id="${id}"`:''}>
 <div class="b-bar"><span class="b-no">${cardNo(d)}</span><b>${esc(d.sh)}</b></div>
 <div class="qslot">${quoteBlock(d,'fit')}</div>
 <div class="b-foot"><b>${esc(d.who)}</b><span>${esc(d.src)}</span></div>
 ${d.notes?`<div class="bk-notes"><span class="bk-h">Notes</span><p>${esc(d.notes)}</p></div>`:''}
 <div class="bk-cr"><svg class="emb" aria-hidden="true" viewBox="0 0 120 120"><polygon points="60,8 73,45 112,45 80,68 92,106 60,83 28,106 40,68 8,45 47,45" fill="none" stroke="#ff2a2a" stroke-width="6" stroke-linejoin="round"/></svg><span>Quote deck · ${d.photo?(d.recv?'photo travelled by QR':d.pc?esc(d.pc.replace(/^Photo: /,'photo: ')):d.author?'photo: marxists.org (MIA)':'photo public domain'):'photo placeholder'}</span></div>
 <div class="fx shine"></div><div class="fx holo"></div><div class="fx glare"></div>${FRAME}${d.rar==='g'?'<i class="gold-trim" aria-hidden="true"><i></i></i>':''}</div>`}
function cardClasses(d){const L=d.q.length,bl=d.sh.length;return{cls:`card${d.holo||d.rar==='h'?' holo-on':''}${d.rar==='g'?' rar-gold':d.rar==='h'?' rar-holo':''}${photoSrc(d)?' has-photo':''}`,len:L<45?'s':L<80?'m':L<130?'l':'xl',bar:bl<=7?'s':bl<=10?'m':'l'}}
function cardHTML(d,withBack){const c=cardClasses(d);const named=withBack===true;
 return `<div class="${c.cls}" data-len="${c.len}" data-bar="${c.bar}" aria-hidden="true">${frontHTML(d,named?'front':'')}${withBack?backHTML(d,named?'back':''):''}</div>`}
// Must run while the card is laid out (display != none). Returns {mode,px}.
function fitQuote(cardEl,d){const slot=cardEl.querySelector('.qslot');let mode=d.q.length>LQ.HUGE?'scroll':'fit',px=0;
 if(!slot){cardEl.dataset.qmode=mode;return{mode,px:0}} // front-only card (carousel, thumbs): the quote lives on the back
 if(mode==='fit'){slot.innerHTML=quoteBlock(d,'fit');const q=slot.querySelector('.b-q');q.style.fontSize='';
  if(q.scrollHeight>q.clientHeight+1){let lo=LQ.FLOOR,hi=parseFloat(getComputedStyle(q).fontSize),b=LQ.FLOOR;
   while(hi-lo>.4){const m=(lo+hi)/2;q.style.fontSize=m+'px';if(q.scrollHeight<=q.clientHeight+1){b=m;lo=m}else hi=m}
   q.style.fontSize=b+'px';if(q.scrollHeight>q.clientHeight+1)mode='scroll'}
  px=parseFloat(q.style.fontSize||getComputedStyle(q).fontSize)}
 if(mode==='scroll'){slot.innerHTML=quoteBlock(d,'scroll');px=LQ.WELL;wireWell(cardEl)}
 cardEl.dataset.qmode=mode;return{mode,px:Math.round(px*10)/10}}
function wireWell(cardEl){const sc=cardEl.querySelector('.lq-scroll');if(!sc)return;const th=cardEl.querySelector('.rail i'),rail=cardEl.querySelector('.rail'),more=cardEl.querySelector('.more');
 function upd(){const H=sc.scrollHeight,h=sc.clientHeight,t=sc.scrollTop,f=H>h+1;rail.style.display=f?'':'none';
  th.style.height=(h/H*100)+'%';th.style.top=(t/H*100)+'%';sc.style.setProperty('--ft',t>2?'18px':'0px');sc.style.setProperty('--fb',t<H-h-2?'22px':'0px');
  if(more)more.style.opacity=f&&t<8?1:0}
 sc.addEventListener('scroll',upd,{passive:true});sc._upd=upd;
 // own drag-to-scroll for every pointer type, so the rotate stage never steals it
 let dr=null;sc.addEventListener('pointerdown',e=>{if(!sc.closest('.interactive'))return;e.stopPropagation();dr={y:e.clientY,t:sc.scrollTop,id:e.pointerId};try{sc.setPointerCapture(e.pointerId)}catch(_){}});
 sc.addEventListener('pointermove',e=>{if(dr){e.stopPropagation();sc.scrollTop=dr.t-(e.clientY-dr.y);upd()}});
 const end=e=>{if(dr){e.stopPropagation();dr=null}};sc.addEventListener('pointerup',end);sc.addEventListener('pointercancel',end);
 upd()}

// Sample cards for the M1 demo only (public quotes; portraits from marxists.org, public domain per MIA).
const SAMPLE_DECK=[
 {id:'c01',who:"Karl Marx",sh:"Marx",q:"The philosophers have only interpreted the world, in various ways; the point is to change it.",src:"Theses on Feuerbach, 1845",photo:'marx',author:'marx',notes:"Thesis XI."},
 {id:'c02',who:"V. I. Lenin",sh:"Lenin",q:"Without revolutionary theory there can be no revolutionary movement.",src:"What Is to Be Done?, 1902",photo:'lenin',author:'lenin',holo:1},
 {id:'c03',who:"Mao Zedong",sh:"Mao",q:"A revolution is not a dinner party.",src:"Report on the Peasant Movement in Hunan, 1927",photo:'pd-mao',pc:'Photo: Public domain',holo:1},
 {id:'c04',who:"Karl Marx",sh:"Marx",q:"Men make their own history, but they do not make it as they please; they do not make it under self-selected circumstances, but under circumstances existing already, given and transmitted from the past. The tradition of all dead generations weighs like a nightmare on the brains of the living.",src:"The Eighteenth Brumaire of Louis Bonaparte, 1852",photo:'marx',author:'marx'},
 {id:'c05',who:"Karl Marx",sh:"Marx",q:"The history of all hitherto existing society is the history of class struggles. Freeman and slave, patrician and plebeian, lord and serf, guild-master and journeyman, in a word, oppressor and oppressed, stood in constant opposition to one another, carried on an uninterrupted, now hidden, now open fight, a fight that each time ended, either in a revolutionary reconstitution of society at large, or in the common ruin of the contending classes.",src:"Manifesto of the Communist Party, 1848",photo:'marx',author:'marx',holo:1},
 {id:'c07',who:"Joseph Stalin",sh:"Stalin",q:"Cadres decide everything.",src:"Speech to Red Army graduates, 1935",photo:'pd-stalin',pc:'Photo: Public domain'}];
// M5 (Chair decision): demo cards are never sendable, so Restore deck cannot mint transferable copies.
// feedback: c06 (Trotskyite) left the stock deck; its id stays reserved as a sample so an old copy can never be sent.
const isSample=id=>id==='c06'||SAMPLE_DECK.some(x=>x.id===id);
SAMPLE_DECK.forEach((d,i)=>d.no=i+1);
// feedback: Cassette skin shows each quote on a 3D tape (front label = quote, spine = name). Pure CSS 3D.
function tapeHTML(d){const q=d.q.length>150?d.q.slice(0,147)+'\u2026':d.q;
 return `<span class="tape3d" aria-hidden="true"><span class="tp tp-front"><span class="tp-lbl"><span class="tp-h"><b>${esc(d.sh)}</b><i>${cardNo(d)}</i><em>A</em></span><span class="tp-q">\u201c${esc(q)}\u201d</span><span class="tp-src">${esc(d.who)} \u00b7 ${esc(d.src)}</span></span><span class="tp-win"><i class="tp-reel"></i><i class="tp-band"></i><i class="tp-reel"></i></span><span class="tp-trap"></span></span><span class="tp tp-back"></span><span class="tp tp-top"><b>${esc(d.sh)}</b></span><span class="tp tp-bot"></span><span class="tp tp-l"></span><span class="tp tp-r"></span></span>`}
