// 11B: music, off by default. An original chiptune arrangement (pulse lead, triangle bass, arpeggio, noise drums)
// of The Internationale, melody by Pierre De Geyter (1888, public domain). The melody notes were transcribed at build time from a public-domain score (tools/build_music.py); the arrangement is original;
// nothing is downloaded, no audio file ships. WebAudio oscillators only. Starts only from a tap (iPhone rule).
// Setting: localStorage 'qc-music' ('1' on). The SND mute button also silences it.
window.MUSIC=(()=>{const KEY='qc-music';
// lead: midi,beats; 0 = rest. G major, 4/4, pickup of one beat. Chords per half bar from beat 1.
const LEAD="62,1;67,1.5;66,0.5;69,0.5;67,0.5;62,0.5;59,0.5;64,2;60,1;64,1;69,1.5;67,0.5;66,0.5;64,0.5;62,0.5;60,0.5;59,2;0,1;62,1;67,1.5;66,0.5;69,0.5;67,0.5;62,0.5;59,0.5;64,2;60,1;69,0.5;67,0.5;66,1;69,1;72,1;66,1;67,2;0,1;71,0.5;69,0.5;66,1.5;66,0.5;64,0.5;66,0.5;67,0.5;64,0.5;66,2;62,1;61,0.5;62,0.5;64,1.5;64,0.5;69,1.5;67,0.5;66,2;0,1;69,1;69,1.5;66,0.5;62,0.5;62,0.5;61,0.5;62,0.5;71,2;67,0.5;64,0.5;66,0.5;67,0.5;66,1;69,1;67,1;64,1;62,2;0,1;71,0.75;69,0.25;67,2;62,1.5;59,0.5;64,2;60,1;69,0.75;67,0.25;66,2;64,1.5;62,0.5;62,2;0,1;62,1;71,1.5;71,0.5;69,1;62,1;67,2;66,1.5;66,0.5;64,1.5;63,0.5;64,1;69,1;69,2;0,1;71,0.75;69,0.25;67,2;62,1.5;59,0.5;64,2;60,1;69,0.75;67,0.25;66,2;64,1.5;62,0.5;71,2;0,1;71,1;74,1.5;74,0.5;72,1;71,1;69,1;71,1;72,1;0,0.5;72,0.5;71,1.5;67,0.5;69,1.5;66,0.5;67,2;0,1";
const CHORDS="G:2;G:2;C:2;C:2;D7:2;D7:2;G:2;G:2;G:2;G:2;C:2;C:2;D7:2;D7:2;G:2;G:2;D7:2;C:2;D7:2;D7:2;C:2;D7:2;D7:2;D7:2;D7:2;D7:2;G:2;C:2;D7:2;C:2;G:2;G:2;G:2;G:2;C:2;D7:2;D7:2;C:2;G:2;G:2;G:2;D7:2;G:2;D7:2;C:2;Am:2;Am:2;G:2;G:2;G:2;C:2;D7:2;D7:2;C:2;G:2;G:2;G:2;C:2;D7:2;D7:2;G:2;D7:2;G:2;G:1";
const TONES={G:[7,11,2],C:[0,4,7],D7:[2,6,9,0],Em:[4,7,11],Am:[9,0,4],Bm:[11,2,6],A7:[9,1,4,7],B7:[11,3,6,9],E7:[4,8,11,2]};
const ROOT={G:43,C:48,D7:50,Em:40,Am:45,Bm:47,A7:45,B7:47,E7:40};
const BPM=112,SPB=60/BPM;
const lead=LEAD.split(';').filter(Boolean).map(s=>s.split(',').map(Number));
let t=1;const chords=CHORDS.split(';').filter(Boolean).map(s=>{const[c,d]=s.split(':');const o={c,t0:t,d:+d};t+=+d;return o});
const LEN=lead.reduce((a,[,b])=>a+b,0)+4; // one bar of breath before the loop
let ctx=null,on=false,timer=null,t0=0,loopN=0,master=null,pulse=null,noise=null;const btns=new Set();
const hz=m=>440*Math.pow(2,(m-69)/12);
function ac(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=new A();
  master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);
  // 25% pulse wave for the lead (NES-style), built from its Fourier series
  const N=32,re=new Float32Array(N),im=new Float32Array(N);for(let k=1;k<N;k++){im[k]=0;re[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*.25)}pulse=ctx.createPeriodicWave(re,im);
  const b=ctx.createBuffer(1,ctx.sampleRate*.25,ctx.sampleRate),d=b.getChannelData(0);let s=1;for(let i=0;i<d.length;i++){s^=s<<13;s^=s>>17;s^=s<<5;d[i]=((s>>>0)/4294967296)*2-1}noise=b}
 if(ctx.state==='suspended')ctx.resume();return ctx}
function tone(type,f,at,dur,g,wave){const o=ctx.createOscillator(),v=ctx.createGain();if(wave)o.setPeriodicWave(wave);else o.type=type;o.frequency.setValueAtTime(f,at);
 v.gain.setValueAtTime(0,at);v.gain.linearRampToValueAtTime(g,at+.008);v.gain.setValueAtTime(g,at+Math.max(.01,dur-.04));v.gain.linearRampToValueAtTime(0,at+dur);
 o.connect(v);v.connect(master);o.start(at);o.stop(at+dur+.02);return o}
function hit(at,dur,g,hp){const s=ctx.createBufferSource(),v=ctx.createGain(),f=ctx.createBiquadFilter();s.buffer=noise;f.type='highpass';f.frequency.value=hp;
 v.gain.setValueAtTime(g,at);v.gain.exponentialRampToValueAtTime(.0001,at+dur);s.connect(f);f.connect(v);v.connect(master);s.start(at);s.stop(at+dur+.01)}
function kick(at){const o=ctx.createOscillator(),v=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(140,at);o.frequency.exponentialRampToValueAtTime(42,at+.12);
 v.gain.setValueAtTime(.32,at);v.gain.exponentialRampToValueAtTime(.0001,at+.16);o.connect(v);v.connect(master);o.start(at);o.stop(at+.18)}
// schedule one full pass of the arrangement starting at time T
function pass(T){let b=0;
 for(const[m,d]of lead){if(m){const at=T+b*SPB,du=d*SPB*.92;const o=tone('',hz(m),at,du,.075,pulse);if(d>=1.5){const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=5.5;lg.gain.value=4;l.connect(lg);lg.connect(o.frequency);l.start(at+.25);l.stop(at+du)}}b+=d}
 for(const c of chords){const tn=TONES[c.c],r=ROOT[c.c];
  // bass: root, root an octave up, fifth, root (eighths, triangle)
  const fifth=r+7,pat=[r,r+12,fifth,r];for(let k=0;k<c.d*2;k++){const at=T+(c.t0+k*.5)*SPB;tone('triangle',hz(pat[k%4]),at,SPB*.45,.16)}
  // arpeggio: chord tones cycling in sixteenths, quiet square, octave 5
  const ar=tn.map(p=>72+((p-72)%12+12)%12).sort((a,b)=>a-b);for(let k=0;k<c.d*4;k++){const at=T+(c.t0+k*.25)*SPB;tone('square',hz(ar[k%ar.length]),at,SPB*.2,.018)}
  // drums: kick on the half-bar, snare on its second beat, hat on every off-beat
  for(let k=0;k<c.d;k++){const at=T+(c.t0+k)*SPB;if(k%2===0)kick(at);else hit(at,.12,.12,1200);hit(at+SPB/2,.04,.05,6000)}}}
function sched(){if(!on)return;const now=ctx.currentTime;while(t0+loopN*LEN*SPB<now+1.5){pass(t0+loopN*LEN*SPB);loopN++}}
function start(){if(on)return true;if(window.SFX&&SFX.muted)return false;if(!ac())return false;on=true;
 // a fresh master per start so stop() can cut everything already scheduled
 master.disconnect();master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);
 t0=ctx.currentTime+.08;loopN=0;sched();timer=setInterval(sched,400);upd();return true}
function stop(){if(!on){upd();return}on=false;clearInterval(timer);timer=null;if(master){const g=master;g.gain.setTargetAtTime(0,ctx.currentTime,.03);setTimeout(()=>g.disconnect(),200)}upd()}
const pref=()=>{try{return localStorage.getItem(KEY)==='1'}catch(_){return false}};
function setPref(v){try{localStorage.setItem(KEY,v?'1':'0')}catch(_){}}
// tap handler for the settings toggle: user gesture -> start/stop right away
function toggle(){if(on){stop();setPref(false)}else{setPref(true);if(!start()){const L=document.getElementById('live');if(L)L.textContent='Sound is off (SND). Turn sound on to hear the music.'}}upd()}
function upd(){btns.forEach(b=>{b.setAttribute('aria-pressed',String(on));b.querySelector('.mu-st')&&(b.querySelector('.mu-st').textContent=on?'ON':'OFF')})}
function bind(b){btns.add(b);b.addEventListener('click',toggle);upd()}
// setting left on from an earlier visit: still wait for the first tap anywhere (no autoplay)
if(pref())addEventListener('pointerdown',function first(){removeEventListener('pointerdown',first,true);setTimeout(()=>{if(pref()&&!on)start()},0)},true);
return{start,stop,toggle,bind,get on(){return on},get pref(){return pref()},beats:LEN,notes:lead.length}})();
