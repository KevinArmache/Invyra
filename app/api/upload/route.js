import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { MAX_PHOTOS_PER_GUEST } from "@/lib/site";

/**
 * Upload direct navigateur → Vercel Blob pour les médias des invitations
 * (photos, musique d'ouverture) et les photos partagées par les invités.
 *
 * Le fichier ne transite pas par nos fonctions (limitées à 4,5 Mo de corps) :
 * cette route ne fait que délivrer un jeton d'upload signé, après avoir
 * vérifié qui envoie. Le type autorisé dépend du dossier demandé. Nécessite
 * la variable BLOB_READ_WRITE_TOKEN.
 *
 * - `invitations/…` : un utilisateur connecté (éditeur d'invitation) ;
 * - `memories/<eventId>/…` : un invité, identifié par le jeton de son
 *   invitation (`clientPayload`), si l'hôte a ouvert le partage de photos et
 *   que l'invité n'a pas atteint sa limite.
 */
const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const MEMORIES_PREFIX = "memories/";

const RULES = {
  [MEMORIES_PREFIX]: {
    allowedContentTypes: IMAGE_TYPES,
    maximumSizeInBytes: 5 * 1024 * 1024,
  },
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
    maximumSizeInBytes: 5 * 1024 * 1024,
  },
};

/**
 * Invité autorisé à envoyer une photo dans `pathname`, ou erreur. Le jeton
 * d'invitation arrive dans `clientPayload` (voir PhotoUploader).
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
  if (!pathname.startsWith(`${MEMORIES_PREFIX}${guest.eventId}/`)) {
    throw new Error("Chemin d'upload invalide");
  }
  if (guest._count.photos >= MAX_PHOTOS_PER_GUEST) {
    throw new Error("Limite de photos atteinte");
  }
  return guest;
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

  const body = await request.json();

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (pathname.startsWith(MEMORIES_PREFIX)) {
          const guest = await guestUploader(pathname, clientPayload);
          return {
            ...RULES[MEMORIES_PREFIX],
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
