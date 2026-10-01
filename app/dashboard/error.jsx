"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Attrape les erreurs de rendu de la section connectée. Le message brut n'est
 * pas affiché : il peut contenir des détails de base de données. `digest`
 * permet de retrouver la trace complète dans les journaux serveur.
 */
export default function DashboardError({ error, reset }) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="animate-scale-in relative mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-negative/25 bg-negative/10">
        <AlertTriangle className="h-5 w-5 text-negative" strokeWidth={1.5} />
      </span>

      <h1 className="animate-rise text-2xl text-ink-50" style={{ "--rise-delay": "80ms" }}>
        {t("portal.error.title")}
      </h1>
      <p
        className="animate-rise mt-3 max-w-md text-sm leading-relaxed text-ink-300"
        style={{ "--rise-delay": "140ms" }}
      >
        {t("portal.error.desc")}
      </p>

      {error?.digest && (
        <p className="mt-4 font-mono text-xs text-ink-400">
          {t("portal.error.reference")} {error.digest}
        </p>
      )}

      <Button
        onClick={reset}
        className="animate-rise group mt-8"
        style={{ "--rise-delay": "200ms" }}
      >
        <RotateCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
        {t("portal.error.retry")}
      </Button>
    </div>
  );
}
