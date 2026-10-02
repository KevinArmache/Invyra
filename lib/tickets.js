import { customAlphabet } from "nanoid";

/**
 * Billets d'entrée des invités.
 *
 * Le code du billet (Guest.ticketCode) est distinct du jeton d'invitation :
 * le billet se montre à l'entrée, le jeton donne le droit de modifier sa
 * réponse. Le QR code ne contient que ce code, sans adresse : scanné avec
 * l'appareil photo d'un téléphone, il ne révèle rien sur l'invité.
 *
 * Alphabet sans caractères ambigus (ni 0, O, 1, I, L) : un agent d'accueil
 * peut taper le code à la main si l'écran de l'invité est illisible. La
 * migration 004-guest-ticket-checkin.sql utilise le même.
 *
 * Module pur, importable côté serveur comme côté client.
 */

export const TICKET_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const TICKET_LENGTH = 12;

export const newTicketCode = customAlphabet(TICKET_ALPHABET, TICKET_LENGTH);

/** « 7K3MQ9PX2HTA » → « 7K3M-Q9PX-2HTA », plus facile à lire et à dicter. */
export function formatTicketCode(code) {
  return String(code ?? "").match(/.{1,4}/g)?.join("-") ?? "";
}

/**
 * Code lu par le scanner ou tapé par l'agent : majuscules, sans espaces ni
 * tirets. Renvoie null pour une valeur qui ne peut pas être un code.
 */
export function parseScannedCode(value) {
  const code = String(value ?? "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");
  return code.length >= 6 && code.length <= 32 ? code : null;
}

/** Nombre de places d'un invité, entre 1 et MAX_SEATS. */
export const MAX_SEATS = 20;

export function clampSeats(value, max = MAX_SEATS) {
  const number = Math.trunc(Number(value));
  if (!Number.isFinite(number) || number < 1) return 1;
  return Math.min(number, max);
}

/** Personnes attendues pour un invité confirmé : sa réponse, sinon ses places. */
export function expectedPeople(guest) {
  return guest.attendingCount ?? guest.seats ?? 1;
}
