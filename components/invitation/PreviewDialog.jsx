"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Fenêtre d'aperçu d'une invitation (modèle de la galerie, invitation d'un
 * événement).
 *
 * Sur téléphone elle occupe tout l'écran, comme l'invitation que recevra
 * l'invité ; sur grand écran, c'est un panneau haut et étroit, à la largeur
 * d'un écran de téléphone, sans en dessiner la silhouette. Une barre en tête
 * porte le nom, les actions (partage, page publique) et la fermeture.
 *
 * @param {React.ReactNode} props.actions  boutons ajoutés avant la fermeture
 * @param {React.ReactNode} props.children l'aperçu, qui remplit le corps
 */
export default function PreviewDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  actions,
  children,
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        {...(subtitle ? {} : { "aria-describedby": undefined })}
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-ink-900 p-0 sm:h-[min(92dvh,58rem)] sm:max-w-[38rem] sm:rounded-2xl sm:border sm:border-border"
      >
        <div
          className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-ink-850 px-4 pb-3 sm:pt-3"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
        >
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-display text-base leading-snug font-normal text-ink-50 sm:text-lg">
              {title}
            </DialogTitle>
            {subtitle && (
              <DialogDescription className="truncate text-xs text-ink-400">
                {subtitle}
              </DialogDescription>
            )}
          </div>
          {actions}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-ink-300 hover:text-ink-50"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </div>

        <div className="relative min-h-0 flex-1 bg-black">
          <div className="absolute inset-0">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
