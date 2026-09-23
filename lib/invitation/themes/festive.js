/**
 * Festif : dégradé vif semé de confettis, carte blanche très arrondie,
 * boutons pleins. Pour les anniversaires et les soirées.
 */
const festive = {
  id: "festive",
  name: "Festif",
  occasions: ["birthday", "party"],
  heroLayout: "stacked",

  styleSchema: [
    { key: "background", type: "color" },
    { key: "background2", type: "color" },
    { key: "card", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "accent2", type: "color" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "radius", type: "range", min: 8, max: 40, step: 2, unit: "px" },
  ],

  defaultStyle: {
    background: "#ff6b9d",
    background2: "#ffb347",
    card: "#ffffff",
    text: "#2d1b33",
    accent: "#e11d74",
    accent2: "#f59e0b",
    fontHeading: "fredoka",
    fontBody: "poppins",
    radius: 28,
  },

  presets: [
    {
      id: "party",
      name: "Fête",
      style: {
        background: "#ff6b9d",
        background2: "#ffb347",
        accent: "#e11d74",
        accent2: "#f59e0b",
        card: "#ffffff",
        text: "#2d1b33",
      },
    },
    {
      id: "tropical",
      name: "Tropical",
      style: {
        background: "#00b4a0",
        background2: "#f9d423",
        accent: "#0f766e",
        accent2: "#f97316",
        card: "#ffffff",
        text: "#12302c",
      },
    },
    {
      id: "pastel",
      name: "Pastel",
      style: {
        background: "#c3b1e1",
        background2: "#fbc4ab",
        accent: "#8b5cf6",
        accent2: "#f472b6",
        card: "#fffdf9",
        text: "#3b2f4a",
      },
    },
    {
      id: "neon",
      name: "Néon",
      style: {
        background: "#1a1033",
        background2: "#3b0a57",
        accent: "#22d3ee",
        accent2: "#f0abfc",
        card: "#120b24",
        text: "#f5f3ff",
      },
    },
  ],

  css: `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 100vh; padding: 2rem 1rem; display: flex; justify-content: center;
  font-family: var(--f-body); color: var(--c-text);
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--c-card) 55%, transparent) 0 5px, transparent 6px),
    radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--c-accent2) 80%, transparent) 0 7px, transparent 8px),
    radial-gradient(circle at 70% 78%, color-mix(in srgb, var(--c-card) 50%, transparent) 0 6px, transparent 7px),
    radial-gradient(circle at 22% 88%, color-mix(in srgb, var(--c-accent) 70%, transparent) 0 8px, transparent 9px),
    linear-gradient(140deg, var(--c-background), var(--c-background2));
  background-attachment: fixed;
}
.inv { width: 100%; max-width: 500px; }
.card { background: var(--c-card); border-radius: var(--radius); padding: 1rem 1rem 2rem; box-shadow: 0 30px 60px rgba(0,0,0,.18); animation: pop .6s cubic-bezier(.2,1.4,.4,1); }
.hero-media { height: 240px; border-radius: calc(var(--radius) - 8px); background-size: cover; background-position: center; }
.hero-content { text-align: center; padding: 1.75rem 1rem 0.5rem; }
.eyebrow { display: inline-block; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: var(--c-card); background: var(--c-accent); padding: 0.3rem 0.8rem; border-radius: 999px; margin-bottom: 0.9rem; }
.title { font-family: var(--f-heading); font-size: clamp(2rem, 8vw, 2.8rem); font-weight: 600; line-height: 1.1;
  background: linear-gradient(90deg, var(--c-accent), var(--c-accent2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.intro { padding: 0.75rem 1.25rem 0; text-align: center; font-size: 1rem; }
.intro p + p { margin-top: 0.6rem; }
.divider { display: none; }
.details { padding: 1.5rem 0.5rem 0; }
.details-list { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.details-item { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.3rem; padding: 0.9rem 0.6rem; border-radius: calc(var(--radius) / 1.5); background: color-mix(in srgb, var(--c-accent) 10%, var(--c-card)); font-size: 0.9rem; font-weight: 600; }
.details-icon { font-size: 1.4rem; }
.block { margin-top: 1.75rem; padding: 0 1.25rem; }
.block-title { font-family: var(--f-heading); font-size: 1.5rem; font-weight: 600; color: var(--c-accent); margin-bottom: 0.6rem; }
.block-text { line-height: 1.6; color: color-mix(in srgb, var(--c-text) 85%, transparent); }
.block-text p + p { margin-top: 0.6rem; }
.block-image { height: 190px; margin-top: 1rem; border-radius: calc(var(--radius) / 1.5); background-size: cover; background-position: center; }
.timeline { list-style: none; display: grid; gap: 0.5rem; }
.timeline-item { display: flex; align-items: center; gap: 0.8rem; }
.timeline-time { flex: none; font-weight: 700; font-size: 0.85rem; color: var(--c-card); background: var(--c-accent2); padding: 0.25rem 0.6rem; border-radius: 999px; }
.map { margin-top: 1rem; }
.map-link { color: var(--c-accent); font-weight: 600; }
.gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.gallery-item { aspect-ratio: 1; border-radius: calc(var(--radius) / 2); background-size: cover; background-position: center; }
.gallery-item:nth-child(odd) { transform: rotate(-2deg); }
.gallery-item:nth-child(even) { transform: rotate(2deg); }
.rsvp { margin: 2rem 0.25rem 0; padding: 1.75rem 1rem; text-align: center; border-radius: calc(var(--radius) - 6px); background: linear-gradient(140deg, color-mix(in srgb, var(--c-accent) 14%, var(--c-card)), color-mix(in srgb, var(--c-accent2) 16%, var(--c-card))); }
.rsvp-title { font-family: var(--f-heading); font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; }
.rsvp-buttons { display: grid; gap: 0.5rem; }
.rsvp-btn {
  font: inherit; font-weight: 600; padding: 0.85rem 1rem; cursor: pointer; border: 2px solid transparent;
  border-radius: 999px; background: var(--c-card); color: var(--c-text); transition: transform .15s;
}
.rsvp-btn--confirmed { background: var(--c-accent); color: var(--c-card); }
.rsvp-btn:hover:not(:disabled) { transform: scale(1.03); }
.rsvp-btn:disabled { cursor: default; opacity: .75; }
.rsvp-btn.active { border-color: var(--c-text); opacity: 1; }
.rsvp-status { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }
.rsvp-edit { font: inherit; font-weight: 600; background: var(--c-card); border: none; color: var(--c-accent); padding: 0.55rem 1.1rem; border-radius: 999px; cursor: pointer; }
@keyframes pop { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }
`,
};

export default festive;
