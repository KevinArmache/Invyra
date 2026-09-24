"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";

/**
 * L'invitation existe peut-être, mais le serveur n'a pas pu la lire (base qui
 * se réveille, coupure réseau). On propose de réessayer plutôt que d'annoncer
 * un lien invalide.
 */
export default function InvitationUnavailable() {
  const [reloading, setReloading] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <span aria-hidden="true" className="mb-8 block h-px w-16 bg-[#e2b963]/70" />
      <h1 className="font-display text-3xl text-white/90">
        Votre invitation arrive
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50">
        Elle n&apos;a pas pu être chargée cette fois-ci. Réessayez dans un
        instant : votre lien est bien valide.
      </p>
      <button
        type="button"
        onClick={() => {
          setReloading(true);
          window.location.reload();
        }}
        disabled={reloading}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#e2b963]/40 px-6 py-3 text-xs tracking-[0.2em] text-[#e2b963] uppercase transition-colors hover:bg-[#e2b963]/10 disabled:opacity-60"
      >
        <RotateCw
          className={`h-3.5 w-3.5 ${reloading ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        Réessayer
      </button>
    </main>
  );
}
