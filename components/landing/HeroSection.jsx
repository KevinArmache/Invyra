import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/utils/i18n/server";
import InvitationShowcase from "@/components/landing/InvitationShowcase";

/**
 * Entièrement rendu sur le serveur, animé en CSS. Rien ici n'attend
 * l'hydratation : le premier octet contient déjà le héros complet.
 */
export default async function HeroSection() {
  const { t } = await getTranslations();

  const stats = [
    {
      value: t("landing.hero.stats.events_value"),
      label: t("landing.hero.stats.events"),
    },
    {
      value: t("landing.hero.stats.rsvp_value"),
      label: t("landing.hero.stats.rsvp"),
    },
    {
      value: t("landing.hero.stats.themes_value"),
      label: t("landing.hero.stats.themes"),
    },
  ];

  return (
    <section className="grain relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8 lg:pt-40 lg:pb-28">
      {/* Lueur haute, large et très diffuse : elle éclaire le titre sans
          jamais se lire comme une forme. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 50% 0%, color-mix(in oklch, var(--gold) 14%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        {/* ── Colonne texte ─────────────────────────────────────────── */}
        <div className="text-center lg:text-left">
          <p className="animate-rise eyebrow text-gold/80">
            {t("landing.hero.tagline")}
          </p>

          <h1
            className="animate-rise mt-6 text-balance text-5xl leading-[1.05] text-ink-50 sm:text-6xl lg:text-7xl"
            style={{ "--rise-delay": "80ms" }}
          >
            {t("landing.hero.title_1")}{" "}
            <em className="text-gold not-italic">
              {t("landing.hero.title_highlight")}
            </em>
          </h1>

          <hr
            className="rule-gold-left animate-rise mx-auto mt-8 w-32 lg:mx-0"
            style={{ "--rise-delay": "180ms" }}
          />

          <p
            className="animate-rise mx-auto mt-8 max-w-xl text-pretty text-lg leading-relaxed text-ink-300 lg:mx-0"
            style={{ "--rise-delay": "240ms" }}
          >
            {t("landing.hero.subtitle")}
          </p>

          <div
            className="animate-rise mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            style={{ "--rise-delay": "320ms" }}
          >
            <Button asChild size="lg" className="group w-full sm:w-auto">
              <Link href="/register">
                {t("landing.hero.cta_primary")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link href="#how-it-works">{t("landing.hero.cta_secondary")}</Link>
            </Button>
          </div>

          {/* Statistiques séparées par des filets plutôt que par des cartes :
              moins de boîtes, plus de tenue. Le fond de grille est la couleur
              de bordure, chaque cellule repeint le fond par-dessus. */}
          <dl
            className="animate-rise mt-16 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border/60 bg-border/60 lg:max-w-lg"
            style={{ "--rise-delay": "420ms" }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="bg-background px-3 py-5">
                <dt className="sr-only">{stat.label}</dt>
                <dd
                  data-numeric
                  className="font-display text-3xl text-gold sm:text-4xl"
                >
                  {stat.value}
                </dd>
                <p className="mt-1.5 text-xs leading-snug text-ink-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Colonne vitrine ───────────────────────────────────────── */}
        <div className="lg:pl-8">
          <InvitationShowcase />
        </div>
      </div>
    </section>
  );
}
