import { escapeHtml, safeUrl } from "@/lib/invitation/html";
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
import { dateParts, infoRow, mapsLink } from "@/lib/email/invitation-email";
import { formatTicketCode } from "@/lib/tickets";

/**
 * E-mail envoyé quand un invité confirme sa présence : son billet d'entrée,
 * avec le QR code intégré (pièce jointe en ligne `cid:`, que les clients mail
 * affichent sans la bloquer comme une image distante) et le lien vers la
 * page du billet.
 *
 * Le nombre de personnes n'y figure pas : l'invité le précise souvent juste
 * après avoir confirmé, et la page du billet l'affiche à jour.
 *
 * Toutes les valeurs saisies sont échappées.
 */

const C = BRAND_HEX;

/** Identifiant de l'image du QR code dans l'e-mail (voir `attachments`). */
export const TICKET_QR_CID = "ticket-qr@invyra";

/**
 * @param {object} data
 * @param {string} data.guestName
 * @param {string} data.eventTitle
 * @param {Date|string} [data.eventDate]
 * @param {string} [data.eventTime]
 * @param {string} [data.eventLocation]
 * @param {string} data.ticketCode
 * @param {string} data.ticketLink
 * @param {string} data.appUrl
 * @returns {{ subject: string, text: string, html: string }}
 */
export function buildTicketEmail({
  guestName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  ticketCode,
  ticketLink,
  appUrl,
}) {
  const e = escapeHtml;
  const guest = String(guestName ?? "").trim();
  const title = String(eventTitle ?? "").trim() || "Notre événement";
  const parts = dateParts(eventDate);
  const time = String(eventTime ?? "").trim();
  const when = [parts?.long, time].filter(Boolean).join(" · ");
  const place = String(eventLocation ?? "").trim();
  const link = safeUrl(ticketLink) || ticketLink;
  const code = formatTicketCode(ticketCode);

  const subject = `Votre billet : ${title}`;
  const preheader = `${guest ? `${guest}, votre` : "Votre"} présence est confirmée. Votre billet d'entrée est prêt.`;

  const text = [
    guest ? `Bonjour ${guest},` : "Bonjour,",
    "",
    `Votre présence à « ${title} » est confirmée.`,
    "",
    when ? `Quand : ${when}` : "",
    place ? `Où : ${place}` : "",
    "",
    `Votre billet : ${link}`,
    `Code du billet : ${code}`,
    "",
    "Présentez le QR code de votre billet à l'entrée.",
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n");

  const rows = [
    when && ["Quand", e(when)],
    place && [
      "Où",
      `${e(place)}<br><a href="${e(mapsLink(place))}" target="_blank" style="font-family:${SANS};font-size:13px;color:${C.gold};text-decoration:none;">Voir l'itinéraire</a>`,
    ],
  ].filter(Boolean);

  const body = `<tr>
  <td style="height:4px;line-height:4px;font-size:0;background-color:${C.gold};background-image:linear-gradient(90deg, ${C.goldDeep}, ${C.goldBright}, ${C.gold}, ${C.goldBright}, ${C.goldDeep});border-radius:17px 17px 0 0;">&nbsp;</td>
</tr>
<tr>
  <td align="center" class="px" style="padding:40px 48px 0;">
    ${eyebrow("Billet d'entrée")}
    <h1 class="title" style="margin:14px 0 0;font-family:${SERIF};font-size:34px;line-height:42px;font-weight:400;color:${C.ivory};">${e(title)}</h1>
    ${guest ? `<p style="margin:12px 0 0;font-family:${SERIF};font-size:18px;line-height:26px;font-style:italic;color:${C.soft};">${e(guest)}</p>` : ""}
    ${ornament()}
  </td>
</tr>
<tr>
  <td align="center" class="px" style="padding:28px 48px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;border:1px solid ${GOLD_LINE};border-radius:16px;background-color:#ffffff;">
      <tr>
        <td align="center" style="padding:14px;">
          <img src="cid:${TICKET_QR_CID}" width="200" height="200" alt="QR code du billet" style="display:block;width:200px;height:200px;border:0;">
        </td>
      </tr>
    </table>
    <p style="margin:14px 0 0;font-family:'Courier New',Courier,monospace;font-size:16px;line-height:22px;letter-spacing:3px;color:${C.ivory};">${e(code)}</p>
    <p style="margin:6px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};">Présentez ce QR code à l'entrée.</p>
  </td>
</tr>
${
  rows.length
    ? `<tr>
  <td class="px-sm" style="padding:28px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.raised};border:1px solid ${C.border};border-radius:14px;">
      <tr>
        <td style="padding:24px;">
          ${rows.map(([label, value], index) => infoRow(label, value, index === rows.length - 1)).join("\n")}
        </td>
      </tr>
    </table>
  </td>
</tr>`
    : ""
}
<tr>
  <td align="center" class="px" style="padding:32px 48px 40px;">
    ${button({ href: link, label: "Voir mon billet" })}
    <p style="margin:16px 0 0;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">Vous pourrez aussi le télécharger en PDF depuis cette page.</p>
  </td>
</tr>`;

  const html = emailShell({
    title: subject,
    preheader,
    homeUrl: appUrl,
    body,
    footer: "Ce billet vous est personnel, merci de ne pas le transférer.",
  });

  return { subject, text, html };
}
