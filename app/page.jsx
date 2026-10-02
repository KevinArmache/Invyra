import { headers } from "next/headers";

import { auth } from "@/lib/auth/server";
import {
  getBookedDates,
  getShowcaseTemplates,
  todayKey,
} from "@/lib/landing/data";
import { sampleEvent } from "@/lib/landing/sample-event";
import { getTranslations } from "@/lib/i18n/server";
import { CONTACT_EMAIL, INSTAGRAM_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import CategoryMarquee from "@/components/landing/CategoryMarquee";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import OpeningDemo from "@/components/landing/OpeningDemo";
import TemplatesShowcase from "@/components/landing/TemplatesShowcase";
import AvailabilityCalendar from "@/components/landing/AvailabilityCalendar";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

export async function generateMetadata() {
  const { t, locale } = await getTranslations();
  const title = t("landing.meta.title");
  const description = t("landing.meta.description");

  return {
    // Titre complet : le gabarit « %s · Invyra » doublerait le nom.
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url: "/",
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Données structurées : l'organisation, le site, l'application et sa FAQ.
 * Les offres reprennent les vraies limites et les vrais prix.
 */
function structuredData(t) {
  const faq = t("landing.faq.items");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        email: CONTACT_EMAIL,
        sameAs: [INSTAGRAM_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: t("landing.meta.description"),
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        description: t("landing.meta.description"),
        offers: [
          {
            "@type": "Offer",
            name: t("landing.pricing.plans.free.name"),
            price: "0",
            priceCurrency: "USD",
            description: t("landing.pricing.plans.free.features").join(", "),
          },
          {
            "@type": "Offer",
            name: t("landing.pricing.plans.pro.name"),
            price: "1",
            priceCurrency: "USD",
            description: t("landing.pricing.plans.pro.features").join(", "),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: (Array.isArray(faq) ? faq : []).map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
}

export default async function HomePage({ searchParams }) {
  // Page de la vitrine des modèles (?page=2). Le canonical reste « / » : ces
  // variantes ne comptent pas comme des pages distinctes.
  const { page } = await searchParams;

  // Lue sur le serveur : la barre s'affiche d'emblée dans le bon état, au lieu
  // de basculer de « Se connecter » à « Tableau de bord » après l'hydratation.
  const [session, showcase, bookedDates, { t }] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getShowcaseTemplates({ page }),
    getBookedDates(),
    getTranslations(),
  ]);

  const isAuthenticated = Boolean(session?.user);
  const hasShowcase = showcase.total > 0;
  // `<` échappé : une chaîne « </script> » dans un texte fermerait la balise.
  const jsonLd = JSON.stringify(structuredData(t)).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <Navbar isAuthenticated={isAuthenticated} hasShowcase={hasShowcase} />
      <main id="main">
        <HeroSection hasShowcase={hasShowcase} />
        <CategoryMarquee />
        <HowItWorksSection />
        <FeaturesSection />
        {showcase.first && <OpeningDemo template={showcase.first} />}
        <TemplatesShowcase
          templates={showcase.templates}
          page={showcase.page}
          pageCount={showcase.pageCount}
          sample={sampleEvent()}
        />
        <AvailabilityCalendar
          bookedDates={bookedDates}
          today={todayKey()}
          contactEmail={CONTACT_EMAIL}
        />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer isAuthenticated={isAuthenticated} hasShowcase={hasShowcase} />
    </>
  );
}
