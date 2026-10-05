import { cache } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, ChevronRight, LayoutTemplate } from "lucide-react";

import { auth } from "@/lib/auth/server";
import {
  COLLECTION_PAGE_SIZE,
  getCollectionTemplates,
} from "@/lib/landing/data";
import { sampleEvent } from "@/lib/landing/sample-event";
import { withVoteCounts } from "@/lib/templates/feedback";
import { getTranslations } from "@/lib/i18n/server";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import TemplatesCollection from "@/components/landing/TemplatesCollection";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

/** Première valeur d'un paramètre d'URL (?page=2&page=3 → "2"). */
function param(value) {
  return Array.isArray(value) ? value[0] : value;
}

/** Une seule lecture par requête, partagée entre métadonnées et page. */
const loadCollection = cache((page, category) =>
  getCollectionTemplates({ page, category }),
);

/** Chemin canonique de la vue : la page 1 sans filtre est « /templates ». */
function collectionPath({ page, category }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/templates?${search}` : "/templates";
}

/** Titre de la vue : catégorie, puis numéro de page au-delà de la première. */
function viewTitle(t, collection) {
  const parts = [t("templates_page.meta_title")];
  if (collection.category) {
    parts.unshift(t(`portal.templates.categories.${collection.category}`));
  }
  if (collection.page > 1) {
    parts.push(
      t("templates_page.page_suffix").replace("{n}", String(collection.page)),
    );
  }
  return parts.join(" · ");
}

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  const [collection, { t, locale }] = await Promise.all([
    loadCollection(param(query.page), param(query.category)),
    getTranslations(),
  ]);

  const title = viewTitle(t, collection);
  const description = t("templates_page.meta_description");
  const path = collectionPath(collection);
  // L'image générale du site (app/opengraph-image.jsx) : celle du fichier ne
  // s'applique qu'à l'accueil, une page qui définit openGraph la perd.
  const image = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: t("landing.meta.og_alt"),
  };

  return {
    title,
    description,
    alternates: { canonical: path },
    // Une collection vide n'a rien à proposer aux moteurs de recherche.
    ...(collection.totalAll === 0 && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "fr" ? "fr_FR" : "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Données structurées : la collection, les modèles de la page affichée et
 * le fil d'Ariane.
 */
function structuredData(t, collection, locale) {
  const path = collectionPath(collection);
  const offset = (collection.page - 1) * COLLECTION_PAGE_SIZE;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${path}#collection`,
        url: `${SITE_URL}${path}`,
        name: viewTitle(t, collection),
        description: t("templates_page.meta_description"),
        inLanguage: locale === "fr" ? "fr-FR" : "en-US",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: collection.total,
          itemListElement: collection.templates.map((template, index) => ({
            "@type": "ListItem",
            position: offset + index + 1,
            url: `${SITE_URL}/templates/${template.id}`,
            name: template.name,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("templates_page.breadcrumb_home"),
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: t("templates_page.breadcrumb_current"),
            item: `${SITE_URL}/templates`,
          },
        ],
      },
    ],
  };
}

/**
 * Collection publique des modèles mis en avant par un admin (étoile dans
 * /dashboard/templates), paginée et filtrable par catégorie. Aucun compte
 * n'est requis.
 */
export default async function TemplatesCollectionPage({ searchParams }) {
  const query = await searchParams;
  const [session, collection, { t, locale }] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    loadCollection(param(query.page), param(query.category)),
    getTranslations(),
  ]);

  const isAuthenticated = Boolean(session?.user);
  // Un compte suspendu garde un cookie valide : il ne vote pas.
  const viewer =
    session?.user && !session.user.suspended
      ? { userId: session.user.id, role: session.user.role ?? "user" }
      : null;
  const templates = await withVoteCounts(collection.templates, viewer);
  const hasCollection = collection.totalAll > 0;
  const countLabel = t(
    collection.total === 1
      ? "templates_page.count_one"
      : "templates_page.count_other",
  ).replace("{count}", String(collection.total));
  // `<` échappé : une chaîne « </script> » dans un texte fermerait la balise.
  const jsonLd = JSON.stringify(
    structuredData(t, collection, locale),
  ).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <Navbar
        isAuthenticated={isAuthenticated}
        hasShowcase
        current="templates"
      />
      <main id="main">
        <section
          aria-labelledby="collection-title"
          className="relative isolate overflow-hidden px-4 pt-28 pb-24 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36 lg:pb-32"
        >
          {/* Fond : le halo doré du héros de l'accueil, qui dérive. */}
          <div
            aria-hidden="true"
            className="grain pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]"
          >
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
            <nav
              aria-label={t("templates_page.breadcrumb_label")}
              className="animate-rise flex justify-center"
            >
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
                  {t("templates_page.breadcrumb_current")}
                </li>
              </ol>
            </nav>

            <header className="mx-auto mt-8 max-w-3xl text-center">
              <p
                className="animate-rise eyebrow text-gold/80"
                style={{ "--rise-delay": "80ms" }}
              >
                {t("templates_page.eyebrow")}
              </p>
              <h1
                id="collection-title"
                className="animate-rise mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl lg:text-6xl"
                style={{ "--rise-delay": "160ms" }}
              >
                {t("templates_page.title")}
                <em className="text-gold-shimmer not-italic">
                  {t("templates_page.title_highlight")}
                </em>
              </h1>
              <hr
                className="rule-gold animate-draw-x mx-auto mt-7 w-24"
                style={{ "--rise-delay": "420ms", transformOrigin: "center" }}
              />
              <p
                className="animate-rise mt-7 text-lg leading-relaxed text-pretty text-ink-300"
                style={{ "--rise-delay": "300ms" }}
              >
                {t("templates_page.subtitle")}
              </p>
              {hasCollection && (
                <p
                  className="animate-rise mt-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/5 px-3.5 py-1 text-xs text-gold"
                  style={{ "--rise-delay": "380ms" }}
                >
                  <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
                  {countLabel}
                </p>
              )}
            </header>

            <div className="mt-14">
              {hasCollection ? (
                <TemplatesCollection
                  templates={templates}
                  page={collection.page}
                  pageCount={collection.pageCount}
                  category={collection.category ?? ""}
                  categories={collection.categories}
                  sample={sampleEvent()}
                  isAuthenticated={Boolean(viewer)}
                />
              ) : (
                <div className="surface mx-auto max-w-lg rounded-xl px-6 py-14 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
                    <LayoutTemplate className="h-5 w-5 text-gold" strokeWidth={1.6} />
                  </span>
                  <h2 className="mt-5 text-2xl text-ink-50">
                    {t("templates_page.empty_title")}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-pretty text-ink-300">
                    {t("templates_page.empty_desc")}
                  </p>
                  <Button asChild className="group mt-7">
                    <Link href={isAuthenticated ? "/dashboard/templates" : "/register"}>
                      {t(
                        isAuthenticated
                          ? "templates_page.empty_cta_dashboard"
                          : "templates_page.empty_cta",
                      )}
                      <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <FinalCta />
      </main>
      {/* Des modèles mis en avant : la vitrine et la démo d'ouverture sont
          aussi sur l'accueil. */}
      <Footer
        isAuthenticated={isAuthenticated}
        hasShowcase={hasCollection}
        hasCollection={hasCollection}
      />
    </>
  );
}
