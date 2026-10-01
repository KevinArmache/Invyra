import { SITE_URL } from "@/lib/site";

/**
 * L'espace connecté, l'administration et l'API ne sont pas à explorer.
 *
 * Les pages d'invitation (/invite/…) ne sont volontairement pas bloquées
 * ici : elles portent déjà `noindex`, qu'un robot ne peut lire que s'il a le
 * droit de les ouvrir, et certains réseaux respectent robots.txt pour
 * construire l'aperçu d'un lien partagé.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: new URL(SITE_URL).host,
  };
}
