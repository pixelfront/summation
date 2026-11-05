// 1A: in the CASSETTE box style the abstract shelf is replaced by vintage J-card cases.
// Shelf = row of spines (one per writer, plus MINE = cards you made or received; pack cards file under their writer).
// Tap a spine -> that writer's cases slide up (240 ms). Each tape has its own case: clear shell + J-card insert
// (spine strip, grayscale photo, #f2f2ec paper panel with red name bar). Tap a case -> lid hinges open 110deg (280 ms)
// and the tape slides out 40 px (220 ms, 120 ms delay). Tap the tape -> the PICKED panel (View / Send / Burn).
// Reduced motion: instant state changes. Rebuilt from STORE whenever the box rebuilds.
window.CASES=(()=>{const $=s=>document.querySelector(s),root=$('#cases'),live=$('#live'),RM=matchMedia('(prefers-reduced-motion: reduce)');
let group=null,openId=null;
const active=()=>document.body.dataset.skin==='cassette'&&!root.hidden;
const keyOf=d=>(d.recv||(!isSample(d.id)&&!d.pk))?'MINE':String(d.sh||'?').toUpperCase();
function groups(){const g=new Map();BOX.deck.forEach((d,i)=>{const k=keyOf(d);if(!g.has(k))g.set(k,[]);g.get(k).push(i)});
 const ks=[...g.keys()].filter(k=>k!=='MINE').sort();if(g.has('MINE'))ks.push('MINE');return ks.map(k=>({k,ix:g.get(k)}))}
function jcard(d){const ph=photoSrc(d);return `<span class="jc" aria-hidden="true"><span class="jc-spine"><b>${esc(d.sh)}</b><i>${cardNo(d)}</i></span>`+
 `<span class="jc-photo">${ph?`<img src="${esc(ph)}" alt="" loading="lazy" decoding="async">`:`<span class="jc-bust">${BUST}</span>`}</span>`+
 `<span class="jc-paper"><span class="jc-bar">${esc(d.who)}</span><span class="jc-q">\u201c${esc(d.q.length>120?d.q.slice(0,117)+'\u2026':d.q)}\u201d</span><span class="jc-src">${esc(d.src||'')}</span>${d.rar==='g'?'<span class="jc-rar g">GOLD</span>':d.rar==='h'?'<span class="jc-rar h">HOLO</span>':''}</span></span>`}
function tape(d){return `<span class="ct" aria-hidden="true"><span class="ct-lbl"><b>${esc(d.sh)}</b><em>A</em><span class="ct-q">${esc(d.q.length>70?d.q.slice(0,67)+'\u2026':d.q)}</span></span><span class="ct-win"><i class="ct-reel"></i><i class="ct-band"></i><i class="ct-reel"></i></span><span class="ct-trap"></span></span>`}
function render(){if(!active())return;const gs=groups();if(!gs.length){root.innerHTML='<p class="hint">No tapes. Open a pack or make a card.</p>';return}
 if(!group||!gs.find(g=>g.k===group))group=gs[0].k;const g=gs.find(x=>x.k===group);
 root.innerHTML=`<div class="shelf" role="tablist" aria-label="Tape shelf">${gs.map(x=>`<button type="button" role="tab" class="spine${x.k==='MINE'?' mine':''}" data-k="${esc(x.k)}" aria-selected="${x.k===group}" aria-controls="caseRow"><b>${esc(x.k)}</b><i>\u00d7${x.ix.length}</i></button>`).join('')}</div>`+
 `<div class="caserow${RM.matches?'':' rise'}" id="caseRow" role="tabpanel" aria-label="${esc(group)} tapes">${g.ix.map(i=>{const d=BOX.deck[i];const o=d.id===openId;
  return `<div class="case${o?' open':''}" data-id="${esc(d.id)}" data-i="${i}"><button type="button" class="case-shell" aria-expanded="${o}" aria-label="${esc(`${cardNo(d)} ${d.who} tape case, ${o?'open':'closed'}. Tap to ${o?'close':'open'}`)}"><span class="case-lid">${jcard(d)}</span><span class="case-base"></span></button>`+
  `<button type="button" class="case-tape" tabindex="${o?0:-1}" aria-hidden="${!o}" aria-label="${esc(`Play tape: ${d.who}, \u201c${d.q.slice(0,80)}\u201d. Opens the picked panel`)}">${tape(d)}</button></div>`}).join('')}</div>`;
 root.querySelectorAll('.spine').forEach(b=>b.addEventListener('click',()=>{group=b.dataset.k;openId=null;render();(window.SFX&&SFX.click)&&SFX.click();live.textContent=`${group} shelf: ${groups().find(x=>x.k===group).ix.length} tapes.`;
  const s=root.querySelector(`.spine[data-k="${CSS.escape(group)}"]`);s&&s.focus({preventScroll:true})}));
 root.querySelectorAll('.case').forEach(c=>{c.querySelector('.case-shell').addEventListener('click',()=>toggle(c));
  c.querySelector('.case-tape').addEventListener('click',()=>{BOX.select(+c.dataset.i)})})}
function toggle(c){const id=c.dataset.id,was=c.classList.contains('open');root.querySelectorAll('.case.open').forEach(o=>{if(o!==c){o.classList.remove('open');sync(o)}});
 c.classList.toggle('open',!was);openId=was?null:id;sync(c);if(window.SFX)(was?SFX.close:SFX.open)&&(was?SFX.close():SFX.open());
 const d=BOX.deck[+c.dataset.i];live.textContent=was?'Case closed.':`Case open. ${d.who} tape slid out; tap it to pick it.`;if(was&&BOX.sel>=0)BOX.select(-1)}
function sync(c){const o=c.classList.contains('open'),s=c.querySelector('.case-shell'),t=c.querySelector('.case-tape'),d=BOX.deck[+c.dataset.i];
 s.setAttribute('aria-expanded',String(o));s.setAttribute('aria-label',`${cardNo(d)} ${d.who} tape case, ${o?'open':'closed'}. Tap to ${o?'close':'open'}`);t.tabIndex=o?0:-1;t.setAttribute('aria-hidden',String(!o))}
function refresh(){const on=document.body.dataset.skin==='cassette';root.hidden=!on;document.body.classList.toggle('cases-on',on);if(on)render()}
function el(id){const c=root.querySelector(`.case[data-id="${CSS.escape(id)}"]`);return c}
// follow the box: rebuilds (new cards, burns, skin switch) re-render the shelf
new MutationObserver(()=>{if(document.body.dataset.skin==='cassette')refresh()}).observe($('#cards'),{childList:true});
new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['data-skin']});
refresh();
return{refresh,active,el,open(id){const c=el(id);if(c&&!c.classList.contains('open'))toggle(c)},group:k=>{group=k;render()}}})();
