import { getTranslations } from "@/lib/i18n/server";

const STEPS = ["1", "2", "3", "4"];

export default async function HowItWorksSection() {
  const { t } = await getTranslations();

  return (
    <section
      id="how-it-works"
      className="grain relative scroll-mt-16 overflow-hidden border-t border-border/60 bg-ink-850/40 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="relative mx-auto max-w-5xl">
        <header className="reveal mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl leading-tight text-ink-50 sm:text-5xl">
            {t("landing.how_it_works.title")}
            <em className="text-gold not-italic">
              {t("landing.how_it_works.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-lg leading-relaxed text-ink-300">
            {t("landing.how_it_works.subtitle")}
          </p>
        </header>

        <ol className="relative mt-20">
          {/* Le fil vertical qui relie les étapes : il s'éteint avant le bas
              du bloc plutôt que de s'arrêter net. */}
          <div
            aria-hidden="true"
            className="absolute top-6 bottom-6 left-6 w-px bg-gradient-to-b from-gold/40 via-border to-transparent md:left-1/2 md:-translate-x-1/2"
          />

          {STEPS.map((step, index) => {
            const isRight = index % 2 === 1;

            return (
              <li
                key={step}
                className="reveal relative mb-14 flex gap-6 last:mb-0 md:mb-20 md:gap-0"
              >
                {/* Pastille : le chiffre en serif est l'élément décoratif, on
                    n'ajoute donc aucune icône. */}
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-background shadow-elevation-2 md:absolute md:left-1/2 md:-translate-x-1/2">
                  <span className="font-display text-xl text-gold">{step}</span>
                </div>

                <div
                  className={`pt-1.5 md:w-[calc(50%-3rem)] ${
                    isRight
                      ? "md:ml-auto md:pl-4 md:text-left"
                      : "md:mr-auto md:pr-4 md:text-right"
                  }`}
                >
                  <h3 className="text-xl leading-snug text-ink-50">
                    {t(`landing.how_it_works.steps.${step}.title`)}
                  </h3>
                  <p className="mt-2.5 text-pretty text-sm leading-relaxed text-ink-300">
                    {t(`landing.how_it_works.steps.${step}.desc`)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
