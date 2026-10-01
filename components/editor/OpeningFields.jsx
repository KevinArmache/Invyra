"use client";

import {
  ChoiceField,
  TextField,
} from "@/components/editor/fields";
import { OPENING_FIELDS } from "@/lib/invitation/opening";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Réglages de l'écran d'ouverture standard d'un modèle.
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
      {OPENING_FIELDS
        .filter((field) => !only || only.includes(field.key))
        .map((field) =>
          field.type === "select" ? (
            <ChoiceField
              key={field.key}
              label={t(`portal.editor.fields.${field.key}`)}
              value={value?.[field.key] ?? field.options[0]}
              onChange={(next) => set(field.key, next)}
              options={field.options.map((option) => ({
                value: option,
                label: t(`portal.editor.options.${field.key}.${option}`),
              }))}
            />
          ) : (
            <TextField
              key={field.key}
              label={t(`portal.editor.fields.${field.key}`)}
              value={value?.[field.key] ?? ""}
              max={field.max}
              onChange={(next) => set(field.key, next)}
            />
          ),
        )}
      <p className="text-xs leading-relaxed text-ink-400">
        {t("portal.editor.general.opening_hint")}
      </p>
    </div>
  );
}
