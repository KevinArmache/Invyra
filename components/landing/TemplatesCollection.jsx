"use client";

import Link from "next/link";

import CategoryFilter from "@/components/templates/CategoryFilter";
import ShowcaseGrid from "@/components/landing/ShowcaseGrid";
import { useTranslation } from "@/lib/i18n/Context";

/** URL de la collection pour une catégorie. */
function collectionHref(category) {
  return category
    ? `/templates?${new URLSearchParams({ category })}`
    : "/templates";
}

/**
 * Collection des modèles mis en avant : filtre par catégorie et grille, tous
 * les modèles d'un coup. Le filtre vit dans l'URL (?category=wedding) : un
 * lien partagé ou un retour arrière retrouve la même vue.
 *
 * @param {string}   props.category    catégorie active ("" = toutes)
 * @param {string[]} props.categories  catégories qui ont des modèles
 * @param {object}   props.sample      événement fictif des vignettes
 * @param {boolean}  props.isAuthenticated  pour voter depuis les cartes
 */
export default function TemplatesCollection({
  templates,
  category,
  categories,
  sample,
  isAuthenticated,
}) {
  const { t } = useTranslation();

  return (
    <div>
      {categories.length > 1 && (
        <div data-reveal className="mb-10 flex justify-center">
          <CategoryFilter
            available={categories}
            value={category}
            hrefFor={collectionHref}
          />
        </div>
      )}

      {templates.length > 0 ? (
        <ShowcaseGrid
          templates={templates}
          sample={sample}
          titleTag="h2"
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <div className="surface mx-auto max-w-md rounded-xl px-6 py-12 text-center">
          <p className="text-ink-300">{t("templates_page.no_results")}</p>
          <Link
            href="/templates"
            className="mt-4 inline-block text-sm text-gold underline-offset-4 hover:underline"
          >
            {t("portal.templates.categories.all")}
          </Link>
        </div>
      )}
    </div>
  );
}
