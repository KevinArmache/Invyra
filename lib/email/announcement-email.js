import { escapeHtml, safeUrl } from "@/lib/invitation/html";
import {
  BRAND_HEX,
  SANS,
  SERIF,
  button,
  emailShell,
  eyebrow,
  ornament,
} from "@/lib/email/layout";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

/**
 * E-mail d'annonce envoyé à tous les utilisateurs depuis l'administration
 * (voir app/actions/campaign.js) : un nouveau modèle, une nouveauté.
 *
 * Le texte est saisi par un admin : il est échappé ici, paragraphe par
 * paragraphe. Chaque e-mail porte le lien de désabonnement de son
 * destinataire.
 */

const C = BRAND_HEX;

/** Paragraphes séparés par une ligne vide ; un simple retour reste un retour. */
function messageHtml(message) {
  const blocks = String(message ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map(
      (block, index) =>
        `<p style="margin:${index === 0 ? "0" : "16px 0 0"};font-family:${SANS};font-size:15px;line-height:25px;color:${C.soft};">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`,
    )
    .join("\n");
}

/** Largeur du bouton VML (Outlook), à peu près proportionnelle au texte. */
function buttonWidth(label) {
  return Math.min(420, Math.max(240, label.length * 11 + 90));
}

/**
 * @param {object} data
 * @param {string} [data.name]            nom du destinataire
 * @param {string} data.email             adresse du destinataire
 * @param {string} data.subject
 * @param {string} [data.preheader]
 * @param {string} data.heading
 * @param {string} data.message           texte brut, paragraphes séparés par une ligne vide
 * @param {string} [data.ctaLabel]
 * @param {string} [data.ctaUrl]          adresse complète
 * @param {{ name: string, categoryLabel?: string, imageUrl?: string } | null} [data.template]
 * @param {string} data.unsubscribeUrl
 * @returns {{ subject: string, text: string, html: string }}
 */
export function buildAnnouncementEmail({
  name,
  email,
  subject,
  preheader,
  heading,
  message,
  ctaLabel,
  ctaUrl,
  template,
  unsubscribeUrl,
}) {
  const e = escapeHtml;
  const firstName = String(name ?? "").trim().split(/\s+/)[0] ?? "";
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";
  const image = safeUrl(template?.imageUrl ?? "");
  const label = template
    ? template.categoryLabel || "Nouveau modèle"
    : "Nouveauté";
  const hasButton = Boolean(ctaLabel && ctaUrl);

  const text = [
    greeting,
    "",
    heading,
    "",
    message,
    "",
    hasButton ? `${ctaLabel} : ${ctaUrl}` : "",
    "",
    `Une question ? Écrivez-nous à ${CONTACT_EMAIL}.`,
    "",
    `Ne plus recevoir les nouveautés d'Invyra : ${unsubscribeUrl}`,
    `Développé par Invyra : ${SITE_URL}`,
  ]
    // Sans bouton, sa ligne vide en suivrait une autre : une seule suffit.
    .filter((row, index, rows) => row !== "" || rows[index - 1] !== "")
    .join("\n");

  // ── En-tête : la photo du modèle, ou un filet or ─────────────────────────
  // Même traitement que l'e-mail d'invitation : une photo en hauteur est
  // coupée en bas plutôt que déformée.
  const header = image
    ? `<tr>
  <td style="padding:0;">
    <div style="max-height:400px;overflow:hidden;border-radius:17px 17px 0 0;">
      <img src="${e(image)}" width="600" alt="${e(template?.name ?? heading)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
    </div>
  </td>
</tr>`
    : `<tr>
  <td style="height:4px;line-height:4px;font-size:0;background-color:${C.gold};background-image:linear-gradient(90deg, ${C.goldDeep}, ${C.goldBright}, ${C.gold}, ${C.goldBright}, ${C.goldDeep});border-radius:17px 17px 0 0;">&nbsp;</td>
</tr>`;

  const body = `${header}
<tr>
  <td align="center" class="px" style="padding:44px 48px 0;">
    ${eyebrow(e(label))}
    <h1 class="title" style="margin:14px 0 0;font-family:${SERIF};font-size:34px;line-height:42px;font-weight:400;color:${C.ivory};">${e(heading)}</h1>
    ${ornament()}
  </td>
</tr>

<!-- Message -->
<tr>
  <td class="px" style="padding:28px 48px 0;">
    <p style="margin:0 0 16px;font-family:${SERIF};font-size:18px;line-height:26px;color:${C.ivory};">${e(greeting)}</p>
    ${messageHtml(message)}
  </td>
</tr>
${
  hasButton
    ? `
<!-- Appel -->
<tr>
  <td align="center" class="px" style="padding:36px 48px 0;">
    ${button({ href: ctaUrl, label: e(ctaLabel), width: buttonWidth(ctaLabel) })}
  </td>
</tr>`
    : ""
}

<!-- Aide -->
<tr>
  <td align="center" class="px" style="padding:32px 48px 40px;">
    <p style="margin:0;font-family:${SANS};font-size:13px;line-height:21px;color:${C.muted};">Une question ? Écrivez-nous à <a href="mailto:${e(CONTACT_EMAIL)}" style="color:${C.soft};text-decoration:underline;">${e(CONTACT_EMAIL)}</a>.</p>
  </td>
</tr>`;

  const html = emailShell({
    title: subject,
    preheader: preheader || heading,
    body,
    footer: `Vous recevez cet e-mail parce que vous avez un compte Invyra avec l'adresse ${e(email)}.<br><a href="${e(unsubscribeUrl)}" target="_blank" style="color:${C.soft};text-decoration:underline;">Ne plus recevoir les nouveautés d'Invyra</a>`,
  });

  return { subject, text, html };
}
