import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { getTicketByToken } from "@/app/actions/invitation";
import { eventDayLabel } from "@/lib/invitation/dates";
import { getTranslations } from "@/lib/i18n/server";
import TicketDocument from "@/lib/pdf/TicketDocument";
import { ticketQrPng } from "@/lib/qr";
import { formatTicketCode } from "@/lib/tickets";

/**
 * Billet d'un invité en PDF (A6), téléchargé depuis sa page de billet.
 *
 * Même accès que l'invitation : le jeton suffit. Un invité qui n'a pas
 * confirmé n'a pas de billet (404).
 */

/** Nom de fichier sans accents ni caractères spéciaux. */
function slugify(text) {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "event"
  );
}

export async function GET(request, { params }) {
  const { token } = await params;

  const ticket = await getTicketByToken(token);
  if (!ticket?.guest.ticketCode) return new Response("Not found", { status: 404 });

  const { guest, event } = ticket;
  const [{ t, locale }, qr, logo] = await Promise.all([
    getTranslations(),
    ticketQrPng(guest.ticketCode, 600),
    // Lotus doré sur fond transparent. Sans lui, le PDF reste valable.
    readFile(join(process.cwd(), "public", "apple-icon.png")).catch(() => null),
  ]);
  const k = (key) => t(`invite.ticket.${key}`);

  const buffer = await renderToBuffer(
    createElement(TicketDocument, {
      event: {
        title: event.title,
        when: [eventDayLabel(event.eventDate, locale), event.time]
          .filter(Boolean)
          .join(" · "),
        location: event.location,
        contactPhone: event.contactPhone,
      },
      guest: {
        name: guest.name,
        pass:
          guest.people > 1
            ? k("pass_other").replace("{count}", String(guest.people))
            : k("pass_one"),
        code: formatTicketCode(guest.ticketCode),
      },
      qr,
      logo,
      labels: {
        title: k("pdf_title"),
        codeLabel: k("code_label"),
        when: k("when"),
        where: k("where"),
        contact: k("contact"),
        footer: k("show_at_entrance"),
      },
      locale,
    }),
  );

  const filename = `${k("pdf_filename")}-${slugify(event.title)}.pdf`;
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
