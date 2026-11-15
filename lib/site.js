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

/**
 * Contact WhatsApp : support, demandes de réservation, formule premium. wa.me attend le numéro international
 * sans « + » ni espace.
 */
export const WHATSAPP_NUMBER = "243816864164";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

/**
 * Invités qu'un compte non activé peut ajouter (voir app/actions/guest.js et
 * lib/guests/capacity.js). Cet essai reste appliqué, mais il n'est jamais
 * annoncé aux visiteurs : ne pas l'afficher dans les textes.
 */
export const FREE_GUEST_LIMIT = 15;

/**
 * Tarifs publics, en dollars US, par invitation. Ces constantes alimentent les
 * données structurées, le calcul des commandes papier et l'email de bienvenue.
 * Les cartes de tarifs, l'email de bienvenue, le message de limite et les
 * commandes papier formatent ces constantes. Certains textes écrivent le prix
 * en clair : si un prix change, mettre aussi à jour dans locales/fr.json et
 * en.json les clés landing.hero.free_note, landing.faq.items,
 * landing.pricing.plans.print.features, settings.plan_free_limits et
 * stationery.meta_description.
 */
export const DIGITAL_PRICE_USD = 1;
export const PRINT_PRICE_USD = 2.5;
/** Commande minimum d'invitations papier. */
export const PRINT_MIN_QUANTITY = 100;

/**
 * Montant en dollars : « 2,50 $ » / « $2.50 », et « 1 $ » / « $1 » pour un
 * montant rond.
 */
export function formatUsd(amount, locale = "fr") {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

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
