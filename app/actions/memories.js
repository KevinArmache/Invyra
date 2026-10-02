"use server";

import { del } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import {
  canAccessEvent,
  getSession,
  isEventOwnerOrAdmin,
} from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";
import { MAX_MESSAGES_PER_GUEST, MAX_PHOTOS_PER_GUEST } from "@/lib/site";

/**
 * Souvenirs d'un événement : le livre d'or et les photos des invités.
 *
 * Côté invité, tout passe par le jeton de son invitation : seuls les invités
 * écrivent, et chacun ne supprime que ce qu'il a publié. Les messages et les
 * photos sont visibles par tous les invités, sauf ceux que l'hôte a masqués.
 *
 * Côté hôte, le propriétaire et les éditeurs masquent, suppriment et
 * ouvrent ou ferment le livre d'or et le partage de photos ; un
 * collaborateur en lecture seule voit tout sans rien modifier.
 */

const MESSAGE_MAX = 500;
/** Plafond de lecture : au-delà, les plus anciens ne sont pas chargés. */
const LIST_LIMIT = 300;

const AUTHOR = { guest: { select: { name: true } } };

function messageView(message, viewerId) {
  return {
    id: message.id,
    message: message.message,
    name: message.guest.name,
    createdAt: message.createdAt,
    hidden: message.hidden,
    mine: message.guestId === viewerId,
  };
}

function photoView(photo, viewerId) {
  return {
    id: photo.id,
    url: photo.url,
    width: photo.width,
    height: photo.height,
    name: photo.guest.name,
    createdAt: photo.createdAt,
    hidden: photo.hidden,
    mine: photo.guestId === viewerId,
  };
}

/** Supprime un fichier de Vercel Blob, sans bloquer si c'est impossible. */
async function removeBlob(url) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(url);
  } catch (error) {
    console.error("[memories] Fichier non supprimé :", error.message);
  }
}

// ─── Côté invité ────────────────────────────────────────────────────────────

async function findGuest(token) {
  if (typeof token !== "string" || token.length > 64) return null;
  return prisma.guest.findUnique({
    where: { invitationToken: token },
    select: {
      id: true,
      name: true,
      eventId: true,
      event: {
        select: {
          title: true,
          eventDate: true,
          guestbookEnabled: true,
          photosEnabled: true,
          invitationTemplate: true,
          templateCopy: { select: { config: true } },
        },
      },
    },
  });
}

async function requireGuest(token) {
  const guest = await findGuest(token);
  if (!guest) throw new Error("Invitation introuvable");
  return guest;
}

/**
 * Souvenirs vus par un invité, ou null pour un jeton inconnu.
 */
export async function getMemories(token) {
  const guest = await findGuest(token);
  if (!guest) return null;
  const { event } = guest;

  const [messages, photos, myPhotos] = await Promise.all([
    event.guestbookEnabled
      ? prisma.guestbookMessage.findMany({
          where: { eventId: guest.eventId, hidden: false },
          include: AUTHOR,
          orderBy: { createdAt: "desc" },
          take: LIST_LIMIT,
        })
      : [],
    event.photosEnabled
      ? prisma.eventPhoto.findMany({
          where: { eventId: guest.eventId, hidden: false },
          include: AUTHOR,
          orderBy: { createdAt: "desc" },
          take: LIST_LIMIT,
        })
      : [],
    prisma.eventPhoto.count({ where: { guestId: guest.id } }),
  ]);

  return {
    guest: { name: guest.name, photoCount: myPhotos },
    event: {
      id: guest.eventId,
      title: event.title,
      eventDate: event.eventDate,
      guestbookEnabled: event.guestbookEnabled,
      photosEnabled: event.photosEnabled,
      invitationTemplate: event.templateCopy?.config || event.invitationTemplate,
    },
    messages: messages.map((message) => messageView(message, guest.id)),
    photos: photos.map((photo) => photoView(photo, guest.id)),
  };
}

export async function postGuestbookMessage(token, text) {
  const guest = await requireGuest(token);
  if (!guest.event.guestbookEnabled) throw new Error("Le livre d'or est fermé.");

  const message = String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MESSAGE_MAX);
  if (!message) throw new Error("Message vide");

  const count = await prisma.guestbookMessage.count({ where: { guestId: guest.id } });
  if (count >= MAX_MESSAGES_PER_GUEST) {
    throw new Error("Vous avez déjà laissé beaucoup de messages.");
  }

  const created = await prisma.guestbookMessage.create({
    data: { eventId: guest.eventId, guestId: guest.id, message },
    include: AUTHOR,
  });
  return messageView(created, guest.id);
}

export async function deleteMyMessage(token, messageId) {
  const guest = await requireGuest(token);
  await prisma.guestbookMessage.deleteMany({
    where: { id: String(messageId ?? ""), guestId: guest.id },
  });
  return { success: true };
}

/**
 * Enregistre une photo que l'invité vient d'envoyer sur Vercel Blob (voir
 * app/api/upload/route.js). Le fichier doit être dans le dossier de
 * l'événement, sur le stockage Blob : une adresse quelconque est refusée.
 */
export async function addEventPhoto(token, { url, pathname, width, height } = {}) {
  const guest = await requireGuest(token);
  if (!guest.event.photosEnabled) throw new Error("Le partage de photos est fermé.");

  const path = String(pathname ?? "");
  let parsed;
  try {
    parsed = new URL(String(url ?? ""));
  } catch {
    throw new Error("Photo invalide");
  }
  const valid =
    path.startsWith(`memories/${guest.eventId}/`) &&
    parsed.protocol === "https:" &&
    parsed.hostname.endsWith(".public.blob.vercel-storage.com") &&
    decodeURIComponent(parsed.pathname) === `/${path}`;
  if (!valid) throw new Error("Photo invalide");

  const count = await prisma.eventPhoto.count({ where: { guestId: guest.id } });
  if (count >= MAX_PHOTOS_PER_GUEST) {
    await removeBlob(parsed.href);
    throw new Error("Limite de photos atteinte");
  }

  const size = (value) => {
    const number = Math.trunc(Number(value));
    return Number.isFinite(number) && number > 0 && number < 20_000 ? number : null;
  };

  const photo = await prisma.eventPhoto.create({
    data: {
      eventId: guest.eventId,
      guestId: guest.id,
      url: parsed.href,
      pathname: path,
      width: size(width),
      height: size(height),
    },
    include: AUTHOR,
  });
  return photoView(photo, guest.id);
}

export async function deleteMyPhoto(token, photoId) {
  const guest = await requireGuest(token);
  const photo = await prisma.eventPhoto.findFirst({
    where: { id: String(photoId ?? ""), guestId: guest.id },
    select: { id: true, url: true },
  });
  if (!photo) return { success: true };

  await prisma.eventPhoto.delete({ where: { id: photo.id } });
  await removeBlob(photo.url);
  return { success: true };
}

// ─── Côté hôte ──────────────────────────────────────────────────────────────

async function canManage(eventId) {
  const session = await getSession();
  if (!session) return false;
  if (await isEventOwnerOrAdmin(eventId)) return true;
  return (await getMyCollaboratorRole(eventId)) === "editor";
}

async function assertManage(eventId) {
  if (!(await canManage(eventId))) {
    throw new Error("Seul le propriétaire ou un éditeur peut modérer les souvenirs.");
  }
}

/** Tous les souvenirs d'un événement, masqués compris. */
export async function getEventMemories(eventId) {
  if (!(await canAccessEvent(eventId))) throw new Error("Accès refusé");

  const [event, messages, photos, manage] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: { guestbookEnabled: true, photosEnabled: true },
    }),
    prisma.guestbookMessage.findMany({
      where: { eventId },
      include: AUTHOR,
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
    }),
    prisma.eventPhoto.findMany({
      where: { eventId },
      include: AUTHOR,
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
    }),
    canManage(eventId),
  ]);
  if (!event) throw new Error("Événement introuvable");

  return {
    canManage: manage,
    guestbookEnabled: event.guestbookEnabled,
    photosEnabled: event.photosEnabled,
    messages: messages.map((message) => messageView(message, null)),
    photos: photos.map((photo) => photoView(photo, null)),
  };
}

export async function updateMemoriesSettings(eventId, settings = {}) {
  await assertManage(eventId);
  const data = {};
  if (typeof settings.guestbookEnabled === "boolean") {
    data.guestbookEnabled = settings.guestbookEnabled;
  }
  if (typeof settings.photosEnabled === "boolean") {
    data.photosEnabled = settings.photosEnabled;
  }
  await prisma.event.update({ where: { id: eventId }, data });
  return { success: true };
}

export async function setMessageHidden(messageId, hidden) {
  const message = await prisma.guestbookMessage.findUnique({
    where: { id: String(messageId ?? "") },
    select: { id: true, eventId: true },
  });
  if (!message) throw new Error("Message introuvable");
  await assertManage(message.eventId);
  await prisma.guestbookMessage.update({
    where: { id: message.id },
    data: { hidden: Boolean(hidden) },
  });
  return { success: true };
}

export async function deleteMessage(messageId) {
  const message = await prisma.guestbookMessage.findUnique({
    where: { id: String(messageId ?? "") },
    select: { id: true, eventId: true },
  });
  if (!message) return { success: true };
  await assertManage(message.eventId);
  await prisma.guestbookMessage.delete({ where: { id: message.id } });
  return { success: true };
}

export async function setPhotoHidden(photoId, hidden) {
  const photo = await prisma.eventPhoto.findUnique({
    where: { id: String(photoId ?? "") },
    select: { id: true, eventId: true },
  });
  if (!photo) throw new Error("Photo introuvable");
  await assertManage(photo.eventId);
  await prisma.eventPhoto.update({
    where: { id: photo.id },
    data: { hidden: Boolean(hidden) },
  });
  return { success: true };
}

export async function deletePhoto(photoId) {
  const photo = await prisma.eventPhoto.findUnique({
    where: { id: String(photoId ?? "") },
    select: { id: true, eventId: true, url: true },
  });
  if (!photo) return { success: true };
  await assertManage(photo.eventId);
  await prisma.eventPhoto.delete({ where: { id: photo.id } });
  await removeBlob(photo.url);
  return { success: true };
}
