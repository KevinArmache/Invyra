"use client";

import { useMemo } from "react";
import { Code2 } from "lucide-react";

import TemplateThumbnail from "@/components/invitation/TemplateThumbnail";
import { DESIGNS, createDesignConfig } from "@/lib/invitation/designs";
import { useTranslation } from "@/lib/i18n/Context";

const SAMPLE_EVENT = {
  title: "Marie & Jean",
  eventDate: "2027-06-12T00:00:00.000Z",
  location: "Domaine des Cyprès",
  time: "19:00",
  dressCode: "Tenue de soirée",
};

/**
 * Première étape d'un nouveau modèle : choisir son design de départ (ou,
 * pour un admin, le mode code). Chaque vignette est le design rendu avec son
 * contenu d'exemple. Le modèle garde ensuite ses ambiances (couleurs) et se
 * range dans une catégorie.
 *
 * @param {function} props.onPick  reçoit la config initiale du modèle
 * @param {boolean}  props.allowCode  propose aussi le mode code (admins)
 * @param {function} props.onPickCode
 */
export default function DesignPicker({ onPick, allowCode = false, onPickCode }) {
  const { t } = useTranslation();

  const previews = useMemo(
    () =>
      Object.fromEntries(
        DESIGNS.map((design) => [design.id, createDesignConfig(design.id)]),
      ),
    [],
  );

  return (
    <div className="@container space-y-5">
      <div>
        <h2 className="text-lg text-ink-50">
          {t("portal.editor.picker.title")}
        </h2>
        <p className="mt-1 text-sm text-ink-400">
          {t("portal.editor.picker.subtitle")}
        </p>
      </div>

      <ul className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
        {DESIGNS.map((design) => (
          <li key={design.id}>
            <button
              type="button"
              onClick={() => onPick(previews[design.id])}
              className="surface-interactive flex w-full flex-col overflow-hidden text-left"
            >
              <div className="relative aspect-3/4 w-full overflow-hidden border-b border-border/60 bg-ink-900">
                <TemplateThumbnail
                  template={previews[design.id]}
                  event={SAMPLE_EVENT}
                  title={design.name}
                />
              </div>
              <div className="p-4">
                <p className="text-base text-ink-50">{design.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">
                  {t(`portal.editor.catalog.${design.id}`)}
                </p>
              </div>
            </button>
          </li>
        ))}

        {allowCode && (
          <li>
            <button
              type="button"
              onClick={onPickCode}
              className="surface-interactive flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <Code2 className="h-8 w-8 text-gold" strokeWidth={1.5} />
              <span className="text-base text-ink-50">
                {t("portal.editor.picker.code_title")}
              </span>
              <span className="text-xs leading-relaxed text-ink-400">
                {t("portal.editor.picker.code_desc")}
              </span>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
