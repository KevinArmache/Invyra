"use client";

import { useState } from "react";
import { Code2, Wand2 } from "lucide-react";

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
import CodeTemplateEditor from "@/components/invitation/editor/CodeTemplateEditor";
import VisualCodeEditor from "@/components/invitation/editor/VisualCodeEditor";
import DesignEditor from "@/components/invitation/editor/DesignEditor";
import { designToCode } from "@/lib/invitation/document";
import { isCodeConfig, isDesignConfig } from "@/lib/invitation/template-config";
import { useTranslation } from "@/lib/i18n/Context";

const MODES = [
  { key: "visual", icon: Wand2 },
  { key: "code", icon: Code2 },
];

/**
 * Édition d'une invitation complète, de l'écran d'ouverture au pied de page,
 * au choix sans code (formulaire) ou dans le code.
 *
 * - Modèle design : le formulaire du design ; passer en code le convertit
 *   (après confirmation) en HTML/CSS/JS.
 * - Modèle code : l'éditeur visuel (textes, images, liens, couleurs) ou
 *   l'éditeur de code. On passe librement de l'un à l'autre : chacun repart
 *   de la version courante.
 *
 * Le mode code n'est proposé qu'avec `allowCode` (admins) : c'est du
 * HTML/JS arbitraire servi aux invités.
 *
 * @param {object}   props.value     config normalisée (design ou code)
 * @param {function} props.onChange  accepte une config ou une mise à jour fonctionnelle
 * @param {React.ReactNode} [props.preview]  aperçu, repris par l'éditeur de
 *   code en plein écran
 */
export default function InvitationEditor({
  value,
  onChange,
  allowCode = false,
  uploadEnabled = false,
  preview,
}) {
  const { t } = useTranslation();
  // Un modèle code vierge (choix « Code » dans le sélecteur de designs)
  // n'a rien à éditer visuellement : on ouvre directement le code.
  const [mode, setMode] = useState(() =>
    isCodeConfig(value) && !value.html ? "code" : "visual",
  );
  const [confirmCode, setConfirmCode] = useState(false);

  const isDesign = isDesignConfig(value);
  const activeMode = allowCode ? mode : "visual";

  function pickMode(next) {
    if (next === activeMode) return;
    // Un design passe en code par une conversion, à confirmer.
    if (next === "code" && isDesign) {
      setConfirmCode(true);
      return;
    }
    setMode(next);
  }

  function renderEditor() {
    if (activeMode === "code") {
      return (
        <CodeTemplateEditor
          template={value}
          onChange={onChange}
          preview={preview}
        />
      );
    }
    if (isDesign) {
      return (
        <DesignEditor
          value={value}
          onChange={onChange}
          uploadEnabled={uploadEnabled}
        />
      );
    }
    return (
      <VisualCodeEditor
        template={value}
        onChange={onChange}
        uploadEnabled={uploadEnabled}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {allowCode && (
        <div
          role="tablist"
          aria-label={t("portal.editor.mode.label")}
          className="grid shrink-0 grid-cols-2 gap-1 rounded-md border border-border bg-ink-850 p-1"
        >
          {MODES.map((item) => {
            const isActive = item.key === activeMode;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => pickMode(item.key)}
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
                {t(`portal.editor.mode.${item.key}`)}
              </button>
            );
          })}
        </div>
      )}

      {renderEditor()}

      <AlertDialog open={confirmCode} onOpenChange={setConfirmCode}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("portal.editor.general.code_confirm_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("portal.editor.general.code_confirm_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onChange(designToCode(value));
                setMode("code");
              }}
            >
              {t("portal.editor.general.code_confirm_btn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
