// 9A: theme picked before first paint (loaded in <head>, no inline script under the CSP). Local only: 'qc-theme'.
(()=>{const T=['dark','light','voxel','blueprint'];let t=new URLSearchParams(location.search).get('theme');
 if(!T.includes(t)){try{t=localStorage.getItem('qc-theme')}catch(_){t=null}}if(!T.includes(t))t='dark';document.documentElement.dataset.theme=t;
 const m=document.querySelector('meta[name=theme-color]');if(m)m.content={dark:'#000000',light:'#f4f4ef',voxel:'#000000',blueprint:'#0b2545'}[t];
 window.THEMES=T})();
