import {
  BarChart3,
  Code2,
  Lock,
  Mail,
  MousePointerClick,
  Sparkles,
  SplitSquareHorizontal,
  Users,
} from "lucide-react";

import { getTranslations } from "@/utils/i18n/server";

const FEATURES = [
  { icon: Code2, key: "ai" },
  { icon: MousePointerClick, key: "themes" },
  { icon: Users, key: "guests" },
  { icon: Mail, key: "emails" },
  { icon: BarChart3, key: "analytics" },
  { icon: SplitSquareHorizontal, key: "preview" },
  { icon: Sparkles, key: "effects" },
  { icon: Lock, key: "security" },
];

export default async function FeaturesSection() {
  const { t } = await getTranslations();

  return (
    <section
      id="features"
      className="scroll-mt-16 border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <header className="reveal mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl leading-tight text-ink-50 sm:text-5xl">
            {t("landing.features.title")}
            <em className="text-gold not-italic">
              {t("landing.features.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-pretty text-lg leading-relaxed text-ink-300">
            {t("landing.features.subtitle")}
          </p>
        </header>

        {/* Une grille tenue par des filets plutôt que par huit cartes : le
            registre éditorial supporte mal l'empilement de boîtes. Le fond de
            grille est la couleur de bordure, chaque cellule repeint le fond. */}
        <div className="reveal mt-16 grid gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article
              key={feature.key}
              className="group bg-background p-7 transition-colors duration-300 hover:bg-ink-850"
            >
              <feature.icon
                className="h-5 w-5 text-gold transition-transform duration-300 group-hover:-translate-y-0.5"
                strokeWidth={1.5}
              />
              <h3 className="mt-5 text-lg leading-snug text-ink-50">
                {t(`landing.features.items.${feature.key}.title`)}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-300">
                {t(`landing.features.items.${feature.key}.desc`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
