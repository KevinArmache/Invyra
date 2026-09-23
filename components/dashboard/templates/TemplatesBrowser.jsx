"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  CopyPlus,
  Eye,
  LayoutTemplate,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState, StatusBadge } from "@/components/dashboard/ui";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import {
  deleteTemplate,
  duplicateTemplate,
  setTemplateFeatured,
} from "@/app/actions/template";
import { useTranslation } from "@/utils/i18n/Context";

const STATUS_LABEL_KEY = {
  draft: "portal.templates.list.status_draft_badge",
  in_progress: "portal.templates.list.status_in_progress_badge",
  completed: "portal.templates.list.status_completed_badge",
};

/** Un modèle réutilisable n'est modifiable que par son auteur ou un admin. */
function canManage(template, currentUser) {
  if (currentUser.role === "admin") return true;
  return template.userId != null && template.userId === currentUser.id;
}

/** La duplication crée un modèle : réservée aux admins (voir duplicateTemplate). */
function canDuplicate(currentUser) {
  return currentUser.role === "admin";
}

/** Données fictives injectées dans les aperçus de modèles. */
const SAMPLE_EVENT = {
  title: "Soirée d'exemple",
  eventDate: "2027-06-12T00:00:00.000Z",
  location: "Domaine des Cyprès",
  time: "19:00",
  dressCode: "Tenue de soirée",
};

export default function TemplatesBrowser({ templates, currentUser }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return templates;
    return templates.filter((template) =>
      (template.name || "").toLowerCase().includes(needle),
    );
  }, [templates, query]);

  function handleFeature(id, featured) {
    startTransition(async () => {
      try {
        await setTemplateFeatured(id, featured);
        toast.success(
          t(
            featured
              ? "portal.templates.list.feature_success"
              : "portal.templates.list.unfeature_success",
          ),
        );
        router.refresh();
      } catch (caught) {
        toast.error(caught.message || t("common.error"));
      }
    });
  }

  function handleDuplicate(id) {
    startTransition(async () => {
      try {
        const copy = await duplicateTemplate(id);
        toast.success(t("portal.templates.list.duplicate_success"));
        router.push(`/dashboard/templates/${copy.id}`);
      } catch (caught) {
        toast.error(caught.message || t("common.error"));
      }
    });
  }

  function handleDelete(id) {
    startTransition(async () => {
      try {
        await deleteTemplate(id);
        toast.success(t("portal.templates.list.delete_success"));
        router.refresh();
      } catch (caught) {
        toast.error(caught.message || t("common.error"));
      }
    });
  }

  if (templates.length === 0) {
    return (
      <div className="surface">
        <EmptyState
          icon={LayoutTemplate}
          title={t("portal.templates.list.no_templates")}
          description={t("portal.templates.list.no_templates_desc")}
          action={
            currentUser.role === "admin" ? (
              <Button asChild>
                <Link href="/dashboard/templates/new">
                  <Plus size={18} className="mr-2" />
                  {t("portal.templates.list.create_first")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      </div>
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
          placeholder={t("portal.templates.list.search_placeholder")}
          aria-label={t("portal.templates.list.search_placeholder")}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Search}
            title={t("common.no_results")}
            description={t("portal.events.list.try_different_search")}
          />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => {
            const editable = canManage(template, currentUser);
            const duplicable = canDuplicate(currentUser);

            return (
              <li
                key={template.id}
                className="surface-interactive flex flex-col overflow-hidden"
              >
                {/* Vignette : le modèle est rendu à l'échelle réduite dans son
                    iframe, en lecture seule (son script ne s'exécute pas). */}
                <div className="relative aspect-3/4 overflow-hidden border-b border-border/60 bg-ink-900">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 left-1/2"
                    style={{
                      width: "250%",
                      height: "250%",
                      transform: "translateX(-50%) scale(0.4)",
                      transformOrigin: "top center",
                    }}
                  >
                    <InvitationPreview
                      template={template.config}
                      event={{ ...SAMPLE_EVENT, title: template.name }}
                      guestName="Marie Dupont"
                      readOnly
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreview(template)}
                    className="absolute inset-0 flex items-center justify-center bg-ink-900/70 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-ink-850 px-4 py-2 text-xs tracking-wider text-gold uppercase">
                      <Eye className="h-3.5 w-3.5" />
                      {t("portal.templates.list.preview_btn")}
                    </span>
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={template.status ?? "draft"}
                      label={t(
                        STATUS_LABEL_KEY[template.status] ??
                          STATUS_LABEL_KEY.draft,
                      )}
                    />
                    {template.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold">
                        <Star className="h-3 w-3" fill="currentColor" />
                        {t("portal.templates.list.featured_badge")}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 truncate text-base text-ink-50">
                    {template.name}
                  </h3>

                  <p className="mt-1 text-xs text-ink-400">
                    {new Date(template.createdAt).toLocaleDateString(
                      locale === "fr" ? "fr-FR" : "en-US",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </p>

                  <p
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-400"
                    title={t("portal.templates.list.usage_hint")}
                  >
                    <Copy className="h-3 w-3" aria-hidden="true" />
                    <span data-numeric>
                      {template._count?.eventCopies ?? 0}
                    </span>
                    <span>{t("portal.templates.list.usage_label")}</span>
                  </p>

                  {(editable || duplicable) && (
                    <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3">
                      {editable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8 text-ink-400 hover:text-ink-50"
                        >
                          <Link
                            href={`/dashboard/templates/${template.id}`}
                            aria-label={t("portal.templates.list.edit_btn")}
                            title={t("portal.templates.list.edit_btn")}
                          >
                            <Pencil size={15} />
                          </Link>
                        </Button>
                      )}

                      {duplicable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(template.id)}
                          disabled={isPending}
                          className="h-8 w-8 text-ink-400 hover:text-ink-50"
                          aria-label={t("portal.templates.list.duplicate_btn")}
                          title={t("portal.templates.list.duplicate_btn")}
                        >
                          <CopyPlus size={15} />
                        </Button>
                      )}

                      {currentUser.role === "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleFeature(template.id, !template.featured)
                          }
                          disabled={isPending}
                          aria-pressed={Boolean(template.featured)}
                          className={`h-8 w-8 ${
                            template.featured
                              ? "text-gold hover:text-gold-bright"
                              : "text-ink-400 hover:text-ink-50"
                          }`}
                          aria-label={t(
                            template.featured
                              ? "portal.templates.list.unfeature_btn"
                              : "portal.templates.list.feature_btn",
                          )}
                          title={t(
                            template.featured
                              ? "portal.templates.list.unfeature_btn"
                              : "portal.templates.list.feature_btn",
                          )}
                        >
                          <Star
                            size={15}
                            fill={template.featured ? "currentColor" : "none"}
                          />
                        </Button>
                      )}

                      {editable && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto h-8 w-8 text-ink-400 hover:bg-destructive/10 hover:text-destructive"
                              aria-label={t("portal.events.list.delete_btn")}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("portal.events.list.delete_btn")} «{" "}
                                {template.name} » ?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("portal.templates.list.delete_confirm")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isPending}>
                                {t("common.cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(clickEvent) => {
                                  clickEvent.preventDefault();
                                  handleDelete(template.id);
                                }}
                                disabled={isPending}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t("portal.events.list.delete_btn")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="h-[90vh] max-w-[95vw] overflow-hidden border-border bg-black p-0 md:max-w-[620px]">
          <DialogTitle className="sr-only">
            {t("portal.templates.list.preview_btn")}
          </DialogTitle>
          {preview && (
            <div className="h-full w-full overflow-auto">
              {/* Aperçu vivant : le script tourne (effets, compte à rebours,
                  réponse RSVP simulée). Rien n'est envoyé : aucune page
                  n'écoute les réponses ici. */}
              <InvitationPreview
                template={preview.config}
                event={{ ...SAMPLE_EVENT, title: preview.name }}
                guestName="Marie Dupont"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
