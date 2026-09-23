/** @type {import('next').NextConfig} */
const nextConfig = {
  // `typescript.ignoreBuildErrors` a été retiré : la validation passe
  // désormais, et le garder n'aurait fait que masquer les régressions à venir.

  images: {
    // Optimiseur d'images de Next désactivé. À réactiver si le projet se met
    // à servir des images distantes en volume.
    unoptimized: true,
  },
};

export default nextConfig;
