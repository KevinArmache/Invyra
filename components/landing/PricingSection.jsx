import Link from "next/link";
import { ArrowRight, Check, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/lib/i18n/server";
import { whatsappLink } from "@/lib/site";

/**
 * Deux formules, telles que l'application les applique (voir PLAN_LIMITS
 * dans app/actions/event.js et GUEST_LIMITS dans app/actions/guest.js) :
 * Découverte, 1 événement et 15 invités ; Événement premium, 1 événement
 * et des invités illimités, activé par l'équipe après un message WhatsApp.
 */
export default async function PricingSection() {
  const { t } = await getTranslations();

  const plans = [
    { key: "free", href: "/register", featured: false },
    {
      key: "pro",
      href: whatsappLink(t("landing.pricing.plans.pro.whatsapp_message")),
      featured: true,
    },
  ];

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="relative scroll-mt-20 overflow-hidden border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 45% 70% at 50% 0%, color-mix(in oklch, var(--gold) 9%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <header data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold/80">{t("landing.pricing.eyebrow")}</p>
          <h2
            id="pricing-title"
            className="mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
          >
            {t("landing.pricing.title")}
            <em className="text-gold not-italic">
              {t("landing.pricing.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-lg leading-relaxed text-pretty text-ink-300">
            {t("landing.pricing.subtitle")}
          </p>
        </header>

        {/* items-start : la carte gratuite ne s'étire pas à la hauteur de la
            carte mise en avant, volontairement plus haute. */}
        <div className="mx-auto mt-20 grid max-w-4xl items-start gap-6 md:grid-cols-2">
          {plans.map((plan, planIndex) => {
            const features = t(`landing.pricing.plans.${plan.key}.features`);
            const isExternal = plan.href.startsWith("http");

            return (
              <div
                key={plan.key}
                data-reveal
                style={{ "--i": planIndex }}
                className={plan.featured ? "md:-mt-6" : ""}
              >
                <article
                  className={`group relative flex h-full flex-col rounded-xl p-8 transition-[translate,box-shadow] duration-500 ease-out hover:-translate-y-1.5 ${
                    plan.featured
                      ? "border-glow spotlight border border-gold/30 bg-ink-850 shadow-elevation-3 md:pt-12 md:pb-10"
                      : "spotlight surface hover:shadow-elevation-2"
                  }`}
                >
                  {plan.featured && (
                    <p className="eyebrow mb-5 inline-flex items-center gap-2 text-gold/90">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                      </span>
                      {t("landing.pricing.badge")}
                    </p>
                  )}

                  <h3 className="text-2xl text-ink-50">
                    {t(`landing.pricing.plans.${plan.key}.name`)}
                  </h3>
                  <p className="mt-2 text-sm text-ink-400">
                    {t(`landing.pricing.plans.${plan.key}.desc`)}
                  </p>

                  <div className="mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span
                      data-numeric
                      className={`font-display text-5xl ${
                        plan.featured ? "text-gold-shimmer" : "text-ink-50"
                      }`}
                    >
                      {t(`landing.pricing.plans.${plan.key}.price`)}
                    </span>
                    <span className="text-sm text-ink-400">
                      {t(`landing.pricing.plans.${plan.key}.period`)}
                    </span>
                  </div>

                  <hr className="my-8 border-border/70" />

                  <ul className="mb-9 flex-1 space-y-3.5">
                    {(Array.isArray(features) ? features : []).map(
                      (feature, index) => (
                        <li key={feature} className="flex gap-3">
                          <span
                            className="animate-pop mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/15"
                            style={{ "--rise-delay": `${300 + index * 90}ms` }}
                          >
                            <Check className="h-3 w-3 text-gold" strokeWidth={2.5} />
                          </span>
                          <span className="text-sm leading-relaxed text-ink-100">
                            {feature}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>

                  <Button
                    asChild
                    size="lg"
                    variant={plan.featured ? "default" : "outline"}
                    className="group/cta h-12 w-full"
                  >
                    <Link
                      href={plan.href}
                      {...(isExternal
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {isExternal && <MessageCircle />}
                      {t(`landing.pricing.plans.${plan.key}.cta`)}
                      {!isExternal && (
                        <ArrowRight className="transition-transform duration-300 group-hover/cta:translate-x-1" />
                      )}
                    </Link>
                  </Button>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
