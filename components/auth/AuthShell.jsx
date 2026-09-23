import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * Cadre commun aux pages de connexion et d'inscription.
 *
 * Deux colonnes : le formulaire à gauche, un panneau éditorial à droite qui
 * disparaît sous `lg`. Sur mobile on ne garde que le formulaire — un panneau
 * décoratif empilé au-dessus repousserait les champs sous la ligne de
 * flottaison.
 */
export default function AuthShell({ title, subtitle, tagline, children }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* ── Formulaire ──────────────────────────────────────────────── */}
      <div className="relative flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-400 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-display text-lg text-ink-50">Invyra</span>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl text-ink-50">{title}</h1>
            <hr className="rule-gold-left mt-4 w-16" />
            <p className="mt-5 text-sm leading-relaxed text-ink-300">
              {subtitle}
            </p>

            <div className="mt-9">{children}</div>
          </div>
        </div>
      </div>

      {/* ── Panneau éditorial ───────────────────────────────────────── */}
      <aside className="grain relative hidden overflow-hidden border-l border-border/60 bg-ink-850 lg:flex lg:items-center lg:justify-center">
        <div
          aria-hidden="true"
          className="glow-gold animate-breathe pointer-events-none absolute inset-0"
        />

        <figure className="relative max-w-md px-12 text-center">
          <div className="mx-auto mb-10 w-16">
            <div className="h-px bg-gold/60" />
            <div className="mt-1 h-px bg-gold/25" />
          </div>

          <blockquote className="font-display text-3xl leading-snug text-balance text-ink-50">
            {tagline}
          </blockquote>

          <div className="mx-auto mt-10 w-16">
            <div className="h-px bg-gold/25" />
            <div className="mt-1 h-px bg-gold/60" />
          </div>
        </figure>
      </aside>
    </div>
  );
}
