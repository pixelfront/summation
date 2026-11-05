// M4 STORE: IndexedDB persistence for made + received cards, their photos, and burn tombstones.
// The API and the shape returned by get() ({burned,received,made}) are the same as the M2/M3 in-memory STORE,
// so box.js and creator.js are unchanged. Reads are synchronous from an in-memory mirror; every change is written
// through to IndexedDB in one queued transaction. STORE.ready resolves once the saved state has been loaded.
//
// DB "quote-deck-v2", version 1:
//   cards       keyPath id   {id, kind:'made'|'received', seq, ...card fields}; a data: photo is moved out to `photos`
//                            and the card keeps photo:'idb' (restored to a data: URL on load, so export stays untainted)
//   photos      keyPath id   {id, blob}  (Blob of the card's own photo; only for photos that travelled in, not bundled ones)
//   tombstones  keyPath id   {id}        (nothing else: no name, quote, photo or time)
// M5: every stored card goes through clean(): an allowlist of card fields; photo must be a data:image/ URL or a
// bundled 'a:<id>' portrait, anything else is dropped. receive() refuses an id that has a tombstone or is already held.
// Burn deletes the card and photo records in the same transaction that writes the tombstone.
// If IndexedDB is unavailable (file://, some private modes) the STORE runs in memory and STORE.persistent is false.
const BASE_DECK=SAMPLE_DECK; // creator.js name for the built-in cards
const STORE=(()=>{
 const DB='quote-deck-v2',VER=1,SAMPLE_IDS=new Set(SAMPLE_DECK.map(d=>d.id));
 let s={burned:[],received:[],made:[]},seq=0,db=null,q=Promise.resolve();const seqOf=new Map();
 const copy=()=>({burned:s.burned.slice(),received:s.received.slice(),made:s.made.slice()});
 const req=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
 const done=t=>new Promise((ok,no)=>{t.oncomplete=()=>ok();t.onerror=t.onabort=()=>no(t.error||new Error('tx aborted'))});
 function open(){return new Promise((ok,no)=>{if(!('indexedDB' in window))return no(new Error('no indexedDB'));
  let r;try{r=indexedDB.open(DB,VER)}catch(e){return no(e)}
  r.onupgradeneeded=()=>{const d=r.result;for(const n of['cards','photos','tombstones'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:'id'})};
  r.onsuccess=()=>{const d=r.result;d.onversionchange=()=>d.close();ok(d)};r.onerror=()=>no(r.error);r.onblocked=()=>no(new Error('blocked'))})}
 function dataToBlob(u){const m=/^data:([^;,]*)(;base64)?,(.*)$/s.exec(u);if(!m)return null;const raw=m[2]?atob(m[3]):decodeURIComponent(m[3]);
  const a=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return new Blob([a],{type:m[1]||'image/jpeg'})}
 const blobToData=b=>new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=()=>no(f.error);f.readAsDataURL(b)});
 // queue one write transaction; failures are logged, the in-memory state stays authoritative for this session
 function tx(fn){if(!db)return q;q=q.then(()=>{const t=db.transaction(['cards','photos','tombstones'],'readwrite');fn(t);return done(t)}).catch(e=>console.warn('STORE write failed',e));return q}
 const FIELDS=['id','no','who','sh','q','src','notes','holo','trot','author','pc','photo','recv','rar','pk'];
 function okPhoto(p){return typeof p==='string'&&(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p)||/^a:[a-z0-9_-]{1,60}$/i.test(p))}
 function clean(c){const o={};for(const k of FIELDS)if(c[k]!=null)o[k]=c[k];if(o.photo&&!okPhoto(o.photo)){o.photo='';o.pc=''}return o}
 function putCard(t,c,kind){c=clean(c);if(!seqOf.has(c.id))seqOf.set(c.id,++seq);const rec=Object.assign({},c,{kind,seq:seqOf.get(c.id)});
  if(typeof rec.photo==='string'&&rec.photo.startsWith('data:')){const b=dataToBlob(rec.photo);if(b){t.objectStore('photos').put({id:c.id,blob:b});rec.photo='idb'}}
  else t.objectStore('photos').delete(c.id);
  t.objectStore('cards').put(rec)}
 function wipe(t,id){seqOf.delete(id);t.objectStore('cards').delete(id);t.objectStore('photos').delete(id)}
 async function load(){db=await open();const t=db.transaction(['cards','photos','tombstones'],'readonly');
  const [cards,photos,tombs]=await Promise.all(['cards','photos','tombstones'].map(n=>req(t.objectStore(n).getAll())));
  const ph=Object.fromEntries(await Promise.all(photos.map(async p=>[p.id,await blobToData(p.blob)])));
  const burned=tombs.map(x=>x.id),dead=new Set(burned);
  cards.sort((a,b)=>a.seq-b.seq);seq=cards.reduce((m,c)=>Math.max(m,c.seq||0),0);
  const out={made:[],received:[]},stale=[];
  for(const r of cards){if(dead.has(r.id)){stale.push(r.id);continue}const c=Object.assign({},r);seqOf.set(c.id,c.seq);delete c.kind;delete c.seq;
   if(c.photo==='idb')c.photo=ph[c.id]||'';Object.assign(c,clean(c));for(const k of Object.keys(c))if(!FIELDS.includes(k))delete c[k];(r.kind==='received'?out.received:out.made).push(c)}
  // keep anything made before the DB finished opening
  for(const c of s.made)if(!out.made.some(x=>x.id===c.id))out.made.push(c);
  s={burned:[...new Set(burned.concat(s.burned))],received:out.received,made:out.made};
  if(stale.length)tx(t=>stale.forEach(id=>wipe(t,id))); // a card record next to its tombstone should not exist; clean up
  return copy()}
 const api={persistent:false,
  get:copy,
  // set(v): replace the state; the write-through diffs it against the last state
  set(v){const prev=s;s={burned:(v.burned||[]).slice(),received:(v.received||[]).slice(),made:(v.made||[]).slice()};
   tx(t=>{const keep=new Set();
    for(const c of s.made){keep.add(c.id);if(!prev.made.includes(c))putCard(t,c,'made')}
    for(const c of s.received){keep.add(c.id);if(!prev.received.includes(c))putCard(t,c,'received')}
    for(const c of prev.made.concat(prev.received))if(!keep.has(c.id))wipe(t,c.id);
    const tb=t.objectStore('tombstones'),nb=new Set(s.burned);for(const id of s.burned)if(!prev.burned.includes(id))tb.put({id});
    for(const id of prev.burned)if(!nb.has(id))tb.delete(id)})},
  // burn(id): drop the card (made or received) and its photo; leave only {id} as a tombstone
  burn(id){if(!s.burned.includes(id))s.burned.push(id);s.made=s.made.filter(c=>c.id!==id);s.received=s.received.filter(c=>c.id!==id);
   tx(t=>{wipe(t,id);t.objectStore('tombstones').put({id})})},
  // canReceive(id): 'ok' | 'burned' (tombstone: this card already left this phone; never take it back) | 'held'
  canReceive(id){return s.burned.includes(id)?'burned':(s.made.some(x=>x.id===id)||s.received.some(x=>x.id===id)||SAMPLE_IDS.has(id)||id==='c06')?'held':'ok'},
  // receive(c): stores a received card. Refuses burned or held ids (returns the reason); tombstones are never cleared.
  receive(c){const why=api.canReceive(c.id);if(why!=='ok')return why;c=Object.assign(clean(c),{recv:1});s.received.push(c);tx(t=>putCard(t,c,'received'));return 'ok'},
  // update(c): re-save a made/received card after an edit (e.g. holo toggle)
  update(c){const kind=s.made.includes(c)?'made':s.received.includes(c)?'received':'';if(kind)tx(t=>putCard(t,c,kind))},
  // reset(): "Restore deck" brings back burned SAMPLE cards only. Made and received cards stay; tombstones of
  // made/received cards stay too (their payload is gone, and a sent card must not come back).
  reset(){const back=s.burned.filter(id=>SAMPLE_IDS.has(id));s.burned=s.burned.filter(id=>!SAMPLE_IDS.has(id));
   tx(t=>back.forEach(id=>t.objectStore('tombstones').delete(id)))},
  sampleBurned(){return s.burned.some(id=>SAMPLE_IDS.has(id))},
  flush(){return q.then(()=>{})},
  // wipeAll(): clear every store (not wired to UI; for tests / a future "erase all" setting)
  wipeAll(){s={burned:[],received:[],made:[]};return tx(t=>['cards','photos','tombstones'].forEach(n=>t.objectStore(n).clear()))}};
 api.ready=load().then(st=>{api.persistent=true;return st}).catch(e=>{console.warn('IndexedDB unavailable, cards stay in memory this session:',e&&e.message);db=null;return copy()});
 return api})();
function currentDeck(){const s=STORE.get();return BASE_DECK.concat(s.made,s.received).filter(d=>!s.burned.includes(d.id))}
