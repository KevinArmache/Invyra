/**
 * Coordonnées publiques d'Invyra, en un seul endroit : pied de page, tarifs,
 * paramètres, données structurées, sitemap.
 *
 * Module pur, importable côté serveur comme côté client. Seules les variables
 * NEXT_PUBLIC_* sont lisibles dans le navigateur : SITE_URL retombe donc sur
 * l'URL de production Vercel côté serveur uniquement.
 */

function siteUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

/** Origine publique, sans barre finale. */
export const SITE_URL = siteUrl();

export const SITE_NAME = "Invyra";

/** Destinataire des demandes (calendrier des disponibilités, support). */
export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL || "kevinarmache@gmail.com";

/**
 * Contact WhatsApp (formule premium). wa.me attend le numéro international
 * sans « + » ni espace.
 */
export const WHATSAPP_NUMBER = "243816864164";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const INSTAGRAM_URL = "https://www.instagram.com/kevinarmache";

/** Limites réelles des formules (voir app/actions/event.js et guest.js). */
export const FREE_GUEST_LIMIT = 15;

/**
 * Souvenirs (voir app/actions/memories.js) : photos et vidéos qu'un invité
 * peut partager (MAX_PHOTOS_PER_GUEST compte les deux, dont au plus
 * MAX_VIDEOS_PER_GUEST vidéos), et messages qu'il peut laisser dans le livre
 * d'or.
 */
export const MAX_PHOTOS_PER_GUEST = 30;
export const MAX_VIDEOS_PER_GUEST = 5;
export const MAX_MESSAGES_PER_GUEST = 20;

/** Lien WhatsApp avec un message pré-rempli. */
export function whatsappLink(message) {
  return message
    ? `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`
    : WHATSAPP_URL;
}
