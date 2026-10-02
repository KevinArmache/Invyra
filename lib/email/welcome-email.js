import { escapeHtml } from "@/lib/invitation/html";
import {
  BRAND_HEX,
  GOLD_LINE,
  SANS,
  SERIF,
  button,
  emailShell,
  eyebrow,
  ornament,
} from "@/lib/email/layout";
import {
  CONTACT_EMAIL,
  FREE_GUEST_LIMIT,
  SITE_URL,
  WHATSAPP_URL,
} from "@/lib/site";

/**
 * E-mail de bienvenue, envoyé à chaque nouveau compte (voir
 * lib/auth/server.js) : ce qu'Invyra permet de faire, en quatre étapes, et
 * le chemin vers le premier événement.
 */

const C = BRAND_HEX;

const STEPS = [
  {
    title: "Créez votre événement",
    text: "Donnez-lui un titre, une date, un lieu et, si vous le souhaitez, un code vestimentaire.",
  },
  {
    title: "Choisissez votre modèle",
    text: "Parcourez la galerie, puis personnalisez textes, photos, couleurs et musique, sans écrire une ligne de code.",
  },
  {
    title: "Invitez vos proches",
    text: "Ajoutez vos invités et envoyez à chacun son invitation personnelle par e-mail ou par WhatsApp.",
  },
  {
    title: "Suivez les réponses",
    text: "Voyez qui a ouvert son invitation et qui a répondu, puis exportez la liste des invités en PDF.",
  },
];

function step(number, { title, text }, last) {
  return `<tr>
  <td width="48" valign="top" style="width:48px;padding:0 0 ${last ? "0" : "22px"};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" valign="middle" width="34" height="34" style="width:34px;height:34px;border-radius:17px;border:1px solid ${C.gold};font-family:${SERIF};font-size:15px;line-height:15px;color:${C.gold};">${number}</td>
      </tr>
    </table>
  </td>
  <td valign="top" style="padding:5px 0 ${last ? "0" : "22px"} 4px;">
    <p style="margin:0;font-family:${SERIF};font-size:18px;line-height:24px;color:${C.ivory};">${title}</p>
    <p style="margin:6px 0 0;font-family:${SANS};font-size:14px;line-height:22px;color:${C.soft};">${text}</p>
  </td>
</tr>`;
}

/**
 * @param {object} data
 * @param {string} [data.name]   nom saisi à l'inscription
 * @param {string} data.email
 * @returns {{ subject: string, text: string, html: string }}
 */
export function buildWelcomeEmail({ name, email }) {
  const e = escapeHtml;
  const firstName = String(name ?? "").trim().split(/\s+/)[0] ?? "";
  const dashboard = `${SITE_URL}/dashboard`;
  const newEvent = `${SITE_URL}/dashboard/events/new`;
  const templates = `${SITE_URL}/dashboard/templates`;

  const subject = firstName
    ? `Bienvenue sur Invyra, ${firstName}`
    : "Bienvenue sur Invyra";
  const preheader =
    "Votre compte est prêt. Créez votre premier événement et envoyez vos invitations en quelques minutes.";
  // Espace insécable : « prêt » ne reste jamais seul sur sa ligne.
  const heading = firstName
    ? `Bonjour ${e(firstName)}, votre compte est&nbsp;prêt`
    : "Votre compte est&nbsp;prêt";

  const text = [
    firstName ? `Bonjour ${firstName},` : "Bonjour,",
    "",
    "Votre compte Invyra est prêt. Vous pouvez créer une invitation en ligne à votre image, l'envoyer à vos invités et suivre leurs réponses au même endroit.",
    "",
    ...STEPS.map((item, index) => `${index + 1}. ${item.title} : ${item.text}`),
    "",
    `Votre formule Découverte : 1 événement et jusqu'à ${FREE_GUEST_LIMIT} invités, gratuitement. Pour inviter plus de monde, l'Événement premium s'active sur WhatsApp : ${WHATSAPP_URL}`,
    "",
    `Créer mon premier événement : ${newEvent}`,
    `Voir les modèles : ${templates}`,
    "",
    `Une question ? Écrivez-nous à ${CONTACT_EMAIL}.`,
    "",
    `Développé par Invyra : ${SITE_URL}`,
  ].join("\n");

  const body = `<tr>
  <td style="height:4px;line-height:4px;font-size:0;background-color:${C.gold};background-image:linear-gradient(90deg, ${C.goldDeep}, ${C.goldBright}, ${C.gold}, ${C.goldBright}, ${C.goldDeep});border-radius:17px 17px 0 0;">&nbsp;</td>
</tr>
<tr>
  <td align="center" class="px" style="padding:44px 48px 0;">
    ${eyebrow("Bienvenue")}
    <h1 class="title" style="margin:14px 0 0;font-family:${SERIF};font-size:34px;line-height:42px;font-weight:400;color:${C.ivory};">${heading}</h1>
    ${ornament()}
    <p style="margin:24px 0 0;font-family:${SANS};font-size:15px;line-height:25px;color:${C.soft};">Avec Invyra, vous créez une invitation en ligne à votre image, vous l'envoyez à vos invités et vous suivez leurs réponses au même endroit. Voici comment démarrer.</p>
  </td>
</tr>

<!-- Étapes -->
<tr>
  <td class="px" style="padding:34px 48px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${STEPS.map((item, index) => step(index + 1, item, index === STEPS.length - 1)).join("\n")}
    </table>
  </td>
</tr>

<!-- Formule -->
<tr>
  <td class="px-sm" style="padding:34px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.raised};border:1px solid ${GOLD_LINE};border-radius:14px;">
      <tr>
        <td class="px" style="padding:22px 24px;">
          ${eyebrow("Votre formule Découverte", { align: "left" })}
          <p style="margin:8px 0 0;font-family:${SERIF};font-size:17px;line-height:25px;color:${C.ivory};">1 événement et jusqu'à ${FREE_GUEST_LIMIT} invités, gratuitement.</p>
          <p style="margin:6px 0 0;font-family:${SANS};font-size:13px;line-height:21px;color:${C.soft};">Pour inviter plus de monde, l'Événement premium s'active en un message : <a href="${e(WHATSAPP_URL)}" target="_blank" style="color:${C.gold};text-decoration:none;">écrivez-nous sur WhatsApp</a>.</p>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- Appel -->
<tr>
  <td align="center" class="px" style="padding:38px 48px 0;">
    ${button({ href: newEvent, label: "Créer mon premier événement", width: 330 })}
    <p style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};">Ou <a href="${e(templates)}" target="_blank" style="color:${C.gold};text-decoration:none;">parcourez les modèles</a> avant de vous lancer.</p>
  </td>
</tr>

<!-- Aide -->
<tr>
  <td align="center" class="px" style="padding:30px 48px 40px;">
    <p style="margin:0;font-family:${SANS};font-size:13px;line-height:21px;color:${C.muted};">Une question ? Écrivez-nous à <a href="mailto:${e(CONTACT_EMAIL)}" style="color:${C.soft};text-decoration:underline;">${e(CONTACT_EMAIL)}</a>.</p>
    <p style="margin:10px 0 0;font-family:${SANS};font-size:13px;line-height:21px;"><a href="${e(dashboard)}" target="_blank" style="color:${C.gold};text-decoration:none;">Accéder à mon tableau de bord</a></p>
  </td>
</tr>`;

  const html = emailShell({
    title: subject,
    preheader,
    body,
    footer: `Vous recevez cet e-mail parce qu'un compte Invyra vient d'être créé avec l'adresse ${e(email)}.`,
  });

  return { subject, text, html };
}
