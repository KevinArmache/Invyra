import { DEFAULT_CONTENT } from "@/lib/invitation/shared";
import { FINAL_FIGURES } from "@/lib/invitation/designs/origami/figures";
import { render } from "@/lib/invitation/designs/origami/markup";
import { css } from "@/lib/invitation/designs/origami/styles";
import { script, staticScript } from "@/lib/invitation/designs/origami/effects";
import { renderOrigamiOpening } from "@/lib/invitation/designs/origami/opening";

/**
 * Origami : l'invitation est une feuille de papier.
 *
 * L'invité la déplie du bout du doigt (ouverture en deux plis), la feuille
 * devient la page, et chaque section se déplie à son tour au défilement :
 * message qui sort de sa pochette, infos sur des cartes au coin corné,
 * programme en accordéon, lieu derrière un volet, album photo. La
 * carte-réponse se replie en avion et s'envole, puis une feuille se plie en
 * figure finale (grue, cœur ou étoile) qui prend son envol.
 *
 * Rien n'est propre au mariage en dehors du contenu d'exemple : ambiances,
 * figure finale et textes s'adaptent à un anniversaire, une naissance, une
 * soirée ou un événement professionnel.
 *
 * Fichiers : markup.js (HTML), styles.js (CSS), effects.js (script),
 * opening.js (écran d'ouverture), figures.js (géométrie des pliages).
 */

// Largeur demandée à Unsplash selon la place de la photo : les vignettes de
// l'album n'ont pas besoin de 1400 px, et une photo trop lourde laisse son
// cadre vide le temps du chargement sur mobile.
const photo = (id, width = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=75`;

const origami = {
  id: "origami",
  name: "Origami",
  render,
  css,
  script,
  staticScript,
  opening: renderOrigamiOpening,

  // L'ouverture est propre au design : le choix enveloppe / cachet / rideau
  // n'a pas d'effet ici.
  hiddenFields: { opening: ["style"] },

  styleSchema: [
    { key: "background", type: "color" },
    { key: "card", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "accent2", type: "color" },
    { key: "fontScript", type: "font" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "texture", type: "range", min: 0, max: 100, step: 5, unit: "%" },
    { key: "figure", type: "select", options: FINAL_FIGURES },
    { key: "countdown", type: "toggle" },
    { key: "cranes", type: "toggle" },
  ],

  defaultStyle: {
    background: "#e6dfd3",
    card: "#fbf8f1",
    text: "#2e2a25",
    accent: "#c2412d",
    accent2: "#b8955a",
    fontScript: "great-vibes",
    fontHeading: "dm-serif",
    fontBody: "lora",
    texture: 45,
    figure: "crane",
    countdown: true,
    cranes: true,
  },

  presets: [
    {
      id: "washi",
      name: "Washi",
      style: {
        background: "#e6dfd3",
        card: "#fbf8f1",
        text: "#2e2a25",
        accent: "#c2412d",
        accent2: "#b8955a",
      },
    },
    {
      id: "indigo",
      name: "Nuit indigo",
      style: {
        background: "#0f1524",
        card: "#1b2337",
        text: "#ece6d8",
        accent: "#e0a15a",
        accent2: "#c9b27c",
      },
    },
    {
      id: "sauge",
      name: "Sauge",
      style: {
        background: "#d9e0d2",
        card: "#f7f8f2",
        text: "#2f3a30",
        accent: "#5f8466",
        accent2: "#bfa577",
      },
    },
    {
      id: "poudre",
      name: "Poudre",
      style: {
        background: "#efdfda",
        card: "#fdf8f6",
        text: "#4a3236",
        accent: "#c47476",
        accent2: "#d4ae86",
      },
    },
    {
      id: "kraft",
      name: "Kraft",
      style: {
        background: "#c6b08f",
        card: "#ebe0cb",
        text: "#3b2f22",
        accent: "#2f5d62",
        accent2: "#8c6a3f",
      },
    },
    {
      id: "encre",
      name: "Encre",
      style: {
        background: "#e3e3e0",
        card: "#ffffff",
        text: "#1c1c1e",
        accent: "#1c1c1e",
        accent2: "#9a9a9f",
      },
    },
  ],

  defaultContent: {
    ...DEFAULT_CONTENT,
    opening: {
      style: "envelope",
      eyebrow: "Une invitation pliée pour vous",
      title: "{{GUEST_NAME}}",
      monogram: "",
      hint: "Glissez pour déplier",
    },
    hero: {
      image: photo("photo-1519741497674-611481863552", 1200),
      eyebrow: "Nous nous marions",
      title: "",
    },
    intro: {
      message:
        "Cher(e) {{GUEST_NAME}},\n\nNous avons plié cette invitation avec soin, un pli après l'autre, comme on prépare les plus beaux jours.\n\nNous serions très heureux de vous compter parmi nous pour célébrer notre mariage.",
    },
    details: { enabled: true },
    story: {
      enabled: true,
      title: "Notre histoire",
      text: "Une rencontre un peu par hasard, puis des week-ends, des voyages et des projets griffonnés sur des coins de nappe.\n\nAu fil des années, notre histoire a pris forme, pli après pli. Il ne manquait plus que vous pour la célébrer.",
      image: photo("photo-1583939003579-730e3918a45a"),
    },
    program: {
      enabled: true,
      title: "Le déroulé",
      items: [
        { time: "14:30", label: "Accueil des invités" },
        { time: "15:00", label: "Cérémonie" },
        { time: "16:30", label: "Vin d'honneur dans le jardin" },
        { time: "19:30", label: "Dîner" },
        { time: "22:00", label: "Première danse et soirée" },
      ],
    },
    venue: {
      enabled: true,
      title: "Le lieu",
      text: "Une maison de famille entourée d'un grand jardin. La cérémonie aura lieu en plein air, le dîner sous les arbres.",
      image: photo("photo-1522673607200-164d1b6ce486"),
      mapUrl: "",
    },
    dressCode: {
      enabled: true,
      title: "Dress code",
      text: "Tenue de cocktail. Les tons clairs et pastel sont les bienvenus.",
    },
    gallery: {
      enabled: true,
      title: "Quelques souvenirs",
      images: [
        photo("photo-1465495976277-4387d4b0b4c6", 800),
        photo("photo-1522413452208-996ff3f3e740", 800),
        photo("photo-1460978812857-470ed1c77af0", 800),
        photo("photo-1537633552985-df8429e8048b", 800),
        photo("photo-1519225421980-715cb0215aed", 800),
        photo("photo-1511285560929-80b456fea0bc", 800),
      ],
    },
    closing: {
      enabled: true,
      title: "Avec toute notre affection",
      text: "Chaque pli de cette invitation porte un peu de notre joie. Nous avons hâte de la partager avec vous.",
    },
    rsvp: {
      // Espace insécable avant le point d'interrogation.
      title: "Serez-vous des nôtres ?",
      confirmed: "Avec joie, je serai là",
      maybe: "Je ne sais pas encore",
      declined: "Je ne pourrai pas venir",
    },
  },
};

export default origami;
