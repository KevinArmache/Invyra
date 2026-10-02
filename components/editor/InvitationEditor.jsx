"use client";

import { useState } from "react";
import { Code2, Wand2 } from "lucide-react";

import CodeTemplateEditor from "@/components/editor/CodeTemplateEditor";
import VisualCodeEditor from "@/components/editor/VisualCodeEditor";
import { useTranslation } from "@/lib/i18n/Context";

const MODES = [
  { key: "visual", icon: Wand2 },
  { key: "code", icon: Code2 },
];

/**
 * Édition d'une invitation complète, de l'écran d'ouverture au pied de page :
 * l'éditeur visuel (textes, images, liens, couleurs) ou l'éditeur de code. On
 * passe librement de l'un à l'autre : chacun repart de la version courante.
 *
 * Le mode code n'est proposé qu'avec `allowCode` (admins) : c'est du
 * HTML/JS arbitraire servi aux invités.
 *
 * @param {object}   props.value     config normalisée
 * @param {function} props.onChange  accepte une config ou une mise à jour fonctionnelle
 * @param {React.ReactNode} [props.preview]  aperçu, repris par l'éditeur de
 *   code en plein écran
 */
export default function InvitationEditor({
  value,
  onChange,
  allowCode = false,
  preview,
}) {
  const { t } = useTranslation();
  // Une page vierge n'a rien à éditer visuellement : on ouvre directement le code.
  const [mode, setMode] = useState(() => (value?.html ? "visual" : "code"));
  const activeMode = allowCode ? mode : "visual";

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
                onClick={() => setMode(item.key)}
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

      {activeMode === "code" ? (
        <CodeTemplateEditor
          template={value}
          onChange={onChange}
          preview={preview}
        />
      ) : (
        <VisualCodeEditor
          template={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}
