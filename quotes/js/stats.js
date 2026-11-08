// Local counts only. Nothing is sent anywhere. Lifetime numbers start at 0 the first time this file runs on a phone.
// Older cards already in the box are not copied into those numbers.
window.STATS=(()=>{
const KEY='qc-stats',$=s=>document.querySelector(s);
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function blank(){return {since:today(),made:0,handed:0,exported:0,received:0,burned:0,packs:0,seen:{made:[],handed:[],received:[],burned:[],packs:[]}}}
function load(){try{const o=JSON.parse(localStorage.getItem(KEY)||'');if(o&&o.since&&o.seen&&o.seen.made)return o}catch(_){}
 const o=blank();try{localStorage.setItem(KEY,JSON.stringify(o))}catch(_){}return o}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(_){}}
let st=load();
function once(bucket,id){id=String(id||'');if(!id)return false;if(st.seen[bucket].indexOf(id)>=0)return false;st.seen[bucket].push(id);return true}
function bump(field,bucket,id){if(!once(bucket,id))return false;st[field]++;save();render();return true}
function render(){const el=$('#statBox');if(!el)return;const box=window.STORE?STORE.get():{made:[],received:[]};
 el.innerHTML=`<p><b>Since ${st.since}</b>. These counts started at zero. Cards already in the box were not added to them.</p>
<ul>
<li><b>Made ${st.made}</b>. A card saved from New card, or a card saved from a pack you made out of a PDF.</li>
<li><b>Handed over ${st.handed}</b>. The other phone's accept code matched the offer. Showing the offer QR is not counted, and this is not labeled a confirmed trade beyond that match.</li>
<li><b>Exported or shared ${st.exported}</b>. A download, or a share the phone accepted, of a PNG, GIF, or animated PNG. Not a trade.</li>
<li><b>Received ${st.received}</b>. A QR import this phone kept. Once per card. A refused import is not counted.</li>
<li><b>Burned ${st.burned}</b>. A burn that this phone confirmed.</li>
<li><b>Packs opened ${st.packs}</b>. A pack that finished opening.</li>
</ul>
<p>In your box now: ${box.made.length} saved cards and ${box.received.length} received cards. That is what is on this phone at the moment, not a lifetime total.</p>`;}
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('#expDl');if(t){st.exported++;save();render()}});
const api={
 made:id=>bump('made','made',id),
 handed:id=>bump('handed','handed',id),
 exported(){st.exported++;save();render()},
 received:id=>bump('received','received',id),
 burned:id=>bump('burned','burned',id),
 pack:id=>bump('packs','packs',id),
 render,
 reset(){const seen=st.seen;st=blank();st.seen=seen;save();render()},
 get(){return JSON.parse(JSON.stringify(st))}
};
document.addEventListener('DOMContentLoaded',render);if(document.readyState!=='loading')render();
const reset=$('#statReset');if(reset)reset.addEventListener('click',()=>{api.reset();const live=$('#live');if(live)live.textContent='Counts reset to zero. Cards in the box were kept.'});
return api})();
