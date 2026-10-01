/**
 * CSS du design Embarquement (page de l'invitation ; l'ouverture a le sien,
 * voir opening.js, et réutilise les palettes du tableau définies ici).
 *
 * Règle d'or : l'état par défaut est l'état final et lisible. Les états
 * masqués ou décalés n'existent que sous `html.fx`, posée par le script du
 * design.
 *
 * Le tableau des départs et les panneaux d'aéroport gardent un fond sombre
 * quelle que soit l'ambiance, comme dans un vrai terminal ; leurs lettres
 * prennent la couleur `--c-flap`.
 */
import { NOISE } from "@/lib/invitation/designs/_shared/textures";

export const css = `
:root {
  --noise: ${NOISE};
  --muted: color-mix(in srgb, var(--c-text) 60%, var(--c-background));
  --line: color-mix(in srgb, var(--c-text) 14%, transparent);
  --board: #0f1013;
  --sign: #15171b;
  --ease-out: cubic-bezier(.2, .7, .2, 1);
  --ease-io: cubic-bezier(.65, 0, .35, 1);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--c-background); }
/* overflow-x: hidden sur body (posé par le document) neutraliserait les
   positions collantes ; le débordement est coupé sur .bd. */
body {
  overflow: visible;
  background: var(--c-background);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: 1.04rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
body::before { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: var(--noise); opacity: .3; }
.bd { position: relative; z-index: 1; overflow-x: hidden; overflow-x: clip; }
.bd-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.bd-icon { flex: none; width: 1.25em; height: 1.25em; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

/* ── Palettes du tableau (split-flap) ───────────────── */
.bd-word { display: inline-flex; gap: .1em; white-space: nowrap; }
.bd-c {
  position: relative; display: inline-grid; place-items: center; width: 1.08em; height: 1.5em; overflow: hidden;
  border-radius: .14em; color: var(--c-flap); line-height: 1;
  background: linear-gradient(180deg, #272a30 0 49%, #08090b 49% 51%, #1c1e23 51%);
  box-shadow: inset 0 -1px 0 rgb(0 0 0 / .65), 0 1px 0 rgb(255 255 255 / .05);
}
.bd-c::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 50%; pointer-events: none; background: linear-gradient(180deg, rgb(255 255 255 / .08), transparent); }
.bd-c i { display: block; font-style: normal; }
.bd-c.fa i { animation: bd-flap-a .1s linear; }
.bd-c.fb i { animation: bd-flap-b .1s linear; }

/* ── Héro : le tableau des départs ──────────────────── */
.bd-hero {
  position: relative; isolation: isolate; overflow: hidden; display: grid; place-items: center;
  min-height: 100vh; min-height: 100svh; padding: clamp(3.5rem, 9vh, 5rem) 16px clamp(5.5rem, 13vh, 7.5rem);
  color: #fff; background: radial-gradient(120% 90% at 50% 20%, #1c2a45, #0b111c 70%);
}
.bd-hero-bg { position: absolute; inset: -8% 0; z-index: -2; background-size: cover; background-position: center; }
.bd-hero-shade { position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, rgb(6 10 18 / .6), rgb(6 10 18 / .35) 38%, rgb(6 10 18 / .85)); }
.bd-hero-inner { display: flex; flex-direction: column; align-items: center; gap: clamp(1rem, 3vh, 1.6rem); width: min(100%, 1000px); }
.bd-hero-top { display: flex; align-items: center; gap: .85rem; width: 100%; font-family: var(--f-mono); font-size: .76rem; letter-spacing: .2em; text-transform: uppercase; }
.bd-logo {
  display: grid; place-items: center; flex: none; width: 2.5rem; height: 2.5rem; border-radius: 50%;
  border: 1.5px solid currentColor; font-family: var(--f-heading); font-size: .82rem; letter-spacing: .02em; white-space: nowrap;
}
.bd-hero-eyebrow { flex: 1; min-width: 0; }
.bd-clock { font-variant-numeric: tabular-nums; letter-spacing: .1em; }
.bd-board {
  width: 100%; padding: clamp(.9rem, 2.6vw, 1.6rem); border-radius: 14px; color: var(--c-flap); font-family: var(--f-mono);
  background: linear-gradient(180deg, #181a1f, var(--board));
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .07), 0 40px 80px -30px rgb(0 0 0 / .85);
}
.bd-board-grid { display: grid; grid-template-columns: auto auto minmax(0, 1fr) auto auto; gap: .75rem 1.1rem; align-items: center; font-size: clamp(12px, 1.25vw, 16px); }
.bd-th { padding-bottom: .5rem; border-bottom: 1px solid rgb(255 255 255 / .08); font-size: .6em; letter-spacing: .2em; text-transform: uppercase; color: color-mix(in srgb, var(--c-flap) 50%, transparent); }
.bd-row { display: contents; }
.bd-cell { display: flex; flex-wrap: wrap; gap: .3em .55em; margin: 0; font: inherit; font-weight: 500; line-height: 1.5; text-transform: uppercase; overflow-wrap: anywhere; }
.bd-row--leg .bd-cell { font-size: .84em; opacity: .85; }
.bd-cell--status.is-boarding .bd-c i { color: var(--c-accent); animation: bd-blink 1.3s steps(2, jump-none) infinite; }
.bd-board-foot {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .7rem 1rem;
  margin-top: 1.1rem; padding-top: 1rem; border-top: 1px solid rgb(255 255 255 / .08); font-size: clamp(12px, 1.4vw, 17px);
}
.bd-board-foot:not(.is-live) { display: none; }
.bd-board-foot.is-done .bd-cd { display: none; }
.bd-foot-label { font-size: .7em; letter-spacing: .2em; text-transform: uppercase; color: color-mix(in srgb, var(--c-flap) 55%, transparent); }
.bd-cd { display: flex; flex-wrap: wrap; gap: .5em .9em; }
.bd-cd-unit { display: inline-flex; align-items: center; gap: .3em; }
.bd-cd-suffix { font-size: .72em; color: color-mix(in srgb, var(--c-flap) 55%, transparent); }
.bd-hero-pax { font-family: var(--f-mono); font-size: .8rem; letter-spacing: .14em; text-transform: uppercase; text-align: center; text-wrap: balance; color: rgb(255 255 255 / .8); }
.bd-hero-pax strong { font-weight: 500; color: #fff; }
.bd-scroll { position: absolute; left: 50%; bottom: clamp(1.2rem, 4vh, 2.2rem); width: 24px; height: 24px; margin-left: -12px; }
.bd-scroll svg { width: 100%; height: 100%; fill: #fff; transform: rotate(180deg); animation: bd-bob 2.4s ease-in-out infinite; }
.bd-rise { animation: bd-rise 1s var(--ease-out) var(--d, 0s) both; }

/* ── Progression du vol ─────────────────────────────── */
.bd-progress { display: none; }

/* ── Sections et panneaux ───────────────────────────── */
.bd-section { position: relative; width: min(100% - 32px, 1080px); margin: 0 auto; padding: clamp(4rem, 11vw, 7rem) 0; }
.bd-head { display: flex; flex-direction: column; align-items: center; gap: 1.1rem; max-width: 46rem; margin: 0 auto 2.6rem; text-align: center; }
.bd-sign {
  display: inline-flex; align-items: center; gap: .65rem; padding: .5rem .9rem .5rem .55rem; border-radius: 6px;
  background: var(--sign); color: var(--c-flap); font-family: var(--f-mono); font-size: .76rem; letter-spacing: .14em; text-transform: uppercase;
  box-shadow: 0 12px 22px -14px rgb(0 0 0 / .6);
}
.bd-sign .bd-icon { width: 22px; height: 22px; padding: 3px; border-radius: 4px; background: var(--c-flap); color: var(--sign); stroke-width: 1.9; }
.bd-sign-arrow { font-family: var(--f-body); font-size: 1rem; letter-spacing: 0; }
.bd-h2 { font-family: var(--f-heading); font-weight: 400; font-size: clamp(2.3rem, 8vw, 3.8rem); line-height: 1.1; text-wrap: balance; overflow-wrap: break-word; }
.bd-text { max-width: 36rem; margin: 0 auto; text-align: center; color: color-mix(in srgb, var(--c-text) 88%, var(--c-background)); }
.bd-text p + p { margin-top: 1rem; }
.bd-split { display: grid; gap: 2.8rem; align-items: center; }

/* Message du commandant. */
.bd-announce {
  position: relative; max-width: 42rem; margin: 0 auto; padding: clamp(1.6rem, 5vw, 2.6rem); border-radius: 18px; text-align: center;
  background: var(--c-card); box-shadow: inset 0 0 0 1px var(--line), 0 30px 50px -36px rgb(0 0 0 / .6);
}
.bd-announce-chime { display: flex; justify-content: center; gap: 6px; margin-bottom: 1.2rem; }
.bd-announce-chime i { width: 8px; height: 8px; border-radius: 50%; background: var(--c-accent); }
.bd-announce-text { font-family: var(--f-heading); font-style: italic; font-size: clamp(1.25rem, 3.6vw, 1.6rem); line-height: 1.55; }
.bd-announce-text p + p { margin-top: 1rem; }

/* Bagages : le tapis. */
.bd-belt { position: relative; padding-bottom: 2.4rem; }
.bd-tags { position: relative; z-index: 1; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12.5rem), 1fr)); gap: 1rem; max-width: 60rem; margin: 0 auto; }
.bd-tag {
  position: relative; overflow: hidden; display: flex; flex-direction: column; gap: .35rem; padding: 1.15rem 1.2rem 1rem 3.4rem;
  border-radius: 12px 5px 5px 12px; background: var(--c-card); box-shadow: inset 0 0 0 1px var(--line), 0 16px 26px -20px rgb(0 0 0 / .7);
}
.bd-tag::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2.4rem; background: var(--c-accent); }
.bd-tag-hole { position: absolute; left: .8rem; top: .85rem; width: .8rem; height: .8rem; border-radius: 50%; background: var(--c-background); box-shadow: inset 0 1px 2px rgb(0 0 0 / .35); }
.bd-tag-code {
  position: absolute; left: 0; bottom: .9rem; width: 2.4rem; text-align: center; writing-mode: vertical-rl; transform: rotate(180deg);
  font-family: var(--f-mono); font-size: .78rem; letter-spacing: .3em; color: var(--c-card);
}
.bd-tag-label { font-family: var(--f-mono); font-size: .7rem; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); }
.bd-tag-value { font-size: 1.08rem; line-height: 1.35; overflow-wrap: break-word; }
.bd-tag-bars {
  width: 100%; max-width: 8rem; height: 16px; margin-top: .4rem; opacity: .65;
  background: repeating-linear-gradient(90deg, var(--c-text) 0 1px, transparent 1px 3px, var(--c-text) 3px 5px, transparent 5px 6px, var(--c-text) 6px 7px, transparent 7px 10px);
}
.bd-belt-rail {
  position: absolute; left: calc(50% - 50vw); right: calc(50% - 50vw); bottom: 0; height: 1.4rem; overflow: hidden;
  background: #1b1d21; border-top: 2px solid #3a3e45; box-shadow: inset 0 6px 8px -6px rgb(0 0 0 / .6);
}
.bd-belt-rail::before { content: ""; position: absolute; top: 0; bottom: 0; left: -40px; right: -40px; background: repeating-linear-gradient(90deg, #2b2e34 0 18px, #1b1d21 18px 20px); }

/* Itinéraire : la carte. */
.bd-map {
  position: relative; max-width: 54rem; margin: 0 auto; padding: 1.4rem .4rem 2rem; border-radius: 20px;
  background:
    repeating-linear-gradient(0deg, color-mix(in srgb, var(--c-text) 6%, transparent) 0 1px, transparent 1px 64px),
    repeating-linear-gradient(90deg, color-mix(in srgb, var(--c-text) 6%, transparent) 0 1px, transparent 1px 64px);
}
.bd-map::before { content: ""; position: absolute; top: 1.4rem; bottom: 2rem; left: calc(.4rem + 1.5rem - 1px); border-left: 2px dashed color-mix(in srgb, var(--c-text) 30%, transparent); }
.bd-route-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.bd-route-path { fill: none; stroke: color-mix(in srgb, var(--c-text) 35%, transparent); stroke-width: 2; stroke-dasharray: 2 8; stroke-linecap: round; }
.bd-route-done { fill: none; stroke: var(--c-accent); stroke-width: 2.5; stroke-linecap: round; }
.bd-route-plane { display: none; position: absolute; left: 0; top: 0; z-index: 2; width: 34px; height: 34px; margin: -17px 0 0 -17px; fill: var(--c-accent); filter: drop-shadow(0 6px 5px rgb(0 0 0 / .25)); will-change: transform; }
.bd-stops { position: relative; list-style: none; display: grid; gap: 2.4rem; }
.bd-stop { position: relative; display: grid; grid-template-columns: 3rem 1fr; align-items: center; }
.bd-stop-dot { position: relative; z-index: 1; justify-self: center; width: 14px; height: 14px; border-radius: 50%; background: var(--c-background); border: 2px solid var(--c-accent); transition: background-color .4s ease, transform .4s ease; }
.bd-stop:nth-child(odd) .bd-stop-dot { margin-left: -12px; }
.bd-stop:nth-child(even) .bd-stop-dot { margin-left: 12px; }
.bd-stop.is-reached .bd-stop-dot { background: var(--c-accent); transform: scale(1.25); }
.bd-stop-body {
  display: grid; grid-template-columns: auto 1fr; column-gap: .9rem; align-items: baseline; padding: .9rem 1.1rem; border-radius: 12px;
  background: var(--c-card); box-shadow: inset 0 0 0 1px var(--line); transition: box-shadow .4s ease;
}
.bd-stop.is-reached .bd-stop-body { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-accent) 55%, transparent), 0 14px 24px -18px rgb(0 0 0 / .55); }
.bd-stop-code { grid-row: span 2; font-family: var(--f-mono); font-size: 1.45rem; font-weight: 500; letter-spacing: .06em; color: var(--c-accent); }
.bd-stop-time { font-family: var(--f-mono); font-size: .78rem; letter-spacing: .12em; color: var(--muted); }
.bd-stop-label { font-size: 1.06rem; line-height: 1.35; overflow-wrap: break-word; }

/* Carnet de voyage : la carte postale. */
.bd-postcard { position: relative; width: min(86vw, 440px); aspect-ratio: 3 / 2; margin: 0 auto; padding: 10px; background: #fbf8f1; transform: rotate(-3deg); box-shadow: 0 24px 40px -24px rgb(0 0 0 / .65); }
.bd-postcard-photo { position: absolute; inset: 10px; background-size: cover; background-position: center; }
.bd-postage {
  position: absolute; right: -14px; top: -18px; width: 72px; height: 86px; padding: 7px; background: #fff; transform: rotate(6deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, radial-gradient(circle at 4.5px 4.5px, transparent 2.6px, #000 3px) -4.5px -4.5px / 9px 9px;
  mask: linear-gradient(#000 0 0) content-box, radial-gradient(circle at 4.5px 4.5px, transparent 2.6px, #000 3px) -4.5px -4.5px / 9px 9px;
  filter: drop-shadow(0 4px 4px rgb(0 0 0 / .2));
}
.bd-postage > span { display: grid; place-items: center; height: 100%; background: var(--c-accent); color: #fff; font-family: var(--f-heading); font-size: 1.15rem; white-space: nowrap; }
.bd-postmark { position: absolute; right: 54px; top: 22px; width: 150px; fill: none; stroke: rgb(25 25 35 / .55); stroke-width: 1.6; transform: rotate(-8deg); mix-blend-mode: multiply; }

/* Destination : le hublot. */
.bd-window {
  position: relative; width: min(74vw, 340px); aspect-ratio: 3 / 4; margin: 0 auto; padding: 18px; border-radius: 46% / 36%;
  background: linear-gradient(145deg, color-mix(in srgb, var(--c-card) 92%, #fff), color-mix(in srgb, var(--c-card) 82%, #000));
  box-shadow: inset 0 0 0 1px var(--line), 0 30px 50px -30px rgb(0 0 0 / .6);
}
.bd-window-view { position: relative; isolation: isolate; overflow: hidden; width: 100%; height: 100%; border-radius: 44% / 34%; background: #9cc3e6; box-shadow: inset 0 6px 18px rgb(0 0 0 / .45); }
.bd-window-view::after { content: ""; position: absolute; inset: 0; z-index: 3; pointer-events: none; background: linear-gradient(135deg, rgb(255 255 255 / .2), transparent 42%); }
.bd-window-photo { position: absolute; inset: -6%; background-size: cover; background-position: center; }
.bd-clouds i {
  position: absolute; left: 0; width: 120%; height: 38%; border-radius: 50%; will-change: transform;
  background: radial-gradient(closest-side, rgb(255 255 255 / .7), rgb(255 255 255 / 0)); filter: blur(6px);
  animation: bd-cloud 22s linear infinite;
}
.bd-clouds i:nth-child(1) { top: 8%; animation-delay: -4s; }
.bd-clouds i:nth-child(2) { top: 46%; animation-duration: 30s; animation-delay: -18s; opacity: .7; }
.bd-clouds i:nth-child(3) { top: 70%; animation-duration: 26s; animation-delay: -11s; opacity: .55; }
.bd-window-shade {
  position: absolute; inset: 0; z-index: 2; transform: translateY(-101%);
  background: linear-gradient(180deg, color-mix(in srgb, var(--c-card) 96%, #000), color-mix(in srgb, var(--c-card) 86%, #000));
  box-shadow: 0 8px 14px rgb(0 0 0 / .3);
}
.bd-window-shade::after { content: ""; position: absolute; left: 50%; bottom: 10px; width: 40px; height: 6px; margin-left: -20px; border-radius: 3px; background: color-mix(in srgb, var(--c-text) 30%, transparent); }
.bd-map-link-wrap { margin-top: 1.6rem; }
.bd-map-link {
  display: inline-flex; align-items: center; gap: .55rem; min-height: 44px; padding: .65rem 1.2rem; border-radius: 999px; text-decoration: none;
  background: var(--sign); color: var(--c-flap); font-family: var(--f-mono); font-size: .78rem; letter-spacing: .12em; text-transform: uppercase;
  transition: transform .3s var(--ease-out);
}
.bd-map-link:hover, .bd-map-link:focus-visible { transform: translateY(-2px); }
.bd-map-link:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }

/* Consignes de bord : le dress code. */
.bd-safety { max-width: 30rem; margin: 0 auto; overflow: hidden; border-radius: 14px; background: var(--c-card); box-shadow: inset 0 0 0 1px var(--line), 0 24px 40px -28px rgb(0 0 0 / .7); }
.bd-safety-head { display: flex; align-items: center; gap: .8rem; padding: .85rem 1.2rem; background: var(--sign); color: var(--c-flap); font-family: var(--f-mono); font-size: .76rem; letter-spacing: .16em; text-transform: uppercase; }
.bd-safety-light {
  display: grid; place-items: center; width: 2.3rem; height: 2.3rem; border-radius: 8px;
  background: var(--c-flap); color: var(--sign); box-shadow: 0 0 18px color-mix(in srgb, var(--c-flap) 55%, transparent);
  transition: background-color .25s ease, color .25s ease, box-shadow .25s ease;
}
.bd-safety-light .bd-icon { width: 1.4rem; height: 1.4rem; }
.bd-safety-body { padding: 1.4rem 1.4rem 1.6rem; font-size: 1.06rem; line-height: 1.6; text-align: center; }
.bd-safety-body p + p { margin-top: .8rem; }

/* Passeport : la galerie. */
.bd-visas {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(1rem, 4vw, 1.8rem); max-width: 56rem; margin: 0 auto;
  padding: clamp(1rem, 4vw, 2rem); border-radius: 16px; box-shadow: inset 0 0 0 1px var(--line);
  background: repeating-radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--c-accent2) 9%, transparent) 0 1px, transparent 1px 9px), var(--c-card);
}
.bd-visa { position: relative; transform: rotate(var(--r, 0deg)); }
.bd-visa-btn { display: block; width: 100%; aspect-ratio: 4 / 5; padding: 6px; border: 0; background: #fff; cursor: zoom-in; box-shadow: 0 12px 20px -14px rgb(0 0 0 / .6); }
.bd-visa-btn:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.bd-visa-img { width: 100%; height: 100%; background-size: cover; background-position: center; }
.bd-stamp { position: absolute; right: -6%; bottom: 7%; width: 64%; pointer-events: none; opacity: .9; transform: rotate(var(--sr)); mix-blend-mode: multiply; }
.bd-stamp--a { color: var(--c-accent); }
.bd-stamp--b { color: var(--c-accent2); }
.bd-stamp g { stroke: currentColor; }
.bd-stamp text { fill: currentColor; font-family: var(--f-mono); }
.bd-stamp-label { font-size: 13px; font-weight: 500; letter-spacing: .12em; }
.bd-stamp-date { font-size: 9px; letter-spacing: .1em; }
.bd-stamp-mono { font-size: 8px; letter-spacing: .1em; }

/* Enregistrement : la réponse. */
.bd-checkin { display: grid; gap: 1.6rem; max-width: 34rem; margin: 0 auto; }
.bd-ticket {
  position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; align-items: center;
  padding: 1.3rem 1.4rem; border-radius: 14px; background: var(--c-card); box-shadow: inset 0 0 0 1px var(--line), 0 20px 34px -26px rgb(0 0 0 / .7);
}
.bd-ticket-info { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .35rem .9rem; align-items: baseline; }
.bd-ticket-label { font-family: var(--f-mono); font-size: .68rem; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
.bd-ticket-value { font-size: 1rem; overflow-wrap: anywhere; }
.bd-ticket-scan { position: relative; overflow: hidden; width: 92px; padding: 6px; border-radius: 8px; background: #fff; }
.bd-code { display: block; width: 100%; height: auto; fill: #111; }
.bd-scanline { position: absolute; left: 0; right: 0; top: 0; height: 3px; opacity: 0; background: #2ee88a; box-shadow: 0 0 10px 2px rgb(46 232 138 / .7); }
.bd-ok {
  position: absolute; right: 1.2rem; top: 50%; padding: .3rem .8rem; border: 3px double currentColor; border-radius: 8px; pointer-events: none;
  font-family: var(--f-mono); font-size: .95rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; white-space: nowrap;
  background: color-mix(in srgb, var(--c-card) 75%, transparent); opacity: 0; transform: translateY(-50%) rotate(-10deg);
}
.bd-ok--confirmed { color: var(--c-accent); }
.bd-ok--maybe { color: var(--c-accent2); }
.bd-ok--declined { color: var(--muted); }
.bd-checkin[data-state="confirmed"] .bd-ok--confirmed,
.bd-checkin[data-state="maybe"] .bd-ok--maybe,
.bd-checkin[data-state="declined"] .bd-ok--declined { opacity: 1; animation: bd-slam .45s cubic-bezier(.3, 1.5, .5, 1) both; }
.bd-checkin.is-scanning .bd-scanline { animation: bd-scan .6s ease-in-out 2 alternate; }
.rsvp { text-align: center; }
.rsvp-title { margin-bottom: 1.3rem; font-family: var(--f-heading); font-weight: 400; font-size: clamp(2rem, 7vw, 3rem); line-height: 1.1; text-wrap: balance; }
.rsvp-buttons { display: grid; gap: .7rem; }
.rsvp-btn {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: 100%; min-height: 56px; padding: .8rem 1.15rem;
  border: 1px solid var(--line); border-radius: 12px; background: var(--c-card); color: var(--c-text);
  font: inherit; font-size: 1.02rem; line-height: 1.3; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: border-color .3s ease, background-color .3s ease, color .3s ease, transform .15s ease;
}
.rsvp-btn::after { content: "\\2192"; flex: none; font-family: var(--f-mono); color: var(--c-accent); transition: transform .3s var(--ease-out); }
.rsvp-btn:hover:not(:disabled) { border-color: color-mix(in srgb, var(--c-accent) 55%, transparent); }
.rsvp-btn:hover:not(:disabled)::after { transform: translateX(4px); }
.rsvp-btn:active:not(:disabled) { transform: scale(.985); }
.rsvp-btn:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.rsvp-btn.active { background: var(--c-accent); color: var(--c-card); border-color: transparent; }
.rsvp-btn.active::after { content: "\\2713"; color: currentColor; }
.rsvp-btn:disabled { cursor: default; }
.rsvp-status { margin-bottom: .8rem; font-family: var(--f-heading); font-size: clamp(1.5rem, 5vw, 2rem); line-height: 1.2; color: var(--c-accent); text-wrap: balance; }
.rsvp-edit { min-height: 44px; font: inherit; font-size: .9rem; background: none; border: 0; color: var(--muted); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }

/* Décollage : la conclusion. */
.bd-takeoff {
  position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: flex-end; justify-content: center;
  min-height: 115vh; min-height: 115svh; padding: 34vh 16px clamp(4rem, 12vh, 7rem);
  background: linear-gradient(180deg, var(--c-background) 0%, color-mix(in srgb, var(--c-accent2) 28%, var(--c-background)) 55%, color-mix(in srgb, var(--c-accent) 36%, var(--c-background)) 100%);
}
.bd-sky { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.bd-sky-sun {
  position: absolute; left: 50%; bottom: -16vmin; width: 56vmin; height: 56vmin; margin-left: -28vmin; border-radius: 50%; opacity: .8;
  background: radial-gradient(circle, color-mix(in srgb, var(--c-accent) 65%, #fff) 0 33%, color-mix(in srgb, var(--c-accent) 35%, transparent) 34%, transparent 70%);
}
.bd-sky-cloud { position: absolute; height: 9vh; border-radius: 50%; background: radial-gradient(closest-side, rgb(255 255 255 / .5), transparent); filter: blur(8px); }
.bd-sky-cloud--1 { left: -10%; top: 20%; width: 60%; }
.bd-sky-cloud--2 { right: -15%; top: 40%; width: 70%; }
.bd-sky-cloud--3 { left: 15%; top: 62%; width: 50%; }
.bd-contrail { position: absolute; inset: 0; width: 100%; height: 100%; }
.bd-contrail { overflow: visible; }
.bd-contrail path { fill: none; stroke: rgb(255 255 255 / .85); stroke-width: 3; stroke-linecap: round; }
.bd-sky-plane { display: none; position: absolute; left: 0; top: 0; width: 44px; height: 44px; margin: -22px 0 0 -22px; fill: color-mix(in srgb, var(--c-text) 85%, #000); will-change: transform; }
.bd-takeoff-content { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1.4rem; max-width: 42rem; text-align: center; }
.bd-takeoff-content .bd-head { margin-bottom: 0; }
.bd-text--center { text-align: center; }
.bd-skywrite {
  font-family: var(--f-heading); font-style: italic; font-size: clamp(2.2rem, 8vw, 3.8rem); line-height: 1.15; text-wrap: balance;
  text-shadow: 0 0 22px rgb(255 255 255 / .6);
}
.bd-footer {
  display: flex; flex-direction: column; align-items: center; gap: .3rem; padding: 2rem 16px calc(2.6rem + env(safe-area-inset-bottom, 0px));
  font-family: var(--f-mono); font-size: .72rem; letter-spacing: .16em; text-transform: uppercase; text-align: center;
  color: color-mix(in srgb, var(--c-text) 75%, transparent); background: color-mix(in srgb, var(--c-accent) 36%, var(--c-background));
}

/* ── Visionneuse ───────────────────────────────────── */
.bd-lightbox {
  position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; touch-action: none; opacity: 0; transition: opacity .35s ease;
  padding: calc(env(safe-area-inset-top, 0px) + 64px) 16px calc(env(safe-area-inset-bottom, 0px) + 64px);
  background: color-mix(in srgb, var(--c-background) 94%, transparent);
}
.bd-lightbox.is-open { opacity: 1; }
.bd-lb-frame { position: relative; padding: 8px 8px .6rem; background: #fff; transform: scale(.94) rotate(-1.5deg); transition: transform .5s cubic-bezier(.2, .9, .3, 1.1); box-shadow: 0 30px 60px -30px rgb(0 0 0 / .7); }
.bd-lightbox.is-open .bd-lb-frame { transform: none; }
.bd-lb-img { display: block; max-width: min(88vw, 960px); max-height: calc(100svh - 190px); width: auto; height: auto; object-fit: contain; user-select: none; -webkit-user-drag: none; }
.bd-lb-count { margin-top: .5rem; text-align: center; font-family: var(--f-mono); font-size: .72rem; letter-spacing: .2em; color: #555; }
.bd-lb-btn {
  position: absolute; display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
  border: 1px solid var(--line); background: var(--c-card); color: var(--c-text); box-shadow: 0 8px 20px -10px rgb(0 0 0 / .5);
}
.bd-lb-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.bd-lb-btn:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.bd-lb-close { top: calc(env(safe-area-inset-top, 0px) + 12px); right: 12px; }
.bd-lb-prev { left: 12px; top: 50%; margin-top: -23px; }
.bd-lb-next { right: 12px; top: 50%; margin-top: -23px; }

/* ── Effets (script actif) ─────────────────────────── */
.fx [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity .9s ease, transform 1s var(--ease-out); transition-delay: calc(var(--i, 0) * 110ms); }
.fx [data-reveal].is-visible { opacity: 1; transform: none; }

/* Progression du vol en haut d'écran. */
.fx .bd-progress { display: block; position: fixed; z-index: 60; left: 0; right: 0; top: env(safe-area-inset-top, 0px); height: 24px; pointer-events: none; opacity: 0; transition: opacity .4s ease; }
.fx .bd-progress.is-shown { opacity: 1; }
.bd-progress-line { position: absolute; left: 0; right: 0; top: 11px; height: 2px; background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--c-text) 25%, transparent) 0 6px, transparent 6px 12px); }
.bd-progress-line::after { content: ""; position: absolute; inset: 0; background: var(--c-accent); transform-origin: left; transform: scaleX(var(--p, 0)); }
.bd-progress-plane { position: absolute; left: 0; top: 0; width: 24px; height: 24px; fill: var(--c-accent); transform: translateX(calc(var(--p, 0) * (100vw - 28px))) rotate(90deg); }

/* Message du commandant : le carillon, puis les mots un à un. */
.fx .bd-announce-chime i { opacity: .25; }
.fx .bd-announce.is-on .bd-announce-chime i { animation: bd-ping 1.2s ease-out both; }
.fx .bd-announce.is-on .bd-announce-chime i:nth-child(2) { animation-delay: .15s; }
.fx .bd-announce.is-on .bd-announce-chime i:nth-child(3) { animation-delay: .3s; }
.fx .bd-w { display: inline-block; opacity: 0; transform: translateY(.35em); transition: opacity .45s ease, transform .55s var(--ease-out); transition-delay: calc(.5s + var(--w) * 24ms); }
.fx .bd-announce.is-on .bd-w { opacity: 1; transform: none; }

/* Bagages : les étiquettes arrivent sur le tapis, qui s'arrête ensuite. */
.fx .bd-tag { transform: translateX(110vw); }
.fx .bd-belt.is-arriving .bd-tag { transform: none; transition: transform 1.6s cubic-bezier(.2, .65, .25, 1); transition-delay: calc(var(--i) * 260ms); }
.fx .bd-belt.is-arriving:not(.is-arrived) .bd-belt-rail::before { animation: bd-belt .45s linear infinite; }

/* Itinéraire : la route est tracée par le script. */
.fx .bd-map::before { display: none; }
.fx .bd-route-plane { display: block; }

/* Carte postale posée sur la table. */
.fx .bd-postcard[data-reveal] { transform: translateY(50px) rotate(-14deg) scale(.92); transition: opacity .9s ease, transform 1.3s var(--ease-out); }
.fx .bd-postcard.is-visible { transform: rotate(-3deg); }

/* Hublot : le volet se lève au défilement. */
.fx .bd-window-shade { transform: translateY(0); }

/* Consigne lumineuse qui s'allume. */
.fx .bd-safety[data-reveal] .bd-safety-light { background: #2a2c31; color: color-mix(in srgb, var(--c-flap) 35%, transparent); box-shadow: none; }
.fx .bd-safety.is-visible .bd-safety-light { background: var(--c-flap); color: var(--sign); box-shadow: 0 0 18px color-mix(in srgb, var(--c-flap) 55%, transparent); animation: bd-lamp .9s steps(1, end) .6s both; }

/* Tampons de visa. */
.fx .bd-visa[data-reveal] { transform: translateY(24px) rotate(var(--r)); }
.fx .bd-visa.is-visible { transform: rotate(var(--r)); }
.fx .bd-visa[data-reveal] .bd-stamp { opacity: 0; transform: rotate(var(--sr)) scale(1.8); }
.fx .bd-visa.is-visible .bd-stamp {
  opacity: .9; transform: rotate(var(--sr));
  transition: transform .35s cubic-bezier(.3, 1.5, .5, 1), opacity .15s ease;
  transition-delay: calc(var(--i) * 130ms + .55s);
}

/* Décollage : l'avion et sa traînée suivent le défilement. */
.fx .bd-sky-plane { display: block; }
.fx .bd-skywrite .bd-l { opacity: 0; filter: blur(10px); transition: opacity .8s ease, filter 1s ease; transition-delay: calc(var(--l) * 45ms); }
.fx .bd-skywrite.is-written .bd-l { opacity: 1; filter: blur(0); }

/* ── Animations ────────────────────────────────────── */
@keyframes bd-flap-a { from { transform: scaleY(.15); opacity: .4; } to { transform: none; opacity: 1; } }
@keyframes bd-flap-b { from { transform: scaleY(.15); opacity: .4; } to { transform: none; opacity: 1; } }
@keyframes bd-blink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
@keyframes bd-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes bd-bob { 0%, 100% { transform: rotate(180deg) translateY(0); } 50% { transform: rotate(180deg) translateY(-7px); } }
@keyframes bd-ping { 0% { opacity: .25; transform: scale(1); } 30% { opacity: 1; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
@keyframes bd-belt { from { transform: translateX(0); } to { transform: translateX(-20px); } }
@keyframes bd-cloud { from { transform: translateX(-60%); } to { transform: translateX(60%); } }
@keyframes bd-lamp { 0% { opacity: .3; } 20% { opacity: 1; } 35% { opacity: .3; } 50%, 100% { opacity: 1; } }
@keyframes bd-scan { from { top: 0; opacity: 1; } to { top: calc(100% - 3px); opacity: 1; } }
@keyframes bd-slam {
  0% { opacity: 0; transform: translateY(-50%) rotate(-22deg) scale(1.8); }
  60% { opacity: 1; transform: translateY(-50%) rotate(-8deg) scale(.94); }
  100% { opacity: 1; transform: translateY(-50%) rotate(-10deg) scale(1); }
}

/* ── Tailles d'écran ───────────────────────────────── */
@media (max-width: 639px) {
  .bd-board-grid { grid-template-columns: minmax(0, 1fr); gap: .85rem; font-size: clamp(11px, 3.6vw, 15px); }
  .bd-th { display: none; }
  .bd-row {
    display: grid; gap: .45rem .7rem; padding-bottom: .85rem; border-bottom: 1px solid rgb(255 255 255 / .07);
    grid-template-columns: auto auto minmax(0, 1fr); grid-template-areas: "time flight gate" "dest dest dest" "status status status";
  }
  .bd-row .bd-cell--time { grid-area: time; }
  .bd-row .bd-cell--flight { grid-area: flight; }
  .bd-row .bd-cell--gate { grid-area: gate; justify-content: flex-end; }
  .bd-row .bd-cell--dest { grid-area: dest; }
  .bd-row .bd-cell--status { grid-area: status; }
  .bd-row--leg { grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "time dest"; }
  .bd-row--leg .bd-cell--flight, .bd-row--leg .bd-cell--gate, .bd-row--leg .bd-cell--status { display: none; }
  .bd-row:last-child { border-bottom: 0; padding-bottom: 0; }
}
@media (min-width: 900px) {
  .bd-split { grid-template-columns: 1fr 1fr; gap: 4.5rem; }
  .bd-split .bd-text { margin: 0; text-align: left; }
  .bd-split--reverse > .bd-text { order: 2; }
  .bd-split--single { grid-template-columns: 1fr; }
  .bd-split--single .bd-text { margin: 0 auto; text-align: center; }
  .bd-map { padding: 2rem 1rem 2.6rem; }
  .bd-map::before { left: 50%; }
  .bd-stops { gap: 2.8rem; }
  .bd-stop { grid-template-columns: 1fr 9rem 1fr; }
  .bd-stop-dot { grid-column: 2; grid-row: 1; }
  .bd-stop:nth-child(odd) .bd-stop-dot { margin-left: -70px; }
  .bd-stop:nth-child(even) .bd-stop-dot { margin-left: 70px; }
  .bd-stop:nth-child(odd) .bd-stop-body { grid-column: 1; grid-row: 1; }
  .bd-stop:nth-child(even) .bd-stop-body { grid-column: 3; grid-row: 1; }
  .bd-visas { grid-template-columns: repeat(3, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
`;
