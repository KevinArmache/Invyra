/**
 * Effets du design Face A. Exécuté après RSVP_SCRIPT, dans l'iframe isolée :
 * ES5, sans dépendance, et entièrement facultatif (chaque bloc vérifie que
 * son élément existe).
 *
 * - Un moteur de défilement (requestAnimationFrame) : toutes les positions
 *   sont lues d'abord, puis les styles écrits, et seuls les éléments proches
 *   de l'écran sont recalculés.
 * - Un moteur de rotation pour les disques visibles : régime du design, plus
 *   la vitesse de défilement (en remontant, le disque tourne à l'envers).
 * - Seuls `transform`, `opacity` et quelques variables CSS changent.
 * - La visionneuse du bac à disques et l'état « déjà répondu » du jukebox
 *   fonctionnent aussi avec « réduire les animations ».
 */
export const script = `
(function () {
  var root = document.documentElement;
  var main = document.querySelector('.vn');
  if (!main) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  // ── Visionneuse du bac à disques ──────────────────────
  var crate = document.querySelector('[data-crate]');
  var beforeOpen = null;
  if (crate) {
    var shots = crate.querySelectorAll('[data-photo]');
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
      box.className = 'vn-lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Photo agrandie');
      box.innerHTML = '<div class="vn-lb-frame"><img class="vn-lb-img" alt="" draggable="false"><p class="vn-lb-count"></p></div>' +
        '<button type="button" class="vn-round-btn vn-lb-close" aria-label="Fermer">' + ICON('M6 6l12 12M18 6 6 18') + '</button>' +
        (urls.length > 1
          ? '<button type="button" class="vn-round-btn vn-lb-prev" aria-label="Photo précédente">' + ICON('M15 5l-7 7 7 7') + '</button>' +
            '<button type="button" class="vn-round-btn vn-lb-next" aria-label="Photo suivante">' + ICON('M9 5l7 7-7 7') + '</button>'
          : '');
      document.body.appendChild(box);
      img = box.querySelector('.vn-lb-img');
      counter = box.querySelector('.vn-lb-count');
      box.querySelector('.vn-lb-close').addEventListener('click', close);
      var prev = box.querySelector('.vn-lb-prev'), next = box.querySelector('.vn-lb-next');
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
        if (beforeOpen && !beforeOpen(btn)) return;
        if (!box) build();
        lastFocus = btn;
        box.hidden = false;
        show(i);
        void box.offsetWidth;
        box.classList.add('is-open');
        box.querySelector('.vn-lb-close').focus();
        document.addEventListener('keydown', onKey);
      });
    });

    // Flèches du bac (écrans à souris).
    var stepCrate = function (direction) {
      var item = crate.querySelector('[data-crate-item]');
      if (!item) return;
      var gap = parseFloat(getComputedStyle(crate).columnGap) || 0;
      crate.scrollBy({ left: direction * (item.offsetWidth + gap), behavior: reduce ? 'auto' : 'smooth' });
    };
    var prevBtn = document.querySelector('[data-crate-prev]'), nextBtn = document.querySelector('[data-crate-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () { stepCrate(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stepCrate(1); });
  }

  // ── Jukebox : état « déjà répondu » ───────────────────
  var juke = document.querySelector('[data-juke]');
  if (juke && window.GUEST_DATA && window.GUEST_DATA.rsvp_status) juke.classList.add('is-answered');

  if (reduce) return;
  root.classList.add('fx');

  // ── Moteur de défilement ──────────────────────────────
  var scrubs = [];
  var vh = innerHeight;
  var ticking = false;
  function scrub(el, fn) {
    if (el) scrubs.push({ el: el, fn: fn });
  }
  function frame(all) {
    ticking = false;
    var rects = [], i;
    for (i = 0; i < scrubs.length; i++) rects.push(scrubs[i].el.getBoundingClientRect());
    for (i = 0; i < scrubs.length; i++) {
      var r = rects[i];
      if (all === true || (r.bottom > -vh && r.top < vh * 2)) scrubs[i].fn(r, vh);
    }
    nowPlaying();
  }
  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  // ── Rotation des disques ──────────────────────────────
  var BASE = (main.getAttribute('data-rpm') === '45' ? 45 : 33.33) * 6 / 1000;
  var deck = window.__vnDeck || (window.__vnDeck = { angle: 0 });
  var discs = [];
  each(main.querySelectorAll('[data-spin]'), function (el) {
    var host = el.parentElement;
    discs.push({
      el: el, host: host, angle: 0, visible: false, ramp: null, stop: null,
      factor: parseFloat(host.getAttribute('data-speed')) || 1,
      hero: host.hasAttribute('data-hero-disc')
    });
  });
  function discOf(host) {
    for (var i = 0; i < discs.length; i++) if (discs[i].host === host) return discs[i];
    return null;
  }
  /** Change la vitesse d'un disque en douceur (0 : arrêté, 1 : régime). */
  function rampTo(d, to, duration) {
    if (d) d.ramp = { start: performance.now(), from: d.factor, to: to, duration: duration };
  }

  var velocity = 0, lastY = 0, lastT = 0, spinning = false;
  function spinLoop(now) {
    var dt = lastT ? Math.min(64, now - lastT) : 16;
    lastT = now;
    var y = window.scrollY || window.pageYOffset;
    velocity += ((y - lastY) / dt - velocity) * 0.2;
    lastY = y;
    // Scratch : défiler entraîne le disque, remonter le fait tourner à l'envers.
    var scratch = clamp(velocity, -6, 6) * 0.45;
    var any = false;
    for (var i = 0; i < discs.length; i++) {
      var d = discs[i];
      if (d.ramp) {
        var t = Math.min(1, (now - d.ramp.start) / d.ramp.duration);
        d.factor = d.ramp.from + (d.ramp.to - d.ramp.from) * easeOut(t);
        if (t >= 1) d.ramp = null;
      }
      if (d.stop) {
        // Arrêt de platine : décélération constante jusqu'à un tour entier.
        var u = Math.min(1, (now - d.stop.start) / d.stop.duration);
        d.angle = d.stop.from + d.stop.travel * (1 - (1 - u) * (1 - u));
        if (u >= 1) { d.stop = null; d.factor = 0; }
      } else if (d.hero && deck.opening) {
        d.angle = deck.angle;
      } else if (d.visible) {
        d.angle += (BASE + scratch) * d.factor * dt;
      }
      if (!d.visible) continue;
      any = true;
      d.el.style.transform = 'rotate(' + (d.angle % 360).toFixed(2) + 'deg)';
    }
    if (any || Math.abs(velocity) > 0.01) requestAnimationFrame(spinLoop);
    else { spinning = false; lastT = 0; }
  }
  function startSpin() {
    if (spinning) return;
    spinning = true;
    lastT = 0;
    lastY = window.scrollY || window.pageYOffset;
    requestAnimationFrame(spinLoop);
  }

  // ── Paroles : la ligne chantée s'allume ───────────────
  each(document.querySelectorAll('.vn-lyrics p'), function (p) {
    var sung = null;
    scrub(p, function (r, h) {
      var next = r.top + r.height * 0.5 < h * 0.64;
      if (next !== sung) { sung = next; p.classList.toggle('is-sung', next); }
    });
  });

  // ── Formes d'onde : la partie lue avance ──────────────
  each(document.querySelectorAll('[data-wave]'), function (w) {
    var last = -1;
    scrub(w, function (r, h) {
      var p = Math.round(clamp((h * 0.92 - r.top) / (h * 0.6), 0, 1) * 200) / 200;
      if (p !== last) { last = p; w.style.setProperty('--played', p); }
    });
  });

  // ── Tracklist : le bras avance, la piste en cours s'allume
  var list = document.querySelector('[data-tracklist]');
  if (list) {
    var items = list.children;
    var tlArm = main.querySelector('.vn-tracklist .vn-arm');
    var active = -1, lastArm = -1;
    scrub(list, function (r, h) {
      var p = clamp((h * 0.5 - r.top) / Math.max(1, r.height), 0, 1);
      var arm = Math.round((22 + 18 * p) * 10) / 10;
      if (tlArm && arm !== lastArm) { lastArm = arm; tlArm.style.setProperty('--arm', arm + 'deg'); }
      var index = r.top > h * 0.5 || r.bottom < h * 0.5 ? -1 : Math.min(items.length - 1, Math.floor(p * items.length));
      if (index !== active) {
        if (active >= 0 && items[active]) items[active].classList.remove('is-playing');
        if (index >= 0) items[index].classList.add('is-playing');
        active = index;
      }
    });
  }

  // ── Retourner le disque ───────────────────────────────
  var flip = document.querySelector('[data-flip]');
  if (flip) {
    var flipDisc = flip.querySelector('[data-flip-disc]');
    var flipText = flip.querySelector('.vn-flip-text');
    var lastFlip = -1;
    scrub(flip, function (r, h) {
      var p = clamp(-r.top / Math.max(1, r.height - h), 0, 1);
      var t = easeInOut(clamp((p - 0.18) / 0.6, 0, 1));
      if (Math.abs(t - lastFlip) < 0.0005) return;
      lastFlip = t;
      flipDisc.style.transform = 'rotateY(' + (t * 180).toFixed(2) + 'deg) scale(' + (1 + 0.14 * Math.sin(Math.PI * t)).toFixed(4) + ')';
      flipText.classList.toggle('is-b', t > 0.5);
    });
  }

  // ── Pochette 45 tours : le trou s'élargit ─────────────
  var hole = document.querySelector('[data-hole]');
  if (hole) {
    var lastHole = -1;
    scrub(hole, function (r, h) {
      var p = clamp((h * 0.95 - r.top) / (h * 0.75), 0, 1);
      var v = Math.round((0.17 + 0.56 * easeInOut(p)) * 1000) / 1000;
      if (v !== lastHole) { lastHole = v; hole.style.setProperty('--h', v); }
    });
  }

  // ── Bac à disques : les pochettes voisines penchent ───
  if (crate) {
    var crateItems = crate.querySelectorAll('[data-crate-item]');
    var crateTicking = false;
    var flow = function () {
      crateTicking = false;
      var center = crate.scrollLeft + crate.clientWidth / 2;
      each(crateItems, function (item) {
        var w = item.offsetWidth || 1;
        var o = (item.offsetLeft + w / 2 - center) / w;
        var c = clamp(o, -1, 1);
        item.style.transform = 'perspective(1000px) translateX(' + (-clamp(o, -1.6, 1.6) * 14).toFixed(1) + '%) rotateY(' + (c * 44).toFixed(2) + 'deg) scale(' + (1 - Math.abs(c) * 0.14).toFixed(3) + ')';
        item.style.zIndex = String(100 - Math.round(Math.abs(o) * 10));
        item.classList.toggle('is-front', Math.abs(o) < 0.5);
      });
    };
    crate.addEventListener('scroll', function () {
      if (!crateTicking) { crateTicking = true; requestAnimationFrame(flow); }
    }, { passive: true });
    addEventListener('resize', flow);
    flow();
    // Une pochette de côté vient d'abord au centre ; au centre, elle s'ouvre.
    beforeOpen = function (btn) {
      var item = btn.closest('[data-crate-item]');
      if (item && !item.classList.contains('is-front')) {
        crate.scrollTo({ left: item.offsetLeft + item.offsetWidth / 2 - crate.clientWidth / 2, behavior: 'smooth' });
        return false;
      }
      return true;
    };
  }

  // ── Lecteur « en cours de lecture » ───────────────────
  var now = document.querySelector('[data-now]');
  var tracks = main.querySelectorAll('[data-track]');
  var heroEl = main.querySelector('.vn-hero');
  var hiddenEl = main.querySelector('[data-hidden]');
  var marks = [], heroBottom = 0, hiddenTop = 0, maxScroll = 1, nowState = '';
  function measure() {
    var y = window.scrollY || window.pageYOffset;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    marks = [];
    each(tracks, function (el) { marks.push({ top: el.getBoundingClientRect().top + y, code: el.getAttribute('data-track'), title: el.getAttribute('data-track-title') }); });
    heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom + y : 0;
    hiddenTop = hiddenEl ? hiddenEl.getBoundingClientRect().top + y : Infinity;
  }
  function nowPlaying() {
    if (!now) return;
    var y = window.scrollY || window.pageYOffset;
    var line = y + vh * 0.45, found = null;
    for (var i = 0; i < marks.length; i++) if (marks[i].top <= line) found = marks[i];
    var shown = found && y > heroBottom - vh * 0.25 && y + vh * 0.55 < hiddenTop;
    var state = shown ? found.code : '';
    if (state !== nowState) {
      nowState = state;
      now.classList.toggle('is-shown', !!shown);
      if (found) {
        now.querySelector('[data-now-code]').textContent = found.code;
        now.querySelector('[data-now-title]').textContent = found.title;
      }
    }
    now.style.setProperty('--progress', clamp(y / maxScroll, 0, 1).toFixed(4));
  }

  // ── Silence avant la piste cachée ─────────────────────
  var silence = document.querySelector('[data-silence]');
  if (silence) {
    var timeEl = silence.querySelector('[data-silence-time]');
    var lastSecond = -1;
    scrub(silence, function (r, h) {
      var p = clamp((h - r.top) / (r.height + h * 0.3), 0, 1);
      var second = 227 + Math.round(p * 46);
      if (second !== lastSecond) {
        lastSecond = second;
        timeEl.textContent = Math.floor(second / 60) + ':' + ('0' + (second % 60)).slice(-2);
      }
    });
  }

  // ── Conclusion : le disque s'arrête, le bras se relève ─
  var runout = document.querySelector('[data-runout]');
  if (runout) {
    var endDisc = discOf(runout.querySelector('.vn-disc'));
    var endArm = runout.querySelector('.vn-arm');
    var ended = false, endTimer = null;
    if (endArm) endArm.style.setProperty('--arm', '42deg');
    var stopRecord = function () {
      ended = true;
      if (endDisc) {
        // Le disque s'arrête sur un tour entier : le message gravé se lit
        // à l'endroit, en haut du sillon de sortie.
        var speed = Math.max(0.05, BASE * endDisc.factor);
        var rest = (360 - ((endDisc.angle % 360) + 360) % 360) % 360;
        var travel = rest * 2 / speed < 2000 ? rest + 360 : rest;
        endDisc.ramp = null;
        endDisc.stop = { start: performance.now(), from: endDisc.angle, travel: travel, duration: travel * 2 / speed };
        setTimeout(lift, endDisc.stop.duration);
      } else lift();
    };
    var lift = function () {
      runout.classList.add('is-stopped');
      if (!endArm) return;
      endArm.classList.add('is-lifted');
      setTimeout(function () {
        endArm.style.setProperty('--arm', '0deg');
        setTimeout(function () { endArm.classList.remove('is-lifted'); }, 1500);
      }, 380);
    };
    scrub(runout, function (r, h) {
      if (ended) return;
      var inView = r.top < h * 0.72 && r.bottom > h * 0.3;
      if (inView && !endTimer) endTimer = setTimeout(stopRecord, 700);
      else if (!inView && endTimer) { clearTimeout(endTimer); endTimer = null; }
    });
  }

  // ── Jukebox : réaction à la réponse ───────────────────
  if (juke) {
    var jukeDisc = discOf(juke.querySelector('[data-juke-disc]'));
    var jukeTimer = null;
    var burst = function (btn) {
      var r = btn.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (var i = 0; i < 24; i++) {
        var spark = document.createElement('span');
        var note = i % 3 === 0;
        spark.className = 'vn-spark ' + (note ? 'vn-spark--note' : 'vn-spark--disc');
        spark.setAttribute('aria-hidden', 'true');
        if (note) spark.textContent = i % 2 ? '\\u266A' : '\\u266B';
        var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
        var distance = 90 + Math.random() * 170;
        spark.style.left = cx + 'px';
        spark.style.top = cy + 'px';
        spark.style.setProperty('--x', (Math.cos(angle) * distance).toFixed(0) + 'px');
        spark.style.setProperty('--y', (Math.sin(angle) * distance - 40).toFixed(0) + 'px');
        spark.style.setProperty('--r', ((Math.random() - 0.5) * 540).toFixed(0) + 'deg');
        spark.style.setProperty('--dur', (1 + Math.random() * 0.7).toFixed(2) + 's');
        spark.style.setProperty('--delay', (Math.random() * 0.15).toFixed(2) + 's');
        document.body.appendChild(spark);
        setTimeout((function (el) { return function () { el.remove(); }; })(spark), 2200);
      }
    };
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-rsvp]');
      if (!btn || btn.disabled || !juke.contains(btn)) return;
      var status = btn.getAttribute('data-rsvp');
      clearTimeout(jukeTimer);
      juke.classList.remove('is-party', 'is-skip', 'is-still');
      void juke.offsetWidth;
      rampTo(jukeDisc, 1, 500);
      if (status === 'confirmed') {
        juke.classList.add('is-party');
        burst(btn);
        if (jukeDisc) jukeDisc.factor = 3;
        rampTo(jukeDisc, 1, 2400);
        jukeTimer = setTimeout(function () { juke.classList.remove('is-party'); }, 2600);
      } else if (status === 'maybe') {
        // L'aiguille saute.
        juke.classList.add('is-skip');
        if (jukeDisc) jukeDisc.angle += 40;
        jukeTimer = setTimeout(function () { juke.classList.remove('is-skip'); }, 600);
      } else {
        // Le disque ralentit jusqu'à l'arrêt, puis repart.
        juke.classList.add('is-still');
        rampTo(jukeDisc, 0, 1700);
        jukeTimer = setTimeout(function () {
          juke.classList.remove('is-still');
          rampTo(jukeDisc, 1, 1400);
        }, 3400);
      }
      startSpin();
    }, true);
  }

  // ── Démarrage, une fois l'invitation ouverte ──────────
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

  function watchDiscs() {
    if (!('IntersectionObserver' in window)) {
      each(discs, function (d) { d.visible = true; });
      startSpin();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var d = discOf(entry.target);
        if (d) d.visible = entry.isIntersecting;
      });
      startSpin();
    });
    each(discs, function (d) { io.observe(d.host); });
  }

  function start() {
    vh = innerHeight;
    var hero = discs.filter(function (d) { return d.hero; })[0];
    if (hero) hero.angle = deck.angle;
    measure();
    frame(true);
    once('[data-reveal]', 0.15, function (el) { el.classList.add('is-visible'); });
    watchDiscs();
    addEventListener('scroll', function () { request(); startSpin(); }, { passive: true });
    addEventListener('resize', function () { vh = innerHeight; measure(); request(); });
    // Polices et photos peuvent décaler les pistes : on remesure.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); request(); });
    addEventListener('load', function () { measure(); request(); });
  }
  // Les états animés sont posés tout de suite, derrière l'écran d'ouverture.
  frame(true);
  if (window.whenOpened) window.whenOpened(start); else start();

  // ── Inclinaison de l'album sous la souris ─────────────
  var album = document.querySelector('[data-album]');
  if (album && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    album.classList.add('is-tiltable');
    var tiltFrame = 0, mx = 0, my = 0;
    var applyTilt = function () {
      tiltFrame = 0;
      album.style.setProperty('--ry', (mx * 6).toFixed(2) + 'deg');
      album.style.setProperty('--rx', (-my * 5).toFixed(2) + 'deg');
    };
    album.addEventListener('pointermove', function (e) {
      var r = album.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - .5;
      my = (e.clientY - r.top) / r.height - .5;
      album.classList.add('is-tilting');
      if (!tiltFrame) tiltFrame = requestAnimationFrame(applyTilt);
    });
    album.addEventListener('pointerleave', function () {
      album.classList.remove('is-tilting');
      mx = 0; my = 0;
      applyTilt();
    });
  }
})();
`;

/**
 * Script léger, exécuté aussi dans les aperçus statiques (vignettes) :
 * ajustement du titre de la pochette et compteur de bande.
 */
export const staticScript = `
(function () {
  // Titre de la pochette : réduit jusqu'à tenir dans la pochette.
  function fit() {
    Array.prototype.forEach.call(document.querySelectorAll('.vn-cover [data-fit]'), function (el) {
      el.style.fontSize = '';
      var cover = el.parentElement;
      var max = cover.clientHeight * 0.58;
      var size = parseFloat(getComputedStyle(el).fontSize);
      var guard = 0;
      while ((el.offsetHeight > max || el.scrollWidth > el.clientWidth + 1) && size > 9 && guard++ < 40) {
        size *= 0.92;
        el.style.fontSize = size + 'px';
      }
    });
  }
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  addEventListener('resize', fit);

  var countdown = document.querySelector('.vn [data-countdown]');
  if (!countdown) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var target = new Date(countdown.getAttribute('data-countdown')).getTime();
  var cells = {};
  Array.prototype.forEach.call(countdown.querySelectorAll('[data-unit]'), function (el) {
    var unit = el.getAttribute('data-unit');
    cells[unit] = { strips: el.querySelectorAll('.vn-strip'), values: [], sr: countdown.querySelector('[data-sr="' + unit + '"]') };
  });
  var done = countdown.querySelector('.vn-cd-done');

  // Chiffres mécaniques : chaque bande roule jusqu'au chiffre voulu ; de 9 à
  // 0, elle continue vers le 0 du bas puis revient en place sans transition.
  function setDigits(cell, value) {
    var text = String(value);
    var length = cell.strips.length;
    while (text.length < length) text = '0' + text;
    text = text.slice(-length);
    if (cell.sr) cell.sr.textContent = String(value);
    for (var i = 0; i < length; i++) {
      var n = +text.charAt(i), prev = cell.values[i], strip = cell.strips[i];
      if (prev === n) continue;
      cell.values[i] = n;
      if (!reduce && prev === 9 && n === 0) {
        strip.style.setProperty('--n', '10');
        setTimeout((function (s) {
          return function () {
            s.classList.add('is-snap');
            s.style.setProperty('--n', '0');
            void s.offsetWidth;
            s.classList.remove('is-snap');
          };
        })(strip), 650);
      } else {
        strip.style.setProperty('--n', String(n));
      }
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
      if (done) done.hidden = false;
      return false;
    }
    setDigits(cells.d, Math.min(999, Math.floor(diff / 86400000)));
    setDigits(cells.h, Math.floor(diff / 3600000) % 24);
    setDigits(cells.m, Math.floor(diff / 60000) % 60);
    setDigits(cells.s, Math.floor(diff / 1000) % 60);
    return true;
  }
  if (update()) {
    var timer = setInterval(function () { if (!update()) clearInterval(timer); }, 1000);
  }
})();
`;
