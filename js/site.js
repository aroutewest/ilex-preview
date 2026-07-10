/* ILEX — L'Interdit · shared site behaviour */
(function(){
  "use strict";
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s, c){ return (c||document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };

  /* ---------- nav ---------- */
  var nav = $('.nav');
  function navState(){ if (nav) nav.classList.toggle('solid', scrollY > 8); }
  addEventListener('scroll', navState, {passive:true}); navState();

  var panier = $('#panier'), panierN = 0;

  /* ---------- reveals ---------- */
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  }, {rootMargin:'0px 0px -10% 0px'});
  $$('.rv').forEach(function(el){ io.observe(el); });

  /* ---------- hero parallax ---------- */
  var hero = $('.hero');
  if (hero && !reduced){
    var planes = $$('[data-depth]', hero);
    var px=0, py=0, tx=0, ty=0, ticking=false;
    var paint = function(){
      ticking = false;
      px += (tx-px)*.06; py += (ty-py)*.06;
      var sy = Math.min(scrollY, innerHeight);
      planes.forEach(function(el){
        var d = parseFloat(el.dataset.depth);
        el.style.transform = 'translate3d(' + (px*24*(1-d)).toFixed(2) + 'px,' +
          (py*16*(1-d) - sy*(1-d)*.45).toFixed(2) + 'px,0)' + (el.dataset.base ? ' ' + el.dataset.base : '');
      });
      if (Math.abs(tx-px)>.001 || Math.abs(ty-py)>.001) req();
    };
    var req = function(){ if(!ticking){ ticking=true; requestAnimationFrame(paint);} };
    addEventListener('pointermove', function(e){
      tx = (e.clientX/innerWidth - .5)*2; ty = (e.clientY/innerHeight - .5)*2; req();
    }, {passive:true});
    addEventListener('scroll', req, {passive:true});
    req();
  }

  /* ---------- redactions ---------- */
  $$('.redact').forEach(function(r){
    var t = null;
    var peek = function(){ r.classList.add('peek'); };
    var shut = function(){ clearTimeout(t); r.classList.remove('peek'); };
    r.addEventListener('pointerdown', function(ev){ ev.preventDefault(); t = setTimeout(peek, 350); });
    ['pointerup','pointerleave','pointercancel'].forEach(function(evt){ r.addEventListener(evt, shut); });
  });

  /* ---------- séparation (home) ---------- */
  var track = $('#sepTrack');
  if (track){
    var sepVal = $('#sepVal'), sepRule = $('#sepRule');
    var beats = $$('.sep-beat');
    var cB = $('#sepCanvas'), cF = $('#sepCanvasF');
    var xB = cB.getContext('2d'), xF = cF.getContext('2d');
    var parts = [], partsB = [], sepP = 0, sepVisible = false;
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
      var p = Math.min(1, Math.max(0, -r.top/(r.height - innerHeight)));
      sepP = p;
      var v = 14.2 - 13.7*ease(p);
      if (p >= .995) v = 0.5;
      sepVal.textContent = v.toFixed(1).replace('.', ',');
      sepRule.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      beats.forEach(function(b, i){
        var at = parseFloat(b.dataset.at);
        var next = beats[i+1] ? parseFloat(beats[i+1].dataset.at) : 1.01;
        b.classList.toggle('on', p >= at && p < next);
      });
    };
    addEventListener('scroll', sepScroll, {passive:true}); sepScroll();
    if (reduced){ sepVal.textContent = '0,5'; sepRule.style.transform = 'scaleX(1)';
      beats.forEach(function(b, i){ b.classList.toggle('on', i === beats.length-1); }); }
    new IntersectionObserver(function(es){ es.forEach(function(e){ sepVisible = e.isIntersecting; }); }, {threshold:0}).observe(track);
    var spawn = function(w, h){
      return { x: w*.5 + (Math.random()-.5)*w*.36, y: h*.62 + Math.random()*h*.2,
        vy: .35 + Math.random()*.9, vx: (Math.random()-.5)*.22, r: .6 + Math.random()*1.7,
        life: 0, max: 240 + Math.random()*260 };
    };
    var spawnB = function(w, h){
      return { x: w*.5 + (Math.random()-.5)*w*.7, y: h*.7 + Math.random()*h*.28,
        vy: .1 + Math.random()*.3, vx: (Math.random()-.5)*.12, r: 2.6 + Math.random()*6,
        life: 0, max: 420 + Math.random()*420 };
    };
    var sepLoop = function(){
      requestAnimationFrame(sepLoop);
      if (reduced || !sepVisible) return;
      var w = cB.offsetWidth, h = cB.offsetHeight;
      var intensity = Math.max(0, Math.sin(Math.min(sepP,1)*Math.PI));
      xB.clearRect(0,0,w,h);
      var wantB = Math.floor(48*intensity);
      while (partsB.length < wantB) partsB.push(spawnB(w,h));
      partsB = partsB.filter(function(p){ return p.life < p.max && p.y > -30; });
      partsB.forEach(function(p){
        p.life++; p.y -= p.vy; p.x += p.vx + Math.sin((p.life+p.x)*.006)*.22;
        var a = Math.min(1, p.life/90) * (1 - p.life/p.max) * .12 * (intensity*.8+.2);
        xB.globalAlpha = a; xB.fillStyle = 'rgba(233,222,196,1)';
        xB.beginPath(); xB.arc(p.x, p.y, p.r, 0, 6.2832); xB.fill();
        xB.globalAlpha = a*1.4; xB.strokeStyle = 'rgba(240,230,206,1)'; xB.lineWidth = .8;
        xB.beginPath(); xB.arc(p.x, p.y, p.r, -2.4, -.9); xB.stroke();
      });
      xB.globalAlpha = 1;
      xF.clearRect(0,0,w,h);
      var want = Math.floor(120*intensity);
      while (parts.length < want) parts.push(spawn(w,h));
      parts = parts.filter(function(p){ return p.life < p.max && p.y > -20; });
      xF.fillStyle = 'rgba(233,222,196,1)';
      parts.forEach(function(p){
        p.life++; p.y -= p.vy; p.x += p.vx + Math.sin((p.life+p.y)*.012)*.3;
        var a = Math.min(1, p.life/40) * (1 - p.life/p.max) * .5 * (intensity*.85+.15);
        xF.globalAlpha = a;
        xF.beginPath(); xF.arc(p.x, p.y, p.r, 0, 6.2832); xF.fill();
      });
      xF.globalAlpha = 1;
    };
    sepLoop();
  }

  /* ---------- register data (shared) ---------- */
  var COLS=100, ROWS=40, TOTAL=4000;
  var claimed = new Uint8Array(TOTAL);
  var mulberry = function(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0;
    var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296; }; };
  var rnd = mulberry(20231107);
  for (var i=0;i<1200;i++) claimed[i]=1;
  var c2=0; while(c2<340){ var k=1200+Math.floor(rnd()*1200); if(!claimed[k]){claimed[k]=1;c2++;} }
  var c3=0; while(c3<43){ var k2=2400+Math.floor(rnd()*1600); if(!claimed[k2]){claimed[k2]=1;c3++;} }
  var remaining = TOTAL; for (var j=0;j<TOTAL;j++) if(claimed[j]) remaining--;
  var fmt = function(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' '); };
  var fmtNo = function(n){ var s=String(n+1); while(s.length<4) s='0'+s; return s.slice(0,1)+' '+s.slice(1); };
  $$('.js-remaining').forEach(function(el){ el.textContent = fmt(remaining); });

  /* ---------- register theatre (home) ---------- */
  var theatre = $('#regTheatre');
  if (theatre){
    var regCanvas = $('#regCanvas'), rctx = regCanvas.getContext('2d');
    var regCta = $('#regCta'), stage = $('.reg-stage', theatre), tip = $('#regTip');
    var cell=0, dotR=0, hoverIdx=-1, regP=0, regVisible=false;
    var claretCol='#7C2D2A', inkFaint='rgba(36,33,28,.30)';
    var sizeReg = function(){
      cell = Math.min(innerWidth*.965/COLS, innerHeight*.56/ROWS);
      dotR = Math.max(1.1, cell*.27);
      var w = cell*COLS, h = cell*ROWS;
      var dpr = Math.min(devicePixelRatio||1, 2);
      regCanvas.style.width = w+'px'; regCanvas.style.height = h+'px';
      regCanvas.width = w*dpr; regCanvas.height = h*dpr;
      rctx.setTransform(dpr,0,0,dpr,0,0);
    };
    var drawReg = function(t){
      var w = cell*COLS, h = cell*ROWS;
      rctx.clearRect(0,0,w,h);
      var reveal = reduced ? 1 : Math.min(1, regP*2.6);
      for (var idx=0; idx<TOTAL; idx++){
        var col = idx%COLS, row = (idx/COLS)|0;
        var frontier = reveal*(ROWS+4) + Math.sin(col*.33)*1.6 - 2.5;
        var edge = frontier - row;
        if (edge <= 0) continue;
        edge = edge < 1.4 ? edge/1.4 : 1;
        var cx = col*cell + cell/2, cy = row*cell + cell/2;
        if (claimed[idx]){
          rctx.globalAlpha = .95*edge; rctx.fillStyle = claretCol;
          rctx.beginPath(); rctx.arc(cx,cy,dotR,0,6.2832); rctx.fill();
        } else {
          var shimmer = reduced ? 0 : Math.sin(t*.0011 + idx*.617)*.10;
          rctx.globalAlpha = (idx===hoverIdx ? 1 : (.34 + shimmer)) * edge;
          rctx.strokeStyle = idx===hoverIdx ? claretCol : inkFaint;
          rctx.lineWidth = idx===hoverIdx ? 1.4 : .8;
          rctx.beginPath(); rctx.arc(cx,cy,dotR,0,6.2832); rctx.stroke();
        }
      }
      rctx.globalAlpha = 1;
    };
    sizeReg(); addEventListener('resize', sizeReg);
    new IntersectionObserver(function(es){ es.forEach(function(e){ regVisible = e.isIntersecting; }); }, {threshold:0}).observe(theatre);
    var easeOutCubic = function(x){ return 1 - Math.pow(1-x,3); };
    var regScroll = function(){
      var r = theatre.getBoundingClientRect();
      regP = Math.min(1, Math.max(0, -r.top/(r.height - innerHeight)));
      var pp = Math.min(1, Math.max(0, (regP - .48)/.26));
      regCta.style.transform = 'translate(-50%,' + (reduced ? 0 : (1-easeOutCubic(pp))*150).toFixed(2) + '%)';
    };
    addEventListener('scroll', regScroll, {passive:true}); regScroll();
    (function regLoop(ts){ requestAnimationFrame(regLoop); if (regVisible) drawReg(ts||0); })(0);
    regCanvas.addEventListener('pointermove', function(e){
      var b = regCanvas.getBoundingClientRect();
      var col = Math.floor((e.clientX-b.left)/cell), row = Math.floor((e.clientY-b.top)/cell);
      var idx = (col>=0&&col<COLS&&row>=0&&row<ROWS) ? row*COLS+col : -1;
      hoverIdx = idx;
      if (idx >= 0){
        var sb = stage.getBoundingClientRect();
        tip.textContent = 'N° ' + fmtNo(idx) + ' — ' + (claimed[idx] ? 'inscribed' : 'libre');
        tip.style.left = (e.clientX - sb.left)+'px'; tip.style.top = (e.clientY - sb.top - 14)+'px';
        tip.classList.add('on');
      } else tip.classList.remove('on');
    });
    regCanvas.addEventListener('pointerleave', function(){ hoverIdx=-1; tip.classList.remove('on'); });
    regCanvas.addEventListener('click', function(e){
      var b = regCanvas.getBoundingClientRect();
      var col = Math.floor((e.clientX-b.left)/cell), row = Math.floor((e.clientY-b.top)/cell);
      var idx = row*COLS+col;
      if (idx<0 || idx>=TOTAL || claimed[idx]) return;
      location.href = 'pdp.html?n=' + (idx+1);
    });
  }

  /* ---------- PDP ---------- */
  var buy = $('.buy');
  if (buy){
    var chosenEl = $('#pdpChosen');
    var chips = $$('.numchips button');
    var setNo = function(n, label){
      chosenEl.textContent = label || ('N° ' + fmtNo(n-1));
      chips.forEach(function(c){ c.classList.toggle('on', String(c.dataset.n) === String(n)); });
    };
    chips.forEach(function(c){
      c.addEventListener('click', function(){
        if (this.dataset.n === 'clerk'){
          var free = []; for (var i=2400;i<3600;i++) if(!claimed[i]) free.push(i+1);
          var pick = free[Math.floor(Math.random()*free.length)];
          setNo(pick);
          chips.forEach(function(x){ x.classList.remove('on'); });
          this.classList.add('on');
        } else setNo(parseInt(this.dataset.n,10));
      });
    });
    var q = new URLSearchParams(location.search).get('n');
    if (q && +q >= 1 && +q <= 4000) setNo(+q);

    /* gallery */
    $$('.thumbs button').forEach(function(b){
      b.addEventListener('click', function(){
        $('.gallery .main img').src = this.dataset.src;
        $$('.thumbs button').forEach(function(x){ x.classList.toggle('on', x===b); });
      });
    });

    /* seal = add to allocation */
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
        done.innerHTML = 'Sealed. ' + chosenEl.textContent + ' is held in your name for twenty minutes. <span class="hand" style="font-size:19px">— le greffier vous attend au greffe.</span>';
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
        var cols = 200, rows = 20, c = Math.min(w/cols, h/rows);
        sx.clearRect(0,0,w,h);
        for (var idx=0; idx<TOTAL; idx++){
          var col = idx%cols, row = (idx/cols)|0;
          var cx = col*c + c/2, cy = row*c + c/2;
          if (claimed[idx]){ sx.globalAlpha=.9; sx.fillStyle='#7C2D2A';
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
