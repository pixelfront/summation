// 10A: minimal on-device PDF text extractor, hand-written, no library. Lazy-loaded the first time Import PDF is used
// (the service worker keeps a copy then); it is not in the first-install precache. Nothing leaves the phone.
// Handles: classic and compressed object streams, FlateDecode (DecompressionStream), page tree order, Tj/TJ/'/"
// text operators, simple fonts (WinAnsi + /Differences) and Type0/Identity-H fonts through their ToUnicode CMaps.
// Scanned PDFs (pictures of text) have no text operators; the caller reports "no text found".
window.PDFTEXT=(()=>{
const WIN={128:8364,130:8218,131:402,132:8222,133:8230,134:8224,135:8225,136:710,137:8240,138:352,139:8249,140:338,142:381,145:8216,146:8217,147:8220,148:8221,149:8226,150:8211,151:8212,152:732,153:8482,154:353,155:8250,156:339,158:382,159:376};
const GLYPH={quoteright:8217,quoteleft:8216,quotedblleft:8220,quotedblright:8221,endash:8211,emdash:8212,bullet:8226,ellipsis:8230,fi:64257,fl:64258,space:32,hyphen:45,period:46,comma:44,quotesingle:39,quotedbl:34,dagger:8224,minus:8722,
 a:97,b:98,c:99,d:100,e:101,f:102,g:103,h:104,i:105,j:106,k:107,l:108,m:109,n:110,o:111,p:112,q:113,r:114,s:115,t:116,u:117,v:118,w:119,x:120,y:121,z:122};
const latin1=b=>{let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));return s};
async function inflate(b){if(typeof DecompressionStream!=='function')throw new Error('This browser cannot unpack PDF streams (needs iOS 16.4 or newer).');
 const ds=new DecompressionStream('deflate'),w=ds.writable.getWriter();w.write(b).catch(()=>{});w.close().catch(()=>{});
 const r=ds.readable.getReader(),parts=[];let n=0;try{for(;;){const{done,value}=await r.read();if(done)break;parts.push(value);n+=value.length}}catch(_){/* truncated/garbage tail: keep what inflated */}
 const o=new Uint8Array(n);let i=0;for(const p of parts){o.set(p,i);i+=p.length}return o}
// ---------- tiny PDF object parser (dicts, arrays, names, numbers, strings, refs)
function Lexer(s,i){this.s=s;this.i=i||0}
Lexer.prototype.ws=function(){const s=this.s;for(;;){const c=s.charCodeAt(this.i);if(c===37){while(this.i<s.length&&s[this.i]!=='\n'&&s[this.i]!=='\r')this.i++}else if(c===32||c===10||c===13||c===9||c===12||c===0)this.i++;else break}};
Lexer.prototype.val=function(){this.ws();const s=this.s,c=s[this.i];
 if(c==='<'&&s[this.i+1]==='<'){this.i+=2;const d={};for(;;){this.ws();if(s[this.i]==='>'&&s[this.i+1]==='>'){this.i+=2;return d}const k=this.val();if(!k||k.t!=='n')return d;d[k.v]=this.val()}}
 if(c==='['){this.i++;const a=[];for(;;){this.ws();if(s[this.i]===']'){this.i++;return a}if(this.i>=s.length)return a;a.push(this.val())}}
 if(c==='/'){let j=this.i+1;while(j<s.length&&!/[\s\/\[\]<>(){}%]/.test(s[j]))j++;const v=s.slice(this.i+1,j).replace(/#([0-9a-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));this.i=j;return{t:'n',v}}
 if(c==='('){return{t:'s',v:litStr(this)}}
 if(c==='<'){const j=s.indexOf('>',this.i);const h=s.slice(this.i+1,j).replace(/\s/g,'');this.i=j+1;return{t:'s',v:hexStr(h)}}
 const m=/^[+-]?(\d+\.?\d*|\.\d+)/.exec(s.slice(this.i,this.i+32));
 if(m){this.i+=m[0].length;const r=/^\s+(\d+)\s+R(?![A-Za-z])/.exec(s.slice(this.i,this.i+24));if(r&&/^\d+$/.test(m[0])){this.i+=r[0].length;return{t:'r',v:+m[0]}}return+m[0]}
 const w=/^[A-Za-z'"*]+/.exec(s.slice(this.i,this.i+20));if(w){this.i+=w[0].length;return w[0]==='true'?true:w[0]==='false'?false:w[0]==='null'?null:{t:'op',v:w[0]}}
 this.i++;return null};
function hexStr(h){if(h.length%2)h+='0';let o='';for(let i=0;i<h.length;i+=2)o+=String.fromCharCode(parseInt(h.substr(i,2),16));return o}
function litStr(L){const s=L.s;let i=L.i+1,d=1,o='';
 while(i<s.length){const c=s[i];if(c==='\\'){const n=s[i+1];const E={n:'\n',r:'\r',t:'\t',b:'\b',f:'\f','(':'(',')':')','\\':'\\'};
   if(E[n]!==undefined){o+=E[n];i+=2;continue}if(/[0-7]/.test(n)){const m=/^[0-7]{1,3}/.exec(s.slice(i+1,i+4))[0];o+=String.fromCharCode(parseInt(m,8)&255);i+=1+m.length;continue}
   if(n==='\r'){i+=s[i+2]==='\n'?3:2;continue}if(n==='\n'){i+=2;continue}o+=n;i+=2;continue}
  if(c==='('){d++}else if(c===')'){d--;if(!d){i++;break}}o+=c;i++}L.i=i;return o}
// ---------- document
async function open(buf){const b=new Uint8Array(buf),s=latin1(b);if(!/^%PDF-/.test(s.slice(0,1024).trimStart()))throw new Error('This file is not a PDF.');
 if(/\/Encrypt\s/.test(s))throw new Error('This PDF is locked (encrypted), so its text cannot be read.');
 const objs=new Map(),re=/(\d+)\s+(\d+)\s+obj\b/g;let m;
 while((m=re.exec(s))){const L=new Lexer(s,re.lastIndex);let v;try{v=L.val()}catch(_){continue}let st=null;
  L.ws();if(s.startsWith('stream',L.i)){let a=L.i+6;if(s[a]==='\r')a++;if(s[a]==='\n')a++;
   let len=v&&typeof v.Length==='number'?v.Length:-1;let e=len>=0&&s.startsWith('endstream',skipWs(s,a+len))?a+len:s.indexOf('endstream',a);
   if(e<0)e=s.length;let e2=e;if(len<0||e2!==a+len){while(e2>a&&(s[e2-1]==='\n'||s[e2-1]==='\r'))e2--}st=b.subarray(a,e2);re.lastIndex=e}
  objs.set(+m[1],{v,st})}
 const doc={objs,cache:new Map()};
 // compressed object streams
 for(const[,o]of[...objs]){if(o.v&&o.v.Type&&o.v.Type.v==='ObjStm'&&o.st){try{const d=latin1(await decode(doc,o)),n=o.v.N,first=o.v.First,L=new Lexer(d,0),hdr=[];
   for(let k=0;k<n;k++){hdr.push([L.val(),L.val()])}for(const[num,off]of hdr){if(!objs.has(num)){const L2=new Lexer(d,first+off);objs.set(num,{v:L2.val(),st:null})}}}catch(_){}}}
 const trailer=(()=>{const t=s.lastIndexOf('trailer');if(t>=0){const L=new Lexer(s,t+7);const v=L.val();if(v&&v.Root)return v}
  for(const[,o]of objs)if(o.v&&o.v.Type&&o.v.Type.v==='XRef'&&o.v.Root)return o.v;return null})();
 let root=trailer&&R(doc,trailer.Root);if(!root||!root.Pages)for(const[,o]of objs)if(o.v&&o.v.Type&&o.v.Type.v==='Catalog'){root=o.v;break}
 doc.pages=[];const seen=new Set();
 (function walk(node,inh){if(!node||seen.has(node))return;seen.add(node);const res=node.Resources||inh;
  if(node.Type&&node.Type.v==='Page'||(!node.Kids&&node.Contents)){doc.pages.push({node,res});return}
  for(const k of(R(doc,node.Kids)||[]))walk(R(doc,k),res)})(root&&R(doc,root.Pages),null);
 if(!doc.pages.length)for(const[,o]of objs)if(o.v&&o.v.Type&&o.v.Type.v==='Page')doc.pages.push({node:o.v,res:o.v.Resources});
 return doc}
const skipWs=(s,i)=>{while(i<s.length&&/\s/.test(s[i]))i++;return i};
const R=(doc,v)=>{let n=0;while(v&&v.t==='r'&&n++<20){const o=doc.objs.get(v.v);v=o?o.v:null}return v};
const RO=(doc,v)=>v&&v.t==='r'?doc.objs.get(v.v):null;
async function decode(doc,o){let f=R(doc,o.v&&o.v.Filter);f=Array.isArray(f)?f.map(x=>R(doc,x)):f?[f]:[];let d=o.st;
 for(const x of f){if(x.v==='FlateDecode'||x.v==='Fl')d=await inflate(d);else throw new Error('unsupported filter '+x.v)}return d}
// ---------- fonts
async function font(doc,ref){const key=ref&&ref.t==='r'?ref.v:null;if(key!=null&&doc.cache.has(key))return doc.cache.get(key);
 const f=R(doc,ref)||{},F={two:false,map:null,diff:null};
 if(f.Subtype&&f.Subtype.v==='Type0'){F.two=true}
 const tu=RO(doc,f.ToUnicode);if(tu&&tu.st){try{const c=latin1(await decode(doc,tu));F.map=cmap(c,F)}catch(_){}}
 const enc=R(doc,f.Encoding);if(enc&&enc.Differences){F.diff={};let code=0;for(const x of R(doc,enc.Differences)){if(typeof x==='number')code=x;else if(x&&x.t==='n'){const u=GLYPH[x.v]||(/^uni([0-9A-F]{4})$/.exec(x.v)||[])[1];if(u)F.diff[code]=typeof u==='number'?u:parseInt(u,16);code++}}}
 if(key!=null)doc.cache.set(key,F);return F}
function cmap(c,F){const map=new Map(),hex=h=>parseInt(h,16),u=h=>{let o='';for(let i=0;i<h.length;i+=4)o+=String.fromCharCode(hex(h.substr(i,4)));return o};
 const cs=/begincodespacerange([\s\S]*?)endcodespacerange/.exec(c);if(cs){const m=/<([0-9a-fA-F]+)>/.exec(cs[1]);if(m)F.two=m[1].length>=4}
 for(const blk of c.split('beginbfchar').slice(1)){const body=blk.split('endbfchar')[0];for(const m of body.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))map.set(hex(m[1]),u(m[2]))}
 for(const blk of c.split('beginbfrange').slice(1)){const body=blk.split('endbfrange')[0];
  for(const m of body.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]+)>|\[([^\]]*)\])/g)){const a=hex(m[1]),z=hex(m[2]);
   if(m[4]!==undefined){const base=m[4];const b0=hex(base.slice(-4)),pre=base.length>4?u(base.slice(0,-4)):'';for(let k=a;k<=z&&k-a<65536;k++)map.set(k,pre+String.fromCharCode(b0+k-a))}
   else{const arr=[...m[5].matchAll(/<([0-9a-fA-F]+)>/g)];arr.forEach((x,k)=>map.set(a+k,u(x[1])))}}}
 return map}
function show(F,str){let o='';if(F.two){for(let i=0;i+1<str.length;i+=2){const code=str.charCodeAt(i)<<8|str.charCodeAt(i+1);o+=F.map&&F.map.has(code)?F.map.get(code):''}return o}
 for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);if(F.map&&F.map.has(c)){o+=F.map.get(c);continue}if(F.diff&&F.diff[c]){o+=String.fromCharCode(F.diff[c]);continue}o+=String.fromCharCode(WIN[c]||c)}return o}
// ---------- content streams
async function pageText(doc,pg){const node=pg.node,res=R(doc,pg.res)||{},fonts=R(doc,res.Font)||{};let c=node.Contents;if(c&&c.t==='r'){const o=doc.objs.get(c.v);if(o&&Array.isArray(o.v))c=o.v}
 const parts=[];for(const r of(Array.isArray(c)?c:[c])){const o=RO(doc,r);if(o&&o.st){try{parts.push(latin1(await decode(doc,o)))}catch(_){}}}
 const s=parts.join('\n'),L=new Lexer(s,0),st=[];let F={two:false,map:null,diff:null},fs=12,out=[],line='',ty=null,lastY=null,lead=0,tlx=0,tly=0,gaps=[];
 let pend=0;const nl=(dy)=>{if(line.trim()){out.push({t:line,dy:pend});pend=dy}else pend+=dy;line=''};
 const fonts2=new Map();
 const XO=R(doc,res.XObject)||{};
 while(L.i<s.length){const v=L.val();if(v===null&&L.i>=s.length)break;
  if(v&&v.t==='op'){const op=v.v,a=st;
   if(op==='BI'){const e=s.indexOf('EI',L.i);L.i=e<0?s.length:e+2}
   else if(op==='Tf'){const nm=a[a.length-2];fs=Math.abs(a[a.length-1])||fs;if(nm&&nm.t==='n'){if(!fonts2.has(nm.v))fonts2.set(nm.v,await font(doc,fonts[nm.v]));F=fonts2.get(nm.v)}}
   else if(op==='BT'){tlx=0;tly=0}
   else if(op==='Td'||op==='TD'){const tx=a[a.length-2]||0,dy=a[a.length-1]||0;if(op==='TD')lead=-dy;if(dy){nl(Math.abs(dy));}else if(tx>fs*0.6&&line&&!/\s$/.test(line))line+=' '}
   else if(op==='Tm'){const y=a[a.length-1],x=a[a.length-2];if(lastY!==null&&Math.abs(y-lastY)>fs*.4)nl(Math.abs(y-lastY));else if(line&&!/\s$/.test(line))line+=' ';lastY=y}
   else if(op==='T*'){nl(lead||fs)}
   else if(op==='TL'){lead=a[a.length-1]||lead}
   else if(op==='Tj'){const t=a[a.length-1];if(t&&t.t==='s')line+=show(F,t.v)}
   else if(op==="'"||op==='"'){nl(lead||fs);const t=a[a.length-1];if(t&&t.t==='s')line+=show(F,t.v)}
   else if(op==='TJ'){const arr=a[a.length-1];if(Array.isArray(arr))for(const x of arr){if(x&&x.t==='s')line+=show(F,x.v);else if(typeof x==='number'&&x<-200&&!/\s$/.test(line))line+=' '}}
   else if(op==='ET'){}
   else if(op==='Do'){/* form XObjects with text are rare in text PDFs; skipped */}
   st.length=0}
  else st.push(v)}
 nl(0);return out}
async function extract(buf,onp){const doc=await open(buf),pages=[];let k=0;
 for(const pg of doc.pages){pages.push(await pageText(doc,pg));k++;if(onp)onp(k,doc.pages.length);if(k%5===0)await new Promise(r=>setTimeout(r,0))}
 // paragraph breaks: a line gap clearly bigger than the usual one
 const gaps=pages.flat().map(l=>l.dy).filter(x=>x>0).sort((a,b)=>a-b),need=Math.max(2,gaps.length*.15),med=gaps.find(g=>gaps.filter(h=>Math.abs(h-g)<=g*.1).length>=need)||gaps[0]||12; // the usual line step
 const text=pages.map(ls=>ls.map((l,i)=>(i&&l.dy>med*1.45?'\n':'')+l.t).join('\n')).join('\n\n');
 return{pages:doc.pages.length,text,chars:text.replace(/\s/g,'').length}}
// split into candidate quotes: paragraphs (blank-line separated, hyphenation joined) + long quoted passages
function split(text){const paras=text.replace(/\r/g,'').split(/\n\s*\n+/).map(p=>p.replace(/(\w)-\n(\w)/g,'$1$2').replace(/\s*\n\s*/g,' ').replace(/\s+/g,' ').trim()).filter(Boolean);
 const out=[],seen=new Set(),add=q=>{q=q.replace(/^[\u201c"]+|[\u201d"]+$/g,'').trim();const k=q.toLowerCase().slice(0,80);if(q.length<30||q.length>700||seen.has(k)||/^\d+$/.test(q))return;seen.add(k);out.push(q)};
 for(const p of paras){const qs=[...p.matchAll(/[\u201c"]([^\u201d"]{40,700})[\u201d"]/g)].map(m=>m[1]);if(qs.length&&qs.join('').length<p.length*.8)qs.forEach(add);else add(p)}
 return out}
return{extract,split}})();
