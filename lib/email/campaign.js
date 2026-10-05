import { safeUrl } from "@/lib/invitation/html";
import { SITE_URL } from "@/lib/site";

/**
 * Règles des e-mails d'annonce envoyés depuis l'administration (voir
 * app/actions/campaign.js) : à qui ils partent, ce qu'un envoi peut
 * contenir, et le texte proposé pour annoncer un modèle.
 *
 * Module pur : le formulaire d'envoi (client) l'importe pour ses limites et
 * le texte prérempli ; les server actions pour valider et cibler.
 */

/** Audiences de groupe : tout le monde, ou une seule formule. */
export const GROUP_AUDIENCES = ["all", "free", "premium"];

/** Toutes les audiences : les groupes, ou une personne choisie (`user`). */
export const AUDIENCES = [...GROUP_AUDIENCES, "user"];

/** Longueurs maximales des champs, reprises par le formulaire. */
export const CAMPAIGN_LIMITS = {
  subject: 150,
  preheader: 200,
  heading: 150,
  message: 5000,
  ctaLabel: 40,
  ctaUrl: 500,
};

/**
 * Comptes techniques créés par deleteMyAccount (app/actions/auth.js) : sans
 * boîte mail réelle, ils ne reçoivent jamais rien.
 */
export const TECHNICAL_EMAIL_DOMAIN = "@invyra.local";

/**
 * Filtre Prisma des destinataires : comptes actifs, qui acceptent les
 * annonces, avec une vraie adresse. Une personne choisie passe par les mêmes
 * conditions : écrire à un compte désabonné n'est pas permis non plus.
 *
 * @param {string} audience
 * @param {string} [recipientId]  le compte choisi, pour l'audience `user`
 */
export function recipientsWhere(audience, recipientId) {
  return {
    suspended: false,
    marketingEmails: true,
    NOT: { email: { endsWith: TECHNICAL_EMAIL_DOMAIN } },
    ...(audience === "free" && { plan: "free" }),
    ...(audience === "premium" && { plan: "premium" }),
    ...(audience === "user" && { id: recipientId || "" }),
  };
}

/** Texte sur une ligne : sujet, titre, libellé (pas de saut de ligne). */
function line(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/** Texte libre : les paragraphes sont gardés, les espaces de fin retirés. */
function paragraphs(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((row) => row.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function checkLength(value, max, label) {
  if (value.length > max) {
    throw new Error(`${label} : ${max} caractères au maximum.`);
  }
}

/**
 * Lien du bouton : un chemin du site (« /templates/… ») devient une adresse
 * complète ; sinon, seule une adresse https est acceptée.
 */
function ctaHref(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("/") && !raw.startsWith("//")) return `${SITE_URL}${raw}`;
  return safeUrl(raw);
}

/**
 * Valide et nettoie un envoi saisi dans le formulaire.
 *
 * @returns {{ subject: string, preheader: string, heading: string, message: string, ctaLabel: string|null, ctaUrl: string|null, templateId: string|null, audience: string, recipientId: string|null }}
 *   `recipientId` n'est pas une colonne de l'envoi : la personne choisie
 *   devient son unique destinataire.
 * @throws {Error} message en français, affiché tel quel à l'admin
 */
export function normalizeCampaignInput(input = {}) {
  const subject = line(input.subject);
  const preheader = line(input.preheader);
  const heading = line(input.heading);
  const message = paragraphs(input.message);
  const ctaLabel = line(input.ctaLabel);
  const ctaUrlRaw = String(input.ctaUrl ?? "").trim();

  if (!subject) throw new Error("L'objet de l'e-mail est obligatoire.");
  if (!heading) throw new Error("Le titre de l'e-mail est obligatoire.");
  if (!message) throw new Error("Le message est obligatoire.");

  checkLength(subject, CAMPAIGN_LIMITS.subject, "Objet");
  checkLength(preheader, CAMPAIGN_LIMITS.preheader, "Aperçu");
  checkLength(heading, CAMPAIGN_LIMITS.heading, "Titre");
  checkLength(message, CAMPAIGN_LIMITS.message, "Message");
  checkLength(ctaLabel, CAMPAIGN_LIMITS.ctaLabel, "Texte du bouton");
  checkLength(ctaUrlRaw, CAMPAIGN_LIMITS.ctaUrl, "Lien du bouton");

  const ctaUrl = ctaHref(ctaUrlRaw);
  if (ctaUrlRaw && !ctaUrl) {
    throw new Error(
      "Le lien du bouton doit commencer par https:// ou par / pour une page du site.",
    );
  }
  if (Boolean(ctaLabel) !== Boolean(ctaUrl)) {
    throw new Error("Le bouton a besoin d'un texte et d'un lien, ou d'aucun des deux.");
  }

  const audience = AUDIENCES.includes(input.audience) ? input.audience : "all";
  const templateId = shortId(input.templateId);
  const recipientId = audience === "user" ? shortId(input.recipientId) : null;
  if (audience === "user" && !recipientId) {
    throw new Error("Choisissez la personne à qui écrire.");
  }

  return {
    subject,
    preheader,
    heading,
    message,
    ctaLabel: ctaLabel || null,
    ctaUrl: ctaUrl || null,
    templateId,
    audience,
    recipientId,
  };
}

/** Identifiant de base (cuid ou uuid), sinon null. */
function shortId(value) {
  return typeof value === "string" && value.length <= 64 ? value || null : null;
}

/**
 * Texte proposé pour annoncer un modèle de la galerie. Le lien reste un
 * chemin : il devient une adresse complète à la validation (ctaHref).
 *
 * @param {{ id: string, name: string }} template
 */
export function templateAnnouncement(template) {
  const name = line(template?.name) || "Nouveau modèle";
  return {
    subject: `Nouveau modèle : ${name}`,
    preheader: `Découvrez ${name}, le dernier modèle de la galerie Invyra.`,
    heading: `${name} rejoint la galerie`,
    message: [
      `Nous venons d'ajouter un nouveau modèle à la galerie d'Invyra : ${name}.`,
      "Ouvrez-le pour voir ses couleurs, sa mise en page et ses animations, puis choisissez-le pour votre prochain événement. Textes, photos et musique se personnalisent en quelques minutes.",
    ].join("\n\n"),
    ctaLabel: "Découvrir le modèle",
    ctaUrl: `/templates/${template?.id ?? ""}`,
  };
}
