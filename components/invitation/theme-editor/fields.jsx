"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FONTS, safeUrl } from "@/lib/invitation/shared";
import { useTranslation } from "@/utils/i18n/Context";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

/** Libellé + contrôle, empilés. */
export function Field({ label, htmlFor, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-ink-400">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-ink-400">{hint}</p>}
    </div>
  );
}

// ─── Style ──────────────────────────────────────────────────────────────────

export function ColorField({ label, value, onChange }) {
  const id = useId();
  // Brouillon local : on laisse taper une couleur incomplète sans la pousser
  // dans l'aperçu tant qu'elle n'est pas valide.
  const [draft, setDraft] = useState(value);
  const [previous, setPrevious] = useState(value);
  if (value !== previous) {
    setPrevious(value);
    setDraft(value);
  }

  return (
    <Field label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
        />
        <Input
          id={id}
          value={draft}
          onChange={(event) => {
            const next = event.target.value.trim();
            setDraft(next);
            if (HEX_COLOR.test(next)) onChange(next.toLowerCase());
          }}
          className="font-mono text-xs uppercase"
          maxLength={7}
        />
      </div>
    </Field>
  );
}

export function FontField({ label, value, onChange }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map((font) => (
            <SelectItem key={font.id} value={font.id}>
              <span style={{ fontFamily: font.stack }}>{font.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function RangeField({ label, value, onChange, min, max, step, unit }) {
  return (
    <Field label={`${label} · ${value}${unit ?? ""}`}>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
        aria-label={label}
        className="py-2"
      />
    </Field>
  );
}

/** Choix parmi quelques options, en pastilles (même style que les ambiances). */
export function ChoiceField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                active
                  ? "border-gold bg-gold/10 text-ink-50"
                  : "border-border text-ink-300 hover:border-gold/40"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export function ToggleField({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm text-ink-100">
      {label}
      <Switch checked={!!value} onCheckedChange={onChange} />
    </label>
  );
}

// ─── Contenu ────────────────────────────────────────────────────────────────

export function TextField({ label, value, onChange, max, placeholder, hint }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Input
        id={id}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function TextareaField({ label, value, onChange, max, hint }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Textarea
        id={id}
        value={value}
        maxLength={max}
        rows={5}
        onChange={(event) => onChange(event.target.value)}
        className="text-sm leading-relaxed"
      />
    </Field>
  );
}

/**
 * Upload vers Vercel Blob via /api/upload ; renvoie l'URL publique.
 * @param {"image"|"audio"} kind
 */
async function uploadMedia(file, kind = "image") {
  if (!file.type.startsWith(`${kind}/`)) throw new Error("type");
  const max = kind === "audio" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > max) throw new Error("size");
  const { upload } = await import("@vercel/blob/client");
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const folder = kind === "audio" ? "invitations/audio" : "invitations";
  const blob = await upload(`${folder}/${kind}.${extension}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });
  return blob.url;
}

function UploadButton({ onUploaded, uploadEnabled, kind = "image" }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!uploadEnabled) return null;

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      onUploaded(await uploadMedia(file, kind));
    } catch (caught) {
      toast.error(
        caught.message === "size"
          ? t(
              kind === "audio"
                ? "portal.themes.music.too_large"
                : "portal.themes.image.too_large",
            )
          : t("portal.themes.image.upload_error"),
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={kind === "audio" ? "audio/*" : "image/*"}
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="shrink-0"
      >
        {isUploading ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="mr-1.5 h-3.5 w-3.5" />
        )}
        {isUploading
          ? t("portal.themes.image.uploading")
          : t("portal.themes.image.upload")}
      </Button>
    </>
  );
}

function Thumbnail({ url, onRemove, removeLabel }) {
  return (
    <div className="group relative aspect-4/3 overflow-hidden rounded-md border border-border bg-ink-900">
      {/* eslint-disable-next-line @next/next/no-img-element -- URL distante arbitraire, l'optimiseur est désactivé */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/80 text-ink-100 opacity-80 transition-opacity hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ImageField({ label, value, onChange, uploadEnabled }) {
  const { t } = useTranslation();
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [previous, setPrevious] = useState(value);
  if (value !== previous) {
    setPrevious(value);
    setDraft(value);
  }
  const invalid = draft && !safeUrl(draft);

  return (
    <Field label={label} htmlFor={id}>
      {value && (
        <div className="w-40">
          <Thumbnail
            url={value}
            onRemove={() => onChange("")}
            removeLabel={t("portal.themes.image.remove")}
          />
        </div>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          placeholder={t("portal.themes.image.url_placeholder")}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (!next || safeUrl(next)) onChange(next.trim());
          }}
          className="text-xs"
        />
        <UploadButton onUploaded={onChange} uploadEnabled={uploadEnabled} />
      </div>
    </Field>
  );
}

export function ImagesField({
  label,
  value,
  onChange,
  maxItems,
  uploadEnabled,
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const isFull = value.length >= maxItems;

  function add(url) {
    const safe = safeUrl(url);
    if (!safe || isFull) return;
    onChange([...value, safe]);
    setDraft("");
  }

  return (
    <Field label={`${label} (${value.length}/${maxItems})`}>
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, index) => (
            <Thumbnail
              key={`${url}-${index}`}
              url={url}
              removeLabel={t("portal.themes.image.remove")}
              onRemove={() => onChange(value.filter((_, i) => i !== index))}
            />
          ))}
        </div>
      )}
      {!isFull && (
        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder={t("portal.themes.image.url_placeholder")}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add(draft);
              }
            }}
            className="text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!safeUrl(draft)}
            onClick={() => add(draft)}
            aria-label={t("portal.themes.image.add")}
            className="shrink-0"
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </Button>
          <UploadButton onUploaded={add} uploadEnabled={uploadEnabled} />
        </div>
      )}
    </Field>
  );
}

/** Lignes à colonnes fixes (ex. programme : heure + intitulé). */
export function ListField({ label, value, onChange, columns, maxItems }) {
  const { t } = useTranslation();

  function updateRow(index, key, next) {
    onChange(
      value.map((row, i) => (i === index ? { ...row, [key]: next } : row)),
    );
  }

  return (
    <Field label={label}>
      <ul className="space-y-2">
        {value.map((row, index) => (
          <li key={index} className="flex items-center gap-2">
            {columns.map((column, columnIndex) => (
              <Input
                key={column.key}
                value={row[column.key] ?? ""}
                maxLength={column.max}
                placeholder={t(`portal.themes.fields.${column.key}`)}
                aria-label={t(`portal.themes.fields.${column.key}`)}
                onChange={(event) =>
                  updateRow(index, column.key, event.target.value)
                }
                className={
                  columnIndex === 0 ? "w-20 shrink-0" : "min-w-0 flex-1"
                }
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              aria-label={t("portal.themes.list.remove_row")}
              className="h-8 w-8 shrink-0 text-ink-400 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
      {value.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([
              ...value,
              Object.fromEntries(columns.map((column) => [column.key, ""])),
            ])
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t("portal.themes.list.add_row")}
        </Button>
      )}
    </Field>
  );
}

/**
 * Musique jouée quand l'invité ouvre son invitation : fichier importé ou
 * lien direct vers un fichier audio (https).
 */
export function MusicField({ value, onChange, uploadEnabled }) {
  const { t } = useTranslation();
  const id = useId();
  const [draft, setDraft] = useState(value ?? "");
  const [previous, setPrevious] = useState(value);
  if (value !== previous) {
    setPrevious(value);
    setDraft(value ?? "");
  }
  const invalid = draft && !safeUrl(draft);

  return (
    <Field
      label={t("portal.themes.music.label")}
      htmlFor={id}
      hint={t("portal.themes.music.hint")}
    >
      {value && (
        <div className="flex items-center gap-2">
          <audio controls src={value} className="h-9 min-w-0 flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            aria-label={t("portal.themes.music.remove")}
            className="h-8 w-8 shrink-0 text-ink-400 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          placeholder={t("portal.themes.music.placeholder")}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (!next || safeUrl(next)) onChange(next.trim());
          }}
          className="text-xs"
        />
        <UploadButton
          kind="audio"
          onUploaded={onChange}
          uploadEnabled={uploadEnabled}
        />
      </div>
    </Field>
  );
}
