import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth/server";
import { getPublicTemplate } from "@/lib/landing/data";
import { getTemplateFeedback } from "@/lib/templates/feedback";
import { SITE_URL } from "@/lib/site";
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
 * Données structurées : le modèle, ses votes et son nombre de commentaires.
 */
function structuredData(t, template, feedback, locale) {
  const url = `${SITE_URL}/templates/${template.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#template`,
    url,
    name: template.name,
    description: t("public_template.meta_description").replace(
      "{name}",
      template.name,
    ),
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    commentCount: feedback.commentCount,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: feedback.likes,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/DislikeAction",
        userInteractionCount: feedback.dislikes,
      },
    ],
  };
}

/**
 * Page publique d'un modèle de la galerie, ouverte par un lien partagé
 * (voir ShareTemplateButton). Aucun compte n'est requis pour la voir ; il en
 * faut un pour voter ou commenter. Seuls les modèles publiés ou mis en
 * avant y sont visibles (getPublicTemplate).
 */
export default async function PublicTemplatePage({ params }) {
  const { id } = await params;
  const [template, session, { t, locale }] = await Promise.all([
    loadTemplate(id),
    auth.api.getSession({ headers: await headers() }),
    getTranslations(),
  ]);
  if (!template) notFound();

  // Un compte suspendu garde un cookie valide : il est traité comme déconnecté.
  const viewer =
    session?.user && !session.user.suspended
      ? { userId: session.user.id, role: session.user.role ?? "user" }
      : null;
  const feedback = await getTemplateFeedback(template.id, viewer);
  const look = templateLook(toEditableConfig(template.config));
  // `<` échappé : une chaîne « </script> » dans un texte fermerait la balise.
  const jsonLd = JSON.stringify(
    structuredData(t, template, feedback, locale),
  ).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <PublicTemplateView
        template={template}
        event={sampleEvent()}
        background={look.background ?? DEFAULT_BACKGROUND}
        categoryLabel={
          template.category
            ? t(`portal.templates.categories.${template.category}`)
            : null
        }
        feedback={feedback}
        isAuthenticated={Boolean(viewer)}
      />
    </>
  );
}
