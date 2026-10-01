import Link from "next/link";

import AnimatedNumber from "@/components/common/AnimatedNumber";

/**
 * Primitives partagées par les pages de l'espace connecté.
 *
 * Elles sont sans état et sans "use client" : chaque page reste un Server
 * Component. Les regrouper ici évite que chaque écran réinvente son en-tête ou
 * sa tuile de statistique, ce qui est exactement ce qui faisait dériver la
 * mise en page auparavant.
 *
 * Le mouvement d'arrivée est en CSS (animate-rise et compagnie) : le haut
 * d'une page est visible dès le premier rendu, sans attendre le JavaScript.
 * Seuls les blocs plus bas peuvent attendre le défilement (`reveal`).
 */

/** En-tête de page : sur-titre facultatif, titre en serif, filet doré, action. */
export function PageHeader({ title, subtitle, action, eyebrow }) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="animate-fade-in eyebrow mb-2 text-gold/80">{eyebrow}</p>
        )}
        <h1 className="animate-rise text-3xl leading-tight text-ink-50 sm:text-4xl">
          {title}
        </h1>
        <hr
          className="rule-gold-left animate-draw-x mt-3.5 w-16"
          style={{ "--rise-delay": "180ms" }}
        />
        {subtitle && (
          <p
            className="animate-rise mt-4 max-w-2xl text-sm leading-relaxed text-ink-300"
            style={{ "--rise-delay": "90ms" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div
          className="animate-fade-in shrink-0"
          style={{ "--rise-delay": "200ms" }}
        >
          {action}
        </div>
      )}
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
 *
 * Un entier monte de 0 à sa valeur (AnimatedNumber) ; `suffix` le suit
 * (« % »). `progress` (0 à 1) ajoute une jauge sous la valeur. `index`
 * décale la tuile dans sa rangée.
 */
export function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  hint,
  progress,
  index = 0,
}) {
  const share =
    progress == null ? null : Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div
      className="animate-rise"
      style={{ "--rise-delay": `${100 + index * 80}ms` }}
    >
      <div className="group spotlight surface-interactive h-full rounded-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-snug text-ink-300">{label}</p>
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/5 transition-colors duration-300 group-hover:border-gold/45 group-hover:bg-gold/10">
              <Icon
                className="h-4 w-4 text-gold/80 transition-transform duration-500 group-hover:scale-110"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
          )}
        </div>
        <p className="mt-3 font-display text-4xl text-gold">
          <AnimatedNumber value={value} suffix={suffix} delay={250 + index * 110} />
        </p>
        {share != null && (
          <div
            className="mt-3 h-1 overflow-hidden rounded-full bg-gold/15"
            aria-hidden="true"
          >
            <div
              className="animate-grow-x h-full rounded-full bg-gold"
              style={{
                width: `${share}%`,
                "--rise-delay": `${350 + index * 110}ms`,
              }}
            />
          </div>
        )}
        {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
      </div>
    </div>
  );
}

/** Grille de statistiques : 1 colonne en mobile, 2 puis 4. */
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
        <span className="animate-float relative mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
          <span className="pulse-ring absolute inset-0 rounded-full" />
          <Icon className="h-5 w-5 text-gold/80" strokeWidth={1.5} />
        </span>
      )}
      <h2 className="animate-rise text-xl text-ink-50">{title}</h2>
      {description && (
        <p
          className="animate-rise mt-2.5 max-w-sm text-sm leading-relaxed text-ink-300"
          style={{ "--rise-delay": "80ms" }}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="animate-rise mt-7" style={{ "--rise-delay": "160ms" }}>
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * Carte d'une section, avec son propre titre et une action facultative.
 *
 * @param {number}  [props.delay]   arrivée différée (ms), pour les cascades
 * @param {boolean} [props.reveal]  apparaît au défilement plutôt qu'au
 *   chargement : seulement pour un bloc qui démarre sous la ligne de flottaison
 */
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
  delay = 0,
  reveal = false,
}) {
  return (
    <section
      data-reveal={reveal ? "" : undefined}
      style={reveal ? undefined : { "--rise-delay": `${delay}ms` }}
      className={`surface rounded-xl ${reveal ? "" : "animate-rise"} ${className}`}
    >
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
  archived: "border-border bg-secondary text-ink-400",
  draft: "border-border bg-secondary text-ink-300",
};

const STATUS_DOTS = {
  confirmed: "bg-positive",
  active: "bg-positive",
  completed: "bg-positive",
  pending: "bg-caution",
  in_progress: "bg-caution",
  declined: "bg-negative",
  archived: "bg-ink-400",
  draft: "bg-ink-400",
};

/**
 * Pastille d'état, avec un point de la même couleur. Le point d'un état
 * « en cours » (événement actif) respire. Une couleur inconnue retombe sur
 * le gris neutre. Passez toujours `label` traduit : la clé brute n'est
 * qu'un repli.
 */
export function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const dot = STATUS_DOTS[status] ?? STATUS_DOTS.draft;
  const live = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${style}`}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        {live && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dot}`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
      </span>
      {label ?? status}
    </span>
  );
}

/** Lien discret « voir tout », dont la flèche avance au survol. */
export function MoreLink({ href, children }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-sm text-ink-300 transition-colors hover:text-gold"
    >
      {children}
      <span
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}

/**
 * Anneau de progression : part de `value` dans `total` (présences sur
 * invités, par exemple). Le trait se dessine jusqu'à sa valeur ; la piste
 * est un pas plus clair du même or, pour que l'état se lise sur tout le tour.
 *
 * @param {string} props.label  ce que mesure l'anneau, pour les lecteurs
 *   d'écran (« 8 présents sur 12 invités »)
 */
export function ProgressRing({ value, total, label, size = 44, stroke = 3, delay = 0 }) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <span
      role="img"
      aria-label={label}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="color-mix(in oklch, var(--gold) 15%, transparent)"
          strokeWidth={stroke}
        />
        {ratio > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
            className="animate-ring-fill"
            style={{
              "--ring-circ": circumference,
              "--rise-delay": `${delay}ms`,
            }}
          />
        )}
      </svg>
      <span
        aria-hidden="true"
        className="absolute text-[11px] leading-none text-ink-100"
      >
        {Math.round(ratio * 100)}%
      </span>
    </span>
  );
}

const RSVP_SEGMENTS = [
  { key: "confirmed", fill: "var(--positive)" },
  { key: "declined", fill: "var(--negative)" },
  { key: "maybe", fill: "var(--info)" },
];

/**
 * Barre de réponses compacte (cartes d'événement). Les réponses données se
 * suivent dans l'ordre de RsvpBreakdown, séparées par un écart de 2 px ; la
 * piste vide figure les invités sans réponse. Le texte voisin donne les
 * nombres : la couleur n'est jamais seule à porter l'information.
 *
 * @param {{confirmed:number, declined:number, maybe:number}} props.counts
 * @param {number} props.total   invités
 * @param {string} props.label   résumé pour les lecteurs d'écran
 */
export function MiniRsvpBar({ counts, total, label, delay = 0 }) {
  const drawn = RSVP_SEGMENTS.filter((segment) => counts[segment.key] > 0);

  return (
    <div
      role="img"
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800"
    >
      {total > 0 && drawn.length > 0 && (
        <div
          className="animate-grow-x flex h-full"
          style={{ "--rise-delay": `${delay}ms` }}
        >
          {drawn.map((segment, index) => (
            <span
              key={segment.key}
              className="h-full first:rounded-l-full"
              style={{
                width: `${(counts[segment.key] / total) * 100}%`,
                background: segment.fill,
                marginLeft: index === 0 ? 0 : 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
