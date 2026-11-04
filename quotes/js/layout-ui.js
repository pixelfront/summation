// Layouts milestone UI: box skin picker, layout switcher, full-screen overlay (in-app, not the Fullscreen API: iPhone).
// Persisted on this device only: localStorage 'qc-skin' and 'qc-layout' (same spirit as 'qc-mute'). URL ?skin= / ?layout= / ?fs=1 for shots.
window.SKINUI=(()=>{const KEY='qc-skin',P=new URLSearchParams(location.search),$=s=>document.querySelector(s);
let skin=P.get('skin');if(!SKINS[skin]){try{skin=localStorage.getItem(KEY)}catch(_){skin=null}}if(!SKINS[skin])skin='terminal';
function set(k,persist,announce){if(!SKINS[k])k='terminal';skin=k;const sc=$('#scene');
 sc.classList.remove('sk-terminal','sk-crate','sk-cassette');sc.classList.add('sk-'+k);document.body.dataset.skin=k;
 $('#worldBack').innerHTML=SKINS[k].back;$('#worldFront').innerHTML=SKINS[k].front;
 document.querySelectorAll('#skinbar [data-skin]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.skin===k)));
 if(persist!==false){try{localStorage.setItem(KEY,k)}catch(_){}}
 if(window.BOX&&BOX.rebuild)BOX.rebuild();const cr=$('#crumb');if(cr&&!$('#boxView').hidden)cr.textContent='CARD BOX \u00b7 '+SKINS[k].crumb;
 if(announce)$('#live').textContent=`Box style: ${SKINS[k].label}.`}
set(skin,false);
return{set,get skin(){return skin},crumb(){return SKINS[skin].crumb}}})();
window.LAYOUTUI=(()=>{const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],P=new URLSearchParams(location.search);
const body=document.body,scene=$('#scene'),wrap=$('#cards'),fs=$('#fs'),stage=$('#fsStage'),live=$('#live');let ret=null;
function title(){$('#fsTitle').innerHTML=`<b>\u25A0</b> ${LAYOUTS.name.toUpperCase()} \u00b7 ${String(BOX.deck.length).padStart(2,'0')} \u00b7 ESC TO EXIT`}
function set(name,announce){const prev=LAYOUTS.name;name=LAYOUTS.set(name,!!announce);body.dataset.layout=name;
 $$('[data-layout][role=radio]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.layout===name)));void wrap.offsetHeight;
 if(name==='pickup'&&prev!=='pickup'&&announce)BOX.scatter();else BOX.layout({dur:announce?.5:0});title();
 if(announce)live.textContent=`Layout: ${name}.`}
function enterFS(){if(LAYOUTS.fs)return;ret=document.activeElement;LAYOUTS.fs=true;fs.hidden=false;body.classList.add('fs-on');stage.appendChild(wrap);
 if(BOX.sel>=0)BOX.select(-1);title();BOX.layout({dur:0});live.textContent='Full screen. Press Escape or the X to exit.';$('#fsClose').focus({preventScroll:true})}
function exitFS(quiet){if(!LAYOUTS.fs)return;LAYOUTS.fs=false;fs.hidden=true;body.classList.remove('fs-on');scene.insertBefore(wrap,scene.querySelector('.l-front'));BOX.layout({dur:0});
 if(!quiet){live.textContent='Left full screen.';const r=ret&&ret.isConnected&&ret.offsetParent?ret:$('#fsOpen');r.focus({preventScroll:true})}}
$('#fsOpen').addEventListener('click',enterFS);$('#fsClose').addEventListener('click',()=>exitFS());
document.addEventListener('keydown',e=>{if(!LAYOUTS.fs)return;
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();exitFS();return}
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){if(e.target.closest&&e.target.closest('.laybar'))return;e.preventDefault();$(e.key==='ArrowLeft'?'#prev':'#next').click();return}
 if(e.key==='Tab'){const f=$$('#fs button').filter(b=>b.offsetParent&&b.tabIndex>=0&&b.getAttribute('aria-hidden')!=='true');if(!f.length)return;const a=f[0],z=f[f.length-1];
  if(!fs.contains(document.activeElement)){e.preventDefault();a.focus();return}
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}},true);
// mini switcher inside full screen (icons only, labelled)
const foot=$('#fsFoot');$$('#laybar button').forEach(b=>{const c=b.cloneNode(true);c.setAttribute('aria-label',b.textContent.trim()+' layout');foot.appendChild(c)});
$$('[data-layout][role=radio]').forEach(b=>b.addEventListener('click',()=>set(b.dataset.layout,true)));
$$('[role=radiogroup]').forEach(g=>g.addEventListener('keydown',e=>{if(!/Arrow(Left|Right)/.test(e.key))return;const bs=[...g.querySelectorAll('button')],k=bs.indexOf(document.activeElement);if(k<0)return;
 e.preventDefault();e.stopPropagation();const n=bs[(k+(e.key==='ArrowRight'?1:-1)+bs.length)%bs.length];n.focus();n.click()}));
$$('#skinbar [data-skin]').forEach(b=>b.addEventListener('click',()=>SKINUI.set(b.dataset.skin,true,true)));
addEventListener('resize',()=>BOX.layout({dur:0}));
body.dataset.layout=LAYOUTS.name;$$('[data-layout][role=radio]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.layout===LAYOUTS.name)));
if(P.get('fs'))STORE.ready.then(()=>setTimeout(enterFS,60));
return{set,enterFS,exitFS}})();
