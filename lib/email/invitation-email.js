import { escapeHtml, safeUrl } from "@/lib/invitation/shared";
import { monogramFrom } from "@/lib/invitation/opening";

/**
 * E-mail d'invitation envoyé aux invités, aux couleurs d'Invyra : noir
 * chaud, ivoire et or champagne, titres en serif.
 *
 * Contraintes des clients mail : tableaux pour la mise en page, styles en
 * ligne, pas de variables CSS ni de couleurs oklch (les jetons du design
 * system sont convertis en hexadécimal ci-dessous), bouton « à l'épreuve
 * d'Outlook » (VML), largeur de 600 px qui se réduit sur mobile.
 *
 * Toutes les valeurs saisies (nom de l'invité, titre, lieu…) sont échappées.
 */

/** Jetons de globals.css, convertis d'oklch en hexadécimal. */
const C = {
  page: "#090806", // --ink-900
  card: "#100d0b", // --ink-850
  border: "#23201c", // --ink-700
  muted: "#857f79", // --ink-400
  soft: "#9e9992", // --ink-300
  text: "#eae6de", // --ink-100
  ivory: "#f9f6f0", // --ink-50
  gold: "#e2b963", // --gold
  goldBright: "#f0d38c", // --gold-bright
  goldDeep: "#c4852f", // --gold-deep
};

const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Date longue, lue en UTC : les dates d'événement sont enregistrées à minuit UTC. */
function formatDate(eventDate) {
  if (!eventDate) return "";
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) return "";
  const text = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Photo d'en-tête : l'image d'accueil du modèle, recadrée pour l'e-mail
 * quand elle vient d'Unsplash (1120 × 720, soit 560 px en haute densité),
 * en gardant les visages dans le cadre.
 */
function heroImage(url) {
  const safe = safeUrl(url);
  if (!safe) return "";
  try {
    const parsed = new URL(safe);
    if (parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("w", "1120");
      parsed.searchParams.set("h", "720");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("crop", "faces,center");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("q", "75");
    }
    return parsed.href;
  } catch {
    return "";
  }
}

function detailRow(label, value, last = false) {
  return `<tr>
  <td style="padding:16px 0;${last ? "" : `border-bottom:1px solid ${C.border};`}">
    <p style="margin:0;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:${C.gold};">${label}</p>
    <p style="margin:6px 0 0;font-family:${SERIF};font-size:18px;line-height:26px;color:${C.ivory};">${value}</p>
  </td>
</tr>`;
}

/**
 * @param {object} data
 * @param {string} data.guestName
 * @param {string} data.eventTitle
 * @param {Date|string} [data.eventDate]
 * @param {string} [data.eventTime]      heure en texte libre (« 15h00 »)
 * @param {string} [data.eventLocation]
 * @param {string} [data.dressCode]
 * @param {string} [data.customMessage] mot de l'organisateur
 * @param {string} [data.hostName]       organisateur
 * @param {string} [data.imageUrl]       photo d'accueil du modèle
 * @param {string} data.inviteLink
 * @param {string} data.appUrl
 * @returns {{ subject: string, text: string, html: string }}
 */
export function buildInvitationEmail({
  guestName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  dressCode,
  customMessage,
  hostName,
  imageUrl,
  inviteLink,
  appUrl,
}) {
  const guest = String(guestName ?? "").trim() || "Cher invité";
  const title = String(eventTitle ?? "").trim() || "Notre événement";
  const date = formatDate(eventDate);
  const when = [date, String(eventTime ?? "").trim()].filter(Boolean).join(" · ");
  const place = String(eventLocation ?? "").trim();
  const dress = String(dressCode ?? "").trim();
  const message = String(customMessage ?? "").trim();
  const host = String(hostName ?? "").trim();
  const image = heroImage(imageUrl);
  const monogram = monogramFrom(title) || "✦";
  const link = safeUrl(inviteLink) || inviteLink;
  const home = safeUrl(appUrl) || appUrl;
  const year = new Date().getFullYear();

  const e = escapeHtml;
  const details = [
    when && ["Quand", e(when)],
    place && ["Où", e(place)],
    dress && ["Tenue", e(dress)],
  ].filter(Boolean);

  const subject = `Votre invitation : ${title}`;
  const preheader = `${guest}, votre invitation personnelle vous attend. Ouvrez-la et répondez en un geste.`;

  const text = [
    `${guest},`,
    "",
    `Vous êtes invité(e) à « ${title} ».`,
    message ? `\n${message}\n` : "",
    when ? `Quand : ${when}` : "",
    place ? `Où : ${place}` : "",
    dress ? `Tenue : ${dress}` : "",
    "",
    `Ouvrez votre invitation et confirmez votre présence : ${link}`,
    "",
    host ? `${host}, via Invyra` : "Envoyé avec Invyra",
    "Cette invitation vous est personnelle : merci de ne pas la transférer.",
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n");

  const header = image
    ? `<tr>
  <td style="padding:0;">
    <img src="${e(image)}" width="560" alt="${e(title)}" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:14px 14px 0 0;" />
  </td>
</tr>`
    : `<tr>
  <td style="height:6px;line-height:6px;font-size:0;background-color:${C.gold};background-image:linear-gradient(90deg, ${C.goldDeep}, ${C.goldBright}, ${C.gold}, ${C.goldBright}, ${C.goldDeep});border-radius:14px 14px 0 0;">&nbsp;</td>
</tr>`;

  const html = `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${e(subject)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>table, td, p, a { font-family: Georgia, serif !important; }</style>
<![endif]-->
<style>
  body { margin:0; padding:0; background-color:${C.page}; }
  a { text-decoration:none; }
  @media only screen and (max-width: 620px) {
    .container { width:100% !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
    .title { font-size:30px !important; line-height:38px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${e(preheader)}&#8203;&#8199;&#65279;&#847;&#8203;&#8199;&#65279;&#847;&#8203;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.page};">
  <tr>
    <td align="center" style="padding:32px 12px 40px;">

      <!-- Marque -->
      <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">
        <tr>
          <td align="center" style="padding:0 0 22px;font-family:${SERIF};font-size:13px;letter-spacing:6px;text-transform:uppercase;color:${C.gold};">
            Invyra
          </td>
        </tr>
      </table>

      <!-- Carte -->
      <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;background-color:${C.card};border:1px solid ${C.border};border-radius:14px;">
        ${header}

        <!-- Monogramme et titre -->
        <tr>
          <td align="center" class="px" style="padding:${image ? "36px" : "44px"} 48px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td align="center" valign="middle" width="72" height="72" style="width:72px;height:72px;border-radius:36px;background-color:${C.card};border:1px solid ${C.gold};font-family:${SERIF};font-size:22px;letter-spacing:1px;color:${C.gold};">${e(monogram)}</td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};">Vous êtes invité(e)</p>
            <h1 class="title" style="margin:14px 0 0;font-family:${SERIF};font-size:36px;line-height:44px;font-weight:400;color:${C.ivory};">${e(title)}</h1>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px auto 0;">
              <tr>
                <td width="48" style="border-top:1px solid ${C.goldDeep};font-size:0;line-height:0;">&nbsp;</td>
                <td style="padding:0 10px;font-size:10px;line-height:10px;color:${C.gold};">&#9670;</td>
                <td width="48" style="border-top:1px solid ${C.goldDeep};font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td align="center" class="px" style="padding:26px 56px 0;">
            <p style="margin:0;font-family:${SERIF};font-size:19px;line-height:28px;color:${C.ivory};">Cher(e) ${e(guest)},</p>
            <p style="margin:14px 0 0;font-family:${SANS};font-size:15px;line-height:24px;color:${C.soft};">
              ${host ? `${e(host)} a` : "Nous avons"} le plaisir de vous convier à ce moment. Votre invitation personnelle vous attend : ouvrez-la pour découvrir tous les détails et répondre en un geste.
            </p>
            ${
              message
                ? `<p style="margin:22px 0 0;padding:0 0 0 16px;border-left:2px solid ${C.goldDeep};font-family:${SERIF};font-size:16px;line-height:25px;font-style:italic;color:${C.text};text-align:left;">${e(message).replace(/\n/g, "<br>")}</p>`
                : ""
            }
          </td>
        </tr>

        ${
          details.length
            ? `<!-- Détails -->
        <tr>
          <td class="px" style="padding:30px 48px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.border};border-bottom:1px solid ${C.border};">
              ${details.map(([label, value], index) => detailRow(label, value, index === details.length - 1)).join("")}
            </table>
          </td>
        </tr>`
            : ""
        }

        <!-- Bouton -->
        <tr>
          <td align="center" class="px" style="padding:36px 48px 0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${e(link)}" style="height:52px;v-text-anchor:middle;width:300px;" arcsize="50%" stroke="f" fillcolor="${C.gold}">
              <w:anchorlock/>
              <center style="color:${C.page};font-family:Georgia,serif;font-size:15px;font-weight:bold;letter-spacing:1px;">Ouvrir mon invitation</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${e(link)}" target="_blank" style="display:inline-block;padding:17px 40px;border-radius:999px;background-color:${C.gold};background-image:linear-gradient(120deg, ${C.goldBright}, ${C.gold});font-family:${SANS};font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${C.page};">Ouvrir mon invitation</a>
            <!--<![endif]-->
            <p style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};">Votre réponse se donne directement dans l'invitation.</p>
          </td>
        </tr>

        <!-- Lien de secours -->
        <tr>
          <td align="center" class="px" style="padding:28px 48px 40px;">
            <p style="margin:0;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :</p>
            <p style="margin:6px 0 0;font-family:${SANS};font-size:12px;line-height:19px;word-break:break-all;"><a href="${e(link)}" style="color:${C.gold};text-decoration:underline;">${e(link)}</a></p>
          </td>
        </tr>
      </table>

      <!-- Pied de page -->
      <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">
        <tr>
          <td align="center" class="px" style="padding:26px 40px 0;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">
            Cette invitation vous est personnelle : merci de ne pas la transférer.<br>
            ${host ? `Envoyée par ${e(host)} avec ` : "Envoyée avec "}<a href="${e(home)}" style="color:${C.gold};">Invyra</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 40px 0;font-family:${SANS};font-size:11px;line-height:17px;color:${C.muted};">
            &copy; ${year} Invyra · Développé par <a href="https://instagram.com/kevinarmache" style="color:${C.soft};">Kevin Armache</a>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}
