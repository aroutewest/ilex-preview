/* ILEX — L'Interdit · shared site behaviour */
(function(){
  "use strict";
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s, c){ return (c||document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
  var clamp = function(x){ return Math.min(1, Math.max(0, x)); };

  /* ---------- hero entrance ---------- */
  requestAnimationFrame(function(){ document.body.classList.add('arrived'); });

  /* ---------- nav: never inside the first scene, summoned after it ---------- */
  var nav = $('.nav');
  var heroEl = $('.hero');
  var lastY = scrollY;
  var navGate = function(){ return heroEl ? heroEl.offsetHeight - 80 : 160; };
  function navState(){
    if (!nav) return;
    var y = scrollY;
    if (y < navGate()) nav.classList.remove('show');
    else if (y < lastY - 3) nav.classList.add('show');
    else if (y > lastY + 5) nav.classList.remove('show');
    lastY = y;
  }
  addEventListener('scroll', navState, {passive:true});
  addEventListener('pointermove', function(e){
    if (nav && e.clientY < 70 && scrollY > navGate()) nav.classList.add('show');
  }, {passive:true});

  var panier = $('#panier'), panierN = 0;

  /* ---------- reveals ---------- */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  }, {rootMargin:'0px 0px -10% 0px'});
  $$('.rv').forEach(function(el){ io.observe(el); });

  /* ---------- redactions: peek on hold ---------- */
  $$('.redact').forEach(function(r){
    var t = null;
    var peek = function(){ r.classList.add('peek'); };
    var shut = function(){ clearTimeout(t); r.classList.remove('peek'); };
    r.addEventListener('pointerdown', function(ev){ ev.preventDefault(); t = setTimeout(peek, 350); });
    ['pointerup','pointerleave','pointercancel'].forEach(function(evt){ r.addEventListener(evt, shut); });
  });
  /* on the PDP (no scroll choreography) redactions are simply inked */
  if (!$('#dossTrack')) $$('.redact,.bar').forEach(function(r){ r.classList.add('on'); });

  /* ---------- dossier: pinned scene ---------- */
  var dossTrack = $('#dossTrack');
  if (dossTrack){
    var dossHead = $('.doss-head'), dossProse = $('.doss-prose'), dossEx = $('.doss-exhibit');
    var prosePs = $$('.doss-prose p');
    var proseRedacts = $$('.doss-prose .redact');
    var exMarks = $$('.doss-exhibit .bar, .doss-exhibit .redact');
    var exOn = false, redOn = false;
    function dossScroll(){
      var r = dossTrack.getBoundingClientRect();
      var p = clamp(-r.top/(r.height - innerHeight));
      dossHead.classList.toggle('on', p > .02);
      prosePs.forEach(function(el, i){ el.classList.toggle('on', p > .06 + i*.055); });
      if (!redOn && p > .14){ redOn = true;
        proseRedacts.forEach(function(el, i){ setTimeout(function(){ el.classList.add('on'); }, 350 + i*260); });
      }
      var t2 = reduced ? 1 : clamp((p - .42)/.22);
      if (!reduced && innerWidth > 900){
        dossProse.style.transform = 'translateX(' + ((1-t2)*26).toFixed(2) + '%)';
      }
      dossEx.classList.toggle('on', t2 > .1);
      if (!exOn && t2 > .5){ exOn = true;
        exMarks.forEach(function(el, i){ setTimeout(function(){ el.classList.add('on'); }, 200 + i*180); });
      }
    }
    addEventListener('scroll', dossScroll, {passive:true}); dossScroll();
    if (reduced){ dossHead.classList.add('on');
      prosePs.forEach(function(el){ el.classList.add('on'); });
      dossEx.classList.add('on');
      proseRedacts.concat(exMarks).forEach(function(el){ el.classList.add('on'); });
    }
  }

  /* ---------- séparation ---------- */
  var track = $('#sepTrack');
  if (track){
    var sepVal = $('#sepVal'), sepRule = $('#sepRule'), sepHead = $('.sep-head');
    var beats = $$('.sep-beat');
    var fin1 = $('#fin1'), fin2 = $('#fin2');
    var cB = $('#sepCanvas'), cF = $('#sepCanvasF');
    var xB = cB.getContext('2d'), xF = cF.getContext('2d');
    var bubB = [], bubF = [], sepP = 0, sepVisible = false;
    var sizeSep = function(){
      var dpr = Math.min(devicePixelRatio||1, 2);
      [cB, cF].forEach(function(c){
        c.width = c.offsetWidth*dpr; c.height = c.offsetHeight*dpr;
        c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
      });
    };
    sizeSep(); addEventListener('resize', sizeSep);
    var ease = function(t){ return t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; };
    var sepScroll = function(){
      var r = track.getBoundingClientRect();
      var p = clamp(-r.top/(r.height - innerHeight));
      sepP = p;
      /* drain until .62 */
      var d = clamp(p/.62);
      var v = 14.2 - 13.7*ease(d);
      if (d >= .995) v = 0.5;
      sepVal.textContent = v.toFixed(1).replace('.', ',');
      sepRule.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      beats.forEach(function(b, i){
        var at = parseFloat(b.dataset.at);
        var next = beats[i+1] ? parseFloat(beats[i+1].dataset.at) : .56;
        b.classList.toggle('on', p >= at && p < next);
      });
      /* the number takes its leave */
      var out = clamp((p - .64)/.1);
      sepHead.style.transform = 'translateY(' + (-out*46) + 'vh)';
      sepHead.style.opacity = (1 - out);
      /* the finale */
      fin1.classList.toggle('on', p > .78);
      fin2.classList.toggle('on', p > .88);
    };
    addEventListener('scroll', sepScroll, {passive:true}); sepScroll();
    if (reduced){ sepVal.textContent = '0,5'; sepRule.style.transform = 'scaleX(1)'; }
    new IntersectionObserver(function(es){ es.forEach(function(e){ sepVisible = e.isIntersecting; }); }, {threshold:0}).observe(track);

    /* slow bubbles, full width, two depths — nothing flickers */
    var spawnBub = function(w, h, deep){
      return { x: Math.random()*w, y: h + 20 + Math.random()*h*.3,
        vy: (deep ? .08 : .16) + Math.random()*(deep ? .18 : .3),
        vx: (Math.random()-.5)*.08,
        r: deep ? (3 + Math.random()*6) : (1.4 + Math.random()*3.2),
        life: 0, max: 900 + Math.random()*700, deep: deep };
    };
    var drawBubs = function(ctx, arr, w, h, want, deep, intensity){
      ctx.clearRect(0,0,w,h);
      while (arr.length < want) arr.push(spawnBub(w,h,deep));
      for (var i = arr.length-1; i >= 0; i--){
        var p = arr[i];
        p.life++; p.y -= p.vy; p.x += p.vx + Math.sin((p.life + p.x)*.004)*.15;
        if (p.life > p.max || p.y < -30){ arr.splice(i,1); continue; }
        var a = Math.min(1, p.life/220) * Math.min(1, (p.max-p.life)/220)
              * (deep ? .10 : .16) * (intensity*.75 + .25);
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(233,222,196,1)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = a*1.3;
        ctx.strokeStyle = 'rgba(240,230,206,1)'; ctx.lineWidth = .7;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, -2.4, -.9); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    var sepLoop = function(){
      requestAnimationFrame(sepLoop);
      if (reduced || !sepVisible) return;
      var w = cB.offsetWidth, h = cB.offsetHeight;
      var intensity = Math.max(Math.sin(Math.min(sepP,1)*Math.PI), sepP > .5 ? .5 : 0);
      drawBubs(xB, bubB, w, h, Math.floor(34*intensity + 6), true, intensity);
      drawBubs(xF, bubF, w, h, Math.floor(26*intensity + 4), false, intensity);
    };
    sepLoop();
  }

  /* ---------- register data (shared) — 6 600 bottles ---------- */
  var COLS=110, ROWS=60, TOTAL=6600;
  var reserved = new Uint8Array(TOTAL);
  var mulberry = function(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0;
    var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296; }; };
  var rnd = mulberry(20231107);
  for (var i=0;i<400;i++) reserved[i]=1;                    /* la part du chai */
  var c2=0; while(c2<60){ var k=400+Math.floor(rnd()*6200); if(!reserved[k]){reserved[k]=1;c2++;} }
  var remaining = TOTAL; for (var j=0;j<TOTAL;j++) if(reserved[j]) remaining--;
  var fmt = function(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' '); };
  var fmtNo = function(n){ var s=String(n+1); while(s.length<4) s='0'+s; return s.slice(0,1)+' '+s.slice(1); };
  var hash = function(n){ var x = Math.sin(n*127.1)*43758.5453; return x - Math.floor(x); };
  $$('.js-remaining').forEach(function(el){ el.textContent = fmt(remaining); });

  /* the count arrives like a ledger being tallied — fast, then one by one */
  var tickEl = $('.reg-count .n');
  if (tickEl){
    tickEl.textContent = '0';
    var ticked = false;
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting || ticked) return;
        ticked = true;
        if (reduced){ tickEl.textContent = fmt(remaining); return; }
        var t0 = performance.now(), DUR = 3500;
        var tick = function(ts){
          var p = Math.min(1, (ts - t0)/DUR);
          var eased = 1 - Math.pow(1 - p, 6);
          tickEl.textContent = fmt(Math.round(remaining*eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, {threshold:.6}).observe(tickEl);
  }

  /* ---------- register theatre (home) ---------- */
  var theatre = $('#regTheatre');
  if (theatre){
    var regCanvas = $('#regCanvas'), rctx = regCanvas.getContext('2d');
    var regCta = $('#regCta'), stage = $('.reg-stage', theatre), tip = $('#regTip');
    var cell=0, dotR=0, hoverIdx=-1, regP=0, regVisible=false;
    var claretCol='#7C2D2A', inkFaint='rgba(36,33,28,.30)';
    var sizeReg = function(){
      cell = Math.min(innerWidth*.965/COLS, innerHeight*.62/ROWS);
      dotR = Math.max(1, cell*.27);
      var w = cell*COLS, h = cell*ROWS;
      var dpr = Math.min(devicePixelRatio||1, 2);
      regCanvas.style.width = w+'px'; regCanvas.style.height = h+'px';
      regCanvas.width = w*dpr; regCanvas.height = h*dpr;
      rctx.setTransform(dpr,0,0,dpr,0,0);
    };
    var drawReg = function(){
      var w = cell*COLS, h = cell*ROWS;
      rctx.clearRect(0,0,w,h);
      var reveal = reduced ? 1 : clamp(regP*2.4);
      for (var idx=0; idx<TOTAL; idx++){
        /* each mark arrives on its own — scattered, not in a wave */
        var e = clamp((reveal*1.12 - hash(idx))/.09);
        if (e <= 0) continue;
        var col = idx%COLS, row = (idx/COLS)|0;
        var cx = col*cell + cell/2, cy = row*cell + cell/2;
        var r = dotR*(.5 + .5*e);
        if (reserved[idx]){
          rctx.globalAlpha = .95*e;
          rctx.fillStyle = claretCol;
          rctx.beginPath(); rctx.arc(cx,cy,r,0,6.2832); rctx.fill();
        } else {
          rctx.globalAlpha = (idx===hoverIdx ? 1 : .34)*e;
          rctx.strokeStyle = idx===hoverIdx ? claretCol : inkFaint;
          rctx.lineWidth = idx===hoverIdx ? 1.4 : .8;
          rctx.beginPath(); rctx.arc(cx,cy,r,0,6.2832); rctx.stroke();
        }
      }
      rctx.globalAlpha = 1;
    };
    sizeReg(); addEventListener('resize', function(){ sizeReg(); drawReg(); });
    new IntersectionObserver(function(es){ es.forEach(function(e){ regVisible = e.isIntersecting; }); }, {threshold:0}).observe(theatre);
    var easeOutCubic = function(x){ return 1 - Math.pow(1-x,3); };
    var lastReveal = -1;
    function regScroll(){
      var r = theatre.getBoundingClientRect();
      regP = clamp(-r.top/(r.height - innerHeight));
      var pp = clamp((regP - .5)/.24);
      regCta.style.transform = 'translate(-50%,' + (reduced ? 0 : (1-easeOutCubic(pp))*150).toFixed(2) + '%)';
    }
    addEventListener('scroll', regScroll, {passive:true}); regScroll();
    (function regLoop(){
      requestAnimationFrame(regLoop);
      if (!regVisible) return;
      var reveal = reduced ? 1 : clamp(regP*2.4);
      if (Math.abs(reveal - lastReveal) > .002 || hoverIdx !== -2){ drawReg(); lastReveal = reveal; }
    })();
    regCanvas.addEventListener('pointermove', function(e){
      var b = regCanvas.getBoundingClientRect();
      var col = Math.floor((e.clientX-b.left)/cell), row = Math.floor((e.clientY-b.top)/cell);
      var idx = (col>=0&&col<COLS&&row>=0&&row<ROWS) ? row*COLS+col : -1;
      hoverIdx = idx;
      if (idx >= 0){
        var sb = stage.getBoundingClientRect();
        tip.textContent = 'N° ' + fmtNo(idx) + ' — ' + (reserved[idx] ? 'réservé au chai' : 'libre');
        tip.style.left = (e.clientX - sb.left)+'px'; tip.style.top = (e.clientY - sb.top - 14)+'px';
        tip.classList.add('on');
      } else tip.classList.remove('on');
    });
    regCanvas.addEventListener('pointerleave', function(){ hoverIdx=-1; tip.classList.remove('on'); });
    regCanvas.addEventListener('click', function(e){
      var b = regCanvas.getBoundingClientRect();
      var col = Math.floor((e.clientX-b.left)/cell), row = Math.floor((e.clientY-b.top)/cell);
      var idx = row*COLS+col;
      if (idx<0 || idx>=TOTAL || reserved[idx]) return;
      location.href = 'pdp.html?n=' + (idx+1);
    });
  }

  /* ---------- PDP ---------- */
  var buy = $('.buy');
  if (buy){
    var chosenEl = $('#pdpChosen');
    var chips = $$('.numchips button');
    var setNo = function(n){
      chosenEl.textContent = 'N° ' + fmtNo(n-1);
      chips.forEach(function(c){ c.classList.toggle('on', String(c.dataset.n) === String(n)); });
    };
    chips.forEach(function(c){
      c.addEventListener('click', function(){
        if (this.dataset.n === 'clerk'){
          var free = []; for (var i=460;i<TOTAL;i++) if(!reserved[i]) free.push(i+1);
          setNo(free[Math.floor(Math.random()*free.length)]);
          chips.forEach(function(x){ x.classList.remove('on'); });
          this.classList.add('on');
        } else setNo(parseInt(this.dataset.n,10));
      });
    });
    var q = new URLSearchParams(location.search).get('n');
    if (q && +q >= 1 && +q <= TOTAL) setNo(+q);

    /* seal = the claim */
    var seal = $('#sealBtn'), done = $('#sealDone');
    var holdRAF=null, holdStart=0, HOLD=1100;
    var setDeg = function(d){ seal.style.setProperty('--deg', d); };
    var holdLoop = function(ts){
      if (!holdStart) return;
      var p = Math.min(1,(ts-holdStart)/HOLD);
      setDeg(360*p);
      if (p>=1){
        holdStart=0; setDeg(360);
        seal.classList.add('sealed');
        setTimeout(function(){ seal.classList.remove('sealed'); setDeg(0); }, 700);
        done.innerHTML = 'Sealed. ' + chosenEl.textContent + ' is held in your name for twenty minutes. <span class="hand" style="font-size:19px">— le greffier vous attend.</span>';
        done.classList.add('on');
        panierN++; if (panier) panier.textContent = 'Panier (' + panierN + ')';
        return;
      }
      holdRAF = requestAnimationFrame(holdLoop);
    };
    seal.addEventListener('pointerdown', function(e){
      e.preventDefault(); holdStart = performance.now(); holdRAF = requestAnimationFrame(holdLoop);
    });
    ['pointerup','pointerleave','pointercancel'].forEach(function(evt){
      seal.addEventListener(evt, function(){ if(holdStart){ holdStart=0; cancelAnimationFrame(holdRAF); setDeg(0); } });
    });

    /* mini register strip */
    var strip = $('#regStrip');
    if (strip){
      var sx = strip.getContext('2d');
      var sizeStrip = function(){
        var w = strip.offsetWidth, h = 60;
        var dpr = Math.min(devicePixelRatio||1, 2);
        strip.width = w*dpr; strip.height = h*dpr;
        sx.setTransform(dpr,0,0,dpr,0,0);
        var cols = 220, c = Math.min(w/cols, h/30);
        sx.clearRect(0,0,w,h);
        for (var idx=0; idx<TOTAL; idx++){
          var col = idx%cols, row = (idx/cols)|0;
          var cx = col*c + c/2, cy = row*c + c/2;
          if (reserved[idx]){ sx.globalAlpha=.9; sx.fillStyle='#7C2D2A';
            sx.beginPath(); sx.arc(cx,cy,c*.24,0,6.2832); sx.fill(); }
          else { sx.globalAlpha=.35; sx.strokeStyle='rgba(36,33,28,.5)'; sx.lineWidth=.5;
            sx.beginPath(); sx.arc(cx,cy,c*.24,0,6.2832); sx.stroke(); }
        }
        sx.globalAlpha=1;
      };
      sizeStrip(); addEventListener('resize', sizeStrip);
    }
  }
})();
