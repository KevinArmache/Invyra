import { BRAND_HEX } from "@/lib/email/invitation-email";
import { SITE_NAME } from "@/lib/site";

/**
 * Manifeste : nom, couleurs et icônes quand le site est ajouté à l'écran
 * d'accueil. Il s'ouvre sur le tableau de bord, qui renvoie à la connexion
 * si besoin.
 */
export default function manifest() {
  return {
    name: `${SITE_NAME} · Invitations numériques`,
    short_name: SITE_NAME,
    description:
      "Créez une invitation numérique sans code, envoyez-la par email ou WhatsApp et suivez les réponses.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: BRAND_HEX.page,
    theme_color: "#232020",
    lang: "fr",
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
