import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth/server";
import { getPublicStationery } from "@/lib/landing/data";
import { getTemplateVotes } from "@/lib/templates/feedback";
import { normalizePrintConfig, printTemplateImage } from "@/lib/print/config";
import { samplePrintEvent } from "@/lib/print/sample";
import { linkQrSvg } from "@/lib/qr-svg";
import { getTranslations } from "@/lib/i18n/server";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import Navbar from "@/components/landing/Navbar";
import StationeryStudio from "@/components/stationery/StationeryStudio";
import PrintReadySection from "@/components/stationery/PrintReadySection";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

/**
 * Modèle papier public, prêt pour la page : configuration normalisée, ou
 * null s'il n'existe pas, n'est pas public ou n'est pas lisible.
 */
const loadTemplate = cache(async (id) => {
  const template = await getPublicStationery(id);
  const config = normalizePrintConfig(template?.config);
  return template && config ? { ...template, config } : null;
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  const [template, { t, locale }] = await Promise.all([loadTemplate(id), getTranslations()]);
  if (!template) return { title: t("notfound.meta_title"), robots: { index: false } };

  const title = t("stationery.template_meta_title").replace("{name}", template.name);
  const description = t("stationery.template_meta_description").replace("{name}", template.name);
  const image = printTemplateImage(template.config);
  const path = `/stationery/${template.id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "fr" ? "fr_FR" : "en_US",
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

function structuredData(t, template, votes, locale) {
  const url = `${SITE_URL}/stationery/${template.id}`;
  const image = printTemplateImage(template.config);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#template`,
        url,
        name: template.name,
        description: t("stationery.template_meta_description").replace("{name}", template.name),
        inLanguage: locale === "fr" ? "fr-FR" : "en-US",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        ...(image && { image }),
        interactionStatistic: [
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/LikeAction",
            userInteractionCount: votes.likes,
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("templates_page.breadcrumb_home"), item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: t("stationery.breadcrumb"), item: `${SITE_URL}/stationery` },
          { "@type": "ListItem", position: 3, name: template.name, item: url },
        ],
      },
    ],
  };
}

/**
 * Page publique d'une invitation papier : maquette 3D, papiers, format,
 * bon à tirer et demande d'impression. Aucun compte n'est requis pour la
 * voir ; il en faut un pour voter.
 */
export default async function StationeryTemplatePage({ params }) {
  const { id } = await params;
  const [template, session, { t, locale }] = await Promise.all([
    loadTemplate(id),
    auth.api.getSession({ headers: await headers() }),
    getTranslations(),
  ]);
  if (!template) notFound();

  const viewer =
    session?.user && !session.user.suspended
      ? { userId: session.user.id, role: session.user.role ?? "user" }
      : null;
  const [votes, qr] = await Promise.all([
    getTemplateVotes(template.id, viewer),
    linkQrSvg(`${SITE_URL}/stationery/${template.id}`),
  ]);
  const jsonLd = JSON.stringify(structuredData(t, template, votes, locale)).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Navbar isAuthenticated={Boolean(session?.user)} hasShowcase hasStationery current="stationery" />
      <main id="main">
        <StationeryStudio
          template={{ id: template.id, name: template.name, category: template.category, config: template.config }}
          event={samplePrintEvent(template.category)}
          qr={qr}
          votes={{ likes: votes.likes, dislikes: votes.dislikes, myVote: votes.myVote }}
          isAuthenticated={Boolean(viewer)}
          categoryLabel={template.category ? t(`portal.templates.categories.${template.category}`) : null}
          pageUrl={`${SITE_URL}/stationery/${template.id}`}
        />
        <PrintReadySection />
        <FinalCta />
      </main>
      <Footer isAuthenticated={Boolean(session?.user)} hasShowcase hasCollection hasStationery />
    </>
  );
}
