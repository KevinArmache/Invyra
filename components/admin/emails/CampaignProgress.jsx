import { StatusBadge } from "@/components/shell/primitives";

/**
 * Pièces communes à l'historique des envois (Server Component) et à la page
 * d'envoi (client) : sans état ni "use client", elles servent aux deux.
 */

/** État d'un envoi → style de pastille de StatusBadge. */
const BADGE_STATUS = {
  sending: "active",
  paused: "pending",
  sent: "completed",
};

/** Pastille d'état d'un envoi. `t` vient de getTranslations ou useTranslation. */
export function CampaignStatusBadge({ status, t }) {
  return (
    <StatusBadge
      status={BADGE_STATUS[status] ?? "draft"}
      label={t(`portal.campaigns.status_${status}`)}
    />
  );
}

/**
 * Barre d'avancement : la part des destinataires déjà traités. Les envoyés
 * en or, puis les échecs en rouge et les ignorés en gris ; le texte voisin
 * donne les nombres, la couleur n'est jamais seule à porter l'information.
 */
export function CampaignProgress({
  sent,
  failed = 0,
  skipped = 0,
  total,
  label,
  className = "",
}) {
  const share = (value) => (total > 0 ? Math.min(100, (value / total) * 100) : 0);
  const segments = [
    { value: sent, color: "bg-gold" },
    { value: failed, color: "bg-negative" },
    { value: skipped, color: "bg-ink-400" },
  ].filter((segment) => segment.value > 0);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={sent + failed + skipped}
      className={`flex h-1.5 w-full overflow-hidden rounded-full bg-ink-800 ${className}`}
    >
      {segments.map((segment) => (
        <span
          key={segment.color}
          className={`h-full transition-[width] duration-500 ${segment.color}`}
          style={{ width: `${share(segment.value)}%` }}
        />
      ))}
    </div>
  );
}
