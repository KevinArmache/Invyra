/**
 * L'échantillon d'invitation affiché dans le héros.
 *
 * C'est une carte réelle, pas une capture : elle montre ce que l'éditeur
 * produit et reste nette à toutes les tailles. Elle est décorative pour les
 * lecteurs d'écran — le texte de la page dit déjà de quoi il s'agit.
 *
 * Aucun JavaScript : l'entrée est une animation CSS, donc la carte est peinte
 * au premier rendu serveur plutôt qu'après l'hydratation.
 */
export default function InvitationShowcase() {
  return (
    <div
      aria-hidden="true"
      className="animate-rise-card relative mx-auto w-full max-w-sm select-none"
      style={{ "--rise-delay": "250ms" }}
    >
      {/* Halo doré derrière la carte : il la détache du fond sans bordure. */}
      <div className="glow-gold animate-breathe pointer-events-none absolute -inset-16 -z-10" />

      <div className="grain relative overflow-hidden rounded-lg border border-gold/25 bg-ink-850 px-8 py-12 text-center shadow-elevation-3">
        {/* Double filet : le code visuel du faire-part gravé. */}
        <div className="mx-auto mb-8 w-20">
          <div className="h-px bg-gold/60" />
          <div className="mt-1 h-px bg-gold/25" />
        </div>

        <p className="eyebrow mb-6 text-gold/70">Save the date</p>

        <p className="font-display text-4xl leading-tight text-ink-50">
          Camille
          <span className="mx-2 align-middle text-2xl text-gold">&</span>
          Nour
        </p>

        <div className="my-7 flex items-center justify-center gap-3 text-ink-300">
          <span className="h-px w-8 bg-ink-600" />
          <span className="text-xs tracking-[0.2em] uppercase">
            14 Juin 2026
          </span>
          <span className="h-px w-8 bg-ink-600" />
        </div>

        <p className="text-sm leading-relaxed text-ink-300">
          Domaine des Cyprès
          <br />
          Aix-en-Provence
        </p>

        <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-2 text-xs tracking-wider text-gold uppercase">
          Je confirme ma présence
        </div>

        <div className="mx-auto mt-10 w-20">
          <div className="h-px bg-gold/25" />
          <div className="mt-1 h-px bg-gold/60" />
        </div>
      </div>

      {/* Étiquette flottante : rappelle que la carte est du code et non une
          image, ce qui est l'argument central du produit. */}
      <div
        className="animate-rise absolute -right-3 -bottom-4 rounded-md border border-border bg-popover px-3 py-2 shadow-elevation-2 sm:-right-8"
        style={{ "--rise-delay": "900ms" }}
      >
        <code className="font-mono text-[11px] text-ink-300">
          &lt;h1&gt;<span className="text-gold">{"{{guest.name}}"}</span>
          &lt;/h1&gt;
        </code>
      </div>
    </div>
  );
}
