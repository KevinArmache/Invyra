import { BarChart3, CalendarPlus, Palette, Send } from "lucide-react";

import { getTranslations } from "@/lib/i18n/server";

const STEPS = [
  { key: "1", icon: CalendarPlus },
  { key: "2", icon: Palette },
  { key: "3", icon: Send },
  { key: "4", icon: BarChart3 },
];

/**
 * Les quatre étapes réelles du parcours, reliées par un fil qui se trace
 * quand la liste arrive à l'écran. Les étapes alternent de part et d'autre
 * du fil sur grand écran ; sur mobile, le fil longe la gauche.
 */
export default async function HowItWorksSection() {
  const { t } = await getTranslations();

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="grain relative scroll-mt-20 overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--gold) 7%, transparent), transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <header data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold/80">{t("landing.how_it_works.eyebrow")}</p>
          <h2
            id="how-it-works-title"
            className="mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
          >
            {t("landing.how_it_works.title")}
            <em className="text-gold not-italic">
              {t("landing.how_it_works.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-lg leading-relaxed text-pretty text-ink-300">
            {t("landing.how_it_works.subtitle")}
          </p>
        </header>

        <div data-reveal="fade" className="relative mt-20">
          {/* Le fil : il se trace de haut en bas quand la liste apparaît,
              puis s'éteint avant le bas plutôt que de s'arrêter net. */}
          <span
            aria-hidden="true"
            data-reveal-child
            className="absolute top-6 bottom-6 left-6 w-px origin-top bg-linear-to-b from-gold/60 via-gold/25 to-transparent md:left-1/2 md:-translate-x-1/2"
            style={{
              animation: "draw-y 1800ms var(--ease-out-expo) 200ms both",
            }}
          />

          <ol className="relative space-y-14 md:space-y-20">
            {STEPS.map((step, index) => {
              const isRight = index % 2 === 1;

              return (
                <li
                  key={step.key}
                  data-reveal={isRight ? "right" : "left"}
                  style={{ "--i": index, "--stagger": "140ms" }}
                  className="relative flex gap-6 md:gap-0"
                >
                  {/* Pastille : icône de l'étape, numéro en exposant, et un
                      anneau qui appelle l'œil. */}
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-background shadow-elevation-2 md:absolute md:left-1/2 md:-translate-x-1/2">
                    <span className="pulse-ring absolute inset-0 rounded-full" style={{ "--ring-delay": `${index * 0.6}s` }} />
                    <step.icon className="h-5 w-5 text-gold" strokeWidth={1.6} />
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-gold/40 bg-ink-850 font-display text-[11px] text-gold">
                      {step.key}
                    </span>
                  </div>

                  <div
                    className={`w-full transition-transform duration-500 ease-out hover:-translate-y-1 md:w-[calc(50%-3.5rem)] ${
                      isRight ? "md:ml-auto" : "md:mr-auto md:text-right"
                    }`}
                  >
                    <div className="spotlight surface-interactive rounded-xl p-6">
                      <h3 className="text-xl leading-snug text-ink-50">
                        {t(`landing.how_it_works.steps.${step.key}.title`)}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-pretty text-ink-300">
                        {t(`landing.how_it_works.steps.${step.key}.desc`)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
