/**
 * Polices qu'un modèle peut déclarer (champ `fonts`), chargées depuis Google
 * Fonts.
 *
 * Module pur : importé côté client et côté serveur.
 */

const FONTS = [
  {
    id: "playfair",
    label: "Playfair Display",
    stack: "'Playfair Display', Georgia, serif",
    query: "Playfair+Display:ital,wght@0,400;0,700;1,400",
  },
  {
    id: "cormorant",
    label: "Cormorant Garamond",
    stack: "'Cormorant Garamond', Georgia, serif",
    query: "Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400",
  },
  {
    id: "dm-serif",
    label: "DM Serif Display",
    stack: "'DM Serif Display', Georgia, serif",
    query: "DM+Serif+Display:ital@0;1",
  },
  {
    id: "lora",
    label: "Lora",
    stack: "'Lora', Georgia, serif",
    query: "Lora:ital,wght@0,400;0,600;1,400",
  },
  {
    id: "great-vibes",
    label: "Great Vibes",
    stack: "'Great Vibes', cursive",
    query: "Great+Vibes",
  },
  {
    id: "pinyon",
    label: "Pinyon Script",
    stack: "'Pinyon Script', cursive",
    query: "Pinyon+Script",
  },
  {
    id: "cinzel",
    label: "Cinzel",
    stack: "'Cinzel', Georgia, serif",
    query: "Cinzel:wght@400;600",
  },
  {
    id: "inter",
    label: "Inter",
    stack: "'Inter', system-ui, sans-serif",
    query: "Inter:wght@300;400;600",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    stack: "'Montserrat', system-ui, sans-serif",
    query: "Montserrat:wght@300;400;600;700",
  },
  {
    id: "josefin",
    label: "Josefin Sans",
    stack: "'Josefin Sans', system-ui, sans-serif",
    query: "Josefin+Sans:wght@300;400;600",
  },
  {
    id: "poppins",
    label: "Poppins",
    stack: "'Poppins', system-ui, sans-serif",
    query: "Poppins:wght@300;400;600;700",
  },
  {
    id: "fredoka",
    label: "Fredoka",
    stack: "'Fredoka', system-ui, sans-serif",
    query: "Fredoka:wght@400;500;600",
  },
  {
    id: "bebas",
    label: "Bebas Neue",
    stack: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
    query: "Bebas+Neue",
  },
  {
    id: "dm-mono",
    label: "DM Mono",
    stack: "'DM Mono', ui-monospace, 'Courier New', monospace",
    query: "DM+Mono:wght@400;500",
  },
  {
    id: "permanent-marker",
    label: "Permanent Marker",
    stack: "'Permanent Marker', 'Comic Sans MS', cursive",
    query: "Permanent+Marker",
  },
];

const FONTS_BY_ID = Object.fromEntries(FONTS.map((font) => [font.id, font]));

/** Feuille Google Fonts chargeant exactement les polices demandées. */
export function fontsHref(ids) {
  const queries = [...new Set(ids)]
    .map((id) => FONTS_BY_ID[id]?.query)
    .filter(Boolean);
  if (queries.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${queries
    .map((query) => `family=${query}`)
    .join("&")}&display=swap`;
}

/** Polices déclarées par un modèle : identifiants connus uniquement. */
export function normalizeFonts(fonts) {
  if (!Array.isArray(fonts)) return [];
  return [...new Set(fonts.filter((id) => FONTS_BY_ID[id]))].slice(0, 6);
}
