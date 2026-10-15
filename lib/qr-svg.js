import QRCode from "qrcode";

/**
 * QR codes des billets d'entrée, en SVG : sur la page du billet et dans
 * l'invitation (lib/invitation/document.js). Celui des invitations d'exemple
 * est fixe : voir lib/invitation/sample-qr.js.
 *
 * Module pur, importable côté serveur comme côté client. Le PNG (PDF du
 * billet, e-mail) est dans lib/qr.js, réservé au serveur.
 *
 * Modules sombres sur fond clair, quel que soit le thème de la page : c'est
 * le contraste que les scanners lisent le mieux, surtout sur un écran de
 * téléphone dont la luminosité est basse. Correction « M » (15 %) : le code
 * reste lisible avec un écran un peu rayé, sans devenir trop dense.
 */

export const QR_OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 1,
  color: { dark: "#100d0bff", light: "#ffffffff" },
};

/** SVG à insérer tel quel dans la page (le code ne contient que [0-9A-Z]). */
export function ticketQrSvg(code) {
  return QRCode.toString(code, { ...QR_OPTIONS, type: "svg" });
}

/**
 * QR code d'une adresse (lien unique de l'invitation) : scanné avec un
 * téléphone, il ouvre la page. Mêmes couleurs que les billets.
 */
export function linkQrSvg(url) {
  return QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
}

/**
 * Le même en PNG, en data URL, assez grand pour être imprimé net (carte,
 * affiche). Côté navigateur uniquement : `qrcode` y dessine sur un canvas.
 */
export function linkQrPngDataUrl(url, width = 1200) {
  return QRCode.toDataURL(url, { ...QR_OPTIONS, width });
}
