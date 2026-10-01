/**
 * Effets. Exécuté après RSVP_SCRIPT, dans l'iframe isolée. Écrit en ES5
 * sans dépendance, et entièrement facultatif : chaque bloc vérifie que son
 * élément existe.
 */
export const script = `
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = getComputedStyle(root);
  var GOLD = css.getPropertyValue('--c-accent').trim() || '#d9b56c';
  var LIGHT = css.getPropertyValue('--c-accent2').trim() || '#fff1c9';
  var TEXT = css.getPropertyValue('--c-text').trim() || '#ffffff';

  function hexToRgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function fitCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  // ── Révélation au défilement ────────────────────────
  var reveals = document.querySelectorAll('[data-reveal]');
  if (!reduce && 'IntersectionObserver' in window) {
    root.classList.add('fx');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    // Les éléments restent masqués derrière l'écran d'ouverture : on ne
    // commence à les révéler qu'une fois l'invitation ouverte.
    var startReveals = function () { reveals.forEach(function (el) { io.observe(el); }); };
    if (window.whenOpened) window.whenOpened(startReveals); else startReveals();
  }

  // ── Parallaxe + frise du programme ──────────────────
  var parallax = document.querySelectorAll('[data-parallax]');
  var timeline = document.querySelector('[data-timeline]');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var vh = innerHeight;
    parallax.forEach(function (el) {
      var factor = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) return;
      // L'image déborde de 10 à 12 % en haut et en bas : on ne la décale
      // jamais davantage, sinon un bord vide apparaîtrait dans le cadre.
      var limit = box.height * 0.1;
      var offset = el.classList.contains('hero-media')
        ? -box.top * factor
        : Math.max(-limit, Math.min(limit, (box.top + box.height / 2 - vh / 2) * -factor));
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
    if (timeline) {
      var t = timeline.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.8 - t.top) / t.height));
      timeline.style.setProperty('--progress', p.toFixed(3));
    }
  }
  if (!reduce) {
    if (timeline) timeline.style.setProperty('--progress', '0');
    addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  // ── Poussière d'or ─────────────────────────────────
  var dust = document.querySelector('.fx-dust');
  if (dust && !reduce) {
    var dctx = fitCanvas(dust);
    var rgb = hexToRgb(GOLD);
    var particles = [];
    var count = Math.min(90, Math.round(innerWidth * innerHeight / 9000));
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: Math.random() < 0.12 ? 3 + Math.random() * 5 : 0.6 + Math.random() * 1.8,
        vy: 0.1 + Math.random() * 0.35,
        sway: Math.random() * Math.PI * 2,
        tw: Math.random() * Math.PI * 2
      });
    }
    addEventListener('resize', function () { dctx = fitCanvas(dust); });
    (function frame() {
      if (!document.hidden) {
        dctx.clearRect(0, 0, innerWidth, innerHeight);
        particles.forEach(function (p) {
          p.y -= p.vy;
          p.sway += 0.01;
          p.tw += 0.03;
          if (p.y < -10) { p.y = innerHeight + 10; p.x = Math.random() * innerWidth; }
          var x = p.x + Math.sin(p.sway) * 12;
          var big = p.r > 3;
          var alpha = (big ? 0.08 : 0.35) + Math.sin(p.tw) * (big ? 0.05 : 0.3);
          var g = dctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * (big ? 1 : 2.5));
          g.addColorStop(0, 'rgba(' + rgb.join(',') + ',' + Math.max(0, alpha) + ')');
          g.addColorStop(1, 'rgba(' + rgb.join(',') + ',0)');
          dctx.fillStyle = g;
          dctx.beginPath();
          dctx.arc(x, p.y, p.r * (big ? 1 : 2.5), 0, Math.PI * 2);
          dctx.fill();
        });
      }
      requestAnimationFrame(frame);
    })();
  }

  // ── Confettis dorés à la confirmation ──────────────
  var confettiCanvas = document.querySelector('[data-confetti]');
  if (confettiCanvas && !reduce) {
    var cctx = null;
    var pieces = [];
    var running = false;
    var colors = [GOLD, LIGHT, TEXT, GOLD];
    var burst = function (x, y) {
      cctx = fitCanvas(confettiCanvas);
      for (var i = 0; i < 160; i++) {
        var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
        var speed = 6 + Math.random() * 10;
        pieces.push({
          x: x, y: y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          color: colors[i % colors.length], life: 1, round: Math.random() < 0.3
        });
      }
      if (!running) { running = true; requestAnimationFrame(step); }
    };
    var step = function () {
      cctx.clearRect(0, 0, innerWidth, innerHeight);
      pieces = pieces.filter(function (p) { return p.life > 0 && p.y < innerHeight + 40; });
      pieces.forEach(function (p) {
        p.vy += 0.28; p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.006;
        cctx.save();
        cctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
        cctx.translate(p.x, p.y);
        cctx.rotate(p.rot);
        cctx.fillStyle = p.color;
        if (p.round) { cctx.beginPath(); cctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); cctx.fill(); }
        else cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
        cctx.restore();
      });
      if (pieces.length) requestAnimationFrame(step);
      else { running = false; cctx.clearRect(0, 0, innerWidth, innerHeight); }
    };
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-rsvp="confirmed"]');
      if (!btn || btn.disabled) return;
      var box = btn.getBoundingClientRect();
      burst(box.left + box.width / 2, box.top + box.height / 2);
    }, true);
  }
})();
`;

/**
 * Compte à rebours, à part du reste : il tourne aussi dans les aperçus
 * statiques (vignettes, « Aperçu du modèle actif »), qui n'exécutent pas les
 * effets ni le RSVP. Voir renderDesign dans designs/index.js.
 */
export const staticScript = `
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var countdown = document.querySelector('[data-countdown]');
  if (countdown) {
    var target = new Date(countdown.getAttribute('data-countdown')).getTime();
    var nums = {};
    countdown.querySelectorAll('[data-unit]').forEach(function (el) { nums[el.getAttribute('data-unit')] = el; });
    var done = countdown.querySelector('.cd-done');
    var update = function () {
      var diff = target - Date.now();
      // Date illisible, ou événement terminé depuis plus d'un jour : le
      // bloc reste masqué.
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
          if (!reduce) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
        }
      });
      return true;
    };
    if (update()) {
      var timer = setInterval(function () { if (!update()) clearInterval(timer); }, 1000);
    }
  }

})();
`;
