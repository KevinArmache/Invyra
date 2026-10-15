/**
 * Numéros de téléphone saisis par les invités (lien unique, voir
 * app/actions/public-link.js).
 *
 * Module pur, importable côté serveur comme côté client.
 */

/** Chiffres d'un numéro valable : de 8 (numéro local) à 15 (norme E.164). */
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

/**
 * Chiffres comparés pour reconnaître un même numéro écrit de deux façons
 * (« 0812 345 678 » et « +243 812 345 678 ») : les 9 derniers, soit le
 * numéro national sans indicatif ni zéro initial dans la plupart des pays.
 */
const KEY_DIGITS = 9;

/**
 * Numéro nettoyé : le « + » initial et les chiffres seulement, ou null s'il
 * ne peut pas être un numéro de téléphone.
 *
 *   normalizePhone("+243 81 234-5678") → "+243812345678"
 *   normalizePhone("00243812345678")   → "+243812345678"
 */
export function normalizePhone(value) {
  const raw = String(value ?? "").trim();
  let digits = raw.replace(/\D/g, "");
  let international = raw.startsWith("+");
  if (!international && digits.startsWith("00")) {
    digits = digits.slice(2);
    international = true;
  }
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return null;
  return `${international ? "+" : ""}${digits}`;
}

/** Clé de comparaison de deux numéros (voir KEY_DIGITS), ou "" sans numéro. */
export function phoneKey(value) {
  return String(value ?? "").replace(/\D/g, "").slice(-KEY_DIGITS);
}
