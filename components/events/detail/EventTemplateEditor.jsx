"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Code2, Info, LayoutTemplate, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvitationEditor from "@/components/editor/InvitationEditor";
import TemplateGallery from "@/components/templates/TemplateGallery";
import LivePreview from "@/components/editor/LivePreview";
import { EmptyState } from "@/components/shell/primitives";
import { emptyCodeConfig } from "@/lib/templates/config";
import { MusicField } from "@/components/editor/fields";
import { saveTemplate } from "@/app/actions/template";
import { toEditableConfig } from "@/lib/templates/validation";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Invitation d'un événement : on part d'un modèle de la galerie, puis on le
 * personnalise. Rien n'est écrit en base avant « Enregistrer » : choisir un
 * modèle ne fait que remplacer l'état local.
 *
 * La personnalisation porte sur la copie propre à l'événement, de l'écran
 * d'ouverture au pied de page : sans code pour tous, dans le code pour les
 * admins (voir InvitationEditor), qui peuvent aussi partir d'une page vierge.
 */
export default function EventTemplateEditor({
  event,
  templates,
  isAdmin = false,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [template, setTemplate] = useState(() =>
    toEditableConfig(event.invitationTemplate),
  );
  // Modèle de la galerie choisi depuis l'ouverture, pas encore enregistré.
  const [sourceId, setSourceId] = useState(null);
  const [pane, setPane] = useState(template ? "customize" : "gallery");
  const [isSaving, setIsSaving] = useState(false);

  const selectedId = sourceId ?? event.templateSourceId ?? null;
  const sourceName = templates?.find((item) => item.id === selectedId)?.name;

  function leave() {
    router.push(`/dashboard/events/${event.id}`);
    router.refresh();
  }

  async function handleSave() {
    if (!template) return;

    setIsSaving(true);
    try {
      await saveTemplate(event.id, template, sourceId ?? undefined);
      toast.success(t("portal.events.edit.template_saved"));
      leave();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
      setIsSaving(false);
    }
  }

  function handlePickFromGallery(templateId, config) {
    setTemplate(toEditableConfig(config));
    setSourceId(templateId);
    setPane("customize");
    toast.info(t("portal.events.edit.template_applied_pending"));
  }

  function renderCustomize() {
    if (!template) {
      return (
        <EmptyState
          icon={LayoutTemplate}
          title={t("portal.events.edit.no_preview")}
          description={t("portal.events.edit.empty_desc")}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setPane("gallery")}>
                {t("portal.events.edit.select_template")}
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => setTemplate(emptyCodeConfig())}
                >
                  <Code2 className="mr-2 h-4 w-4" />
                  {t("portal.events.edit.blank_code")}
                </Button>
              )}
            </div>
          }
        />
      );
    }
    return (
      <InvitationEditor
        value={template}
        onChange={setTemplate}
        allowCode={isAdmin}
        preview={
          <LivePreview
            template={template}
            event={event}
            guestName="Exemple Invité"
          />
        }
      />
    );
  }

  return (
    // Sur grand écran, la page occupe exactement la hauteur visible (100dvh
    // moins les marges verticales du <main>, 2 × 2,5rem) : l'éditeur de code
    // et l'aperçu ont ainsi une hauteur définie à remplir.
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col lg:h-[calc(100dvh-5rem)]">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/dashboard/events/${event.id}`}
            className="animate-fade-in group inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            {event.title}
          </Link>
          <h1 className="animate-rise mt-2 text-2xl leading-tight text-ink-50 sm:text-3xl">
            {t("portal.events.edit.configure_invitation")}
          </h1>
          <hr
            className="rule-gold-left animate-draw-x mt-3 w-14"
            style={{ "--rise-delay": "150ms" }}
          />
          <p
            className="animate-rise mt-3 flex max-w-xl items-start gap-2 text-sm leading-relaxed text-ink-400"
            style={{ "--rise-delay": "100ms" }}
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              {t("portal.events.edit.copy_notice")}
              {sourceName && (
                <>
                  {" "}
                  {t("portal.events.edit.copy_source")}{" "}
                  <span className="text-ink-100">« {sourceName} »</span>.
                </>
              )}
            </span>
          </p>
        </div>

        <Button size="lg" onClick={handleSave} disabled={isSaving || !template}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving
            ? t("portal.templates.editor.saving")
            : t("portal.events.edit.save_and_exit")}
        </Button>
      </header>

      {/* Sur écran large, réglages à gauche et aperçu à droite ; en dessous
          les deux s'empilent, l'aperçu conservant une hauteur fixe pour
          rester lisible. */}
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,440px)_1fr] xl:grid-cols-[minmax(0,500px)_1fr]">
        <div className="flex min-h-[32rem] flex-col lg:min-h-0">
          <Tabs
            value={pane}
            onValueChange={setPane}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gallery">
                {t("portal.events.edit.tab_gallery")}
              </TabsTrigger>
              <TabsTrigger value="customize">
                {t("portal.events.edit.tab_customize")}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="gallery"
              className="mt-4 min-h-0 flex-1 overflow-y-auto"
            >
              <TemplateGallery
                templates={templates}
                selectedId={selectedId}
                onSelect={handlePickFromGallery}
              />
            </TabsContent>

            <TabsContent
              value="customize"
              className="mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto"
            >
              {template && (
                <div className="surface mb-4 shrink-0 p-4">
                  <MusicField
                    value={template.music?.url ?? ""}
                    onChange={(url) =>
                      setTemplate((previous) => ({
                        ...previous,
                        music: url ? { url } : null,
                      }))
                    }
                  />
                </div>
              )}
              {renderCustomize()}
            </TabsContent>
          </Tabs>
        </div>

        <div className="surface relative flex min-h-[32rem] items-center justify-center overflow-hidden rounded-xl p-4 sm:p-6 lg:min-h-0">
          <div
            aria-hidden="true"
            className="glow-gold animate-breathe pointer-events-none absolute inset-0"
          />
          <div className="animate-scale-in relative aspect-3/4 h-full max-h-full w-full max-w-[560px] overflow-hidden rounded-[1.4rem] border border-ink-600 bg-ink-900 shadow-elevation-3 ring-1 ring-gold/10">
            {template ? (
              <LivePreview
                template={template}
                event={event}
                guestName="Exemple Invité"
              />
            ) : (
              <p className="flex h-full items-center justify-center p-6 text-center text-sm text-ink-400">
                {t("portal.events.edit.no_preview")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
