"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Attrape les erreurs de rendu de la section connectée. Le message brut n'est
 * pas affiché : il peut contenir des détails de base de données. `digest`
 * permet de retrouver la trace complète dans les journaux serveur.
 */
export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-negative/25 bg-negative/10">
        <AlertTriangle className="h-5 w-5 text-negative" strokeWidth={1.5} />
      </span>

      <h1 className="text-2xl text-ink-50">Cette page n’a pas pu s’afficher</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-300">
        Une erreur est survenue pendant le chargement. Réessayez — si le
        problème persiste, rechargez la page.
      </p>

      {error?.digest && (
        <p className="mt-4 font-mono text-xs text-ink-400">
          Référence : {error.digest}
        </p>
      )}

      <Button onClick={reset} className="mt-8">
        <RotateCw className="mr-2 h-4 w-4" />
        Réessayer
      </Button>
    </div>
  );
}
