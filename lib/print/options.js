/**
 * Papiers, finitions et accessoires proposés pour les invitations papier.
 *
 * `enabled` : on ne propose que ce que l'imprimeur partenaire sait faire.
 * Passer une option à false la retire de la vitrine sans toucher aux
 * modèles qui la mentionnent.
 *
 * Pour un papier, `tint` et `texture` servent à la maquette de la vitrine
 * (components/stationery/PaperCard.jsx) : teinte posée en multiplication
 * sur le modèle, grain du papier.
 *
 * Module pur. Les libellés vivent dans les dictionnaires, sous
 * `stationery.papers.<id>`, `stationery.finishes.<id>` et
 * `stationery.extras.<id>`.
 */

export const PAPERS = [
  { id: "matte", weight: 350, tint: "#ffffff", texture: "smooth", enabled: true },
  { id: "cotton", weight: 600, tint: "#fbf7ef", texture: "cotton", enabled: true },
  { id: "laid", weight: 300, tint: "#f9f4e8", texture: "laid", enabled: true },
  { id: "pearl", weight: 300, tint: "#fbf8f6", texture: "pearl", enabled: true },
  { id: "kraft", weight: 300, tint: "#d8b98e", texture: "kraft", enabled: true },
];

/**
 * Finitions. `layer` : calque séparé fourni à l'imprimeur pour les éléments
 * marqués `data-finish` dans le modèle (voir lib/print/document.js) ; null
 * pour une finition qui ne dépend pas du dessin (coins arrondis…).
 * `color` : rendu de la dorure dans les aperçus.
 */
export const FINISHES = [
  { id: "foil-gold", layer: "foil", color: "#c9a24a", enabled: true },
  { id: "foil-silver", layer: "foil", color: "#b9bec4", enabled: true },
  { id: "foil-rose", layer: "foil", color: "#d4a08f", enabled: true },
  { id: "foil-copper", layer: "foil", color: "#c27c4e", enabled: true },
  { id: "emboss", layer: "emboss", color: null, enabled: true },
  { id: "spot-uv", layer: "spot-uv", color: null, enabled: true },
  { id: "letterpress", layer: null, color: null, enabled: true },
  { id: "edge-color", layer: null, color: null, enabled: true },
  { id: "rounded-corners", layer: null, color: null, enabled: true },
  { id: "laser-cut", layer: "cut", color: null, enabled: false },
];

export const EXTRAS = [
  { id: "envelope-white", enabled: true },
  { id: "envelope-kraft", enabled: true },
  { id: "envelope-color", enabled: true },
  { id: "envelope-lined", enabled: true },
  { id: "wax-seal", enabled: true },
  { id: "ribbon", enabled: true },
  { id: "vellum-wrap", enabled: true },
  { id: "belly-band", enabled: true },
];

const PAPER_BY_ID = new Map(PAPERS.map((paper) => [paper.id, paper]));
const FINISH_BY_ID = new Map(FINISHES.map((finish) => [finish.id, finish]));

export function getPaper(id) {
  return PAPER_BY_ID.get(id) ?? null;
}

export function getFinish(id) {
  return FINISH_BY_ID.get(id) ?? null;
}

/** Papiers proposés. */
export function availablePapers() {
  return PAPERS.filter((paper) => paper.enabled);
}

/** Finitions proposées, parmi `ids` si donné. */
export function availableFinishes(ids) {
  const list = ids ? ids.map(getFinish).filter(Boolean) : FINISHES;
  return list.filter((finish) => finish.enabled);
}

export function availableExtras() {
  return EXTRAS.filter((extra) => extra.enabled);
}
