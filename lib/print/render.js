import "server-only";

import { getBrowser } from "@/lib/pdf/browser";
import { isAllowedRequest } from "@/lib/pdf/invitation-pdf";
import { buildPrintDocument } from "@/lib/print/document";

/**
 * PDF d'une invitation papier : les feuilles imposées de lib/print/document.js
 * imprimées par Chrome à leur taille réelle, en millimètres, fond perdu et
 * traits de coupe compris.
 *
 * Chrome produit un PDF en RVB, que les imprimeurs numériques acceptent
 * tel quel ; pour l'offset, la conversion en CMJN se fait chez l'imprimeur.
 */

/** Attente maximale des polices et des photos du modèle (ms). */
const LOAD_TIMEOUT = 20000;
const FONTS_TIMEOUT = 6000;

/**
 * @param {Parameters<typeof buildPrintDocument>[0]} options
 * @returns {Promise<Uint8Array>} le fichier PDF
 * @throws si le modèle n'a pas de pièce imprimable
 */
export async function renderPrintPdf(options) {
  const printDocument = buildPrintDocument(options);
  if (!printDocument) throw new Error("Modèle papier introuvable ou incomplet");

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.isInterceptResolutionHandled()) return;
      if (isAllowedRequest(request.url(), request.resourceType())) request.continue();
      else request.abort("blockedbyclient");
    });

    try {
      await page.setContent(printDocument.html, {
        waitUntil: ["load", "networkidle0"],
        timeout: LOAD_TIMEOUT,
      });
    } catch (error) {
      // Une photo trop lente ne doit pas empêcher le PDF : on imprime ce
      // qui est chargé.
      if (error?.name !== "TimeoutError") throw error;
    }
    await page.evaluate(
      (timeout) =>
        Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, timeout)),
        ]).then(() => true),
      FONTS_TIMEOUT,
    );

    const { width, height } = printDocument.pageSize;
    return await page.pdf({
      width: `${width}mm`,
      height: `${height}mm`,
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await page.close().catch(() => {});
  }
}
