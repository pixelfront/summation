// Guess the writer. The quote is shown alone. The writer, source and credit are added to the page only after an answer.
// The bundled quote file still contains the answers; this does not hide them from someone reading the files.
window.GUESS=(()=>{
const $=s=>document.querySelector(s),RM=matchMedia('(prefers-reduced-motion: reduce)'),BEST='qc-guess-best';
let pool=null,round=null,session=0,locked=false;
const fold=s=>String(s||'').toLowerCase();
function best(){try{return Math.max(0,parseInt(localStorage.getItem(BEST)||'0',10)||0)}catch(_){return 0}}
function saveBest(){try{if(session>best())localStorage.setItem(BEST,String(session))}catch(_){}}
async function load(){if(pool)return pool;const [d,man]=await Promise.all([fetch('data/packs.json').then(r=>r.json()),fetch('photos/manifest.json').then(r=>r.json())]);
 const poolPhoto={};for(const img of man.images||[])if(img.author&&img.id&&!poolPhoto[img.author])poolPhoto[img.author]='p:'+img.id;
 pool=[];
 for(const a of d.authors)for(const item of (d.pools[a.id]||[])){let q=String(item.q||'').replace(/\s+/g,' ').trim();
  if(a.sh)q=q.replace(new RegExp('\\s*\\('+a.sh.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\)\\s*$','i'),'').trim();
  const low=fold(q);if(!q||fold(a.who)&&low.includes(fold(a.who))||a.sh&&low.includes(fold(a.sh)))continue;
  pool.push({id:a.id,who:a.who,sh:a.sh,photo:a.photo||poolPhoto[a.id]||'',q,src:item.src||''})}
 return pool}
function pick(){const authors=[];for(const p of pool)if(!authors.some(a=>a.id===p.id))authors.push({id:p.id,who:p.who,sh:p.sh,photo:p.photo||''});
 const item=pool[Math.floor(Math.random()*pool.length)];
 const others=authors.filter(a=>a.id!==item.id&&fold(a.who)!==fold(item.who));
 for(let i=others.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[others[i],others[j]]=[others[j],others[i]]}
 const choices=[{id:item.id,who:item.who,sh:item.sh,photo:item.photo||''},others[0],others[1]];
 for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}
 return {quote:item.q,names:choices.map(c=>c.who),choices,answer:choices.findIndex(c=>c.id===item.id),who:item.who,src:item.src}}
function scoreLine(){const el=$('#gzScore');if(el)el.textContent=`This sitting: ${session}. Best on this phone: ${Math.max(session,best())}.`}
function show(){if(!round)return;const q=$('#gzQuote'),box=$('#gzChoices'),res=$('#gzResult');
 q.textContent=round.quote;q.setAttribute('aria-label','Quote');
 box.innerHTML='';box.classList.toggle('gz-live',!RM.matches);res.hidden=true;res.textContent='';
 round.choices.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='gz-choice';b.setAttribute('aria-label',c.who);
  b.style.setProperty('--inkc',inkOf({author:c.id,sh:c.sh,who:c.who,photo:c.photo}));
  const stage=document.createElement('span');stage.className='gz-stage';stage.setAttribute('aria-hidden','true');
  const card=document.createElement('span');card.className='gz-card';
  const front=document.createElement('span');front.className='gz-face gz-front';
  if(c.photo){const img=document.createElement('img');img.alt='';img.src=photoSrc({photo:c.photo});front.appendChild(img)}
  const back=document.createElement('span');back.className='gz-face gz-back';
  card.append(front,back);stage.appendChild(card);
  const name=document.createElement('span');name.className='gz-name';name.textContent=c.who;
  b.append(stage,name);b.addEventListener('click',()=>answer(i));box.appendChild(b)});
 scoreLine();locked=false}
function moveChoice(dir){const btns=[...document.querySelectorAll('#gzChoices .gz-choice')];if(!btns.length)return;let i=btns.indexOf(document.activeElement);if(i<0)i=0;else i=Math.max(0,Math.min(btns.length-1,i+dir));btns[i].focus()}
function answer(i){if(locked||!round)return;locked=true;const ok=i===round.answer;if(ok){session++;saveBest()}
 const box=$('#gzChoices');box.classList.remove('gz-live');[...box.children].forEach((b,k)=>{b.disabled=true;b.classList.add('done');
  if(k===round.answer)b.classList.add('right');else if(k===i)b.classList.add('wrong')});
 const res=$('#gzResult');res.hidden=false;
 res.textContent=ok?`Yes. ${round.who}. ${round.src}`:`No. The writer is ${round.who}. ${round.src}`;
 scoreLine();const live=$('#live');if(live)live.textContent=res.textContent}
async function open(){await load();if(pool.length<3)return;round=pick();show();const live=$('#live');if(live)live.textContent='Guess the writer. Three names. No timer.'}
$('#gzNext')&&$('#gzNext').addEventListener('click',()=>{if(pool){round=pick();show()}});
$('#gzChoices').addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowRight'){e.preventDefault();moveChoice(1)}else if(e.key==='ArrowUp'||e.key==='ArrowLeft'){e.preventDefault();moveChoice(-1)}});
return {open,get session(){return session},load,pick}})();
