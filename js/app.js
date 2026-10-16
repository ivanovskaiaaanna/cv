(function () {
  'use strict';

  var C = window.CONTENT;
  var LANGS = ['ru', 'en'];
  var lang = detectLang();
  var openedFromList = false;
  var lastFocus = null;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function detectLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(q) > -1) return q;
    try {
      var s = localStorage.getItem('lang');
      if (LANGS.indexOf(s) > -1) return s;
    } catch (e) {}
    return 'ru';
  }

  function setLang(l) {
    lang = l;
    try { localStorage.setItem('lang', l); } catch (e) {}
    var url = new URL(location.href);
    if (l === 'ru') url.searchParams.delete('lang'); else url.searchParams.set('lang', l);
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    render();
  }

  /* ---------- Главная ---------- */

  function img(src, alt, cls, attrs) {
    return '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async"' +
      (cls ? ' class="' + cls + '"' : '') + (attrs || '') + '>';
  }

  function renderHome() {
    var ui = C.ui[lang], h = C.hero[lang];
    document.documentElement.lang = lang;
    document.title = ui.title;
    $('meta[name="description"]').setAttribute('content', ui.description);

    $$('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      el.textContent = k === 'heroName' ? h.name : ui[k];
    });
    $$('[data-nav]').forEach(function (el) { el.textContent = ui.nav[el.getAttribute('data-nav')]; });
    $$('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    $$('.lang').forEach(function (g) { g.setAttribute('aria-label', ui.langLabel); });
    $('.top__nav').setAttribute('aria-label', ui.navLabel);
    $('#case-close').setAttribute('aria-label', ui.close);

    $('#hero-eyebrow').textContent = h.eyebrow;
    $('#hero-name').innerHTML = h.name.split(' ').map(function (w) { return '<span>' + esc(w) + '</span>'; }).join(' ');
    $('#hero-pos').innerHTML = esc(h.positioning).replace(/\[\[(.+?)\]\]([.,]?)/, function (_, w, p) {
      return '<span class="nowrap"><span class="marked">' + w + '<svg class="oval" aria-hidden="true"><use href="#oval"/></svg></span>' + p + '</span>';
    });
    $('#hero-facts').innerHTML = h.facts.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('<i aria-hidden="true">·</i>');
    $('#hero-note').innerHTML = '<svg class="note__arrow" viewBox="0 0 60 40" aria-hidden="true"><path d="M4 30 C 20 34, 40 26, 52 10 M52 10 L 42 12 M52 10 L 54 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' + esc(ui.note);
    $$('.hero__photo img, .about__photo img').forEach(function (im) { im.alt = h.name; });

    $('#about-text').innerHTML = C.about[lang].map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');

    $('#what-list').innerHTML = C.what.map(function (w, i) {
      var t = w[lang];
      return '<li class="what__item reveal"><span class="mono what__n">' + pad(i + 1) + '</span>' +
        '<h3 class="what__t">' + esc(t.t) + '</h3><p>' + esc(t.d) + '</p></li>';
    }).join('');

    $('#cards').innerHTML = C.cases.map(function (c, i) {
      var t = c.card[lang];
      return '<li class="reveal"><a class="card" href="#' + c.slug + '" data-case="' + c.slug + '">' +
        (c.thumb ? '<span class="card__thumb' + (c.thumbFit ? ' card__thumb--' + c.thumbFit : '') + '">' + img(c.thumb, '').replace('loading="lazy"', 'loading="eager"') + '</span>' : '') +
        '<span class="card__meta"><span class="mono card__n">' + pad(i + 1) + '</span>' +
        (t.period ? '<span class="mono">' + esc(t.period) + '</span>' : '') +
        '<span class="pill">' + esc(t.type) + '</span></span>' +
        '<span class="card__title">' + esc(t.title) + '</span>' +
        '<span class="card__line">' + esc(t.line) + '</span>' +
        '<span class="card__arrow" aria-hidden="true">→</span>' +
        '</a></li>';
    }).join('');

    $('#timeline').innerHTML = C.experience.map(function (e) {
      var t = e[lang];
      return '<li class="tl reveal"><span class="mono tl__when">' + esc(e.when[lang]) + '</span>' +
        '<div class="tl__what"><p>' + (t.b ? '<b>' + esc(t.b) + '</b>' : '') + esc(t.t) + '</p>' +
        (t.list ? '<ul class="tl__list">' + t.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        '</div></li>';
    }).join('');

    $('#tags').innerHTML = C.interests[lang].map(function (t) { return '<li class="pill pill--lg">' + esc(t) + '</li>'; }).join('');

    var ct = C.contact, cl = ui.contactLabels, rows = [];
    rows.push(contactRow(cl.email, ct.email, 'mailto:' + ct.email));
    if (ct.telegram) rows.push(contactRow(cl.telegram, '@' + ct.telegram, 'https://t.me/' + ct.telegram));
    if (ct.phone) rows.push(contactRow(cl.phone, ct.phone[lang], ct.phone.href));
    $('#contact-list').innerHTML = rows.join('');

    $$('img').forEach(watchImg);
    observeReveal();
  }

  function contactRow(label, value, href, noCopy) {
    return '<li class="contact__row"><span class="mono contact__label">' + label + '</span>' +
      '<a class="contact__value" href="' + esc(href) + '"' + (href.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '') + '>' + esc(value).replace('@', '<wbr>@') + '</a>' +
      (noCopy ? '' : '<button type="button" class="btn" data-copy="' + esc(value) + '">' + esc(C.ui[lang].copy) + '</button>') +
      '</li>';
  }

  // Фото, которого ещё нет, не ломает вёрстку: блок скрывается
  function watchImg(im) {
    if (im._watched) return;
    im._watched = true;
    var fail = function () {
      if (im.getAttribute('data-fallback') === 'keep') { im.style.visibility = 'hidden'; return; }
      var box = im.closest('[data-photo]') || im.closest('.card__thumb') || im.closest('figure') || im;
      box.classList.add('is-missing');
    };
    if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) fail();
    im.addEventListener('error', fail);
  }

  /* ---------- Кейс ---------- */

  function caseIndex(slug) {
    for (var i = 0; i < C.cases.length; i++) if (C.cases[i].slug === slug) return i;
    return -1;
  }

  function renderCase(i) {
    var c = C.cases[i], ui = C.ui[lang], t = c.card[lang];
    var n = C.cases.length;
    var prev = C.cases[(i - 1 + n) % n], next = C.cases[(i + 1) % n];

    $('#case-back').textContent = ui.allCases;
    $('#case-close').setAttribute('aria-label', ui.close);
    $('#case-count').textContent = pad(i + 1) + ' / ' + pad(n);

    var h = '';
    h += '<header class="cs-head">';
    h += '<p class="cs-meta">' + (t.period ? '<span class="mono">' + esc(t.period) + '</span>' : '') + '<span class="pill">' + esc(t.type) + '</span></p>';
    h += '<h1 class="cs-title" id="case-title">' + esc(t.title) + '</h1>';
    h += '<p class="cs-line">' + esc(t.line) + '</p>';
    h += '</header>';

    h += '<div class="cs-grid' + (c.facts ? '' : ' cs-grid--single') + '">';
    if (c.facts) h += '<aside class="passport"><dl>' + c.facts[lang].map(function (f) {
      return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
    }).join('') + '</dl></aside>';

    h += '<div class="cs-main">';
    if (c.hero) {
      var heroImg = img(c.hero, t.title);
      h += '<figure class="cs-hero' + (c.heroLink ? ' cs-hero--doc' : '') + (c.heroFit ? ' cs-hero--' + c.heroFit : '') + '" data-photo>' +
        (c.heroLink ? '<a href="' + esc(c.hero) + '" target="_blank" rel="noopener">' + heroImg + '</a>' : heroImg) + '</figure>';
    }

    if (c.intro) h += '<p class="cs-intro">' + esc(c.intro[lang]) + '</p>';
    if (c.board) {
      h += '<div class="board" role="table"><div class="board__row board__row--head" role="row">' +
        ui.board.map(function (x) { return '<span role="columnheader">' + esc(x) + '</span>'; }).join('') + '</div>' +
        c.board.map(function (r) {
          var x = r[lang];
          return '<div class="board__row" role="row"><span class="board__dest" role="cell">' + esc(x[0]) + '</span>' +
            '<span class="board__fmt" role="cell">' + esc(x[1]) + '</span><span class="board__who" role="cell">' + esc(x[2]) + '</span></div>';
        }).join('') + '</div>';
    }
    if (c.brief) h += section(ui.brief, '<p>' + esc(c.brief[lang]) + '</p>');
    if (c.did) h += section(ui.did, '<ul class="list">' + c.did[lang].map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>');
    if (c.outcome) h += section(ui.outcome, '<p class="outcome">' + esc(c.outcome[lang]) + '</p>');

    if (c.budget) {
      var max = Math.max.apply(null, c.budget.map(function (b) { return b.v; }));
      h += section(ui.budget, '<ul class="bars">' + c.budget.map(function (b) {
        return '<li><span class="bars__label">' + esc(b[lang]) + '</span><span class="mono bars__val">' + esc(b.label[lang]) + '</span>' +
          '<span class="bars__track"><span class="bars__fill" style="width:' + (b.v / max * 100).toFixed(1) + '%"></span></span></li>';
      }).join('') + '</ul>' +
      (c.budgetRows ? '<dl class="sums">' + c.budgetRows.map(function (r) {
        return '<div' + (r.total ? ' class="sums__total"' : '') + '><dt>' + esc(r[lang]) + '</dt><dd>' + esc(r.label[lang]) + '</dd></div>';
      }).join('') + '</dl>' : '') +
      (c.budgetNote && c.budgetNote[lang] ? '<p class="sums__note">' + esc(c.budgetNote[lang]) + '</p>' : ''));
    }

    h += '<p class="medium"><span>' + esc(ui.medium) + ' /</span> ' + esc(c.medium[lang]) + '</p>';

    if (c.link) {
      h += '<p class="cs-link"><a class="btn btn--accent" href="' + esc(c.link.href) + '" target="_blank" rel="noopener">' +
        esc(c.link[lang]) + ' <span aria-hidden="true">↗</span></a><span class="mono">' + esc(c.link.note[lang]) + '</span></p>';
    }
    if (c.docs) {
      h += '<div class="docs">' + c.docs.map(function (d) {
        return '<figure class="doc ' + (d.cls || '') + '" data-photo><a href="' + esc(d.src) + '" target="_blank" rel="noopener">' +
          img(d.src, d[lang]) + '</a><figcaption class="mono">' + esc(d[lang]) + '</figcaption></figure>';
      }).join('') + '</div>';
    }

    if (c.beforeAfter) {
      h += '<div class="ba">' + c.beforeAfter.map(function (p, k) {
        return '<figure class="polaroid polaroid--ba ' + (k ? 'is-after' : 'is-before') + '" data-photo>' +
          '<div class="polaroid__img">' + img(p.src, p[lang]) + '</div>' +
          '<figcaption class="note">' + esc(p[lang]) + '</figcaption></figure>' +
          (k === 0 ? '<span class="ba__arrow" aria-hidden="true">→</span>' : '');
      }).join('') + '</div>';
    }

    if (c.film) {
      h += '<div class="film" data-photo><div class="film__strip">' + c.film.map(function (src) {
        return '<div class="film__frame" data-photo>' + img(src, t.title) + '</div>';
      }).join('') + '</div></div>';
    }

    if (c.poster) h += '<figure class="cs-poster" data-photo>' + img(c.poster, t.title) + '</figure>';
    h += '</div></div>';

    h += '<nav class="cs-nav">' +
      '<a href="#' + prev.slug + '" class="cs-nav__link" data-case="' + prev.slug + '" data-replace><span class="mono">← ' + esc(ui.prev) + '</span><b>' + esc(prev.card[lang].title) + '</b></a>' +
      '<a href="#' + next.slug + '" class="cs-nav__link cs-nav__link--next" data-case="' + next.slug + '" data-replace><span class="mono">' + esc(ui.next) + ' →</span><b>' + esc(next.card[lang].title) + '</b></a>' +
      '</nav>';

    $('#case-body').innerHTML = h;
    $$('#case-body img').forEach(watchImg);
  }

  function section(title, body) {
    return '<section class="cs-sec"><h2 class="cs-h">' + esc(title) + '</h2>' + body + '</section>';
  }

  function openCase(slug) {
    var i = caseIndex(slug);
    if (i < 0) return closeCase(true);
    var panel = $('#case');
    var wasOpen = !panel.hidden;
    if (!wasOpen) lastFocus = document.activeElement;
    renderCase(i);
    document.title = C.cases[i].card[lang].title + ' — ' + C.hero[lang].name;
    panel.hidden = false;
    document.documentElement.classList.add('is-locked');
    requestAnimationFrame(function () { panel.classList.add('is-open'); });
    $('#case-scroll').scrollTop = 0;
    if (!wasOpen) $('#case-close').focus({ preventScroll: true });
  }

  function closeCase(silent) {
    var panel = $('#case');
    if (panel.hidden) return;
    panel.classList.remove('is-open');
    document.documentElement.classList.remove('is-locked');
    document.title = C.ui[lang].title;
    var done = function () { panel.hidden = true; };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) done(); else setTimeout(done, 260);
    if (!silent) {
      var target = $('#cases');
      if (target) target.scrollIntoView({ block: 'start' });
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // Закрытие: если пришли со списка — назад по истории, иначе убираем хэш
  function requestClose() {
    if (openedFromList) { openedFromList = false; history.back(); return; }
    history.replaceState(null, '', location.pathname + location.search + '#cases');
    closeCase();
  }

  function route() {
    var slug = decodeURIComponent(location.hash.slice(1));
    if (caseIndex(slug) > -1) openCase(slug);
    else {
      openedFromList = false;
      closeCase(true);
    }
  }

  function render() {
    renderHome();
    var slug = location.hash.slice(1);
    if (caseIndex(slug) > -1 && !$('#case').hidden) openCase(slug);
  }

  /* ---------- События ---------- */

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-case]');
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      var slug = a.getAttribute('data-case');
      if (a.hasAttribute('data-replace')) {
        history.replaceState(null, '', '#' + slug);
      } else {
        history.pushState(null, '', '#' + slug);
        openedFromList = true;
      }
      openCase(slug);
      return;
    }
    var l = e.target.closest('[data-lang]');
    if (l) { setLang(l.getAttribute('data-lang')); return; }

    var cp = e.target.closest('[data-copy]');
    if (cp) { copy(cp.getAttribute('data-copy'), cp); return; }

    if (e.target.closest('.top__name')) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  $('#case-back').addEventListener('click', requestClose);
  $('#case-close').addEventListener('click', requestClose);
  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);

  document.addEventListener('keydown', function (e) {
    if ($('#case').hidden) return;
    if (e.key === 'Escape') requestClose();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      if (/input|textarea/i.test(document.activeElement.tagName)) return;
      var i = caseIndex(location.hash.slice(1)), n = C.cases.length;
      var j = (i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
      history.replaceState(null, '', '#' + C.cases[j].slug);
      openCase(C.cases[j].slug);
    }
  });

  // Свайп: вправо — закрыть; вниз, когда кейс прокручен до верха, — закрыть
  (function swipe() {
    var panel = $('#case'), scroller = $('#case-scroll');
    var x0, y0, dx, dy, atTop, tracking = false, axis = null;
    panel.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      if (e.target.closest('.film')) { tracking = false; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      dx = dy = 0; axis = null; tracking = true;
      atTop = scroller.scrollTop <= 0;
    }, { passive: true });
    panel.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      dx = e.touches[0].clientX - x0; dy = e.touches[0].clientY - y0;
      if (!axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      var shift = 0;
      if (axis === 'x' && dx > 0) shift = dx;
      panel.style.transform = shift ? 'translateX(' + shift + 'px)' : (axis === 'y' && atTop && dy > 0 ? 'translateY(' + dy * 0.5 + 'px)' : '');
    }, { passive: true });
    panel.addEventListener('touchend', function () {
      if (!tracking) return;
      tracking = false;
      panel.style.transform = '';
      if ((axis === 'x' && dx > 90) || (axis === 'y' && atTop && dy > 120)) requestClose();
    });
  })();

  function copy(text, btn) {
    var ok = function () {
      var ui = C.ui[lang];
      btn.textContent = ui.copied;
      btn.classList.add('is-done');
      toast(ui.copied + ': ' + text);
      setTimeout(function () { btn.textContent = ui.copy; btn.classList.remove('is-done'); }, 1800);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text) && ok(); });
    } else if (fallbackCopy(text)) ok();
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var r = false;
    try { r = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return r;
  }
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 1800);
  }

  // Лёгкое появление блоков
  var io = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches
    ? new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px' })
    : null;
  function observeReveal() {
    $$('.reveal').forEach(function (el) { if (io) io.observe(el); else el.classList.add('is-in'); });
  }

  render();
  route();
})();
