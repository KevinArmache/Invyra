"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import ShowcaseGrid from "@/components/landing/ShowcaseGrid";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Vitrine publique des modèles mis en avant par un admin (étoile dans la
 * page Modèles) : les premiers seulement. La collection complète, paginée,
 * vit sur /templates.
 *
 * @param {object}  props.sample         événement fictif des vignettes
 * @param {boolean} props.hasCollection  les modèles affichés sont ceux mis en
 *   avant (et non le repli sur les modèles terminés) : le lien vers la
 *   collection a quelque chose à montrer
 */
export default function TemplatesShowcase({
  templates,
  sample,
  hasCollection = false,
}) {
  const { t } = useTranslation();

  if (!templates || templates.length === 0) return null;

  return (
    <section
      id="templates"
      aria-labelledby="templates-title"
      className="relative scroll-mt-20 overflow-hidden border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <header data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold/80">{t("landing.templates.eyebrow")}</p>
          <h2
            id="templates-title"
            className="mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
          >
            {t("landing.templates.title")}
            <em className="text-gold not-italic">
              {t("landing.templates.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-lg leading-relaxed text-pretty text-ink-300">
            {t("landing.templates.subtitle")}
          </p>
        </header>

        <div className="mt-16">
          <ShowcaseGrid templates={templates} sample={sample} />
        </div>

        {hasCollection && (
          <div data-reveal className="mt-12 flex justify-center">
            <Button asChild variant="outline" size="lg" className="group">
              <Link href="/templates">
                {t("landing.templates.view_all")}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
