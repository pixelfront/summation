// Tiny WebAudio blips: oscillators only, no samples. Mute is remembered on this device.
const SFX=(()=>{let ctx=null,muted=localStorage.getItem('qc-mute')==='1';
 function ac(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;try{ctx=new A()}catch(_){return null}}
  if(ctx.state==='suspended')ctx.resume();return ctx}
 function blip(f,d,type,g,t0,slide){if(muted)return;const c=ac();if(!c)return;const t=c.currentTime+(t0||0)+.005;
  const o=c.createOscillator(),v=c.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
  v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(g||.05,t+.006);v.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(v);v.connect(c.destination);o.start(t);o.stop(t+d+.03)}
 const api={
  click(){blip(1500,.03,'square',.035,0,.55)},
  tick(k,t0){blip(1100+((k*233)%700),.022,'triangle',.06,t0||0,.45)},
  open(){blip(170,.14,'sawtooth',.045,0,2.6);blip(700,.05,'square',.03,.11);blip(1050,.06,'square',.025,.16)},
  close(){blip(520,.12,'sawtooth',.04,0,.35);blip(95,.07,'square',.07,.3)},
  gather(){blip(300,.18,'triangle',.04,0,2)},
  knock(){blip(140,.05,'square',.07,0,.6)},
  select(){blip(880,.05,'square',.035);blip(1320,.08,'square',.03,.05)},
  burn(){for(let k=0;k<7;k++)blip(1800-k*210,.05,'sawtooth',.03,k*.06,.7);blip(60,.25,'square',.05,.42,.8)},
  flip(){blip(600,.09,'triangle',.05,0,1.8)},
  shutter(){blip(2400,.02,'square',.04);blip(900,.05,'square',.04,.03,.5)},
  get muted(){return muted},
  setMuted(v){muted=!!v;localStorage.setItem('qc-mute',muted?'1':'0')}};
 return api})();
function wireMute(btn){const s=()=>{btn.setAttribute('aria-pressed',SFX.muted);btn.textContent=SFX.muted?'SND OFF':'SND ON';btn.setAttribute('aria-label',SFX.muted?'Sound is off. Turn sound on':'Sound is on. Turn sound off')};
 s();btn.addEventListener('click',()=>{SFX.setMuted(!SFX.muted);s();SFX.click()})}
