/* 데이터로 채우는 페이지: 향수 상세, 소식 목록, 소식 상세, 다른 향 */
(function () {
  var D = window.AH;
  var params = new URLSearchParams(location.search);
  var $ = function (s) { return document.querySelector(s); };
  var li = function (arr) { return arr.map(function (x) { return '<li>' + x + '</li>'; }).join(''); };

  /* 향수 상세 */
  var root = $('#product-root');
  if (root) {
    var key = params.get('p');
    var p = D.products[key] || D.products.citrus;
    document.title = p.name + ' — ATELIER HUE';
    var others = Object.keys(D.products).filter(function (k) { return k !== p.id; }).map(function (k) {
      var o = D.products[k];
      return '<article class="card" data-reveal><div class="card__media"><img src="' + o.img + '" width="232" height="305" alt="' + o.alt + '"></div>' +
        '<div class="card__body"><p class="card__note">' + o.note + '</p><h3 class="card__name"><a class="card__link" href="product.html?p=' + o.id + '">' + o.name + '</a></h3>' +
        '<p class="card__desc">' + o.tagline + '</p></div></article>';
    }).join('');
    root.innerHTML =
      '<section class="page-hero page-hero--product"><div class="wrap">' +
        '<nav class="crumbs" aria-label="경로" data-hero><a href="index.html">HOME</a><span>/</span><a href="collection.html">향수 컬렉션</a><span>/</span><span aria-current="page">' + p.name + '</span></nav>' +
        '<div class="product">' +
          '<div class="product__media" data-hero><div class="product__frame"><img src="' + p.img + '" width="232" height="305" alt="' + p.alt + '"></div></div>' +
          '<div class="product__info">' +
            '<p class="eyebrow" data-hero>' + p.note + '</p>' +
            '<h1 class="page-title"><span class="line"><span class="line__in">' + p.name + '</span></span></h1>' +
            '<p class="lead" data-hero>' + p.desc + '</p>' +
            '<dl class="spec" data-hero>' +
              '<div><dt>용량</dt><dd>' + p.size + '</dd></div><div><dt>농도</dt><dd>' + p.conc + '</dd></div>' +
              '<div><dt>지속력</dt><dd>' + p.last + '</dd></div><div><dt>가격</dt><dd>' + p.price + '</dd></div>' +
            '</dl>' +
            '<div class="actions" data-hero><a class="btn btn--solid" href="visit.html#contact">시향 문의</a><a class="btn" href="class.html#reserve">이 향으로 클래스 예약</a></div>' +
          '</div>' +
        '</div>' +
      '</div></section>' +
      '<section class="section"><div class="wrap">' +
        '<header class="section-head"><h2><span class="line"><span class="line__in">향의 구조</span></span></h2><p class="section-head__sub" data-fade>NOTES</p></header>' +
        '<ol class="notes">' +
          '<li class="notes__row" data-reveal><span class="notes__label">TOP<small>첫인상 · 0–30분</small></span><ul>' + li(p.top) + '</ul></li>' +
          '<li class="notes__row" data-reveal><span class="notes__label">HEART<small>중심 · 30분–3시간</small></span><ul>' + li(p.heart) + '</ul></li>' +
          '<li class="notes__row" data-reveal><span class="notes__label">BASE<small>잔향 · 3시간 이후</small></span><ul>' + li(p.base) + '</ul></li>' +
        '</ol>' +
      '</div></section>' +
      '<section class="section section--tight"><div class="wrap prose-wrap">' +
        '<header class="section-head"><h2><span class="line"><span class="line__in">향 이야기</span></span></h2><p class="section-head__sub" data-fade>STORY</p></header>' +
        '<div class="prose" data-reveal>' + p.story.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>' +
      '</div></section>' +
      '<section class="section"><div class="wrap">' +
        '<header class="section-head"><h2><span class="line"><span class="line__in">다른 향도 만나보세요</span></span></h2><p class="section-head__sub" data-fade>MORE SCENTS</p></header>' +
        '<div class="cards cards--two">' + others + '</div>' +
      '</div></section>';
  }

  /* 소식 목록 */
  var list = $('#news-list');
  if (list) {
    var limit = parseInt(list.getAttribute('data-limit') || '0', 10);
    var rows = D.news.slice(0, limit || D.news.length).map(function (n, i) {
      return '<li class="news__item"><a href="news-detail.html?n=' + n.id + '">' +
        '<span class="news__no" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="news__main"><span class="news__cat">' + n.cat + '</span><span class="news__title">' + n.title + '</span></span>' +
        '<span class="news__desc">' + n.desc + '</span>' +
        '<time class="news__date" datetime="' + n.iso + '">' + n.date + '</time></a></li>';
    }).join('');
    list.innerHTML = rows;
  }

  /* 소식 상세 */
  var art = $('#news-article');
  if (art) {
    var id = parseInt(params.get('n'), 10) || 1;
    var idx = D.news.findIndex(function (n) { return n.id === id; });
    if (idx < 0) idx = 0;
    var n = D.news[idx], prev = D.news[idx - 1], next = D.news[idx + 1];
    document.title = n.title + ' — ATELIER HUE';
    art.innerHTML =
      '<section class="page-hero"><div class="wrap prose-wrap">' +
        '<nav class="crumbs" aria-label="경로" data-hero><a href="index.html">HOME</a><span>/</span><a href="news.html">소식</a><span>/</span><span aria-current="page">' + n.cat + '</span></nav>' +
        '<p class="eyebrow" data-hero>' + n.cat + ' · <time datetime="' + n.iso + '">' + n.date + '</time></p>' +
        '<h1 class="page-title"><span class="line"><span class="line__in">' + n.title + '</span></span></h1>' +
      '</div></section>' +
      '<section class="section section--tight"><div class="wrap prose-wrap">' +
        '<div class="prose" data-reveal>' + n.body.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>' +
        '<nav class="pager" aria-label="이전 다음 글" data-reveal>' +
          (prev ? '<a href="news-detail.html?n=' + prev.id + '"><small>이전 글</small><span>' + prev.title + '</span></a>' : '<span></span>') +
          (next ? '<a class="pager__next" href="news-detail.html?n=' + next.id + '"><small>다음 글</small><span>' + next.title + '</span></a>' : '<span></span>') +
        '</nav>' +
        '<p class="back" data-reveal><a class="btn" href="news.html">목록으로</a></p>' +
      '</div></section>';
  }
})();
