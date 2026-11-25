/*
 * ATELIER HUE 인터랙션 (GSAP + ScrollTrigger)
 * 적용한 레퍼런스: R-16 프리로더 / R-12 마스크 텍스트 리빌 / R-03 히어로 패럴랙스
 *                  R-17 스크롤 속도 기울기 / R-08 마그네틱 버튼 / R-05 단어별 하이라이트
 *                  R-11 커버 페이지 전환(어두운 막)
 * 배경의 천은 silk.js 가 담당한다.
 */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.body.dataset.page;
  var header = document.querySelector('.site-header');
  var curtain = document.querySelector('.curtain');
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ---------- 헤더 (모든 환경 공통) ---------- */
  var btn = document.querySelector('.menu-btn');
  function setMenu(open) {
    header.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  }
  btn.addEventListener('click', function () { setMenu(!header.classList.contains('is-open')); });
  $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('scroll', function () { header.classList.toggle('is-solid', window.scrollY > 40); }, { passive: true });
  header.classList.toggle('is-solid', window.scrollY > 40);

  /* ---------- 예약 양식 (데모: 화면에서만 접수 안내) ---------- */
  var form = document.getElementById('reserve-form');
  if (form) {
    var status = form.querySelector('.form__status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      status.textContent = '예약 요청이 접수되었습니다. 영업일 기준 1일 이내에 연락드립니다.';
      form.reset();
    });
  }

  if (reduce || !window.gsap) return;   // 움직임 줄이기: 모든 요소는 처음부터 보인다

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.addEventListener('refresh', function () { window.Silk && Silk.layout(); });

  /* ---------- 페이지 전환: 어두운 막이 올라와 덮고, 다음 페이지에서 걷힌다 (R-11) ---------- */
  var fromNav = false;
  try { fromNav = sessionStorage.getItem('ah-nav') === '1'; sessionStorage.removeItem('ah-nav'); } catch (e) {}

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.protocol !== location.protocol || a.host !== location.host) return;
    if (a.pathname === location.pathname && a.search === location.search) return;   // 같은 페이지 안 이동
    e.preventDefault();
    try { sessionStorage.setItem('ah-nav', '1'); } catch (err) {}
    curtain.classList.add('is-on');
    gsap.fromTo(curtain, { yPercent: 100 }, {
      yPercent: 0, duration: 0.6, ease: 'expo.inOut',
      onComplete: function () { window.location.href = a.href; }
    });
  });
  window.addEventListener('pageshow', function (e) {   // 뒤로가기로 돌아왔을 때 막이 남지 않게
    if (e.persisted) { gsap.set(curtain, { yPercent: 100 }); curtain.classList.remove('is-on'); }
  });

  /* ---------- 등장 연출 ---------- */
  function intro() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('#silk', { opacity: 1, duration: 2.4, ease: 'power1.out' }, 0)
      .to('.site-header', { opacity: 1, duration: 1 }, 0.4);
    if (page === 'home') {
      tl.to('.hero__media img', { opacity: 1, scale: 1, duration: 1.8 }, 0)
        .to('.hero__title .line__in', { y: 0, yPercent: 0, duration: 1.3, stagger: 0.14 }, 0.15);
    } else {
      tl.to('.page-hero .line__in', { y: 0, yPercent: 0, duration: 1.3, stagger: 0.14 }, 0.1)
        .to('[data-hero]', { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, 0.3);
    }
  }

  var pre = document.querySelector('.preloader');
  if (page === 'home' && !fromNav) {
    // 홈 첫 방문: 0→100 프리로더 (R-16)
    var count = document.querySelector('.preloader__count');
    var num = { v: 0 };
    gsap.timeline({ onComplete: function () { pre.style.display = 'none'; } })
      .to(num, {
        v: 100, duration: 0.9, ease: 'power2.inOut',
        onUpdate: function () { count.textContent = String(Math.round(num.v)).padStart(3, '0'); }
      })
      .to('.preloader__logo, .preloader__count', { opacity: 0, duration: 0.25 }, '>0.05')
      .to(pre, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '>-0.05')
      .call(intro, null, '<0.2');
  } else {
    if (pre) pre.style.display = 'none';
    gsap.to(curtain, {
      yPercent: -100, duration: 0.9, delay: 0.1, ease: 'expo.inOut',
      onComplete: function () { curtain.classList.remove('is-on'); }
    });
    gsap.delayedCall(0.3, intro);
  }

  /* ---------- 홈 히어로: 제목이 사진보다 빨리 올라간다 (R-03 변형) ----------
     세로 배치인 좁은 화면에서는 겹치므로 1024px 이상에서만 적용한다. */
  if (document.querySelector('.hero')) {
    gsap.matchMedia().add('(min-width: 1024px)', function () {
      gsap.to('.hero__title', {
        y: -50, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- 섹션 제목: 마스크 리빌 (R-12) ---------- */
  $$('.section-head').forEach(function (head) {
    var tl = gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 85%', once: true } });
    tl.to(head.querySelector('.line__in'), { yPercent: 0, y: 0, duration: 1.1, ease: 'expo.out' })
      .to(head.querySelector('[data-fade]'), { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.75');
  });

  /* ---------- 일반 요소 페이드업 ([data-fade] 중 제목 부속이 아닌 것, [data-reveal]) ---------- */
  ScrollTrigger.batch(plain.concat($$('[data-reveal]')), {
    start: 'top 90%', once: true,
    onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }); }
  });

  /* ---------- 향수 카드: 아래에서 열리듯 등장 ---------- */
  ScrollTrigger.batch('.card', {
    start: 'top 88%', once: true,
    onEnter: function (cards) {
      var media = cards.map(function (c) { return c.querySelector('.card__media'); });
      var imgs = cards.map(function (c) { return c.querySelector('.card__media img'); });
      var body = cards.map(function (c) { return c.querySelector('.card__body'); });
      gsap.to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', stagger: 0.14 });
      gsap.to(imgs, { scale: 1, duration: 1.8, ease: 'expo.out', stagger: 0.14, clearProps: 'transform' });
      gsap.to(body, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.14, delay: 0.35 });
    }
  });

  /* ---------- 소식 목록: 선이 그어지고 내용이 올라옴 ---------- */
  $$('.news__item').forEach(function (item) {
    var tl = gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 90%', once: true } });
    tl.to(item, { '--line-scale': 1, duration: 1.2, ease: 'expo.out' })
      .to(item.querySelector('a'), { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 0.15);
  });

  /* ---------- 방문: 지도 열림 → 핀 떨어짐 → 정보 ---------- */
  var visit = document.querySelector('.visit');
  if (visit) {
    var vt = gsap.timeline({ scrollTrigger: { trigger: visit, start: 'top 85%', once: true } });
    vt.to('.visit__map', { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'expo.out' }, 0)
      .to('.visit__info', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.5);
  }

  /* ---------- 브랜드 선언: 읽는 속도에 맞춰 단어가 진해짐 (R-05) ---------- */
  var st = document.querySelector('.statement');
  if (st) {
    st.innerHTML = st.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    gsap.to('.statement .w', {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 50%', scrub: true }
    });
  }

  /* ---------- 스크롤 속도에 반응하는 미세한 기울기 (R-17, ±1.4°) ---------- */
  if (document.querySelector('.card__media')) {
    var setSkew = gsap.quickSetter('.card__media', 'skewY', 'deg');
    var proxy = { s: 0 };
    ScrollTrigger.create({
      onUpdate: function (self) {
        var s = gsap.utils.clamp(-1.4, 1.4, self.getVelocity() / -600);
        if (Math.abs(s) > Math.abs(proxy.s)) {
          proxy.s = s; setSkew(s);
          gsap.to(proxy, { s: 0, duration: 0.9, ease: 'power3', overwrite: true, onUpdate: function () { setSkew(proxy.s); } });
        }
      }
    });
  }

  /* ---------- 마그네틱 "클래스 예약" 버튼 (R-08, 마우스 기기만) ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cta = document.querySelector('.header-cta');
    var inner = cta.querySelector('.header-cta__in');
    var xTo = gsap.quickTo(inner, 'x', { duration: 0.5, ease: 'power3' });
    var yTo = gsap.quickTo(inner, 'y', { duration: 0.5, ease: 'power3' });
    cta.addEventListener('pointermove', function (e) {
      var r = cta.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    cta.addEventListener('pointerleave', function () { gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: true }); });
  }
})();
