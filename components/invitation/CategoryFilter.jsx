"use client";

import Link from "next/link";

import { TEMPLATE_CATEGORIES } from "@/lib/invitation/categories";
import { useTranslation } from "@/lib/i18n/Context";

const chip = (active) =>
  `rounded-full border px-3 py-1 text-xs transition-colors ${
    active
      ? "border-gold bg-gold/10 text-ink-50"
      : "border-border text-ink-400 hover:text-ink-100"
  }`;

/**
 * Filtre des modèles par catégorie : « Tous », puis chaque catégorie qui a
 * au moins un modèle, dans l'ordre de TEMPLATE_CATEGORIES.
 *
 * Deux usages :
 * - `hrefFor(key)` : chaque pastille est un lien (galerie paginée, le filtre
 *   vit dans l'URL) ;
 * - `onChange(key)` : filtre local (choix du modèle d'un événement).
 * La clé vide "" signifie « Tous ».
 *
 * @param {string[]} props.available  catégories présentes
 * @param {string}   props.value      catégorie active ("" = toutes)
 */
export default function CategoryFilter({ available, value, hrefFor, onChange }) {
  const { t } = useTranslation();
  const keys = TEMPLATE_CATEGORIES.filter((key) => available.includes(key));
  if (keys.length === 0) return null;

  const items = [
    { key: "", label: t("portal.templates.categories.all") },
    ...keys.map((key) => ({
      key,
      label: t(`portal.templates.categories.${key}`),
    })),
  ];

  return (
    <div
      role="group"
      aria-label={t("portal.templates.categories.label")}
      className="flex flex-wrap gap-2"
    >
      {items.map((item) =>
        hrefFor ? (
          <Link
            key={item.key || "all"}
            href={hrefFor(item.key)}
            scroll={false}
            aria-current={value === item.key ? "true" : undefined}
            className={chip(value === item.key)}
          >
            {item.label}
          </Link>
        ) : (
          <button
            key={item.key || "all"}
            type="button"
            aria-pressed={value === item.key}
            onClick={() => onChange(item.key)}
            className={chip(value === item.key)}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
