import { escapeHtml, safeUrl } from "@/lib/invitation/html";
import { stopLabel, stopLines } from "@/lib/itinerary";
import { monogramFrom } from "@/lib/invitation/opening";
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

/**
 * E-mail d'invitation envoyé aux invités : un faire-part aux couleurs
 * d'Invyra (voir lib/email/layout.js), qui mène à l'invitation en ligne.
 *
 * Toutes les valeurs saisies (nom de l'invité, titre, lieu…) sont échappées.
 */

// Historiquement exportées d'ici : le manifeste, l'image de partage et le
// PDF des invités les importent encore depuis ce module.
export { BRAND_HEX };

const C = BRAND_HEX;
const DAY = 86_400_000;

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Éléments de la date, lue en UTC : les dates d'événement sont enregistrées
 * à minuit UTC.
 */
export function dateParts(eventDate) {
  if (!eventDate) return null;
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) return null;
  const format = (options) =>
    date.toLocaleDateString("fr-FR", { ...options, timeZone: "UTC" });
  return {
    date,
    long: capitalize(
      format({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    ),
    day: format({ day: "numeric" }),
    month: format({ month: "short" }).replace(/\.$/, "").toUpperCase(),
    year: format({ year: "numeric" }),
  };
}

/**
 * Photo d'en-tête : l'image d'accueil du modèle, recadrée pour l'e-mail
 * quand elle vient d'Unsplash (1200 × 760, soit 600 px en haute densité),
 * en gardant les visages dans le cadre.
 */
function heroImage(url) {
  const safe = safeUrl(url);
  if (!safe) return "";
  try {
    const parsed = new URL(safe);
    if (parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("w", "1200");
      parsed.searchParams.set("h", "760");
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

/** Événement d'une journée dans Google Agenda, avec le lien de l'invitation. */
function calendarLink({ title, date, place, link }) {
  const day = (value) => value.toISOString().slice(0, 10).replace(/-/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${day(date)}/${day(new Date(date.getTime() + DAY))}`,
    details: `Votre invitation : ${link}`,
  });
  if (place) params.set("location", place);
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function mapsLink(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

/** Étapes listées au plus dans un e-mail ; la page d'itinéraire a le reste. */
const MAX_EMAIL_STOPS = 5;

/**
 * Lieu de l'événement dans un e-mail (invitation, billet) :
 * - `place`    une ligne, avec l'adresse quand il n'y a qu'une étape ;
 * - `program`  une ligne par étape, quand il y en a plusieurs ;
 * - `maps`     la page d'itinéraire de l'invité, ou à défaut une recherche
 *              Google Maps du lieu.
 */
export function emailPlace({ eventLocation, stops, directionsLink }) {
  const list = Array.isArray(stops) ? stops : [];
  const place =
    list.length === 1 ? stopLabel(list[0]) : String(eventLocation ?? "").trim();
  const program = list.length > 1 ? stopLines(list).slice(0, MAX_EMAIL_STOPS) : [];
  const maps = safeUrl(directionsLink) || (place ? mapsLink(place) : "");
  return { place, program, maps };
}

/** Une information de l'événement : libellé doré, valeur en serif. */
export function infoRow(label, value, last) {
  return `${eyebrow(label, { align: "inherit" })}
<p style="margin:4px 0 ${last ? "0" : "16px"};font-family:${SERIF};font-size:17px;line-height:25px;color:${C.ivory};">${value}</p>`;
}

/**
 * @param {object} data
 * @param {string} data.guestName
 * @param {string} data.eventTitle
 * @param {Date|string} [data.eventDate]
 * @param {string} [data.eventTime]      heure en texte libre (« 15h00 »)
 * @param {string} [data.eventLocation]
 * @param {object[]} [data.stops]        étapes de l'itinéraire (lib/itinerary.js)
 * @param {string} [data.directionsLink] page d'itinéraire de l'invité
 * @param {string} [data.dressCode]
 * @param {string} [data.customMessage] mot de l'organisateur
 * @param {string} [data.contactPhone]  numéro à appeler pour toute question
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
  stops,
  directionsLink,
  dressCode,
  customMessage,
  contactPhone,
  hostName,
  imageUrl,
  inviteLink,
  appUrl,
}) {
  const guest = String(guestName ?? "").trim();
  const title = String(eventTitle ?? "").trim() || "Notre événement";
  const parts = dateParts(eventDate);
  const time = String(eventTime ?? "").trim();
  const when = [parts?.long, time].filter(Boolean).join(" · ");
  const { place, program, maps } = emailPlace({ eventLocation, stops, directionsLink });
  const dress = String(dressCode ?? "").trim();
  const message = String(customMessage ?? "").trim();
  const phone = String(contactPhone ?? "").trim();
  const dial = phone.replace(/[^\d+]/g, "");
  const host = String(hostName ?? "").trim();
  const image = heroImage(imageUrl);
  const monogram = monogramFrom(title) || "✦";
  const link = safeUrl(inviteLink) || inviteLink;
  const calendar = parts
    ? calendarLink({ title, date: parts.date, place, link })
    : "";

  const e = escapeHtml;
  const greeting = guest ? `Bonjour ${guest},` : "Bonjour,";
  const intro = `${host ? `${host} vous invite` : "Vous êtes invité(e)"} à partager ce moment. Ouvrez votre invitation pour découvrir tous les détails et confirmer votre présence.`;

  const subject = `Votre invitation : ${title}`;
  const preheader = `${guest ? `${guest}, votre` : "Votre"} invitation personnelle vous attend. Ouvrez-la et répondez en un clic.`;

  const text = [
    greeting,
    "",
    `${host ? `${host} vous invite` : "Vous êtes invité(e)"} à « ${title} ».`,
    message ? `\n${message}\n` : "",
    when ? `Quand : ${when}` : "",
    program.length
      ? `Programme :\n${program.map((line) => `· ${line}`).join("\n")}`
      : place
        ? `Où : ${place}`
        : "",
    dress ? `Tenue : ${dress}` : "",
    phone ? `Contact : ${phone}` : "",
    "",
    `Ouvrez votre invitation et répondez en un clic : ${link}`,
    calendar ? `Ajouter à mon agenda : ${calendar}` : "",
    maps ? `Itinéraire : ${maps}` : "",
    "",
    "Cette invitation vous est personnelle, merci de ne pas la transférer.",
    `Développé par Invyra : ${appUrl}`,
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n");

  // ── En-tête : la photo du modèle, ou un filet or ─────────────────────────
  // La photo est contenue dans un bloc de hauteur limitée : une image en
  // hauteur est coupée en bas plutôt que déformée (object-fit est mal pris
  // en charge par les clients mail).
  const header = image
    ? `<tr>
  <td style="padding:0;">
    <div style="max-height:400px;overflow:hidden;border-radius:17px 17px 0 0;">
      <img src="${e(image)}" width="600" alt="${e(title)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
    </div>
  </td>
</tr>`
    : `<tr>
  <td style="height:4px;line-height:4px;font-size:0;background-color:${C.gold};background-image:linear-gradient(90deg, ${C.goldDeep}, ${C.goldBright}, ${C.gold}, ${C.goldBright}, ${C.goldDeep});border-radius:17px 17px 0 0;">&nbsp;</td>
</tr>`;

  // ── Le faire-part : double filet or, monogramme, titre ───────────────────
  const card = `<tr>
  <td class="px-sm" style="padding:${image ? "32px" : "40px"} 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${GOLD_LINE};border-radius:14px;">
      <tr>
        <td style="padding:6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${GOLD_LINE};border-radius:10px;">
            <tr>
              <td align="center" class="px" style="padding:36px 32px 34px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                  <tr>
                    <td align="center" valign="middle" width="60" height="60" style="width:60px;height:60px;border-radius:30px;border:1px solid ${C.gold};font-family:${SERIF};font-size:19px;letter-spacing:1px;color:${C.gold};">${e(monogram)}</td>
                  </tr>
                </table>
                ${eyebrow("Invitation personnelle", { margin: "22px 0 0" })}
                <h1 class="title" style="margin:14px 0 0;font-family:${SERIF};font-size:36px;line-height:44px;font-weight:400;color:${C.ivory};">${e(title)}</h1>
                ${
                  guest
                    ? `<p style="margin:12px 0 0;font-family:${SERIF};font-size:18px;line-height:26px;font-style:italic;color:${C.soft};">Pour ${e(guest)}</p>`
                    : ""
                }
                ${ornament()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

  // ── Le mot de l'organisateur ─────────────────────────────────────────────
  const words = `<tr>
  <td class="px" style="padding:32px 48px 0;">
    <p style="margin:0;font-family:${SERIF};font-size:19px;line-height:28px;color:${C.ivory};">${e(greeting)}</p>
    <p style="margin:12px 0 0;font-family:${SANS};font-size:15px;line-height:25px;color:${C.soft};">${e(intro)}</p>
    ${
      message
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
      <tr>
        <td style="padding:2px 0 2px 18px;border-left:2px solid ${C.goldDeep};">
          <p style="margin:0;font-family:${SERIF};font-size:16px;line-height:26px;font-style:italic;color:${C.text};">${e(message).replace(/\n/g, "<br>")}</p>
          ${host ? `<p style="margin:10px 0 0;font-family:${SANS};font-size:12px;line-height:18px;letter-spacing:1px;color:${C.muted};">${e(host)}</p>` : ""}
        </td>
      </tr>
    </table>`
        : ""
    }
  </td>
</tr>`;

  // ── Quand, où, tenue, contact ────────────────────────────────────────────
  const rows = [
    when && ["Quand", e(when)],
    program.length
      ? ["Programme", program.map((line) => e(line)).join("<br>")]
      : place && ["Où", e(place)],
    dress && ["Tenue", e(dress)],
    phone && [
      "Contact",
      dial
        ? `<a href="tel:${e(dial)}" style="color:${C.ivory};text-decoration:none;">${e(phone)}</a>`
        : e(phone),
    ],
  ].filter(Boolean);

  const tile = parts
    ? `<td class="stack stack-top" width="148" align="center" valign="middle" style="width:148px;padding:24px 0 24px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100px;margin:0 auto;border:1px solid ${C.gold};border-radius:12px;">
            <tr><td align="center" style="padding:12px 8px 0;font-family:${SANS};font-size:11px;line-height:14px;font-weight:600;letter-spacing:2.5px;color:${C.gold};">${e(parts.month)}</td></tr>
            <tr><td align="center" style="padding:4px 8px 0;font-family:${SERIF};font-size:40px;line-height:44px;color:${C.ivory};">${e(parts.day)}</td></tr>
            <tr><td align="center" style="padding:2px 8px 12px;font-family:${SANS};font-size:12px;line-height:16px;color:${C.muted};">${e(parts.year)}</td></tr>
          </table>
        </td>`
    : "";

  const details = rows.length
    ? `<tr>
  <td class="px-sm" style="padding:28px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.raised};border:1px solid ${C.border};border-radius:14px;">
      <tr>
        ${tile}
        <td class="stack${tile ? " stack-bottom" : ""}" valign="middle" style="padding:${tile ? "24px 24px 24px 20px" : "24px"};">
          ${rows.map(([label, value], index) => infoRow(label, value, index === rows.length - 1)).join("\n")}
        </td>
      </tr>
    </table>
  </td>
</tr>`
    : "";

  const shortcuts = [
    calendar &&
      `<a href="${e(calendar)}" target="_blank" style="color:${C.gold};text-decoration:none;">Ajouter à mon agenda</a>`,
    maps &&
      `<a href="${e(maps)}" target="_blank" style="color:${C.gold};text-decoration:none;">Voir l'itinéraire</a>`,
  ].filter(Boolean);

  const links = shortcuts.length
    ? `<tr>
  <td align="center" class="px" style="padding:16px 32px 0;font-family:${SANS};font-size:13px;line-height:20px;">
    ${shortcuts.join(`<span style="padding:0 10px;color:${C.muted};">&middot;</span>`)}
  </td>
</tr>`
    : "";

  // ── L'appel à ouvrir l'invitation ────────────────────────────────────────
  const action = `<tr>
  <td align="center" class="px" style="padding:36px 48px 0;">
    ${button({ href: link, label: "Ouvrir mon invitation" })}
    <p style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.muted};">Répondez en un clic : présent, absent ou peut-être.</p>
  </td>
</tr>
<tr>
  <td align="center" class="px" style="padding:28px 48px 40px;">
    <p style="margin:0;font-family:${SANS};font-size:12px;line-height:19px;color:${C.muted};">Le bouton ne s'ouvre pas ? Copiez ce lien dans votre navigateur :</p>
    <p style="margin:6px 0 0;font-family:${SANS};font-size:12px;line-height:19px;word-break:break-all;"><a href="${e(link)}" style="color:${C.soft};text-decoration:underline;">${e(link)}</a></p>
  </td>
</tr>`;

  const html = emailShell({
    title: subject,
    preheader,
    homeUrl: appUrl,
    body: `${header}\n${card}\n${words}\n${details}\n${links}\n${action}`,
    footer: `Cette invitation vous est personnelle, merci de ne pas la transférer.${
      host ? `<br>Envoyée par ${e(host)} avec Invyra.` : ""
    }`,
  });

  return { subject, text, html };
}
