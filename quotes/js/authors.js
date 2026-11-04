// Writer catalog loader. Reads the bundled data/authors.json (the full MIA writers index, 539 writers) and
// data/label-overrides.json (hand decisions on the "(Trotskyite)" label, which always win) from this site only.
// Nothing is fetched from marxists.org or Commons at runtime; portraits are local files in assets/authors/<id>.jpg.
// Compact shape (same as the prototype's window.AUTHORS): id, n name, d display name, s section, dt dates,
// t trotskyite 0/1, p has photo 0/1, u archive url, pc photo credit (Commons only), pl Commons file page.
window.AUTHORS=[];
window.AUTHORS_READY=(async()=>{
 if(location.protocol==='file:')throw new Error('catalog needs http (file:// cannot fetch)');
 const get=async u=>{const r=await fetch(u,{cache:'no-cache',credentials:'same-origin'});if(!r.ok)throw new Error(u+' '+r.status);return r.json()};
 const [AJ,OV]=await Promise.all([get('data/authors.json'),get('data/label-overrides.json').catch(()=>({overrides:{}}))]);
 const ov=OV.overrides||{},TAG=' (Trotskyite)';
 window.AUTHORS=AJ.authors.map(a=>{let t=!!a.trotskyite,d=a.displayName||a.name;
  if(ov[a.id]&&typeof ov[a.id].trotskyite==='boolean')t=ov[a.id].trotskyite;
  d=d.replace(/\s*\(Trotskyite\)$/,'')+(t?TAG:'');
  const o={id:a.id,n:a.name,d,s:a.section||'',dt:a.dates||'',t:t?1:0,p:a.photo?1:0,u:a.archiveUrl||''};
  if(a.photo&&a.photoVia==='wikimedia-commons'){o.pc=`Photo: ${String(a.photoArtist||'Unknown').replace(/\s+/g,' ').trim().slice(0,90)}, ${a.photoLicense||'free licence'}, via Wikimedia Commons`;o.pl=a.photoFilePage||''}
  return o});
 return window.AUTHORS})();
window.AUTHORS_READY.catch(()=>{}); // creator.js reports the failure; this only stops an 'unhandled rejection' before it attaches
