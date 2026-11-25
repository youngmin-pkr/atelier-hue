/*
 * 흐르는 천 배경
 * - 천 사진(img/cloth-1~3.webp) 여러 장이 페이지 전체에 걸쳐 이어 붙어 있다.
 * - 스크롤하면 콘텐츠보다 느리게 따라오고(깊이감), 빠르게 스크롤하면 출렁이며,
 *   가만히 있어도 아주 천천히 일렁인다.
 * - "움직임 줄이기" 설정이면 일렁임과 출렁임 없이 스크롤 위치에 맞춰 놓이기만 한다.
 */
(function () {
  var root = document.getElementById('silk');
  if (!root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 이미지별 가로세로 비율(높이/너비)과 따라오는 정도(k가 클수록 더 느리게 보인다)
  var CLOTH = [
    { src: 'img/cloth-1.webp', ratio: 850 / 1920, k: 0.16 },
    { src: 'img/cloth-2.webp', ratio: 1250 / 1920, k: 0.1 },
    { src: 'img/cloth-3.webp', ratio: 815 / 1920, k: 0.2 }
  ];

  var VH = 0, layers = [];
  var S = { scroll: 0, last: 0, vel: 0, t: 0 };

  function layout() {
    var W = window.innerWidth;
    VH = window.innerHeight;
    var docH = document.documentElement.scrollHeight;
    var hero = document.querySelector('.hero, .page-hero');
    var heroBottom = hero ? hero.offsetTop + hero.offsetHeight : VH;

    root.innerHTML = '';
    layers = [];
    var width = Math.max(W * 1.1, 960);                // 화면보다 넓게 깔아 일렁여도 가장자리가 안 보이게
    var top = heroBottom - Math.min(220, width * 0.15);
    var i = 0;
    while (top < docH && i < 24) {
      var c = CLOTH[i % CLOTH.length];
      var h = width * c.ratio;
      var img = new Image();
      img.className = 'silk__layer';
      img.alt = '';
      img.decoding = 'async';
      img.src = c.src;
      img.style.width = width + 'px';
      img.style.height = h + 'px';
      img.style.top = top + 'px';
      img.style.left = ((W - width) / 2) + 'px';
      root.appendChild(img);
      layers.push({
        el: img, center: top + h / 2, h: h, k: c.k,
        flip: Math.floor(i / CLOTH.length) % 2 ? -1 : 1,   // 두 번째 바퀴는 좌우를 뒤집어 단조롭지 않게
        ph: i * 1.7
      });
      top += h * 0.82 + 60;
      i++;
    }
    draw();
  }

  function draw() {
    var t = S.t, v = S.vel;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      var y = L.k * (S.scroll + VH / 2 - L.center);          // 콘텐츠보다 느리게 따라옴
      var screenY = L.center + y - S.scroll;                 // 화면에서의 중심 위치
      var vis = Math.abs(screenY - VH / 2) < VH / 2 + L.h / 2 + 40;
      if (!vis) { if (!L.hidden) { L.el.style.visibility = 'hidden'; L.hidden = true; } continue; }
      if (L.hidden) { L.el.style.visibility = ''; L.hidden = false; }
      var x = 0, rot = 0, sy = 1, skew = 0;
      if (!reduce) {
        x = 22 * Math.sin(t * 0.22 + L.ph) + v * 0.9 * Math.sin(t * 1.4 + L.ph);   // 좌우 일렁임 + 스크롤 출렁임
        y += 10 * Math.sin(t * 0.17 + L.ph * 1.3);
        rot = 0.5 * Math.sin(t * 0.13 + L.ph);
        sy = 1 + 0.025 * Math.sin(t * 0.19 + L.ph) + Math.min(Math.abs(v), 60) * 0.0006;
        skew = v * 0.05;
      }
      L.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(3) +
        'deg) skewX(' + skew.toFixed(2) + 'deg) scale(' + L.flip + ',' + sy.toFixed(4) + ')';
    }
  }

  function readScroll() { S.scroll = window.pageYOffset || document.documentElement.scrollTop || 0; }

  if (reduce) {
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
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150); });
  window.addEventListener('load', layout);
  readScroll(); S.last = S.scroll;
  layout();

  window.Silk = { layout: layout };
})();
