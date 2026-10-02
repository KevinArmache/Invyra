import "server-only";

import QRCode from "qrcode";

/**
 * QR codes des billets d'entrée, générés côté serveur.
 *
 * Modules sombres sur fond clair, quel que soit le thème de la page : c'est
 * le contraste que les scanners lisent le mieux, surtout sur un écran de
 * téléphone dont la luminosité est basse. Correction « M » (15 %) : le code
 * reste lisible avec un écran un peu rayé, sans devenir trop dense.
 */

const OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 1,
  color: { dark: "#100d0bff", light: "#ffffffff" },
};

/** SVG à insérer tel quel dans la page (le code ne contient que [0-9A-Z]). */
export function ticketQrSvg(code) {
  return QRCode.toString(code, { ...OPTIONS, type: "svg" });
}

/** PNG, pour le PDF du billet et l'image intégrée à l'e-mail. */
export function ticketQrPng(code, width = 480) {
  return QRCode.toBuffer(code, { ...OPTIONS, type: "png", width });
}
