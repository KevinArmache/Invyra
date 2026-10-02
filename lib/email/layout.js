import { escapeHtml } from "@/lib/invitation/html";
import { SITE_URL } from "@/lib/site";

/**
 * Socle des e-mails d'Invyra, aux couleurs du site : noir chaud, ivoire et
 * or champagne, titres en serif.
 *
 * Contraintes des clients mail : tableaux pour la mise en page, styles en
 * ligne, pas de variables CSS ni de couleurs oklch (les jetons du design
 * system sont convertis en hexadécimal ci-dessous), bouton « à l'épreuve
 * d'Outlook » (VML), largeur de 600 px qui se réduit sur mobile.
 *
 * Les helpers attendent du HTML déjà échappé : c'est à l'appelant d'échapper
 * ce qui vient d'un utilisateur.
 */

/**
 * Jetons de globals.css, convertis d'oklch en hexadécimal. Exportés pour les
 * autres rendus qui ne comprennent pas oklch (image de partage des liens,
 * manifeste, PDF).
 */
export const BRAND_HEX = {
  page: "#090806", // --ink-900
  card: "#100d0b", // --ink-850
  raised: "#171411", // --ink-800
  border: "#23201c", // --ink-700
  muted: "#857f79", // --ink-400
  soft: "#9e9992", // --ink-300
  text: "#eae6de", // --ink-100
  ivory: "#f9f6f0", // --ink-50
  gold: "#e2b963", // --gold
  goldBright: "#f0d38c", // --gold-bright
  goldDeep: "#c4852f", // --gold-deep
};

const C = BRAND_HEX;

/** Filet or adouci (l'or à 25 % sur la carte) : cadres et séparateurs. */
export const GOLD_LINE = "#443821";

/**
 * Fraunces et Geist, les polices du site, quand le client mail charge les
 * polices web (Apple Mail, iOS) ; sinon des polices système proches.
 */
export const SERIF =
  "'Fraunces', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
export const SANS =
  "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Geist:wght@400;500;600&display=swap";

const e = escapeHtml;

/** Petites capitales dorées, au-dessus d'un titre ou d'une valeur. */
export function eyebrow(text, { align = "center", margin = "0" } = {}) {
  return `<p style="margin:${margin};font-family:${SANS};font-size:11px;line-height:16px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${C.gold};text-align:${align};">${text}</p>`;
}

/** Losange entre deux filets, comme sous les titres du site. */
export function ornament({ margin = "22px auto 0" } = {}) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${margin};">
  <tr>
    <td width="44" style="border-top:1px solid ${C.goldDeep};font-size:0;line-height:0;">&nbsp;</td>
    <td style="padding:0 10px;font-size:9px;line-height:9px;color:${C.gold};">&#9670;</td>
    <td width="44" style="border-top:1px solid ${C.goldDeep};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
}

/**
 * Bouton principal : une pilule or. Outlook (Windows) ne connaît ni les
 * coins arrondis ni le padding des liens : il reçoit un équivalent VML.
 */
export function button({ href, label, width = 300 }) {
  const link = e(href);
  return `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:52px;v-text-anchor:middle;width:${width}px;" arcsize="50%" stroke="f" fillcolor="${C.gold}">
  <w:anchorlock/>
  <center style="color:${C.page};font-family:Georgia,serif;font-size:15px;font-weight:bold;letter-spacing:1px;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${link}" target="_blank" style="display:inline-block;padding:17px 38px;border-radius:999px;background-color:${C.gold};background-image:linear-gradient(120deg, ${C.goldBright}, ${C.gold});font-family:${SANS};font-size:14px;line-height:18px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${C.page};text-decoration:none;">${label}</a>
<!--<![endif]-->`;
}

/** Caractères invisibles après le preheader : le client n'y accole pas le début du texte. */
const PREHEADER_FILL = "&#8203;&#8199;&#65279;&#847;".repeat(12);

/**
 * Document complet d'un e-mail : la marque en tête, la carte, le pied de
 * page signé « Développé par Invyra ».
 *
 * @param {object} options
 * @param {string} options.title      titre du document (le sujet)
 * @param {string} options.preheader  aperçu affiché après le sujet
 * @param {string} options.body       lignes <tr> de la carte
 * @param {string} [options.footer]   note au-dessus de la signature
 * @param {string} [options.homeUrl]  adresse du site, SITE_URL par défaut
 */
export function emailShell({ title, preheader, body, footer = "", homeUrl }) {
  const home = e(String(homeUrl || SITE_URL).replace(/\/+$/, ""));
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${e(title)}</title>
<!--[if !mso]><!-->
<link rel="stylesheet" href="${FONTS_HREF}">
<!--<![endif]-->
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>table, td, p, a, h1, span { font-family: Georgia, serif !important; }</style>
<![endif]-->
<style>
  body { margin:0; padding:0; background-color:${C.page}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  img { -ms-interpolation-mode:bicubic; }
  a { text-decoration:none; }
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
  @media only screen and (max-width: 640px) {
    .container { width:100% !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
    .px-sm { padding-left:14px !important; padding-right:14px !important; }
    .title { font-size:30px !important; line-height:38px !important; }
    .stack { display:block !important; width:100% !important; box-sizing:border-box; }
    .stack-top { padding:24px 20px 0 !important; }
    .stack-bottom { padding:20px 20px 24px !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${e(preheader)}${PREHEADER_FILL}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.page};">
  <tr>
    <td align="center" style="padding:36px 12px 44px;">

      <!-- Marque -->
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr>
          <td align="center" style="padding:0 0 26px;">
            <a href="${home}" target="_blank" style="text-decoration:none;">
              <img src="${home}/apple-icon.png" width="44" height="44" alt="" style="display:block;margin:0 auto;width:44px;height:44px;border:0;">
              <span style="display:block;margin-top:12px;font-family:${SERIF};font-size:14px;line-height:18px;letter-spacing:6px;text-transform:uppercase;color:${C.gold};">Invyra</span>
            </a>
          </td>
        </tr>
      </table>

      <!-- Carte -->
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:${C.card};border:1px solid ${C.border};border-radius:18px;">
        ${body}
      </table>

      <!-- Pied de page -->
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        ${
          footer
            ? `<tr>
          <td align="center" class="px" style="padding:28px 48px 0;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">${footer}</td>
        </tr>`
            : ""
        }
        <tr>
          <td align="center" style="padding:24px 24px 0;">
            <a href="${home}" target="_blank" style="display:inline-block;padding:9px 18px;border:1px solid ${C.border};border-radius:999px;font-family:${SANS};font-size:12px;line-height:16px;color:${C.soft};text-decoration:none;">Développé par <span style="color:${C.gold};">Invyra</span></a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:14px 24px 0;font-family:${SANS};font-size:11px;line-height:17px;color:${C.muted};">&copy; ${year} Invyra</td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
}
