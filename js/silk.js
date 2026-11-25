/*
 * 흩날리는 천 (Canvas 2D)
 * - 천은 "문서 좌표"에 그려진 긴 리본이라 페이지와 함께 이어진다.
 * - 가는 선(strand) 수십 개를 비틀어 겹치면 비단결 같은 접힘이 생긴다.
 * - 스크롤 위치 → 접힘이 이동, 스크롤 속도 → 천이 출렁임, 가만히 있어도 아주 느리게 흐른다.
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
  var buf = { cx: [], hw: [], tw: [], yd: [] };

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
      { y0: y0b, span: docH - y0b, dir: -1, seed: 2.3, w: 0.075, n: 18, a: 0.75, tf: 1.25 },
      // 앞쪽: 주인공 천 (왼쪽 → 오른쪽)
      { y0: y0a, span: docH - y0a, dir: 1, seed: 0, w: 0.115, n: 30, a: 1, tf: 1 }
    ];
    draw();
  }

  function ribbonGeometry(r, startY, count, T) {
    var wBase = Math.max(W, 520) * r.w;
    for (var k = 0; k < count; k++) {
      var sy = startY + k * STEP;
      var yd = sy + S.scroll * PARALLAX;
      var t = Math.min(Math.max((yd - r.y0) / r.span, 0), 1.15);
      var e = 0.5 - 0.5 * Math.cos(Math.min(t, 1) * Math.PI);
      var base = r.dir > 0 ? 0.06 + 0.88 * e : 0.94 - 0.88 * e;
      var wob = 0.085 * Math.sin(t * Math.PI * 2.4 + r.seed + T * 0.6) +
                0.03 * Math.sin(t * Math.PI * 6 + r.seed * 2 - T);
      var sway = S.vel * 0.9 * Math.sin(yd * 0.006 + T * 2 + r.seed);
      buf.cx[k] = W * (base + wob) + sway;
      buf.hw[k] = wBase * (0.62 + 0.38 * Math.sin(t * Math.PI * 3.1 + r.seed + T * 0.4));
      buf.tw[k] = yd * 0.0042 * r.tf + T * 0.9 + r.seed;
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
    var gBody = grad('140,145,152', 0.17);
    var gGray = grad('80,84,92', 0.11);
    var gWhite = grad('255,255,255', 0.55);

    function xAt(k, u) {
      return buf.cx[k] + buf.hw[k] * (u * Math.cos(buf.tw[k]) +
        0.22 * Math.sin(u * 4.2 + buf.yd[k] * 0.012 + T * 1.3 + r.seed));
    }

    // 천의 몸통 (옅은 면)
    ctx.beginPath();
    for (var k = 0; k < count; k++) {
      var y = startY + k * STEP;
      if (k === 0) ctx.moveTo(xAt(k, -1), y); else ctx.lineTo(xAt(k, -1), y);
    }
    for (k = count - 1; k >= 0; k--) ctx.lineTo(xAt(k, 1), startY + k * STEP);
    ctx.closePath();
    ctx.fillStyle = gBody;
    ctx.fill();

    // 비단결: 가는 선 여러 겹
    ctx.lineJoin = 'round';
    for (var i = 0; i < r.n; i++) {
      var u = (i / (r.n - 1)) * 2 - 1;
      var white = i % 4 === 0;
      ctx.beginPath();
      for (k = 0; k < count; k++) {
        var yy = startY + k * STEP;
        if (k === 0) ctx.moveTo(xAt(k, u), yy); else ctx.lineTo(xAt(k, u), yy);
      }
      ctx.strokeStyle = white ? gWhite : gGray;
      ctx.lineWidth = white ? 3 : 2;
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
