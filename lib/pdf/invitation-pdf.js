import { isIP } from "node:net";

import { buildInvitationDocument } from "@/lib/invitation/document";
import { getBrowser } from "@/lib/pdf/browser";

/**
 * Invitation en PDF, fidèle à son modèle : le document de l'invitation
 * (lib/invitation/document.js, option `pdf`) est imprimé par Chrome sur une
 * seule page continue, à la largeur d'un téléphone, comme l'invitation qui
 * défile à l'écran.
 */

/** Écran reproduit par le PDF (px). */
const VIEWPORT = { width: 430, height: 932 };

/**
 * Hauteur de page maximale (px) : 200 pouces, au-delà desquels les lecteurs
 * PDF refusent ou tronquent la page. Une invitation plus longue est réduite.
 */
const MAX_PAGE_HEIGHT = 19200;

/** Attente maximale des polices et des photos du modèle (ms). */
const LOAD_TIMEOUT = 15000;
const FONTS_TIMEOUT = 5000;

const LOCAL_HOST = /^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i;

/**
 * Requêtes que le Chrome du serveur peut faire en chargeant l'invitation :
 * les ressources du modèle sur le web public (polices, photos, feuilles de
 * style), jamais une adresse interne. Le son et la vidéo sont inutiles dans
 * un PDF : ils ne sont pas téléchargés.
 */
function isAllowedRequest(url, resourceType) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (["data:", "blob:", "about:"].includes(parsed.protocol)) return true;
  if (resourceType === "media") return false;

  // En développement, les fichiers peuvent venir du serveur local.
  if (process.env.NODE_ENV !== "production") {
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  return !isIP(host) && !LOCAL_HOST.test(host);
}

/**
 * @param {object} options
 * @param {object} options.config     modèle de l'invitation (Template.config)
 * @param {object} options.event      événement (titre, date, lieu…)
 * @param {string} options.guestName  nom affiché à la place de {{GUEST_NAME}}
 * @returns {Promise<Uint8Array>} le fichier PDF
 */
export async function renderInvitationPdf({ config, event, guestName }) {
  const html = buildInvitationDocument({
    config,
    event,
    guestName,
    rsvpData: null,
    pdf: VIEWPORT,
  });

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ ...VIEWPORT, deviceScaleFactor: 1 });
    // Le modèle est rendu comme à l'écran : ses règles `screen` s'appliquent,
    // ses animations aussi (figées sur leur état final, voir FREEZE_CSS).
    await page.emulateMediaType("screen");
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "no-preference" },
    ]);

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.isInterceptResolutionHandled()) return;
      if (isAllowedRequest(request.url(), request.resourceType())) request.continue();
      else request.abort("blockedbyclient");
    });

    try {
      await page.setContent(html, {
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

    // Hauteur exacte (fractionnaire) arrondie au pixel supérieur : un pied
    // de page sombre ne doit pas laisser de liseré clair sous lui.
    const height = await page.evaluate(() =>
      Math.ceil(
        Math.max(
          document.documentElement.getBoundingClientRect().height,
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        ),
      ),
    );
    const scale = Math.max(0.1, Math.min(1, MAX_PAGE_HEIGHT / height));
    const size = { width: `${VIEWPORT.width * scale}px`, height: `${height * scale}px` };

    // Le format est donné deux fois. Les options de `page.pdf` fixent la
    // largeur sur laquelle Chrome évalue les media queries (sans elles, il
    // les évalue sur une page Letter et le modèle passe en mise en page
    // « bureau »). La règle `@page` fixe la page elle-même : sans elle,
    // Chrome réduit le contenu d'environ 1 % et laisse une bande vide sous
    // le pied de page.
    await page.addStyleTag({
      content: `@page { size: ${size.width} ${size.height}; margin: 0; }`,
    });

    // `pageRanges` écarte une éventuelle seconde page née d'un arrondi.
    return await page.pdf({
      ...size,
      preferCSSPageSize: true,
      scale,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: "1",
    });
  } finally {
    await page.close().catch(() => {});
  }
}
