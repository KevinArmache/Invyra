import { css } from "@/lib/invitation/designs/minimal/styles";

/**
 * Minimal : page claire et aérée, typographie forte, photo pleine largeur
 * au-dessus du titre. Convient aux événements pro, baptêmes, anniversaires
 * de mariage.
 */
const minimal = {
  id: "minimal",
  name: "Minimal",
  heroLayout: "stacked",

  styleSchema: [
    { key: "background", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "radius", type: "range", min: 0, max: 24, step: 2, unit: "px" },
  ],

  defaultStyle: {
    background: "#ffffff",
    text: "#1c1c1c",
    accent: "#c2410c",
    fontHeading: "dm-serif",
    fontBody: "inter",
    radius: 4,
  },

  presets: [
    {
      id: "white",
      name: "Blanc",
      style: { background: "#ffffff", text: "#1c1c1c", accent: "#c2410c" },
    },
    {
      id: "sand",
      name: "Sable",
      style: { background: "#f4efe6", text: "#2b2620", accent: "#8a6a3f" },
    },
    {
      id: "blue",
      name: "Bleu",
      style: { background: "#f3f6fb", text: "#14213d", accent: "#2563eb" },
    },
    {
      id: "ink",
      name: "Encre",
      style: { background: "#141414", text: "#f2f2f2", accent: "#f5c451" },
    },
  ],

  css,
};

export default minimal;
