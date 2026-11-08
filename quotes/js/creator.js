// Card creator: pick a writer from the bundled catalog (js/authors.js loads data/authors.json), paste a quote,
// preview front (portrait or bust) + back, add the card to the box. Ported from design sandbox v2 src/creator.js.
// M3 changes: catalog and portraits are separate local files (assets/authors/<id>.jpg), loaded after AUTHORS_READY;
// Commons photo credit (pc) is carried onto the card; outside links open only when tapped. Made cards are saved by the STORE (IndexedDB since M4).
window.CREATOR=(()=>{const $=s=>document.querySelector(s);const P=new URLSearchParams(location.search);
let AU=[],byId={},ready=false;
const fold=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const view=$('#makeView'),inp=$('#auQ'),list=$('#auList'),cnt=$('#auCount'),prev=$('#mkPrev'),q=$('#mkQ'),src=$('#mkSrc'),pickd=$('#auPicked'),live=$('#live');
let filt='all',hits=[],act=-1,author=null,flip=false,ownPhoto='';
// feedback: Trotskyite writers hidden unless the device setting 'qc-show-trot' is '1' (default off). Not a filter.
const TKEY='qc-show-trot',showTrot=()=>{try{return localStorage.getItem(TKEY)==='1'}catch(_){return false}};
// free-typed name: same clean as received card fields (no control chars, length cap)
const cleanTxt=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const freeName=()=>author?'':cleanTxt(inp.value,120);
const surname=n=>{const w=n.replace(/\(.*?\)/g,'').trim().split(/\s+/);const parts=w.filter(x=>!/^(de|von|van|der|la|le|du|da|di)$/i.test(x));return (parts[parts.length-1]||n).replace(/[.,]/g,'')};
const thumb=a=>a.p?`<img alt="" loading="lazy" decoding="async" src="${photoSrc({photo:'a:'+a.id})}">`:`<span class="nobust">${BUST}</span>`;
function yearsOf(a){return a.lb?`${a.lb}${a.ld?'\u2013'+a.ld:''}`:''}
function rowLabel(a){const bits=[a.d];const y=yearsOf(a);if(y)bits.push(y+(a.lp?`, from the Wikipedia page ${a.lp}`:''));if(a.s)bits.push(a.s);return bits.join(', ')}
function search(){if(!ready){cnt.textContent='Loading writer list\u2026';return}const t=fold(inp.value).trim().split(/\s+/).filter(Boolean);
 hits=AU.filter(a=>(showTrot()||!a.t)&&(filt==='all'||(filt==='photo'&&a.p))&&t.every(w=>a._k.includes(w)));
 if(!hits.length)act=-1;else if(act>=hits.length)act=hits.length-1;
 list.innerHTML=hits.map((a,i)=>{const dates=yearsOf(a);const tag=a.s?esc(a.s):'';const from=dates&&a.lp?a.lp:'';
  return `<li role="option" id="au-${i}" data-id="${a.id}" aria-selected="${i===act}" class="${i===act?'act':''}" aria-label="${esc(rowLabel(a))}">
  <span class="au-th">${thumb(a)}</span><span class="au-tx"><b>${esc(a.d)}</b><small>${[dates,from,tag].filter(Boolean).join(' \u00b7 ')}</small></span>${a.p?'':'<em>NO PHOTO</em>'}</li>`}).join('')
  +(!hits.length?'<li class="au-more">No writer matches. Try a surname, or a section like \u201cmaoism\u201d.</li>':'');
 cnt.textContent=`${hits.length} of ${AU.length} writers`;
 inp.setAttribute('aria-activedescendant',act>=0?'au-'+act:'');
 inp.setAttribute('aria-expanded','true');const use=$('#auUse');if(use)use.hidden=act<0;
 if(timelineOn)renderChron();const cur=act>=0?list.querySelector('.act'):null;if(cur&&!timelineOn)cur.scrollIntoView({block:'nearest'})}
function highlight(i){act=i;list.querySelectorAll('li[data-id]').forEach((li,k)=>{const on=k===i;li.classList.toggle('act',on);li.setAttribute('aria-selected',String(on))});
 inp.setAttribute('aria-activedescendant',i>=0?'au-'+i:'');const use=$('#auUse');if(use)use.hidden=i<0;if(timelineOn)renderChron();
 if(i>=0)live.textContent=`${hits[i].d} selected. Use this author to confirm.`}
function choose(id){if(!ready)return;const a=byId[id];if(!a||(a.t&&!showTrot()))return;author=a;inp.value=a.d;SFX.click&&SFX.click();
 pickd.innerHTML=`<span class="au-th big">${thumb(a)}</span><span class="au-tx"><b>${esc(a.d)}</b><small>${esc([a.s||'',yearsOf(a)].filter(Boolean).join(' \u00b7 '))}</small><small>${a.p?(a.pc?esc(a.pc):'Photo: Marxists Internet Archive (believed public domain)'):'No usable portrait: card uses the wireframe bust'}</small></span>`;
 pickd.hidden=false;render();live.textContent=`${a.d} picked${a.p?', with photo':', no photo, bust placeholder'}.`}
function draft(){const a=author,fn=freeName();return{id:'preview',no:nextNo(),who:a?a.d:fn||'Pick or type a writer',sh:a?surname(a.n):fn?cleanTxt(surname(fn),40):'\u2014',q:q.value.trim()||'Type the quote. Short ones go big, long ones shrink, huge ones get the scroll well.',
 src:src.value.trim()||(a?'Source, year':''),photo:ownPhoto||(a&&a.p?'a:'+a.id:''),pc:ownPhoto?'Photo: own image':(a&&a.p&&a.pc?a.pc:''),trot:a&&a.t?1:0,author:a?a.id:'',notes:a?`${[a.s||'',yearsOf(a)].filter(Boolean).join(' \u00b7 ')}`:''}}
function render(){const d=draft();const c=cardClasses(d);
 prev.innerHTML=`<div class="${c.cls}${flip?' show-back':''}" data-len="${c.len}" data-bar="${c.bar}" aria-hidden="true">${frontHTML(d)}${backHTML(d)}</div>`;
 const el=prev.firstElementChild;el.style.transform=flip?'rotateY(180deg)':'';fitQuote(el,d);$('#mkAdd').disabled=!(author||freeName())||!q.value.trim();
 const mf=$('#mkFree');mf.hidden=!!author||!freeName();mf.textContent=`Typed name: ${freeName()} (not from the list${ownPhoto?'':', wireframe bust unless you add an image'})`;
 $('#mkFlip').textContent=flip?'Show front':'Show back'}
function nextNo(){const s=STORE.get();return Math.max(0,...BASE_DECK.map(d=>d.no),...s.received.map(d=>d.no||0),...(s.made||[]).map(d=>d.no||0))+1}
let timelineOn=false,eraAt=0;
function placed(){return hits.filter(a=>a.lb).slice().sort((a,b)=>a.lb-b.lb||a.d.localeCompare(b.d))}
function renderChron(){const box=$('#chronList');if(!box||!timelineOn)return;
 const rows=placed();let era='',html='';
 rows.forEach(a=>{const decade=Math.floor(a.lb/10)*10;if(decade!==era){era=decade;html+=`<h3 class="chron-era" data-era="${decade}">${decade}s</h3>`}
  const on=act>=0&&hits[act]&&hits[act].id===a.id;
  html+=`<button type="button" class="chron-row${on?' act':''}" role="listitem" data-id="${a.id}" aria-pressed="${on}"><b>${yearsOf(a)}</b><span>${thumb(a)}<strong>${esc(a.d)}</strong><small>${esc([a.lp,a.s].filter(Boolean).join(' \u00b7 '))}</small></span></button>`});
 const keep=box.scrollTop;box.innerHTML=html||'<p class="note">No sourced years in this search.</p>';box.scrollTop=keep;
 box.querySelectorAll('.chron-row').forEach(b=>b.addEventListener('click',()=>{const i=hits.findIndex(h=>h.id===b.dataset.id);if(i>=0)highlight(i);const a=byId[b.dataset.id];const peek=$('#chronPeek');if(peek&&a)peek.textContent=`${a.d}, ${yearsOf(a)}${a.lp?'. Wikipedia page '+a.lp+'.':'.'} Use this author to confirm.`}));
 const u=hits.filter(a=>!a.lb);const und=$('#auUndated');if(und){und.hidden=false;und.textContent=u.length?`No sourced year, not on this timeline: ${u.length} writers. Switch off By year and pick them from the name list.`:'Everyone in this search has a sourced year.'}
 const eras=[...box.querySelectorAll('.chron-era')];if(eraAt>=eras.length)eraAt=Math.max(0,eras.length-1);const cur=eras[eraAt];const lab=$('#chronEra');if(lab)lab.textContent=cur?cur.textContent:'Years'}
function stepEra(dir){const box=$('#chronList'),eras=[...box.querySelectorAll('.chron-era')];if(!eras.length)return;eraAt=Math.max(0,Math.min(eras.length-1,eraAt+dir));box.scrollTop=eras[eraAt].offsetTop;const lab=$('#chronEra');if(lab)lab.textContent=eras[eraAt].textContent}
inp.addEventListener('input',()=>{if(author&&inp.value!==author.d){author=null;pickd.hidden=true}act=0;search();render()});inp.addEventListener('focus',search);
inp.addEventListener('keydown',e=>{const n=hits.length;
 if(e.key==='ArrowDown'){e.preventDefault();highlight(Math.min(n-1,act+1));$('#au-'+act)?.scrollIntoView({block:'nearest'})}
 else if(e.key==='ArrowUp'){e.preventDefault();highlight(Math.max(0,act-1));$('#au-'+act)?.scrollIntoView({block:'nearest'})}
 else if(e.key==='Enter'){e.preventDefault();if(act>=0&&hits[act])choose(hits[act].id)}
 else if(e.key==='Escape'){highlight(-1)}});
let lg=null;
list.addEventListener('pointerdown',e=>{const li=e.target.closest('li[data-id]');if(!li)return;lg={x:e.clientX,y:e.clientY,t:performance.now(),id:li.dataset.id,moved:false}});
list.addEventListener('pointermove',e=>{if(lg&&Math.hypot(e.clientX-lg.x,e.clientY-lg.y)>10)lg.moved=true});
list.addEventListener('pointercancel',()=>{if(lg)lg.moved=true});
list.addEventListener('pointerup',e=>{if(!lg)return;const g=lg;lg=null;if(g.moved||performance.now()-g.t>500)return;const li=e.target.closest('li[data-id]');if(!li||li.dataset.id!==g.id)return;const i=hits.findIndex(a=>a.id===li.dataset.id);if(i>=0)highlight(i)});
$('#auUse').addEventListener('click',()=>{if(act>=0&&hits[act])choose(hits[act].id)});
$('#auTime').addEventListener('click',()=>{timelineOn=!timelineOn;const b=$('#auTime');b.setAttribute('aria-pressed',String(timelineOn));
 $('#auChron').hidden=!timelineOn;$('#auList').hidden=timelineOn;if(!timelineOn)$('#auUndated').hidden=true;else{eraAt=0;renderChron()}
 live.textContent=timelineOn?'By year. Earlier and Later move one decade. The names do not move on their own.':'Name list.'});
$('#chronPrev').addEventListener('click',()=>stepEra(-1));
$('#chronNext').addEventListener('click',()=>stepEra(1));
document.querySelectorAll('#auFilt button[data-f]').forEach(b=>b.addEventListener('click',()=>{filt=b.dataset.f;document.querySelectorAll('#auFilt button[data-f]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));act=0;search();inp.focus()}));
q.addEventListener('input',render);src.addEventListener('input',render);
$('#mkFlip').addEventListener('click',()=>{flip=!flip;render()});
$('#mkAdd').addEventListener('click',()=>{if(!(author||freeName())||!q.value.trim())return;const d=Object.assign(draft(),{id:newCardId()});
 const s=STORE.get();s.made=(s.made||[]).concat([d]);STORE.set(s);if(window.STATS)STATS.made(d.id);SFX.done&&SFX.done();live.textContent=`Card ${cardNo(d)} added to the box.`;
 q.value='';src.value='';author=null;ownPhoto='';$('#mkImg').value='';$('#mkImgClear').hidden=true;inp.value='';pickd.hidden=true;flip=false;
 APP.show('box');BOX.rebuild();BOX.initState('open');BOX.focusId(d.id)});
$('#mkCancel').addEventListener('click',()=>{APP.show('box')});
$('#make').addEventListener('click',()=>{APP.show('make',inp);search();render()});
const loaded=(window.AUTHORS_READY||Promise.resolve([])).then(list=>{AU=list;byId=Object.fromEntries(AU.map(a=>[a.id,a]));
 const ALIAS={engels:'friedrich engels',mao:'mao zedong mao tse-tung mao tsetung',lenin:'vladimir ilyich ulyanov ulianov',stalin:'djugashvili jughashvili','kim-il-sung':'kim il sung kim ilsong'};
 AU.forEach(a=>{a._k=fold(a.n+' '+a.d+' '+a.s+' '+(a.lb?a.lb+' '+(a.ld||''):'')+' '+(ALIAS[a.id]||'')+(a.t?' trotskyite trotskyist':''))});ready=true;
 stats();
 if(!view.hidden&&!list.hidden)search();return AU}).catch(err=>{$('#auStats').textContent='Writer list failed to load. Open this page over http (not as a file).';cnt.textContent='';live.textContent='Writer list failed to load.';console.warn('writer list:',err&&err.message);return []});
function stats(){const v=AU.filter(a=>showTrot()||!a.t);$('#auStats').textContent=`${v.length} writers \u00b7 ${v.filter(a=>a.p).length} with portraits`}
const st=$('#setTrot');st.checked=showTrot();st.addEventListener('change',()=>{try{localStorage.setItem(TKEY,st.checked?'1':'0')}catch(_){}if(author&&author.t&&!st.checked){author=null;inp.value='';pickd.hidden=true}stats();if(!list.hidden)search();render();live.textContent=st.checked?'Trotskyite writers shown in the list.':'Trotskyite writers hidden.'});
// own image: decode locally, redraw to a 600x840 JPEG (cover crop). Redrawing drops EXIF/GPS. data: URL only; STORE keeps it as a blob in IndexedDB.
$('#mkImg').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(!/^image\//.test(f.type)){live.textContent='That file is not an image.';return}
 const u=URL.createObjectURL(f);try{const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=u});
  const W=600,H=840,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,W,H);
  const k=Math.max(W/img.naturalWidth,H/img.naturalHeight),w=img.naturalWidth*k,h=img.naturalHeight*k;x.drawImage(img,(W-w)/2,(H-h)*.22,w,h);
  ownPhoto=cv.toDataURL('image/jpeg',.85);$('#mkImgClear').hidden=false;render();live.textContent='Image added to the card.'}
 catch(_){live.textContent='Could not read that image.'}finally{URL.revokeObjectURL(u)}});
$('#mkImgClear').addEventListener('click',()=>{ownPhoto='';$('#mkImg').value='';$('#mkImgClear').hidden=true;render();live.textContent='Image removed.'});
async function preset(){await loaded;if(P.get('q'))inp.value=P.get('q');/* M5 privacy: no ?quote= / ?src= prefill, so quote text never lands in browser history */if(P.get('flip'))flip=true;
 if(P.get('filt')==='photo'){const b=document.querySelector(`#auFilt button[data-f="${P.get('filt')}"]`);b&&b.click()}
 if(P.get('author'))choose(P.get('author'));search();render()}
return{choose,render,preset,search,loaded,get author(){return author}}})();
