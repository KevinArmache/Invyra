"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvitationEditor from "@/components/invitation/InvitationEditor";
import LivePreview from "@/components/invitation/LivePreview";
import ThemePicker from "@/components/invitation/theme-editor/ThemePicker";
import { TEMPLATE_CATEGORIES } from "@/lib/invitation/categories";
import { useTranslation } from "@/utils/i18n/Context";

/** Valeur du Select pour « sans catégorie » (un Select n'accepte pas ""). */
const NO_CATEGORY = "none";

/** Événement fictif servant à peupler l'aperçu pendant l'édition. */
const SAMPLE_EVENT = {
  title: "Gala de bienfaisance",
  eventDate: "2027-06-12T00:00:00.000Z",
  location: "Château de Fontainebleau",
  time: "19h30",
  dressCode: "Tenue de gala",
};

const STATUSES = [
  { value: "draft", labelKey: "portal.templates.editor.status_draft_option" },
  {
    value: "in_progress",
    labelKey: "portal.templates.editor.status_in_progress_option",
  },
  {
    value: "completed",
    labelKey: "portal.templates.editor.status_completed_option",
  },
];

export default function TemplateEditorForm({
  initialName = "",
  initialStatus = "draft",
  initialCategory = null,
  initialConfig,
  isEditing = false,
  allowCode = false,
  uploadEnabled = false,
  onSave,
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState(initialStatus || "draft");
  const [category, setCategory] = useState(initialCategory || NO_CATEGORY);
  // Sans configuration initiale, on commence par choisir un design.
  const [config, setConfig] = useState(initialConfig ?? null);
  const [isSaving, setIsSaving] = useState(false);
  // En dessous de `lg`, code et aperçu ne tiennent pas côte à côte : on bascule
  // de l'un à l'autre plutôt que de réduire les deux à l'illisible.
  const [mobilePane, setMobilePane] = useState("edit");

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.warning(t("portal.templates.editor.name_required"));
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        trimmed,
        config,
        status,
        category === NO_CATEGORY ? null : category,
      );
      toast.success(t("portal.templates.editor.success"));
      router.push("/dashboard/templates");
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
      setIsSaving(false);
    }
  }

  return (
    // Une fois le thème choisi, la page occupe exactement la hauteur visible
    // sur grand écran (100dvh moins les marges verticales du <main>, 2 × 2,5rem) :
    // éditeur et aperçu ont ainsi une hauteur définie à remplir.
    <div
      className={`flex min-h-[calc(100dvh-8rem)] flex-col ${
        config ? "lg:h-[calc(100dvh-5rem)]" : ""
      }`}
    >
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Link
            href="/dashboard/templates"
            className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("portal.templates.list.title")}
          </Link>
          <h1 className="mt-2 text-2xl leading-tight text-ink-50 sm:text-3xl">
            {isEditing
              ? t("portal.templates.editor.title_edit")
              : t("portal.templates.editor.title_new")}
          </h1>
          <hr className="rule-gold-left mt-3 w-14" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end xl:flex-nowrap">
          <div className="space-y-1.5">
            <Label htmlFor="template-name" className="text-xs text-ink-400">
              {t("portal.templates.editor.name_placeholder")}
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("portal.templates.editor.name_placeholder")}
              className="sm:w-52"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-category" className="text-xs text-ink-400">
              {t("portal.templates.categories.label")}
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="template-category" className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>
                  {t("portal.templates.categories.none")}
                </SelectItem>
                {TEMPLATE_CATEGORIES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`portal.templates.categories.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-status" className="text-xs text-ink-400">
              {t("portal.templates.editor.status_label")}
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="template-status" className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !config}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving
              ? t("portal.templates.editor.saving")
              : t("portal.templates.editor.save_btn")}
          </Button>
        </div>
      </header>

      {!config ? (
        <ThemePicker
          onPick={setConfig}
          allowCode={allowCode}
          onPickCode={() =>
            setConfig({ type: "code", html: "", css: "", js: "" })
          }
        />
      ) : (
        <>
          <div className="mb-4 lg:hidden">
            <Tabs value={mobilePane} onValueChange={setMobilePane}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">
                  {t("portal.themes.editor.mode_edit")}
                </TabsTrigger>
                <TabsTrigger value="preview">
                  {t("portal.templates.editor.mode_preview")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,440px)_1fr]">
            <div
              className={`min-h-[32rem] flex-col lg:flex lg:min-h-0 ${
                mobilePane === "edit" ? "flex" : "hidden"
              }`}
            >
              <InvitationEditor
                value={config}
                onChange={setConfig}
                allowCode={allowCode}
                uploadEnabled={uploadEnabled}
                preview={
                  <LivePreview
                    template={config}
                    event={SAMPLE_EVENT}
                    guestName="Marie Dupont"
                  />
                }
              />
            </div>

            <div
              className={`surface min-h-[32rem] items-center justify-center overflow-hidden p-4 sm:p-6 lg:flex lg:min-h-0 ${
                mobilePane === "preview" ? "flex" : "hidden"
              }`}
            >
              <div className="relative aspect-3/4 h-full max-h-full w-full max-w-[560px] overflow-hidden rounded-md border border-border/60 bg-ink-900 shadow-elevation-3">
                <LivePreview
                  template={config}
                  event={SAMPLE_EVENT}
                  guestName="Marie Dupont"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
