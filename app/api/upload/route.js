import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import {
  IMAGE_TYPES,
  MAX_PHOTO_BYTES,
  MAX_POSTER_BYTES,
  MAX_VIDEO_BYTES,
  MEMORIES_PREFIX,
  POSTER_TYPE,
  VIDEO_TYPES,
  memoryPathKind,
} from "@/lib/media/memories";
import { MAX_PHOTOS_PER_GUEST, MAX_VIDEOS_PER_GUEST } from "@/lib/site";

/**
 * Upload direct navigateur → Vercel Blob pour les médias des invitations
 * (photos, musique d'ouverture) et les photos et vidéos partagées par les
 * invités.
 *
 * Le fichier ne transite pas par nos fonctions (limitées à 4,5 Mo de corps) :
 * cette route ne fait que délivrer un jeton d'upload signé, après avoir
 * vérifié qui envoie. Le type autorisé dépend du dossier demandé. Nécessite
 * la variable BLOB_READ_WRITE_TOKEN, d'un store **public**.
 *
 * - `invitations/…` : un utilisateur connecté (éditeur d'invitation) ;
 * - `memories/<eventId>/…` : un invité, identifié par le jeton de son
 *   invitation (`clientPayload`), si l'hôte a ouvert le partage de photos et
 *   que l'invité n'a pas atteint sa limite (voir lib/media/memories.js pour
 *   les sous-dossiers).
 */
const RULES = {
  "invitations/audio/": {
    allowedContentTypes: [
      "audio/mpeg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/aac",
      "audio/ogg",
      "audio/wav",
      "audio/webm",
    ],
    maximumSizeInBytes: 15 * 1024 * 1024,
  },
  "invitations/": {
    allowedContentTypes: IMAGE_TYPES,
    maximumSizeInBytes: MAX_PHOTO_BYTES,
  },
};

const MEMORY_RULES = {
  photo: { allowedContentTypes: IMAGE_TYPES, maximumSizeInBytes: MAX_PHOTO_BYTES },
  video: { allowedContentTypes: VIDEO_TYPES, maximumSizeInBytes: MAX_VIDEO_BYTES },
  poster: { allowedContentTypes: [POSTER_TYPE], maximumSizeInBytes: MAX_POSTER_BYTES },
};

/**
 * Invité autorisé à envoyer `pathname`, avec la nature du fichier, ou
 * erreur. Le jeton d'invitation arrive dans `clientPayload` (voir PhotoWall).
 *
 * Une fois la limite atteinte, plus rien ne passe, aperçus compris : l'aperçu
 * de la dernière vidéo autorisée part avant que sa ligne soit créée.
 */
async function guestUploader(pathname, clientPayload) {
  let token = null;
  try {
    token = JSON.parse(clientPayload ?? "null")?.token;
  } catch {
    // Charge illisible : traitée comme absente.
  }
  if (typeof token !== "string" || token.length > 64) throw new Error("Unauthorized");

  const guest = await prisma.guest.findUnique({
    where: { invitationToken: token },
    select: {
      id: true,
      eventId: true,
      event: { select: { photosEnabled: true } },
      _count: { select: { photos: true } },
    },
  });
  if (!guest) throw new Error("Unauthorized");
  if (!guest.event.photosEnabled) throw new Error("Partage de photos fermé");

  const kind = memoryPathKind(pathname, guest.eventId);
  if (!kind) throw new Error("Chemin d'upload invalide");
  if (guest._count.photos >= MAX_PHOTOS_PER_GUEST) {
    throw new Error("Limite de photos atteinte");
  }
  if (kind === "video") {
    const videos = await prisma.eventPhoto.count({
      where: { guestId: guest.id, kind: "video" },
    });
    if (videos >= MAX_VIDEOS_PER_GUEST) throw new Error("Limite de vidéos atteinte");
  }
  return { guest, kind };
}

export async function POST(request) {
  // Sans jeton, handleUpload échouerait avec un message obscur : on le dit
  // clairement dans les journaux. Côté éditeur, le collage d'un lien reste
  // possible.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "[Upload] BLOB_READ_WRITE_TOKEN manquant : l'import de fichiers est désactivé.",
    );
    return NextResponse.json(
      { error: "Import de fichiers non configuré" },
      { status: 503 },
    );
  }

  let body = null;
  try {
    body = await request.json();
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (pathname.startsWith(MEMORIES_PREFIX)) {
          const { guest, kind } = await guestUploader(pathname, clientPayload);
          return {
            ...MEMORY_RULES[kind],
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ guestId: guest.id }),
          };
        }

        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        // Le préfixe le plus précis d'abord (audio avant images).
        const prefix = Object.keys(RULES).find((key) =>
          pathname.startsWith(key),
        );
        if (!prefix) throw new Error("Chemin d'upload invalide");

        return {
          ...RULES[prefix],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.userId }),
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    // Le navigateur ne reçoit pas ce message (le SDK l'ignore) : il n'est
    // visible que dans les journaux.
    console.warn("[Upload] Refusé :", body?.payload?.pathname ?? "?", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
