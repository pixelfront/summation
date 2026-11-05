// Settings sheet (header SET): 9A theme, 11B music, 6A holo tilt. Everything is saved on this device only.
window.SETTINGS=(()=>{const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const btn=$('#setBtn'),sheet=$('#setView'),live=$('#live'),LABEL={dark:'Dark',light:'Light',voxel:'Voxel',blueprint:'Blueprint'};
function theme(t,announce){if(!THEMES.includes(t))t='dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('qc-theme',t)}catch(_){}
 const m=$('meta[name=theme-color]');if(m)m.content={dark:'#000000',light:'#f4f4ef',voxel:'#000000',blueprint:'#0b2545'}[t];
 $$('#themeBar [data-theme]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.theme===t)));if(announce)live.textContent=`Theme: ${LABEL[t]}.`}
function open(v){sheet.hidden=!v;btn.setAttribute('aria-expanded',String(v));if(v){window.scrollTo(0,0);setTimeout(()=>{const c=$('#themeBar [aria-checked=true]');c&&c.focus({preventScroll:true})},30)}else btn.focus({preventScroll:true})}
btn.addEventListener('click',()=>open(sheet.hidden));$('#setClose').addEventListener('click',()=>open(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)open(false)});
$$('#themeBar [data-theme]').forEach(b=>b.addEventListener('click',()=>theme(b.dataset.theme,true)));
theme(document.documentElement.dataset.theme);
MUSIC.bind($('#musicBtn'));
// the SND mute covers the music too
const sm=SFX.setMuted.bind(SFX);SFX.setMuted=v=>{sm(v);if(v)MUSIC.stop()};
return{theme,open}})();
