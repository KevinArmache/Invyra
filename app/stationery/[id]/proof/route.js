import { getPublicStationery } from "@/lib/landing/data";
import { normalizePrintConfig } from "@/lib/print/config";
import { renderPrintPdf } from "@/lib/print/render";
import { samplePrintEvent } from "@/lib/print/sample";
import { slugify } from "@/lib/pdf/filename";
import { linkQrSvg } from "@/lib/qr-svg";
import { getTranslations } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";

/**
 * Bon à tirer d'exemple d'un modèle papier public : les feuilles imposées,
 * à taille réelle, avec fond perdu, traits de coupe, bord fini et zone de
 * sécurité, sous un filigrane « BON À TIRER ». Le fichier HD sans filigrane
 * reste réservé à l'équipe (voir /dashboard/templates/[id]/print).
 *
 * Les données sont celles de l'exemple, identiques pour tout le monde : le
 * CDN garde le fichier une journée, Chrome ne tourne pas à chaque visite.
 */

// Lancement de Chrome, polices et photos du modèle : quelques secondes.
export const maxDuration = 60;

export async function GET(request, { params }) {
  const { id } = await params;
  const template = await getPublicStationery(id);
  const config = normalizePrintConfig(template?.config);
  if (!template || !config) return new Response("Not found", { status: 404 });

  const { t } = await getTranslations();
  let buffer;
  try {
    buffer = await renderPrintPdf({
      config,
      event: samplePrintEvent(template.category),
      recipients: [{ guestName: "", qr: await linkQrSvg(`${SITE_URL}/stationery/${template.id}`) }],
      mode: "proof",
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
    console.error("[stationery/proof] Génération impossible :", error);
    return new Response("PDF generation failed", { status: 500 });
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${t("stationery.proof_filename")}-${slugify(template.name)}.pdf"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
