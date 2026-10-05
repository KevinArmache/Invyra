import { existsSync } from "node:fs";
import { join } from "node:path";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

/**
 * Chrome sans interface, pour imprimer les invitations en PDF (voir
 * invitation-pdf.js).
 *
 * Sur Vercel, Chromium vient de @sparticuz/chromium, compilé pour les
 * fonctions serverless. Ailleurs (développement), on prend le Chrome ou
 * l'Edge installé sur la machine, ou celui désigné par CHROME_EXECUTABLE_PATH.
 *
 * L'import de @sparticuz/chromium est statique : c'est ce qui fait embarquer
 * le paquet et ses dépendances dans la fonction Vercel. Son binaire, lui, est
 * ajouté par `outputFileTracingIncludes` (next.config.mjs). Hors de Vercel,
 * l'import ne fait rien.
 *
 * Le navigateur est lancé une fois puis réutilisé par les requêtes suivantes
 * de la même instance : chaque PDF n'ouvre qu'un onglet. Il est relancé s'il
 * s'est fermé entre-temps.
 */

/** Emplacements habituels d'un navigateur Chromium, par système. */
function localCandidates() {
  if (process.platform === "win32") {
    const roots = [
      process.env.PROGRAMFILES,
      process.env["PROGRAMFILES(X86)"],
      process.env.LOCALAPPDATA,
    ].filter(Boolean);
    return roots.flatMap((root) => [
      join(root, "Google", "Chrome", "Application", "chrome.exe"),
      join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
    ]);
  }
  if (process.platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
  }
  return [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ];
}

function isServerless() {
  return (
    process.platform === "linux" &&
    Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
  );
}

async function launch() {
  const override = process.env.CHROME_EXECUTABLE_PATH;

  if (!override && isServerless()) {
    // Pas de WebGL : les scripts des modèles ne tournent pas dans un PDF.
    chromium.setGraphicsMode = false;
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
  }

  const executablePath = override || localCandidates().find((path) => existsSync(path));
  if (!executablePath) {
    throw new Error(
      "Aucun Chrome trouvé pour générer le PDF : installez Chrome ou renseignez CHROME_EXECUTABLE_PATH.",
    );
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-first-run", "--no-default-browser-check", "--hide-scrollbars"],
  });
}

/**
 * En développement, le module est réévalué à chaque modification : la
 * promesse vit sur `globalThis` pour ne pas laisser un Chrome orphelin à
 * chaque rechargement.
 */
const store = globalThis;

/** @returns {Promise<import("puppeteer-core").Browser>} */
export function getBrowser() {
  if (!store.__invyraPdfBrowser) {
    store.__invyraPdfBrowser = launch().then(
      (browser) => {
        browser.on("disconnected", () => {
          store.__invyraPdfBrowser = null;
        });
        return browser;
      },
      (error) => {
        // Un échec de lancement ne doit pas bloquer les essais suivants.
        store.__invyraPdfBrowser = null;
        throw error;
      },
    );
  }
  return store.__invyraPdfBrowser;
}
