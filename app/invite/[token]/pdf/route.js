import { getInvitationByToken } from "@/app/actions/invitation";
import { getTranslations } from "@/lib/i18n/server";
import { slugify } from "@/lib/pdf/filename";
import { renderInvitationPdf } from "@/lib/pdf/invitation-pdf";

/**
 * Invitation d'un invité en PDF, à son nom et fidèle au modèle, téléchargée
 * depuis la barre de l'invité (GuestBar).
 *
 * Même accès que l'invitation : le jeton suffit. Le téléchargement ne compte
 * pas comme une ouverture (`markViewed: false`) : l'invité a déjà ouvert son
 * invitation pour atteindre le bouton.
 */

// Lancement de Chrome, polices et photos du modèle : quelques secondes.
export const maxDuration = 60;

export async function GET(request, { params }) {
  const { token } = await params;

  const invitation = await getInvitationByToken(token, { markViewed: false });
  const config = invitation?.event.invitationTemplate;
  if (!config) return new Response("Not found", { status: 404 });

  const { guest, event } = invitation;
  let buffer;
  try {
    buffer = await renderInvitationPdf({ config, event, guestName: guest.name });
  } catch (error) {
    console.error("[invite/pdf] Génération impossible :", error);
    return new Response("PDF generation failed", { status: 500 });
  }

  const { t } = await getTranslations();
  const filename = `${t("invite.pdf_filename")}-${slugify(event.title)}.pdf`;
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
