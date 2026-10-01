import { SITE_URL } from "@/lib/site";

/** Pages publiques à indexer. Les invitations sont personnelles : jamais ici. */
export default function sitemap() {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
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
