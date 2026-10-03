"use client";

import Link from "next/link";

import PaginationNav from "@/components/common/PaginationNav";
import CategoryFilter from "@/components/templates/CategoryFilter";
import ShowcaseGrid from "@/components/landing/ShowcaseGrid";
import { useTranslation } from "@/lib/i18n/Context";

/** URL de la collection pour une catégorie et une page. */
function collectionHref({ category, page = 1 }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/templates?${search}` : "/templates";
}

/**
 * Collection des modèles mis en avant : filtre par catégorie, grille et
 * pagination. Filtre et page vivent dans l'URL (?category=wedding&page=2) :
 * un lien partagé ou un retour arrière retrouve la même vue.
 *
 * @param {number}   props.page
 * @param {number}   props.pageCount
 * @param {string}   props.category    catégorie active ("" = toutes)
 * @param {string[]} props.categories  catégories qui ont des modèles
 * @param {object}   props.sample      événement fictif des vignettes
 */
export default function TemplatesCollection({
  templates,
  page,
  pageCount,
  category,
  categories,
  sample,
}) {
  const { t } = useTranslation();

  return (
    <div>
      {categories.length > 1 && (
        <div data-reveal className="mb-10 flex justify-center">
          <CategoryFilter
            available={categories}
            value={category}
            hrefFor={(key) => collectionHref({ category: key })}
          />
        </div>
      )}

      {templates.length > 0 ? (
        <ShowcaseGrid templates={templates} sample={sample} titleTag="h2" />
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

      <PaginationNav
        page={page}
        pageCount={pageCount}
        hrefFor={(target) => collectionHref({ category, page: target })}
      />
    </div>
  );
}
