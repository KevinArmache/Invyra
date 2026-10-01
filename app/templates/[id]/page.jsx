import { cache } from "react";
import { notFound } from "next/navigation";

import { getPublicTemplate } from "@/lib/landing/data";
import { sampleEvent } from "@/lib/landing/sample-event";
import { getTranslations } from "@/lib/i18n/server";
import { toEditableConfig } from "@/lib/templates/validation";
import { templateLook } from "@/lib/templates/look";
import PublicTemplateView from "@/components/templates/PublicTemplateView";

/** Une seule lecture par requête, partagée entre métadonnées et page. */
const loadTemplate = cache(getPublicTemplate);

const DEFAULT_BACKGROUND = "#0a0a0a";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const [template, { t }] = await Promise.all([
    loadTemplate(id),
    getTranslations(),
  ]);
  if (!template) {
    return { title: t("notfound.meta_title"), robots: { index: false } };
  }

  const title = t("public_template.meta_title").replace("{name}", template.name);
  const description = t("public_template.meta_description").replace(
    "{name}",
    template.name,
  );
  // La photo principale du modèle fait l'aperçu du lien partagé ; sans
  // photo, l'image générale du site prend le relais.
  const { image } = templateLook(toEditableConfig(template.config));

  return {
    title,
    description,
    alternates: { canonical: `/templates/${template.id}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/templates/${template.id}`,
      ...(image && { images: [{ url: image, alt: template.name }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

/**
 * Page publique d'un modèle de la galerie, ouverte par un lien partagé
 * (voir ShareTemplateButton). Aucun compte n'est requis. Seuls les modèles
 * publiés ou mis en avant y sont visibles (getPublicTemplate).
 */
export default async function PublicTemplatePage({ params }) {
  const { id } = await params;
  const [template, { t }] = await Promise.all([
    loadTemplate(id),
    getTranslations(),
  ]);
  if (!template) notFound();

  const look = templateLook(toEditableConfig(template.config));

  return (
    <PublicTemplateView
      template={template}
      event={sampleEvent()}
      background={look.background ?? DEFAULT_BACKGROUND}
      categoryLabel={
        template.category
          ? t(`portal.templates.categories.${template.category}`)
          : null
      }
    />
  );
}
