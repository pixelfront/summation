// Writer catalog loader. Reads the bundled data/authors.json (the full MIA writers index, 539 writers) and
// data/label-overrides.json (hand decisions on the "(Trotskyite)" label, which always win) from this site only.
// Nothing is fetched from marxists.org or Commons at runtime; portraits are local files in assets/authors/<id>.jpg.
// Compact shape: id, n name, d display name, s section, t trotskyite 0/1, p has photo 0/1, u archive url,
// pc photo credit (Commons only), pl Commons file page. Years are lb/ld only when data/life-dates.json has a
// Wikipedia opening for that person. The catalogue dates field is not copied onto the record.
window.AUTHORS=[];
window.AUTHORS_READY=(async()=>{
 if(location.protocol==='file:')throw new Error('catalog needs http (file:// cannot fetch)');
 const get=async u=>{const r=await fetch(u,{cache:'no-cache',credentials:'same-origin'});if(!r.ok)throw new Error(u+' '+r.status);return r.json()};
 const [AJ,OV,LIFE]=await Promise.all([get('data/authors.json'),get('data/label-overrides.json').catch(()=>({overrides:{}})),get('data/life-dates.json').catch(()=>({dates:[]}))]);
 const ov=OV.overrides||{},TAG=' (Trotskyite)',lifeBy=Object.fromEntries((LIFE.dates||[]).map(x=>[x.id,x]));
 window.AUTHORS=AJ.authors.map(a=>{let t=!!a.trotskyite,d=a.displayName||a.name;
  if(ov[a.id]&&typeof ov[a.id].trotskyite==='boolean')t=ov[a.id].trotskyite;
  d=d.replace(/\s*\(Trotskyite\)$/,'')+(t?TAG:'');
  const o={id:a.id,n:a.name,d,s:a.section||'',t:t?1:0,p:a.photo?1:0,u:a.archiveUrl||''};
  const life=lifeBy[a.id];if(life&&life.birth){o.lb=life.birth;o.ld=life.death||0;o.ls=life.source||'';o.lp=life.page||''}
  if(a.photo&&a.photoVia==='wikimedia-commons'){o.pc=`Photo: ${String(a.photoArtist||'Unknown').replace(/\s+/g,' ').trim().slice(0,90)}, ${a.photoLicense||'free licence'}, via Wikimedia Commons`;o.pl=a.photoFilePage||''}
  return o});
 return window.AUTHORS})();
window.AUTHORS_READY.catch(()=>{}); // creator.js reports the failure; this only stops an 'unhandled rejection' before it attaches
