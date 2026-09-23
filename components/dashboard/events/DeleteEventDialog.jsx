"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteEvent } from "@/app/actions/event";
import { useTranslation } from "@/utils/i18n/Context";

/**
 * Suppression d'un événement, derrière une confirmation explicite qui nomme
 * l'événement visé — `confirm()` ne disait pas lequel, ce qui rend l'erreur
 * facile quand plusieurs cartes se ressemblent.
 */
export default function DeleteEventDialog({
  eventId,
  eventTitle,
  onDeleted,
  trigger,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteEvent(eventId);
        toast.success(t("portal.events.details.actions.event_deleted"));
        setIsOpen(false);
        if (onDeleted) onDeleted();
        // Le serveur refait le rendu avec la liste à jour : pas d'état local
        // à resynchroniser.
        router.refresh();
      } catch (caught) {
        toast.error(caught.message || t("common.error"));
      }
    });
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-ink-400 hover:bg-destructive/10 hover:text-destructive"
            aria-label={t("portal.events.list.delete_btn")}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("portal.events.list.delete_btn")} « {eventTitle} » ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("portal.events.list.delete_confirm")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Sans cela le dialogue se ferme avant la fin de l'action et
              // l'utilisateur ne voit jamais l'état de chargement.
              event.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("portal.events.list.delete_btn")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
