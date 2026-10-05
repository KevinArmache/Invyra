import { cn } from "@/lib/utils";

/**
 * Pastille ronde à l'initiale d'un nom, dans le style de celle du menu
 * latéral. Décorative : le nom est toujours écrit à côté.
 */
export default function InitialAvatar({ name, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-gold",
        className,
      )}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
