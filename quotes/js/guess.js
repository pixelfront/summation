// Guess the writer. The quote is shown alone. The writer, source and credit are added to the page only after an answer.
// The bundled quote file still contains the answers; this does not hide them from someone reading the files.
window.GUESS=(()=>{
const $=s=>document.querySelector(s),RM=matchMedia('(prefers-reduced-motion: reduce)'),BEST='qc-guess-best';
let pool=null,round=null,session=0,locked=false;
const fold=s=>String(s||'').toLowerCase();
function best(){try{return Math.max(0,parseInt(localStorage.getItem(BEST)||'0',10)||0)}catch(_){return 0}}
function saveBest(){try{if(session>best())localStorage.setItem(BEST,String(session))}catch(_){}}
async function load(){if(pool)return pool;const d=await (await fetch('data/packs.json')).json();pool=[];
 for(const a of d.authors)for(const item of (d.pools[a.id]||[])){let q=String(item.q||'').replace(/\s+/g,' ').trim();
  if(a.sh)q=q.replace(new RegExp('\\s*\\('+a.sh.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\)\\s*$','i'),'').trim();
  const low=fold(q);if(!q||fold(a.who)&&low.includes(fold(a.who))||a.sh&&low.includes(fold(a.sh)))continue;
  pool.push({id:a.id,who:a.who,sh:a.sh,q,src:item.src||''})}
 return pool}
function pick(){const authors=[];for(const p of pool)if(!authors.some(a=>a.id===p.id))authors.push({id:p.id,who:p.who});
 const item=pool[Math.floor(Math.random()*pool.length)];
 const others=authors.filter(a=>a.id!==item.id&&fold(a.who)!==fold(item.who));
 for(let i=others.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[others[i],others[j]]=[others[j],others[i]]}
 const names=[item.who,others[0].who,others[1].who];
 for(let i=names.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[names[i],names[j]]=[names[j],names[i]]}
 return {quote:item.q,names,answer:names.indexOf(item.who),who:item.who,src:item.src}}
function scoreLine(){const el=$('#gzScore');if(el)el.textContent=`This sitting: ${session}. Best on this phone: ${Math.max(session,best())}.`}
function show(){if(!round)return;const q=$('#gzQuote'),box=$('#gzChoices'),res=$('#gzResult');
 q.textContent=round.quote;q.setAttribute('aria-label','Quote');
 box.innerHTML='';box.classList.toggle('gz-live',!RM.matches);res.hidden=true;res.textContent='';
 round.names.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.className='gz-choice';b.textContent=name;
  b.addEventListener('click',()=>answer(i));box.appendChild(b)});
 scoreLine();locked=false}
function answer(i){if(locked||!round)return;locked=true;const ok=i===round.answer;if(ok){session++;saveBest()}
 const box=$('#gzChoices');box.classList.remove('gz-live');[...box.children].forEach((b,k)=>{b.disabled=true;b.classList.add('done');
  if(k===round.answer)b.classList.add('right');else if(k===i)b.classList.add('wrong')});
 const res=$('#gzResult');res.hidden=false;
 res.textContent=ok?`Yes. ${round.who}. ${round.src}`:`No. The writer is ${round.who}. ${round.src}`;
 scoreLine();const live=$('#live');if(live)live.textContent=res.textContent}
async function open(){await load();if(pool.length<3)return;round=pick();show();const live=$('#live');if(live)live.textContent='Guess the writer. Three names. No timer.'}
$('#gzNext')&&$('#gzNext').addEventListener('click',()=>{if(pool){round=pick();show()}});
return {open,get session(){return session},load,pick}})();
