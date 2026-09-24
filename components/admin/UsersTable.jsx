"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  MoreVertical,
  Search,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EmptyState, Panel, StatusBadge } from "@/components/dashboard/ui";
import {
  deleteUserAdmin,
  suspendUser,
  updateUserRole,
} from "@/app/actions/admin";
import { useTranslation } from "@/lib/i18n/Context";

function RoleBadge({ role }) {
  const { t } = useTranslation();

  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs whitespace-nowrap text-gold">
        <Shield className="h-3 w-3" aria-hidden="true" />
        Admin
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs whitespace-nowrap text-ink-300">
      <UserRound className="h-3 w-3" aria-hidden="true" />
      {t("portal.admin.standard_user")}
    </span>
  );
}

export default function UsersTable({ users, currentUserId }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (user) =>
        (user.name || "").toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle) ||
        (user.company || "").toLowerCase().includes(needle),
    );
  }, [users, query]);

  /** Enveloppe commune : exécute l'action, signale, puis resynchronise. */
  function run(action, successMessage) {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        router.refresh();
      } catch (caught) {
        toast.error(caught.message || t("common.error"));
      }
    });
  }

  function toggleRole(user) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    run(
      () => updateUserRole(user.id, nextRole),
      t("portal.admin.role_updated")
        .replace("{name}", user.name || user.email)
        .replace(
          "{role}",
          nextRole === "admin" ? "admin" : t("portal.admin.standard_user"),
        ),
    );
  }

  function toggleSuspension(user) {
    run(
      () => suspendUser(user.id, !user.suspended),
      user.suspended
        ? t("portal.admin.account_reactivated")
        : t("portal.admin.account_suspended"),
    );
  }

  function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    run(
      () => deleteUserAdmin(target.id),
      t("portal.admin.account_deleted"),
    );
  }

  return (
    <>
      <div className="relative mb-6 max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          className="pl-9"
        />
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <EmptyState
            icon={users.length === 0 ? UserRound : Search}
            title={
              users.length === 0
                ? t("portal.admin.no_users")
                : t("common.no_results")
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left">
                  <th scope="col" className="px-5 py-3 font-normal text-ink-400">
                    {t("portal.admin.user")}
                  </th>
                  <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                    {t("portal.admin.role")}
                  </th>
                  <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                    {t("portal.admin.status")}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right font-normal text-ink-400"
                  >
                    {t("portal.admin.events")}
                  </th>
                  <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                    {t("portal.admin.registered_on")}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {filtered.map((user) => {
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-ink-800/40"
                    >
                      <th
                        scope="row"
                        className="max-w-xs px-5 py-3.5 text-left font-normal"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-ink-100">
                              {user.name || "—"}
                              {isSelf && (
                                <span className="ml-2 text-xs text-ink-400">
                                  ({t("portal.admin.you")})
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-ink-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </th>

                      <td className="px-3 py-3.5">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-3 py-3.5">
                        <StatusBadge
                          status={user.suspended ? "declined" : "active"}
                          label={
                            user.suspended
                              ? t("portal.admin.suspended")
                              : t("portal.admin.active")
                          }
                        />
                      </td>

                      <td
                        data-numeric
                        className="px-3 py-3.5 text-right text-ink-100"
                      >
                        {user._count?.events ?? 0}
                      </td>

                      <td className="px-3 py-3.5 whitespace-nowrap text-ink-300">
                        {new Date(user.createdAt).toLocaleDateString(
                          locale === "fr" ? "fr-FR" : "en-US",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-ink-400 hover:text-ink-50"
                              // Un admin ne peut agir ni sur son rôle, ni sur sa
                              // suspension, ni sur sa propre suppression : le
                              // menu entier n'a donc rien à proposer.
                              disabled={isSelf || isPending}
                              aria-label={`Actions pour ${user.name || user.email}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => toggleRole(user)}>
                              <Shield className="mr-2 h-4 w-4" />
                              {user.role === "admin"
                                ? t("portal.admin.demote_user")
                                : t("portal.admin.promote_admin")}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => toggleSuspension(user)}
                            >
                              {user.suspended ? (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              ) : (
                                <Ban className="mr-2 h-4 w-4" />
                              )}
                              {user.suspended
                                ? t("portal.admin.reactivate_account")
                                : t("portal.admin.suspend_account")}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => setPendingDelete(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("portal.admin.delete_forever")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Un seul dialogue pour toute la table : en instancier un par ligne
          monterait autant de dialogues qu'il y a d'utilisateurs. */}
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("portal.admin.delete_account_confirm").replace(
                "{name}",
                pendingDelete?.name || pendingDelete?.email || "",
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("portal.admin.delete_account_body")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("portal.admin.delete_forever")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
