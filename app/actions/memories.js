"use server";

import { del } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import {
  canAccessEvent,
  getSession,
  isEventOwnerOrAdmin,
} from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";
import { memoryPathKind } from "@/lib/media/memories";
import {
  MAX_MESSAGES_PER_GUEST,
  MAX_PHOTOS_PER_GUEST,
  MAX_VIDEOS_PER_GUEST,
} from "@/lib/site";

/**
 * Souvenirs d'un événement : le livre d'or et les photos et vidéos des
 * invités (modèle EventPhoto, `kind` = "photo" | "video").
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
    kind: photo.kind === "video" ? "video" : "photo",
    posterUrl: photo.posterUrl,
    duration: photo.duration,
    width: photo.width,
    height: photo.height,
    name: photo.guest.name,
    createdAt: photo.createdAt,
    hidden: photo.hidden,
    mine: photo.guestId === viewerId,
  };
}

/**
 * Supprime des fichiers de Vercel Blob, sans bloquer si c'est impossible.
 *
 * Le jeton est passé explicitement : sur Vercel, le SDK préférerait sinon
 * l'authentification OIDC du store désigné par BLOB_STORE_ID, qui peut ne
 * pas être celui des uploads.
 */
async function removeBlob(...urls) {
  const targets = urls.filter(Boolean);
  if (!process.env.BLOB_READ_WRITE_TOKEN || targets.length === 0) return;
  try {
    await del(targets, { token: process.env.BLOB_READ_WRITE_TOKEN });
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

  const [messages, photos, myPhotos, myVideos] = await Promise.all([
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
    prisma.eventPhoto.count({ where: { guestId: guest.id, kind: "video" } }),
  ]);

  return {
    guest: { name: guest.name, photoCount: myPhotos, videoCount: myVideos },
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

/** Adresse d'un fichier de l'événement sur Vercel Blob, ou null. */
function blobUrl(value, eventId) {
  let parsed;
  try {
    parsed = new URL(String(value ?? ""));
  } catch {
    return null;
  }
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname.endsWith(".public.blob.vercel-storage.com")
  ) {
    return null;
  }
  const path = decodeURIComponent(parsed.pathname).slice(1);
  const kind = memoryPathKind(path, eventId);
  return kind ? { href: parsed.href, hostname: parsed.hostname, path, kind } : null;
}

/**
 * Enregistre une photo ou une vidéo que l'invité vient d'envoyer sur Vercel
 * Blob (voir app/api/upload/route.js). Le fichier doit être dans le dossier
 * de l'événement, sur le stockage Blob : une adresse quelconque est refusée.
 * La nature (photo ou vidéo) se lit dans le chemin, pas dans la requête.
 *
 * Renvoie `{ photo }`, ou `{ error }` avec un code ("closed", "limit",
 * "video_limit", "invalid") : en production, le message d'une erreur levée
 * n'arrive pas au navigateur. Un fichier refusé est supprimé du stockage.
 */
export async function addEventPhoto(
  token,
  { url, pathname, width, height, duration, posterUrl } = {},
) {
  const guest = await findGuest(token);
  if (!guest) return { error: "invalid" };

  const media = blobUrl(url, guest.eventId);
  const valid =
    media &&
    (media.kind === "photo" || media.kind === "video") &&
    media.path === String(pathname ?? "");
  if (!valid) return { error: "invalid" };

  const isVideo = media.kind === "video";
  // Un aperçu n'est gardé que s'il vient du même store, dans le bon dossier.
  const poster = isVideo ? blobUrl(posterUrl, guest.eventId) : null;
  const posterHref =
    poster?.kind === "poster" && poster.hostname === media.hostname ? poster.href : null;

  async function refuse(error) {
    await removeBlob(media.href, posterHref);
    return { error };
  }

  if (!guest.event.photosEnabled) return refuse("closed");
  const count = await prisma.eventPhoto.count({ where: { guestId: guest.id } });
  if (count >= MAX_PHOTOS_PER_GUEST) return refuse("limit");
  if (isVideo) {
    const videos = await prisma.eventPhoto.count({
      where: { guestId: guest.id, kind: "video" },
    });
    if (videos >= MAX_VIDEOS_PER_GUEST) return refuse("video_limit");
  }

  const bounded = (value, max) => {
    const number = Math.round(Number(value));
    return Number.isFinite(number) && number > 0 && number <= max ? number : null;
  };

  const photo = await prisma.eventPhoto.create({
    data: {
      eventId: guest.eventId,
      guestId: guest.id,
      url: media.href,
      pathname: media.path,
      kind: media.kind,
      posterUrl: posterHref,
      duration: isVideo ? bounded(duration, 6 * 60 * 60) : null,
      width: bounded(width, 20_000),
      height: bounded(height, 20_000),
    },
    include: AUTHOR,
  });
  return { photo: photoView(photo, guest.id) };
}

export async function deleteMyPhoto(token, photoId) {
  const guest = await requireGuest(token);
  const photo = await prisma.eventPhoto.findFirst({
    where: { id: String(photoId ?? ""), guestId: guest.id },
    select: { id: true, url: true, posterUrl: true },
  });
  if (!photo) return { success: true };

  await prisma.eventPhoto.delete({ where: { id: photo.id } });
  await removeBlob(photo.url, photo.posterUrl);
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
    select: { id: true, eventId: true, url: true, posterUrl: true },
  });
  if (!photo) return { success: true };
  await assertManage(photo.eventId);
  await prisma.eventPhoto.delete({ where: { id: photo.id } });
  await removeBlob(photo.url, photo.posterUrl);
  return { success: true };
}
