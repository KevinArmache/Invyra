"use client";

import { Check } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ChoiceField,
  ColorField,
  FontField,
  ImageField,
  ImagesField,
  ListField,
  RangeField,
  TextField,
  TextareaField,
  ToggleField,
} from "@/components/invitation/theme-editor/fields";
import { TEMPLATE_TOKENS } from "@/lib/invitation/document";
import { CONTENT_SECTIONS, FONTS, fontsHref } from "@/lib/invitation/shared";
import { THEMES, getTheme } from "@/lib/invitation/themes";
import { useTranslation } from "@/utils/i18n/Context";

/** Toutes les polices proposées, pour les prévisualiser dans les listes. */
const ALL_FONTS_HREF = fontsHref(FONTS.map((font) => font.id));

function presetIsActive(preset, style) {
  return Object.entries(preset.style).every(
    ([key, value]) => style[key] === value,
  );
}

/**
 * Formulaire d'un modèle sans code, généré à partir des schémas : le
 * `styleSchema` de son design et CONTENT_SECTIONS, commun à tous.
 *
 * Le design d'un modèle ne se change pas ici (plus de choix de « thème ») :
 * un modèle se décline en ambiances. Pour partir d'un autre design, on crée
 * un nouveau modèle.
 *
 * @param {object}   props.value     config `{ type: "theme", themeId, style, content }` normalisée
 * @param {function} props.onChange  reçoit la config complète mise à jour
 * @param {boolean}  props.uploadEnabled  Vercel Blob configuré côté serveur
 *
 * Le passage en code se fait depuis InvitationEditor (onglet « Code »).
 */
export default function ThemeEditor({ value, onChange, uploadEnabled }) {
  const { t } = useTranslation();
  const theme = getTheme(value.themeId) ?? THEMES[0];
  const style = { ...theme.defaultStyle, ...value.style };

  function setStyle(key, next) {
    onChange({ ...value, style: { ...style, [key]: next } });
  }

  function setContent(sectionKey, fieldKey, next) {
    onChange({
      ...value,
      content: {
        ...value.content,
        [sectionKey]: { ...value.content[sectionKey], [fieldKey]: next },
      },
    });
  }

  function renderStyleField(field) {
    const label = t(`portal.themes.style.${field.key}`);
    const props = {
      label,
      value: style[field.key],
      onChange: (next) => setStyle(field.key, next),
    };
    if (field.type === "color")
      return <ColorField key={field.key} {...props} />;
    if (field.type === "font") return <FontField key={field.key} {...props} />;
    if (field.type === "toggle")
      return <ToggleField key={field.key} {...props} />;
    if (field.type === "select")
      return (
        <ChoiceField
          key={field.key}
          {...props}
          options={field.options.map((option) => ({
            value: option,
            label: t(`portal.themes.options.${field.key}.${option}`),
          }))}
        />
      );
    return (
      <RangeField
        key={field.key}
        {...props}
        min={field.min}
        max={field.max}
        step={field.step}
        unit={field.unit}
      />
    );
  }

  function renderContentField(section, field) {
    const current = value.content[section.key]?.[field.key];
    const label = t(`portal.themes.fields.${field.key}`);
    const onFieldChange = (next) => setContent(section.key, field.key, next);
    const common = { label, onChange: onFieldChange };

    switch (field.type) {
      case "select":
        return (
          <ChoiceField
            key={field.key}
            {...common}
            value={current ?? field.options[0]}
            options={field.options.map((option) => ({
              value: option,
              label: t(`portal.themes.options.${field.key}.${option}`),
            }))}
          />
        );
      case "image":
        return (
          <ImageField
            key={field.key}
            {...common}
            value={current ?? ""}
            uploadEnabled={uploadEnabled}
          />
        );
      case "images":
        return (
          <ImagesField
            key={field.key}
            {...common}
            value={current ?? []}
            maxItems={field.maxItems}
            uploadEnabled={uploadEnabled}
          />
        );
      case "list":
        return (
          <ListField
            key={field.key}
            {...common}
            value={current ?? []}
            columns={field.columns}
            maxItems={field.maxItems}
          />
        );
      case "textarea":
        return (
          <TextareaField
            key={field.key}
            {...common}
            value={current ?? ""}
            max={field.max}
            hint={
              section.key === "intro"
                ? `${t("portal.themes.editor.tokens_hint")} ${TEMPLATE_TOKENS.slice(0, 3).join(", ")}…`
                : undefined
            }
          />
        );
      case "url":
        return (
          <TextField
            key={field.key}
            {...common}
            value={current ?? ""}
            max={500}
            placeholder={t("portal.themes.image.url_placeholder")}
          />
        );
      default:
        return (
          <TextField
            key={field.key}
            {...common}
            value={current ?? ""}
            max={field.max}
            placeholder={
              field.placeholder === "{{EVENT_TITLE}}"
                ? t("portal.themes.fields.title_placeholder")
                : undefined
            }
          />
        );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      {ALL_FONTS_HREF && (
        <link rel="stylesheet" href={ALL_FONTS_HREF} precedence="default" />
      )}

      {/* ── Ambiances ──────────────────────────────────────────────────
          Un modèle garde son design ; on ne choisit que son ambiance. */}
      <div className="surface space-y-4 p-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-ink-400">
            {t("portal.themes.editor.presets")}
          </Label>
          <div className="flex flex-wrap gap-2">
            {theme.presets.map((preset) => {
              const active = presetIsActive(preset, style);
              const swatch = { ...theme.defaultStyle, ...preset.style };
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange({ ...value, style: { ...style, ...preset.style } })
                  }
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-gold text-ink-50"
                      : "border-border text-ink-300 hover:border-gold/40"
                  }`}
                >
                  <span className="flex -space-x-1" aria-hidden="true">
                    {[swatch.background, swatch.accent, swatch.text].map(
                      (color, index) => (
                        <span
                          key={index}
                          className="h-3.5 w-3.5 rounded-full border border-ink-900/40"
                          style={{ background: color }}
                        />
                      ),
                    )}
                  </span>
                  {preset.name}
                  {active && <Check className="h-3 w-3 text-gold" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Réglages ──────────────────────────────────────────────────── */}
      <Accordion
        type="multiple"
        defaultValue={["opening", "style", "hero"]}
        className="surface px-4"
      >
        <AccordionItem value="style">
          <AccordionTrigger>{t("portal.themes.editor.style")}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {theme.styleSchema.map(renderStyleField)}
            </div>
          </AccordionContent>
        </AccordionItem>

        {CONTENT_SECTIONS.map((section) => {
          const sectionValue = value.content[section.key] ?? {};
          const hidden = section.toggle && !sectionValue.enabled;

          return (
            <AccordionItem key={section.key} value={section.key}>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  {t(`portal.themes.sections.${section.key}`)}
                  {hidden && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-normal text-ink-400">
                      {t("portal.themes.editor.hidden_badge")}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {section.toggle && (
                  <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm text-ink-100">
                    {t("portal.themes.editor.show_section")}
                    <Switch
                      checked={!!sectionValue.enabled}
                      onCheckedChange={(checked) =>
                        setContent(section.key, "enabled", checked)
                      }
                    />
                  </label>
                )}
                {section.key === "details" && (
                  <p className="text-xs leading-relaxed text-ink-400">
                    {t("portal.themes.editor.details_hint")}
                  </p>
                )}
                {section.key === "opening" && (
                  <p className="text-xs leading-relaxed text-ink-400">
                    {t("portal.themes.editor.opening_hint")}
                  </p>
                )}
                {!hidden &&
                  section.fields
                    // Réglages sans effet sur ce thème (ex. style d'ouverture
                    // d'un thème qui a sa propre ouverture).
                    .filter(
                      (field) =>
                        !theme.hiddenFields?.[section.key]?.includes(field.key),
                    )
                    .map((field) => renderContentField(section, field))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
