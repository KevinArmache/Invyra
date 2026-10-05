import { canAccessEvent } from "@/app/actions/auth";
import { getTranslations } from "@/lib/i18n/server";
import { guestQrFor } from "@/lib/invitation/guest-qr";
import { slugify } from "@/lib/pdf/filename";
import { renderInvitationPdf } from "@/lib/pdf/invitation-pdf";
import { prisma } from "@/lib/prisma";

/**
 * Invitation d'un événement en PDF, fidèle au modèle, téléchargée depuis sa
 * fiche : version générique depuis l'aperçu du modèle (onglet « Aperçu »),
 * ou au nom d'un invité avec `?guest=<id>` (onglet « Invités »), avec son QR
 * code d'entrée. La version générique n'a pas de QR code.
 *
 * Ouverte au propriétaire, aux collaborateurs (lecture seule comprise) et aux
 * admins. proxy.js ne vérifie que la présence du cookie de session : l'accès
 * à l'événement se contrôle ici.
 */

// Lancement de Chrome, polices et photos du modèle : quelques secondes.
export const maxDuration = 60;

export async function GET(request, { params }) {
  const { id } = await params;
  const guestId = new URL(request.url).searchParams.get("guest");

  if (!(await canAccessEvent(id))) {
    return new Response("Forbidden", { status: 403 });
  }

  const [event, guest, { t }] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        eventDate: true,
        location: true,
        time: true,
        dressCode: true,
        contactPhone: true,
        customMessage: true,
        invitationTemplate: true,
        templateCopy: { select: { config: true } },
      },
    }),
    guestId
      ? prisma.guest.findFirst({
          where: { id: guestId, eventId: id },
          select: { id: true, name: true, ticketCode: true },
        })
      : null,
    getTranslations(),
  ]);

  const config = event?.templateCopy?.config || event?.invitationTemplate;
  if (!config || (guestId && !guest)) {
    return new Response("Not found", { status: 404 });
  }

  let buffer;
  try {
    buffer = await renderInvitationPdf({
      config,
      event,
      // Sans invité désigné, une formule qui convient à tous.
      guestName: guest?.name ?? t("portal.events.details.overview.pdf_guest"),
      guestQr: guest ? await guestQrFor(guest) : null,
    });
  } catch (error) {
    console.error("[invitation/pdf] Génération impossible :", error);
    return new Response("PDF generation failed", { status: 500 });
  }

  const guestPart = guest ? slugify(guest.name, "") : "";
  const filename = [t("invite.pdf_filename"), slugify(event.title), guestPart]
    .filter(Boolean)
    .join("-");
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
