import { cache } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { ChevronRight, Printer } from "lucide-react";

import { auth } from "@/lib/auth/server";
import { getStationeryCollection } from "@/lib/landing/data";
import { withVoteCounts } from "@/lib/templates/feedback";
import { linkQrSvg } from "@/lib/qr-svg";
import { getTranslations } from "@/lib/i18n/server";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import Navbar from "@/components/landing/Navbar";
import StationeryCollection from "@/components/stationery/StationeryCollection";
import PrintReadySection from "@/components/stationery/PrintReadySection";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

/** Première valeur d'un paramètre d'URL. */
function param(value) {
  return Array.isArray(value) ? value[0] : value;
}

/** Une seule lecture par requête, partagée entre métadonnées et page. */
const loadCollection = cache((category) => getStationeryCollection({ category }));

function collectionPath({ category }) {
  return category ? `/stationery?${new URLSearchParams({ category })}` : "/stationery";
}

function viewTitle(t, collection) {
  const parts = [t("stationery.meta_title")];
  if (collection.category) parts.unshift(t(`portal.templates.categories.${collection.category}`));
  return parts.join(" · ");
}

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  const [collection, { t, locale }] = await Promise.all([
    loadCollection(param(query.category)),
    getTranslations(),
  ]);

  const title = viewTitle(t, collection);
  const description = t("stationery.meta_description");
  const path = collectionPath(collection);
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: t("landing.meta.og_alt") };

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(collection.totalAll === 0 && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "fr" ? "fr_FR" : "en_US",
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

function structuredData(t, collection, locale) {
  const path = collectionPath(collection);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${path}#collection`,
        url: `${SITE_URL}${path}`,
        name: viewTitle(t, collection),
        description: t("stationery.meta_description"),
        inLanguage: locale === "fr" ? "fr-FR" : "en-US",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: collection.total,
          itemListElement: collection.templates.map((template, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/stationery/${template.id}`,
            name: template.name,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("templates_page.breadcrumb_home"), item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: t("stationery.breadcrumb"), item: `${SITE_URL}/stationery` },
        ],
      },
    ],
  };
}

/**
 * Collection publique des invitations papier : les coups de cœur papier
 * (étoile d'un admin), filtrables par catégorie, puis ce que contient le
 * fichier remis à l'imprimerie. Aucun compte n'est requis.
 */
export default async function StationeryPage({ searchParams }) {
  const query = await searchParams;
  const [session, collection, { t, locale }] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    loadCollection(param(query.category)),
    getTranslations(),
  ]);

  const isAuthenticated = Boolean(session?.user);
  const viewer =
    session?.user && !session.user.suspended
      ? { userId: session.user.id, role: session.user.role ?? "user" }
      : null;
  const [templates, qr] = await Promise.all([
    withVoteCounts(collection.templates, viewer),
    linkQrSvg(`${SITE_URL}/stationery`),
  ]);
  const hasCollection = collection.totalAll > 0;
  const countLabel = t(
    collection.total === 1 ? "stationery.count_one" : "stationery.count_other",
  ).replace("{count}", String(collection.total));
  const jsonLd = JSON.stringify(structuredData(t, collection, locale)).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Navbar isAuthenticated={isAuthenticated} hasShowcase hasStationery current="stationery" />
      <main id="main">
        <section
          aria-labelledby="stationery-collection-title"
          className="relative isolate overflow-hidden px-4 pt-28 pb-24 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36 lg:pb-28"
        >
          <div aria-hidden="true" className="grain pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]">
            <div
              className="animate-drift absolute -top-56 left-1/2 h-[34rem] w-[58rem] -translate-x-1/2 rounded-full opacity-70"
              style={{
                background:
                  "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in oklch, var(--gold) 14%, transparent), transparent 70%)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background" />
          </div>

          <div className="mx-auto max-w-7xl">
            <nav aria-label={t("templates_page.breadcrumb_label")} className="animate-rise flex justify-center">
              <ol className="flex items-center gap-1.5 text-xs text-ink-400">
                <li>
                  <Link href="/" className="transition-colors hover:text-gold">
                    {t("templates_page.breadcrumb_home")}
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="h-3 w-3" />
                </li>
                <li aria-current="page" className="text-ink-100">
                  {t("stationery.breadcrumb")}
                </li>
              </ol>
            </nav>

            <header className="mx-auto mt-8 max-w-3xl text-center">
              <p className="animate-rise eyebrow text-gold/80" style={{ "--rise-delay": "80ms" }}>
                {t("stationery.eyebrow")}
              </p>
              <h1
                id="stationery-collection-title"
                className="animate-rise mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl lg:text-6xl"
                style={{ "--rise-delay": "160ms" }}
              >
                {t("stationery.title")}
                <em className="text-gold-shimmer not-italic">{t("stationery.title_highlight")}</em>
              </h1>
              <hr
                className="rule-gold animate-draw-x mx-auto mt-7 w-24"
                style={{ "--rise-delay": "420ms", transformOrigin: "center" }}
              />
              <p
                className="animate-rise mt-7 text-lg leading-relaxed text-pretty text-ink-300"
                style={{ "--rise-delay": "300ms" }}
              >
                {t("stationery.subtitle")}
              </p>
              {hasCollection && (
                <p
                  className="animate-rise mt-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/5 px-3.5 py-1 text-xs text-gold"
                  style={{ "--rise-delay": "380ms" }}
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  {countLabel}
                </p>
              )}
            </header>

            <div className="mt-14">
              {hasCollection ? (
                <StationeryCollection
                  templates={templates}
                  category={collection.category ?? ""}
                  categories={collection.categories}
                  qr={qr}
                  isAuthenticated={Boolean(viewer)}
                />
              ) : (
                <div className="surface mx-auto max-w-lg rounded-xl px-6 py-14 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
                    <Printer className="h-5 w-5 text-gold" strokeWidth={1.6} />
                  </span>
                  <h2 className="mt-5 text-2xl text-ink-50">{t("stationery.empty_title")}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-pretty text-ink-300">
                    {t("stationery.empty_desc")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <PrintReadySection />
        <FinalCta />
      </main>
      <Footer isAuthenticated={isAuthenticated} hasShowcase hasCollection hasStationery />
    </>
  );
}
