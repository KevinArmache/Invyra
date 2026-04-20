"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, LayoutTemplate, Eye, Edit2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getTemplates, deleteTemplate } from "@/app/actions/template";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import { useTranslation } from "@/utils/i18n/Context";
import { useUser } from "@/hooks/useUser";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TEMPLATE_STATUS_EMOJI = {
  draft: "⚪",
  in_progress: "🟡",
  completed: "🟢",
};

function templateStatusBadgeKey(status) {
  if (status === "in_progress") return "status_in_progress_badge";
  if (status === "completed") return "status_completed_badge";
  return "status_draft_badge";
}

/** Édition / suppression : admin ou créateur du modèle */
function canManageTemplateCard(user, tmpl) {
  if (!user || !tmpl) return false;
  if (user.role === "admin") return true;
  return tmpl.userId != null && tmpl.userId === user.id;
}

export default function TemplatesPage() {
  const { user } = useUser();
  const { t, locale } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm(t("portal.templates.list.delete_confirm"))) return;
    try {
      await deleteTemplate(id);
      loadTemplates();
      toast.success(t("portal.templates.list.delete_success"));
    } catch (e) {
      toast.error(e.message);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTemplates = templates.filter((tmpl) => {
    if (!normalizedQuery) return true;
    return (tmpl.name || "").toLowerCase().includes(normalizedQuery);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("portal.templates.list.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("portal.templates.list.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/templates/new">
            <Plus className="w-4 h-4 mr-2" />{" "}
            {t("portal.templates.list.new_btn")}
          </Link>
        </Button>
      </div>

      <div className="max-w-md">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            locale === "fr" ? "Rechercher un modele..." : "Search a template..."
          }
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <LayoutTemplate className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t("portal.templates.list.no_templates")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {t("portal.templates.list.no_templates_desc")}
            </p>
            <Button asChild>
              <Link href="/dashboard/templates/new">
                <Plus className="w-4 h-4 mr-2" />{" "}
                {t("portal.templates.list.create_first")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">
              {locale === "fr" ? "Aucun modele trouve" : "No template found"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locale === "fr"
                ? "Essaie un autre mot-cle."
                : "Try another keyword."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((tmpl) => (
            <Card
              key={tmpl.id}
              className="overflow-hidden flex flex-col hover:border-primary/40 transition-colors"
            >
              <div className="relative aspect-3/4 bg-muted/20 border-b border-border overflow-hidden">
                {/* Scaled preview centered inside the card */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%) scale(0.55)",
                    transformOrigin: "top center",
                    width: "182%",
                    height: "182%",
                  }}
                >
                  <InvitationPreview
                    template={tmpl.config}
                    event={{
                      title: tmpl.name,
                      eventDate: new Date().toISOString(),
                      location: "Lieu de l'événement",
                      time: "19:00",
                      dressCode: "Tenue de soirée",
                    }}
                    guestName="Marie Dupont"
                  />
                </div>

                {/* Hover overlay for actions */}
                <div className="hidden lg:flex absolute inset-0 bg-black/40 items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow-lg"
                    onClick={(e) => {
                      e.preventDefault();
                      setPreviewTemplate(tmpl);
                    }}
                    title={t("portal.templates.list.preview_btn")}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {canManageTemplateCard(user, tmpl) && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        asChild
                        className="h-9 w-9 rounded-full shadow-lg"
                        title={t("portal.templates.list.edit_btn")}
                      >
                        <Link href={`/dashboard/templates/${tmpl.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9 rounded-full shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(tmpl.id);
                        }}
                        title={t("portal.events.list.delete_btn")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <CardContent className="p-4 flex flex-col gap-1 items-start bg-card z-10">
                <Badge
                  variant="secondary"
                  className="mb-1 font-normal text-xs gap-1.5 px-2 py-0.5"
                >
                  <span aria-hidden>
                    {TEMPLATE_STATUS_EMOJI[tmpl.status] ?? TEMPLATE_STATUS_EMOJI.draft}
                  </span>
                  {t(`portal.templates.list.${templateStatusBadgeKey(tmpl.status)}`)}
                </Badge>
                <h3 className="font-semibold text-lg truncate w-full">
                  {tmpl.name}
                </h3>

                {/* Buttons visible on mobile/tablet (no hover overlay) */}
                <div className="w-full flex gap-2 justify-start lg:hidden mt-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow"
                    onClick={(e) => {
                      e.preventDefault();
                      setPreviewTemplate(tmpl);
                    }}
                    title={t("portal.templates.list.preview_btn")}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  {canManageTemplateCard(user, tmpl) && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        asChild
                        className="h-9 w-9 rounded-full shadow"
                      >
                        <Link
                          href={`/dashboard/templates/${tmpl.id}`}
                          title={t("portal.templates.list.edit_btn")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9 rounded-full shadow"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(tmpl.id);
                        }}
                        title={t("portal.events.list.delete_btn")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-xs text-muted-foreground w-full">
                  {new Date(tmpl.createdAt).toLocaleDateString(locale)}
                </p>
                <div
                  className="mt-1 inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  title={
                    locale === "fr"
                      ? "Nombre de fois où ce modèle a été sélectionné"
                      : "Number of times this template was selected"
                  }
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>{tmpl._count?.eventCopies ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fullscreen Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-[95vw] md:max-w-[600px] h-[90vh] p-0 overflow-hidden bg-black border border-border">
          <DialogTitle className="sr-only">Aperçu du modèle</DialogTitle>
          {previewTemplate && (
            <div className="w-full h-full overflow-auto custom-scrollbar">
              <InvitationPreview
                template={previewTemplate.config}
                event={{
                  title: previewTemplate.name,
                  eventDate: new Date().toISOString(),
                  location: "Lieu de l'événement",
                  time: "19:00",
                  dressCode: "Tenue de soirée",
                }}
                guestName="Marie Dupont"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
