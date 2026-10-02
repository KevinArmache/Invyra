import { MailX } from "lucide-react";

/**
 * Lien inconnu ou révoqué : invitation, billet, souvenirs ou accueil. On ne
 * distingue jamais « inconnu » de « révoqué », pour ne pas confirmer
 * l'existence d'un lien à qui devine des jetons.
 *
 * @param {import("lucide-react").LucideIcon} [props.icon]
 */
export default function InvalidLink({ title, description, icon: Icon = MailX }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <span className="animate-scale-in relative mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
        <span className="pulse-ring absolute inset-0 rounded-full" />
        <Icon className="h-7 w-7 text-white/40" strokeWidth={1.25} />
      </span>
      <h1
        className="animate-rise font-display text-3xl text-white/90"
        style={{ "--rise-delay": "150ms" }}
      >
        {title}
      </h1>
      <span
        aria-hidden="true"
        className="animate-draw-x mt-5 block h-px w-16 bg-[#e2b963]/60"
        style={{ "--rise-delay": "300ms" }}
      />
      <p
        className="animate-rise mt-5 max-w-sm text-sm leading-relaxed text-white/45"
        style={{ "--rise-delay": "250ms" }}
      >
        {description}
      </p>
    </main>
  );
}
