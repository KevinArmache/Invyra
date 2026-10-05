import "server-only";

import QRCode from "qrcode";

import { QR_OPTIONS } from "@/lib/qr-svg";

/**
 * QR codes des billets d'entrée, générés côté serveur. Couleurs et niveau de
 * correction : voir lib/qr-svg.js.
 */

export { ticketQrSvg } from "@/lib/qr-svg";

/** PNG, pour le PDF du billet et l'image intégrée à l'e-mail. */
export function ticketQrPng(code, width = 480) {
  return QRCode.toBuffer(code, { ...QR_OPTIONS, type: "png", width });
}
