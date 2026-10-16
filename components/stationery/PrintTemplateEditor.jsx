"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import { INVYRA_THEME } from "@/components/editor/CodeTemplateEditor";
import PaperFace from "@/components/stationery/PaperFace";
import { mainPiece } from "@/lib/print/config";
import { formatDimensions } from "@/lib/print/formats";
import { availablePapers } from "@/lib/print/options";
import { SAMPLE_GUEST, samplePrintEvent } from "@/lib/print/sample";
import { TEMPLATE_CATEGORIES } from "@/lib/templates/categories";
import { useTranslation } from "@/lib/i18n/Context";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/** Valeur du Select pour « sans catégorie ». */
const NO_CATEGORY = "none";

const STATUSES = ["draft", "in_progress", "completed"];

/**
 * Édition d'un modèle papier de la galerie, réservée aux admins : un onglet
 * de code par face, plus le CSS partagé, et l'aperçu de la face en cours à
 * taille réduite (lib/print/document.js). Le format est celui du modèle :
 * pour en changer, partez d'un autre modèle ou du script d'insertion.
 *
 * @param {(name, config, status, category) => Promise} props.onSave
 *   action liée à l'identifiant du modèle (updatePrintTemplate)
 */
export default function PrintTemplateEditor({ initialName, initialStatus, initialCategory, initialConfig, onSave }) {
  const { t } = useTranslation();
  const s = (key) => t(`stationery.${key}`);
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState(initialStatus ?? "draft");
  const [category, setCategory] = useState(initialCategory ?? NO_CATEGORY);
  const [config, setConfig] = useState(initialConfig);
  const { format } = mainPiece(config);
  const [pane, setPane] = useState(format?.faces[0] ?? "css");
  const [saving, setSaving] = useState(false);
  const event = useMemo(
    () => samplePrintEvent(category === NO_CATEGORY ? null : category),
    [category],
  );

  if (!format) return null;

  function update(value) {
    setConfig((current) =>
      pane === "css"
        ? { ...current, css: value }
        : {
            ...current,
            pieces: current.pieces.map((piece, index) =>
              index === 0 ? { ...piece, faces: { ...piece.faces, [pane]: value } } : piece,
            ),
          },
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.warning(t("portal.templates.editor.name_required"));
      return;
    }
    setSaving(true);
    try {
      await onSave(name.trim(), config, status, category === NO_CATEGORY ? null : category);
      toast.success(t("portal.templates.editor.success"));
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  const previewFace = pane === "css" ? format.faces[0] : pane;
  const value = pane === "css" ? config.css : config.pieces[0].faces[pane];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/templates?medium=print"
          className="group inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          {s("editor.back")}
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {t("portal.templates.editor.save_btn")}
        </Button>
      </div>

      <div className="surface grid gap-4 rounded-xl p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="print-name">{s("editor.name_label")}</Label>
          <Input id="print-name" value={name} onChange={(changeEvent) => setName(changeEvent.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>{s("editor.category_label")}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>{t("portal.templates.categories.none")}</SelectItem>
              {TEMPLATE_CATEGORIES.map((key) => (
                <SelectItem key={key} value={key}>
                  {t(`portal.templates.categories.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>{t("portal.templates.editor.status_label")}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((key) => (
                <SelectItem key={key} value={key}>
                  {t(`portal.templates.editor.status_${key}_option`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>{s("paper_label")}</Label>
          <Select value={config.paper} onValueChange={(paper) => setConfig((current) => ({ ...current, paper }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availablePapers().map((paper) => (
                <SelectItem key={paper.id} value={paper.id}>
                  {s(`papers.${paper.id}.name`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-ink-400 sm:col-span-2 lg:col-span-4">
          {s(`formats.${format.id}`)} · <span data-numeric>{formatDimensions(format.trim)}</span> · {s("editor.format_hint")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="surface flex min-h-[32rem] flex-col overflow-hidden rounded-xl">
          <div role="tablist" className="flex flex-wrap gap-1 border-b border-border/60 p-2">
            {[...format.faces, "css"].map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={pane === key}
                onClick={() => setPane(key)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  pane === key ? "bg-gold/15 text-ink-50" : "text-ink-400 hover:text-ink-100"
                }`}
              >
                {key === "css" ? s("editor.css_tab") : s(`faces.${key}`)}
              </button>
            ))}
          </div>
          <div className="relative min-h-[28rem] flex-1 bg-ink-850">
            <div className="absolute inset-0">
              <MonacoEditor
                key={pane}
                height="100%"
                language={pane === "css" ? "css" : "html"}
                value={value}
                onChange={(next) => update(next ?? "")}
                beforeMount={(monaco) => monaco.editor.defineTheme("invyra", INVYRA_THEME)}
                theme="invyra"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12.5,
                  fontFamily: "var(--font-geist-mono), ui-monospace, Menlo, Consolas, monospace",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="rounded-xl border border-border/60 p-6"
            style={{ background: "radial-gradient(80% 70% at 50% 30%, var(--ink-850), var(--ink-900) 75%)" }}
          >
            <div className="mx-auto max-w-sm overflow-hidden rounded-[3px] shadow-[0_18px_40px_-14px_rgb(0_0_0/0.8)]">
              <PaperFace config={config} face={previewFace} event={event} guestName={SAMPLE_GUEST} lazy={false} />
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-ink-400">{s(`faces.${previewFace}`)}</p>
        </div>
      </div>
    </div>
  );
}
