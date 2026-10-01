"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";

import { useTranslation } from "@/lib/i18n/Context";

/**
 * L'invitation existe peut-être, mais le serveur n'a pas pu la lire (base qui
 * se réveille, coupure réseau). On propose de réessayer plutôt que d'annoncer
 * un lien invalide.
 */
export default function InvitationUnavailable() {
  const { t } = useTranslation();
  const [reloading, setReloading] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <span aria-hidden="true" className="animate-breathe mb-8 block">
        <span className="animate-draw-x block h-px w-16 bg-[#e2b963]/70" />
      </span>
      <h1 className="animate-rise font-display text-3xl text-white/90">
        {t("invite.unavailable_title")}
      </h1>
      <p
        className="animate-rise mt-3 max-w-sm text-sm leading-relaxed text-white/50"
        style={{ "--rise-delay": "120ms" }}
      >
        {t("invite.unavailable_desc")}
      </p>
      <button
        type="button"
        onClick={() => {
          setReloading(true);
          window.location.reload();
        }}
        disabled={reloading}
        className="animate-rise group mt-8 inline-flex items-center gap-2 rounded-full border border-[#e2b963]/40 px-6 py-3 text-xs tracking-[0.2em] text-[#e2b963] uppercase transition-colors hover:bg-[#e2b963]/10 disabled:opacity-60"
        style={{ "--rise-delay": "240ms" }}
      >
        <RotateCw
          className={`h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180 ${reloading ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {t("common.retry")}
      </button>
    </main>
  );
}
