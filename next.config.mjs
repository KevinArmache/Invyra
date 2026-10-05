/** @type {import('next').NextConfig} */
const nextConfig = {
  // `typescript.ignoreBuildErrors` a été retiré : la validation passe
  // désormais, et le garder n'aurait fait que masquer les régressions à venir.

  images: {
    // Optimiseur d'images de Next désactivé. À réactiver si le projet se met
    // à servir des images distantes en volume.
    unoptimized: true,
  },

  // Chrome sans interface des invitations en PDF (lib/pdf/browser.js) :
  // chargés tels quels depuis node_modules, sans passer par le bundler, qui
  // ne sait pas embarquer le binaire de Chromium.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Le binaire compressé de Chromium est lu par un chemin calculé à
  // l'exécution : le traçage des fichiers ne le voit pas sans cette liste.
  // Les clés sont des motifs (picomatch) : `*` plutôt que `[token]`, qui
  // serait lu comme une classe de caractères.
  outputFileTracingIncludes: {
    "/invite/*/pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/dashboard/events/*/invitation/pdf": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
  },
};

export default nextConfig;
