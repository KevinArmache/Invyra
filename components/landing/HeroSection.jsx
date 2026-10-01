import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import AnimatedNumber from "@/components/common/AnimatedNumber";
import HeroScene from "@/components/landing/HeroScene";
import Particles from "@/components/landing/Particles";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Mots d'un titre, chacun dans sa fenêtre pour glisser depuis le bas
 * (`.word-mask`). Les espaces restent du texte : la phrase se lit et se
 * coupe normalement.
 */
function Words({ text, from = 0, className }) {
  const words = text.split(" ").filter(Boolean);
  return words.map((word, index) => (
    <span key={`${word}-${index}`}>
      {index > 0 && " "}
      <span className="word-mask">
        <span style={{ "--i": from + index }}>
          {className ? <span className={className}>{word}</span> : word}
        </span>
      </span>
    </span>
  ));
}

/**
 * Entièrement rendu sur le serveur, animé en CSS : rien n'attend
 * l'hydratation, le premier octet contient déjà le héros complet.
 */
export default async function HeroSection() {
  const { t } = await getTranslations();

  const title = t("landing.hero.title_1");
  const highlight = t("landing.hero.title_highlight");
  const titleLength = title.split(" ").filter(Boolean).length;
  const facts = t("landing.hero.facts");

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8 lg:pt-40 lg:pb-28"
    >
      {/* Fond : deux halos qui dérivent lentement, la poussière d'or et le
          grain. Rien de tout cela ne se lit comme une forme. */}
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 -z-10">
        <div
          className="animate-drift absolute -top-48 left-1/2 h-[38rem] w-[64rem] -translate-x-1/2 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in oklch, var(--gold) 15%, transparent), transparent 70%)",
          }}
        />
        <div
          className="animate-drift absolute top-1/3 -right-48 h-[30rem] w-[30rem] rounded-full opacity-50"
          style={{
            animationDelay: "-7s",
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--gold-deep) 14%, transparent), transparent 68%)",
          }}
        />
        <Particles count={18} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-background" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
        {/* ── Texte ──────────────────────────────────────────────────── */}
        <div className="text-center lg:text-left">
          <p className="animate-rise eyebrow inline-flex items-center gap-2.5 text-gold/90">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            {t("landing.hero.eyebrow")}
          </p>

          <h1
            id="hero-title"
            className="mt-6 text-[2.6rem] leading-[1.04] text-balance text-ink-50 sm:text-6xl lg:text-[4.25rem]"
          >
            <Words text={title} />{" "}
            <em className="not-italic">
              <Words
                text={highlight}
                from={titleLength}
                className="text-gold-shimmer"
              />
            </em>
          </h1>

          <hr
            className="rule-gold-left animate-draw-x mx-auto mt-8 w-32 lg:mx-0"
            style={{ "--rise-delay": "650ms" }}
          />

          <p
            className="animate-rise mx-auto mt-8 max-w-xl text-lg leading-relaxed text-pretty text-ink-300 lg:mx-0"
            style={{ "--rise-delay": "450ms" }}
          >
            {t("landing.hero.subtitle")}
          </p>

          <div
            className="animate-rise mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            style={{ "--rise-delay": "580ms" }}
          >
            <Button asChild size="lg" className="group h-12 w-full px-7 text-[0.95rem] sm:w-auto">
              <Link href="/register">
                {t("landing.hero.cta_primary")}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full px-7 text-[0.95rem] sm:w-auto"
            >
              <Link href="#how-it-works">{t("landing.hero.cta_secondary")}</Link>
            </Button>
          </div>

          <p
            className="animate-fade-in mt-5 inline-flex items-center gap-2 text-sm text-ink-400"
            style={{ "--rise-delay": "800ms" }}
          >
            <Check className="h-4 w-4 text-positive" strokeWidth={2.25} />
            {t("landing.hero.free_note")}
          </p>

          {/* Trois faits vérifiables, séparés par des filets plutôt que par
              des cartes. Le fond de grille est la couleur de bordure, chaque
              cellule repeint le fond par-dessus. */}
          <dl
            className="animate-rise mx-auto mt-12 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 lg:mx-0"
            style={{ "--rise-delay": "720ms" }}
          >
            {(Array.isArray(facts) ? facts : []).map((fact, index) => (
              // Libellé avant la valeur dans le code (ordre de lecture),
              // valeur au-dessus à l'écran.
              <div
                key={fact.label}
                className="group flex flex-col-reverse bg-background/90 px-3 py-5 text-center transition-colors duration-500 hover:bg-ink-850 sm:text-left"
              >
                <dt className="mt-1.5 text-xs leading-snug text-ink-400 transition-colors group-hover:text-ink-300">
                  {fact.label}
                </dt>
                <dd className="font-display text-3xl text-gold sm:text-4xl">
                  <AnimatedNumber value={fact.value} delay={900 + index * 150} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Scène ──────────────────────────────────────────────────── */}
        <div className="px-6 sm:px-10 lg:px-4">
          <HeroScene />
        </div>
      </div>
    </section>
  );
}
