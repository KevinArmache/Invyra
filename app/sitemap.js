import { getPublicTemplateIds } from "@/lib/landing/data";
import { SITE_URL } from "@/lib/site";

/** Relu toutes les heures : un modèle publié y apparaît sans redéploiement. */
export const revalidate = 3600;

/**
 * Pages publiques à indexer : l'accueil, l'inscription, la connexion et la
 * page de chaque modèle publié. Les invitations sont personnelles : jamais
 * ici.
 */
export default async function sitemap() {
  const lastModified = new Date();
  const templates = await getPublicTemplateIds();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...templates.map((template) => ({
      url: `${SITE_URL}/templates/${template.id}`,
      lastModified: template.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/register`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
