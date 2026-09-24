"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Pages à afficher : la première, la dernière, et deux voisines de la page
 * courante ; `null` marque un saut (« … »).
 *   1 … 4 5 [6] 7 8 … 12
 */
function pageItems(page, pageCount) {
  const pages = new Set([1, pageCount]);
  for (let offset = -2; offset <= 2; offset++) {
    const value = page + offset;
    if (value >= 1 && value <= pageCount) pages.add(value);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) items.push(null);
    items.push(value);
  });
  return items;
}

/**
 * Navigation entre pages d'une liste. Chaque page est un lien (`hrefFor`) :
 * la position se partage et survit au retour arrière.
 *
 * @param {number}   props.page       page courante (à partir de 1)
 * @param {number}   props.pageCount
 * @param {function} props.hrefFor    page → URL
 */
export default function PaginationNav({ page, pageCount, hrefFor }) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;

  const base = buttonVariants({ variant: "ghost", size: "icon" });
  const disabled = "pointer-events-none opacity-40";

  return (
    <nav
      aria-label={t("portal.templates.pagination.label")}
      className="mt-8 flex items-center justify-center gap-1"
    >
      <Link
        href={hrefFor(page - 1)}
        aria-label={t("portal.templates.pagination.previous")}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        className={`${base} ${page <= 1 ? disabled : ""}`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pageItems(page, pageCount).map((value, index) =>
        value === null ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="w-6 text-center text-sm text-ink-400"
          >
            …
          </span>
        ) : (
          <Link
            key={value}
            href={hrefFor(value)}
            aria-current={value === page ? "page" : undefined}
            className={`${buttonVariants({
              variant: value === page ? "outline" : "ghost",
              size: "icon",
            })} ${value === page ? "border-gold/50 text-ink-50" : "text-ink-400"}`}
          >
            <span data-numeric>{value}</span>
          </Link>
        ),
      )}

      <Link
        href={hrefFor(page + 1)}
        aria-label={t("portal.templates.pagination.next")}
        aria-disabled={page >= pageCount}
        tabIndex={page >= pageCount ? -1 : undefined}
        className={`${base} ${page >= pageCount ? disabled : ""}`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
