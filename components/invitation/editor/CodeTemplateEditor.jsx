"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Braces,
  Check,
  Code2,
  Copy,
  Eye,
  EyeOff,
  MailOpen,
  Maximize2,
  Minimize2,
  Palette,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

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
import {
  DEFAULT_CSS,
  DEFAULT_HTML,
  DEFAULT_JS,
} from "@/lib/invitation/code-starter";
import OpeningFields from "@/components/invitation/editor/OpeningFields";
import { openingToCode } from "@/lib/invitation/opening";
import { normalizeOpening } from "@/lib/invitation/shared";
import { CODE_TYPE, isCodeConfig } from "@/lib/invitation/template-config";
import { useTranslation } from "@/lib/i18n/Context";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

/**
 * Thème Monaco accordé à la palette Invyra.
 *
 * Le thème `vs-dark` livré avec Monaco est bleuté et plus clair que nos
 * surfaces : l'éditeur flottait visiblement au-dessus du reste de la page.
 * Les valeurs sont en hexadécimal parce que Monaco n'accepte pas oklch().
 */
const INVYRA_THEME = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "746f69", fontStyle: "italic" },
    { token: "string", foreground: "e2b963" },
    { token: "keyword", foreground: "f2b250" },
    { token: "number", foreground: "55ca86" },
    { token: "tag", foreground: "f2b250" },
    { token: "attribute.name", foreground: "9e9992" },
    { token: "attribute.value", foreground: "e2b963" },
    { token: "delimiter", foreground: "9e9992" },
  ],
  colors: {
    "editor.background": "#100d0b",
    "editor.foreground": "#eae6de",
    "editorLineNumber.foreground": "#5a5550",
    "editorLineNumber.activeForeground": "#e2b963",
    "editor.selectionBackground": "#e2b96333",
    "editor.lineHighlightBackground": "#1a1613",
    "editorCursor.foreground": "#e2b963",
    "editorIndentGuide.background1": "#241f1b",
    "editorIndentGuide.activeBackground1": "#3a332d",
  },
};

const VARIABLES = [
  "{{EVENT_TITLE}}",
  "{{GUEST_NAME}}",
  "{{EVENT_DATE}}",
  "{{EVENT_LOCATION}}",
  "{{TIME}}",
  "{{DRESS_CODE}}",
  "{{COUNTDOWN_DATE}}",
  "{{MONOGRAM}}",
];

const PANES = [
  { key: "html", label: "HTML", icon: Code2 },
  { key: "css", label: "CSS", icon: Palette },
  { key: "js", label: "JavaScript", icon: Braces },
];

/** Nom de fichier affiché au-dessus de l'éditeur. */
const FILES = {
  invitation: { html: "invitation.html", css: "styles.css", js: "rsvp.js" },
  opening: { html: "opening.html", css: "opening.css", js: "opening.js" },
};

/**
 * Éditeur des templates code.
 *
 * Deux espaces : l'invitation elle-même et son écran d'ouverture (Digital
 * Invitation Opening). L'ouverture se règle par formulaire, ou s'écrit en
 * HTML/CSS/JS à partir de l'ouverture standard (`openingCode`).
 *
 * Plein écran : l'éditeur couvre toute la fenêtre, aperçu à côté sur grand
 * écran. Seules les classes du conteneur changent : Monaco n'est pas
 * remonté, le curseur et l'historique d'annulation sont conservés.
 *
 * @param {React.ReactNode} [props.preview]  aperçu affiché en plein écran
 */
export default function CodeTemplateEditor({ template, onChange, preview }) {
  const { t } = useTranslation();
  const [scope, setScope] = useState("invitation");
  const [activePane, setActivePane] = useState("html");
  const [copied, setCopied] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // En plein écran : la page derrière ne défile plus, Échap en sort. Une
  // touche Échap déjà traitée ailleurs (suggestion Monaco, boîte de dialogue
  // ouverte) est ignorée.
  useEffect(() => {
    if (!fullscreen) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    function handleKey(event) {
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        !document.querySelector('[role="alertdialog"], [role="dialog"]')
      ) {
        setFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [fullscreen]);

  // Toute invitation a un écran d'ouverture, template code compris.
  const [opening, setOpening] = useState(() =>
    normalizeOpening(template?.opening),
  );
  // Ouverture écrite en code : null tant qu'on garde l'ouverture standard.
  const [openingCode, setOpeningCode] = useState(() =>
    template?.openingCode?.html
      ? {
          html: template.openingCode.html,
          css: template.openingCode.css ?? "",
          js: template.openingCode.js ?? "",
        }
      : null,
  );

  const [sources, setSources] = useState(() => ({
    html: template?.html || DEFAULT_HTML,
    css: template?.css || DEFAULT_CSS,
    js: template?.js || DEFAULT_JS,
  }));

  // `onChange` change souvent d'identité chez l'appelant ; le garder dans une
  // ref évite de relancer l'effet de remontée à chaque rendu du parent.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Remonte l'état courant au parent. Fait dans un effet plutôt que dans le
  // gestionnaire de frappe : le parent était auparavant mis à jour pendant le
  // rendu de l'enfant, ce qui déclenchait un rendu en cascade par caractère.
  useEffect(() => {
    // Mise à jour fonctionnelle : on garde ce que le parent a ajouté à côté
    // du code (musique, polices…) au lieu de l'écraser à chaque frappe.
    onChangeRef.current((previous) => ({
      ...(isCodeConfig(previous) ? previous : {}),
      type: CODE_TYPE,
      ...sources,
      opening,
      openingCode,
    }));
  }, [sources, opening, openingCode]);

  const update = useCallback(
    (pane, value) => {
      if (scope === "opening") {
        setOpeningCode((previous) =>
          previous ? { ...previous, [pane]: value ?? "" } : previous,
        );
      } else {
        setSources((previous) => ({ ...previous, [pane]: value ?? "" }));
      }
    },
    [scope],
  );

  const current = scope === "opening" ? openingCode : sources;
  // Ouverture standard : pas de code à afficher, seulement ses réglages.
  const showCode = scope === "invitation" || Boolean(openingCode);

  function reset() {
    setSources({ html: DEFAULT_HTML, css: DEFAULT_CSS, js: DEFAULT_JS });
  }

  async function copyActive() {
    try {
      await navigator.clipboard.writeText(current?.[activePane] ?? "");
      setCopied(activePane);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : sans retour visuel,
      // l'utilisateur sélectionnera à la main.
    }
  }

  const hasPreview = fullscreen && Boolean(preview);

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex gap-4 bg-background p-3 sm:p-4"
          : "flex min-h-0 flex-1 flex-col"
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        {/* ── Invitation / Ouverture ──────────────────────────────────── */}
        <div className="flex shrink-0 gap-2">
          <div
            role="tablist"
            aria-label={t("portal.editor.code.scope_label")}
            className="grid flex-1 grid-cols-2 gap-1 rounded-md border border-border bg-ink-850 p-1"
          >
            {[
              { key: "invitation", icon: Code2 },
              { key: "opening", icon: MailOpen },
            ].map((item) => {
              const isActive = item.key === scope;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setScope(item.key)}
                  className={`flex items-center justify-center gap-1.5 rounded px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? "bg-ink-800 text-ink-50 shadow-elevation-1"
                      : "text-ink-400 hover:text-ink-100"
                  }`}
                >
                  <item.icon
                    className={`h-3.5 w-3.5 ${isActive ? "text-gold" : ""}`}
                    strokeWidth={1.75}
                  />
                  {t(`portal.editor.code.scope_${item.key}`)}
                </button>
              );
            })}
          </div>

          {hasPreview && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowPreview((value) => !value)}
              aria-pressed={showPreview}
              aria-label={t(
                showPreview
                  ? "portal.editor.code.hide_preview"
                  : "portal.editor.code.show_preview",
              )}
              title={t(
                showPreview
                  ? "portal.editor.code.hide_preview"
                  : "portal.editor.code.show_preview",
              )}
              className="hidden h-auto shrink-0 lg:inline-flex"
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setFullscreen((value) => !value)}
            aria-pressed={fullscreen}
            aria-label={t(
              fullscreen
                ? "portal.editor.code.exit_fullscreen"
                : "portal.editor.code.fullscreen",
            )}
            title={t(
              fullscreen
                ? "portal.editor.code.exit_fullscreen_hint"
                : "portal.editor.code.fullscreen",
            )}
            className="h-auto shrink-0"
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* ── Ouverture : réglages, ou passage en code ────────────────── */}
        {scope === "opening" && (
          <div className="surface space-y-4 p-4 text-xs">
            {openingCode ? (
              <>
                <p className="leading-relaxed text-ink-400">
                  {t("portal.editor.code.opening_code_hint")}
                </p>
                <OpeningFields
                  value={opening}
                  onChange={setOpening}
                  only={["monogram"]}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                      {t("portal.editor.code.opening_standard_btn")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("portal.editor.code.opening_standard_title")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("portal.editor.code.opening_standard_desc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("common.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={() => setOpeningCode(null)}>
                        {t("portal.editor.code.opening_standard_confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <OpeningFields value={opening} onChange={setOpening} />
                <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="leading-relaxed text-ink-400">
                    {t("portal.editor.code.opening_to_code_desc")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setOpeningCode(openingToCode(opening));
                      setActivePane("html");
                    }}
                  >
                    <Code2 className="mr-1.5 h-3.5 w-3.5" />
                    {t("portal.editor.code.opening_to_code_btn")}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Aide variables ──────────────────────────────────────────── */}
        <details className="surface group px-4 py-3 text-xs">
          <summary className="cursor-pointer list-none text-ink-300 transition-colors hover:text-ink-50">
            <span className="eyebrow">Variables disponibles</span>
          </summary>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {VARIABLES.map((variable) => (
              <code
                key={variable}
                className="rounded border border-gold/20 bg-gold/5 px-1.5 py-0.5 font-mono text-[11px] text-gold"
              >
                {variable}
              </code>
            ))}
          </div>
          <p className="mt-3 leading-relaxed text-ink-400">
            Le JavaScript est injecté dans l&apos;iframe de l&apos;invitation.
            Il transmet les réponses RSVP au moyen de <code>postMessage</code>.
          </p>
        </details>

        {showCode && (
          <>
            {/* ── Onglets ─────────────────────────────────────────────────── */}
            <div
              role="tablist"
              aria-label="Fichiers du modèle"
              className="flex gap-1 rounded-md border border-border bg-ink-850 p-1"
            >
              {PANES.map((item) => {
                const isActive = item.key === activePane;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActivePane(item.key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 text-xs transition-colors ${
                      isActive
                        ? "bg-ink-800 text-ink-50 shadow-elevation-1"
                        : "text-ink-400 hover:text-ink-100"
                    }`}
                  >
                    <item.icon
                      className={`h-3.5 w-3.5 ${isActive ? "text-gold" : ""}`}
                      strokeWidth={1.75}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* ── Éditeur ─────────────────────────────────────────────────── */}
            {/* Hauteur minimale ici, Monaco en absolu dedans : sa hauteur ne
              dépend plus de celle, parfois indéfinie, des conteneurs parents.
              Il remplit tout l'espace restant, sans descendre sous 20rem. */}
            <div className="flex min-h-[20rem] flex-1 flex-col overflow-hidden rounded-md border border-border">
              <div className="flex items-center justify-between border-b border-border bg-ink-850 px-3 py-2">
                <span className="font-mono text-xs text-ink-400">
                  {FILES[scope][activePane]}
                </span>
                <button
                  type="button"
                  onClick={copyActive}
                  className="flex items-center gap-1.5 text-xs text-ink-400 transition-colors hover:text-ink-100"
                >
                  {copied === activePane ? (
                    <>
                      <Check className="h-3 w-3 text-positive" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copier
                    </>
                  )}
                </button>
              </div>

              <div className="relative min-h-0 flex-1 bg-ink-850">
                <div className="absolute inset-0">
                  <MonacoEditor
                    key={`${scope}-${activePane}`}
                    height="100%"
                    language={activePane === "js" ? "javascript" : activePane}
                    value={current?.[activePane] ?? ""}
                    onChange={(value) => update(activePane, value)}
                    beforeMount={(monaco) => {
                      monaco.editor.defineTheme("invyra", INVYRA_THEME);
                    }}
                    theme="invyra"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12.5,
                      fontFamily:
                        "var(--font-geist-mono), ui-monospace, Menlo, Consolas, monospace",
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      tabSize: 2,
                      automaticLayout: true,
                      padding: { top: 12, bottom: 12 },
                      renderLineHighlight: "line",
                      smoothScrolling: true,
                    }}
                    loading={
                      <div className="flex h-full items-center justify-center text-xs text-ink-400">
                        Chargement de l&apos;éditeur…
                      </div>
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Réinitialisation ────────────────────────────────────────── */}
        {scope === "invitation" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="self-start">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Réinitialiser
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Repartir du modèle par défaut ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Le HTML, le CSS et le JavaScript actuels seront remplacés.
                  Tant que vous n&apos;enregistrez pas, la version en base reste
                  inchangée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={reset}>
                  Réinitialiser
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {hasPreview && showPreview && (
        <div className="relative hidden w-[min(42%,560px)] shrink-0 overflow-hidden rounded-md border border-border/60 bg-ink-900 shadow-elevation-3 lg:block">
          {preview}
        </div>
      )}
    </div>
  );
}
