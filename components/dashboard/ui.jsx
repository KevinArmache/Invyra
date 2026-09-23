import Link from "next/link";

/**
 * Primitives partagées par les pages de l'espace connecté.
 *
 * Elles sont sans état et sans "use client" : chaque page reste un Server
 * Component. Les regrouper ici évite que chaque écran réinvente son en-tête ou
 * sa tuile de statistique, ce qui est exactement ce qui faisait dériver la
 * mise en page auparavant.
 */

/** En-tête de page : titre en serif, filet doré, action à droite. */
export function PageHeader({ title, subtitle, action }) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl leading-tight text-ink-50 sm:text-4xl">
          {title}
        </h1>
        <hr className="rule-gold-left mt-3.5 w-16" />
        {subtitle && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-300">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/**
 * Tuile de statistique.
 *
 * La valeur garde les chiffres proportionnels de la police : `tabular-nums`
 * donne à chaque chiffre la largeur d'un zéro, ce qui fait respirer un nombre
 * comme « 121 » de façon disgracieuse à cette taille. Les chiffres tabulaires
 * sont réservés aux colonnes qui doivent s'aligner verticalement.
 */
export function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-snug text-ink-300">{label}</p>
        {Icon && (
          <Icon
            className="h-4 w-4 shrink-0 text-gold/70"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-3 font-display text-4xl text-gold">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

/** Grille de statistiques : 1 colonne en mobile, 4 au-delà. */
export function StatGrid({ children }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  );
}

/** État vide : ce qui manque, et le seul geste qui le résout. */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {Icon && (
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
          <Icon className="h-5 w-5 text-gold/80" strokeWidth={1.5} />
        </span>
      )}
      <h2 className="text-xl text-ink-50">{title}</h2>
      {description && (
        <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-ink-300">
          {description}
        </p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

/** Carte d'une section, avec son propre titre et une action facultative. */
export function Panel({ title, description, action, children, className = "" }) {
  return (
    <section className={`surface ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-lg text-ink-50">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm text-ink-400">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES = {
  confirmed: "border-positive/30 bg-positive/10 text-positive",
  active: "border-positive/30 bg-positive/10 text-positive",
  completed: "border-positive/30 bg-positive/10 text-positive",
  pending: "border-caution/30 bg-caution/10 text-caution",
  in_progress: "border-caution/30 bg-caution/10 text-caution",
  declined: "border-negative/30 bg-negative/10 text-negative",
  draft: "border-border bg-secondary text-ink-300",
};

/** Pastille d'état. Une couleur inconnue retombe sur le gris neutre. */
export function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${style}`}
    >
      {label ?? status}
    </span>
  );
}

/** Lien discret « voir tout », avec son chevron. */
export function MoreLink({ href, children }) {
  return (
    <Link
      href={href}
      className="text-sm text-ink-300 transition-colors hover:text-gold"
    >
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}
