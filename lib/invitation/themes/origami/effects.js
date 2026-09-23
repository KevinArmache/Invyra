import { FIGURES } from "@/lib/invitation/themes/origami/figures";

/**
 * Effets du thème Origami. Exécuté après RSVP_SCRIPT, dans l'iframe isolée :
 * ES5, sans dépendance, et entièrement facultatif (chaque bloc vérifie que
 * son élément existe).
 *
 * - Un seul moteur de défilement : une boucle requestAnimationFrame qui ne
 *   calcule que les éléments proches de l'écran (IntersectionObserver).
 * - Seuls `transform` et `opacity` sont animés ; les animations de facettes
 *   (avion, figure finale) ne tournent que le temps du mouvement.
 * - La visionneuse de la galerie et l'état « déjà répondu » de la
 *   carte-réponse fonctionnent aussi avec « réduire les animations ».
 */
export const script = `
(function () {
  var root = document.documentElement;
  var main = document.querySelector('.ori');
  if (!main) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FIG = ${JSON.stringify(FIGURES)};
  var SIDES = ['var(--c-card)', 'var(--c-accent)', 'var(--c-accent2)'];
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  function fill(side, shade) {
    var base = SIDES[side] || SIDES[0];
    if (Math.abs(shade) < 0.005) return base;
    return 'color-mix(in srgb, ' + base + ', ' + (shade < 0 ? '#000 ' : '#fff ') + Math.round(Math.abs(shade) * 100) + '%)';
  }

  /** Éventail d'un rectangle depuis son centre (voir fan() dans figures.js). */
  function fan(w, h, side) {
    var edge = [], i;
    for (i = 0; i < 3; i++) edge.push([w * i / 3, 0]);
    for (i = 0; i < 3; i++) edge.push([w, h * i / 3]);
    for (i = 0; i < 3; i++) edge.push([w - w * i / 3, h]);
    for (i = 0; i < 3; i++) edge.push([0, h - h * i / 3]);
    var list = [];
    for (i = 0; i < 12; i++) {
      var a = edge[i], b = edge[(i + 1) % 12];
      list.push([w / 2, h / 2, a[0], a[1], b[0], b[1], 0, side, 0, 0]);
    }
    return list;
  }

  /** Figure de la boîte 200 × 200 placée dans un rectangle w × h. */
  function fit(figure, w, h, ratio) {
    var scale = Math.min(w, h) * ratio / 200;
    var ox = (w - 200 * scale) / 2, oy = (h - 200 * scale) / 2;
    return figure.map(function (f) {
      var out = f.slice();
      for (var k = 0; k < 6; k += 2) { out[k] = ox + f[k] * scale; out[k + 1] = oy + f[k + 1] * scale; }
      return out;
    });
  }

  /** Polygones placés à l'état « t » entre deux figures. */
  function morph(polys, from, to, t) {
    for (var n = 0; n < polys.length; n++) {
      var poly = polys[n];
      var i = +poly.getAttribute('data-i');
      var a = from[i], b = to[i], pts = '';
      for (var k = 0; k < 6; k += 2) {
        pts += (a[k] + (b[k] - a[k]) * t).toFixed(1) + ',' + (a[k + 1] + (b[k + 1] - a[k + 1]) * t).toFixed(1) + ' ';
      }
      poly.setAttribute('points', pts);
      poly.style.fill = fill(t < .5 ? a[7] : b[7], a[6] + (b[6] - a[6]) * t);
    }
  }

  function polygons(svg, figure) {
    var list = [];
    figure.map(function (f, i) { return { f: f, i: i }; })
      .sort(function (p, q) { return p.f[8] - q.f[8]; })
      .forEach(function (item) {
        var poly = document.createElementNS(SVG_NS, 'polygon');
        poly.setAttribute('data-i', item.i);
        svg.appendChild(poly);
        list.push(poly);
      });
    return list;
  }

  // ── Visionneuse de la galerie ─────────────────────────
  var album = document.querySelector('[data-album]');
  if (album) {
    var shots = album.querySelectorAll('[data-photo]');
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
      box.className = 'ori-lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Photo agrandie');
      box.innerHTML = '<div class="ori-lb-frame"><img class="ori-lb-img" alt="" draggable="false"><p class="ori-lb-count"></p></div>' +
        '<button type="button" class="ori-lb-btn ori-lb-close" aria-label="Fermer">' + ICON('M6 6l12 12M18 6 6 18') + '</button>' +
        (urls.length > 1
          ? '<button type="button" class="ori-lb-btn ori-lb-prev" aria-label="Photo précédente">' + ICON('M15 5l-7 7 7 7') + '</button>' +
            '<button type="button" class="ori-lb-btn ori-lb-next" aria-label="Photo suivante">' + ICON('M9 5l7 7-7 7') + '</button>'
          : '');
      document.body.appendChild(box);
      img = box.querySelector('.ori-lb-img');
      counter = box.querySelector('.ori-lb-count');
      box.querySelector('.ori-lb-close').addEventListener('click', close);
      var prev = box.querySelector('.ori-lb-prev'), next = box.querySelector('.ori-lb-next');
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
        box.querySelector('.ori-lb-close').focus();
        document.addEventListener('keydown', onKey);
      });
    });
  }

  // ── Carte-réponse : état « déjà répondu » ─────────────
  var card = document.querySelector('[data-replycard]');
  if (card && window.GUEST_DATA && window.GUEST_DATA.rsvp_status) card.classList.add('is-answered');
  if (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.rsvp-edit')) card.classList.remove('is-answered', 'is-arrived');
    });
  }
  if (card && reduce) {
    card.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-rsvp]');
      if (btn && !btn.disabled) card.classList.add('is-answered');
    });
  }

  if (reduce) return;
  root.classList.add('fx');

  // ── Moteur de défilement ──────────────────────────────
  // Pas d'IntersectionObserver ici : un panneau plié a une boîte bien plus
  // courte que sa place réelle, et dans l'iframe (origine opaque) rootMargin
  // n'est pas pris en compte ; un défilement rapide pourrait le laisser plié.
  // Une quinzaine d'éléments : toutes les positions sont lues d'abord, puis
  // les styles écrits, sans aller-retour de mise en page.
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
      // Loin de l'écran, l'élément est déjà dans son état final (plié
      // en dessous, déplié au-dessus) : inutile de le recalculer.
      if (all === true || (r.bottom > -vh && r.top < vh * 2)) scrubs[i].fn(r, vh);
    }
  }
  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  // Panneaux qui se déplient depuis leur charnière haute.
  each(document.querySelectorAll('[data-unfold]'), function (panel) {
    var shade = panel.querySelector('.ori-shade');
    var last = -1;
    scrub(panel, function (r, h) {
      var p = clamp((h - r.top) / (h * 0.42), 0, 1);
      var angle = (1 - easeOut(p)) * 62;
      if (angle < 0.25) angle = 0;
      if (angle === last) return;
      last = angle;
      panel.style.transform = angle ? 'perspective(1300px) rotateX(' + (-angle).toFixed(2) + 'deg)' : '';
      if (shade) shade.style.opacity = (angle / 62 * 0.6).toFixed(3);
    });
  });

  // Parallaxe des photos derrière leur découpe.
  each(document.querySelectorAll('[data-parallax]'), function (el) {
    var factor = parseFloat(el.getAttribute('data-parallax')) || 0.1;
    scrub(el.parentElement, function (r, h) {
      var limit = r.height * 0.1;
      var offset = clamp((r.top + r.height / 2 - h / 2) * -factor, -limit, limit);
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
  });

  // La carte du message sort de sa pochette.
  var letter = document.querySelector('[data-letter]');
  if (letter) {
    scrub(letter.parentElement, function (r, h) {
      var e = easeOut(clamp((h * 0.98 - r.top) / (h * 0.6), 0, 1));
      letter.style.transform = e >= 1 ? '' : 'translate3d(0,' + ((1 - e) * 58).toFixed(2) + '%,0) rotate(' + ((1 - e) * -2.4).toFixed(2) + 'deg)';
    });
  }

  // Programme en accordéon : les arêtes restent jointives, chaque panneau
  // tourne autour de son bord haut, en alternance vers l'avant et l'arrière.
  var accordion = document.querySelector('[data-accordion]');
  if (accordion) {
    var folds = accordion.children;
    var heights = [];
    var measure = function () {
      heights = [];
      for (var i = 0; i < folds.length; i++) heights.push(folds[i].offsetHeight);
    };
    measure();
    addEventListener('resize', measure);
    var lastTheta = -1;
    scrub(accordion, function (r, h) {
      var p = clamp((h * 0.92 - r.top) / (h * 0.5), 0, 1);
      var theta = (1 - easeInOut(p)) * 76;
      if (theta < 0.2) theta = 0;
      if (theta === lastTheta) return;
      lastTheta = theta;
      var rad = theta * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
      var y = 0, flat = 0, z = 0;
      for (var i = 0; i < folds.length; i++) {
        var sign = i % 2 ? -1 : 1;
        var fold = folds[i];
        if (!theta) {
          fold.style.transform = '';
          fold.style.setProperty('--sh', '0');
        } else {
          fold.style.transform = 'translate3d(0,' + (y - flat).toFixed(2) + 'px,' + z.toFixed(2) + 'px) rotateX(' + (sign * theta).toFixed(2) + 'deg)';
          fold.style.setProperty('--sh', (s * (sign > 0 ? 0.3 : 0.04)).toFixed(3));
        }
        y += heights[i] * c;
        flat += heights[i];
        z += sign * heights[i] * s;
      }
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

  // ── Carte-réponse pliée en avion ──────────────────────
  var flockMarkup = (function () {
    var out = '<svg viewBox="0 0 200 200" aria-hidden="true">';
    FIG.crane.map(function (f) { return f; }).sort(function (p, q) { return p[8] - q[8]; }).forEach(function (f) {
      out += '<polygon points="' + f[0] + ',' + f[1] + ' ' + f[2] + ',' + f[3] + ' ' + f[4] + ',' + f[5] + '" style="fill:' + fill(f[7], f[6]) + '"/>';
    });
    return out + '</svg>';
  })();

  function flock(rect) {
    var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    for (var i = 0; i < 9; i++) {
      var bird = document.createElement('div');
      bird.className = 'ori-flock';
      bird.innerHTML = flockMarkup;
      var s = bird.style;
      s.left = (cx + (Math.random() - .5) * rect.width * .6) + 'px';
      s.top = (cy + (Math.random() - .5) * rect.height * .4) + 'px';
      s.setProperty('--x', ((Math.random() - .35) * innerWidth * .9).toFixed(0) + 'px');
      s.setProperty('--y', (-(0.55 + Math.random() * 0.5) * innerHeight).toFixed(0) + 'px');
      s.setProperty('--s', (0.7 + Math.random() * 0.6).toFixed(2));
      s.setProperty('--rot', ((Math.random() - .5) * 30).toFixed(0) + 'deg');
      s.setProperty('--dur', (2.2 + Math.random()).toFixed(2) + 's');
      s.setProperty('--delay', (i * 0.07).toFixed(2) + 's');
      document.body.appendChild(bird);
      setTimeout((function (el) { return function () { el.remove(); }; })(bird), 3800);
    }
  }

  function tween(duration, step, done) {
    var start = null;
    function tick(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      step(t);
      if (t < 1) requestAnimationFrame(tick); else if (done) done();
    }
    requestAnimationFrame(tick);
  }

  function flyAway(el, dx, dy, rotate, duration, callback) {
    var end = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rotate + 'deg) scale(.3)';
    // Filet de sécurité : si la fin de l'animation n'est pas signalée
    // (onglet en arrière-plan…), la suite a lieu quand même, une seule fois.
    var finished = false;
    var done = function () { if (!finished) { finished = true; callback(); } };
    setTimeout(done, duration + 150);
    if (el.animate) {
      var anim = el.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'translate(' + (dx * 0.25) + 'px,' + (dy * 0.08 + 24) + 'px) rotate(' + (rotate * 0.3) + 'deg) scale(.82)', opacity: 1, offset: 0.3 },
        { transform: end, opacity: 0 }
      ], { duration: duration, easing: 'cubic-bezier(.45,0,.7,.45)', fill: 'forwards' });
      anim.onfinish = done;
    } else {
      el.style.transition = 'transform ' + duration + 'ms ease-in, opacity ' + duration + 'ms ease-in';
      el.style.transform = end;
      el.style.opacity = 0;
      setTimeout(done, duration);
    }
  }

  var sending = false;
  if (card) {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-rsvp]');
      if (!btn || btn.disabled || sending || !card.contains(btn)) return;
      send(btn.getAttribute('data-rsvp'));
    }, true);
  }

  function send(status) {
    sending = true;
    var rect = card.getBoundingClientRect();
    var w = rect.width, h = rect.height;
    var ghost = document.createElement('div');
    ghost.className = 'ori-ghost';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = w + 'px';
    ghost.style.height = h + 'px';

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('aria-hidden', 'true');
    var from = fan(w, h, 0);
    var polys = polygons(svg, from);
    morph(polys, from, from, 0);

    var copy = card.cloneNode(true);
    copy.removeAttribute('data-replycard');
    copy.setAttribute('aria-hidden', 'true');
    each(copy.querySelectorAll('[id]'), function (el) { el.removeAttribute('id'); });
    var chosen = copy.querySelector('[data-rsvp="' + status + '"]');
    if (chosen) chosen.classList.add('active');
    copy.classList.remove('is-arrived');
    copy.classList.add('is-answered');

    ghost.appendChild(svg);
    ghost.appendChild(copy);
    document.body.appendChild(ghost);
    card.classList.add('is-sending');
    card.classList.remove('is-arrived', 'is-answered');

    var arrive = function (delay) {
      setTimeout(function () {
        card.classList.remove('is-sending');
        card.classList.add('is-answered', 'is-arrived');
        sending = false;
      }, delay);
    };

    if (status === 'declined') {
      setTimeout(function () {
        ghost.style.transition = 'opacity .6s ease';
        ghost.style.opacity = 0;
        setTimeout(function () { ghost.remove(); }, 650);
      }, 900);
      arrive(1200);
      return;
    }

    if (status === 'confirmed' && main.getAttribute('data-cranes') === '1') {
      setTimeout(function () { flock(rect); }, 1350);
    }

    var plane = fit(FIG.plane, w, h, 0.95);
    setTimeout(function () {
      copy.style.opacity = 0;
      tween(650, function (t) { morph(polys, from, plane, easeInOut(t)); }, function () {
        flyAway(svg, innerWidth - rect.left + 40, -rect.top - h * 0.8, -14, 1100, function () { ghost.remove(); });
      });
    }, 800);
    arrive(1750);
  }

  // ── Conclusion : la feuille devient figure et s'envole ─
  var finale = document.querySelector('[data-finale]');
  if (finale) {
    var stage = finale.querySelector('[data-figure-stage]');
    var figureSvg = finale.querySelector('.ori-figure');
    var signoff = finale.querySelector('[data-ink]');
    var figureName = finale.getAttribute('data-figure');
    var target = FIG[figureName] || FIG.crane;
    var square = FIG.square;
    var fpolys = figureSvg.querySelectorAll('polygon');
    var lastT = -1, flown = false, timer = null;
    morph(fpolys, square, target, 0);

    var flap = function (phase) {
      // Les ailes pivotent autour de la ligne du dos (y = 112).
      var k = 0.35 + 0.65 * Math.cos(phase);
      for (var n = 0; n < fpolys.length; n++) {
        var i = +fpolys[n].getAttribute('data-i');
        var f = target[i];
        if (!f[9]) continue;
        var pts = '';
        for (var j = 0; j < 6; j += 2) {
          var y = f[j + 1] < 100 ? 112 + (f[j + 1] - 112) * k : f[j + 1];
          pts += f[j] + ',' + y.toFixed(1) + ' ';
        }
        fpolys[n].setAttribute('points', pts);
      }
    };

    var fly = function () {
      if (flown) return;
      flown = true;
      var r = stage.getBoundingClientRect();
      var dx = innerWidth - r.left + r.width * 0.2;
      var dy = -(r.top + r.height * 1.3);
      var start = null;
      if (figureName === 'crane') {
        (function wings(now) {
          if (start === null) start = now;
          var elapsed = now - start;
          flap(elapsed / 115);
          if (elapsed < 2400) requestAnimationFrame(wings);
        })(performance.now());
      }
      var delay = figureName === 'heart' ? 700 : 250;
      if (figureName === 'heart' && figureSvg.animate) {
        figureSvg.animate([
          { transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' },
          { transform: 'scale(1.12)' }, { transform: 'scale(1)' }
        ], { duration: 700, easing: 'ease-in-out' });
      }
      setTimeout(function () {
        stage.classList.add('is-flown');
        flyAway(figureSvg, dx, dy, figureName === 'star' ? 200 : -12, 2000, function () {});
      }, delay);
      setTimeout(function () { if (signoff) signoff.classList.add('is-inked'); }, delay + 1300);
    };

    scrub(stage, function (r, h) {
      if (flown) return;
      var p = clamp((h * 0.9 - r.top) / (h * 0.5), 0, 1);
      var t = easeInOut(p);
      if (Math.abs(t - lastT) > 0.001) { lastT = t; morph(fpolys, square, target, t); }
      if (p >= 1) {
        if (!timer) timer = setTimeout(fly, 650);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    });
  }

  // ── Démarrage, une fois l'invitation ouverte ──────────
  function start() {
    vh = innerHeight;
    frame(true);
    once('[data-reveal]', 0.12, function (el) {
      el.classList.add('is-visible');
      if (el.classList.contains('ori-card')) {
        setTimeout(function () { el.style.clipPath = 'none'; }, 2200);
      }
    });
    once('[data-gate]', 0.5, function (el) { el.classList.add('is-open'); });
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', function () { vh = innerHeight; request(); });
  }
  // Les panneaux sont posés pliés tout de suite, derrière l'écran
  // d'ouverture ; ils ne se déplient qu'une fois l'invitation ouverte.
  frame(true);
  if (window.whenOpened) window.whenOpened(start); else start();

  // ── Inclinaison de la feuille sous la souris ──────────
  var sheet = document.querySelector('[data-tilt]');
  if (sheet && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var tiltFrame = 0, mx = 0, my = 0;
    var applyTilt = function () {
      tiltFrame = 0;
      sheet.style.setProperty('--ry', (mx * 4).toFixed(2) + 'deg');
      sheet.style.setProperty('--rx', (-my * 3).toFixed(2) + 'deg');
      sheet.style.setProperty('--gx', ((mx + .5) * 100).toFixed(1) + '%');
      sheet.style.setProperty('--gy', ((my + .5) * 100).toFixed(1) + '%');
    };
    sheet.addEventListener('pointermove', function (e) {
      var r = sheet.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - .5;
      my = (e.clientY - r.top) / r.height - .5;
      sheet.classList.add('is-tilting');
      if (!tiltFrame) tiltFrame = requestAnimationFrame(applyTilt);
    });
    sheet.addEventListener('pointerleave', function () {
      sheet.classList.remove('is-tilting');
      mx = 0; my = 0;
      applyTilt();
    });
  }
})();
`;

/**
 * Compte à rebours, à part : il tourne aussi dans les aperçus statiques
 * (vignettes), qui n'exécutent pas les effets.
 */
export const staticScript = `
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var countdown = document.querySelector('.ori [data-countdown]');
  if (!countdown) return;
  var target = new Date(countdown.getAttribute('data-countdown')).getTime();
  var nums = {};
  countdown.querySelectorAll('[data-unit]').forEach(function (el) { nums[el.getAttribute('data-unit')] = el; });
  var done = countdown.querySelector('.ori-cd-done');
  var update = function () {
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
    var values = {
      d: Math.floor(diff / 86400000),
      h: Math.floor(diff / 3600000) % 24,
      m: Math.floor(diff / 60000) % 60,
      s: Math.floor(diff / 1000) % 60
    };
    Object.keys(values).forEach(function (unit) {
      var el = nums[unit];
      var text = values[unit] < 10 ? '0' + values[unit] : String(values[unit]);
      if (el && el.textContent !== text) {
        el.textContent = text;
        if (!reduce) { el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip'); }
      }
    });
    return true;
  };
  if (update()) {
    var timer = setInterval(function () { if (!update()) clearInterval(timer); }, 1000);
  }
})();
`;
