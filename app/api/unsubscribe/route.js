import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

/**
 * Désabonnement en un clic (RFC 8058) : la messagerie (Gmail, Yahoo, Apple
 * Mail) affiche son propre bouton « Se désabonner » et appelle cette adresse
 * en POST, sans ouvrir de page. L'adresse vient de l'en-tête
 * List-Unsubscribe des e-mails d'annonce (voir lib/email/unsubscribe.js).
 */
export async function POST(request) {
  const token = new URL(request.url).searchParams.get("token");
  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Lien de désabonnement invalide" }, { status: 400 });
  }

  await prisma.user.updateMany({
    where: { id: userId },
    data: { marketingEmails: false },
  });
  return NextResponse.json({ success: true });
}

/**
 * Une messagerie qui ouvre l'adresse comme un lien : la page de
 * désabonnement, où la personne confirme. Un simple GET ne désabonne pas,
 * les antivirus de messagerie ouvrent les liens d'eux-mêmes.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  return NextResponse.redirect(
    new URL(`/unsubscribe?token=${encodeURIComponent(token)}`, url.origin),
    303,
  );
}
