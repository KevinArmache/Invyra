import { DEFAULT_CONTENT, unsplashPhoto } from "@/lib/invitation/content";
import { render } from "@/lib/invitation/designs/eclat/markup";
import { css } from "@/lib/invitation/designs/eclat/styles";
import { script, staticScript } from "@/lib/invitation/designs/eclat/effects";

/**
 * Éclat : le design « grand mariage ».
 *
 * Plein écran sur la photo du couple (zoom lent + parallaxe), titre
 * calligraphié à la feuille d'or, sceau « Save the date » qui tourne,
 * poussière d'or en arrière-plan, compte à rebours, sections qui se révèlent
 * au défilement, frise du programme qui se trace, confettis dorés quand
 * l'invité confirme.
 *
 * Tous les effets sont progressifs : sans script (vignettes de la galerie)
 * ou avec « réduire les animations », l'invitation reste complète et lisible.
 *
 * Fichiers : markup.js (HTML), styles.js (CSS), effects.js (scripts).
 */

const photo = (id) => unsplashPhoto(id, { width: 1400, quality: 80 });

const eclat = {
  id: "eclat",
  name: "Éclat",
  render,
  css,
  script,
  staticScript,

  styleSchema: [
    { key: "background", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "accent2", type: "color" },
    { key: "fontScript", type: "font" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "radius", type: "range", min: 0, max: 40, step: 2, unit: "px" },
    { key: "overlay", type: "range", min: 0, max: 90, step: 5, unit: "%" },
    { key: "particles", type: "toggle" },
    { key: "countdown", type: "toggle" },
    { key: "confetti", type: "toggle" },
  ],

  defaultStyle: {
    background: "#0b0d17",
    text: "#f3ecdf",
    accent: "#d9b56c",
    accent2: "#fff1c9",
    fontScript: "pinyon",
    fontHeading: "cinzel",
    fontBody: "cormorant",
    radius: 20,
    overlay: 45,
    particles: true,
    countdown: true,
    confetti: true,
  },

  presets: [
    {
      id: "starry",
      name: "Nuit étoilée",
      style: {
        background: "#0b0d17",
        text: "#f3ecdf",
        accent: "#d9b56c",
        accent2: "#fff1c9",
      },
    },
    {
      id: "champagne",
      name: "Champagne",
      style: {
        background: "#faf5ec",
        text: "#3a2f28",
        accent: "#b08a45",
        accent2: "#f0d9a0",
      },
    },
    {
      id: "blush",
      name: "Rose poudré",
      style: {
        background: "#f8ecea",
        text: "#4a2f33",
        accent: "#b57b72",
        accent2: "#f6d3c8",
      },
    },
    {
      id: "emerald",
      name: "Émeraude",
      style: {
        background: "#0c2621",
        text: "#f1ead8",
        accent: "#d4b06a",
        accent2: "#fbe9b7",
      },
    },
  ],

  defaultContent: {
    ...DEFAULT_CONTENT,
    hero: {
      image: photo("photo-1537633552985-df8429e8048b"),
      eyebrow: "Nous nous marions",
      title: "",
    },
    intro: {
      message:
        "Cher(e) {{GUEST_NAME}},\n\nAvec une immense joie et le cœur rempli d'amour, nous avons le bonheur de vous convier à la célébration de notre mariage.\n\nVotre présence à nos côtés rendra ce jour inoubliable.",
    },
    story: {
      enabled: true,
      title: "Notre histoire",
      text: "Il y a des rencontres qui changent une vie. La nôtre a commencé par un sourire, s'est poursuivie par mille éclats de rire, et ne s'est plus jamais arrêtée.\n\nAujourd'hui, nous avons choisi de nous dire oui, et nous voulons partager ce moment avec celles et ceux que nous aimons.",
      image: photo("photo-1606216794074-735e91aa2c92"),
    },
    program: {
      enabled: true,
      title: "Le programme",
      items: [
        { time: "15:00", label: "Cérémonie" },
        { time: "16:30", label: "Vin d'honneur" },
        { time: "19:30", label: "Dîner aux chandelles" },
        { time: "22:00", label: "Ouverture du bal" },
        { time: "00:00", label: "Pièce montée & feu d'artifice" },
      ],
    },
    venue: {
      enabled: true,
      title: "Le lieu",
      text: "Un domaine niché dans la verdure, où la cérémonie se tiendra en plein air sous les arches fleuries.",
      image: photo("photo-1469371670807-013ccf25f16a"),
      mapUrl: "",
    },
    dressCode: {
      enabled: true,
      title: "Dress code",
      text: "Tenue de soirée. Laissez-vous inspirer par des tons clairs, nude et dorés.",
    },
    gallery: {
      enabled: true,
      title: "Instants choisis",
      images: [
        photo("photo-1583939003579-730e3918a45a"),
        photo("photo-1465495976277-4387d4b0b4c6"),
        photo("photo-1522413452208-996ff3f3e740"),
        photo("photo-1460978812857-470ed1c77af0"),
        photo("photo-1532712938310-34cb3982ef74"),
        photo("photo-1519225421980-715cb0215aed"),
      ],
    },
    closing: {
      enabled: true,
      title: "Avec tout notre amour",
      text: "Nous avons hâte de vivre ce jour avec vous, de trinquer, de danser et de garder, ensemble, des souvenirs pour toujours.",
    },
    rsvp: {
      title: "Serez-vous des nôtres ?",
      confirmed: "Avec joie !",
      maybe: "Peut-être",
      declined: "Hélas, non",
    },
  },
};

export default eclat;
