import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/lib/i18n/server";

const CONTACT_URL = "https://wa.me/+243816864164";

const PLANS = [
  { key: "free", href: "/register", featured: false },
  { key: "pro", href: CONTACT_URL, featured: true },
];

export default async function PricingSection() {
  const { t } = await getTranslations();

  return (
    <section
      id="pricing"
      className="scroll-mt-16 border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <header className="reveal mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl leading-tight text-ink-50 sm:text-5xl">
            {t("landing.pricing.title")}
            <em className="text-gold not-italic">
              {t("landing.pricing.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-pretty text-lg leading-relaxed text-ink-300">
            {t("landing.pricing.subtitle")}
          </p>
        </header>

        {/* Deux formules : la grille est resserrée pour que les cartes
            gardent la largeur qu'elles avaient à trois. items-start empêche la
            carte gratuite de s'étirer à la hauteur de la carte mise en avant,
            volontairement plus haute. */}
        <div className="mx-auto mt-20 grid max-w-4xl items-start gap-6 md:grid-cols-2">
          {PLANS.map((plan) => {
            const features = t(`landing.pricing.plans.${plan.key}.features`);
            const isExternal = plan.href.startsWith("http");

            // « 0€ » et un prix en toutes lettres ne peuvent pas partager la même taille :
            // au-delà de quelques caractères le prix cesse d'être un chiffre à
            // lire d'un coup d'œil et devient une ligne de texte.
            const price = t(`landing.pricing.plans.${plan.key}.price`);
            const priceIsNumeric = String(price).length <= 6;

            return (
              <article
                key={plan.key}
                className={`reveal relative flex h-full flex-col rounded-lg p-8 ${
                  plan.featured
                    ? "border border-gold/40 bg-ink-850 shadow-elevation-3 md:-mt-6 md:pt-12 md:pb-10"
                    : "surface"
                }`}
              >
                {plan.featured && (
                  <>
                    {/* Le filet doré en tête remplace la pastille flottante
                        « populaire » : il ne chevauche rien et se lit aussi
                        bien sur mobile. */}
                    <hr className="rule-gold absolute inset-x-8 top-0" />
                    <p className="eyebrow mb-5 text-gold/80">
                      {t("landing.pricing.popular")}
                    </p>
                  </>
                )}

                <h3 className="text-2xl text-ink-50">
                  {t(`landing.pricing.plans.${plan.key}.name`)}
                </h3>
                <p className="mt-2 text-sm text-ink-400">
                  {t(`landing.pricing.plans.${plan.key}.desc`)}
                </p>

                <div
                  className={
                    priceIsNumeric
                      ? "mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1"
                      : "mt-7"
                  }
                >
                  <span
                    data-numeric
                    className={`font-display text-ink-50 ${
                      priceIsNumeric ? "text-5xl" : "text-3xl"
                    }`}
                  >
                    {price}
                  </span>
                  <span
                    className={`text-sm text-ink-400 ${
                      priceIsNumeric ? "" : "mt-1.5 block"
                    }`}
                  >
                    {t(`landing.pricing.plans.${plan.key}.period`)}
                  </span>
                </div>

                <hr className="my-8 border-border/70" />

                <ul className="mb-9 flex-1 space-y-3.5">
                  {(Array.isArray(features) ? features : []).map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                        strokeWidth={2}
                      />
                      <span className="text-sm leading-relaxed text-ink-100">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  variant={plan.featured ? "default" : "outline"}
                  className="w-full"
                >
                  <Link
                    href={plan.href}
                    {...(isExternal
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {t(`landing.pricing.plans.${plan.key}.cta`)}
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
