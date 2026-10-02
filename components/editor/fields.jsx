"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { safeUrl } from "@/lib/invitation/html";
import { prepareImage } from "@/lib/media/prepare-image";
import { useTranslation } from "@/lib/i18n/Context";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
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

/** Choix parmi quelques options, en pastilles. */
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

// ─── Médias ─────────────────────────────────────────────────────────────────

/**
 * Upload vers Vercel Blob via /api/upload ; renvoie l'URL publique. Une image
 * est d'abord préparée (voir prepareImage) : redimensionnée et allégée, quelle
 * que soit sa taille d'origine.
 *
 * @param {"image"|"audio"} kind
 * @param {(percentage: number) => void} [onProgress]  appelé au début de
 *   l'envoi (0), puis au fil de l'eau
 */
async function uploadMedia(file, kind, onProgress) {
  let body = file;
  if (kind === "image") {
    body = await prepareImage(file);
  } else {
    if (!file.type.startsWith("audio/")) throw new Error("type");
    if (file.size > MAX_AUDIO_BYTES) throw new Error("size");
  }
  const { upload } = await import("@vercel/blob/client");
  const extension = body.name.split(".").pop()?.toLowerCase() || "bin";
  const folder = kind === "audio" ? "invitations/audio" : "invitations";
  onProgress?.(0);
  const blob = await upload(`${folder}/${kind}.${extension}`, body, {
    access: "public",
    handleUploadUrl: "/api/upload",
    onUploadProgress: ({ percentage }) => onProgress?.(percentage),
  });
  return blob.url;
}

/** Clé du message d'un envoi raté, selon sa cause. */
function uploadErrorKey(caught, kind) {
  if (kind === "audio") {
    return caught.message === "size"
      ? "portal.editor.music.too_large"
      : "portal.editor.music.upload_error";
  }
  if (caught.message === "size") return "portal.editor.image.too_large";
  if (caught.message === "type") return "portal.editor.image.unsupported";
  return "portal.editor.image.upload_error";
}

/**
 * Envoi d'un fichier et son avancement : `status` vaut null au repos, sinon
 * `{ phase: "processing" | "uploading", progress }`.
 */
function useMediaUpload(kind, onUploaded) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);

  async function start(file) {
    if (!file || status) return;
    setStatus({
      phase: kind === "image" ? "processing" : "uploading",
      progress: 0,
    });
    try {
      const url = await uploadMedia(file, kind, (progress) =>
        setStatus({ phase: "uploading", progress }),
      );
      onUploaded(url);
    } catch (caught) {
      toast.error(t(uploadErrorKey(caught, kind)));
    } finally {
      setStatus(null);
    }
  }

  return { status, start };
}

/** Libellé « Envoi… {n} % », pourcentage arrondi. */
function uploadingLabel(t, status) {
  return t("portal.editor.image.uploading").replace(
    "{n}",
    String(Math.round(status.progress)),
  );
}

/** Avancement d'un envoi : libellé et barre. */
function UploadProgress({ status }) {
  const { t } = useTranslation();
  const processing = status.phase === "processing";
  return (
    <div role="status" className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs text-ink-100">
        <Loader2
          className="h-3.5 w-3.5 shrink-0 animate-spin text-gold"
          aria-hidden="true"
        />
        {processing
          ? t("portal.editor.image.processing")
          : uploadingLabel(t, status)}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-ink-800">
        <div
          className={`h-full rounded-full bg-gold transition-[width] duration-300 ${
            processing ? "animate-pulse" : ""
          }`}
          style={{
            width: `${processing ? 12 : Math.max(4, status.progress)}%`,
          }}
        />
      </div>
    </div>
  );
}

/** Premier fichier image d'un dépôt ou d'un collage. */
function imageFrom(files) {
  return [...(files ?? [])].find((file) => file.type.startsWith("image/"));
}

/**
 * Image d'un emplacement : un fichier importé (choisi, glissé ou collé), ou
 * un lien. Le lien saisi reste local tant que ce n'est pas une adresse https
 * valide, pour ne pas pousser une image cassée dans l'aperçu.
 */
export function ImageField({ label, value, onChange }) {
  const { t } = useTranslation();
  const id = useId();
  const hintId = useId();
  const errorId = useId();
  const inputRef = useRef(null);
  const [draft, setDraft] = useState(value);
  const [previous, setPrevious] = useState(value);
  // La vignette n'a pas pu se charger : l'icône la remplace.
  const [broken, setBroken] = useState(false);
  const [dragging, setDragging] = useState(false);
  if (value !== previous) {
    setPrevious(value);
    setDraft(value);
    setBroken(false);
  }
  const { status, start } = useMediaUpload("image", onChange);
  const busy = Boolean(status);
  const invalid = Boolean(draft) && !safeUrl(draft);
  const actionLabel = t(
    value ? "portal.editor.image.replace" : "portal.editor.image.upload",
  );

  function choose() {
    if (!busy) inputRef.current?.click();
  }

  return (
    <Field label={label} htmlFor={id}>
      {/* Une image collée (Ctrl+V) n'importe où dans le champ est importée. */}
      <div
        className="space-y-2"
        onPaste={(event) => {
          const file = imageFrom(event.clipboardData?.files);
          if (!file) return;
          event.preventDefault();
          start(file);
        }}
      >
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const files = event.dataTransfer?.files;
            const file = imageFrom(files) ?? files?.[0];
            if (file) {
              start(file);
              return;
            }
            // Image glissée depuis une autre page : le navigateur ne donne
            // souvent que son adresse.
            const link = event.dataTransfer
              ?.getData("text/uri-list")
              .split(/\r?\n/)
              .find((line) => line && !line.startsWith("#"));
            if (link && safeUrl(link) && !busy) onChange(link.trim());
          }}
          className={`flex items-start gap-3 rounded-md border border-dashed p-2.5 transition-colors duration-300 ${
            dragging
              ? "border-gold/60 bg-gold/5"
              : "border-border bg-ink-900/40 hover:border-gold/40"
          }`}
        >
          <button
            type="button"
            onClick={choose}
            disabled={busy}
            aria-describedby={hintId}
            className="group relative flex aspect-4/3 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-ink-900 transition-colors hover:border-gold/40 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:cursor-wait sm:w-28"
          >
            {value && !broken ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL distante arbitraire, l'optimiseur est désactivé
              <img
                src={value}
                alt=""
                onError={() => setBroken(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlus
                className="h-5 w-5 text-gold/80 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.6}
                aria-hidden="true"
              />
            )}
            <span className="sr-only">{actionLabel}</span>
          </button>

          <div className="min-w-0 flex-1 space-y-2">
            {status ? (
              <UploadProgress status={status} />
            ) : (
              <div>
                <p className="text-xs text-ink-100">
                  {t("portal.editor.image.drop_title")}
                </p>
                <p
                  id={hintId}
                  className="mt-0.5 text-[11px] leading-snug text-ink-400"
                >
                  {t("portal.editor.image.drop_hint")}
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={choose}
                disabled={busy}
              >
                <Upload className="size-3.5" />
                {actionLabel}
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange("")}
                  disabled={busy}
                  className="text-ink-400 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  {t("portal.editor.image.remove")}
                </Button>
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            tabIndex={-1}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              start(file);
            }}
          />
        </div>

        <div className="relative">
          <Link2
            className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <Input
            id={id}
            value={draft}
            placeholder={t("portal.editor.image.url_placeholder")}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              if (!next || safeUrl(next)) onChange(next.trim());
            }}
            className="pl-8 text-xs"
          />
        </div>
        {invalid && (
          <p id={errorId} className="text-[11px] text-destructive">
            {t("portal.editor.image.invalid_url")}
          </p>
        )}
      </div>
    </Field>
  );
}

/** Import d'un fichier audio, avec son avancement. */
function AudioUploadButton({ onUploaded }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const { status, start } = useMediaUpload("audio", onUploaded);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        tabIndex={-1}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          start(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={Boolean(status)}
        onClick={() => inputRef.current?.click()}
        className="shrink-0"
      >
        {status ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="mr-1.5 h-3.5 w-3.5" />
        )}
        {status ? uploadingLabel(t, status) : t("portal.editor.image.upload")}
      </Button>
    </>
  );
}

/**
 * Musique jouée quand l'invité ouvre son invitation : fichier importé ou
 * lien direct vers un fichier audio (https).
 */
export function MusicField({ value, onChange }) {
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
      label={t("portal.editor.music.label")}
      htmlFor={id}
      hint={t("portal.editor.music.hint")}
    >
      {value && (
        <div className="flex items-center gap-2">
          <audio controls src={value} className="h-9 min-w-0 flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            aria-label={t("portal.editor.music.remove")}
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
          placeholder={t("portal.editor.music.placeholder")}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (!next || safeUrl(next)) onChange(next.trim());
          }}
          className="text-xs"
        />
        <AudioUploadButton onUploaded={onChange} />
      </div>
    </Field>
  );
}
