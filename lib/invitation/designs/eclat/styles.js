/**
 * CSS du design Éclat. Tous les effets sont progressifs : sans script ou avec
 * « réduire les animations », l'invitation reste complète et lisible.
 */
export const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--c-background);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: 1.12rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
.fx-dust, .fx-confetti { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.fx-dust { z-index: 0; }
.fx-confetti { z-index: 50; }
.eclat { position: relative; z-index: 1; overflow-x: hidden; }

/* ── Héro ─────────────────────────────────────────── */
.hero {
  position: relative; min-height: 100vh; min-height: 100svh;
  display: grid; place-items: center; text-align: center;
  overflow: hidden; color: #fff; isolation: isolate;
}
.hero-media { position: absolute; inset: -10% 0; z-index: -2; will-change: transform; }
.hero-img {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  animation: kenburns 26s ease-in-out infinite alternate;
}
.hero-veil {
  position: absolute; inset: 0; z-index: -1;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgb(0 0 0 / var(--overlay)) 100%),
    linear-gradient(180deg, rgb(0 0 0 / calc(var(--overlay) * 0.6)) 0%, rgb(0 0 0 / var(--overlay)) 70%, var(--c-background) 100%);
}
.hero-content { padding: 6rem 1.5rem 7rem; max-width: 720px; }
.eyebrow {
  font-family: var(--f-heading); font-size: 0.78rem; letter-spacing: 0.45em;
  text-transform: uppercase; color: var(--c-accent2); margin-bottom: 1.25rem;
}
.title {
  font-family: var(--f-script); font-weight: 400;
  font-size: clamp(3.4rem, 15vw, 6.5rem); line-height: 1.15; padding: 0 0.25em;
}
.foil {
  background: linear-gradient(100deg, var(--c-accent) 0%, var(--c-accent2) 22%, var(--c-accent) 45%, var(--c-accent2) 70%, var(--c-accent) 100%);
  background-size: 250% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: foil 9s linear infinite;
}
.hero .title { filter: drop-shadow(0 4px 24px rgb(0 0 0 / 0.45)); }
.hero-date {
  font-family: var(--f-heading); font-size: 0.95rem; letter-spacing: 0.3em;
  text-transform: uppercase; margin-top: 1rem; color: rgb(255 255 255 / 0.9);
}
.hero-in { opacity: 0; animation: rise 1.6s cubic-bezier(.2,.7,.2,1) var(--d, 0s) forwards; }
.hero .ornament { --d: .9s; }

.ornament { display: block; width: min(240px, 70%); height: 24px; margin: 1.25rem auto; overflow: visible; }
.ornament path, .ornament circle { fill: none; stroke: var(--c-accent); stroke-width: 1.2; }
.ornament circle { fill: var(--c-accent); stroke: none; }
.ornament .ornament-gem { fill: var(--c-accent); stroke: none; }
.ornament.draw path[pathLength] { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.8s ease-out 1.1s forwards; }

.seal {
  position: absolute; right: 6%; bottom: 9%; width: clamp(84px, 20vw, 120px);
  animation: spin 32s linear infinite; opacity: .9;
}
.seal circle { fill: rgb(0 0 0 / .18); stroke: var(--c-accent); stroke-width: 1; }
.seal text { fill: var(--c-accent2); font-family: var(--f-heading); font-size: 15px; letter-spacing: 2px; }
.seal .seal-amp { font-family: var(--f-script); font-size: 64px; letter-spacing: 0; fill: var(--c-accent); }

.scroll-hint { position: absolute; left: 50%; bottom: 1.75rem; width: 1px; height: 56px; background: rgb(255 255 255 / .25); overflow: hidden; }
.scroll-hint span { position: absolute; left: 0; top: -40%; width: 1px; height: 40%; background: var(--c-accent2); animation: hint 2.2s ease-in-out infinite; }

/* ── Contenu ──────────────────────────────────────── */
.page { max-width: 600px; margin: 0 auto; padding: 0 1.5rem 3rem; }
.intro { padding: 3.5rem 0 1rem; }
.frame {
  position: relative; text-align: center; font-style: italic; font-size: 1.2rem;
  padding: 2.75rem 1.75rem; border: 1px solid color-mix(in srgb, var(--c-accent) 55%, transparent);
  outline: 1px solid color-mix(in srgb, var(--c-accent) 25%, transparent); outline-offset: 7px;
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--c-text) 3%, transparent);
}
.frame p + p { margin-top: 1rem; }

.countdown { display: grid; grid-template-columns: repeat(4, 1fr); gap: .6rem; margin: 3rem 0 1rem; text-align: center; }
.cd-unit {
  padding: 1.1rem .25rem; border-radius: var(--radius);
  background: color-mix(in srgb, var(--c-text) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-accent) 30%, transparent);
}
.cd-num { display: block; font-family: var(--f-heading); font-size: clamp(1.6rem, 7vw, 2.3rem); color: var(--c-accent); font-variant-numeric: tabular-nums; line-height: 1.2; }
.cd-num.tick { animation: tick .5s ease; }
.cd-label { display: block; font-size: .68rem; letter-spacing: .22em; text-transform: uppercase; opacity: .7; }
.cd-done { grid-column: 1 / -1; font-family: var(--f-script); font-size: 2.6rem; color: var(--c-accent); }
.countdown:has(.cd-done:not([hidden])) .cd-unit { display: none; }
/* Sans script (vignettes), le compte à rebours afficherait « 00 » partout :
   il n'apparaît qu'une fois lancé. */
.countdown:not(.is-live) { display: none; }

.details ul { list-style: none; display: grid; gap: 1rem; margin: 3rem 0 1rem; text-align: center; }
.details li { display: flex; flex-direction: column; align-items: center; gap: .5rem; font-size: 1.1rem; }
.icon {
  width: 44px; height: 44px; padding: 11px; border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--c-accent) 60%, transparent);
  fill: none; stroke: var(--c-accent); stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round;
}

.chapter { padding-top: 5rem; text-align: center; }
.chapter-kicker { font-family: var(--f-heading); font-size: .75rem; letter-spacing: .5em; color: var(--c-accent); }
.chapter-kicker::before, .chapter-kicker::after { content: ""; display: inline-block; width: 22px; height: 1px; margin: 0 .9em; vertical-align: middle; background: currentColor; opacity: .6; }
.chapter-title { font-family: var(--f-script); font-weight: 400; font-size: clamp(2.6rem, 11vw, 3.6rem); line-height: 1.2; color: var(--c-accent); margin: .25rem 0 1.25rem; }
.chapter-text { opacity: .88; }
.chapter-text p + p { margin-top: 1rem; }

.photo { position: relative; margin-top: 2.25rem; aspect-ratio: 4 / 3; border-radius: var(--radius); overflow: hidden; box-shadow: 0 30px 60px -30px rgb(0 0 0 / .6); }
.photo--arch { aspect-ratio: 4 / 5; max-width: 420px; margin-inline: auto; border-radius: 999px 999px var(--radius) var(--radius); }
.photo::after { content: ""; position: absolute; inset: 10px; border: 1px solid rgb(255 255 255 / .35); border-radius: inherit; pointer-events: none; }
.photo-img { position: absolute; inset: -12% 0; background-size: cover; background-position: center; will-change: transform; }

.timeline { position: relative; list-style: none; text-align: left; margin: 0 auto; max-width: 420px; padding-left: 2.25rem; }
.timeline::before, .timeline-progress { content: ""; position: absolute; left: 7px; top: 8px; bottom: 8px; width: 1px; }
.timeline::before { background: color-mix(in srgb, var(--c-text) 18%, transparent); }
.timeline-progress { background: linear-gradient(var(--c-accent2), var(--c-accent)); transform-origin: top; transform: scaleY(var(--progress, 1)); }
.timeline li { position: relative; display: grid; grid-template-columns: 4.5rem 1fr; gap: .75rem; padding: .9rem 0; }
.tl-dot { position: absolute; left: calc(-2.25rem + 2px); top: 1.35rem; width: 11px; height: 11px; border-radius: 50%; background: var(--c-background); border: 1px solid var(--c-accent); transition: background .6s, box-shadow .6s; }
.timeline li.is-visible .tl-dot { background: var(--c-accent); box-shadow: 0 0 0 5px color-mix(in srgb, var(--c-accent) 20%, transparent), 0 0 18px var(--c-accent); }
html:not(.fx) .tl-dot { background: var(--c-accent); }
.tl-time { font-family: var(--f-heading); color: var(--c-accent); letter-spacing: .08em; }

.map { margin-top: 1.5rem; }
.map a {
  display: inline-block; padding: .7rem 1.6rem; border-radius: 999px; text-decoration: none;
  font-family: var(--f-heading); font-size: .8rem; letter-spacing: .2em; text-transform: uppercase;
  color: var(--c-accent); border: 1px solid var(--c-accent); transition: background .3s, color .3s;
}
.map a:hover { background: var(--c-accent); color: var(--c-background); }

.gallery { display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: 150px; gap: .6rem; }
.gallery figure { position: relative; overflow: hidden; border-radius: calc(var(--radius) * .6); }
.gallery figure:nth-child(3n + 1) { grid-row: span 2; }
.gallery-img { position: absolute; inset: 0; background-size: cover; background-position: center; transition: transform 1.2s cubic-bezier(.2,.7,.2,1); }
.gallery figure:hover .gallery-img { transform: scale(1.08); }

.closing { padding-top: 5rem; text-align: center; }
.closing-title { font-family: var(--f-script); font-weight: 400; font-size: clamp(2.8rem, 12vw, 4rem); line-height: 1.2; padding: 0 .2em; margin-bottom: 1rem; }

/* ── RSVP ─────────────────────────────────────────── */
.rsvp-wrap { margin-top: 4.5rem; }
.rsvp {
  position: relative; text-align: center; padding: 2.75rem 1.5rem;
  border-radius: var(--radius); overflow: hidden;
  background: color-mix(in srgb, var(--c-text) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-accent) 45%, transparent);
  box-shadow: 0 0 60px -20px color-mix(in srgb, var(--c-accent) 50%, transparent);
}
.rsvp-title { font-family: var(--f-script); font-weight: 400; font-size: clamp(2.4rem, 10vw, 3.2rem); line-height: 1.2; color: var(--c-accent); margin-bottom: 1.5rem; }
.rsvp-buttons { display: grid; gap: .7rem; max-width: 340px; margin: 0 auto; }
.rsvp-btn {
  position: relative; overflow: hidden; cursor: pointer;
  font-family: var(--f-heading); font-size: .82rem; letter-spacing: .2em; text-transform: uppercase;
  padding: 1rem 1.25rem; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--c-accent) 60%, transparent);
  background: transparent; color: var(--c-text);
  transition: transform .3s, box-shadow .3s, background .3s;
}
.rsvp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px -12px var(--c-accent); }
.rsvp-btn--confirmed { background: linear-gradient(120deg, var(--c-accent), var(--c-accent2), var(--c-accent)); color: #1b1408; border-color: transparent; font-weight: 600; }
.rsvp-btn--confirmed::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(115deg, transparent 35%, rgb(255 255 255 / .55) 50%, transparent 65%);
  transform: translateX(-120%); animation: shine 3.8s ease-in-out 2s infinite;
}
.rsvp-btn:disabled { cursor: default; opacity: .65; }
.rsvp-btn.active { opacity: 1; box-shadow: 0 0 0 2px var(--c-background), 0 0 0 3px var(--c-accent); }
.rsvp-status { font-family: var(--f-script); font-size: 2.2rem; line-height: 1.3; color: var(--c-accent); margin-bottom: 1.25rem; }
.rsvp-edit { font: inherit; font-size: .9rem; background: none; border: none; color: var(--c-text); opacity: .7; text-decoration: underline; cursor: pointer; }

.footer { text-align: center; padding-top: 3.5rem; font-family: var(--f-heading); font-size: .75rem; letter-spacing: .35em; text-transform: uppercase; opacity: .7; }

/* ── Révélation au défilement (activée par le script) ─ */
.fx [data-reveal] {
  opacity: 0; transform: translateY(40px); filter: blur(6px);
  transition: opacity 1.2s ease, transform 1.2s cubic-bezier(.2,.7,.2,1), filter 1.2s ease;
  transition-delay: calc(var(--i, 0) * 140ms);
}
.fx [data-reveal].is-visible { opacity: 1; transform: none; filter: none; }

@keyframes kenburns { from { transform: scale(1.05); } to { transform: scale(1.18) translate(-2%, -2%); } }
@keyframes foil { to { background-position: -250% center; } }
@keyframes rise { from { opacity: 0; transform: translateY(26px); filter: blur(10px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes hint { 0% { top: -40%; } 100% { top: 100%; } }
@keyframes tick { 0% { transform: translateY(-6px); opacity: .3; } 100% { transform: none; opacity: 1; } }
@keyframes shine { 0%, 60% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }

@media (min-width: 560px) {
  .details ul { grid-template-columns: repeat(2, 1fr); }
  .gallery { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 170px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .hero-in { opacity: 1; }
  .ornament.draw path[pathLength] { stroke-dashoffset: 0; }
}
`;
