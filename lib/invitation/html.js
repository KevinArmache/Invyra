/**
 * Échappement et URL sûres : tout ce qui finit dans le HTML ou le CSS d'une
 * invitation passe par ici.
 *
 * Module pur : importé côté client (aperçu, éditeur) et côté serveur
 * (validation, e-mails).
 */

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Texte multi-ligne : une ligne vide sépare deux paragraphes. */
export function paragraphs(value) {
  return String(value ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * N'accepte que les URL https absolues. Tout le reste (javascript:, data:,
 * chemins relatifs…) est rejeté : ces valeurs finissent dans des attributs et
 * du CSS, où un schéma exotique serait une porte d'entrée.
 */
export function safeUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

/** URL déjà validée par safeUrl, rendue sûre pour `url("…")` en CSS. */
export function cssUrl(url) {
  return `url("${String(url).replace(/["\\\n\r()]/g, (c) => encodeURIComponent(c))}")`;
}

/**
 * Calque d'image de fond (`<div style="background-image:…">`), ou rien si
 * l'URL n'est pas sûre.
 */
export function imageLayer(url, className, attributes = "") {
  const safe = safeUrl(url);
  if (!safe) return "";
  return `<div class="${className}" style="${escapeHtml(`background-image:${cssUrl(safe)}`)}" ${attributes}></div>`;
}
