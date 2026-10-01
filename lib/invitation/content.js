import { safeUrl } from "@/lib/invitation/html";

/**
 * Contenu d'une invitation : le schéma des sections, commun à tous les
 * designs pour qu'on puisse changer de design sans retaper les textes, le
 * contenu par défaut, et sa normalisation.
 *
 * Module pur : importé côté client (éditeur) et côté serveur (validation).
 */

/**
 * Sections de l'invitation, dans leur ordre d'affichage. Chaque design les
 * rend à sa façon, mais les données sont les mêmes pour tous.
 *
 * `toggle` : la section peut être masquée (champ `enabled`).
 * Types de champ : text, textarea, image, url, list (lignes à colonnes),
 * images (liste d'URL). Les libellés vivent dans les dictionnaires, sous
 * `portal.editor.sections.<section>` et `portal.editor.fields.<champ>`.
 */
export const CONTENT_SECTIONS = [
  {
    // Écran d'ouverture (Digital Invitation Opening) : ce que l'invité voit
    // en arrivant, avant de découvrir l'invitation. Rendu par la plateforme,
    // voir lib/invitation/opening.js. Obligatoire : pas d'interrupteur.
    key: "opening",
    fields: [
      {
        key: "style",
        type: "select",
        options: ["envelope", "seal", "curtain"],
      },
      { key: "eyebrow", type: "text", max: 60 },
      { key: "title", type: "text", max: 80, placeholder: "{{GUEST_NAME}}" },
      { key: "monogram", type: "text", max: 8 },
      { key: "hint", type: "text", max: 60 },
    ],
  },
  {
    key: "hero",
    fields: [
      { key: "image", type: "image" },
      { key: "eyebrow", type: "text", max: 80 },
      { key: "title", type: "text", max: 120, placeholder: "{{EVENT_TITLE}}" },
    ],
  },
  {
    key: "intro",
    fields: [{ key: "message", type: "textarea", max: 1500 }],
  },
  { key: "details", toggle: true, fields: [] },
  {
    key: "story",
    toggle: true,
    fields: [
      { key: "title", type: "text", max: 80 },
      { key: "text", type: "textarea", max: 2000 },
      { key: "image", type: "image" },
    ],
  },
  {
    key: "program",
    toggle: true,
    fields: [
      { key: "title", type: "text", max: 80 },
      {
        key: "items",
        type: "list",
        maxItems: 12,
        columns: [
          { key: "time", max: 20 },
          { key: "label", max: 120 },
        ],
      },
    ],
  },
  {
    key: "venue",
    toggle: true,
    fields: [
      { key: "title", type: "text", max: 80 },
      { key: "text", type: "textarea", max: 1500 },
      { key: "image", type: "image" },
      { key: "mapUrl", type: "url" },
    ],
  },
  {
    key: "dressCode",
    toggle: true,
    fields: [
      { key: "title", type: "text", max: 80 },
      { key: "text", type: "textarea", max: 800 },
    ],
  },
  {
    key: "gallery",
    toggle: true,
    fields: [
      { key: "title", type: "text", max: 80 },
      { key: "images", type: "images", maxItems: 6 },
    ],
  },
  {
    key: "closing",
    toggle: true,
    fields: [
      { key: "title", type: "text", max: 80 },
      { key: "text", type: "textarea", max: 1000 },
    ],
  },
  {
    key: "rsvp",
    fields: [
      { key: "title", type: "text", max: 80 },
      { key: "confirmed", type: "text", max: 40 },
      { key: "maybe", type: "text", max: 40 },
      { key: "declined", type: "text", max: 40 },
    ],
  },
];

/**
 * Photo Unsplash recadrée à la largeur voulue. Les contenus d'exemple des
 * designs passent tous par ici : même format d'URL partout.
 */
export function unsplashPhoto(id, { width = 1000, quality = 75 } = {}) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

const photo = (id) => unsplashPhoto(id, { width: 1200, quality: 80 });

export const DEFAULT_CONTENT = {
  opening: {
    style: "envelope",
    eyebrow: "Vous êtes invité(e)",
    title: "{{GUEST_NAME}}",
    // Vide : déduit du titre de l'événement (« Camille & Antoine » → C&A).
    monogram: "",
    hint: "Touchez pour ouvrir",
  },
  hero: {
    image: photo("photo-1537633552985-df8429e8048b"),
    eyebrow: "Invitation",
    title: "",
  },
  intro: {
    message:
      "Cher(e) {{GUEST_NAME}},\n\nNous avons l'honneur de vous inviter à un moment unique, une célébration où l'amour et l'élégance se rencontrent.",
  },
  details: { enabled: true },
  story: {
    enabled: true,
    title: "Notre histoire",
    text: "Chaque grande histoire commence par une rencontre. La nôtre s'est construite à travers les moments partagés et un amour qui n'a cessé de grandir.\n\nAujourd'hui, nous écrivons ensemble le plus beau chapitre : celui de notre union.",
    image: photo("photo-1519741497674-611481863552"),
  },
  program: {
    enabled: true,
    title: "Programme",
    items: [
      { time: "16:00", label: "Accueil des invités" },
      { time: "17:00", label: "Cérémonie" },
      { time: "19:00", label: "Dîner" },
      { time: "22:00", label: "Soirée dansante" },
    ],
  },
  venue: {
    enabled: true,
    title: "Le lieu",
    text: "Un cadre choisi avec soin pour vivre ensemble un moment inoubliable.",
    image: photo("photo-1522673607200-164d1b6ce486"),
    mapUrl: "",
  },
  dressCode: {
    enabled: false,
    title: "Dress code",
    text: "Une tenue élégante est recommandée pour cette occasion.",
  },
  gallery: {
    enabled: false,
    title: "Galerie",
    images: [
      photo("photo-1522673607200-164d1b6ce486"),
      photo("photo-1465495976277-4387d4b0b4c6"),
      photo("photo-1511285560929-80b456fea0bc"),
    ],
  },
  closing: {
    enabled: true,
    title: "Avec toute notre affection",
    text: "Votre présence rendra ce moment encore plus spécial. Nous avons hâte de célébrer avec vous.",
  },
  rsvp: {
    title: "Confirmer votre présence",
    confirmed: "Oui, je viens",
    maybe: "Peut-être",
    declined: "Je ne pourrai pas",
  },
};

// ─── Normalisation ──────────────────────────────────────────────────────────

function cleanString(value, max, fallback) {
  if (value === undefined || value === null) return fallback ?? "";
  return String(value).slice(0, max ?? 500);
}

function cleanField(field, value, fallback) {
  switch (field.type) {
    case "image":
    case "url":
      return value === undefined ? (fallback ?? "") : safeUrl(value);
    case "select":
      return field.options.includes(value)
        ? value
        : (fallback ?? field.options[0]);
    case "images": {
      if (!Array.isArray(value)) return fallback ?? [];
      return value.map(safeUrl).filter(Boolean).slice(0, field.maxItems);
    }
    case "list": {
      if (!Array.isArray(value)) return fallback ?? [];
      return value
        .filter((row) => row && typeof row === "object")
        .slice(0, field.maxItems)
        .map((row) =>
          Object.fromEntries(
            field.columns.map((column) => [
              column.key,
              cleanString(row[column.key], column.max, ""),
            ]),
          ),
        );
    }
    default:
      return cleanString(value, field.max, fallback);
  }
}

/**
 * Ramène un contenu quelconque à la forme du schéma : clés inconnues
 * supprimées, types forcés, longueurs bornées, URL filtrées. Un champ absent
 * reprend sa valeur par défaut ; un champ vidé par l'utilisateur reste vide.
 */
export function normalizeContent(content) {
  const source = content && typeof content === "object" ? content : {};
  const result = {};

  for (const section of CONTENT_SECTIONS) {
    const input =
      source[section.key] && typeof source[section.key] === "object"
        ? source[section.key]
        : {};
    const defaults = DEFAULT_CONTENT[section.key] ?? {};
    const output = {};

    if (section.toggle) {
      output.enabled =
        typeof input.enabled === "boolean" ? input.enabled : !!defaults.enabled;
    }
    for (const field of section.fields) {
      output[field.key] = cleanField(
        field,
        input[field.key],
        defaults[field.key],
      );
    }
    result[section.key] = output;
  }

  return result;
}

/**
 * Réglages d'ouverture seuls : utilisés par les templates code, qui n'ont pas
 * de `content` mais doivent avoir leur écran d'ouverture comme les autres.
 */
export function normalizeOpening(opening) {
  return normalizeContent({ opening }).opening;
}

/**
 * Musique jouée à l'ouverture de l'invitation : une URL https, ou rien.
 *
 * @returns {{ url: string } | null}
 */
export function normalizeMusic(music) {
  const url = safeUrl(music?.url);
  return url ? { url } : null;
}

// ─── Détails de l'événement ─────────────────────────────────────────────────

/**
 * Lignes « date / heure / lieu / tenue » tirées de l'événement. Seules les
 * valeurs renseignées sont affichées. Les valeurs sont brutes : le design les
 * échappe au rendu.
 */
export function eventDetails(event, formattedDate) {
  return [
    { icon: "📅", key: "date", value: formattedDate },
    { icon: "⏰", key: "time", value: event?.time },
    { icon: "📍", key: "location", value: event?.location },
    {
      icon: "👗",
      key: "dressCode",
      value: event?.dressCode ?? event?.dress_code,
    },
  ].filter((item) => item.value);
}
