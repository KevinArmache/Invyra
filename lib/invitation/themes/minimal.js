/**
 * Minimal : page claire et aérée, typographie forte, photo pleine largeur
 * au-dessus du titre. Convient aux événements pro, baptêmes, anniversaires
 * de mariage.
 */
const minimal = {
  id: "minimal",
  name: "Minimal",
  heroLayout: "stacked",

  styleSchema: [
    { key: "background", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "radius", type: "range", min: 0, max: 24, step: 2, unit: "px" },
  ],

  defaultStyle: {
    background: "#ffffff",
    text: "#1c1c1c",
    accent: "#c2410c",
    fontHeading: "dm-serif",
    fontBody: "inter",
    radius: 4,
  },

  presets: [
    {
      id: "white",
      name: "Blanc",
      style: { background: "#ffffff", text: "#1c1c1c", accent: "#c2410c" },
    },
    {
      id: "sand",
      name: "Sable",
      style: { background: "#f4efe6", text: "#2b2620", accent: "#8a6a3f" },
    },
    {
      id: "blue",
      name: "Bleu",
      style: { background: "#f3f6fb", text: "#14213d", accent: "#2563eb" },
    },
    {
      id: "ink",
      name: "Encre",
      style: { background: "#141414", text: "#f2f2f2", accent: "#f5c451" },
    },
  ],

  css: `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--c-background); color: var(--c-text); font-family: var(--f-body); line-height: 1.6; }
.inv { max-width: 640px; margin: 0 auto; padding: 0 0 3rem; }
.hero-media { height: 300px; background-size: cover; background-position: center; border-radius: 0 0 var(--radius) var(--radius); }
.hero-content { padding: 2.5rem 1.75rem 0.5rem; }
.eyebrow { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--c-accent); margin-bottom: 0.75rem; }
.title { font-family: var(--f-heading); font-size: clamp(2.2rem, 8vw, 3.2rem); font-weight: 400; line-height: 1.05; }
.intro { padding: 1.25rem 1.75rem 0; font-size: 1.05rem; color: color-mix(in srgb, var(--c-text) 80%, transparent); }
.intro p + p { margin-top: 0.75rem; }
.divider { width: 48px; height: 3px; background: var(--c-accent); margin-bottom: 1.25rem; }
.details { padding: 2rem 1.75rem 0; }
.details-list { list-style: none; border-top: 1px solid color-mix(in srgb, var(--c-text) 15%, transparent); }
.details-item { display: flex; gap: 0.75rem; padding: 0.85rem 0; border-bottom: 1px solid color-mix(in srgb, var(--c-text) 15%, transparent); font-size: 0.98rem; }
.details-icon { filter: grayscale(1); opacity: .7; }
.block { padding: 2.5rem 1.75rem 0; }
.block-title { font-family: var(--f-heading); font-size: 1.6rem; font-weight: 400; margin-bottom: 0.75rem; }
.block-text { color: color-mix(in srgb, var(--c-text) 78%, transparent); }
.block-text p + p { margin-top: 0.75rem; }
.block-image { height: 220px; margin-top: 1.25rem; border-radius: var(--radius); background-size: cover; background-position: center; }
.timeline { list-style: none; }
.timeline-item { display: grid; grid-template-columns: 5rem 1fr; padding: 0.6rem 0; border-bottom: 1px dashed color-mix(in srgb, var(--c-text) 18%, transparent); }
.timeline-time { font-weight: 600; color: var(--c-accent); font-variant-numeric: tabular-nums; }
.map { margin-top: 1rem; }
.map-link { color: var(--c-accent); font-weight: 600; text-decoration: none; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.6rem; }
.gallery-item { aspect-ratio: 4 / 5; border-radius: var(--radius); background-size: cover; background-position: center; }
.rsvp { margin: 3rem 1.75rem 0; padding: 2rem 1.5rem; border: 1px solid color-mix(in srgb, var(--c-text) 15%, transparent); border-radius: var(--radius); text-align: center; }
.rsvp-title { font-family: var(--f-heading); font-size: 1.6rem; font-weight: 400; margin-bottom: 1.25rem; }
.rsvp-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
.rsvp-btn {
  font: inherit; font-size: 0.95rem; padding: 0.7rem 1.2rem; cursor: pointer;
  border-radius: 999px; border: 1px solid var(--c-text); background: transparent; color: var(--c-text);
  transition: background .2s, color .2s;
}
.rsvp-btn:hover:not(:disabled), .rsvp-btn.active { background: var(--c-text); color: var(--c-background); }
.rsvp-btn:disabled { cursor: default; }
.rsvp-status { font-size: 1.1rem; margin-bottom: 1rem; }
.rsvp-edit { font: inherit; background: none; border: none; color: var(--c-accent); text-decoration: underline; cursor: pointer; }
`,
};

export default minimal;
