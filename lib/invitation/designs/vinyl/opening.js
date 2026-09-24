import { escapeHtml } from "@/lib/invitation/shared";
import {
  cover,
  disc,
  tonearm,
  turntable,
} from "@/lib/invitation/designs/vinyl/markup";

/**
 * Écran d'ouverture du design Face A : l'invité sort le disque de sa pochette
 * et pose l'aiguille.
 *
 * 1. Pochette dans la pénombre, dédicace au feutre, une tranche du disque qui
 *    dépasse. Premier geste (glisser vers la droite) : le disque sort.
 * 2. La pochette s'efface, le disque se pose sur une platine.
 * 3. Second geste (glisser vers la gauche) : le bras vient sur le disque.
 *    L'aiguille se pose, grésillement, la musique démarre, le disque prend
 *    sa vitesse puis rejoint exactement le disque du héro ; l'écran s'efface
 *    et la pochette du héro glisse dessus.
 *
 * Un toucher, ou le bouton, avance d'une étape. L'écran porte
 * `data-opening-manual` : il appelle lui-même `window.openInvitation()` au
 * moment où l'aiguille se pose, pendant le geste de l'invité, pour que la
 * musique et le son aient le droit de démarrer.
 *
 * Géométrie : tout dérive de `--D`, le diamètre du disque. Le groupe a la
 * taille de la platine (1,46 D × 1,18 D) ; le disque y est posé en
 * (0,07 D ; 0,09 D). Le script ne pilote que des variables CSS.
 */

/** Durées (ms), alignées sur les transitions du CSS ci-dessous. */
const REVEAL_DELAY = 2100;
const REMOVE_DELAY = 3000;

export function renderVinylOpening({ style, content, details }) {
  const { opening, hero } = content;
  const rpm = style.rpm === "45" ? "45" : "33";
  const date = details.find((item) => item.key === "date");

  const sleeve = cover({
    image: hero.image,
    title: hero.title ? escapeHtml(hero.title) : "{{EVENT_TITLE}}",
    sticker: opening.eyebrow,
    dedication: opening.title ? `Pour ${escapeHtml(opening.title)}` : "",
    catalog: date ? escapeHtml(date.value) : "",
  });

  const dust = Array.from(
    { length: 12 },
    (_, index) =>
      `<i style="--x:${(index * 37) % 100}%;--y:${(index * 53) % 100}%;--t:${6 + (index % 5) * 1.7}s;--dl:${-(index * 1.3).toFixed(1)}s"></i>`,
  ).join("");

  const html = `<div class="vn-op" data-opening data-opening-manual data-reveal-delay="${REVEAL_DELAY}" data-remove-delay="${REMOVE_DELAY}" data-stage="1" data-rpm="${rpm}" data-crackle="${style.crackle ? "1" : "0"}" role="dialog" aria-modal="true" aria-label="Invitation : sortez le disque de sa pochette et posez l'aiguille pour l'ouvrir">
<span class="vn-op-room" aria-hidden="true"><span class="vn-op-beam"></span><span class="vn-op-dust">${dust}</span></span>
<div class="vn-op-inner" aria-hidden="true">
  <div class="vn-op-zoom">
    <div class="vn-op-group">
      <div class="vn-op-tt">${turntable({ rpm })}</div>
      <div class="vn-op-slot vn-op-disc">${disc({ rpm })}<span class="vn-op-ripple"></span><span class="vn-op-ripple vn-op-ripple--late"></span></div>
      <div class="vn-op-slot vn-op-sleeve">${sleeve}</div>
      <div class="vn-op-slot vn-op-armslot">${tonearm()}</div>
    </div>
  </div>
</div>
<div class="vn-op-ui">
  <button type="button" class="vn-op-cta" data-op-next>
    <span class="vn-op-gesture" aria-hidden="true"><span></span></span>
    <span class="vn-op-hint" data-hint>${escapeHtml(opening.hint || "Faites glisser le disque")}</span>
  </button>
</div>
</div>`;

  return { html, css: OPENING_CSS, js: OPENING_JS };
}

const OPENING_CSS = `
.vn-op {
  --D: min(62vw, 50vh, 380px);
  --D: min(62vw, 50svh, 380px);
  --gx: .09; --gs: 1; --dx: .16; --dl: 1; --sx: 0; --sr: 0deg; --so: 1; --pq: 0; --py: .08; --arm: 0deg;
  position: fixed; inset: 0; z-index: 2147483000; overflow: hidden;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--c-background) 88%, #000);
  color: var(--c-text); font-family: var(--f-body);
  touch-action: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  cursor: grab;
}
.vn-op.is-dragging { cursor: grabbing; }
.vn-op[data-stage="2"] { cursor: default; }

/* La pièce : un faisceau de lumière et de la poussière qui flotte dedans. */
.vn-op-room {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(60% 52% at 50% 46%, color-mix(in srgb, var(--c-background) 82%, var(--c-text) 18%), transparent 72%);
}
.vn-op-beam {
  position: absolute; left: 50%; top: -10%; width: 120vmax; height: 120vh; transform: translateX(-50%);
  background: conic-gradient(from 180deg at 50% 0%, transparent 162deg, color-mix(in srgb, var(--c-text) 7%, transparent) 180deg, transparent 198deg);
  animation: vn-op-flicker 7s ease-in-out infinite;
}
.vn-op-dust { position: absolute; left: 30%; right: 30%; top: 0; bottom: 20%; }
.vn-op-dust i {
  position: absolute; left: var(--x); top: var(--y); width: 3px; height: 3px; border-radius: 50%;
  background: color-mix(in srgb, var(--c-text) 55%, transparent); opacity: 0;
  animation: vn-op-dust var(--t) ease-in-out var(--dl) infinite;
}

.vn-op-inner { position: absolute; inset: 0; display: grid; place-items: center; }
.vn-op-zoom {
  position: relative; width: calc(var(--D) * 1.46); height: calc(var(--D) * 1.18); margin-top: -8vh;
  transition: transform 1s cubic-bezier(.6, 0, .2, 1);
}
.vn-op-group { position: absolute; inset: 0; transform: translateX(calc(var(--D) * var(--gx))) scale(var(--gs)); }
.vn-op-tt { position: absolute; inset: 0; opacity: var(--pq); transform: translateY(calc(var(--D) * var(--py))); }
.vn-op-slot { position: absolute; left: calc(var(--D) * .07); top: calc(var(--D) * .09); width: var(--D); height: var(--D); }
.vn-op-disc { transform: translateX(calc(var(--D) * var(--dx))) scale(var(--dl)); }
.vn-op-disc .vn-disc { box-shadow: 0 calc(var(--D) * (.05 + (var(--dl) - 1) * 1.4)) calc(var(--D) * .1) calc(var(--D) * -.04) rgb(0 0 0 / .7), 0 0 0 1px rgb(0 0 0 / .25); }
.vn-op-sleeve { transform: translateX(calc(var(--D) * var(--sx))) rotate(var(--sr)); opacity: var(--so); }
.vn-op-sleeve .vn-cover { left: -2%; top: -2%; width: 104%; height: 104%; }
.vn-op-armslot { opacity: var(--pq); }
.vn-op-ripple {
  position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  border: 2px solid var(--c-accent); opacity: 0;
}
.vn-op.is-dropped .vn-op-ripple { animation: vn-op-ripple 1.3s ease-out .42s both; }
.vn-op.is-dropped .vn-op-ripple--late { animation-delay: .75s; }

/* Bouton et indication du geste. */
.vn-op-ui {
  position: absolute; left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(1.25rem, 6vh, 3rem));
  display: flex; justify-content: center; padding: 0 16px; pointer-events: none; transition: opacity .3s ease;
}
.vn-op-cta {
  pointer-events: auto; display: inline-flex; align-items: center; gap: .9rem; min-height: 48px;
  padding: .75rem 1.35rem; border-radius: 999px; cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--c-text) 18%, transparent);
  background: color-mix(in srgb, var(--c-card) 78%, transparent); color: var(--c-text);
  font-family: var(--f-mono); font-size: .74rem; letter-spacing: .16em; text-transform: uppercase;
  box-shadow: 0 10px 24px -16px rgb(0 0 0 / .6);
  animation: vn-op-in 1s ease .9s both;
}
.vn-op-cta:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.vn-op[data-stage="2"] .vn-op-cta { opacity: .5; }
.vn-op-hint { transition: opacity .3s ease; }
.vn-op-hint.is-swapping { opacity: 0; }
.vn-op-gesture { position: relative; flex: none; width: 34px; height: 2px; border-radius: 2px; background: color-mix(in srgb, var(--c-text) 22%, transparent); transition: transform .5s ease; }
.vn-op-gesture span { position: absolute; left: 0; top: 50%; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; background: var(--c-accent); animation: vn-op-swipe 1.9s ease-in-out infinite; }
.vn-op[data-stage="3"] .vn-op-gesture { transform: scaleX(-1); }

/* Aiguille posée : la platine et le bras s'effacent pendant que le disque
   rejoint le héro, puis l'écran disparaît. */
.vn-op.is-open { pointer-events: none; opacity: 0; transition: opacity .8s ease 2.15s; }
.vn-op.is-open .vn-op-ui { opacity: 0; }
.vn-op.is-open .vn-op-tt, .vn-op.is-open .vn-op-armslot { opacity: 0; transition: opacity .5s ease 1.05s; }
.vn-op.is-open .vn-op-room { opacity: 0; transition: opacity .9s ease 1.3s; }

@keyframes vn-op-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes vn-op-swipe {
  0% { transform: translateX(0); opacity: 0; } 15% { opacity: 1; }
  70% { transform: translateX(26px); opacity: 1; } 100% { transform: translateX(26px); opacity: 0; }
}
@keyframes vn-op-ripple { from { opacity: .8; transform: scale(1); } to { opacity: 0; transform: scale(1.45); } }
@keyframes vn-op-flicker { 0%, 100% { opacity: 1; } 48% { opacity: .82; } 50% { opacity: .95; } 53% { opacity: .78; } }
@keyframes vn-op-dust {
  0% { opacity: 0; transform: translate(0, 0); }
  30% { opacity: .7; }
  70% { opacity: .5; }
  100% { opacity: 0; transform: translate(18px, -40px); }
}
@media (prefers-reduced-motion: reduce) {
  .vn-op *, .vn-op::before { animation: none !important; transition: none !important; }
}
`;

const OPENING_JS = `
(function () {
  var op = document.querySelector('.vn-op[data-opening]');
  if (!op) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var inner = op.querySelector('.vn-op-inner');
  var ui = op.querySelector('.vn-op-ui');
  var zoom = op.querySelector('.vn-op-zoom');
  var discBox = op.querySelector('.vn-op-disc .vn-disc');
  var spin = op.querySelector('.vn-op-disc [data-spin]');
  var cta = op.querySelector('[data-op-next]');
  var hint = op.querySelector('[data-hint]');
  var speed = (op.getAttribute('data-rpm') === '45' ? 45 : 33.33) * 6 / 1000;
  var s = { p1: 0, q: 0, p2: 0 };
  var stage = 1, finished = false, frameId = 0, drag = null;

  // Angle du disque partagé avec le script de la page : le disque du héro
  // reprend exactement où celui-ci s'arrête.
  var deck = window.__vnDeck || (window.__vnDeck = { angle: 0 });
  deck.opening = true;

  // La plateforme lance la musique au premier clic sur l'écran d'ouverture ;
  // ici, elle doit attendre que l'aiguille se pose.
  function swallow(e) { e.stopPropagation(); }
  inner.addEventListener('click', swallow);
  ui.addEventListener('click', swallow);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function set(name, value) { op.style.setProperty(name, value); }

  function apply() {
    var e1 = Math.min(s.p1, 1.08), c1 = Math.min(s.p1, 1), q = s.q;
    set('--gx', lerp(0.09 - 0.45 * c1, 0, q).toFixed(4));
    set('--gs', lerp(1 - 0.25 * c1, 1, q).toFixed(4));
    set('--dx', lerp(0.16 + 0.9 * e1, 0, q).toFixed(4));
    set('--dl', (1 + 0.07 * Math.sin(Math.PI * q)).toFixed(4));
    set('--sx', (-0.7 * q).toFixed(4));
    set('--sr', (-9 * q).toFixed(2) + 'deg');
    set('--so', Math.max(0, 1 - q * 1.8).toFixed(3));
    set('--pq', Math.min(1, q * 1.4).toFixed(3));
    set('--py', (0.08 * (1 - q)).toFixed(4));
    set('--arm', (22 * Math.min(s.p2, 1.08)).toFixed(2) + 'deg');
    // Le disque roule un peu en sortant de la pochette.
    if (!finished) {
      deck.angle = -70 * e1;
      spin.style.transform = 'rotate(' + deck.angle.toFixed(2) + 'deg)';
    }
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeBack(t) { var c = 1.3; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  function tween(key, to, duration, ease, done) {
    cancelAnimationFrame(frameId);
    var from = s[key], start = null;
    function step(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      s[key] = from + (to - from) * ease(t);
      apply();
      if (t < 1) frameId = requestAnimationFrame(step);
      else if (done) done();
    }
    frameId = requestAnimationFrame(step);
  }

  function setHint(text) {
    if (!hint) return;
    hint.classList.add('is-swapping');
    setTimeout(function () { hint.textContent = text; hint.classList.remove('is-swapping'); }, 220);
  }

  function setStage(value) {
    stage = value;
    op.setAttribute('data-stage', String(value));
  }

  // Étape 2 : la pochette s'efface, le disque se pose sur la platine.
  function land() {
    setStage(2);
    setHint('Posez l\\u2019aiguille');
    tween('q', 1, reduce ? 1 : 1050, easeInOut, function () { setStage(3); });
  }

  /** Grésillement synthétisé : pas de fichier, rien avant le geste. */
  function crackle(delay) {
    if (op.getAttribute('data-crackle') !== '1') return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      var ctx = new AC();
      if (ctx.resume) ctx.resume();
      var rate = ctx.sampleRate, seconds = 2.8, length = Math.floor(rate * seconds);
      var buffer = ctx.createBuffer(1, length, rate), data = buffer.getChannelData(0);
      var pop = 0;
      for (var i = 0; i < length; i++) {
        var t = i / rate;
        var env = Math.min(1, t / 0.03) * (t > seconds - 1.2 ? Math.max(0, (seconds - t) / 1.2) : 1);
        if (Math.random() < 0.00035) pop = (Math.random() * 0.7 + 0.3) * (Math.random() < 0.5 ? -1 : 1);
        pop *= 0.86;
        var hiss = (Math.random() * 2 - 1) * 0.02;
        var thump = t < 0.2 ? Math.sin(2 * Math.PI * 52 * t) * Math.exp(-t * 22) * 0.6 : 0;
        data[i] = (hiss + pop) * env + thump;
      }
      var source = ctx.createBufferSource();
      source.buffer = buffer;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 5200;
      var gain = ctx.createGain();
      gain.gain.value = 0.3;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime + delay);
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, (delay + seconds + 0.5) * 1000);
    } catch (e) {}
  }

  /** Le disque prend sa vitesse, puis tourne jusqu'au retrait de l'écran. */
  function spinUp() {
    var start = null, last = null;
    function step(now) {
      if (!op.isConnected) { deck.opening = false; return; }
      if (start === null) { start = now; last = now; }
      var ramp = easeOut(Math.min(1, (now - start) / 900));
      deck.angle += speed * ramp * (now - last);
      last = now;
      spin.style.transform = 'rotate(' + (deck.angle % 360).toFixed(2) + 'deg)';
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /** Le disque rejoint la place exacte du disque du héro. */
  function aimZoom() {
    var target = document.querySelector('[data-hero-disc]');
    if (!target) return;
    var from = discBox.getBoundingClientRect();
    var box = zoom.getBoundingClientRect();
    var r = target.getBoundingClientRect();
    var cx = from.left + from.width / 2, cy = from.top + from.height / 2;
    zoom.style.transformOrigin = (cx - box.left).toFixed(1) + 'px ' + (cy - box.top).toFixed(1) + 'px';
    zoom.style.transform = 'translate(' + (r.left + r.width / 2 - cx).toFixed(1) + 'px,' + (r.top + r.height / 2 - cy).toFixed(1) + 'px) scale(' + (r.width / from.width).toFixed(4) + ')';
  }

  // Étape 3 : l'aiguille se pose. Appelé pendant le geste de l'invité.
  function drop() {
    if (finished) return;
    finished = true;
    if (window.startInvitationMusic) window.startInvitationMusic();
    crackle(reduce ? 0 : 0.42);
    if (window.openInvitation) window.openInvitation();
    if (reduce) { s.p1 = 1; s.q = 1; s.p2 = 1; apply(); return; }
    op.classList.add('is-dropped');
    tween('p2', 1, 420, easeOut, spinUp);
    setTimeout(aimZoom, 1100);
  }

  function advance() {
    if (finished) return;
    if (reduce) { s.p1 = 1; s.q = 1; apply(); drop(); return; }
    if (stage === 1) tween('p1', 1, 720, easeBack, land);
    else if (stage === 3) drop();
  }

  cta.addEventListener('click', advance);

  op.addEventListener('pointerdown', function (e) {
    if (finished || drag || stage === 2 || (e.button !== undefined && e.button > 0)) return;
    if (e.target.closest('[data-op-next]')) return;
    cancelAnimationFrame(frameId);
    var key = stage === 1 ? 'p1' : 'p2';
    drag = {
      id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, key: key,
      from: s[key], range: discBox.getBoundingClientRect().width * (stage === 1 ? 0.95 : 0.55),
      last: s[key], lastTime: e.timeStamp, speed: 0
    };
    // Capture sur le conteneur intérieur : le clic qui suit le geste y
    // aboutit, et n'atteint pas l'écran (voir swallow).
    if (inner.setPointerCapture) { try { inner.setPointerCapture(e.pointerId); } catch (err) {} }
    op.classList.add('is-dragging');
  });

  op.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) + Math.abs(e.clientY - drag.y) > 6) drag.moved = true;
    if (!drag.moved) return;
    // Premier geste vers la droite, second (le bras) vers la gauche.
    var value = drag.from + (drag.key === 'p1' ? dx : -dx) / drag.range;
    value = value < 0 ? 0 : value > 1 ? 1 + (value - 1) * 0.15 : value;
    var dt = Math.max(1, e.timeStamp - drag.lastTime);
    drag.speed = (value - drag.last) / dt;
    drag.last = value;
    drag.lastTime = e.timeStamp;
    s[drag.key] = value;
    apply();
  });

  function release(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var current = drag;
    drag = null;
    op.classList.remove('is-dragging');
    if (!current.moved) { advance(); return; }
    var value = s[current.key];
    var fling = current.speed > 0.0012;
    if (value > 0.4 || fling) {
      if (current.key === 'p1') tween('p1', 1, 520, easeBack, land);
      else drop();
    } else {
      tween(current.key, 0, 420, easeOut);
    }
  }
  op.addEventListener('pointerup', release);
  op.addEventListener('pointercancel', release);

  op.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target === cta) return;
      e.preventDefault();
      advance();
    }
  });

  apply();
})();
`;
