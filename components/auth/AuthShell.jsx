import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import BrandMark from "@/components/common/BrandMark";
import HeroScene from "@/components/landing/HeroScene";
import Particles from "@/components/landing/Particles";

/**
 * Cadre commun aux pages de connexion et d'inscription.
 *
 * Deux colonnes : le formulaire à gauche, à droite la scène de l'accueil
 * (l'invitation qui s'ouvre et ses réponses) avec l'accroche de la page. Le
 * panneau disparaît sous `lg` : sur mobile, un panneau décoratif empilé
 * repousserait les champs sous la ligne de flottaison ; seul un halo reste
 * derrière le titre.
 */
export default function AuthShell({ title, subtitle, tagline, children }) {
  const taglineWords = String(tagline ?? "").split(" ").filter(Boolean);

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* ── Formulaire ──────────────────────────────────────────────── */}
      <div className="relative flex flex-col overflow-hidden px-4 py-6 sm:px-8">
        <div
          aria-hidden="true"
          className="animate-drift pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[36rem] -translate-x-1/2 rounded-full opacity-60 lg:hidden"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in oklch, var(--gold) 12%, transparent), transparent 70%)",
          }}
        />

        <div className="animate-fade-in relative flex items-center justify-between">
          <BrandMark href="/" size="sm" priority />
          <LanguageSwitcher />
        </div>

        <main id="main" className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="animate-rise text-3xl text-ink-50 sm:text-4xl">{title}</h1>
            <hr
              className="rule-gold-left animate-draw-x mt-4 w-16"
              style={{ "--rise-delay": "200ms" }}
            />
            <p
              className="animate-rise mt-5 text-sm leading-relaxed text-ink-300"
              style={{ "--rise-delay": "120ms" }}
            >
              {subtitle}
            </p>

            <div className="mt-9">{children}</div>
          </div>
        </main>
      </div>

      {/* ── Panneau ─────────────────────────────────────────────────── */}
      <aside className="grain relative hidden flex-col items-center justify-center gap-14 overflow-hidden border-l border-border/60 bg-ink-850 px-12 py-16 lg:flex">
        <div
          aria-hidden="true"
          className="glow-gold animate-breathe pointer-events-none absolute inset-0"
        />
        <Particles count={14} />

        <div className="relative w-full max-w-[19rem] xl:max-w-[22rem]">
          <HeroScene />
        </div>

        <figure className="relative max-w-md text-center">
          <blockquote className="font-display text-3xl leading-snug text-balance text-ink-50">
            {taglineWords.map((word, index) => (
              <span key={`${word}-${index}`}>
                {index > 0 && " "}
                <span className="word-mask">
                  <span style={{ "--i": index, "--word-delay": "500ms" }}>
                    {word}
                  </span>
                </span>
              </span>
            ))}
          </blockquote>
          <div className="mx-auto mt-8 w-16">
            <div className="animate-draw-x h-px bg-gold/60" style={{ "--rise-delay": "900ms" }} />
            <div className="animate-draw-x mt-1 h-px bg-gold/25" style={{ "--rise-delay": "1000ms" }} />
          </div>
        </figure>
      </aside>
    </div>
  );
}
