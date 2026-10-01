import { escapeHtml } from "@/lib/invitation/html";
import {
  airportCode,
  flightInfo,
  passCode,
  plane,
} from "@/lib/invitation/designs/boarding/markup";

/**
 * Écran d'ouverture du design Embarquement : une carte d'embarquement au nom
 * de l'invité, dans un terminal de nuit.
 *
 * L'invité détache le talon (glisser vers la droite, ou vers le bas quand la
 * carte est verticale sur un téléphone). Le talon tombe, le code de la carte
 * passe au lecteur (bip), puis la carte s'envole vers l'écran : derrière, le
 * tableau des départs du héro fait claquer ses palettes.
 *
 * Un toucher, ou le bouton, détache le talon d'un geste. L'écran porte
 * `data-opening-manual` : il appelle lui-même `window.openInvitation()` au
 * moment où le talon se détache, pendant le geste de l'invité, pour que la
 * musique et les sons aient le droit de démarrer.
 *
 * Les deux parties de la carte ont des bords dentelés complémentaires : collées,
 * elles dessinent la ligne de perforation ; séparées, la déchirure.
 */

/** Durées (ms), alignées sur les transitions du CSS ci-dessous. */
const REVEAL_DELAY = 1500;
const REMOVE_DELAY = 2300;

/** Profondeur des dents de la perforation. */
const TOOTH = "4px";
const TEETH = 24;

/** Bord dentelé : `side` = right | left (carte horizontale), bottom | top (verticale). */
function zigzag(side) {
  const points = [];
  for (let k = 0; k <= TEETH; k++) {
    const at = `${((k / TEETH) * 100).toFixed(2)}%`;
    const out = k % 2 === 0;
    if (side === "right") points.push(`${out ? "100%" : `calc(100% - ${TOOTH})`} ${at}`);
    if (side === "left") points.push(`${out ? TOOTH : "0"} ${at}`);
    if (side === "bottom") points.unshift(`${at} ${out ? "100%" : `calc(100% - ${TOOTH})`}`);
    if (side === "top") points.push(`${at} ${out ? TOOTH : "0"}`);
  }
  if (side === "right") return `polygon(0 0, ${points.join(", ")}, 0 100%)`;
  if (side === "left") return `polygon(${points.join(", ")}, 100% 100%, 100% 0)`;
  if (side === "bottom") return `polygon(0 0, 100% 0, ${points.join(", ")})`;
  return `polygon(${points.join(", ")}, 100% 100%, 0 100%)`;
}

export function renderBoardingOpening({ style, content, details, eventDate }) {
  const { opening } = content;
  const date = details.find((item) => item.key === "date");
  const time = details.find((item) => item.key === "time");
  const location = details.find((item) => item.key === "location");
  const { flight, gate } = flightInfo(eventDate);
  const destination = location?.value || content.hero.title || "";
  const destinationCode = destination ? airportCode(destination) : "{{MONOGRAM}}";
  const passenger = opening.title ? escapeHtml(opening.title) : "";

  const field = (label, value, className = "") =>
    `<span class="bd-pf ${className}"><span class="bd-pf-label">${label}</span><span class="bd-pf-value">${value}</span></span>`;

  const lights = Array.from(
    { length: 9 },
    (_, index) =>
      `<i style="--x:${(index * 41) % 100}%;--y:${(index * 23) % 70}%;--s:${40 + ((index * 37) % 90)}px;--t:${7 + (index % 4) * 2}s;--dl:${-(index * 1.7).toFixed(1)}s"></i>`,
  ).join("");
  const runway = Array.from({ length: 14 }, (_, index) => `<i style="--k:${index}"></i>`).join("");

  const html = `<div class="bd-op" data-opening data-opening-manual data-reveal-delay="${REVEAL_DELAY}" data-remove-delay="${REMOVE_DELAY}" data-sounds="${style.sounds ? "1" : "0"}" role="dialog" aria-modal="true" aria-label="Carte d'embarquement : détachez le talon pour ouvrir l'invitation">
<span class="bd-op-lights" aria-hidden="true">${lights}</span>
<span class="bd-op-runway" aria-hidden="true">${runway}</span>
<div class="bd-op-inner" aria-hidden="true">
  <div class="bd-pass" data-pass>
    <div class="bd-pass-main">
      <div class="bd-pass-band">
        <span class="bd-pass-logo">{{MONOGRAM}}</span>
        <span class="bd-pass-airline">${escapeHtml(opening.eyebrow || "Carte d'embarquement")}</span>
        <span class="bd-pass-kind">Boarding pass</span>
      </div>
      <div class="bd-pass-body">
        <div class="bd-pass-route">
          <span class="bd-pass-city"><span class="bd-pass-iata">ICI</span><span class="bd-pass-cityname">Chez vous</span></span>
          <span class="bd-pass-path">${plane()}</span>
          <span class="bd-pass-city"><span class="bd-pass-iata">${destinationCode}</span><span class="bd-pass-cityname">${escapeHtml(destination) || "{{EVENT_TITLE}}"}</span></span>
        </div>
        <div class="bd-pass-fields">
          ${passenger ? field("Passager", passenger, "bd-pf--wide") : ""}
          ${field("Vol", flight)}
          ${date ? field("Date", escapeHtml(date.value)) : ""}
          ${time ? field("Embarquement", escapeHtml(time.value)) : ""}
          ${field("Porte", gate)}
          ${field("Classe", "Invité d'honneur", "bd-pf--class")}
        </div>
        <div class="bd-pass-scan">${passCode(5)}<span class="bd-pass-beam"></span><span class="bd-pass-ok">✓</span></div>
      </div>
    </div>
    <div class="bd-pass-stub" data-stub>
      <div class="bd-pass-stub-inner">
        <span class="bd-pass-stub-kind">Talon</span>
        ${passenger ? field("Passager", passenger) : ""}
        ${field("Vol", flight)}
        ${field("Porte", gate)}
        <span class="bd-pass-bars"></span>
      </div>
    </div>
  </div>
</div>
<div class="bd-op-ui">
  <button type="button" class="bd-op-cta" data-op-next>
    <span class="bd-op-gesture" aria-hidden="true"><span></span></span>
    <span>${escapeHtml(opening.hint || "Détachez le talon")}</span>
  </button>
</div>
</div>`;

  return { html, css: OPENING_CSS, js: OPENING_JS };
}

const OPENING_CSS = `
.bd-op {
  --tear: 0;
  position: fixed; inset: 0; z-index: 2147483000; overflow: hidden; display: grid; place-items: center;
  background: radial-gradient(120% 90% at 50% 38%, #1a2336, #07090e 72%);
  color: var(--c-text); font-family: var(--f-body);
  touch-action: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; cursor: grab;
}
.bd-op.is-dragging { cursor: grabbing; }

/* Le terminal : des lumières floues et les feux de piste qui défilent. */
.bd-op-lights { position: absolute; inset: 0; pointer-events: none; }
.bd-op-lights i {
  position: absolute; left: var(--x); top: var(--y); width: var(--s); height: var(--s); border-radius: 50%; opacity: .22;
  background: radial-gradient(circle, color-mix(in srgb, var(--c-accent2) 55%, #fff) 0, transparent 70%);
  animation: bd-op-drift var(--t) ease-in-out var(--dl) infinite alternate;
}
.bd-op-runway { position: absolute; left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(5.5rem, 15vh, 8rem)); display: flex; justify-content: space-between; padding: 0 6vw; pointer-events: none; }
.bd-op-runway i { width: 6px; height: 6px; border-radius: 50%; background: #ffd27a; opacity: .18; animation: bd-op-runway 1.6s linear infinite; animation-delay: calc(var(--k) * .1s); }

.bd-op-inner { position: absolute; inset: 0; display: grid; place-items: center; padding: 0 16px; }
.bd-pass {
  --pw: min(90vw, 660px, 150vh);
  --pw: min(90vw, 660px, 150svh);
  position: relative; display: grid; grid-template-columns: minmax(0, 1fr) 27%; width: var(--pw); aspect-ratio: 2.35;
  margin-top: -6vh; filter: drop-shadow(0 30px 34px rgb(0 0 0 / .55));
  transition: transform .8s cubic-bezier(.6, 0, .3, 1), opacity .7s ease, filter .7s ease;
}
.bd-pass-main, .bd-pass-stub { position: relative; container-type: inline-size; background: var(--c-card); color: var(--c-text); }
.bd-pass-main { display: flex; flex-direction: column; border-radius: 16px 0 0 16px; clip-path: ${zigzag("right")}; }
.bd-pass-stub {
  margin-left: -${TOOTH}; border-radius: 0 16px 16px 0;
  clip-path: ${zigzag("left")};
  transform: translate(calc(var(--tear) * 70px), calc(var(--tear) * 6px)) rotate(calc(var(--tear) * 7deg)); transform-origin: 100% 100%;
  transition: transform .25s ease;
}
.bd-op.is-dragging .bd-pass-stub { transition: none; }
.bd-pass-stub-inner { display: flex; flex-direction: column; gap: 4.5cqw; height: 100%; padding: 9cqw 8cqw 8cqw 10cqw; }
.bd-pass-band { display: flex; align-items: center; gap: 2.4cqw; padding: 3.4cqw 4.4cqw; background: var(--c-accent); color: var(--c-card); }
.bd-pass-logo { display: grid; place-items: center; flex: none; width: 7cqw; height: 7cqw; border-radius: 50%; border: .35cqw solid currentColor; font-family: var(--f-heading); font-size: 2.3cqw; white-space: nowrap; }
.bd-pass-airline { flex: 1; min-width: 0; font-family: var(--f-heading); font-size: 3.1cqw; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bd-pass-kind { font-family: var(--f-mono); font-size: 1.7cqw; letter-spacing: .2em; text-transform: uppercase; opacity: .85; }
.bd-pass-body {
  position: relative; flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: auto 1fr; gap: 3cqw 4cqw; padding: 4cqw 4.4cqw;
}
.bd-pass-body::before { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: var(--noise); opacity: .35; }
.bd-pass-route { grid-column: 1 / -1; display: flex; align-items: center; gap: 3cqw; }
.bd-pass-city { display: flex; flex-direction: column; min-width: 0; }
.bd-pass-city:last-child { text-align: right; }
.bd-pass-iata { font-family: var(--f-mono); font-size: 8.4cqw; font-weight: 500; line-height: 1; letter-spacing: .02em; white-space: nowrap; }
.bd-pass-cityname { font-family: var(--f-mono); font-size: 1.7cqw; letter-spacing: .14em; text-transform: uppercase; color: color-mix(in srgb, var(--c-text) 60%, var(--c-card)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bd-pass-path { position: relative; flex: 1; display: grid; place-items: center; height: 2px; background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--c-text) 35%, transparent) 0 5px, transparent 5px 10px); }
.bd-pass-path svg { width: 5cqw; height: 5cqw; padding: .6cqw; fill: var(--c-accent); background: var(--c-card); transform: rotate(90deg); }
.bd-pass-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2.4cqw 3cqw; align-content: start; }
.bd-pf { display: flex; flex-direction: column; gap: .6cqw; min-width: 0; }
.bd-pf--wide { grid-column: 1 / -1; }
.bd-pf-label { font-family: var(--f-mono); font-size: 1.55cqw; letter-spacing: .16em; text-transform: uppercase; color: color-mix(in srgb, var(--c-text) 55%, var(--c-card)); }
.bd-pf-value { font-family: var(--f-mono); font-size: 2.7cqw; font-weight: 500; line-height: 1.15; text-transform: uppercase; overflow-wrap: anywhere; }
.bd-pass-stub .bd-pf-label { font-size: 5cqw; }
.bd-pass-stub .bd-pf-value { font-size: 8cqw; }
.bd-pass-stub-kind { font-family: var(--f-mono); font-size: 5.2cqw; letter-spacing: .2em; text-transform: uppercase; color: var(--c-accent); }
.bd-pass-bars { margin-top: auto; height: 12cqw; background: repeating-linear-gradient(90deg, var(--c-text) 0 1px, transparent 1px 3px, var(--c-text) 3px 5px, transparent 5px 6px, var(--c-text) 6px 7px, transparent 7px 10px); opacity: .75; }
.bd-pass-scan { position: relative; align-self: end; width: 15cqw; padding: 1.2cqw; border-radius: 1.2cqw; background: #fff; overflow: hidden; }
.bd-pass-scan .bd-code { display: block; width: 100%; height: auto; fill: #111; }
.bd-pass-beam { position: absolute; left: 0; right: 0; top: 0; height: 3px; opacity: 0; background: #2ee88a; box-shadow: 0 0 10px 2px rgb(46 232 138 / .75); }
.bd-pass-ok { position: absolute; inset: 0; display: grid; place-items: center; font-size: 9cqw; color: #fff; background: rgb(46 200 120 / .9); opacity: 0; transform: scale(.6); transition: opacity .25s ease, transform .35s cubic-bezier(.3, 1.6, .5, 1); }

/* Bouton et indication du geste. */
.bd-op-ui {
  position: absolute; left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(1.25rem, 6vh, 3rem));
  display: flex; justify-content: center; padding: 0 16px; pointer-events: none; transition: opacity .3s ease;
}
.bd-op-cta {
  pointer-events: auto; display: inline-flex; align-items: center; gap: .9rem; min-height: 48px; padding: .75rem 1.35rem; border-radius: 999px; cursor: pointer;
  border: 1px solid rgb(255 255 255 / .18); background: rgb(255 255 255 / .08); color: #fff;
  font-family: var(--f-mono); font-size: .74rem; letter-spacing: .16em; text-transform: uppercase;
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  animation: bd-op-in 1s ease .8s both;
}
.bd-op-cta:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.bd-op-gesture { position: relative; flex: none; width: 34px; height: 2px; border-radius: 2px; background: rgb(255 255 255 / .25); }
.bd-op-gesture span { position: absolute; left: 0; top: 50%; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; background: var(--c-accent); animation: bd-op-swipe 1.9s ease-in-out infinite; }

/* Talon détaché : il tombe, la carte passe au lecteur puis s'envole. */
.bd-op.is-torn .bd-pass-stub { transform: translate(140px, 120vh) rotate(32deg); transition: transform 1.1s cubic-bezier(.5, 0, .8, .4); }
.bd-op.is-torn .bd-pass { transform: translateX(13.5%); }
.bd-op.is-scanning .bd-pass-beam { animation: bd-op-scan .38s ease-in-out 2 alternate; }
.bd-op.is-scanned .bd-pass-ok { opacity: 1; transform: none; }
.bd-op.is-flying .bd-pass { transform: translateX(13.5%) scale(2.6); opacity: 0; filter: blur(6px) drop-shadow(0 30px 34px rgb(0 0 0 / .55)); transition-duration: .8s; }
.bd-op.is-open { pointer-events: none; opacity: 0; transition: opacity .7s ease 1.5s; }
.bd-op.is-open .bd-op-ui { opacity: 0; }

/* Téléphone en portrait : carte verticale, talon en bas. */
@media (max-width: 639px) and (orientation: portrait) {
  .bd-pass { --pw: min(86vw, 360px, 40vh); --pw: min(86vw, 360px, 40svh); grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) 21%; aspect-ratio: .52; margin-top: -4vh; }
  .bd-pass-main { border-radius: 16px 16px 0 0; clip-path: ${zigzag("bottom")}; }
  .bd-pass-stub {
    margin-left: 0; margin-top: -${TOOTH}; border-radius: 0 0 16px 16px; clip-path: ${zigzag("top")};
    transform: translate(calc(var(--tear) * 6px), calc(var(--tear) * 60px)) rotate(calc(var(--tear) * -5deg)); transform-origin: 0 100%;
  }
  .bd-pass-stub-inner { flex-direction: row; flex-wrap: wrap; align-content: center; gap: 3cqw 7cqw; padding: 6cqw 7cqw; }
  .bd-pass-stub-kind { width: 100%; font-size: 3.6cqw; }
  .bd-pass-stub .bd-pf-label { font-size: 3cqw; }
  .bd-pass-stub .bd-pf-value { font-size: 4.6cqw; }
  .bd-pass-bars { display: none; }
  .bd-pass-band { padding: 5cqw 6cqw; gap: 3.4cqw; }
  .bd-pass-logo { width: 11cqw; height: 11cqw; font-size: 3.6cqw; }
  .bd-pass-airline { font-size: 5cqw; }
  .bd-pass-kind { display: none; }
  .bd-pass-body { grid-template-columns: 1fr; grid-template-rows: auto auto 1fr; gap: 4.5cqw; padding: 6cqw; }
  .bd-pf--class { display: none; }
  .bd-pass-iata { font-size: 15cqw; }
  .bd-pass-cityname { font-size: 3cqw; }
  .bd-pass-path svg { width: 9cqw; height: 9cqw; }
  .bd-pass-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4.5cqw 5cqw; }
  .bd-pf-label { font-size: 2.9cqw; }
  .bd-pf-value { font-size: 4.6cqw; }
  .bd-pass-scan { justify-self: center; width: 24cqw; padding: 2cqw; }
  .bd-pass-ok { font-size: 16cqw; }
  .bd-op-gesture { transform: rotate(90deg); }
  .bd-op.is-torn .bd-pass-stub { transform: translate(-40px, 110vh) rotate(-24deg); }
  .bd-op.is-torn .bd-pass { transform: translateY(8%); }
  .bd-op.is-flying .bd-pass { transform: translateY(8%) scale(2.4); }
}

/* Écrans très bas (téléphone à l'horizontale) : carte plus petite, plus haut. */
@media (max-height: 480px) and (orientation: landscape) {
  .bd-pass { --pw: min(80vw, 125vh); --pw: min(80vw, 125svh); margin-top: -14vh; }
  .bd-op-runway { display: none; }
}

@keyframes bd-op-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes bd-op-swipe {
  0% { transform: translateX(0); opacity: 0; } 15% { opacity: 1; }
  70% { transform: translateX(26px); opacity: 1; } 100% { transform: translateX(26px); opacity: 0; }
}
@keyframes bd-op-drift { from { transform: translate(0, 0); } to { transform: translate(24px, -18px); } }
@keyframes bd-op-runway { 0%, 100% { opacity: .15; } 8% { opacity: 1; } 20% { opacity: .15; } }
@keyframes bd-op-scan { from { top: 0; opacity: 1; } to { top: calc(100% - 3px); opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .bd-op *, .bd-op { animation: none !important; transition: none !important; }
}
`;

const OPENING_JS = `
(function () {
  var op = document.querySelector('.bd-op[data-opening]');
  if (!op) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vertical = window.matchMedia && window.matchMedia('(max-width: 639px) and (orientation: portrait)');
  var pass = op.querySelector('[data-pass]');
  var cta = op.querySelector('[data-op-next]');
  var tear = 0, torn = false, frameId = 0, drag = null;

  /**
   * Sons de l'aéroport, synthétisés (aucun fichier) et seulement après un
   * geste de l'invité : bip du lecteur, claquement des palettes, carillon.
   * Le script de la page les retrouve dans window.__bdSound.
   */
  function setupSounds() {
    if (op.getAttribute('data-sounds') !== '1' || window.__bdSound) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      var ctx = new AC();
      if (ctx.resume) ctx.resume();
      var noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.012), ctx.sampleRate);
      var data = noise.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
      var tone = function (frequency, start, duration, volume) {
        var osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration + 0.05);
      };
      var lastClick = 0;
      window.__bdSound = {
        beep: function (delay) { tone(1568, ctx.currentTime + (delay || 0), 0.14, 0.12); },
        chime: function () { var t = ctx.currentTime; tone(880, t, 1.2, 0.07); tone(698.5, t + 0.45, 1.4, 0.07); },
        click: function () {
          var now = ctx.currentTime;
          if (now - lastClick < 0.018) return;
          lastClick = now;
          var source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
          source.buffer = noise;
          filter.type = 'highpass';
          filter.frequency.value = 1800;
          gain.gain.value = 0.05 + Math.random() * 0.04;
          source.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          source.start(now);
        }
      };
    } catch (e) {}
  }

  function apply() { op.style.setProperty('--tear', Math.min(tear, 1.1).toFixed(3)); }

  // Le talon se détache : appelé pendant le geste de l'invité.
  function detach() {
    if (torn) return;
    torn = true;
    cancelAnimationFrame(frameId);
    if (window.startInvitationMusic) window.startInvitationMusic();
    setupSounds();
    if (window.openInvitation) window.openInvitation();
    if (reduce) return;
    op.classList.add('is-torn');
    setTimeout(function () {
      op.classList.add('is-scanning');
      if (window.__bdSound) window.__bdSound.beep(0.42);
    }, 380);
    setTimeout(function () { op.classList.add('is-scanned'); }, 820);
    setTimeout(function () { op.classList.add('is-flying'); }, 1050);
  }

  /** Un toucher : le talon s'écarte un peu, puis se détache. */
  function advance() {
    if (torn) return;
    if (reduce) { detach(); return; }
    var start = null, from = tear;
    cancelAnimationFrame(frameId);
    (function step(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / 260);
      tear = from + (0.7 - from) * (1 - Math.pow(1 - t, 3));
      apply();
      if (t < 1) frameId = requestAnimationFrame(step);
    })(performance.now());
    detach();
  }

  cta.addEventListener('click', advance);

  op.addEventListener('pointerdown', function (e) {
    if (torn || drag || (e.button !== undefined && e.button > 0)) return;
    if (e.target.closest('[data-op-next]')) return;
    cancelAnimationFrame(frameId);
    var box = pass.getBoundingClientRect();
    drag = {
      id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, from: tear,
      range: (vertical && vertical.matches ? box.height : box.width) * 0.35,
      last: tear, lastTime: e.timeStamp, speed: 0
    };
    if (op.setPointerCapture) { try { op.setPointerCapture(e.pointerId); } catch (err) {} }
    op.classList.add('is-dragging');
  });

  op.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    if (!drag.moved) return;
    var delta = vertical && vertical.matches ? dy : dx;
    var value = drag.from + delta / drag.range;
    value = value < 0 ? 0 : value > 1 ? 1 + (value - 1) * 0.2 : value;
    var dt = Math.max(1, e.timeStamp - drag.lastTime);
    drag.speed = (value - drag.last) / dt;
    drag.last = value;
    drag.lastTime = e.timeStamp;
    tear = value;
    apply();
    if (tear >= 1) release(e);
  });

  function release(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var current = drag;
    drag = null;
    op.classList.remove('is-dragging');
    if (!current.moved) { advance(); return; }
    if (tear > 0.45 || current.speed > 0.0015) detach();
    else { tear = 0; apply(); }
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
})();
`;
