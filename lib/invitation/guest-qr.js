import "server-only";

import { prisma } from "@/lib/prisma";
import { ticketQrSvg } from "@/lib/qr";
import { formatTicketCode, newTicketCode } from "@/lib/tickets";

/**
 * QR code d'entrée d'un invité : celui de son billet, affiché aussi sur son
 * invitation, en ligne comme en PDF (voir lib/invitation/document.js). Le
 * scanner de l'accueil le lit (scanTicket) ; un invité qui n'a pas confirmé y
 * est signalé, et l'agent décide.
 *
 * Module serveur, pas une server action : rien ici n'est appelable depuis le
 * navigateur.
 */

/**
 * Code de billet de l'invité. Chaque invité en reçoit un à sa création
 * (addGuest) ; un invité plus ancien qui n'en a pas en reçoit un ici.
 *
 * @param {{ id: string, ticketCode: string | null }} guest
 */
export async function ensureTicketCode(guest) {
  if (guest.ticketCode) return guest.ticketCode;
  const code = newTicketCode();
  await prisma.guest.update({ where: { id: guest.id }, data: { ticketCode: code } });
  return code;
}

/**
 * @param {{ id: string, ticketCode: string | null }} guest
 * @returns {Promise<{ code: string, svg: string }>}  code lisible
 *   (« 7K3M-Q9PX-2HTA ») et QR code en SVG
 */
export async function guestQrFor(guest) {
  const code = await ensureTicketCode(guest);
  return { code: formatTicketCode(code), svg: await ticketQrSvg(code) };
}
