import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import { canAccessEvent } from "@/app/actions/auth";
import { getTranslations } from "@/lib/i18n/server";
import GuestListDocument from "@/lib/pdf/GuestListDocument";
import { prisma } from "@/lib/prisma";

/**
 * Liste des invités d'un événement en PDF, téléchargée depuis l'onglet
 * « Invités » de sa fiche. `?status=confirmed` ne garde que les confirmés ;
 * le récapitulatif compte toujours tous les invités.
 *
 * Ouverte au propriétaire, aux collaborateurs (lecture seule comprise) et aux
 * admins. proxy.js ne vérifie que la présence du cookie de session : l'accès
 * à l'événement se contrôle ici.
 */

const RSVP_STATUSES = new Set(["confirmed", "declined", "maybe"]);

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
  const { id } = await params;
  const onlyConfirmed =
    new URL(request.url).searchParams.get("status") === "confirmed";

  if (!(await canAccessEvent(id))) {
    return new Response("Forbidden", { status: 403 });
  }

  const [event, guests, { t, locale }, logo] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      select: {
        title: true,
        eventDate: true,
        time: true,
        location: true,
        contactPhone: true,
      },
    }),
    prisma.guest.findMany({
      where: { eventId: id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        plusOne: true,
        rsvpStatus: true,
        dietaryRestrictions: true,
        notes: true,
      },
    }),
    getTranslations(),
    // Lotus doré sur fond transparent. Sans lui, le PDF reste valable.
    readFile(join(process.cwd(), "public", "apple-icon.png")).catch(() => null),
  ]);
  if (!event) return new Response("Not found", { status: 404 });

  const intl = locale === "fr" ? "fr-FR" : "en-US";
  const rows = guests
    .map((guest) => ({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      plusOne: guest.plusOne,
      status: RSVP_STATUSES.has(guest.rsvpStatus) ? guest.rsvpStatus : "pending",
      notes: [guest.dietaryRestrictions, guest.notes]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join(" · "),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, intl, { sensitivity: "base" }));

  // « Personnes attendues » : chaque confirmé, plus son accompagnant.
  const summary = { total: rows.length, confirmed: 0, declined: 0, maybe: 0, pending: 0, expected: 0 };
  for (const row of rows) {
    summary[row.status] += 1;
    if (row.status === "confirmed") summary.expected += row.plusOne ? 2 : 1;
  }

  // Lu en UTC : les dates d'événement sont enregistrées à minuit UTC.
  const dateLabel = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString(intl, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;
  const generatedOn = new Date().toLocaleDateString(intl, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const guestsKey = "portal.events.details.guests";
  const pdf = (key) => t(`${guestsKey}.export.pdf.${key}`);
  const labels = {
    title: pdf(onlyConfirmed ? "title_confirmed" : "title"),
    contact: pdf("contact"),
    columns: {
      name: pdf("columns.name"),
      email: pdf("columns.email"),
      phone: pdf("columns.phone"),
      status: pdf("columns.status"),
      notes: pdf("columns.notes"),
    },
    summary: {
      total: pdf("summary.total"),
      confirmed: pdf("summary.confirmed"),
      declined: pdf("summary.declined"),
      maybe: pdf("summary.maybe"),
      pending: pdf("summary.pending"),
      expected: pdf("summary.expected"),
    },
    // Mêmes libellés que les badges de la liste.
    status: {
      confirmed: t(`${guestsKey}.status.attending`),
      declined: t(`${guestsKey}.status.declined`),
      maybe: t(`${guestsKey}.status.maybe`),
      pending: t(`${guestsKey}.status.pending`),
    },
    generatedOn: pdf("generated_on").replace("{date}", generatedOn),
    page: pdf("page"),
    empty: pdf("empty"),
  };

  const buffer = await renderToBuffer(
    createElement(GuestListDocument, {
      event: {
        title: event.title,
        dateLabel: dateLabel && dateLabel[0].toUpperCase() + dateLabel.slice(1),
        time: event.time,
        location: event.location,
        contactPhone: event.contactPhone,
      },
      guests: onlyConfirmed
        ? rows.filter((row) => row.status === "confirmed")
        : rows,
      summary,
      labels,
      logo,
      locale,
    }),
  );

  const prefix = t(
    `${guestsKey}.export.${onlyConfirmed ? "filename_confirmed" : "filename"}`,
  );
  const filename = `${prefix}-${slugify(event.title)}.pdf`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
