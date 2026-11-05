// 4A: read aloud. On-device speech only (speechSynthesis with a voice marked localService); starts only on tap.
// Reads the quote, then "-- Author". Stops when the card turns (flip / face change), is burned, the view closes or another card loads.
window.SPEAK=(()=>{const ok='speechSynthesis' in window&&typeof SpeechSynthesisUtterance==='function';let on=false,btn=null,cur=null;
const $=s=>document.querySelector(s),live=()=>$('#live');
function voice(){const vs=ok?speechSynthesis.getVoices():[];const loc=vs.filter(v=>v.localService);
 const lang=(navigator.language||'en').slice(0,2);return loc.find(v=>v.default&&v.lang.startsWith(lang))||loc.find(v=>v.lang.startsWith(lang))||loc.find(v=>v.lang.startsWith('en'))||loc[0]||null}
function upd(){if(!btn)return;btn.setAttribute('aria-pressed',String(on));btn.setAttribute('aria-label',on?'Stop reading aloud':'Read the quote aloud');btn.querySelector('.sp-t').textContent=on?'Stop':'Read'}
function stop(why){if(!ok)return;const was=on||speechSynthesis.speaking||speechSynthesis.pending;on=false;cur=null;if(was){speechSynthesis.cancel();if(why&&live())live().textContent='Reading stopped.'}upd()}
function speak(d){if(!ok||!d)return false;stop();const v=voice();
 if(!v){if(live())live().textContent='No on-device voice on this phone, so read aloud is off.';return false}
 const u=new SpeechSynthesisUtterance(`${d.q} \u2014 ${d.who}`);try{u.voice=v;u.lang=v.lang}catch(_){u.lang=v.lang}u.rate=.96;cur=u;
 u.onend=u.onerror=()=>{if(cur===u){on=false;cur=null;upd()}};on=true;upd();speechSynthesis.speak(u);return true}
function bind(b,getData){btn=b;if(!ok){b.disabled=true;b.title='Read aloud is not available in this browser';b.querySelector('.sp-t').textContent='Read';return}
 b.addEventListener('click',()=>{if(on)stop(true);else speak(getData())});upd();
 if(speechSynthesis.getVoices().length===0&&'onvoiceschanged' in speechSynthesis)speechSynthesis.onvoiceschanged=()=>{}}
addEventListener('pagehide',()=>stop());document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
return{ok,speak,stop,bind,get on(){return on}}})();
