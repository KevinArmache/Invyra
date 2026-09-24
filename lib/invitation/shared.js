/**
 * Briques communes à tous les designs d'invitation.
 *
 * Un design ne fait que la mise en page et le CSS. Tout ce qui doit être
 * identique d'un design à l'autre vit ici :
 * - l'échappement des valeurs saisies ;
 * - la liste des polices proposées ;
 * - le schéma du contenu, commun à tous les designs pour qu'on puisse changer
 *   de design sans retaper les textes ;
 * - le bloc RSVP et son script, qui appartiennent à la plateforme.
 *
 * Ce module est importé côté client (aperçu, éditeur) et côté serveur
 * (validation) : il doit rester pur, sans dépendance au DOM ni à Node.
 */

// ─── Échappement ────────────────────────────────────────────────────────────

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Texte multi-ligne : une ligne vide sépare deux paragraphes. */
export function paragraphs(value) {
  return String(value ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * N'accepte que les URL https absolues. Tout le reste (javascript:, data:,
 * chemins relatifs…) est rejeté : ces valeurs finissent dans des attributs et
 * du CSS, où un schéma exotique serait une porte d'entrée.
 */
export function safeUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

/** URL déjà validée par safeUrl, rendue sûre pour `url("…")` en CSS. */
export function cssUrl(url) {
  return `url("${String(url).replace(/["\\\n\r()]/g, (c) => encodeURIComponent(c))}")`;
}

// ─── Polices ────────────────────────────────────────────────────────────────

export const FONTS = [
  {
    id: "playfair",
    label: "Playfair Display",
    stack: "'Playfair Display', Georgia, serif",
    query: "Playfair+Display:ital,wght@0,400;0,700;1,400",
  },
  {
    id: "cormorant",
    label: "Cormorant Garamond",
    stack: "'Cormorant Garamond', Georgia, serif",
    query: "Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400",
  },
  {
    id: "dm-serif",
    label: "DM Serif Display",
    stack: "'DM Serif Display', Georgia, serif",
    query: "DM+Serif+Display:ital@0;1",
  },
  {
    id: "lora",
    label: "Lora",
    stack: "'Lora', Georgia, serif",
    query: "Lora:ital,wght@0,400;0,600;1,400",
  },
  {
    id: "great-vibes",
    label: "Great Vibes",
    stack: "'Great Vibes', cursive",
    query: "Great+Vibes",
  },
  {
    id: "pinyon",
    label: "Pinyon Script",
    stack: "'Pinyon Script', cursive",
    query: "Pinyon+Script",
  },
  {
    id: "cinzel",
    label: "Cinzel",
    stack: "'Cinzel', Georgia, serif",
    query: "Cinzel:wght@400;600",
  },
  {
    id: "inter",
    label: "Inter",
    stack: "'Inter', system-ui, sans-serif",
    query: "Inter:wght@300;400;600",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    stack: "'Montserrat', system-ui, sans-serif",
    query: "Montserrat:wght@300;400;600;700",
  },
  {
    id: "josefin",
    label: "Josefin Sans",
    stack: "'Josefin Sans', system-ui, sans-serif",
    query: "Josefin+Sans:wght@300;400;600",
  },
  {
    id: "poppins",
    label: "Poppins",
    stack: "'Poppins', system-ui, sans-serif",
    query: "Poppins:wght@300;400;600;700",
  },
  {
    id: "fredoka",
    label: "Fredoka",
    stack: "'Fredoka', system-ui, sans-serif",
    query: "Fredoka:wght@400;500;600",
  },
  {
    id: "bebas",
    label: "Bebas Neue",
    stack: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
    query: "Bebas+Neue",
  },
  {
    id: "dm-mono",
    label: "DM Mono",
    stack: "'DM Mono', ui-monospace, 'Courier New', monospace",
    query: "DM+Mono:wght@400;500",
  },
  {
    id: "permanent-marker",
    label: "Permanent Marker",
    stack: "'Permanent Marker', 'Comic Sans MS', cursive",
    query: "Permanent+Marker",
  },
];

const FONTS_BY_ID = Object.fromEntries(FONTS.map((font) => [font.id, font]));

export function getFont(id) {
  return FONTS_BY_ID[id] ?? null;
}

/** Feuille Google Fonts chargeant exactement les polices demandées. */
export function fontsHref(ids) {
  const queries = [...new Set(ids)]
    .map((id) => FONTS_BY_ID[id]?.query)
    .filter(Boolean);
  if (queries.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${queries
    .map((query) => `family=${query}`)
    .join("&")}&display=swap`;
}

// ─── Schéma du contenu ──────────────────────────────────────────────────────

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

const photo = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

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

/** Polices déclarées par un template code : identifiants connus uniquement. */
export function normalizeFonts(fonts) {
  if (!Array.isArray(fonts)) return [];
  return [...new Set(fonts.filter((id) => getFont(id)))].slice(0, 6);
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

// ─── RSVP ───────────────────────────────────────────────────────────────────

/**
 * Bloc RSVP. Le balisage suit le contrat attendu par RSVP_SCRIPT ; les designs
 * ne font que le styler via les classes `rsvp-*`.
 */
export function renderRsvpBlock(rsvp) {
  const labels = { ...DEFAULT_CONTENT.rsvp, ...rsvp };
  return `<section class="rsvp">
  <h2 class="rsvp-title">${escapeHtml(labels.title)}</h2>
  <div id="rsvp-form" class="rsvp-form">
    <div class="rsvp-buttons">
      <button type="button" class="rsvp-btn rsvp-btn--confirmed" data-rsvp="confirmed">${escapeHtml(labels.confirmed)}</button>
      <button type="button" class="rsvp-btn rsvp-btn--maybe" data-rsvp="maybe">${escapeHtml(labels.maybe)}</button>
      <button type="button" class="rsvp-btn rsvp-btn--declined" data-rsvp="declined">${escapeHtml(labels.declined)}</button>
    </div>
  </div>
  <div id="rsvp-success" class="rsvp-success" hidden>
    <p id="rsvp-status-msg" class="rsvp-status"></p>
    <button type="button" id="rsvp-edit-btn" class="rsvp-edit">Modifier ma réponse</button>
  </div>
</section>`;
}

/**
 * Script RSVP des designs. Il relaie la réponse au parent par postMessage
 * (l'iframe a une origine opaque, voir InvitationPreview) et gère l'état
 * « déjà répondu » / « modifier ma réponse ».
 */
export const RSVP_SCRIPT = `
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('rsvp-form');
  var success = document.getElementById('rsvp-success');
  var message = document.getElementById('rsvp-status-msg');
  var editBtn = document.getElementById('rsvp-edit-btn');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-rsvp]'));
  var MESSAGES = {
    confirmed: '🎉 Présence confirmée, merci !',
    maybe: '🤔 Réponse notée : peut-être.',
    declined: '😔 Vous avez décliné. Merci de nous avoir prévenus.'
  };
  var current = window.GUEST_DATA && window.GUEST_DATA.rsvp_status ? window.GUEST_DATA.rsvp_status : null;
  var submitting = false;

  function setActive(status) {
    buttons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-rsvp') === status);
    });
  }
  function setDisabled(disabled) {
    buttons.forEach(function (btn) { btn.disabled = disabled; });
  }
  function showSuccess(status) {
    current = status;
    setActive(status);
    if (message) message.textContent = MESSAGES[status] || MESSAGES.maybe;
    if (form) form.hidden = true;
    if (success) success.hidden = false;
  }
  function showForm() {
    if (form) form.hidden = false;
    if (success) success.hidden = true;
    setActive(current);
    setDisabled(false);
  }

  if (current) showSuccess(current);

  if (editBtn) {
    editBtn.addEventListener('click', function (e) {
      e.preventDefault();
      submitting = false;
      showForm();
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (submitting) return;
      var status = btn.getAttribute('data-rsvp');
      if (!status) return;
      submitting = true;
      setActive(status);
      setDisabled(true);
      window.parent.postMessage({
        type: 'RSVP_SUBMIT',
        data: { rsvp_status: status, dietary_restrictions: '', plus_one: false, notes: '' }
      }, '*');
      setTimeout(function () {
        showSuccess(status);
        submitting = false;
      }, 400);
    });
  });
});`;
