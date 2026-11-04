// v2 additions to the WebAudio stubs (same mute flag).
(()=>{let ctx=null;function ac(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;try{ctx=new A()}catch(_){return null}}if(ctx.state==='suspended')ctx.resume();return ctx}
 function blip(f,d,type,g,t0,slide){if(SFX.muted)return;const c=ac();if(!c)return;const t=c.currentTime+(t0||0)+.005;const o=c.createOscillator(),v=c.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(g||.05,t+.006);v.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(v);v.connect(c.destination);o.start(t);o.stop(t+d+.03)}
 SFX.frame=k=>blip(2000+(k%4)*120,.012,'square',.012);
 SFX.got=k=>blip(1300+(k%8)*90,.03,'triangle',.04,0,1.3);
 SFX.done=()=>{[660,880,1320].forEach((f,i)=>blip(f,.07,'square',.035,i*.07))};
 SFX.offer=()=>{blip(400,.08,'triangle',.05,0,2);blip(1200,.05,'square',.03,.09)};
 SFX.deny=()=>{blip(220,.12,'square',.05);blip(160,.16,'square',.05,.12)};})();
