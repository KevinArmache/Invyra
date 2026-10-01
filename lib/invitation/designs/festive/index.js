import { css } from "@/lib/invitation/designs/festive/styles";

/**
 * Festif : dégradé vif semé de confettis, carte blanche très arrondie,
 * boutons pleins. Pour les anniversaires et les soirées.
 */
const festive = {
  id: "festive",
  name: "Festif",
  heroLayout: "stacked",

  styleSchema: [
    { key: "background", type: "color" },
    { key: "background2", type: "color" },
    { key: "card", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "accent2", type: "color" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "radius", type: "range", min: 8, max: 40, step: 2, unit: "px" },
  ],

  defaultStyle: {
    background: "#ff6b9d",
    background2: "#ffb347",
    card: "#ffffff",
    text: "#2d1b33",
    accent: "#e11d74",
    accent2: "#f59e0b",
    fontHeading: "fredoka",
    fontBody: "poppins",
    radius: 28,
  },

  presets: [
    {
      id: "party",
      name: "Fête",
      style: {
        background: "#ff6b9d",
        background2: "#ffb347",
        accent: "#e11d74",
        accent2: "#f59e0b",
        card: "#ffffff",
        text: "#2d1b33",
      },
    },
    {
      id: "tropical",
      name: "Tropical",
      style: {
        background: "#00b4a0",
        background2: "#f9d423",
        accent: "#0f766e",
        accent2: "#f97316",
        card: "#ffffff",
        text: "#12302c",
      },
    },
    {
      id: "pastel",
      name: "Pastel",
      style: {
        background: "#c3b1e1",
        background2: "#fbc4ab",
        accent: "#8b5cf6",
        accent2: "#f472b6",
        card: "#fffdf9",
        text: "#3b2f4a",
      },
    },
    {
      id: "neon",
      name: "Néon",
      style: {
        background: "#1a1033",
        background2: "#3b0a57",
        accent: "#22d3ee",
        accent2: "#f0abfc",
        card: "#120b24",
        text: "#f5f3ff",
      },
    },
  ],

  css,
};

export default festive;
