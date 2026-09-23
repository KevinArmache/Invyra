import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

import { getSession } from "@/app/actions/auth";

/**
 * Upload direct navigateur → Vercel Blob pour les médias des invitations
 * (photos, musique d'ouverture).
 *
 * Le fichier ne transite pas par nos fonctions (limitées à 4,5 Mo de corps) :
 * cette route ne fait que délivrer un jeton d'upload signé, après avoir
 * vérifié la session. Le type autorisé dépend du dossier demandé. Nécessite
 * la variable BLOB_READ_WRITE_TOKEN.
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
    allowedContentTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
    ],
    maximumSizeInBytes: 5 * 1024 * 1024,
  },
};

export async function POST(request) {
  const body = await request.json();

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
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
