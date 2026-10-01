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
