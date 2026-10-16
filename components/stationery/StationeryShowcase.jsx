"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import StationeryGrid from "@/components/stationery/StationeryGrid";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Section « Papeterie » de l'accueil : les coups de cœur papier (étoile
 * d'un admin), avec le même principe que la vitrine des invitations en
 * ligne. La collection complète vit sur /stationery.
 *
 * @param {boolean} props.hasCollection  les modèles affichés sont des coups
 *   de cœur : la collection a quelque chose à montrer
 * @param {string} [props.qr]  SVG d'un QR code d'exemple
 */
export default function StationeryShowcase({ templates, qr = null, hasCollection = false }) {
  const { t } = useTranslation();
  if (!templates || templates.length === 0) return null;
  const points = t("landing.stationery.points");

  return (
    <section
      id="stationery"
      aria-labelledby="stationery-title"
      className="relative scroll-mt-20 overflow-hidden border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]"
        style={{
          background:
            "radial-gradient(ellipse 45% 50% at 50% 0%, color-mix(in oklch, var(--gold) 8%, transparent), transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-7xl">
        <header data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold/80">{t("landing.stationery.eyebrow")}</p>
          <h2
            id="stationery-title"
            className="mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
          >
            {t("landing.stationery.title")}
            <em className="text-gold not-italic">{t("landing.stationery.title_highlight")}</em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-lg leading-relaxed text-pretty text-ink-300">
            {t("landing.stationery.subtitle")}
          </p>
          {Array.isArray(points) && (
            <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-300">
              {points.map((point) => (
                <li key={point} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          )}
        </header>

        <div className="mt-16">
          <StationeryGrid templates={templates} qr={qr} />
        </div>

        {hasCollection && (
          <div data-reveal className="mt-12 flex justify-center">
            <Button asChild variant="outline" size="lg" className="group">
              <Link href="/stationery">
                {t("landing.stationery.view_all")}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
