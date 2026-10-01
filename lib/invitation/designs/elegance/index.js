import { css } from "@/lib/invitation/designs/elegance/styles";

/**
 * Élégance : le modèle historique d'Invyra (carte translucide, filet doré,
 * titre posé sur la photo), converti en design paramétrable.
 */
const elegance = {
  id: "elegance",
  name: "Élégance",
  heroLayout: "overlay",

  styleSchema: [
    { key: "background", type: "color" },
    { key: "background2", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "radius", type: "range", min: 0, max: 40, step: 2, unit: "px" },
    { key: "overlay", type: "range", min: 0, max: 90, step: 5, unit: "%" },
  ],

  defaultStyle: {
    background: "#0f0c29",
    background2: "#302b63",
    text: "#f5f1e8",
    accent: "#d4af37",
    fontHeading: "playfair",
    fontBody: "cormorant",
    radius: 24,
    overlay: 50,
  },

  presets: [
    {
      id: "night",
      name: "Nuit & or",
      style: {
        background: "#0f0c29",
        background2: "#302b63",
        text: "#f5f1e8",
        accent: "#d4af37",
      },
    },
    {
      id: "ivory",
      name: "Ivoire",
      style: {
        background: "#faf6ef",
        background2: "#efe4d2",
        text: "#3b3226",
        accent: "#b08d57",
        overlay: 35,
      },
    },
    {
      id: "sage",
      name: "Sauge",
      style: {
        background: "#e9efe6",
        background2: "#d3dfcc",
        text: "#2f3b2c",
        accent: "#6f8a5e",
        overlay: 35,
      },
    },
    {
      id: "burgundy",
      name: "Bordeaux",
      style: {
        background: "#2a0f14",
        background2: "#4f1b27",
        text: "#f7ece6",
        accent: "#e0b07a",
      },
    },
  ],

  css,
};

export default elegance;
