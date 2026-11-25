/* 모든 페이지에 공통 헤더·푸터·천 캔버스·전환 막을 넣는다. */
(function () {
  var body = document.body;
  var page = body.dataset.page || '';
  var current = body.dataset.nav || page;

  var nav = [
    { k: 'about', t: '아틀리에', h: 'about.html', sub: [['브랜드 스토리', 'about.html'], ['아틀리에 소식', 'news.html']] },
    { k: 'collection', t: '향수 컬렉션', h: 'collection.html', sub: [['전체 보기', 'collection.html'], ['CITRUS VEIL', 'product.html?p=citrus'], ['WOOD GRAIN', 'product.html?p=wood'], ['PEPPER SILK', 'product.html?p=pepper']] },
    { k: 'class', t: '조향 클래스', h: 'class.html', sub: [['클래스 소개', 'class.html'], ['예약하기', 'class.html#reserve']] },
    { k: 'visit', t: '방문 안내', h: 'visit.html', sub: [['쇼룸 안내', 'visit.html'], ['문의하기', 'visit.html#contact']] }
  ];

  var items = nav.map(function (n) {
    var subs = n.sub.map(function (s) { return '<li><a href="' + s[1] + '">' + s[0] + '</a></li>'; }).join('');
    return '<li class="has-sub"><a href="' + n.h + '"' + (n.k === current ? ' aria-current="page"' : '') + '>' + n.t + '</a><ul class="sub">' + subs + '</ul></li>';
  }).join('');

  var header =
    '<header class="site-header">' +
      '<a class="logo" href="index.html">ATELIER HUE</a>' +
      '<nav class="nav" id="nav" aria-label="주 메뉴"><ul>' + items + '</ul></nav>' +
      '<a class="header-cta" href="class.html#reserve"><span class="header-cta__in">클래스 예약 <span aria-hidden="true">↗</span></span></a>' +
      '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="메뉴 열기"><span></span><span></span></button>' +
    '</header>';

  var footer =
    '<footer class="site-footer"><div class="wrap">' +
      '<div class="site-footer__top">' +
        '<div><a class="logo logo--light" href="index.html">ATELIER HUE</a><p class="site-footer__tag">공기에 남은 결</p></div>' +
        '<div class="site-footer__cols">' +
          '<ul><li class="site-footer__h">탐색</li><li><a href="about.html">아틀리에</a></li><li><a href="collection.html">향수 컬렉션</a></li><li><a href="class.html">조향 클래스</a></li><li><a href="news.html">소식</a></li></ul>' +
          '<ul><li class="site-footer__h">방문</li><li><a href="visit.html">쇼룸 안내</a></li><li><a href="visit.html#contact">문의하기</a></li><li><a href="class.html#reserve">클래스 예약</a></li></ul>' +
        '</div>' +
      '</div>' +
      '<div class="site-footer__bottom"><small>© 2026 ATELIER HUE. All rights reserved.</small>' +
        '<ul><li><a href="visit.html#contact">문의하기</a></li><li><a href="index.html">이용약관</a></li><li><a href="index.html">개인정보처리방침</a></li></ul></div>' +
    '</div></footer>';

  var fromNav = false;
  try { fromNav = sessionStorage.getItem('ah-nav') === '1'; } catch (e) {}
  var curtainOn = page !== 'home' || fromNav;

  body.insertAdjacentHTML('afterbegin',
    '<canvas id="silk" aria-hidden="true"></canvas>' + header);
  // 푸터와 막은 본문이 다 만들어진 뒤(layout-end.js)에 붙인다.
  window.__ahEnd = footer + '<div class="curtain' + (curtainOn ? ' is-on' : '') + '" aria-hidden="true"></div>';
})();
