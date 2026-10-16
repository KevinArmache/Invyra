"use client";

import Link from "next/link";

import CategoryFilter from "@/components/templates/CategoryFilter";
import StationeryGrid from "@/components/stationery/StationeryGrid";
import { useTranslation } from "@/lib/i18n/Context";

/** URL de la collection papier pour une catégorie. */
function collectionHref(category) {
  return category ? `/stationery?${new URLSearchParams({ category })}` : "/stationery";
}

/**
 * Collection des invitations papier mises en avant : filtre par catégorie
 * et grille, comme TemplatesCollection. Le filtre vit dans l'URL.
 *
 * @param {string}   props.category    catégorie active ("" = toutes)
 * @param {string[]} props.categories  catégories qui ont des modèles
 * @param {string}   [props.qr]        SVG du QR code d'exemple
 */
export default function StationeryCollection({ templates, category, categories, qr, isAuthenticated }) {
  const { t } = useTranslation();

  return (
    <div>
      {categories.length > 1 && (
        <div data-reveal className="mb-10 flex justify-center">
          <CategoryFilter available={categories} value={category} hrefFor={collectionHref} />
        </div>
      )}

      {templates.length > 0 ? (
        <StationeryGrid templates={templates} qr={qr} titleTag="h2" isAuthenticated={isAuthenticated} />
      ) : (
        <div className="surface mx-auto max-w-md rounded-xl px-6 py-12 text-center">
          <p className="text-ink-300">{t("templates_page.no_results")}</p>
          <Link
            href="/stationery"
            className="mt-4 inline-block text-sm text-gold underline-offset-4 hover:underline"
          >
            {t("portal.templates.categories.all")}
          </Link>
        </div>
      )}
    </div>
  );
}
