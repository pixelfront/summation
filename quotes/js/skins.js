// Layouts milestone: box skins (Terminal / Crate / Cassette). Markup for the back layer (behind cards) and front layer.
// Ported from design mock layouts-v1/js/boxes.js. Terminal keeps the M5 drawer (#bCmd).
window.SKINS={
 terminal:{label:'Terminal',crumb:'B TERMINAL DRAWER',
  back:`<div class="pc b-top"><span class="stencil">QUOTE DECK // TERMINAL</span><i class="b-vent"></i></div>
<div class="pc b-side b-l"></div><div class="pc b-side b-r"></div><div class="pc b-front"><i class="b-slot"></i></div>
<div class="b-drawer"><div class="pc b-tfloor"></div><div class="pc b-tside b-tl"></div><div class="pc b-tside b-tr"></div></div>`,
  front:`<div class="pc b-tfront"><span class="b-led"></span><span class="b-cmd"><span id="bCmd" class="cnt">&gt; DECK_07 </span><i class="b-cur"></i></span><i class="b-pull"></i></div>`},
 crate:{label:'Crate',crumb:'CRATE',
  back:`<div class="pc c-glow"></div><div class="pc c-back c-wall"></div><div class="pc c-side c-l c-wall"></div><div class="pc c-side c-r c-wall"></div>
<div class="pc c-floor"></div><div class="pc c-lid"><span class="stencil">THIS SIDE UP \u25B2</span></div>`,
  front:`<div class="pc c-front c-wall"><svg viewBox="0 0 280 92" preserveAspectRatio="none"><path d="M0 0L280 92M280 0L0 92M0 6h280M0 86h280"/></svg>
<span class="stencil">QUOTE DECK \u25AE CARDS</span><span class="c-no cnt">DECK_07</span></div>`},
 cassette:{label:'Cassette',crumb:'CASSETTE SHELF',
  /* feedback: a wire tape shelf; tapes slide out of it carrying the quote */
  back:`<div class="pc k-beam"></div><div class="pc sh-back"><span class="stencil">QUOTE DECK // TAPE SHELF</span></div>
<div class="pc sh-side sh-l"></div><div class="pc sh-side sh-r"></div>
<div class="pc sh-row sh-r1">${'<i class="sh-sp"></i>'.repeat(9)}</div><div class="pc sh-row sh-r2">${'<i class="sh-sp"></i>'.repeat(9)}</div>
<div class="pc sh-board sh-b1"></div><div class="pc sh-board sh-b2"></div><div class="pc sh-board sh-b3"></div>`,
  front:`<div class="pc sh-lip"><span class="k-eject">EJECT \u25B2 <span class="cnt">07</span></span></div>`}};
