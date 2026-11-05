// 3A: burn any card (sample, made, received). Samples come back with Restore deck; made and received cards are gone
// for good, so those ask once. The effect (~1.2 s): edges char from a random side (500 ms), the card curls and breaks
// into 24-40 embers drifting up on a canvas (700 ms), then a dashed ash outline fades (200 ms).
// Reduced motion: a plain fade to the ash outline. Crackle only when sounds are on.
window.BURNFX=(()=>{const RM=matchMedia('(prefers-reduced-motion: reduce)');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function crackle(){if(window.SFX&&SFX.muted)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=BURNFX._c||(BURNFX._c=new A());if(c.state==='suspended')c.resume();
 const n=c.sampleRate*1.1|0,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++){d[i]=Math.random()<.004?(Math.random()*2-1):(Math.random()*2-1)*.04*(1-i/n)}
 const s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=2400;f.Q.value=.7;g.gain.value=.5;s.buffer=b;s.connect(f);f.connect(g);g.connect(c.destination);s.start()}catch(_){}}
function ash(r){const a=document.createElement('div');a.className='ash-outline';a.setAttribute('aria-hidden','true');
 Object.assign(a.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});document.body.appendChild(a);return a}
async function play(el){if(!el)return;const r=el.getBoundingClientRect();
 if(RM.matches||!r.width){el.style.transition='opacity .2s linear';el.style.opacity='0';const a=ash(r);await wait(220);a.classList.add('gone');await wait(200);a.remove();return}
 crackle();if(window.SFX&&SFX.burn)SFX.burn();
 // random edge to start from
 const side=Math.random()*4|0,ox=[50,100,50,0][side],oy=[0,50,100,50][side];
 const cv=document.createElement('canvas'),dpr=Math.min(2,devicePixelRatio||1),pad=120;cv.className='ember-cv';cv.setAttribute('aria-hidden','true');
 cv.width=(r.width+pad*2)*dpr;cv.height=(r.height+pad*2)*dpr;Object.assign(cv.style,{left:(r.left-pad)+'px',top:(r.top-pad)+'px',width:(r.width+pad*2)+'px',height:(r.height+pad*2)+'px'});
 document.body.appendChild(cv);const x=cv.getContext('2d');x.scale(dpr,dpr);
 const N=24+(Math.random()*17|0),P=[];
 const char=document.createElement('i');char.className='char-front';char.setAttribute('aria-hidden','true');el.appendChild(char);el.classList.add('burn-host');
 const T0=performance.now(),D=1200,keepT=el.style.transform,keepO=el.style.opacity,keepM=el.style.webkitMaskImage;
 await new Promise(done=>{function f(now){const t=Math.min(1,(now-T0)/D);
   // 0-.42 char front grows from the edge; .3-.9 card curls, shrinks and is eaten; embers spawn on the front
   const k=Math.min(1,t/.75),R=k*160;
   const m=`radial-gradient(circle at ${ox}% ${oy}%, transparent ${Math.max(0,R-14)}%, #000 ${R+2}%)`;el.style.webkitMaskImage=el.style.maskImage=m;
   char.style.background=`radial-gradient(circle at ${ox}% ${oy}%, transparent ${Math.max(0,R-16)}%, #ff2a2a ${R-10}%, #ffb000 ${R-6}%, #120000 ${R}%, rgba(0,0,0,.55) ${R+12}%, transparent ${R+30}%)`;
   const c=Math.max(0,(t-.3)/.6);el.style.transform=(keepT||'')+` perspective(600px) rotateX(${c*28*(oy>50?-1:1)}deg) rotateY(${c*18*(ox>50?1:-1)}deg) scale(${1-c*.12})`;
   if(t<.85&&P.length<N&&Math.random()<.9){for(let j=0;j<2&&P.length<N;j++){const a=Math.random()*Math.PI*2,rr=R/100*Math.hypot(r.width,r.height)*.55;
     const px=pad+r.width*ox/100+Math.cos(a)*rr,py=pad+r.height*oy/100+Math.sin(a)*rr;
     if(px>pad-4&&px<pad+r.width+4&&py>pad-4&&py<pad+r.height+4)P.push({x:px,y:py,vx:(Math.random()-.5)*.6,vy:-.6-Math.random()*1.4,l:1,s:1+Math.random()*2.2})}}
   x.clearRect(0,0,cv.width,cv.height);for(const p of P){p.x+=p.vx+Math.sin((now+p.s*99)/120)*.3;p.y+=p.vy;p.l-=.022;if(p.l<=0)continue;
    x.globalAlpha=Math.max(0,p.l);x.fillStyle=p.l>.6?'#ffd27a':p.l>.3?'#ff6a00':'#ff2a2a';x.fillRect(p.x,p.y,p.s,p.s)}
   if(t<1)requestAnimationFrame(f);else done()}requestAnimationFrame(f)});
 const a=ash(r);el.style.opacity='0';await wait(60);cv.remove();a.classList.add('gone');await wait(200);a.remove();char.remove();el.classList.remove('burn-host');
 el.style.webkitMaskImage=el.style.maskImage=keepM||'';el.style.transform=keepT;el.style.opacity=keepO}
// one-time confirm for made/received cards (custom dialog: works the same in an iPhone home-screen app)
function ask(d){return new Promise(res=>{const dlg=document.getElementById('burnAsk'),yes=document.getElementById('burnYes'),no=document.getElementById('burnNo'),ret=document.activeElement;
 document.getElementById('burnAskTxt').textContent=`${d.who}: \u201c${d.q.length>90?d.q.slice(0,87)+'\u2026':d.q}\u201d. ${d.recv?'This card came to you by QR.':'You made or pulled this card.'} Burned cards can't come back, and it can't be sent afterwards.`;
 dlg.hidden=false;no.focus({preventScroll:true});
 const end=v=>{dlg.hidden=true;yes.onclick=no.onclick=null;document.removeEventListener('keydown',esc,true);if(ret&&ret.focus)ret.focus({preventScroll:true});res(v)};
 const esc=e=>{if(e.key==='Escape'){e.stopPropagation();end(false)}};document.addEventListener('keydown',esc,true);
 yes.onclick=()=>end(true);no.onclick=()=>end(false)})}
return{play,ask,needsAsk:d=>!isSample(d.id)}})();
