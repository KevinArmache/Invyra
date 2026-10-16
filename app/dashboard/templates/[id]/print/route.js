import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { normalizePrintConfig } from "@/lib/print/config";
import { PRESS_SHEETS } from "@/lib/print/document";
import { renderPrintPdf } from "@/lib/print/render";
import { samplePrintEvent } from "@/lib/print/sample";
import { slugify } from "@/lib/pdf/filename";
import { linkQrSvg } from "@/lib/qr-svg";
import { getTranslations } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";

/**
 * Fichiers d'imprimerie d'un modèle papier de la galerie, réservés aux
 * admins (brouillons compris) :
 *
 *   ?mode=print|proof          fichier HD ou bon à tirer filigrané
 *   ?layout=single|a4|a3|sra3  carte seule, ou planche de plusieurs cartes
 *   ?layer=main|foil|emboss|spot-uv   calque (fichier HD seulement)
 *
 * Données d'exemple : le fichier montre le modèle, à taille réelle, tel que
 * l'imprimeur le recevra.
 */

export const maxDuration = 60;

const MODES = ["proof", "print"];
const LAYERS = ["main", "foil", "emboss", "spot-uv"];

export async function GET(request, { params }) {
  const session = await getSession();
  if (session?.role !== "admin") return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const template = await prisma.template.findFirst({
    where: { id, eventId: null, medium: "print" },
    select: { id: true, name: true, category: true, config: true },
  });
  const config = normalizePrintConfig(template?.config);
  if (!template || !config) return new Response("Not found", { status: 404 });

  const query = new URL(request.url).searchParams;
  const mode = MODES.includes(query.get("mode")) ? query.get("mode") : "print";
  const layout = PRESS_SHEETS[query.get("layout")] ? query.get("layout") : "single";
  const layer = LAYERS.includes(query.get("layer")) ? query.get("layer") : "main";

  const { t } = await getTranslations();
  let buffer;
  try {
    buffer = await renderPrintPdf({
      config,
      event: samplePrintEvent(template.category),
      recipients: [{ guestName: "", qr: await linkQrSvg(`${SITE_URL}/stationery/${template.id}`) }],
      mode,
      layout,
      layer,
      labels: {
        title: template.name,
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
    console.error("[templates/print] Génération impossible :", error);
    return new Response("PDF generation failed", { status: 500 });
  }

  const name = [slugify(template.name), mode, layout, layer !== "main" ? layer : null]
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
