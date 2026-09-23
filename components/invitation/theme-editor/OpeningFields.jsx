"use client";

import {
  ChoiceField,
  TextField,
} from "@/components/invitation/theme-editor/fields";
import { CONTENT_SECTIONS } from "@/lib/invitation/shared";
import { useTranslation } from "@/utils/i18n/Context";

const OPENING = CONTENT_SECTIONS.find((section) => section.key === "opening");

/**
 * Réglages de l'écran d'ouverture, pour les templates code (les templates à
 * thème les ont dans leur formulaire, générés depuis le même schéma).
 *
 * @param {string[]} [props.only]  champs à afficher (tous par défaut). Une
 *   ouverture écrite en code n'utilise plus que le monogramme.
 */
export default function OpeningFields({ value, onChange, only }) {
  const { t } = useTranslation();

  function set(key, next) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="space-y-4">
      {OPENING.fields
        .filter((field) => !only || only.includes(field.key))
        .map((field) =>
          field.type === "select" ? (
            <ChoiceField
              key={field.key}
              label={t(`portal.themes.fields.${field.key}`)}
              value={value?.[field.key] ?? field.options[0]}
              onChange={(next) => set(field.key, next)}
              options={field.options.map((option) => ({
                value: option,
                label: t(`portal.themes.options.${field.key}.${option}`),
              }))}
            />
          ) : (
            <TextField
              key={field.key}
              label={t(`portal.themes.fields.${field.key}`)}
              value={value?.[field.key] ?? ""}
              max={field.max}
              onChange={(next) => set(field.key, next)}
            />
          ),
        )}
      <p className="text-xs leading-relaxed text-ink-400">
        {t("portal.themes.editor.opening_hint")}
      </p>
    </div>
  );
}
