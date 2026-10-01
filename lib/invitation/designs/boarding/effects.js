/**
 * Effets du design Embarquement. Exécuté après RSVP_SCRIPT, dans l'iframe
 * isolée : ES5, sans dépendance, et entièrement facultatif (chaque bloc
 * vérifie que son élément existe).
 *
 * - Les palettes du tableau sont posées par le script statique (qui tourne
 *   aussi dans les vignettes) ; celui-ci ne fait que les faire claquer. Il
 *   démarre donc après DOMContentLoaded, une fois tous les scripts exécutés.
 * - Un moteur de défilement (requestAnimationFrame) : toutes les positions
 *   sont lues d'abord, puis les styles écrits, et seuls les éléments proches
 *   de l'écran sont recalculés.
 * - Sons (bip, palettes, carillon) : seulement si l'écran d'ouverture les a
 *   préparés pendant le geste de l'invité (window.__bdSound).
 * - La visionneuse du passeport et le tampon de l'enregistrement
 *   fonctionnent aussi avec « réduire les animations ».
 */
export const script = `
(function () {
  var root = document.documentElement;
  var main = document.querySelector('.bd');
  if (!main) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var sound = function (name) { if (window.__bdSound && window.__bdSound[name]) window.__bdSound[name](); };

  // ── Visionneuse du passeport ──────────────────────────
  var shots = document.querySelectorAll('.bd [data-photo]');
  if (shots.length) {
    var urls = [];
    each(shots, function (btn) { urls.push(btn.getAttribute('data-src')); });
    var box = null, img = null, counter = null, current = 0, lastFocus = null;
    var ICON = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    var show = function (i) {
      current = (i + urls.length) % urls.length;
      img.src = urls[current];
      counter.textContent = (current + 1) + ' / ' + urls.length;
    };
    var close = function () {
      if (!box) return;
      box.classList.remove('is-open');
      var closing = box;
      setTimeout(function () { closing.hidden = true; }, reduce ? 0 : 350);
      document.removeEventListener('keydown', onKey);
      if (lastFocus) lastFocus.focus();
    };
    var onKey = function (e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'ArrowLeft') show(current - 1);
    };
    var build = function () {
      box = document.createElement('div');
      box.className = 'bd-lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Photo agrandie');
      box.innerHTML = '<div class="bd-lb-frame"><img class="bd-lb-img" alt="" draggable="false"><p class="bd-lb-count"></p></div>' +
        '<button type="button" class="bd-lb-btn bd-lb-close" aria-label="Fermer">' + ICON('M6 6l12 12M18 6 6 18') + '</button>' +
        (urls.length > 1
          ? '<button type="button" class="bd-lb-btn bd-lb-prev" aria-label="Photo précédente">' + ICON('M15 5l-7 7 7 7') + '</button>' +
            '<button type="button" class="bd-lb-btn bd-lb-next" aria-label="Photo suivante">' + ICON('M9 5l7 7-7 7') + '</button>'
          : '');
      document.body.appendChild(box);
      img = box.querySelector('.bd-lb-img');
      counter = box.querySelector('.bd-lb-count');
      box.querySelector('.bd-lb-close').addEventListener('click', close);
      var prev = box.querySelector('.bd-lb-prev'), next = box.querySelector('.bd-lb-next');
      if (prev) prev.addEventListener('click', function () { show(current - 1); });
      if (next) next.addEventListener('click', function () { show(current + 1); });
      var start = null;
      box.addEventListener('pointerdown', function (e) { start = { x: e.clientX, y: e.clientY, target: e.target }; });
      box.addEventListener('pointerup', function (e) {
        if (!start) return;
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && urls.length > 1) show(current + (dx < 0 ? 1 : -1));
        else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && start.target === box) close();
        start = null;
      });
    };
    each(shots, function (btn, i) {
      btn.addEventListener('click', function () {
        if (!box) build();
        lastFocus = btn;
        box.hidden = false;
        show(i);
        void box.offsetWidth;
        box.classList.add('is-open');
        box.querySelector('.bd-lb-close').focus();
        document.addEventListener('keydown', onKey);
      });
    });
  }

  // ── Enregistrement : le code passe au lecteur, puis le tampon ─
  var checkin = document.querySelector('[data-checkin]');
  if (checkin) {
    if (window.GUEST_DATA && window.GUEST_DATA.rsvp_status) checkin.setAttribute('data-state', window.GUEST_DATA.rsvp_status);
    var stampTimer = null;
    checkin.addEventListener('click', function (e) {
      if (e.target.closest('.rsvp-edit')) checkin.removeAttribute('data-state');
    });
    // Phase de capture : le bouton est encore actif (RSVP_SCRIPT le désactive ensuite).
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-rsvp]');
      if (!btn || btn.disabled || !checkin.contains(btn)) return;
      var status = btn.getAttribute('data-rsvp');
      clearTimeout(stampTimer);
      checkin.removeAttribute('data-state');
      if (reduce) { checkin.setAttribute('data-state', status); return; }
      checkin.classList.remove('is-scanning');
      void checkin.offsetWidth;
      checkin.classList.add('is-scanning');
      sound('beep');
      stampTimer = setTimeout(function () {
        checkin.classList.remove('is-scanning');
        checkin.setAttribute('data-state', status);
      }, 1250);
    }, true);
  }

  if (reduce) return;
  root.classList.add('fx');

  // Texte découpé en éléments animables ; une copie lisible reste pour les
  // lecteurs d'écran.
  function splitText(container, className, unit, varName) {
    var index = 0;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var parts = unit === 'word' ? node.nodeValue.split(/(\\s+)/) : (Array.from ? Array.from(node.nodeValue) : node.nodeValue.split(''));
      var fragment = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\\s+$/.test(part)) { fragment.appendChild(document.createTextNode(part)); return; }
        var span = document.createElement('span');
        span.className = className;
        span.style.setProperty(varName, String(index++));
        span.textContent = part;
        fragment.appendChild(span);
      });
      node.parentNode.replaceChild(fragment, node);
    });
  }
  var announceText = document.querySelector('[data-words]');
  if (announceText) splitText(announceText, 'bd-w', 'word', '--w');
  var skywrite = document.querySelector('[data-skywrite]');
  if (skywrite) {
    var label = skywrite.textContent;
    var copy = document.createElement('span');
    copy.className = 'bd-sr';
    copy.textContent = label;
    var visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.textContent = label;
    skywrite.textContent = '';
    skywrite.appendChild(copy);
    skywrite.appendChild(visual);
    splitText(visual, 'bd-l', 'letter', '--l');
  }

  // ── Moteur de défilement ──────────────────────────────
  var scrubs = [];
  var vh = innerHeight;
  var ticking = false;
  function scrub(el, fn) { if (el) scrubs.push({ el: el, fn: fn }); }
  function frame(all) {
    ticking = false;
    var rects = [], i;
    for (i = 0; i < scrubs.length; i++) rects.push(scrubs[i].el.getBoundingClientRect());
    for (i = 0; i < scrubs.length; i++) {
      var r = rects[i];
      if (all === true || (r.bottom > -vh && r.top < vh * 2)) scrubs[i].fn(r, vh);
    }
    progress();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  // Héro : la photo de la destination défile plus lentement.
  var hero = main.querySelector('.bd-hero');
  var heroBg = main.querySelector('[data-hero-bg]');
  if (hero && heroBg) {
    scrub(hero, function (r) {
      if (r.bottom < 0) return;
      heroBg.style.transform = 'translate3d(0,' + (-r.top * 0.25).toFixed(1) + 'px,0)';
    });
  }

  // Progression du vol, en haut d'écran.
  var bar = main.querySelector('[data-progress]');
  var maxScroll = 1, heroBottom = 0;
  function measure() {
    var y = window.scrollY || window.pageYOffset;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    heroBottom = hero ? hero.getBoundingClientRect().bottom + y : 0;
  }
  function progress() {
    if (!bar) return;
    var y = window.scrollY || window.pageYOffset;
    bar.style.setProperty('--p', clamp(y / maxScroll, 0, 1).toFixed(4));
    bar.classList.toggle('is-shown', y > heroBottom * 0.6);
  }

  // Itinéraire : l'avion suit la route tracée entre les escales.
  var map = document.querySelector('[data-route]');
  var buildRoute = function () {};
  if (map) {
    var path = map.querySelector('[data-route-path]');
    var done = map.querySelector('[data-route-done]');
    var routePlane = map.querySelector('.bd-route-plane');
    var stops = map.querySelectorAll('.bd-stop');
    var dots = map.querySelectorAll('[data-stop]');
    var length = 0, stopAt = [], lastRoute = -1;
    var lengthAtY = function (y) {
      var low = 0, high = length;
      for (var n = 0; n < 24; n++) {
        var mid = (low + high) / 2;
        if (path.getPointAtLength(mid).y < y) low = mid; else high = mid;
      }
      return high;
    };
    buildRoute = function () {
      var box = map.getBoundingClientRect();
      var points = [];
      each(dots, function (dot) {
        var r = dot.getBoundingClientRect();
        points.push({ x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top });
      });
      if (!points.length) return;
      var first = points[0], d = 'M' + first.x.toFixed(1) + ' ' + (first.y - 36).toFixed(1) + 'L' + first.x.toFixed(1) + ' ' + first.y.toFixed(1);
      for (var i = 1; i < points.length; i++) {
        var a = points[i - 1], b = points[i], middle = ((a.y + b.y) / 2).toFixed(1);
        d += 'C' + a.x.toFixed(1) + ' ' + middle + ' ' + b.x.toFixed(1) + ' ' + middle + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
      }
      var last = points[points.length - 1];
      d += 'L' + last.x.toFixed(1) + ' ' + (last.y + 36).toFixed(1);
      path.setAttribute('d', d);
      done.setAttribute('d', d);
      length = path.getTotalLength();
      done.style.strokeDasharray = length.toFixed(1);
      stopAt = points.map(function (point) { return lengthAtY(point.y); });
      lastRoute = -1;
    };
    scrub(map, function (r, h) {
      if (!length) return;
      var p = clamp((h * 0.55 - r.top) / r.height, 0, 1);
      if (Math.abs(p - lastRoute) < 0.0005) return;
      lastRoute = p;
      var at = p * length;
      var point = path.getPointAtLength(at), ahead = path.getPointAtLength(Math.min(length, at + 2));
      if (at + 2 > length) ahead = { x: point.x, y: point.y + 1 };
      var angle = Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180 / Math.PI + 90;
      routePlane.style.transform = 'translate(' + point.x.toFixed(1) + 'px,' + point.y.toFixed(1) + 'px) rotate(' + angle.toFixed(1) + 'deg)';
      done.style.strokeDashoffset = (length - at).toFixed(1);
      each(stops, function (stop, i) { stop.classList.toggle('is-reached', at >= stopAt[i] - 1); });
    });
  }

  // Hublot : le volet se lève.
  var win = document.querySelector('[data-window]');
  if (win) {
    var shade = win.querySelector('.bd-window-shade'), lastShade = -1;
    scrub(win, function (r, h) {
      var v = Math.round(easeInOut(clamp((h * 0.9 - r.top) / (h * 0.6), 0, 1)) * 1000) / 1000;
      if (v === lastShade) return;
      lastShade = v;
      shade.style.transform = 'translateY(' + (-v * 101).toFixed(1) + '%)';
    });
  }

  // Décollage : l'avion monte en laissant sa traînée.
  var takeoff = document.querySelector('[data-takeoff]');
  var buildSky = function () {};
  if (takeoff) {
    var sky = takeoff.querySelector('.bd-sky');
    var trail = takeoff.querySelector('[data-contrail]');
    var skyPlane = takeoff.querySelector('.bd-sky-plane');
    var trailLength = 0, lastSky = -1, written = false;
    // La trajectoire reste dans la moitié haute du ciel : le texte occupe le bas.
    buildSky = function () {
      var w = sky.clientWidth, h = sky.clientHeight;
      trail.setAttribute('d',
        'M' + (-0.06 * w).toFixed(1) + ' ' + (0.5 * h).toFixed(1) +
        'C' + (0.2 * w).toFixed(1) + ' ' + (0.48 * h).toFixed(1) + ' ' + (0.4 * w).toFixed(1) + ' ' + (0.38 * h).toFixed(1) + ' ' + (0.56 * w).toFixed(1) + ' ' + (0.26 * h).toFixed(1) +
        'S' + (0.86 * w).toFixed(1) + ' ' + (0.04 * h).toFixed(1) + ' ' + (1.1 * w).toFixed(1) + ' ' + (-0.02 * h).toFixed(1));
      trailLength = trail.getTotalLength();
      trail.style.strokeDasharray = trailLength.toFixed(1);
      lastSky = -1;
    };
    scrub(takeoff, function (r, h) {
      if (!trailLength) return;
      var p = clamp((h - r.top) / r.height, 0, 1);
      if (Math.abs(p - lastSky) < 0.0005) return;
      lastSky = p;
      var at = p * trailLength;
      var point = trail.getPointAtLength(at), ahead = trail.getPointAtLength(Math.min(trailLength, at + 2));
      var angle = Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180 / Math.PI + 90;
      skyPlane.style.transform = 'translate(' + point.x.toFixed(1) + 'px,' + point.y.toFixed(1) + 'px) rotate(' + angle.toFixed(1) + 'deg) scale(' + (1.35 - 0.8 * p).toFixed(3) + ')';
      trail.style.strokeDashoffset = (trailLength - at).toFixed(1);
      if (!written && p > 0.62 && skywrite) { written = true; skywrite.classList.add('is-written'); }
    });
  }

  // ── Révélations au premier passage ────────────────────
  function once(selector, threshold, fn) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { each(els, fn); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { io.unobserve(entry.target); fn(entry.target); }
      });
    }, { threshold: threshold, rootMargin: '0px 0px -8% 0px' });
    each(els, function (el) { io.observe(el); });
  }

  // ── Le tableau des départs fait claquer ses palettes ──
  var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function flipBoard() {
    var board = document.querySelector('[data-board]');
    if (!board) return;
    var jobs = [];
    each(board.querySelectorAll('.bd-row'), function (row, r) {
      each(row.querySelectorAll('.bd-c'), function (tile, c) {
        var glyph = tile.firstChild;
        jobs.push({ tile: tile, glyph: glyph, target: glyph.textContent, next: r * 160 + c * 24, left: 5 + Math.floor(Math.random() * 9), flip: false });
        glyph.textContent = ALPHA.charAt(Math.floor(Math.random() * ALPHA.length));
      });
    });
    var start = null;
    (function step(now) {
      if (start === null) start = now;
      var t = now - start, pending = false;
      for (var k = 0; k < jobs.length; k++) {
        var job = jobs[k];
        if (job.left < 0) continue;
        pending = true;
        if (t < job.next) continue;
        job.left--;
        job.glyph.textContent = job.left < 0 ? job.target : ALPHA.charAt(Math.floor(Math.random() * ALPHA.length));
        job.flip = !job.flip;
        job.tile.className = 'bd-c ' + (job.flip ? 'fa' : 'fb');
        job.next = t + 55 + Math.random() * 30;
        if (job.left < 0) sound('click');
      }
      if (pending) requestAnimationFrame(step);
      else {
        var status = board.querySelector('[data-status]');
        if (status) status.classList.add('is-boarding');
      }
    })(performance.now());
  }

  // ── Démarrage ─────────────────────────────────────────
  function start() {
    vh = innerHeight;
    measure();
    buildRoute();
    buildSky();
    frame(true);
    flipBoard();
    once('[data-reveal]', 0.15, function (el) { el.classList.add('is-visible'); });
    once('[data-announce]', 0.35, function (el) { el.classList.add('is-on'); sound('chime'); });
    once('[data-belt]', 0.25, function (el) {
      el.classList.add('is-arriving');
      var count = el.querySelectorAll('.bd-tag').length;
      setTimeout(function () { el.classList.add('is-arrived'); }, 1700 + count * 260);
    });
    addEventListener('scroll', request, { passive: true });
    var relayout = function () { vh = innerHeight; measure(); buildRoute(); buildSky(); request(); };
    addEventListener('resize', relayout);
    // Polices et photos peuvent décaler les escales : on retrace.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    addEventListener('load', relayout);
  }

  function boot() {
    frame(true);
    if (window.whenOpened) window.whenOpened(start); else start();
  }
  // Après tous les scripts : les palettes du tableau sont alors posées.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
`;

/**
 * Script léger, exécuté aussi dans les aperçus statiques (vignettes) : pose
 * les palettes du tableau, fait tourner l'horloge et le compte à rebours.
 */
export const staticScript = `
(function () {
  var main = document.querySelector('.bd');
  if (!main) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Palettes : chaque case du tableau devient une rangée de palettes ; le
  // texte reste lisible par les lecteurs d'écran.
  function tile(ch) {
    var c = document.createElement('span');
    c.className = 'bd-c';
    var glyph = document.createElement('i');
    glyph.textContent = ch;
    c.appendChild(glyph);
    return c;
  }
  each(main.querySelectorAll('[data-flap]'), function (el) {
    var text = el.textContent.replace(/\\s+/g, ' ').trim();
    var copy = document.createElement('span');
    copy.className = 'bd-sr';
    copy.textContent = text;
    el.textContent = '';
    el.appendChild(copy);
    text.toUpperCase().split(' ').forEach(function (word) {
      if (!word) return;
      var w = document.createElement('span');
      w.className = 'bd-word';
      w.setAttribute('aria-hidden', 'true');
      (Array.from ? Array.from(word) : word.split('')).forEach(function (ch) { w.appendChild(tile(ch)); });
      el.appendChild(w);
    });
  });

  // Horloge du terminal.
  var clock = main.querySelector('[data-clock]');
  if (clock) {
    var tick = function () {
      var now = new Date();
      clock.textContent = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
    };
    tick();
    setInterval(tick, 15000);
  }

  // Compte à rebours : les palettes changent une à une.
  var countdown = main.querySelector('[data-countdown]');
  if (!countdown) return;
  var target = new Date(countdown.getAttribute('data-countdown')).getTime();
  var units = {};
  each(countdown.querySelectorAll('[data-unit]'), function (el) { units[el.getAttribute('data-unit')] = el.querySelectorAll('.bd-c'); });
  var sr = countdown.querySelector('[data-sr]');
  var label = countdown.querySelector('.bd-foot-label');
  function setUnit(unit, value) {
    var tiles = units[unit];
    if (!tiles) return;
    var text = String(value);
    while (text.length < tiles.length) text = '0' + text;
    text = text.slice(-tiles.length);
    for (var i = 0; i < tiles.length; i++) {
      var glyph = tiles[i].firstChild, ch = text.charAt(i);
      if (glyph.textContent === ch) continue;
      glyph.textContent = ch;
      if (!reduce) tiles[i].className = 'bd-c ' + (tiles[i].className.indexOf('fa') > -1 ? 'fb' : 'fa');
    }
  }
  function update() {
    var diff = target - Date.now();
    if (isNaN(target) || diff <= -86400000) {
      countdown.classList.remove('is-live');
      return false;
    }
    countdown.classList.add('is-live');
    if (diff <= 0) {
      countdown.classList.add('is-done');
      if (label) label.textContent = 'Embarquement immédiat';
      return false;
    }
    var d = Math.min(999, Math.floor(diff / 86400000)), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
    setUnit('d', d);
    setUnit('h', h);
    setUnit('m', m);
    setUnit('s', s);
    if (sr) sr.textContent = d + ' jours, ' + h + ' heures, ' + m + ' minutes';
    return true;
  }
  if (update()) {
    var timer = setInterval(function () { if (!update()) clearInterval(timer); }, 1000);
  }
})();
`;
