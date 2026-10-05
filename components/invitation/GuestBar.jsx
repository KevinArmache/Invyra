"use client";

import { useState } from "react";
import Link from "next/link";
import { FileDown, Images, Loader2, Route, Ticket } from "lucide-react";
import { toast } from "sonner";

import { downloadFile } from "@/lib/download";
import { useTranslation } from "@/lib/i18n/Context";
import { directionsPath } from "@/lib/itinerary";

/**
 * Espace de l'invité, par-dessus son invitation : « Mon billet » une fois sa
 * présence confirmée, « Itinéraire » si l'événement a un lieu, « Souvenirs »
 * (livre d'or, photos et vidéos) si l'hôte les a ouverts, et toujours
 * « Télécharger », qui enregistre l'invitation en PDF, à son nom et fidèle au
 * modèle (route invite/[token]/pdf).
 *
 * En bas à gauche : le bouton de la musique occupe le coin droit (voir
 * lib/invitation/opening.js). Pilules sombres et translucides, lisibles sur
 * n'importe quel modèle, sans en reprendre les couleurs. Sur mobile, les
 * pilules se réduisent à leur icône pour masquer le moins possible du modèle.
 */
export default function GuestBar({ token, showTicket, showDirections, showMemories }) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  async function downloadPdf() {
    setDownloading(true);
    try {
      await downloadFile(`/invite/${token}/pdf`, "invitation.pdf");
    } catch {
      toast.error(t("invite.pdf_error"));
    } finally {
      setDownloading(false);
    }
  }

  const pill =
    "pointer-events-auto inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 text-xs sm:px-4 font-medium text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none";

  return (
    <nav
      aria-label={t("invite.guest_bar.label")}
      className="animate-rise pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-10 flex gap-2"
    >
      {showTicket && (
        <Link href={`/invite/${token}/ticket`} className={pill}>
          <Ticket className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t("invite.guest_bar.ticket")}</span>
        </Link>
      )}
      {showDirections && (
        <Link href={directionsPath(token)} className={pill}>
          <Route className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t("invite.guest_bar.directions")}</span>
        </Link>
      )}
      {showMemories && (
        <Link href={`/invite/${token}/memories`} className={pill}>
          <Images className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t("invite.guest_bar.memories")}</span>
        </Link>
      )}
      <button
        type="button"
        onClick={downloadPdf}
        disabled={downloading}
        aria-busy={downloading}
        className={`${pill} disabled:cursor-wait disabled:opacity-80`}
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileDown className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="sr-only sm:not-sr-only">
          {downloading ? t("invite.guest_bar.pdf_loading") : t("invite.guest_bar.pdf")}
        </span>
      </button>
    </nav>
  );
}
