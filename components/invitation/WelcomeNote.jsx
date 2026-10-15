"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import { useTranslation } from "@/lib/i18n/Context";

/**
 * Encart affiché à un invité qui vient de s'inscrire par le lien unique
 * (/invite/<jeton>?welcome=1), une fois l'enveloppe ouverte : cette adresse
 * est désormais son invitation personnelle, il peut la copier ou se
 * l'envoyer sur WhatsApp pour la retrouver.
 *
 * Même style que la barre de l'invité (GuestBar) : sombre et translucide,
 * lisible sur n'importe quel modèle.
 */
export default function WelcomeNote({ eventTitle }) {
  const { t } = useTranslation();
  const w = (key) => t(`invite.welcome.${key}`);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  // L'adresse sans « ?welcome=1 » : c'est elle que l'invité garde. L'encart
  // n'apparaît qu'une fois l'enveloppe ouverte, donc jamais au rendu serveur.
  const [url] = useState(() =>
    typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`,
  );

  // Un rechargement de la page ne doit pas rouvrir l'encart.
  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);

  if (!open || !url) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(w("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.error"));
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    w("whatsapp_message").replace("{title}", eventTitle).replace("{url}", url),
  )}`;

  const pill =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 text-xs font-medium text-white transition-colors duration-300 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none";

  return (
    <aside
      role="status"
      className="animate-rise fixed inset-x-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 mx-auto max-w-md rounded-2xl border border-white/15 bg-black/70 p-4 text-white shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{w("title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">{w("desc")}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("common.close")}
          className="-mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={pill}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {w("copy")}
        </button>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={pill}>
          <MessageCircle className="h-3.5 w-3.5" />
          {w("whatsapp")}
        </a>
      </div>
    </aside>
  );
}
