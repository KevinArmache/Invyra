import { NOISE } from "@/lib/invitation/designs/textures";

/**
 * CSS du design Face A (page de l'invitation ; l'ouverture a le sien, voir
 * opening.js, mais s'appuie sur les classes partagées ci-dessous : disque,
 * platine, bras, pochette).
 *
 * Règle d'or, comme pour Origami : l'état par défaut est l'état final et
 * lisible. Les états masqués, épinglés ou décalés n'existent que sous
 * `html.fx`, posée par le script du design.
 *
 * Les tailles du disque, de la platine et du bras dérivent de `--D`, le
 * diamètre du disque ; les textes du label et de la pochette sont en unités
 * de conteneur (cqw), pour suivre la taille de l'objet.
 */
export const css = `
:root {
  --noise: ${NOISE};
  --muted: color-mix(in srgb, var(--c-text) 60%, var(--c-background));
  --line: color-mix(in srgb, var(--c-text) 14%, transparent);
  --arm-metal: color-mix(in srgb, var(--c-text) 62%, var(--c-card));
  --ease-out: cubic-bezier(.2, .7, .2, 1);
  --ease-io: cubic-bezier(.65, 0, .35, 1);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--c-background); }
/* Le document pose overflow-x: hidden sur body, ce qui en fait un conteneur
   de défilement et neutralise position: sticky (tracklist, disque qu'on
   retourne). Le débordement horizontal est coupé plus bas, sur .vn. */
body {
  overflow: visible;
  background: var(--c-background);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: 1.02rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
/* La pièce d'écoute : un halo de lumière en haut, et du grain. */
body::before {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(90% 60% at 50% -10%, color-mix(in srgb, var(--c-accent) 14%, transparent), transparent 70%),
    var(--noise);
  opacity: .9;
}
.vn { position: relative; z-index: 1; overflow-x: hidden; overflow-x: clip; }
.vn-sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* ── Disque ─────────────────────────────────────────── */
.vn-disc {
  --runout: linear-gradient(transparent, transparent);
  position: relative; width: 100%; aspect-ratio: 1; border-radius: 50%;
  container-type: inline-size;
  box-shadow: 0 18px 36px -16px rgb(0 0 0 / .7), 0 0 0 1px rgb(0 0 0 / .25);
}
.vn-disc-spin {
  position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
  background:
    var(--runout),
    radial-gradient(circle closest-side, transparent 0 55.2%, rgb(0 0 0 / .5) 55.6% 56.4%, transparent 56.8%),
    radial-gradient(circle closest-side, transparent 0 69.2%, rgb(0 0 0 / .5) 69.6% 70.4%, transparent 70.8%),
    radial-gradient(circle closest-side, transparent 0 82.2%, rgb(0 0 0 / .5) 82.6% 83.4%, transparent 83.8%),
    repeating-radial-gradient(circle closest-side, rgb(255 255 255 / .05) 0 .5%, rgb(0 0 0 / .16) .5% 1.1%),
    radial-gradient(circle closest-side, var(--c-record) 0 94%, color-mix(in srgb, var(--c-record) 70%, #000) 96%, color-mix(in srgb, var(--c-record) 88%, #fff) 98% 100%);
  will-change: transform;
}
/* Reflet fixe : deux pinceaux de lumière, hors du label. */
.vn-disc-sheen {
  position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  background: conic-gradient(from 200deg, transparent 0deg, rgb(255 255 255 / .17) 22deg, transparent 52deg 180deg, rgb(255 255 255 / .12) 204deg, transparent 236deg);
  -webkit-mask: radial-gradient(circle closest-side, transparent 35%, #000 36% 97%, transparent 98%);
  mask: radial-gradient(circle closest-side, transparent 35%, #000 36% 97%, transparent 98%);
}
.vn-label {
  position: absolute; inset: 33%; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.2cqw;
  background: radial-gradient(circle, color-mix(in srgb, var(--c-accent) 88%, #fff) 0, var(--c-accent) 62%);
  box-shadow: inset 0 0 0 .6cqw color-mix(in srgb, var(--c-background) 25%, transparent), inset 0 0 0 1.4cqw var(--c-accent);
  color: var(--c-background); text-align: center; line-height: 1;
}
.vn-label-mono { font-family: var(--f-heading); font-size: 8.5cqw; letter-spacing: .04em; white-space: nowrap; margin-top: -4cqw; }
.vn-label-side { font-family: var(--f-mono); font-size: 1.9cqw; letter-spacing: .14em; text-transform: uppercase; white-space: nowrap; opacity: .85; }
.vn-disc-spindle {
  position: absolute; inset: 48.6%; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff, #a3a3a3 45%, #4d4d4d);
  box-shadow: 0 1px 2px rgb(0 0 0 / .5);
}
/* Picture disc : la photo couvre le disque, sous les sillons. */
.vn-disc-picture { position: absolute; inset: 0; background-size: cover; background-position: center; }
.vn-disc--picture .vn-disc-spin { background: repeating-radial-gradient(circle closest-side, rgb(255 255 255 / .05) 0 .5%, rgb(0 0 0 / .08) .5% 1.1%); }
.vn-disc--picture .vn-disc-spin::after { content: ""; position: absolute; inset: 0; border-radius: 50%; box-shadow: inset 0 0 0 3cqw color-mix(in srgb, var(--c-record) 85%, transparent); }
.vn-disc--picture .vn-label { inset: 44%; box-shadow: none; }
.vn-disc--picture .vn-label > *, .vn-disc--mini .vn-label > * { display: none; }
/* Sillon de sortie lisse, où le message est gravé. */
.vn-disc--runout { --runout: radial-gradient(circle closest-side, color-mix(in srgb, var(--c-record) 92%, #fff) 0 58%, rgb(0 0 0 / .45) 58.4% 59%, transparent 59.4%); }
.vn-etch { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.vn-etch text {
  font-family: var(--f-mono); font-size: 7.2px; letter-spacing: .14em; text-transform: uppercase;
  fill: color-mix(in srgb, #fff 34%, transparent); transition: fill 1.2s ease;
}

/* ── Platine et bras ────────────────────────────────── */
.vn-tt { position: relative; width: calc(var(--D) * 1.46); height: calc(var(--D) * 1.18); flex: none; }
.vn-tt-plinth {
  position: absolute; inset: 0; border-radius: calc(var(--D) * .05); overflow: hidden;
  background: linear-gradient(160deg, color-mix(in srgb, var(--c-card) 88%, #fff), var(--c-card) 45%, color-mix(in srgb, var(--c-card) 86%, #000));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .09), inset 0 0 0 1px var(--line), 0 40px 60px -32px rgb(0 0 0 / .75);
}
.vn-tt-plinth::after { content: ""; position: absolute; inset: 0; background-image: var(--noise); opacity: .5; }
.vn-tt-platter {
  position: absolute; left: calc(var(--D) * .045); top: calc(var(--D) * .065); width: calc(var(--D) * 1.05); height: calc(var(--D) * 1.05);
  border-radius: 50%; background: color-mix(in srgb, var(--c-card) 55%, #111);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .08), 0 6px 14px -8px rgb(0 0 0 / .6);
}
/* Points stroboscopiques sur la tranche du plateau. */
.vn-tt-platter::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%;
  background: repeating-conic-gradient(rgb(255 255 255 / .38) 0 1deg, transparent 1deg 4deg);
  -webkit-mask: radial-gradient(circle closest-side, transparent 96.5%, #000 97% 98.8%, transparent 99.2%);
  mask: radial-gradient(circle closest-side, transparent 96.5%, #000 97% 98.8%, transparent 99.2%);
}
.vn-tt-speed { position: absolute; right: calc(var(--D) * .06); bottom: calc(var(--D) * .045); display: flex; gap: calc(var(--D) * .02); }
.vn-tt-speed span {
  font-family: var(--f-mono); font-size: calc(var(--D) * .036); line-height: 1.3;
  padding: calc(var(--D) * .006) calc(var(--D) * .016); border-radius: 3px;
  border: 1px solid var(--line); color: var(--muted);
}
.vn-tt-speed .is-on { color: var(--c-accent); border-color: currentColor; }
.vn-tt-led {
  position: absolute; left: calc(var(--D) * .07); bottom: calc(var(--D) * .058); width: calc(var(--D) * .022); aspect-ratio: 1; border-radius: 50%;
  background: var(--c-accent); box-shadow: 0 0 calc(var(--D) * .03) var(--c-accent); transition: background .8s, box-shadow .8s;
}
.vn-tt .vn-deck { position: absolute; left: calc(var(--D) * .07); top: calc(var(--D) * .09); width: var(--D); height: var(--D); }
.vn-arm { position: absolute; left: 112%; top: 8%; width: 0; height: 0; z-index: 2; }
.vn-arm-base {
  position: absolute; left: calc(var(--D) * -.1); top: calc(var(--D) * -.1); width: calc(var(--D) * .2); height: calc(var(--D) * .2); border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, color-mix(in srgb, var(--arm-metal) 55%, #fff), var(--arm-metal) 55%, color-mix(in srgb, var(--arm-metal) 55%, #000));
  box-shadow: 0 6px 14px -6px rgb(0 0 0 / .6);
}
.vn-arm-rot { position: absolute; left: 0; top: 0; width: 0; height: 0; transform: rotate(var(--arm, 26deg)); will-change: transform; }
.vn-arm-svg {
  position: absolute; left: calc(var(--D) * -.08); top: calc(var(--D) * -.14); width: calc(var(--D) * .16); height: calc(var(--D) * 1.06);
  overflow: visible; filter: drop-shadow(3px 6px 4px rgb(0 0 0 / .35)); transition: transform .35s ease;
  transform-origin: 50% 13.2%;
}
.vn-arm-tube { fill: none; stroke: var(--arm-metal); stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.vn-arm-metal { fill: var(--arm-metal); }
.vn-arm-cart { fill: var(--c-accent); }
.vn-arm.is-lifted .vn-arm-svg { transform: scale(1.04); filter: drop-shadow(8px 14px 6px rgb(0 0 0 / .3)); }

/* ── Pochette ───────────────────────────────────────── */
.vn-cover {
  position: absolute; left: 0; top: 0; width: var(--C); height: var(--C); overflow: hidden;
  container-type: inline-size;
  background: var(--c-card); color: #fff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .06), 0 30px 50px -24px rgb(0 0 0 / .75), 8px 0 20px -10px rgb(0 0 0 / .5);
}
.vn-cover-img { position: absolute; inset: 0; background-size: cover; background-position: center; }
.vn-cover--plain { background: var(--c-accent); color: var(--c-background); }
.vn-cover-rings {
  position: absolute; inset: 0;
  background: repeating-radial-gradient(circle at 78% 34%, transparent 0 6cqw, color-mix(in srgb, var(--c-background) 16%, transparent) 6cqw 7.2cqw);
}
.vn-cover-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgb(0 0 0 / .42) 0%, transparent 30%, transparent 42%, rgb(0 0 0 / .78) 100%); }
.vn-cover--plain .vn-cover-shade { display: none; }
/* Usure circulaire laissée par le disque dans la pochette. */
.vn-cover-wear { position: absolute; inset: 5%; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / .1), 0 0 0 1px rgb(0 0 0 / .07); pointer-events: none; }
.vn-cover-logo {
  position: absolute; left: 5cqw; top: 5cqw; display: grid; place-items: center;
  width: 12cqw; height: 12cqw; border-radius: 50%; border: .5cqw solid currentColor;
  font-family: var(--f-heading); font-size: 4cqw; line-height: 1; white-space: nowrap;
}
.vn-sticker {
  position: absolute; right: 5cqw; top: 6cqw; max-width: 48cqw; padding: 2.4cqw 3.6cqw;
  border-radius: 999px; background: var(--c-accent); color: var(--c-background);
  font-family: var(--f-mono); font-size: 2.9cqw; line-height: 1.25; letter-spacing: .06em; text-transform: uppercase; text-align: center;
  transform: rotate(6deg); box-shadow: 0 1.4cqw 2.6cqw -1cqw rgb(0 0 0 / .5);
}
.vn-cover--plain .vn-sticker { background: var(--c-background); color: var(--c-accent); }
.vn-cover-dedication {
  position: absolute; left: 6cqw; top: 22cqw; max-width: 70cqw;
  font-family: var(--f-script); font-size: 5.6cqw; line-height: 1.2; transform: rotate(-7deg); transform-origin: left center;
  text-shadow: 0 1px 8px rgb(0 0 0 / .3); overflow-wrap: anywhere;
}
.vn-cover-title {
  position: absolute; left: 5cqw; right: 5cqw; bottom: 8cqw;
  font-family: var(--f-heading); font-weight: 400; font-size: 14cqw; line-height: .92; letter-spacing: .01em; text-transform: uppercase;
  text-wrap: balance; overflow-wrap: break-word; text-shadow: 0 2px 24px rgb(0 0 0 / .3);
}
.vn-cover-cat { position: absolute; right: 5cqw; bottom: 3.4cqw; font-family: var(--f-mono); font-size: 2.3cqw; letter-spacing: .14em; opacity: .75; }

/* ── Héro ───────────────────────────────────────────── */
.vn-hero {
  position: relative; min-height: 100vh; min-height: 100svh;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: clamp(1.6rem, 4.5vh, 2.8rem);
  padding: clamp(4rem, 10vh, 6rem) 16px clamp(5rem, 13vh, 7.5rem);
}
.vn-album {
  --C: min(68vw, 48vh, 440px); --C: min(68vw, 48svh, 440px);
  position: relative; flex: none; width: calc(var(--C) * 1.34); height: var(--C);
}
.vn-hero-disc { position: absolute; left: calc(var(--C) * .38); top: calc(var(--C) * .03); width: calc(var(--C) * .94); }
.vn-album.is-tiltable { transform: perspective(1800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform .8s var(--ease-out); }
.vn-album.is-tiltable.is-tilting { transition: transform .15s linear; }
.vn-hero-meta { display: flex; flex-direction: column; align-items: center; gap: .5rem; text-align: center; max-width: 40rem; }
.vn-hero-date { font-family: var(--f-heading); font-size: clamp(1.6rem, 6vw, 2.5rem); line-height: 1.05; letter-spacing: .03em; text-transform: uppercase; text-wrap: balance; }
.vn-hero-date span { color: var(--c-accent); }
.vn-hero-where { font-family: var(--f-mono); font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.vn-scroll { position: absolute; left: 50%; bottom: clamp(1.2rem, 4vh, 2.2rem); width: 1px; height: 46px; margin-left: -.5px; background: var(--line); overflow: hidden; }
.vn-scroll::after { content: ""; position: absolute; left: -2px; top: 0; width: 5px; height: 12px; border-radius: 3px; background: var(--c-accent); animation: vn-drip 2.2s var(--ease-io) infinite; }

/* Entrées du héro, en pause tant que l'ouverture est fermée. La pochette
   glisse sur le disque que l'ouverture vient de poser. */
.vn-slide-in { animation: vn-slide-in 1.25s var(--ease-out) .1s both; }
.vn-rise { animation: vn-rise 1s var(--ease-out) var(--d, 0s) both; }
.vn-scroll.vn-rise { animation: vn-fade 1s ease var(--d, 0s) both; }

/* ── Lecteur en haut d'écran ────────────────────────── */
.vn-now { display: none; }

/* ── Pistes ─────────────────────────────────────────── */
.vn-track, .vn-counter { position: relative; width: min(100% - 32px, 1080px); margin: 0 auto; padding: clamp(4rem, 12vw, 7.5rem) 0; }
.vn-head { display: flex; flex-direction: column; align-items: center; gap: .7rem; max-width: 44rem; margin: 0 auto 2.6rem; text-align: center; }
.vn-code {
  display: inline-flex; align-items: center; gap: .65rem; flex-wrap: wrap; justify-content: center;
  font-family: var(--f-mono); font-size: .76rem; letter-spacing: .14em; text-transform: uppercase; color: var(--muted);
}
.vn-code--center { display: flex; }
.vn-code-id { color: var(--c-accent); font-weight: 500; }
.vn-code-sep { width: 22px; height: 1px; background: currentColor; opacity: .5; }
.vn-h2 {
  font-family: var(--f-heading); font-weight: 400; font-size: clamp(2.8rem, 12vw, 5.6rem); line-height: .95; letter-spacing: .01em;
  text-transform: uppercase; text-wrap: balance; overflow-wrap: break-word; max-width: 100%;
}
.vn-wave { position: relative; width: min(100%, 20rem); margin-top: .5rem; }
.vn-wave svg { display: block; width: 100%; height: auto; }
.vn-wave path { fill: none; stroke-width: 2; stroke-linecap: round; }
.vn-wave-base path { stroke: color-mix(in srgb, var(--c-text) 20%, transparent); }
.vn-wave-played { position: absolute; inset: 0; clip-path: inset(0 calc(100% - var(--played, 1) * 100%) 0 0); }
.vn-wave-played path { stroke: var(--c-accent); }
.vn-text { max-width: 36rem; margin: 0 auto; text-align: center; color: color-mix(in srgb, var(--c-text) 88%, var(--c-background)); }
.vn-text p + p { margin-top: 1rem; }

/* Intro : les paroles. */
.vn-lyrics { max-width: 42rem; margin: 0 auto; font-weight: 600; font-size: clamp(1.4rem, 5vw, 2.2rem); line-height: 1.32; letter-spacing: -.01em; text-align: center; text-wrap: pretty; }
.vn-lyrics p + p { margin-top: 1.1em; }

/* Compte à rebours : le compteur de bande. */
.vn-counter { padding-top: 0; text-align: center; }
.vn-counter:not(.is-live) { display: none; }
.vn-counter-deck {
  display: inline-grid; grid-template-columns: repeat(4, auto); gap: clamp(.55rem, 2.6vw, 1.2rem); margin-top: 1.2rem; max-width: 100%;
  padding: 1.1rem clamp(.8rem, 3vw, 1.6rem) .9rem; border-radius: 14px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--c-card) 88%, #000), var(--c-card));
  box-shadow: inset 0 2px 8px rgb(0 0 0 / .45), inset 0 0 0 1px var(--line), 0 24px 40px -30px rgb(0 0 0 / .8);
}
.vn-cell { display: flex; flex-direction: column; align-items: center; gap: .45rem; }
.vn-digits { display: flex; gap: 3px; font-family: var(--f-mono); font-size: clamp(1.6rem, 7vw, 2.8rem); }
.vn-digit {
  position: relative; width: .8em; height: 1.3em; overflow: hidden; border-radius: 4px; line-height: 1.3; text-align: center;
  background: #0e0e0f; color: #f4efe6;
}
.vn-digit::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgb(0 0 0 / .7), transparent 32%, transparent 68%, rgb(0 0 0 / .7)); }
.vn-strip { display: flex; flex-direction: column; transform: translateY(calc(var(--n, 0) * -1.3em)); transition: transform .6s cubic-bezier(.3, 1.25, .5, 1); }
.vn-strip.is-snap { transition: none; }
.vn-strip i { font-style: normal; display: block; height: 1.3em; }
.vn-cell-label { font-family: var(--f-mono); font-size: .62rem; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
.vn-cd-done { font-family: var(--f-heading); font-size: clamp(2.4rem, 10vw, 4rem); line-height: 1; text-transform: uppercase; color: var(--c-accent); margin-top: 1rem; }
.vn-counter:has(.vn-cd-done:not([hidden])) .vn-counter-deck { display: none; }

/* Crédits : le dos de la pochette. */
.vn-back {
  position: relative; isolation: isolate; max-width: 40rem; margin: 0 auto; padding: clamp(1.5rem, 5vw, 2.6rem);
  background: var(--c-card); border-radius: 4px; box-shadow: inset 0 0 0 1px var(--line), 0 30px 50px -34px rgb(0 0 0 / .75);
}
.vn-back::before { content: ""; position: absolute; inset: 0; z-index: -1; background-image: var(--noise); opacity: .5; }
.vn-credits-list { display: grid; gap: 1rem; }
.vn-credit { display: flex; align-items: baseline; }
.vn-credit dt {
  flex: 1 1 auto; display: flex; align-items: baseline; min-width: 4.5rem;
  font-family: var(--f-mono); font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; color: var(--muted);
}
.vn-credit dt::after { content: ""; flex: 1; min-width: .8rem; margin: 0 .7rem; border-bottom: 1px dotted color-mix(in srgb, var(--c-text) 38%, transparent); transform: translateY(-.3em); }
.vn-credit dd { flex: 0 1 auto; max-width: 66%; text-align: right; font-size: 1.02rem; line-height: 1.4; overflow-wrap: break-word; }
.vn-back-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-top: 2rem; padding-top: 1.2rem; border-top: 1px solid var(--line); }
.vn-barcode { width: 104px; height: 34px; fill: var(--c-text); flex: none; transform-origin: bottom; }
.vn-catalog { font-family: var(--f-mono); font-size: .7rem; letter-spacing: .12em; color: var(--muted); }
.vn-stereo { font-family: var(--f-heading); font-size: 1.05rem; line-height: 1.3; letter-spacing: .12em; padding: 0 .45rem; border: 1.5px solid currentColor; border-radius: 3px; text-transform: uppercase; }

/* Tracklist. */
.vn-tl { --D: min(56vw, 300px); display: grid; gap: 2.4rem; justify-items: center; }
.vn-tl-list { list-style: none; width: 100%; max-width: 34rem; }
.vn-tl-item {
  display: grid; grid-template-columns: 2.4rem 1fr auto; align-items: center; gap: .9rem;
  padding: .95rem .7rem; border-bottom: 1px solid var(--line); border-radius: 6px;
  transition: background-color .4s ease;
}
.vn-tl-num { position: relative; font-family: var(--f-mono); font-size: .8rem; color: var(--muted); }
.vn-tl-eq { display: none; align-items: flex-end; gap: 2px; height: 14px; }
.vn-tl-eq i, .vn-now-eq i { width: 3px; height: 100%; background: var(--c-accent); transform-origin: bottom; animation: vn-eq .9s ease-in-out infinite alternate; }
.vn-tl-eq i:nth-child(2), .vn-now-eq i:nth-child(2) { animation-delay: -.3s; }
.vn-tl-eq i:nth-child(3), .vn-now-eq i:nth-child(3) { animation-delay: -.6s; }
.vn-tl-label { font-size: 1.06rem; line-height: 1.35; }
.vn-tl-time { font-family: var(--f-mono); font-size: .86rem; color: var(--c-accent); font-variant-numeric: tabular-nums; }
.vn-tl-item.is-playing { background: color-mix(in srgb, var(--c-accent) 12%, transparent); }
.vn-tl-item.is-playing .vn-tl-n { display: none; }
.vn-tl-item.is-playing .vn-tl-eq { display: flex; }

/* Retourner le disque. */
.vn-flip { position: relative; padding: 2rem 16px 4rem; }
.vn-flip-stage { display: flex; flex-direction: column; align-items: center; gap: 1.6rem; }
.vn-flip-disc { position: relative; width: min(62vw, 44vh, 400px); width: min(62vw, 44svh, 400px); aspect-ratio: 1; }
.vn-flip-face { position: absolute; inset: 0; }
.vn-flip-face--a { display: none; }
.vn-flip-text { display: grid; font-family: var(--f-heading); font-size: clamp(2.2rem, 9vw, 4.4rem); line-height: 1; text-transform: uppercase; text-align: center; }
.vn-flip-text > span { grid-area: 1 / 1; }
.vn-flip-a { visibility: hidden; }

/* Face B : histoire, lieu, dress code. */
.vn-split { display: grid; gap: 2.6rem; align-items: center; }
.vn-picture { width: min(78vw, 400px); margin: 0 auto; }
.vn-single { position: relative; width: min(84vw, 420px); aspect-ratio: 1; margin: 0 auto; overflow: hidden; background: var(--c-card); box-shadow: inset 0 0 0 1px var(--line), 0 30px 50px -30px rgb(0 0 0 / .75); }
.vn-single::before {
  content: ""; position: absolute; inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0 18px, color-mix(in srgb, var(--c-text) 4%, transparent) 18px 19px), var(--noise);
}
.vn-single-print { position: absolute; font-family: var(--f-mono); font-size: .66rem; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
.vn-single-print--top { left: 1rem; top: .9rem; }
.vn-single-print--bottom { right: 1rem; bottom: .9rem; }
.vn-single-photo { position: absolute; inset: 0; background-size: cover; background-position: center; clip-path: circle(calc(var(--h, .72) * 100%) at 50% 50%); }
.vn-single-ring {
  position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  border: 2px solid color-mix(in srgb, var(--c-text) 22%, transparent);
  transform: scale(calc(var(--h, .72) * 2)); opacity: calc(1 - var(--h, .72) * 1.5);
}
.vn-map-wrap { margin-top: 1.6rem; }
.vn-map {
  display: inline-flex; align-items: center; gap: .55rem; min-height: 44px; padding: .65rem 1.25rem; border-radius: 999px;
  background: var(--c-accent); color: var(--c-background); text-decoration: none;
  font-family: var(--f-mono); font-size: .78rem; letter-spacing: .12em; text-transform: uppercase;
  transform: rotate(-3deg); transition: transform .3s var(--ease-out);
}
.vn-map:hover, .vn-map:focus-visible { transform: rotate(0deg) scale(1.04); }
.vn-map:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.vn-map svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.vn-sticker-wrap { display: flex; justify-content: center; }
.vn-dress {
  position: relative; overflow: hidden; max-width: 27rem; padding: 1.7rem 1.9rem;
  border-radius: 1.4rem; background: var(--c-accent); color: var(--c-background); text-align: center;
  font-size: 1.08rem; line-height: 1.55; transform: rotate(-2.5deg);
  box-shadow: inset 0 0 0 .45rem var(--c-accent), inset 0 0 0 .55rem color-mix(in srgb, var(--c-background) 35%, transparent), 0 18px 30px -18px rgb(0 0 0 / .7);
}
.vn-dress p + p { margin-top: .8rem; }
.vn-dress::after {
  content: ""; position: absolute; top: -50%; bottom: -50%; left: -60%; width: 40%; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / .35), transparent); transform: rotate(18deg) translateX(-120%);
}

/* Galerie : le bac à disques. */
.vn-crate-row {
  --w: min(58vw, 300px);
  position: relative; display: flex; gap: clamp(.4rem, 2vw, 1rem);
  margin-inline: calc(50% - 50vw); padding: 1.5rem calc(50vw - var(--w) / 2) 1.25rem;
  overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none;
}
.vn-crate-row::-webkit-scrollbar { display: none; }
.vn-crate-item { flex: none; width: var(--w); scroll-snap-align: center; }
.vn-crate-btn {
  position: relative; display: block; width: 100%; aspect-ratio: 1; padding: 0; border: 0; overflow: hidden; cursor: pointer;
  background: var(--c-card); box-shadow: inset 0 0 0 1px var(--line), 0 24px 40px -24px rgb(0 0 0 / .8);
}
.vn-crate-btn::after { content: ""; position: absolute; inset: 6%; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / .1); pointer-events: none; }
.vn-crate-btn:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.vn-crate-img { position: absolute; inset: 0; background-size: cover; background-position: center; }
.vn-crate-num { margin-top: .7rem; text-align: center; font-family: var(--f-mono); font-size: .72rem; letter-spacing: .14em; color: var(--muted); }
.vn-crate-nav { display: none; justify-content: center; gap: .8rem; margin-top: .6rem; }
@media (hover: hover) and (pointer: fine) { .vn-crate-nav { display: flex; } }
.vn-round-btn {
  display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
  border: 1px solid var(--line); background: var(--c-card); color: var(--c-text);
  box-shadow: 0 8px 20px -10px rgb(0 0 0 / .5); transition: border-color .3s, color .3s;
}
.vn-round-btn:hover, .vn-round-btn:focus-visible { border-color: var(--c-accent); color: var(--c-accent); }
.vn-round-btn:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.vn-round-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

/* ── RSVP : le jukebox ──────────────────────────────── */
.vn-juke {
  position: relative; overflow: hidden; max-width: 30rem; margin: 0 auto; padding: 0 clamp(1.1rem, 5vw, 2.2rem) 2.2rem;
  border-radius: 13rem 13rem 1.4rem 1.4rem; text-align: center;
  background: linear-gradient(180deg, color-mix(in srgb, var(--c-card) 92%, #fff), var(--c-card) 40%);
  box-shadow: inset 0 0 0 1px var(--line), 0 40px 60px -40px rgb(0 0 0 / .85);
}
.vn-juke-top { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1.2rem; padding: 2.6rem 0 1.2rem; }
.vn-juke-glow {
  position: absolute; inset: 0 -30%; pointer-events: none;
  background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--c-accent) 34%, transparent), transparent 68%);
  transition: opacity 1.4s ease;
}
.vn-juke-window {
  position: relative; width: min(46vw, 190px); padding: 6%; border-radius: 50%;
  background: color-mix(in srgb, var(--c-background) 70%, #000);
  box-shadow: inset 0 4px 16px rgb(0 0 0 / .65), 0 0 0 4px color-mix(in srgb, var(--c-accent2) 70%, transparent), 0 0 30px -6px color-mix(in srgb, var(--c-accent) 50%, transparent);
}
.vn-eq { display: flex; align-items: flex-end; gap: 4px; height: 34px; }
.vn-eq i {
  width: 6px; height: 100%; border-radius: 2px; background: linear-gradient(to top, var(--c-accent), var(--c-accent2));
  transform-origin: bottom; transform: scaleY(.3); animation: vn-eq 1.1s ease-in-out calc(var(--k) * -137ms) infinite alternate;
}
.rsvp-title {
  font-family: var(--f-heading); font-weight: 400; font-size: clamp(2rem, 8.5vw, 3rem); line-height: 1;
  text-transform: uppercase; text-wrap: balance; margin: .4rem 0 1.4rem;
}
.rsvp-buttons { display: grid; gap: .75rem; }
.rsvp-btn {
  position: relative; display: flex; align-items: center; gap: .9rem; width: 100%; min-height: 56px;
  padding: .65rem 1rem .65rem .65rem; border: 1px solid var(--line); border-radius: 12px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--c-card) 90%, #fff), var(--c-card));
  color: var(--c-text); font: inherit; font-size: 1rem; line-height: 1.3; text-align: left; cursor: pointer;
  box-shadow: 0 4px 0 color-mix(in srgb, var(--c-card) 55%, #000), 0 12px 18px -12px rgb(0 0 0 / .6);
  transition: transform .12s ease, box-shadow .12s ease, background-color .3s ease, color .3s ease;
  -webkit-tap-highlight-color: transparent;
}
.rsvp-btn::before {
  content: "A"; flex: none; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 8px;
  background: color-mix(in srgb, var(--c-text) 9%, transparent); color: var(--c-accent);
  font-family: var(--f-mono); font-size: .9rem; font-weight: 500;
}
.rsvp-btn--maybe::before { content: "B"; }
.rsvp-btn--declined::before { content: "C"; }
.rsvp-btn:hover:not(:disabled) { border-color: color-mix(in srgb, var(--c-accent) 60%, transparent); }
.rsvp-btn:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 color-mix(in srgb, var(--c-card) 55%, #000), 0 6px 12px -10px rgb(0 0 0 / .6); }
.rsvp-btn:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.rsvp-btn.active {
  background: var(--c-accent); color: var(--c-background); border-color: transparent; transform: translateY(3px);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--c-accent) 55%, #000), 0 0 28px -4px color-mix(in srgb, var(--c-accent) 70%, transparent);
}
.rsvp-btn.active::before { background: color-mix(in srgb, var(--c-background) 22%, transparent); color: var(--c-background); }
.rsvp-btn:disabled { cursor: default; }
.rsvp-success { padding-top: .4rem; }
.rsvp-status { font-family: var(--f-heading); font-size: clamp(1.7rem, 6.5vw, 2.3rem); line-height: 1.1; text-transform: uppercase; color: var(--c-accent); margin: 0 0 1rem; text-wrap: balance; }
.rsvp-edit { font: inherit; font-size: .9rem; background: none; border: 0; color: var(--muted); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; min-height: 44px; }

/* Étincelles de la confirmation : mini-vinyles et notes. */
.vn-spark { position: fixed; z-index: 75; pointer-events: none; animation: vn-spark var(--dur, 1.3s) cubic-bezier(.2, .7, .3, 1) var(--delay, 0s) both; }
.vn-spark--disc {
  width: 24px; height: 24px; margin: -12px 0 0 -12px; border-radius: 50%;
  background: radial-gradient(circle, var(--c-accent) 0 24%, var(--c-record) 27% 100%); box-shadow: inset 0 0 0 1px rgb(255 255 255 / .18);
}
.vn-spark--note { margin: -15px 0 0 -9px; font-size: 30px; line-height: 1; color: var(--c-accent2); text-shadow: 0 2px 8px rgb(0 0 0 / .35); }

/* ── Piste cachée ───────────────────────────────────── */
.vn-hidden { position: relative; width: min(100% - 32px, 1080px); margin: 0 auto; padding-bottom: clamp(3.5rem, 9vw, 5.5rem); }
.vn-silence { height: 42vh; display: flex; flex-direction: column; align-items: center; gap: 1rem; padding-bottom: 2.5rem; }
.vn-silence-line { flex: 1; width: 1px; background: repeating-linear-gradient(180deg, var(--line) 0 6px, transparent 6px 14px); }
.vn-silence-time { font-family: var(--f-mono); font-size: .78rem; letter-spacing: .2em; color: var(--muted); font-variant-numeric: tabular-nums; }
.vn-text--center { text-align: center; }
.vn-runout { --D: min(58vw, 340px); display: flex; justify-content: center; margin-top: 3rem; }
.vn-arm--end { --arm: 0deg; }
.vn-arm--end .vn-arm-rot { transition: transform 1.5s cubic-bezier(.5, 0, .2, 1); }
.vn-runout.is-stopped .vn-tt-led { background: color-mix(in srgb, var(--c-text) 25%, transparent); box-shadow: none; }
.vn-runout.is-stopped .vn-etch text { fill: color-mix(in srgb, #fff 78%, transparent); }

.vn-footer {
  display: flex; flex-direction: column; align-items: center; gap: .35rem; text-align: center;
  padding: 2rem 16px calc(3rem + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--line);
  font-family: var(--f-mono); font-size: .7rem; letter-spacing: .16em; text-transform: uppercase; color: var(--muted);
}

/* ── Visionneuse ───────────────────────────────────── */
.vn-lightbox {
  position: fixed; inset: 0; z-index: 80; display: grid; place-items: center;
  padding: calc(env(safe-area-inset-top, 0px) + 64px) 16px calc(env(safe-area-inset-bottom, 0px) + 64px);
  background: color-mix(in srgb, var(--c-background) 94%, transparent);
  touch-action: none; opacity: 0; transition: opacity .35s ease;
}
.vn-lightbox.is-open { opacity: 1; }
.vn-lb-frame { position: relative; transform: scale(.94) translateY(12px); transition: transform .5s cubic-bezier(.2, .9, .3, 1.1); }
.vn-lightbox.is-open .vn-lb-frame { transform: none; }
.vn-lb-img {
  display: block; max-width: min(88vw, 960px); max-height: calc(100svh - 190px); width: auto; height: auto; object-fit: contain;
  box-shadow: 0 30px 60px -30px rgb(0 0 0 / .8); user-select: none; -webkit-user-drag: none;
}
.vn-lb-count { margin-top: .7rem; text-align: center; font-family: var(--f-mono); font-size: .72rem; letter-spacing: .2em; color: var(--muted); }
.vn-lightbox .vn-round-btn { position: absolute; }
.vn-lb-close { top: calc(env(safe-area-inset-top, 0px) + 12px); right: 12px; }
.vn-lb-prev { left: 12px; top: 50%; margin-top: -23px; }
.vn-lb-next { right: 12px; top: 50%; margin-top: -23px; }

/* ── Effets (script actif) ─────────────────────────── */
.fx [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity .9s ease, transform 1s var(--ease-out); transition-delay: calc(var(--i, 0) * 110ms); }
.fx [data-reveal].is-visible { opacity: 1; transform: none; }

/* Titre balayé par une tête de lecture. */
.fx .vn-head[data-reveal] { transform: none; }
.fx .vn-head[data-reveal] .vn-h2 { clip-path: inset(-.2em 100% -.2em 0); transition: clip-path 1.1s var(--ease-io) .15s; }
.fx .vn-head.is-visible .vn-h2 { clip-path: inset(-.2em -.1em -.2em 0); }

/* Paroles : la ligne chantée s'allume. */
.fx .vn-lyrics p { opacity: .22; transition: opacity .7s ease; }
.fx .vn-lyrics p.is-sung { opacity: 1; }

/* Crédits ligne à ligne : le libellé, les pointillés qui se tracent, puis la
   valeur. Pas de découpe sur la ligne elle-même : un élément entièrement
   découpé n'est jamais vu par l'IntersectionObserver. */
.fx .vn-credit[data-reveal] { transform: translateX(-10px); transition-delay: calc(var(--i) * 150ms); }
.fx .vn-credit[data-reveal] dt::after { transform: translateY(-.3em) scaleX(0); transform-origin: left; transition: transform .9s var(--ease-io) calc(var(--i) * 150ms + .2s); }
.fx .vn-credit.is-visible dt::after { transform: translateY(-.3em) scaleX(1); }
.fx .vn-credit[data-reveal] dd { opacity: 0; transition: opacity .6s ease calc(var(--i) * 150ms + .7s); }
.fx .vn-credit.is-visible dd { opacity: 1; }

/* Lecteur en haut d'écran. */
.fx .vn-now {
  display: flex; align-items: center; gap: .7rem; position: fixed; z-index: 60; left: 50%;
  top: calc(env(safe-area-inset-top, 0px) + 10px); width: min(100% - 24px, 460px);
  padding: .4rem .95rem .4rem .45rem; border-radius: 999px; overflow: hidden; pointer-events: none;
  background: color-mix(in srgb, var(--c-card) 84%, transparent); border: 1px solid var(--line);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  box-shadow: 0 14px 30px -16px rgb(0 0 0 / .65);
  transform: translate(-50%, -150%); opacity: 0; transition: transform .55s var(--ease-out), opacity .4s ease;
}
.fx .vn-now.is-shown { transform: translate(-50%, 0); opacity: 1; }
.vn-now-disc { width: 32px; flex: none; }
.vn-now-disc .vn-disc { box-shadow: none; }
.vn-now-code { font-family: var(--f-mono); font-size: .72rem; color: var(--c-accent); flex: none; }
.vn-now-title { flex: 1; min-width: 0; font-size: .84rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vn-now-eq { display: flex; align-items: flex-end; gap: 2px; height: 12px; flex: none; }
.vn-now-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--line); }
.vn-now-bar span { display: block; height: 100%; background: var(--c-accent); transform-origin: left; transform: scaleX(var(--progress, 0)); }

/* Disque retourné au défilement. */
.fx .vn-flip { height: 170vh; height: 170svh; padding: 0 16px; }
.fx .vn-flip-stage { position: sticky; top: 0; height: 100vh; height: 100svh; justify-content: center; perspective: 1400px; }
.fx .vn-flip-disc { transform-style: preserve-3d; }
.fx .vn-flip-face { display: block; -webkit-backface-visibility: hidden; backface-visibility: hidden; }
.fx .vn-flip-face--b { transform: rotateY(180deg); }
.fx .vn-flip-a { visibility: visible; transition: opacity .4s ease, transform .5s var(--ease-out); }
.fx .vn-flip-b { opacity: 0; transform: translateY(12px); transition: opacity .4s ease, transform .5s var(--ease-out); }
.fx .vn-flip-text.is-b .vn-flip-a { opacity: 0; transform: translateY(-12px); }
.fx .vn-flip-text.is-b .vn-flip-b { opacity: 1; transform: none; }

/* Picture disc posé en tournant. */
.fx .vn-picture[data-reveal] { transform: translateY(40px) rotate(-24deg) scale(.9); transition: opacity .9s ease, transform 1.3s var(--ease-out); }
.fx .vn-picture.is-visible { transform: none; }

/* Pochette 45 tours : le trou s'élargit sur la photo. */
.fx .vn-single { --h: .17; }

/* Sticker du dress code : collé d'un geste, puis un reflet passe. */
.fx .vn-dress[data-reveal] { opacity: 0; transform: scale(1.35) rotate(-14deg); transition: opacity .25s ease, transform .6s cubic-bezier(.2, 1.5, .4, 1); }
.fx .vn-dress.is-visible { opacity: 1; transform: rotate(-2.5deg); }
.fx .vn-dress.is-visible::after { animation: vn-shine 1.4s ease .5s both; }

/* Bac à disques : les pochettes voisines penchent. */
.fx .vn-crate-item { transition: none; will-change: transform; }

/* Jukebox. */
.vn-juke.is-party .vn-eq i { animation-duration: .28s; }
.vn-juke.is-skip { animation: vn-skip .5s steps(2, jump-none) both; }
.vn-juke.is-still .vn-eq i { animation: none; transform: scaleY(.06); transition: transform 1.6s ease-out; }
.vn-juke.is-still .vn-juke-glow { opacity: .2; }

/* ── Animations ────────────────────────────────────── */
@keyframes vn-slide-in { from { opacity: 0; transform: translateX(-28%) rotate(-3deg); } to { opacity: 1; transform: none; } }
@keyframes vn-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes vn-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes vn-drip { 0% { transform: translateY(-14px); } 100% { transform: translateY(50px); } }
@keyframes vn-eq { from { transform: scaleY(.25); } to { transform: scaleY(1); } }
@keyframes vn-shine { from { transform: rotate(18deg) translateX(-120%); } to { transform: rotate(18deg) translateX(520%); } }
@keyframes vn-skip { 0%, 100% { transform: none; } 25% { transform: translateX(-7px) rotate(-.6deg); } 50% { transform: translateX(6px) rotate(.5deg); } 75% { transform: translateX(-3px); } }
@keyframes vn-spark {
  0% { opacity: 0; transform: translate(0, 0) scale(.3) rotate(0deg); }
  12% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(1) rotate(var(--r)); }
}

/* ── Tailles d'écran ───────────────────────────────── */
@media (min-width: 900px) {
  .vn-split { grid-template-columns: 1fr 1fr; gap: 4.5rem; }
  .vn-split .vn-text { text-align: left; margin: 0; }
  .vn-split--reverse > .vn-text { order: 2; }
  .vn-split--single { grid-template-columns: 1fr; }
  .vn-split--single .vn-text { text-align: center; margin: 0 auto; }
}
@media (min-width: 1024px) {
  .vn-tl { --D: min(30vw, 360px); grid-template-columns: auto minmax(0, 1fr); gap: 4.5rem; align-items: start; justify-items: stretch; }
  .vn-tl-deck { position: sticky; top: calc(50vh - var(--D) * .59); }
  .vn-tl-list { margin-top: calc(var(--D) * .1); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
`;
