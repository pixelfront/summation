// Per-author photo pools for packs. Files are bundled; this script never fetches a third-party host.
// The service worker runtime-caches each JPEG the first time a card shows it, so a photo you have
// already opened still works offline, and the first install does not download the whole pool.
window.POOL=(()=>{
const KEY='qc-photo-pool';let MAN=null,byId={};
function state(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return{}}}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch(_){return false}}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;const t=a[i];a[i]=a[j];a[j]=t}return a}
async function load(){if(MAN)return MAN;const r=await fetch('photos/manifest.json',{cache:'no-cache',credentials:'same-origin'});
 if(!r.ok)throw new Error('photo manifest '+r.status);MAN=await r.json();byId={};
 (MAN.images||[]).forEach(p=>{byId[p.id]=p});return MAN}
function idsFor(author){return (MAN&&MAN.images||[]).filter(p=>p.author===author).map(p=>p.id)}
// n photos, shuffled without replacement. When the pool is empty, continue from the least-recently dealt.
function take(author,n){if(!MAN)return[];const ids=idsFor(author);if(!ids.length||n<=0)return[];
 const known=new Set(ids),st=state(),b=st[author]||{rest:[],used:[]};
 b.rest=(b.rest||[]).filter(id=>known.has(id));b.used=(b.used||[]).filter(id=>known.has(id));
 if(!b.rest.length&&!b.used.length)b.rest=shuffle(ids.slice());
 const out=[];for(let k=0;k<n;k++){if(!b.rest.length){b.rest=b.used.slice();b.used=[]}
  if(!b.rest.length)break;const id=b.rest.shift();b.used.push(id);if(byId[id])out.push(byId[id])}
 st[author]={rest:b.rest,used:b.used};save(st);return out}
function reset(author){const st=state();if(author)delete st[author];else for(const k of Object.keys(st))delete st[k];save(author?st:{});}
return{load,take,reset,get manifest(){return MAN},byId:id=>byId[id]||null}})();
