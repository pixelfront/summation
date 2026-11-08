// Local chiptune keyboard. One octave of labelled keys, one track, saved on this phone.
// Oscillators only. No samples, no MIDI port, no external device. Sound stays off until a tap, and SND mute wins.
window.KEYS=(()=>{
const KEY='qc-keys',$=s=>document.querySelector(s);
const WHITE=[{m:60,name:'C4',k:'a'},{m:62,name:'D4',k:'s'},{m:64,name:'E4',k:'d'},{m:65,name:'F4',k:'f'},{m:67,name:'G4',k:'g'},{m:69,name:'A4',k:'h'},{m:71,name:'B4',k:'j'},{m:72,name:'C5',k:'k'}];
const BLACK=[{m:61,name:'C♯4',k:'w'},{m:63,name:'D♯4',k:'e'},{m:66,name:'F♯4',k:'t'},{m:68,name:'G♯4',k:'y'},{m:70,name:'A♯4',k:'u'}];
const NOTES=WHITE.concat(BLACK);
const byKey=Object.fromEntries(NOTES.map(n=>[n.k,n]));
let clock=()=>performance.now();
let state={bpm:100,beats:8,notes:[],loop:false};
let rec=false,recT=0,held=new Map(),undoStack=[];
function load(){try{const o=JSON.parse(localStorage.getItem(KEY)||'');if(o&&Array.isArray(o.notes)){state.bpm=clamp(+o.bpm||100,40,240);state.beats=[4,8,16].includes(+o.beats)?+o.beats:8;state.notes=o.notes.filter(n=>n&&n.m).map(n=>({m:+n.m,t:+n.t||0,d:Math.max(.5,+n.d||1)}));state.loop=!!o.loop}}catch(_){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({bpm:state.bpm,beats:state.beats,loop:state.loop,notes:state.notes}))}catch(_){}}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function say(t){const live=$('#live');if(live)live.textContent=t;const s=$('#keyStat');if(s)s.textContent=t}
function qBeat(ms){const beatMs=60000/state.bpm;let b=(ms-recT)/beatMs;if(b<0)b=0;let q=Math.round(b*2)/2;if(q>state.beats-.5)q=state.beats-.5;if(q<0)q=0;return q}
function qDur(ms){const beatMs=60000/state.bpm;let q=Math.round((ms/beatMs)*2)/2;if(q<.5)q=.5;return q}
function down(m){if(window.MUSIC)MUSIC.blip(m);if(!rec||held.has(m))return false;held.set(m,{t:qBeat(clock()),at:clock()});return true}
function up(m){if(!rec)return false;const o=held.get(m);if(!o)return false;held.delete(m);let d=qDur(clock()-o.at);if(o.t+d>state.beats)d=Math.max(.5,state.beats-o.t);undoStack.push(state.notes.slice());state.notes.push({m,t:o.t,d});save();paint();return true}
function paint(){const s=$('#keyStat');if(s&&!rec)s.textContent=`${state.notes.length} notes, ${state.beats} beats at ${state.bpm}. ${state.loop?'Loop is on.':'Loop is off.'}`}
function arm(){rec=true;recT=clock();held.clear();undoStack.push(state.notes.slice());say('Recording. Keys snap to the beat.')}
function stopRec(){rec=false;held.clear();save();paint()}
function play(loop){if(!state.notes.length){say('Nothing recorded yet.');return false}
 if(typeof SFX!=='undefined'&&SFX.muted){say('Sound is off (SND). Turn sound on to hear the keys.');return false}
 const ok=window.MUSIC&&MUSIC.preview(state.notes,state.bpm,state.beats,!!loop);
 if(!ok){say('Sound is off (SND). Turn sound on to hear the keys.');return false}
 say(loop?'Playing the loop.':'Playing once.');return true}
function useMusic(){if(!state.notes.length){say('Record a loop before using it as the music.');return false}
 const ok=window.MUSIC&&MUSIC.setLoop({notes:state.notes,bpm:state.bpm,beats:state.beats});
 if(!ok){say('Record a loop before using it as the music.');return false}
 say('This loop is the music now. It stays silent until you turn music on.');
 if(window.MUSIC.on){MUSIC.stop();MUSIC.start()}
 return true}
function buildSongs(){const box=$('#songList'),rights=$('#songRights');if(!box||!window.MUSIC)return;
 box.innerHTML='';
 Object.entries(MUSIC.songs).forEach(([id,s])=>{const b=document.createElement('button');b.type='button';b.dataset.song=id;b.textContent=s.name;b.setAttribute('aria-pressed','false');
  b.addEventListener('click',()=>{MUSIC.setTrack(id);if(rights)rights.textContent=s.rights});box.appendChild(b)});
 const loop=document.createElement('button');loop.type='button';loop.dataset.song='loop';loop.textContent='Your loop';loop.setAttribute('aria-pressed','false');
 loop.addEventListener('click',useMusic);box.appendChild(loop);
 if(rights)rights.textContent=(MUSIC.songs[MUSIC.song]&&MUSIC.songs[MUSIC.song].rights)||'';
 MUSIC.refresh()}
function buildKeys(){const root=$('#keyDeck');if(!root)return;
 root.innerHTML=`<h2>KEYBOARD</h2>
 <p class="note">One octave on this phone. Keys are labelled. The letter on a key is the desktop shortcut while Settings is open. Nothing is sent out, and there is no MIDI device.</p>
 <div class="keyrow" role="group" aria-label="Note keys"></div>
 <div class="keyctl">
  <label>Tempo <input id="keyTempo" type="number" min="40" max="240" step="1" value="${state.bpm}" inputmode="numeric"></label>
  <fieldset><legend>Length</legend>
   <label><input type="radio" name="keyLen" value="4"> 4 beats</label>
   <label><input type="radio" name="keyLen" value="8"> 8 beats</label>
   <label><input type="radio" name="keyLen" value="16"> 16 beats</label>
  </fieldset>
  <button type="button" id="keyRec" aria-pressed="false">Record</button>
  <button type="button" id="keyPlay">Play</button>
  <button type="button" id="keyLoop" aria-pressed="false">Loop</button>
  <button type="button" id="keyUndo">Undo</button>
  <button type="button" id="keyClear">Clear</button>
  <button type="button" id="keyUse">Use as music</button>
 </div>
 <p class="note" id="keyStat" aria-live="polite"></p>`;
 const row=root.querySelector('.keyrow');
 NOTES.slice().sort((a,b)=>a.m-b.m).forEach(n=>{const b=document.createElement('button');b.type='button';b.dataset.midi=String(n.m);b.innerHTML=`${n.name}<small>${n.k}</small>`;b.setAttribute('aria-label',`${n.name}, key ${n.k}`);
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.focus();down(n.m)});
  const end=()=>up(n.m);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);row.appendChild(b)});
 root.querySelectorAll('input[name=keyLen]').forEach(r=>{r.checked=+r.value===state.beats;r.addEventListener('change',()=>{if(r.checked){state.beats=+r.value;save();paint()}})});
 const tempo=$('#keyTempo');tempo.addEventListener('change',()=>{state.bpm=clamp(+tempo.value||100,40,240);tempo.value=state.bpm;save();paint()});
 $('#keyRec').addEventListener('click',()=>{rec?stopRec():arm();$('#keyRec').setAttribute('aria-pressed',String(rec))});
 $('#keyPlay').addEventListener('click',()=>play(false));
 $('#keyLoop').addEventListener('click',()=>{state.loop=!state.loop;$('#keyLoop').setAttribute('aria-pressed',String(state.loop));save();if(state.loop)play(true);else if(window.MUSIC)MUSIC.endPreview()});
 $('#keyUndo').addEventListener('click',()=>{const prev=undoStack.pop();if(!prev){say('Nothing to undo.');return}state.notes=prev;held.clear();save();paint()});
 $('#keyClear').addEventListener('click',()=>{undoStack.push(state.notes.slice());state.notes=[];held.clear();save();paint();say('Cleared.')});
 $('#keyUse').addEventListener('click',useMusic);
 paint()}
function onKey(e){const sheet=$('#setView');if(!sheet||sheet.hidden)return;const tag=(e.target&&e.target.tagName)||'';if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
 const n=byKey[String(e.key||'').toLowerCase()];if(!n)return;e.preventDefault();if(e.type==='keydown'){if(e.repeat)return;down(n.m)}else up(n.m)}
load();buildSongs();buildKeys();
document.addEventListener('keydown',onKey);document.addEventListener('keyup',onKey);
try{if(localStorage.getItem('qc-track')==='loop'&&state.notes.length&&window.MUSIC)MUSIC.setLoop({notes:state.notes,bpm:state.bpm,beats:state.beats})}catch(_){}
return {notes(){return state.notes.map(n=>({...n}))},get bpm(){return state.bpm},get beats(){return state.beats},
 clock(fn){clock=fn||(()=>performance.now())},
 begin(at){rec=true;recT=at==null?clock():at;held.clear()},
 down,up,play,useMusic,
 clear(){state.notes=[];held.clear();undoStack=[];save()},
 reload(){load()}}})();
