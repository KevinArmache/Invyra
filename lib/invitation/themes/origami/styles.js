/**
 * CSS du thème Origami (page de l'invitation ; l'ouverture a le sien, voir
 * opening.js).
 *
 * Règle d'or : l'état par défaut est l'état final, à plat et lisible. Les
 * états « pliés » n'existent que sous `html.fx`, posée par le script du
 * thème, qui les déplie ensuite. Sans script (vignettes) ou avec « réduire
 * les animations », l'invitation est complète.
 */

/**
 * Grain du papier : bruit SVG statique, rastérisé une fois par le
 * navigateur puis répété. Son intensité suit le réglage « Grain du papier ».
 */
const NOISE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>" +
  "<filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.2 -.52'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>";

export const NOISE = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

export const css = `
:root {
  --noise: ${NOISE};
  --ink: color-mix(in srgb, var(--c-text) 90%, var(--c-accent));
  --muted: color-mix(in srgb, var(--c-text) 62%, var(--c-card));
  --line: color-mix(in srgb, var(--c-text) 14%, transparent);
  --paper-2: color-mix(in srgb, var(--c-card) 95%, var(--c-text));
  --paper-3: color-mix(in srgb, var(--c-card) 90%, var(--c-text));
  --tint: color-mix(in srgb, var(--c-card) 84%, var(--c-accent));
  --press-light: color-mix(in srgb, var(--c-card) 60%, #fff);
  --press-dark: color-mix(in srgb, var(--c-text) 22%, transparent);
  --ease-out: cubic-bezier(.2, .7, .2, 1);
  --ease-fold: cubic-bezier(.65, 0, .25, 1);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--c-background); }
body {
  background: var(--c-background);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: 1.05rem;
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
/* La table sur laquelle repose le papier. */
body::before {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: var(--noise); opacity: calc(var(--texture) * .5);
}
.ori { position: relative; z-index: 1; overflow-x: hidden; }

/* Papier : couleur, grain, et un relief discret sur les bords. */
.paper, .ori-panel, .ori-letter, .ori-tag-body, .ori-replycard, .ori-card, .ori-tent {
  position: relative; isolation: isolate;
}
.paper::before, .ori-panel::before, .ori-letter::before, .ori-tag-body::before,
.ori-replycard::before, .ori-card::before, .ori-tent::before {
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background-image: var(--noise); opacity: calc(var(--texture) * .3);
}

/* Texte gaufré : clair sous la lettre, ombre au-dessus, comme imprimé à la presse. */
.ori-press {
  text-shadow: 0 1px 0 var(--press-light), 0 -1px 0 var(--press-dark);
}

/* ── Tampon ─────────────────────────────────────────── */
.ori-stamp {
  --size: 58px;
  position: relative; display: inline-grid; place-items: center; flex: none;
  width: var(--size); height: var(--size); overflow: hidden;
  border-radius: 16%; transform: rotate(-5deg);
  background: var(--c-accent); color: var(--c-card);
  box-shadow: inset 0 0 0 calc(var(--size) * .06) var(--c-accent), inset 0 0 0 calc(var(--size) * .085) color-mix(in srgb, var(--c-card) 75%, transparent);
  font-family: var(--f-heading); font-size: calc(var(--size) * .3); line-height: 1; letter-spacing: .02em;
  white-space: nowrap;
}
.ori-stamp::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: var(--noise); opacity: .55; mix-blend-mode: soft-light;
}
.ori-stamp > span { padding: 0 8%; }
.ori-stamp--small { --size: 42px; }

/* ── Héro : la feuille ──────────────────────────────── */
.ori-hero { --gap: clamp(10px, 2.2vw, 28px); padding: var(--gap); min-height: 100vh; min-height: 100svh; display: grid; }
.ori-sheet {
  display: grid; place-items: center; overflow: hidden;
  min-height: calc(100vh - 2 * var(--gap)); min-height: calc(100svh - 2 * var(--gap));
  padding: clamp(3rem, 8vh, 5.5rem) 1.25rem clamp(4.5rem, 10vh, 6rem);
  background: var(--c-card); text-align: center;
  box-shadow: 0 1px 1px rgb(0 0 0 / .06), 0 34px 60px -34px rgb(0 0 0 / .55);
  transform: perspective(1800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform .8s var(--ease-out);
}
.ori-sheet.is-tilting { transition: transform .15s linear; }
.ori-crease { position: absolute; pointer-events: none; }
.ori-crease--v { left: 50%; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: linear-gradient(90deg, var(--press-dark), var(--press-light)); opacity: .4; transform-origin: top; animation: ori-grow-y 1.8s var(--ease-fold) .1s both; }
.ori-crease--h { top: 50%; left: 0; right: 0; height: 2px; margin-top: -1px; background: linear-gradient(180deg, var(--press-dark), var(--press-light)); opacity: .4; transform-origin: left; animation: ori-grow-x 1.8s var(--ease-fold) .3s both; }
.ori-crease-diag { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; animation: ori-fade-in 2s ease .8s both; }
.ori-crease-diag path { fill: none; stroke: var(--line); stroke-width: 1; stroke-dasharray: 7 6; vector-effect: non-scaling-stroke; }
.ori-glare {
  position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .6s ease;
  background: radial-gradient(circle at var(--gx, 50%) var(--gy, 30%), rgb(255 255 255 / .22), transparent 45%);
}
.ori-sheet.is-tilting .ori-glare { opacity: 1; }
.ori-hero-content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 46rem; }
.ori-eyebrow {
  font-family: var(--f-heading); font-size: .78rem; letter-spacing: .42em; text-transform: uppercase;
  color: var(--c-accent); padding-left: .42em;
}
.ori-window { position: relative; width: min(64vw, 36vh, 380px); width: min(64vw, 36svh, 380px); aspect-ratio: 1; margin: clamp(1.25rem, 3.5vh, 2.25rem) 0 clamp(.75rem, 2.5vh, 1.5rem); }
.ori-window--empty { width: auto; aspect-ratio: auto; }
.ori-window-cut {
  position: absolute; inset: 0; overflow: hidden;
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  background: var(--paper-3);
}
.ori-window-img { position: absolute; inset: -12% 0; background-size: cover; background-position: center; will-change: transform; }
.ori-bevel { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.ori-bevel path { fill: none; stroke-width: 2; stroke-linejoin: round; }
.ori-bevel-dark { stroke: rgb(0 0 0 / .32); }
.ori-bevel-light { stroke: color-mix(in srgb, var(--press-light) 80%, transparent); }
.ori-stamp--hero { --size: clamp(50px, 13vw, 70px); position: absolute; right: 2%; top: 60%; }
.ori-window--empty .ori-stamp--hero { position: relative; right: auto; top: auto; --size: clamp(64px, 16vw, 86px); }
.ori-title {
  font-family: var(--f-script); font-weight: 400; color: var(--ink);
  font-size: clamp(2.9rem, 12.5vw, 5.8rem); line-height: 1.12; padding: 0 .2em; overflow-wrap: anywhere;
}
.ori-date { margin-top: .6rem; font-family: var(--f-heading); font-size: .86rem; letter-spacing: .3em; text-transform: uppercase; color: var(--muted); padding-left: .3em; }
.ori-scroll {
  position: absolute; left: 50%; bottom: clamp(1.25rem, 4vh, 2.25rem); width: 14px; height: 14px; margin-left: -7px;
  border-right: 1.5px solid var(--muted); border-bottom: 1.5px solid var(--muted);
}
.ori-scroll.ori-in { animation: ori-rise 1s var(--ease-out) var(--d) both, ori-bob 2.4s ease-in-out calc(var(--d) + 1s) infinite; }

/* Entrées du héro. Elles restent en pause tant que l'ouverture est fermée. */
.ori-in { animation: ori-rise 1.3s var(--ease-out) var(--d, 0s) both; }
.ori-cut { animation: ori-cut 1.4s var(--ease-fold) var(--d, 0s) both; }
.ori-press-in { animation: ori-print 1.4s var(--ease-out) var(--d, 0s) both; }
.ori-stamp-in { animation: ori-stamp 0.75s cubic-bezier(.3, 1.5, .5, 1) 1.7s both; }

/* ── Bande de papier ───────────────────────────────── */
.ori-strip { position: relative; width: min(100% - 24px, 760px); margin: clamp(1.25rem, 4vw, 2.5rem) auto 0; }
.ori-panel {
  background: var(--c-card);
  padding: clamp(3rem, 9vw, 5rem) clamp(1.25rem, 6vw, 3.75rem);
  text-align: center; transform-origin: 50% 0;
  box-shadow: 0 30px 40px -38px rgb(0 0 0 / .6);
}
/* Plis entre les panneaux, alternativement en creux et en relief. */
.ori-panel + .ori-panel::after {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: 14px; pointer-events: none;
  background: linear-gradient(180deg, color-mix(in srgb, var(--c-text) 9%, transparent), transparent);
}
.ori-panel:nth-child(even)::after {
  background: linear-gradient(180deg, color-mix(in srgb, var(--press-light) 35%, transparent), transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--c-text) 10%, transparent);
}
.ori-shade {
  position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0;
  background: linear-gradient(180deg, rgb(0 0 0 / .15), rgb(0 0 0 / .55));
}
.ori-kicker {
  display: inline-flex; align-items: center; gap: .9em;
  font-family: var(--f-heading); font-size: .76rem; letter-spacing: .4em; text-transform: uppercase;
  color: var(--c-accent); padding-left: .4em;
}
.ori-kicker::before, .ori-kicker::after { content: ""; width: 7px; height: 7px; background: var(--c-accent2); transform: rotate(45deg); }
.ori-h2 { font-family: var(--f-script); font-weight: 400; color: var(--ink); font-size: clamp(2.5rem, 10vw, 3.7rem); line-height: 1.15; margin: .35rem 0 1.5rem; }
.ori-text { max-width: 34rem; margin: 0 auto; color: color-mix(in srgb, var(--c-text) 88%, var(--c-card)); }
.ori-text p + p { margin-top: 1rem; }

/* ── Message : la pochette ─────────────────────────── */
.ori-pocket { position: relative; max-width: 31rem; margin: 0 auto; padding-top: .75rem; overflow: hidden; }
.ori-pocket-back { position: absolute; left: 0; right: 0; bottom: 0; height: 62%; background: color-mix(in srgb, var(--tint) 88%, var(--c-text)); }
.ori-letter {
  margin: 0 6%; padding: 2.4rem 1.5rem 8.75rem;
  background: var(--c-card); font-style: italic; font-size: 1.12rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / .08), 0 10px 24px -12px rgb(0 0 0 / .35);
}
.ori-letter p + p { margin-top: 1rem; }
.ori-pocket-front {
  position: absolute; left: 0; right: 0; bottom: 0; height: 7.5rem;
  background: linear-gradient(180deg, color-mix(in srgb, var(--tint) 94%, #fff), var(--tint));
  clip-path: polygon(0 0, 50% 34%, 100% 0, 100% 100%, 0 100%);
}
.ori-pocket-front::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 34%; height: 2px;
  background: linear-gradient(90deg, transparent, var(--c-accent2) 20%, var(--c-accent2) 80%, transparent); opacity: .8;
}

/* ── Compte à rebours : les chevalets ──────────────── */
.ori-countdown:not(.is-live) { display: none; }
.ori-tents { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(.5rem, 2.5vw, 1rem); max-width: 31rem; margin: 1.5rem auto 0; perspective: 800px; }
.ori-tent {
  padding: 1.05rem .2rem .75rem; border-radius: 3px; transform-origin: 50% 100%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--c-card) 88%, #fff) 0 50%, var(--paper-3) 50% 100%);
  box-shadow: 0 12px 16px -12px rgb(0 0 0 / .5);
}
.ori-tent::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: color-mix(in srgb, var(--c-text) 16%, transparent); }
.ori-tent-num { display: block; font-family: var(--f-heading); font-size: clamp(1.7rem, 8vw, 2.6rem); line-height: 1.15; color: var(--c-accent); font-variant-numeric: tabular-nums; }
.ori-tent-num.flip { animation: ori-flip .55s var(--ease-out); }
.ori-tent-label { display: block; font-size: .64rem; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
.ori-cd-done { font-family: var(--f-script); font-size: 2.6rem; color: var(--c-accent); }
.ori-countdown:has(.ori-cd-done:not([hidden])) .ori-tents { display: none; }

/* ── Infos pratiques : les coins cornés ────────────── */
.ori-cards { list-style: none; display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr)); max-width: 44rem; margin: 0 auto; }
.ori-card {
  --ear: 26px;
  display: flex; flex-direction: column; align-items: center; gap: .3rem;
  padding: 1.35rem .8rem 1.2rem; background: var(--paper-2);
  box-shadow: 0 12px 22px -18px rgb(0 0 0 / .6);
}
.ori-icon { width: 38px; height: 38px; margin-bottom: .3rem; fill: none; stroke: var(--c-accent); stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.ori-card-label { font-family: var(--f-heading); font-size: .68rem; letter-spacing: .3em; text-transform: uppercase; color: var(--muted); padding-left: .3em; }
.ori-card-value { font-size: 1rem; line-height: 1.45; overflow-wrap: break-word; hyphens: auto; }
.ori-ear { display: none; }

/* ── Chapitres ─────────────────────────────────────── */
.ori-split { display: grid; gap: 2rem; }
.ori-frame {
  position: relative; width: min(100%, 420px); aspect-ratio: 4 / 5; margin: 0 auto; overflow: hidden;
  background: var(--paper-3);
}
.ori-frame::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  box-shadow: inset 0 3px 6px rgb(0 0 0 / .35), inset 0 -1px 0 var(--press-light);
}
.ori-frame-img { position: absolute; inset: -10% 0; background-size: cover; background-position: center; will-change: transform; }

/* Programme : l'accordéon. */
.ori-accordion { list-style: none; max-width: 31rem; margin: 0 auto; text-align: left; perspective: 1000px; perspective-origin: 50% 20%; }
.ori-fold {
  position: relative; display: grid; grid-template-columns: minmax(3.6rem, auto) auto 1fr; align-items: center; gap: .9rem;
  min-height: 4.2rem; padding: .75rem 1.1rem; transform-origin: 50% 0;
  background: var(--paper-2);
}
.ori-fold:nth-child(even) { background: var(--paper-3); }
.ori-fold + .ori-fold { box-shadow: inset 0 1px 0 color-mix(in srgb, var(--c-text) 10%, transparent); }
.ori-fold::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: #000; opacity: var(--sh, 0); }
.ori-fold-time { font-family: var(--f-heading); font-size: 1.05rem; letter-spacing: .06em; color: var(--c-accent); font-variant-numeric: tabular-nums; }
.ori-fold-dot { width: 8px; height: 8px; background: var(--c-accent2); transform: rotate(45deg); }
.ori-fold-label { line-height: 1.4; }

/* Lieu : le volet. */
.ori-gate { position: relative; width: min(100%, 460px); aspect-ratio: 4 / 3; margin: 0 auto; perspective: 1200px; }
.ori-gate-photo { position: absolute; inset: 0; background-size: cover; background-position: center; box-shadow: 0 24px 40px -28px rgb(0 0 0 / .6); }
.ori-gate-door { display: none; }
.ori-tab-wrap { margin-top: 1.6rem; }
.ori-tab {
  display: inline-block; padding: .8rem 1.9rem .8rem 1.2rem;
  font-family: var(--f-heading); font-size: .76rem; letter-spacing: .22em; text-transform: uppercase; text-decoration: none;
  color: var(--c-card); background: var(--c-accent);
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
  transition: transform .35s var(--ease-out), background .35s;
}
.ori-tab:hover, .ori-tab:focus-visible { transform: translateX(5px); background: color-mix(in srgb, var(--c-accent) 85%, #000); }

/* Dress code : l'étiquette. */
.ori-tag-wrap { display: flex; justify-content: center; }
.ori-tag { position: relative; width: min(100%, 22rem); padding-top: 3.25rem; transform-origin: 50% 0; }
.ori-tag-string { position: absolute; left: 50%; top: 0; width: 1px; height: 3.9rem; background: color-mix(in srgb, var(--c-text) 45%, transparent); }
.ori-tag-body {
  padding: 2.6rem 1.6rem 1.9rem; background: var(--tint);
  clip-path: polygon(16% 0, 84% 0, 100% 14%, 100% 100%, 0 100%, 0 14%);
}
.ori-tag-hole {
  position: absolute; left: 50%; top: .9rem; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%;
  background: var(--c-card); box-shadow: inset 0 1px 2px rgb(0 0 0 / .35);
}

/* Galerie : l'album. */
.ori-album { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(1rem, 3.5vw, 1.6rem); max-width: 42rem; margin: 0 auto; }
.ori-photo { position: relative; padding: 6px; background: #fff; transform: rotate(var(--r, 0deg)); box-shadow: 0 12px 20px -14px rgb(0 0 0 / .6); transition: transform .5s var(--ease-out), box-shadow .5s; }
.ori-photo:hover { transform: rotate(0deg) translateY(-4px) scale(1.02); box-shadow: 0 20px 30px -16px rgb(0 0 0 / .55); }
.ori-photo-btn { display: block; width: 100%; aspect-ratio: 4 / 5; padding: 0; border: 0; background: var(--paper-3); cursor: zoom-in; }
.ori-photo-btn:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.ori-photo-img { width: 100%; height: 100%; background-size: cover; background-position: center; }
.ori-corner { position: absolute; width: 18px; height: 18px; background: color-mix(in srgb, var(--c-text) 78%, var(--c-card)); pointer-events: none; }
.ori-corner--tl { left: -3px; top: -3px; clip-path: polygon(0 0, 100% 0, 0 100%); }
.ori-corner--tr { right: -3px; top: -3px; clip-path: polygon(0 0, 100% 0, 100% 100%); }
.ori-corner--bl { left: -3px; bottom: -3px; clip-path: polygon(0 0, 100% 100%, 0 100%); }
.ori-corner--br { right: -3px; bottom: -3px; clip-path: polygon(100% 0, 100% 100%, 0 100%); }

/* ── RSVP : la carte-réponse ───────────────────────── */
.ori-replycard {
  max-width: 31rem; margin: 0 auto; padding: 2.8rem clamp(1.25rem, 5vw, 2.5rem) 2.4rem;
  background: var(--paper-2); outline: 1px solid var(--line); outline-offset: -10px;
  box-shadow: 0 18px 30px -24px rgb(0 0 0 / .6);
}
.ori-reply-seal {
  position: absolute; right: 1.1rem; top: 1.1rem; width: 50px; height: 50px;
  border: 1.5px dashed color-mix(in srgb, var(--c-text) 30%, transparent); border-radius: 16%; transform: rotate(6deg);
}
.ori-reply-stamp { --size: 50px; position: absolute; left: -1.5px; top: -1.5px; opacity: 0; transform: rotate(0deg) scale(1.6); }
.ori-replycard.is-answered .ori-reply-stamp { opacity: 1; transform: rotate(0deg); animation: ori-stamp .6s cubic-bezier(.3, 1.5, .5, 1) both; }
.rsvp-title { font-family: var(--f-script); font-weight: 400; color: var(--ink); font-size: clamp(2.2rem, 9vw, 3.1rem); line-height: 1.2; margin: 0 2.5rem 1.4rem; text-wrap: balance; }
.ori-title, .ori-h2 { text-wrap: balance; }
.rsvp-buttons { display: grid; gap: .15rem; max-width: 23rem; margin: 0 auto; text-align: left; }
.rsvp-btn {
  position: relative; display: flex; align-items: center; gap: 1rem; width: 100%;
  padding: .95rem .35rem; border: 0; border-bottom: 1px dashed var(--line); background: none;
  font: inherit; font-size: 1.06rem; line-height: 1.35; color: var(--c-text); text-align: left; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.rsvp-btn::before {
  content: ""; flex: none; width: 24px; height: 24px; border-radius: 3px;
  border: 1.5px solid color-mix(in srgb, var(--c-text) 50%, transparent);
  transition: border-color .3s, background .3s;
}
.rsvp-btn::after {
  content: ""; position: absolute; left: calc(.35rem + 7px); top: 50%; width: 9px; height: 17px;
  border-right: 3px solid var(--c-accent); border-bottom: 3px solid var(--c-accent);
  transform: translateY(-68%) rotate(40deg) scale(0); transform-origin: 50% 100%;
  transition: transform .4s cubic-bezier(.3, 1.6, .5, 1);
}
.rsvp-btn:hover:not(:disabled)::before, .rsvp-btn:focus-visible::before { border-color: var(--c-accent); background: color-mix(in srgb, var(--c-accent) 8%, transparent); }
.rsvp-btn:focus-visible { outline: none; }
.rsvp-btn.active::after { transform: translateY(-68%) rotate(40deg) scale(1); }
.rsvp-btn:disabled { cursor: default; }
.rsvp-success { text-align: center; }
.rsvp-status { font-family: var(--f-script); font-size: clamp(1.9rem, 8vw, 2.5rem); line-height: 1.3; color: var(--c-accent); margin: 0 1.5rem 1rem; }
.rsvp-edit { font: inherit; font-size: .9rem; background: none; border: 0; color: var(--muted); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.ori-replycard.is-sending { visibility: hidden; }
.ori-replycard.is-arrived { animation: ori-arrive .9s var(--ease-out) both; }

/* Copie animée de la carte (pliage en avion). */
.ori-ghost { position: fixed; z-index: 70; pointer-events: none; }
.ori-ghost > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; transform-origin: 50% 50%; filter: drop-shadow(0 14px 12px rgb(0 0 0 / .2)); }
.ori-ghost > .ori-replycard { position: absolute; inset: 0; max-width: none; margin: 0; transition: opacity .25s ease; }
.ori-flock { position: fixed; z-index: 69; width: 34px; height: 34px; margin: -17px 0 0 -17px; pointer-events: none; animation: ori-flock var(--dur) cubic-bezier(.35, .1, .4, 1) var(--delay) both; }
.ori-flock svg { width: 100%; height: 100%; overflow: visible; animation: ori-flap .3s ease-in-out infinite alternate; }

/* ── Conclusion : l'envol ──────────────────────────── */
.ori-finale { padding-bottom: 3.25rem; }
.ori-figure-stage { position: relative; width: min(66vw, 290px); aspect-ratio: 1; margin: 1.5rem auto .5rem; }
.ori-figure { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; transform-origin: 50% 50%; filter: drop-shadow(0 14px 10px rgb(0 0 0 / .2)); }
/* Traînée de l'envol : du centre de la figure vers le haut à droite. Toute
   sa course tient dans la boîte, pour que la découpe qui la révèle ne la
   coupe pas. */
.ori-trail { position: absolute; left: 50%; bottom: 45%; width: 150%; height: 190%; overflow: visible; pointer-events: none; opacity: 0; }
.ori-trail path { fill: none; stroke: var(--c-accent2); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 1 9; vector-effect: non-scaling-stroke; }
.ori-signoff { font-family: var(--f-script); font-size: clamp(2.1rem, 9vw, 3rem); line-height: 1.4; color: var(--c-accent); padding: .2em .4em; }

.ori-footer {
  display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center;
  padding: 2.75rem 1rem calc(3rem + env(safe-area-inset-bottom, 0px));
  font-family: var(--f-heading); font-size: .74rem; letter-spacing: .34em; text-transform: uppercase; color: var(--muted);
}

/* ── Visionneuse ───────────────────────────────────── */
.ori-lightbox {
  position: fixed; inset: 0; z-index: 80; display: grid; place-items: center;
  padding: calc(env(safe-area-inset-top, 0px) + 64px) 16px calc(env(safe-area-inset-bottom, 0px) + 64px);
  background: color-mix(in srgb, var(--c-background) 94%, transparent);
  touch-action: none; opacity: 0; transition: opacity .35s ease;
}
.ori-lightbox.is-open { opacity: 1; }
.ori-lb-frame {
  position: relative; padding: clamp(10px, 2.4vw, 18px) clamp(10px, 2.4vw, 18px) .6rem; background: var(--c-card);
  box-shadow: 0 30px 60px -30px rgb(0 0 0 / .6); transform: scale(.94) rotate(-1.5deg); transition: transform .5s cubic-bezier(.2, .9, .3, 1.15);
}
.ori-lightbox.is-open .ori-lb-frame { transform: none; }
.ori-lb-img { display: block; max-width: min(88vw, 960px); max-height: calc(100svh - 190px); width: auto; height: auto; object-fit: contain; user-select: none; -webkit-user-drag: none; }
.ori-lb-count { margin-top: .5rem; text-align: center; font-family: var(--f-heading); font-size: .72rem; letter-spacing: .3em; color: var(--muted); }
.ori-lb-btn {
  position: absolute; display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
  border: 1px solid var(--line); background: var(--c-card); color: var(--c-text);
  box-shadow: 0 8px 20px -10px rgb(0 0 0 / .5);
}
.ori-lb-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ori-lb-close { top: calc(env(safe-area-inset-top, 0px) + 12px); right: 12px; }
.ori-lb-prev { left: 12px; top: 50%; margin-top: -23px; }
.ori-lb-next { right: 12px; top: 50%; margin-top: -23px; }

/* ── Effets (script actif) ─────────────────────────── */
.fx [data-reveal] { opacity: 0; transform: translateY(26px); transition: opacity 1s ease, transform 1.1s var(--ease-out); transition-delay: calc(var(--i, 0) * 120ms); }
.fx [data-reveal].is-visible { opacity: 1; transform: none; }

/* Coin corné qui se déplie. */
.fx .ori-card[data-reveal] {
  opacity: 0; transform: translateY(18px);
  clip-path: polygon(0 0, calc(100% - var(--ear)) 0, 100% var(--ear), 100% 100%, 0 100%);
  transition: opacity .7s ease, transform .8s var(--ease-out), clip-path .45s ease;
  transition-delay: calc(var(--i) * 140ms), calc(var(--i) * 140ms), calc(var(--i) * 140ms + .75s);
}
.fx .ori-card.is-visible { opacity: 1; transform: none; clip-path: polygon(0 0, 100% 0, 100% 0, 100% 100%, 0 100%); }
.fx .ori-ear {
  display: block; position: absolute; top: 0; right: 0; width: var(--ear); height: var(--ear); z-index: 1;
  background: linear-gradient(225deg, transparent 50%, var(--paper-3) 50%);
  filter: drop-shadow(-2px 2px 2px rgb(0 0 0 / .18));
  transform: rotate3d(1, 1, 0, 0deg); backface-visibility: hidden;
  transition: transform .75s var(--ease-fold), opacity .2s ease;
  transition-delay: calc(var(--i) * 140ms + .45s), calc(var(--i) * 140ms + 1.1s);
}
.fx .ori-card.is-visible .ori-ear { transform: rotate3d(1, 1, 0, 180deg); opacity: 0; }

/* Chevalets qui se relèvent. */
.fx .ori-tent[data-reveal] { opacity: 1; transform: rotateX(-88deg); transition: transform 1s cubic-bezier(.2, 1.35, .4, 1); transition-delay: calc(var(--i) * 110ms); }
.fx .ori-tent.is-visible { transform: none; }

/* Fenêtre découpée dans le papier. La découpe est sur l'enfant : un élément
   entièrement découpé ne serait jamais vu par l'IntersectionObserver. */
.fx .ori-frame-wrap[data-reveal] { opacity: 1; transform: none; }
.fx .ori-frame-wrap .ori-frame { clip-path: inset(50% 50% 50% 50%); transition: clip-path 1.3s var(--ease-fold); }
.fx .ori-frame-wrap.is-visible .ori-frame { clip-path: inset(0 0 0 0); }

/* Volet du lieu. */
.fx .ori-gate-door {
  display: block; position: absolute; top: 0; bottom: 0; width: 50.2%; overflow: hidden;
  background:
    repeating-linear-gradient(45deg, transparent 0 27px, var(--line) 27px 28px),
    repeating-linear-gradient(-45deg, transparent 0 27px, var(--line) 27px 28px),
    var(--paper-2);
  box-shadow: inset 0 0 0 1px var(--line);
  transition: transform 1.6s var(--ease-fold), opacity .5s ease 1.25s;
}
.fx .ori-gate-door--l { left: 0; transform-origin: 0 50%; box-shadow: inset -8px 0 14px -10px rgb(0 0 0 / .35); }
.fx .ori-gate-door--r { right: 0; transform-origin: 100% 50%; box-shadow: inset 8px 0 14px -10px rgb(0 0 0 / .35); }
.ori-gate-seal { position: absolute; top: 50%; margin-top: -29px; }
.ori-gate-door--l .ori-gate-seal { right: -29px; }
.ori-gate-door--r .ori-gate-seal { left: -29px; }
.ori-gate-seal .ori-stamp { transform: none; }
.fx .ori-gate.is-open .ori-gate-door--l { transform: rotateY(-160deg); opacity: 0; }
.fx .ori-gate.is-open .ori-gate-door--r { transform: rotateY(160deg); opacity: 0; transition-delay: .12s, 1.37s; }

/* Étiquette qui se balance. */
.fx .ori-tag[data-reveal] { opacity: 0; transform: rotate(10deg); transition: opacity .6s ease; }
.fx .ori-tag.is-visible { opacity: 1; animation: ori-swing 2.8s cubic-bezier(.3, .1, .3, 1) both; }

/* Photos distribuées depuis une pile. */
.fx .ori-photo[data-reveal] {
  opacity: 0; transform: translateY(-46px) rotate(calc(var(--r) * -5)) scale(1.06);
  transition: opacity .6s ease, transform 1s cubic-bezier(.2, .9, .3, 1.1), box-shadow .5s;
  transition-delay: calc(var(--i) * 130ms);
}
.fx .ori-photo.is-visible { opacity: 1; transform: rotate(var(--r)); }
.fx .ori-photo.is-visible:hover { transform: rotate(0deg) translateY(-4px) scale(1.02); transition-delay: 0s; }

/* Conclusion : la signature s'écrit après l'envol. */
.fx .ori-signoff { clip-path: inset(0 100% 0 0); }
.fx .ori-signoff.is-inked { clip-path: inset(0 0 0 0); transition: clip-path 2s cubic-bezier(.45, .05, .3, 1); }
.fx .ori-trail { clip-path: inset(0 100% 0 0); }
.fx .ori-figure-stage.is-flown .ori-trail { opacity: .9; clip-path: inset(0 0 0 0); transition: clip-path 1.6s ease-out .15s, opacity .3s; }

/* ── Animations ────────────────────────────────────── */
@keyframes ori-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
@keyframes ori-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ori-grow-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes ori-grow-x { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ori-cut {
  from { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); }
  to { clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }
}
@keyframes ori-print {
  0% { opacity: 0; transform: scale(1.1); letter-spacing: .06em; text-shadow: none; }
  55% { opacity: 1; transform: scale(.985); }
  100% { opacity: 1; transform: none; }
}
@keyframes ori-stamp {
  0% { opacity: 0; transform: scale(1.9) rotate(-16deg); }
  60% { opacity: 1; transform: scale(.92) rotate(-3deg); }
  100% { opacity: 1; transform: scale(1) rotate(-5deg); }
}
@keyframes ori-bob { 0%, 100% { transform: translateY(0) rotate(45deg); } 50% { transform: translateY(7px) rotate(45deg); } }
@keyframes ori-flip { from { transform: rotateX(90deg); opacity: .2; } to { transform: none; opacity: 1; } }
@keyframes ori-swing {
  0% { transform: rotate(10deg); } 22% { transform: rotate(-6.5deg); } 42% { transform: rotate(3.8deg); }
  62% { transform: rotate(-2deg); } 80% { transform: rotate(.9deg); } 100% { transform: rotate(0deg); }
}
@keyframes ori-arrive { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes ori-flock {
  0% { opacity: 0; transform: translate(0, 0) scale(.3); }
  12% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(var(--s)) rotate(var(--rot)); }
}
@keyframes ori-flap { to { transform: scaleY(.45); } }

/* ── Tailles d'écran ───────────────────────────────── */
@media (min-width: 640px) {
  .ori-album { grid-template-columns: repeat(3, 1fr); }
  .ori-fold { padding: .85rem 1.5rem; }
}
@media (min-width: 900px) {
  .ori-strip { width: min(100% - 64px, 980px); }
  .ori-panel { padding: 5.5rem 4.5rem; }
  .ori-split { grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: center; }
  .ori-split .ori-text { text-align: left; margin: 0; }
  .ori-split--reverse > .ori-text { order: 2; }
  .ori-split--single { grid-template-columns: 1fr; }
  .ori-split--single .ori-text { text-align: center; margin: 0 auto; }
  .ori-split .ori-tab-wrap { text-align: left; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
`;
