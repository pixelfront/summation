// Mega pass glue: 4A read-aloud button in the card view, 3A burn from the card view.
(()=>{const $=s=>document.querySelector(s),live=$('#live');
SPEAK.bind($('#speak'),()=>VIEWER.data);
$('#cardBurn').addEventListener('click',async()=>{const d=VIEWER.data;if(!d)return;
 if(BURNFX.needsAsk(d)&&!(await BURNFX.ask(d)))return;
 SPEAK.stop('burn');VIEWER.stop();window.scrollTo(0,0);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); /* the card sits above the buttons: bring it into view first */
 await BURNFX.play(window.CARD.card||$('#stage'));STORE.burn(d.id);
 APP.show('box');BOX.rebuild();BOX.initState('open');$('#restore').hidden=!STORE.sampleBurned();
 live.textContent=`${d.sh} burned. ${isSample(d.id)?'Restore samples brings demo cards back.':'It is gone from this phone.'}`});
})();
