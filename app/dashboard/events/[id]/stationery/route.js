import { prisma } from "@/lib/prisma";
import { canAccessEvent, getSession } from "@/app/actions/auth";
import { PUBLIC_TEMPLATE_WHERE } from "@/lib/landing/data";
import { invitationPhotos, normalizePrintConfig, withPhotos } from "@/lib/print/config";
import { PRESS_SHEETS } from "@/lib/print/document";
import { renderPrintPdf } from "@/lib/print/render";
import { publicLinkUrl } from "@/lib/guests/public-link";
import { slugify } from "@/lib/pdf/filename";
import { linkQrSvg } from "@/lib/qr-svg";
import { getTranslations } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";

/**
 * Invitation papier d'un événement, en PDF : le modèle choisi rempli avec
 * les informations de l'événement et les photos de son invitation en ligne.
 *
 *   ?template=<id>              modèle papier (publié, ou tout modèle pour un admin)
 *   ?mode=proof|print           bon à tirer filigrané, ou fichier HD de l'imprimeur
 *   ?named=1                    une carte par invité, à son nom, avec son QR
 *                               personnel ; sinon une carte pour tous, avec le
 *                               QR du lien unique s'il est actif
 *   ?layout=single|a4|a3|sra3   carte seule ou planche (fichier HD)
 *   ?layer=main|foil|emboss|spot-uv
 *   ?part=<n>                   lot de 100 cartes nominatives (fichier HD)
 *
 * Le bon à tirer est ouvert à l'équipe de l'événement ; le fichier HD est
 * réservé aux admins : Invyra imprime.
 */

export const maxDuration = 60;

const MODES = ["proof", "print"];
const LAYERS = ["main", "foil", "emboss", "spot-uv"];
/** Cartes nominatives par fichier, pour tenir dans le temps d'une fonction. */
const PART_SIZE = 100;
/** Cartes nominatives montrées dans un bon à tirer. */
const PROOF_SAMPLE = 3;

export async function GET(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !(await canAccessEvent(id))) return new Response("Forbidden", { status: 403 });
  const isAdmin = session.role === "admin";

  const query = new URL(request.url).searchParams;
  const mode = MODES.includes(query.get("mode")) ? query.get("mode") : "proof";
  if (mode === "print" && !isAdmin) return new Response("Forbidden", { status: 403 });
  const layout = mode === "print" && PRESS_SHEETS[query.get("layout")] ? query.get("layout") : "single";
  const layer = mode === "print" && LAYERS.includes(query.get("layer")) ? query.get("layer") : "main";
  const named = query.get("named") === "1";
  const part = Math.max(1, Math.trunc(Number(query.get("part"))) || 1);

  const templateId = String(query.get("template") ?? "");
  const [template, event] = await Promise.all([
    prisma.template.findFirst({
      where: isAdmin
        ? { id: templateId, eventId: null, medium: "print" }
        : { id: templateId, ...PUBLIC_TEMPLATE_WHERE, medium: "print" },
      select: { id: true, name: true, config: true },
    }),
    prisma.event.findUnique({
      where: { id },
      include: { templateCopy: { select: { config: true } } },
    }),
  ]);
  const base = normalizePrintConfig(template?.config);
  if (!template || !base || !event) return new Response("Not found", { status: 404 });

  // Les photos choisies pour l'invitation en ligne prennent les cadres du modèle.
  const config = withPhotos(
    base,
    invitationPhotos(event.templateCopy?.config || event.invitationTemplate),
  );

  let recipients;
  if (named) {
    const guests = await prisma.guest.findMany({
      where: { eventId: id },
      orderBy: { name: "asc" },
      select: { name: true, invitationToken: true },
      ...(mode === "proof"
        ? { take: PROOF_SAMPLE }
        : { skip: (part - 1) * PART_SIZE, take: PART_SIZE }),
    });
    if (guests.length === 0) return new Response("No guests", { status: 404 });
    recipients = await Promise.all(
      guests.map(async (guest) => ({
        guestName: guest.name,
        qr: await linkQrSvg(`${SITE_URL}/invite/${guest.invitationToken}`),
      })),
    );
  } else {
    const url = event.publicLinkEnabled ? publicLinkUrl(event.publicToken) : null;
    recipients = [{ guestName: "", qr: url ? await linkQrSvg(url) : null }];
  }

  const { t } = await getTranslations();
  let buffer;
  try {
    buffer = await renderPrintPdf({
      config,
      event: {
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
        location: event.location,
        time: event.time,
        dressCode: event.dressCode,
        contactPhone: event.contactPhone,
        customMessage: event.customMessage,
      },
      recipients,
      mode,
      layout,
      layer,
      labels: {
        title: `${event.title} · ${template.name}`,
        watermark: t("stationery.watermark"),
        sides: {
          recto: t("stationery.sides.recto"),
          verso: t("stationery.sides.verso"),
          outside: t("stationery.sides.outside"),
          inside: t("stationery.sides.inside"),
        },
      },
    });
  } catch (error) {
    console.error("[events/stationery] Génération impossible :", error);
    return new Response("PDF generation failed", { status: 500 });
  }

  const name = [
    slugify(event.title),
    slugify(template.name),
    mode === "proof" ? t("stationery.proof_filename") : layout,
    named ? `noms${mode === "print" ? `-${part}` : ""}` : null,
    layer !== "main" ? layer : null,
  ]
    .filter(Boolean)
    .join("-");
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
