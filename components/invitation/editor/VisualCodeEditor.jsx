"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  ColorField,
  Field,
  ImageField,
  TextField,
  TextareaField,
} from "@/components/invitation/editor/fields";
import OpeningFields from "@/components/invitation/editor/OpeningFields";
import { safeUrl } from "@/lib/invitation/shared";
import {
  VISUAL_SOURCES,
  applyEdits,
  decodeText,
  encodeText,
  encodeUrl,
  expandHex,
  scanSource,
  withSources,
} from "@/lib/invitation/visual";
import { useTranslation } from "@/lib/i18n/Context";

/** Au-delà, un texte s'édite dans une zone multi-ligne. */
const LONG_TEXT = 70;

const IMAGE_EXTENSION = /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i;

/** Libellé lisible d'un emplacement, d'après la balise qui le contient. */
function slotLabel(slot, t) {
  if (slot.kind === "url") {
    if (slot.attribute === "href") return t("portal.editor.visual.link");
    return t("portal.editor.visual.image");
  }
  const tag = slot.tag || "";
  if (/^h[1-6]$/.test(tag)) return t("portal.editor.visual.heading");
  if (tag === "button") return t("portal.editor.visual.button");
  if (tag === "a") return t("portal.editor.visual.link_text");
  if (tag === "li") return t("portal.editor.visual.list_item");
  if (tag === "p") return t("portal.editor.visual.paragraph");
  return t("portal.editor.visual.text");
}

/** « HERO IMAGE » → « Hero image » ; un titre en casse normale reste tel quel. */
function groupTitle(title) {
  return title === title.toUpperCase()
    ? title.charAt(0) + title.slice(1).toLowerCase()
    : title;
}

/** Un lien vers une image s'édite comme une image, les autres comme du texte. */
function isImage(slot) {
  return (
    slot.attribute !== "href" ||
    IMAGE_EXTENSION.test(slot.value) ||
    slot.value.includes("images.unsplash.com")
  );
}

/**
 * Lien (https) : la saisie reste locale tant que l'adresse n'est pas valide,
 * comme pour les images.
 */
function LinkField({ label, value, onChange }) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const invalid = draft && !safeUrl(draft);
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        value={draft}
        maxLength={500}
        aria-invalid={invalid || undefined}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (!next || safeUrl(next)) onChange(next.trim());
        }}
        className="text-xs"
      />
    </Field>
  );
}

/**
 * Édition sans code d'un template code : textes, images, liens et couleurs,
 * de l'écran d'ouverture jusqu'au pied de page.
 *
 * Le code d'origine est figé au montage ; chaque saisie est rejouée dessus
 * (applyEdits), si bien que la structure du template n'est jamais touchée.
 * Le serveur le vérifie d'ailleurs pour les non-admins (isVisualEdit).
 *
 * @param {object}   props.template  config `{ type: "code", … }`
 * @param {function} props.onChange  reçoit une mise à jour fonctionnelle
 */
export default function VisualCodeEditor({
  template,
  onChange,
  uploadEnabled,
}) {
  const { t } = useTranslation();

  // Le code de départ : les emplacements sont repérés une fois pour toutes.
  const [base] = useState(template);
  const sources = useMemo(
    () =>
      VISUAL_SOURCES.map((source) => {
        const text = source.get(base) ?? "";
        return { ...source, text, slots: scanSource(source.kind, text) };
      }).filter((source) => source.text),
    [base],
  );

  // Valeurs saisies : `${source}:${index}` → valeur lisible ; couleurs par
  // valeur d'origine (#rrggbb), appliquées à toutes leurs occurrences.
  const [values, setValues] = useState({});
  const [colors, setColors] = useState({});

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Rejoue les saisies sur le code d'origine et remonte le résultat.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const next = {};
    for (const source of sources) {
      const edits = {};
      source.slots.forEach((slot, index) => {
        const key = `${source.key}:${index}`;
        if (slot.kind === "color") {
          const replacement = colors[expandHex(slot.value)];
          if (replacement) edits[index] = replacement;
        } else if (key in values) {
          edits[index] =
            slot.kind === "text"
              ? encodeText(values[key])
              : encodeUrl(values[key]);
        }
      });
      next[source.key] = applyEdits(source.text, source.slots, edits);
    }
    onChangeRef.current((previous) => withSources(previous, next));
  }, [sources, values, colors]);

  const groups = useMemo(() => {
    const result = [];
    const byId = new Map();
    for (const source of sources) {
      const isOpening = source.key.startsWith("opening");
      source.slots.forEach((slot, index) => {
        if (slot.kind === "color") return;
        if (slot.kind === "text" && !slot.meaningful) return;
        // Liens mailto:, tel:, ancres, chemins relatifs : laissés au code.
        if (
          slot.kind === "url" &&
          !isImage(slot) &&
          !/^https?:/.test(slot.value)
        ) {
          return;
        }
        const id = isOpening
          ? "opening"
          : source.kind === "css"
            ? "backgrounds"
            : `group:${slot.group || ""}`;
        if (!byId.has(id)) {
          const group = {
            id,
            title: isOpening
              ? t("portal.editor.sections.opening")
              : source.kind === "css"
                ? t("portal.editor.visual.backgrounds")
                : slot.group || t("portal.editor.visual.content"),
            items: [],
          };
          byId.set(id, group);
          result.push(group);
        }
        byId
          .get(id)
          .items.push({ key: `${source.key}:${index}`, slot, source });
      });
    }
    return result;
  }, [sources, t]);

  // Couleurs distinctes, les plus utilisées d'abord.
  const palette = useMemo(() => {
    const counts = new Map();
    for (const source of sources) {
      for (const slot of source.slots) {
        if (slot.kind !== "color") continue;
        const hex = expandHex(slot.value);
        counts.set(hex, (counts.get(hex) ?? 0) + 1);
      }
    }
    return [...counts]
      .sort((a, b) => b[1] - a[1])
      .map(([hex, count]) => ({ hex, count }));
  }, [sources]);

  function valueOf(item) {
    if (item.key in values) return values[item.key];
    return item.slot.kind === "text"
      ? decodeText(item.slot.value)
      : item.slot.value;
  }

  function setValue(key, next) {
    setValues((previous) => ({ ...previous, [key]: next }));
  }

  function renderItem(item) {
    const { slot, key } = item;
    const label = slotLabel(slot, t);
    const value = valueOf(item);

    if (slot.kind === "url") {
      if (isImage(slot)) {
        return (
          <ImageField
            key={key}
            label={slot.selector ? `${label} · ${slot.selector}` : label}
            value={value}
            onChange={(next) => setValue(key, next)}
            uploadEnabled={uploadEnabled}
          />
        );
      }
      return (
        <LinkField
          key={key}
          label={label}
          value={value}
          onChange={(next) => setValue(key, next)}
        />
      );
    }

    const hint = slot.className ? `.${slot.className}` : undefined;
    // D'après le texte d'origine : basculer en cours de frappe ferait perdre
    // le focus.
    if (decodeText(slot.value).length > LONG_TEXT) {
      return (
        <TextareaField
          key={key}
          label={label}
          value={value}
          hint={hint}
          onChange={(next) => setValue(key, next)}
        />
      );
    }
    return (
      <TextField
        key={key}
        label={label}
        hint={hint}
        value={value}
        onChange={(next) => setValue(key, next)}
      />
    );
  }

  const hasOpeningCode = Boolean(template.openingCode?.html);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <p className="surface p-4 text-xs leading-relaxed text-ink-400">
        {t("portal.editor.visual.intro")}
      </p>

      <Accordion
        type="multiple"
        defaultValue={["opening", "colors"]}
        className="surface px-4"
      >
        {/* Ouverture standard : ses réglages. Écrite en code : ses textes
            sont dans le groupe « opening » ci-dessous, seul le monogramme
            reste un réglage. */}
        <AccordionItem value="opening">
          <AccordionTrigger>
            {t("portal.editor.sections.opening")}
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <OpeningFields
              value={template.opening}
              only={hasOpeningCode ? ["monogram"] : undefined}
              onChange={(opening) =>
                onChange((previous) => ({ ...previous, opening }))
              }
            />
            {groups
              .filter((group) => group.id === "opening")
              .flatMap((group) => group.items.map(renderItem))}
          </AccordionContent>
        </AccordionItem>

        {palette.length > 0 && (
          <AccordionItem value="colors">
            <AccordionTrigger>
              {t("portal.editor.visual.colors")}
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-4 text-xs leading-relaxed text-ink-400">
                {t("portal.editor.visual.colors_hint")}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {palette.map(({ hex, count }) => (
                  <ColorField
                    key={hex}
                    label={`${t("portal.editor.visual.color")} · ${count}×`}
                    value={colors[hex] ?? hex}
                    onChange={(next) =>
                      setColors((previous) => ({ ...previous, [hex]: next }))
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {groups
          .filter((group) => group.id !== "opening")
          .map((group) => (
            <AccordionItem key={group.id} value={group.id}>
              <AccordionTrigger>
                <span className="truncate">{groupTitle(group.title)}</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {group.items.map(renderItem)}
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    </div>
  );
}
