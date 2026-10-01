import { DEFAULT_CONTENT, unsplashPhoto } from "@/lib/invitation/content";
import { render } from "@/lib/invitation/designs/boarding/markup";
import { css } from "@/lib/invitation/designs/boarding/styles";
import { script, staticScript } from "@/lib/invitation/designs/boarding/effects";
import { renderBoardingOpening } from "@/lib/invitation/designs/boarding/opening";

/**
 * Embarquement : l'invitation est un voyage.
 *
 * L'invité détache le talon de sa carte d'embarquement ; la carte passe au
 * lecteur puis s'envole, et le tableau des départs du héro fait claquer ses
 * palettes jusqu'au nom de l'événement. La suite est le voyage, chaque
 * section annoncée par un panneau d'aéroport : message du commandant,
 * bagages qui arrivent sur le tapis, itinéraire suivi par un avion au
 * défilement, carte postale, hublot dont le volet se lève sur la
 * destination, consignes de bord, passeport tamponné, enregistrement
 * (la réponse), puis le décollage dans un ciel de fin de journée.
 *
 * Pensé pour un mariage à destination, il vaut aussi pour un séminaire, un
 * voyage d'anniversaire ou tout événement « loin de chez soi ».
 *
 * Fichiers : markup.js (HTML et pièces communes : codes, avion, tampons),
 * styles.js (CSS), effects.js (script), opening.js (écran d'ouverture).
 */

// Largeur demandée à Unsplash selon la place de la photo.
const photo = (id, width) => unsplashPhoto(id, { width });

const boarding = {
  id: "boarding",
  name: "Embarquement",
  render,
  css,
  script,
  staticScript,
  opening: renderBoardingOpening,

  // L'ouverture est propre au design : le choix enveloppe / cachet / rideau
  // n'a pas d'effet ici.
  hiddenFields: { opening: ["style"] },

  styleSchema: [
    { key: "background", type: "color" },
    { key: "card", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "accent2", type: "color" },
    { key: "flap", type: "color" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "fontMono", type: "font" },
    { key: "countdown", type: "toggle" },
    { key: "sounds", type: "toggle" },
  ],

  defaultStyle: {
    background: "#f1ece3",
    card: "#fbf9f4",
    text: "#14243b",
    accent: "#c8432b",
    accent2: "#b58b4c",
    flap: "#f4efe4",
    fontHeading: "playfair",
    fontBody: "josefin",
    fontMono: "dm-mono",
    countdown: true,
    sounds: true,
  },

  presets: [
    {
      id: "premiere",
      name: "Première classe",
      style: {
        background: "#f1ece3",
        card: "#fbf9f4",
        text: "#14243b",
        accent: "#c8432b",
        accent2: "#b58b4c",
        flap: "#f4efe4",
      },
    },
    {
      id: "nuit",
      name: "Vol de nuit",
      style: {
        background: "#0d1626",
        card: "#16223a",
        text: "#eef1f6",
        accent: "#e2b25c",
        accent2: "#6ea8d8",
        flap: "#ffd25e",
      },
    },
    {
      id: "riviera",
      name: "Riviera",
      style: {
        background: "#f4f7fa",
        card: "#ffffff",
        text: "#0f2c4c",
        accent: "#e0573f",
        accent2: "#2b8fc4",
        flap: "#ffffff",
      },
    },
    {
      id: "jetset",
      name: "Jet-set",
      style: {
        background: "#111111",
        card: "#1c1c1c",
        text: "#f2ede4",
        accent: "#c9a45c",
        accent2: "#8c8c8c",
        flap: "#f2ede4",
      },
    },
    {
      id: "tropique",
      name: "Tropique",
      style: {
        background: "#f3ead9",
        card: "#fdf8ef",
        text: "#1f3a33",
        accent: "#d9583f",
        accent2: "#2f8f7f",
        flap: "#ffe9b0",
      },
    },
    {
      id: "aeropostale",
      name: "Aéropostale",
      style: {
        background: "#e6d8bd",
        card: "#f4ead6",
        text: "#2a2a3a",
        accent: "#b8302f",
        accent2: "#2c4a7a",
        flap: "#f4ead6",
      },
    },
  ],

  defaultContent: {
    ...DEFAULT_CONTENT,
    opening: {
      style: "envelope",
      eyebrow: "Carte d'embarquement",
      title: "{{GUEST_NAME}}",
      monogram: "",
      hint: "Détachez le talon",
    },
    hero: {
      image: photo("photo-1570077188670-e3a8d69ac5ff", 1600),
      eyebrow: "Départs",
      title: "",
    },
    intro: {
      message:
        "Cher(e) {{GUEST_NAME}},\n\nNous avons choisi de nous dire oui au bout du voyage, face à la mer.\n\nVotre place est réservée à nos côtés. Il ne manque plus que votre confirmation d'embarquement.",
    },
    details: { enabled: true },
    story: {
      enabled: true,
      title: "Notre histoire",
      text: "Tout a commencé par deux sièges voisins sur un vol retardé. Six heures d'attente, un jeu de cartes et beaucoup de cafés plus tard, nous avions déjà prévu le voyage suivant.\n\nDepuis, nous collectionnons les tampons sur nos passeports. Celui-ci sera le plus beau.",
      image: photo("photo-1530789253388-582c481c54b0"),
    },
    program: {
      enabled: true,
      title: "Le programme",
      items: [
        { time: "15:30", label: "Accueil sur la terrasse" },
        { time: "16:00", label: "Cérémonie face à la mer" },
        { time: "17:30", label: "Cocktail au coucher du soleil" },
        { time: "20:00", label: "Dîner sous les étoiles" },
        { time: "22:30", label: "Première danse et soirée" },
      ],
    },
    venue: {
      enabled: true,
      title: "Santorin, Grèce",
      text: "Une terrasse blanche au bord de l'eau, dans un village de pêcheurs de l'île. Nous vous enverrons tous nos conseils pour le voyage et l'hébergement.",
      image: photo("photo-1601581875309-fafbf2d3ed3a"),
      mapUrl: "",
    },
    dressCode: {
      enabled: true,
      title: "Dress code",
      text: "Tenue d'été élégante, couleurs claires bienvenues. Prévoyez des chaussures confortables pour les ruelles pavées et une petite laine pour la soirée.",
    },
    gallery: {
      enabled: true,
      title: "Nos escales",
      images: [
        photo("photo-1613395877344-13d4a8e0d49e", 800),
        photo("photo-1520854221256-17451cc331bf", 800),
        photo("photo-1507525428034-b723cf961d3e", 800),
        photo("photo-1544078751-58fee2d8a03b", 800),
        photo("photo-1533105079780-92b9be482077", 800),
        photo("photo-1436491865332-7a61a109cc05", 800),
      ],
    },
    closing: {
      enabled: true,
      title: "Prêts au décollage",
      text: "Merci de faire partie du voyage. Nous avons hâte de vous retrouver là-bas.",
    },
    rsvp: {
      // Espace insécable avant le point d'interrogation.
      title: "Serez-vous du voyage ?",
      confirmed: "Je confirme mon embarquement",
      maybe: "Je ne sais pas encore",
      declined: "Je ne pourrai pas venir",
    },
  },
};

export default boarding;
