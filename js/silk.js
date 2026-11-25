/*
 * 번지는 향의 결 (Canvas 2D)
 * - 향 줄기는 "문서 좌표"에 그려진 긴 흐름이라 페이지와 함께 이어진다.
 * - 옅은 안개 + 가는 선 수십 가닥이 각자 다른 속도로 위로 피어올라 연기 같은 흐름이 된다.
 * - 스크롤 위치 → 흐름이 이동, 스크롤 속도 → 출렁임, 가만히 있어도 천천히 피어오른다.
 */
(function () {
  var canvas = document.getElementById('silk');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PARALLAX = 0.88;          // 1보다 작으면 콘텐츠보다 느리게 움직여 "뒤에 있는" 느낌
  var STEP = 8;                 // 세로 샘플 간격(px)
  var W = 0, VH = 0, ribbons = [];
  var S = { scroll: 0, last: 0, vel: 0, t: reduce ? 3 : 0 };
  var buf = { cx: [], hw: [], yd: [] };

  function layout() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    VH = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(VH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var docH = document.documentElement.scrollHeight;
    var hero = document.querySelector('.hero, .page-hero');
    var heroBottom = hero ? hero.offsetTop + hero.offsetHeight : VH;
    var news = document.getElementById('news');
    var newsTop = news ? news.offsetTop : docH * 0.55;

    var y0a = heroBottom * 0.6;
    var y0b = newsTop - 360;
    ribbons = [
      // 뒤쪽: 가늘고 연한 천 (오른쪽 → 왼쪽)
      { y0: y0b, span: docH - y0b, dir: -1, seed: 2.3, w: 0.08, a: 0.75, strands: makeStrands(16, 2.3) },
      // 앞쪽: 주인공 천 (왼쪽 → 오른쪽)
      { y0: y0a, span: docH - y0a, dir: 1, seed: 0, w: 0.12, a: 1, strands: makeStrands(24, 0) }
    ];
    draw();
  }

  // 가는 결 하나하나의 성격(굵기·물결 빈도·속도)을 미리 정해 둔다
  function makeStrands(n, seed) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var h = function (m) { var v = Math.sin((i + 1) * m + seed * 7.1) * 43758.5453; return v - Math.floor(v); };
      out.push({
        u: (i / (n - 1)) * 2 - 1,        // 몸통 안에서의 가로 위치
        amp: 0.25 + 0.75 * h(12.9),      // 일렁임 크기
        f: 0.0045 + 0.007 * h(78.2),     // 물결 촘촘함
        sp: 0.5 + 0.9 * h(37.7),         // 흐르는 속도
        ph: h(93.3) * 6.283,
        w: 0.8 + 1.4 * h(51.1),          // 선 굵기
        warm: h(19.7) > 0.72             // 가끔 따뜻한 호박빛 결
      });
    }
    return out;
  }

  function ribbonGeometry(r, startY, count, T) {
    var wBase = Math.max(W, 520) * r.w;
    for (var k = 0; k < count; k++) {
      var sy = startY + k * STEP;
      var yd = sy + S.scroll * PARALLAX;
      var t = Math.min(Math.max((yd - r.y0) / r.span, 0), 1.15);
      var e = 0.5 - 0.5 * Math.cos(Math.min(t, 1) * Math.PI);
      var base = r.dir > 0 ? 0.06 + 0.88 * e : 0.94 - 0.88 * e;
      var wob = 0.07 * Math.sin(t * Math.PI * 2.2 + r.seed + T * 0.5) +
                0.025 * Math.sin(t * Math.PI * 5.5 + r.seed * 2 + T * 0.8);
      var sway = S.vel * 0.9 * Math.sin(yd * 0.006 + T * 2 + r.seed);
      buf.cx[k] = W * (base + wob) + sway;
      // 향이 퍼지듯 아래로 갈수록 폭이 넓어졌다 좁아진다
      buf.hw[k] = wBase * (0.7 + 0.3 * Math.sin(t * Math.PI * 2.6 + r.seed));
      buf.yd[k] = yd;
    }
  }

  function drawRibbon(r, T) {
    var ys0 = r.y0 - S.scroll * PARALLAX;
    if (ys0 > VH + 20) return;
    var startY = Math.max(-STEP, ys0);
    var count = Math.ceil((VH + STEP - startY) / STEP) + 1;
    if (count < 2) return;
    ribbonGeometry(r, startY, count, T);

    // 시작 지점에서 서서히 나타나도록 세로 그라데이션 알파
    function grad(rgb, a) {
      var g = ctx.createLinearGradient(0, ys0, 0, ys0 + 340);
      g.addColorStop(0, 'rgba(' + rgb + ',0)');
      g.addColorStop(1, 'rgba(' + rgb + ',' + (a * r.a) + ')');
      return g;
    }
    var gHaze = grad('150,155,162', 0.05);
    var gGray = grad('90,94,102', 0.13);
    var gWhite = grad('255,255,255', 0.6);
    var gWarm = grad('176,150,112', 0.2);

    function xAt(k, s) {
      var y = buf.yd[k];
      // 결마다 다른 속도로 위로 흐르는 물결: 연기가 피어오르는 느낌
      var curl = s.amp * Math.sin(y * s.f + T * s.sp * 1.7 + s.ph) +
                 0.35 * s.amp * Math.sin(y * s.f * 2.3 - T * s.sp + s.ph * 2);
      return buf.cx[k] + buf.hw[k] * (s.u * 0.6 + curl * 0.55);
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 1) 번지는 안개: 굵고 아주 옅은 선을 몇 겹 겹친다
    var hazeW = [44, 26, 12];
    for (var h = 0; h < hazeW.length; h++) {
      ctx.beginPath();
      for (var k = 0; k < count; k++) {
        var hx = buf.cx[k] + buf.hw[k] * 0.35 * Math.sin(buf.yd[k] * 0.004 + T * 0.9 + h + r.seed);
        if (k === 0) ctx.moveTo(hx, startY); else ctx.lineTo(hx, startY + k * STEP);
      }
      ctx.strokeStyle = gHaze;
      ctx.lineWidth = hazeW[h] * (Math.max(W, 520) / 1200 + 0.4);
      ctx.stroke();
    }

    // 2) 향의 결: 가는 선 여러 가닥
    for (var i = 0; i < r.strands.length; i++) {
      var s = r.strands[i];
      ctx.beginPath();
      for (k = 0; k < count; k++) {
        var yy = startY + k * STEP;
        if (k === 0) ctx.moveTo(xAt(k, s), yy); else ctx.lineTo(xAt(k, s), yy);
      }
      ctx.strokeStyle = s.warm ? gWarm : (i % 3 === 0 ? gWhite : gGray);
      ctx.lineWidth = s.w;
      ctx.stroke();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, VH);
    var T = S.t * 0.35 + S.scroll * 0.0012;
    for (var i = 0; i < ribbons.length; i++) drawRibbon(ribbons[i], T);
  }

  // ---- 구동 ----
  function readScroll() { S.scroll = window.pageYOffset || document.documentElement.scrollTop || 0; }

  if (reduce) {
    // 움직임 줄이기: 고정된 형태만, 스크롤 위치에 맞춰 다시 그릴 뿐
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; readScroll(); draw(); });
    }, { passive: true });
  } else {
    gsap.ticker.add(function (time, dt) {
      readScroll();
      var delta = S.scroll - S.last;
      S.last = S.scroll;
      S.vel += (Math.max(-60, Math.min(60, delta)) - S.vel) * 0.1;   // 부드럽게 따라가는 속도값
      S.t += dt / 1000;
      draw();
    });
  }

  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 120); });
  window.addEventListener('load', layout);
  readScroll(); S.last = S.scroll;
  layout();

  window.Silk = { layout: layout };
})();
