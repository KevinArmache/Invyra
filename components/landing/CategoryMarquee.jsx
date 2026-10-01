import {
  Baby,
  Briefcase,
  Cake,
  Church,
  Gem,
  Heart,
  PartyPopper,
  Sparkles,
} from "lucide-react";

import { TEMPLATE_CATEGORIES } from "@/lib/templates/categories";
import { getTranslations } from "@/lib/i18n/server";

const ICONS = {
  wedding: Heart,
  engagement: Gem,
  birthday: Cake,
  babyshower: Baby,
  baptism: Church,
  party: PartyPopper,
  gala: Sparkles,
  corporate: Briefcase,
};

/**
 * Bandeau des types d'événement de la galerie (les catégories réelles des
 * modèles, « Autre » mis à part). Deux copies de la liste défilent bout à
 * bout ; la seconde est masquée aux lecteurs d'écran.
 */
export default async function CategoryMarquee() {
  const { t } = await getTranslations();
  const items = TEMPLATE_CATEGORIES.filter((key) => ICONS[key]).map((key) => ({
    key,
    label: t(`portal.templates.categories.${key}`),
    Icon: ICONS[key],
  }));

  // Chaque copie répète la liste deux fois : elle doit rester plus large
  // que l'écran, sinon un vide apparaît en bout de boucle sur grand écran.
  const doubled = [...items, ...items];

  const list = (hidden) => (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-3 pr-3 sm:gap-4 sm:pr-4"
    >
      {doubled.map(({ key, label, Icon }, index) => (
        <li
          key={`${key}-${index}`}
          aria-hidden={index >= items.length || undefined}
          className="group inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-ink-850/70 px-4 py-2 text-sm whitespace-nowrap text-ink-300 transition-colors duration-300 hover:border-gold/40 hover:text-ink-50 sm:px-5 sm:py-2.5"
        >
          <Icon
            className="h-4 w-4 text-gold/80 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          {label}
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label={t("landing.marquee.label")}
      className="relative border-y border-border/50 bg-ink-850/30 py-6 sm:py-7"
    >
      <p className="eyebrow mb-4 text-center">{t("landing.marquee.label")}</p>
      <div className="marquee" data-loop>
        <div className="marquee-track" style={{ "--marquee-duration": "70s" }}>
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}
