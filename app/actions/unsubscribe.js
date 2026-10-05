"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

/**
 * Désabonnement et réabonnement depuis la page /unsubscribe, sans connexion :
 * le jeton signé du lien prouve à quel compte il appartient (voir
 * lib/email/unsubscribe.js). Seule la préférence des e-mails d'annonce
 * change ; les e-mails liés aux événements ne sont pas concernés.
 */
export async function updateSubscription(formData) {
  const token = String(formData.get("token") ?? "");
  const subscribe = formData.get("subscribe") === "1";

  const userId = verifyUnsubscribeToken(token);
  if (userId) {
    await prisma.user.updateMany({
      where: { id: userId },
      data: { marketingEmails: subscribe },
    });
  }

  redirect(`/unsubscribe?token=${encodeURIComponent(token)}&updated=1`);
}
