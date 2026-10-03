import Link from "next/link";
import { ArrowRight, MailOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import Particles from "@/components/landing/Particles";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Dernier appel avant le pied de page : une enveloppe ouverte qui flotte
 * au centre d'anneaux qui s'élargissent, sur un halo doré.
 */
export default async function FinalCta() {
  const { t } = await getTranslations();

  return (
    <section
      aria-labelledby="final-cta-title"
      className="relative px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32"
    >
      <div
        data-reveal="scale"
        className="grain relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gold/20 bg-ink-850 px-6 py-16 text-center shadow-elevation-3 sm:px-12 sm:py-20"
      >
        <div
          aria-hidden="true"
          className="animate-breathe pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 0%, color-mix(in oklch, var(--gold) 16%, transparent), transparent 70%)",
          }}
        />
        <Particles count={12} />

        {/* L'enveloppe et ses anneaux. */}
        <div aria-hidden="true" className="relative mx-auto flex h-24 w-24 items-center justify-center">
          {[0, 1, 2].map((ring) => (
            <span
              key={ring}
              className="pulse-ring absolute inset-0 rounded-full"
              style={{ "--ring-delay": `${ring * 0.8}s` }}
            />
          ))}
          <span className="animate-float relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-ink-900 shadow-elevation-2">
            <MailOpen className="h-7 w-7 text-gold" strokeWidth={1.5} />
          </span>
        </div>

        <h2
          id="final-cta-title"
          className="relative mx-auto mt-10 max-w-2xl text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
        >
          {t("landing.cta.title")}
          <em className="text-gold-shimmer not-italic">
            {t("landing.cta.title_highlight")}
          </em>
        </h2>
        <p className="relative mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-ink-300">
          {t("landing.cta.subtitle")}
        </p>

        <div className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="group h-12 w-full px-8 sm:w-auto">
            <Link href="/register">
              {t("landing.cta.button")}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 w-full px-8 sm:w-auto">
            <Link href="/#pricing">{t("landing.cta.secondary")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
