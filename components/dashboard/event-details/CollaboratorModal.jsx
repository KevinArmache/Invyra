"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/Context";
import {
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
} from "@/app/actions/collaborator";

const ROLES = [
  { value: "editor", labelKey: "portal.events.details.role_editor" },
  { value: "viewer", labelKey: "portal.events.details.role_viewer" },
];

export default function CollaboratorModal({
  open,
  onClose,
  eventId,
  initialCollaborators = [],
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [role, setRole] = useState("editor");
  const [isPending, startTransition] = useTransition();

  function handleAdd(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email").trim();
    if (!email) return;

    startTransition(async () => {
      try {
        const collaborator = await addCollaborator(eventId, email, role);
        setCollaborators((previous) => [...previous, collaborator]);
        form.reset();
        toast.success(
          t("portal.events.details.collaborator_added").replace(
            "{name}",
            collaborator.user.name || collaborator.user.email,
          ),
        );
        // Le compteur du bouton parent vient du rendu serveur.
        router.refresh();
      } catch (caught) {
        toast.error(caught.message || t("common.error"));
      }
    });
  }

  function handleRemove(collaboratorId) {
    startTransition(async () => {
      try {
        await removeCollaborator(collaboratorId, eventId);
        setCollaborators((previous) =>
          previous.filter((item) => item.id !== collaboratorId),
        );
        toast.success(t("portal.events.details.collaborator_removed"));
        router.refresh();
      } catch (caught) {
        toast.error(caught.message || t("common.error"));
      }
    });
  }

  function handleRoleChange(collaboratorId, nextRole) {
    startTransition(async () => {
      try {
        const updated = await updateCollaboratorRole(
          collaboratorId,
          eventId,
          nextRole,
        );
        setCollaborators((previous) =>
          previous.map((item) =>
            item.id === collaboratorId ? { ...item, role: updated.role } : item,
          ),
        );
        toast.success(t("portal.events.details.role_updated"));
        router.refresh();
      } catch (caught) {
        toast.error(caught.message || t("common.error"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("portal.events.details.collaborators")}</DialogTitle>
          <DialogDescription>
            {t("portal.events.details.collaborators_hint")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-md border border-border bg-ink-800/40 p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="collaborator-email" className="sr-only">
                Email
              </Label>
              <Input
                id="collaborator-email"
                name="email"
                type="email"
                placeholder="collaborateur@exemple.com"
                required
              />
            </div>

            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {t("portal.events.new.buttons.add")}
          </Button>
        </form>

        {collaborators.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            {t("portal.events.details.no_collaborators")}
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {collaborators.map((collaborator) => (
              <li
                key={collaborator.id}
                className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-xs text-gold">
                  {(collaborator.user.name || collaborator.user.email)
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-100">
                    {collaborator.user.name || "—"}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {collaborator.user.email}
                  </p>
                </div>

                <Select
                  value={collaborator.role}
                  onValueChange={(next) =>
                    handleRoleChange(collaborator.id, next)
                  }
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-ink-400 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemove(collaborator.id)}
                  disabled={isPending}
                  aria-label={`Retirer ${collaborator.user.email}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
