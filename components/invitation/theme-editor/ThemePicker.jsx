"use client";

import { useMemo, useState } from "react";
import { Code2 } from "lucide-react";

import InvitationPreview from "@/components/invitation/InvitationPreview";
import { THEMES, createThemeConfig } from "@/lib/invitation/themes";
import { useTranslation } from "@/utils/i18n/Context";

const SAMPLE_EVENT = {
  title: "Marie & Jean",
  eventDate: "2027-06-12T00:00:00.000Z",
  location: "Domaine des Cyprès",
  time: "19:00",
  dressCode: "Tenue de soirée",
};

const OCCASIONS = [...new Set(THEMES.flatMap((theme) => theme.occasions))];

/**
 * Première étape d'un nouveau template : choisir un thème (ou, pour un
 * admin, le mode code). Chaque vignette est le thème rendu avec ses valeurs
 * par défaut.
 *
 * @param {function} props.onPick  reçoit la config initiale du template
 * @param {boolean}  props.allowCode  propose aussi le mode code (admins)
 * @param {function} props.onPickCode
 */
export default function ThemePicker({ onPick, allowCode = false, onPickCode }) {
  const { t } = useTranslation();
  const [occasion, setOccasion] = useState(null);

  const previews = useMemo(
    () =>
      Object.fromEntries(
        THEMES.map((theme) => [theme.id, createThemeConfig(theme.id)]),
      ),
    [],
  );

  const visible = occasion
    ? THEMES.filter((theme) => theme.occasions.includes(occasion))
    : THEMES;

  const chip = (active) =>
    `rounded-full border px-3 py-1 text-xs transition-colors ${
      active
        ? "border-gold bg-gold/10 text-ink-50"
        : "border-border text-ink-400 hover:text-ink-100"
    }`;

  return (
    <div className="@container space-y-5">
      <div>
        <h2 className="text-lg text-ink-50">
          {t("portal.themes.picker.title")}
        </h2>
        <p className="mt-1 text-sm text-ink-400">
          {t("portal.themes.picker.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={chip(!occasion)}
          onClick={() => setOccasion(null)}
        >
          {t("portal.themes.picker.filter_all")}
        </button>
        {OCCASIONS.map((item) => (
          <button
            key={item}
            type="button"
            className={chip(occasion === item)}
            onClick={() => setOccasion(item)}
          >
            {t(`portal.themes.occasions.${item}`)}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
        {visible.map((theme) => (
          <li key={theme.id}>
            <button
              type="button"
              onClick={() => onPick(previews[theme.id])}
              className="surface-interactive flex w-full flex-col overflow-hidden text-left"
            >
              <div className="relative aspect-3/4 w-full overflow-hidden border-b border-border/60 bg-ink-900">
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
                    template={previews[theme.id]}
                    event={SAMPLE_EVENT}
                    guestName="Marie Dupont"
                    readOnly
                  />
                </div>
              </div>
              <div className="p-4">
                <p className="text-base text-ink-50">{theme.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">
                  {t(`portal.themes.catalog.${theme.id}`)}
                </p>
              </div>
            </button>
          </li>
        ))}

        {allowCode && !occasion && (
          <li>
            <button
              type="button"
              onClick={onPickCode}
              className="surface-interactive flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <Code2 className="h-8 w-8 text-gold" strokeWidth={1.5} />
              <span className="text-base text-ink-50">
                {t("portal.themes.picker.code_title")}
              </span>
              <span className="text-xs leading-relaxed text-ink-400">
                {t("portal.themes.picker.code_desc")}
              </span>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
