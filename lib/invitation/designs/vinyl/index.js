import { DEFAULT_CONTENT } from "@/lib/invitation/shared";
import { render } from "@/lib/invitation/designs/vinyl/markup";
import { css } from "@/lib/invitation/designs/vinyl/styles";
import { script, staticScript } from "@/lib/invitation/designs/vinyl/effects";
import { renderVinylOpening } from "@/lib/invitation/designs/vinyl/opening";

/**
 * Face A : l'invitation est un album vinyle.
 *
 * L'invité sort le disque de sa pochette et pose l'aiguille (ouverture en
 * deux gestes) ; la musique démarre et le disque rejoint la pochette du
 * héro. La page est l'album : paroles qui s'allument, compteur de bande,
 * crédits au dos de la pochette, tracklist lue par le bras de la platine,
 * disque qu'on retourne pour passer en face B, bac à disques, jukebox pour
 * répondre, et une piste cachée dont le message gravé se lit quand le
 * disque s'arrête. Défiler entraîne les disques ; remonter les fait tourner
 * à l'envers.
 *
 * Rien n'est propre à l'anniversaire en dehors du contenu d'exemple : le
 * concept vaut pour une soirée, un mariage rétro, un lancement ou un gala.
 *
 * Fichiers : markup.js (HTML et pièces communes : disque, platine, bras,
 * pochette), styles.js (CSS), effects.js (script), opening.js (écran
 * d'ouverture).
 */

// Largeur demandée à Unsplash selon la place de la photo.
const photo = (id, width = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=75`;

const vinyl = {
  id: "vinyl",
  name: "Face A",
  render,
  css,
  script,
  staticScript,
  opening: renderVinylOpening,

  // L'ouverture est propre au design : le choix enveloppe / cachet / rideau
  // n'a pas d'effet ici.
  hiddenFields: { opening: ["style"] },

  styleSchema: [
    { key: "background", type: "color" },
    { key: "card", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "accent2", type: "color" },
    { key: "record", type: "color" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "fontScript", type: "font" },
    { key: "fontMono", type: "font" },
    { key: "rpm", type: "select", options: ["33", "45"] },
    { key: "countdown", type: "toggle" },
    { key: "crackle", type: "toggle" },
  ],

  defaultStyle: {
    background: "#111014",
    card: "#1d1b21",
    text: "#f2ece2",
    accent: "#ff5b35",
    accent2: "#f2c14e",
    record: "#0c0c0e",
    fontHeading: "bebas",
    fontBody: "montserrat",
    fontScript: "permanent-marker",
    fontMono: "dm-mono",
    rpm: "33",
    countdown: true,
    crackle: true,
  },

  presets: [
    {
      id: "minuit",
      name: "Minuit",
      style: {
        background: "#111014",
        card: "#1d1b21",
        text: "#f2ece2",
        accent: "#ff5b35",
        accent2: "#f2c14e",
        record: "#0c0c0e",
      },
    },
    {
      id: "disco",
      name: "Disco",
      style: {
        background: "#1b1030",
        card: "#2a1b46",
        text: "#f8effd",
        accent: "#ff4fa3",
        accent2: "#56e1ff",
        record: "#b8175e",
      },
    },
    {
      id: "creme",
      name: "Crème 70s",
      style: {
        background: "#efe4cc",
        card: "#f8f0de",
        text: "#2c2016",
        accent: "#d4561f",
        accent2: "#2e6d63",
        record: "#17130f",
      },
    },
    {
      id: "jazz",
      name: "Jazz club",
      style: {
        background: "#0f1b17",
        card: "#182820",
        text: "#efe6d2",
        accent: "#c9a449",
        accent2: "#c2573f",
        record: "#0b0d0c",
      },
    },
    {
      id: "pop",
      name: "Pop",
      style: {
        background: "#fff1c9",
        card: "#fffaf0",
        text: "#1c1b22",
        accent: "#2e5bff",
        accent2: "#ff4d8d",
        record: "#ff4d8d",
      },
    },
    {
      id: "studio",
      name: "Studio",
      style: {
        background: "#e8e8e5",
        card: "#f6f6f4",
        text: "#141414",
        accent: "#141414",
        accent2: "#9c9c96",
        record: "#141414",
      },
    },
  ],

  defaultContent: {
    ...DEFAULT_CONTENT,
    opening: {
      style: "envelope",
      eyebrow: "Édition limitée",
      title: "{{GUEST_NAME}}",
      monogram: "",
      hint: "Faites glisser le disque",
    },
    hero: {
      image: photo("photo-1429962714451-bb934ecdc4ec", 1200),
      eyebrow: "Le nouvel album",
      title: "",
    },
    intro: {
      message:
        "Cher(e) {{GUEST_NAME}},\n\nTrente ans, ça se fête en musique. On a rassemblé les meilleurs morceaux de ces années-là, et il manque encore une voix sur la piste : la vôtre.\n\nMontez le son, on vous attend pour la soirée.",
    },
    details: { enabled: true },
    story: {
      enabled: true,
      title: "Les coulisses",
      text: "Trente ans de souvenirs, de concerts improvisés dans le salon et d'amitiés qui tiennent la distance.\n\nCette soirée, c'est l'occasion de réunir tout le monde au même endroit, le temps d'une nuit.",
      image: photo("photo-1519671482749-fd09be7ccebf"),
    },
    program: {
      enabled: true,
      title: "Tracklist",
      items: [
        { time: "19:00", label: "Accueil et cocktails" },
        { time: "20:30", label: "Dîner" },
        { time: "22:00", label: "Discours (version courte, promis)" },
        { time: "22:30", label: "Gâteau et bougies" },
        { time: "23:00", label: "Ouverture du dancefloor" },
        { time: "02:00", label: "Dernière chanson" },
      ],
    },
    venue: {
      enabled: true,
      title: "Le lieu",
      text: "Une ancienne halle aux lumières tamisées, avec une vraie piste de danse et un bar ouvert toute la nuit.",
      image: photo("photo-1527529482837-4698179dc6ce"),
      mapUrl: "",
    },
    dressCode: {
      enabled: true,
      title: "Dress code",
      text: "Tenue de soirée. Paillettes, velours et chemises à motifs sont vivement encouragés.",
    },
    gallery: {
      enabled: true,
      title: "Bac à disques",
      images: [
        photo("photo-1492684223066-81342ee5ff30", 800),
        photo("photo-1464349095431-e9a21285b5f3", 800),
        photo("photo-1470225620780-dba8ba36b745", 800),
        photo("photo-1530103862676-de8c9debad1d", 800),
        photo("photo-1511671782779-c97d3d27a1d4", 800),
        photo("photo-1496337589254-7e19d01cec44", 800),
      ],
    },
    closing: {
      enabled: true,
      title: "Merci d'avoir écouté",
      text: "Vous êtes arrivé(e) au bout du disque. La suite, on l'écrit ensemble sur la piste de danse.",
    },
    rsvp: {
      // Espace insécable avant le point d'interrogation.
      title: "Serez-vous sur la guest list ?",
      confirmed: "Je serai là",
      maybe: "Je ne sais pas encore",
      declined: "Je ne pourrai pas venir",
    },
  },
};

export default vinyl;
