/**
 * Catégories de modèles : un groupe par type d'événement, pour filtrer la
 * galerie (« Mariage », « Baby shower », « House party »…). Un modèle en a
 * une ou aucune ; la catégorie ne change rien à son rendu.
 *
 * Les libellés vivent dans les dictionnaires, sous
 * `portal.templates.categories.<clé>`. L'ordre de cette liste est celui des
 * filtres.
 *
 * Module pur : importé par les server actions (validation) et par
 * l'interface (filtres, formulaire).
 */
export const TEMPLATE_CATEGORIES = [
  "wedding",
  "engagement",
  "birthday",
  "babyshower",
  "baptism",
  "party",
  "gala",
  "corporate",
  "other",
];

/** Clé connue, sinon `null` (« sans catégorie »). */
export function normalizeCategory(value) {
  return TEMPLATE_CATEGORIES.includes(value) ? value : null;
}
