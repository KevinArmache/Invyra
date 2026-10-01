import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import LostLetter from "@/components/common/LostLetter";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Élément introuvable dans l'espace connecté (événement supprimé, modèle
 * d'un autre compte…). La coquille reste en place : on n'est pas perdu, on
 * repart du tableau de bord.
 */
export default async function DashboardNotFound() {
  const { t } = await getTranslations();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pb-10 text-center">
      <LostLetter />
      <h1
        className="animate-rise mt-12 text-3xl text-ink-50 sm:text-4xl"
        style={{ "--rise-delay": "1300ms" }}
      >
        {t("notfound.inside_title")}
      </h1>
      <p
        className="animate-rise mt-4 max-w-sm text-sm leading-relaxed text-ink-300"
        style={{ "--rise-delay": "1400ms" }}
      >
        {t("notfound.inside_desc")}
      </p>
      <div className="animate-rise mt-8" style={{ "--rise-delay": "1500ms" }}>
        <Button asChild className="group">
          <Link href="/dashboard">
            <ArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            {t("notfound.inside_back")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
