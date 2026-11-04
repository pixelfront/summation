// Card viewer: free 3D rotation (quaternions). Ported unchanged in behaviour from design sandbox v2 src/viewer.js.
// Sets window.CARD for export.js.
window.VIEWER=(()=>{const $=s=>document.querySelector(s);
const stage=$('#stage'),live=$('#live'),RM=matchMedia('(prefers-reduced-motion: reduce)');
let card=null,front=null,back=null,data=null,showingBack=false,running=false;
const D=Math.PI/180,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const qa=(x,y,z,deg)=>{const l=Math.hypot(x,y,z)||1,h=deg*D/2,s=Math.sin(h);return[Math.cos(h),x/l*s,y/l*s,z/l*s]};
const qm=(a,b)=>[a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];
const qn=q=>{const l=Math.hypot(...q)||1;return q.map(v=>v/l)},qc=q=>[q[0],-q[1],-q[2],-q[3]];
const toAA=q=>{if(q[0]<0)q=q.map(v=>-v);const a=2*Math.acos(cl(q[0],-1,1)),s=Math.sqrt(1-q[0]*q[0]);return s<1e-5?[0,1,0,0]:[q[1]/s,q[2]/s,q[3]/s,a/D]};
const mat=q=>{const[w,x,y,z]=q;return[1-2*(y*y+z*z),2*(x*y-w*z),2*(x*z+w*y),2*(x*y+w*z),1-2*(x*x+z*z),2*(y*z-w*x),2*(x*z-w*y),2*(y*z+w*x),1-2*(x*x+y*y)]};
let q=[1,0,0,0],vel=null,drag=null,anim=null,idle=false,frozen=false;const o={x:0,y:0};const pts=new Map();
const wake=()=>{idle=false;frozen=false};
const ease=(t,bk)=>bk?1+2.2*Math.pow(t-1,3)+1.2*Math.pow(t-1,2):1-Math.pow(1-t,3);
function turn(ax,deg,dur,bk){wake();vel=null;if(RM.matches){q=qn(qm(qa(...ax,deg),q));return}anim={q0:q,ax,deg,t0:performance.now(),dur:dur||480,back:bk}}
function to(target,dur){const d=qm(target,qc(q)),aa=toAA(d);if(Math.abs(aa[3])<.2){q=target;return}turn([aa[0],aa[1],aa[2]],aa[3],dur||520,true)}
const flat=()=>{const m=mat(q);return m[8]>=0?[1,0,0,0]:qa(0,1,0,180)};
function flip(){SFX.flip();const m=mat(q);const up=Math.abs(m[8])>.2;to(qm(qa(0,1,0,180),up?flat():q),560)}
function straighten(){SFX.click();wake();to([1,0,0,0],560);o.x=o.y=0}
const twist=d=>{SFX.tick(d>0?3:1);turn([0,0,1],d,260)};
$('#flip').addEventListener('click',flip);$('#reset').addEventListener('click',straighten);
$('#twistL').addEventListener('click',()=>twist(-15));$('#twistR').addEventListener('click',()=>twist(15));
$('#spin').addEventListener('click',()=>{SFX.flip();turn([0.35,1,0.15],360,RM.matches?0:1100)});
let lastTap=0,moved=0;
stage.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});try{stage.setPointerCapture(e.pointerId)}catch(_){}
 wake();anim=null;vel=null;moved=0;drag={t:performance.now()}});
stage.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;const now=performance.now();
 if(pts.size>=2){const [a,b]=[...pts.values()];const a0=Math.atan2(b.y-a.y,b.x-a.x);p.x=e.clientX;p.y=e.clientY;const [c,d]=[...pts.values()];
  let da=(Math.atan2(d.y-c.y,d.x-c.x)-a0)/D;if(da>180)da-=360;if(da<-180)da+=360;q=qn(qm(qa(0,0,1,da),q));moved+=99;return}
 const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
 const deg=Math.hypot(dx,dy)*.5;if(deg<.01)return;const ax=[-dy,dx,0];q=qn(qm(qa(...ax,deg),q));
 const dt=Math.max(8,now-drag.t);drag.t=now;vel={ax,dps:deg/dt*1000}});
function up(e){if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(pts.size)return;
 const now=performance.now();if(moved<8){if(now-lastTap<320){straighten();lastTap=0}else lastTap=now}
 if(vel&&now-drag.t>80)vel=null;if(vel&&vel.dps<60)vel=null;if(vel&&RM.matches)vel=null;
 drag=null;if(!vel&&$('#snapBack').checked)to(flat())}
['pointerup','pointercancel'].forEach(t=>stage.addEventListener(t,up));
stage.addEventListener('keydown',e=>{if(e.target!==stage)return;const k=e.key;let h=1;
 if(k==='Enter'||k===' ')flip();else if(k==='ArrowLeft')turn([0,1,0],-12,160);else if(k==='ArrowRight')turn([0,1,0],12,160);
 else if(k==='ArrowUp')turn([1,0,0],10,160);else if(k==='ArrowDown')turn([1,0,0],-10,160);
 else if(k==='q'||k==='Q')twist(-15);else if(k==='e'||k==='E')twist(15);else if(k==='0'||k==='Home')straighten();else h=0;
 if(h)e.preventDefault()});
$('#motion').addEventListener('click',async()=>{try{
 if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){if(await DeviceOrientationEvent.requestPermission()!=='granted'){live.textContent='Tilt permission was not given';return}}
 addEventListener('deviceorientation',e=>{if(e.gamma==null)return;o.y=cl(e.gamma,-30,30)*.9;o.x=cl(e.beta-45,-30,30)*-.7});
 wake();$('#motion').textContent='Phone tilt on';$('#motion').setAttribute('aria-pressed','true')}catch(_){live.textContent='Phone tilt is not available'}});
function label(){if(!data)return;stage.setAttribute('aria-label',`${cardNo(data)} quote card, ${data.holo?'holo':'matte'} finish, showing the ${showingBack?'back':'front'}. \u201c${data.q}\u201d, ${data.who}, ${data.src}. Drag to spin. Arrow keys spin, Q and E twist, Enter flips, 0 straightens.`)}
function faces(b){if(b===showingBack)return;showingBack=b;card.classList.toggle('show-back',b);
 front.setAttribute('aria-hidden',b);back.setAttribute('aria-hidden',!b);label();live.textContent=b?'Showing the back':'Showing the front';if(vel)SFX.tick(b?2:5)}
function apply(Q){const m=mat(Q);
 card.style.transform=`matrix3d(${[m[0],m[3],m[6],0,m[1],m[4],m[7],0,m[2],m[5],m[8],0,0,0,0,1].map(v=>v.toFixed(5)).join(',')})`;
 const b=m[8]<0,sg=b?-1:1,nx=m[2]*sg,ny=m[5]*sg;
 const yaw=Math.asin(cl(nx,-1,1))/D,pit=Math.asin(cl(ny,-1,1))/D,rz=Math.atan2(m[3],m[0])/D;
 const mx=cl(yaw/40,-1,1),my=cl(pit/32,-1,1),t=Math.min(1,Math.hypot(mx,my)),s=card.style;
 s.setProperty('--mx',mx.toFixed(3));s.setProperty('--my',my.toFixed(3));
 s.setProperty('--sx',(50+mx*50).toFixed(1)+'%');s.setProperty('--sy',(50+my*50).toFixed(1)+'%');
 s.setProperty('--ang',(yaw*1.6-pit+rz*.5).toFixed(1)+'deg');s.setProperty('--tilt',t.toFixed(3));faces(b)}
let lt=performance.now();
function loop(t){if(!running)return;const dt=Math.min(50,t-lt);lt=t;
 if(anim){const k=Math.min(1,(t-anim.t0)/anim.dur);q=qn(qm(qa(...anim.ax,anim.deg*ease(k,anim.back)),anim.q0));if(k>=1)anim=null}
 else if(vel&&!drag){q=qn(qm(qa(...vel.ax,vel.dps*dt/1000),q));vel.dps*=Math.pow(.94,dt/16.7);if(vel.dps<20){vel=null;if($('#snapBack').checked)to(flat())}}
 let R=q;if(idle&&!drag&&!frozen)R=qm(qm(qa(1,0,0,Math.sin(t/1500)*7),qa(0,1,0,Math.sin(t/2100)*14)),q);
 if(o.x||o.y)R=qm(qm(qa(1,0,0,o.x),qa(0,1,0,o.y)),R);
 apply(R);requestAnimationFrame(loop)}
function load(d,rot){data=d;{const cs=document.querySelector('#cardSend');if(cs)cs.hidden=cs.disabled=isSample(d.id)} /* demo cards: no Send */stage.innerHTML=cardHTML(d,true);card=stage.firstElementChild;card.removeAttribute('aria-hidden');card.classList.add('interactive');card.id='card';
 front=card.querySelector('#front');back=card.querySelector('#back');back.setAttribute('aria-hidden','true');showingBack=false;
 const r=fitQuote(card,d);$('#vMeta').textContent=`${d.q.length} chars \u00b7 ${r.mode==='scroll'?`scroll well, ${r.px}px type (huge or still overflowing at ${LQ.FLOOR}px)`:`shrink to fit, ${r.px}px type`}${photoSrc(d)?' \u00b7 photo':''}`;
 const sc=card.querySelector('.lq-scroll');if(sc){sc.tabIndex=0}
 q=[1,0,0,0];vel=anim=null;idle=!RM.matches;frozen=false;
 if(rot){q=qm(qm(qa(1,0,0,rot.rx||0),qa(0,1,0,rot.ry||0)),qa(0,0,1,rot.rz||0));frozen=true;idle=false}
 apply(q);label();if(!running){running=true;lt=performance.now();requestAnimationFrame(loop)}}
function stop(){running=false}
window.CARD={get card(){return card},get front(){return front},get back(){return back},get showingBack(){return showingBack},name:()=>data?data.who:'card',short:()=>data?data.sh:'card'};
return{load,stop,get data(){return data}}})();
