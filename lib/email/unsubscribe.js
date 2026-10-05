import { createHmac, timingSafeEqual } from "node:crypto";

import { SITE_URL } from "@/lib/site";

/**
 * Lien de désabonnement des e-mails d'annonce.
 *
 * Le jeton est l'identifiant du compte suivi de sa signature HMAC : rien à
 * stocker, et personne ne peut désabonner un autre compte sans connaître le
 * secret. Le secret de better-auth sert de clé, avec un préfixe propre à cet
 * usage : une signature d'ici ne vaut rien ailleurs.
 *
 * Module serveur ordinaire, volontairement pas "use server" (voir
 * lib/email/transport.js).
 */

const PURPOSE = "unsubscribe:";

function signature(userId) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET est absent de l'environnement.");
  return createHmac("sha256", secret)
    .update(PURPOSE + userId)
    .digest("base64url");
}

/** Jeton de désabonnement d'un compte. */
export function unsubscribeToken(userId) {
  return `${userId}.${signature(userId)}`;
}

/**
 * @returns {string | null} l'identifiant du compte, ou null si le jeton est
 *   absent, mal formé ou falsifié
 */
export function verifyUnsubscribeToken(token) {
  if (typeof token !== "string" || token.length > 200) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const userId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(signature(userId));
  if (given.length !== expected.length) return null;
  return timingSafeEqual(given, expected) ? userId : null;
}

/** Page de désabonnement, ouverte depuis le pied de l'e-mail. */
export function unsubscribeUrl(userId) {
  return `${SITE_URL}/unsubscribe?token=${encodeURIComponent(unsubscribeToken(userId))}`;
}

/**
 * En-têtes du désabonnement en un clic (RFC 8058), qu'exigent Gmail et
 * Yahoo pour les envois groupés : la messagerie affiche son propre bouton
 * « Se désabonner », qui appelle app/api/unsubscribe en POST.
 */
export function unsubscribeHeaders(userId) {
  const token = encodeURIComponent(unsubscribeToken(userId));
  return {
    "List-Unsubscribe": `<${SITE_URL}/api/unsubscribe?token=${token}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
