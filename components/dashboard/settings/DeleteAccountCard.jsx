"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { deleteMyAccount } from "@/app/actions/auth";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/utils/i18n/Context";

/**
 * Suppression de compte.
 *
 * Le mot de confirmation est saisi dans le dialogue et non dans un
 * `window.prompt()` : la boîte native ne dit pas ce qui va être détruit, ne se
 * traduit pas et laisse le bouton actif même quand la saisie est fausse. Ici
 * le bouton reste désactivé tant que le mot exact n'est pas tapé.
 */
export default function DeleteAccountCard({ isAdmin }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);

  const confirmWord = t("settings.delete_confirm_word");
  const canDelete = confirmation.trim() === confirmWord && !isPending;

  async function handleDelete() {
    setIsPending(true);
    try {
      await deleteMyAccount();
      router.push("/");
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-lg border border-destructive/30 bg-destructive/5">
      <div className="border-b border-destructive/20 px-5 py-4">
        <h2 className="text-lg text-destructive">{t("settings.danger_zone")}</h2>
        <p className="mt-1 text-sm text-ink-400">{t("settings.irreversible")}</p>
      </div>

      <div className="p-5">
        <p className="mb-5 max-w-xl text-sm leading-relaxed text-ink-300">
          {t("settings.delete_desc")}
        </p>

        {isAdmin ? (
          <p className="text-sm text-caution">
            {t("settings.admin_cannot_delete")}
          </p>
        ) : (
          <AlertDialog
            onOpenChange={(open) => !open && setConfirmation("")}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                {t("settings.delete_account")}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("settings.delete_dialog_title")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.delete_dialog_body")}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-2">
                <Label htmlFor="delete-confirmation">
                  {t("settings.delete_type_to_confirm").replace(
                    "{word}",
                    confirmWord,
                  )}
                </Label>
                <Input
                  id="delete-confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  placeholder={confirmWord}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  {t("common.cancel")}
                </AlertDialogCancel>
                {/* Un bouton simple, pas AlertDialogAction : celui-ci ferme le
                    dialogue au clic, ce qui masquerait l'état de chargement. */}
                <Button
                  variant="destructive"
                  disabled={!canDelete}
                  onClick={handleDelete}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("settings.delete_account")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </section>
  );
}
