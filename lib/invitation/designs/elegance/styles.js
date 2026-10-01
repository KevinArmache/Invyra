/**
 * CSS du design Élégance. Il style le balisage standard partagé par les designs
 * simples (voir designs/_shared/standard-markup.js).
 */
export const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--c-background), var(--c-background2));
  color: var(--c-text);
  font-family: var(--f-body);
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}
.inv { width: 100%; max-width: 480px; }
.card {
  background: color-mix(in srgb, var(--c-text) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-accent) 35%, transparent);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0,0,0,0.35);
  animation: fadeIn 1s ease;
}
.card::before {
  content: ""; display: block; height: 4px;
  background: linear-gradient(90deg, transparent, var(--c-accent), transparent);
}
.hero { position: relative; min-height: 240px; display: flex; align-items: center; justify-content: center; text-align: center; }
.hero-media { position: absolute; inset: 0; background-size: cover; background-position: center; }
.hero-media::after { content: ""; position: absolute; inset: 0; background: color-mix(in srgb, #000 var(--overlay), transparent); }
.hero-content { position: relative; padding: 2.5rem 1.5rem; }
.hero:has(.hero-media) .hero-content { color: #fff; }
.eyebrow { color: var(--c-accent); font-size: 0.7rem; letter-spacing: 0.35em; text-transform: uppercase; margin-bottom: 0.9rem; }
.title { font-family: var(--f-heading); font-size: 2.1rem; font-weight: 700; line-height: 1.15; }
.intro { padding: 2.25rem 2rem 1rem; text-align: center; font-size: 1.05rem; font-style: italic; line-height: 1.6; color: color-mix(in srgb, var(--c-text) 80%, transparent); }
.intro p + p { margin-top: 0.75rem; }
.divider { width: 60px; height: 2px; margin: 0 auto 1.5rem; background: linear-gradient(90deg, transparent, var(--c-accent), transparent); }
.details { padding: 1rem 2rem 2rem; }
.details-list { list-style: none; display: grid; gap: 0.6rem; }
.details-item {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
  border: 1px solid color-mix(in srgb, var(--c-text) 10%, transparent);
  background: color-mix(in srgb, var(--c-text) 4%, transparent);
  border-radius: calc(var(--radius) / 2);
  font-size: 0.95rem;
}
.block { padding: 2rem; border-top: 1px solid color-mix(in srgb, var(--c-text) 7%, transparent); }
.block:nth-of-type(even) { background: color-mix(in srgb, var(--c-text) 3%, transparent); }
.block-title { font-family: var(--f-heading); color: var(--c-accent); font-size: 0.85rem; font-weight: 400; letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 1rem; }
.block-text { font-size: 1rem; line-height: 1.65; color: color-mix(in srgb, var(--c-text) 75%, transparent); }
.block-text p + p { margin-top: 0.75rem; }
.block-image { height: 170px; margin-top: 1.25rem; border-radius: calc(var(--radius) * 0.66); background-size: cover; background-position: center; }
.timeline { list-style: none; display: grid; gap: 0.7rem; }
.timeline-item { display: flex; gap: 1rem; align-items: baseline; }
.timeline-time { min-width: 3.5rem; color: var(--c-accent); font-weight: 700; }
.map { margin-top: 1rem; }
.map-link { color: var(--c-accent); }
.gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.gallery-item { aspect-ratio: 1; border-radius: calc(var(--radius) / 3); background-size: cover; background-position: center; }
.rsvp { padding: 2rem; text-align: center; border-top: 1px solid color-mix(in srgb, var(--c-text) 7%, transparent); }
.rsvp-title { font-family: var(--f-heading); font-size: 0.8rem; font-weight: 400; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 1.25rem; color: color-mix(in srgb, var(--c-text) 70%, transparent); }
.rsvp-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.rsvp-btn {
  font: inherit; font-size: 0.9rem; padding: 0.8rem 0.4rem; cursor: pointer;
  border-radius: calc(var(--radius) / 2);
  border: 1px solid color-mix(in srgb, var(--c-text) 15%, transparent);
  background: color-mix(in srgb, var(--c-text) 4%, transparent);
  color: var(--c-text); transition: transform .2s, border-color .2s;
}
.rsvp-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--c-accent); }
.rsvp-btn:disabled { cursor: default; opacity: .7; }
.rsvp-btn.active { border-color: var(--c-accent); color: var(--c-accent); opacity: 1; }
.rsvp-status { font-size: 1.1rem; margin-bottom: 1rem; }
.rsvp-edit { font: inherit; font-size: 0.85rem; background: transparent; border: 1px solid var(--c-accent); color: var(--c-accent); padding: 0.5rem 1rem; border-radius: 999px; cursor: pointer; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
`;
