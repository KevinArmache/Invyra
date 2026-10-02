"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { addEventPhoto, deleteMyPhoto } from "@/app/actions/memories";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { prepareImage } from "@/lib/media/prepare-image";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Mur de photos de l'événement, vu par un invité : il ajoute les siennes
 * (plusieurs à la fois), voit celles des autres et les ouvre en grand.
 *
 * Chaque photo est préparée dans le navigateur (prepareImage : 2000 px au
 * plus, JPEG léger), envoyée directement sur Vercel Blob (le jeton
 * d'invitation sert d'autorisation, voir app/api/upload/route.js), puis
 * enregistrée par addEventPhoto.
 */
export default function PhotoWall({
  token,
  eventId,
  initialPhotos,
  initialCount,
  max,
  enabled,
}) {
  const { t } = useTranslation();
  const m = (key) => t(`invite.memories.${key}`);
  const [photos, setPhotos] = useState(initialPhotos);
  const [count, setCount] = useState(initialCount);
  const [progress, setProgress] = useState(null);
  const [viewer, setViewer] = useState(null);
  const inputRef = useRef(null);

  const left = Math.max(0, max - count);

  async function handleFiles(fileList) {
    const files = Array.from(fileList ?? []).slice(0, left);
    if (files.length === 0) {
      toast.error(m("photos_limit").replace("{count}", String(max)));
      return;
    }

    const { upload } = await import("@vercel/blob/client");
    setProgress({ done: 0, total: files.length });
    let added = 0;

    for (const file of files) {
      try {
        const prepared = await prepareImage(file);
        const size = await measure(prepared);
        const extension = prepared.name.split(".").pop()?.toLowerCase() || "jpg";
        const blob = await upload(`memories/${eventId}/photo.${extension}`, prepared, {
          access: "public",
          handleUploadUrl: "/api/upload",
          clientPayload: JSON.stringify({ token }),
        });
        const photo = await addEventPhoto(token, {
          url: blob.url,
          pathname: blob.pathname,
          ...size,
        });
        setPhotos((current) => [photo, ...current]);
        setCount((value) => value + 1);
        added += 1;
      } catch {
        // Compté plus bas : un échec n'arrête pas les autres photos.
      }
      setProgress((current) => current && { ...current, done: current.done + 1 });
    }

    setProgress(null);
    if (added > 0) {
      toast.success(
        added > 1
          ? m("photos_added_other").replace("{count}", String(added))
          : m("photos_added_one"),
      );
    }
    if (added < files.length) toast.error(m("photos_error"));
  }

  async function handleDelete(photo) {
    try {
      await deleteMyPhoto(token, photo.id);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setCount((value) => Math.max(0, value - 1));
      setViewer(null);
      toast.success(m("deleted"));
    } catch {
      toast.error(m("error"));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="photos-title"
          className="flex items-center gap-2.5 font-display text-2xl text-ink-50"
        >
          <Camera className="h-5 w-5 text-gold/80" strokeWidth={1.5} aria-hidden="true" />
          {m("photos_title")}
        </h2>
        {enabled && (
          <p className="text-xs text-ink-400">
            {m("photos_hint").replace("{count}", String(max))}
          </p>
        )}
      </div>

      {!enabled && (
        <p className="mt-5 rounded-2xl border border-border/60 bg-ink-850/60 px-5 py-4 text-sm text-ink-400">
          {m("photos_disabled")}
        </p>
      )}

      <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
        {enabled && (
          <li>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={Boolean(progress) || left === 0}
              className="group flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold/35 bg-gold/5 px-3 text-center text-xs text-gold transition-colors duration-300 hover:border-gold/70 hover:bg-gold/10 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {progress ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                  <span data-numeric aria-live="polite">
                    {m("photos_uploading")
                      .replace("{done}", String(progress.done))
                      .replace("{total}", String(progress.total))}
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus
                    className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  {left === 0
                    ? m("photos_limit").replace("{count}", String(max))
                    : m("photos_add")}
                </>
              )}
            </button>
          </li>
        )}

        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setViewer(index)}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-ink-800 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              aria-label={m("photo_by").replace("{name}", photo.mine ? m("you") : photo.name)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- photo d'invité sur Vercel Blob, l'optimiseur est désactivé */}
              <img
                src={photo.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/70 to-transparent px-2.5 pt-6 pb-2 text-left text-[11px] text-white/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                {photo.mine ? m("you") : photo.name}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {photos.length === 0 && enabled && (
        <p className="mt-4 text-sm text-ink-400">{m("photos_empty")}</p>
      )}

      <PhotoViewer
        photos={photos}
        index={viewer}
        onIndexChange={setViewer}
        onDelete={handleDelete}
      />
    </div>
  );
}

/** Photo en grand, avec navigation au clavier et au balayage. */
function PhotoViewer({ photos, index, onIndexChange, onDelete }) {
  const { t } = useTranslation();
  const m = (key) => t(`invite.memories.${key}`);
  const open = index != null && photos[index] != null;
  const photo = open ? photos[index] : null;
  const touchStart = useRef(null);

  const go = useCallback(
    (step) => {
      if (index == null || photos.length === 0) return;
      onIndexChange((index + step + photos.length) % photos.length);
    },
    [index, photos.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    function handleKey(event) {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, go]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onIndexChange(null)}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="h-dvh max-h-dvh w-screen max-w-none rounded-none border-0 bg-black/95 p-0 sm:max-w-none"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current == null) return;
          const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
          if (Math.abs(delta) > 50) go(delta > 0 ? -1 : 1);
          touchStart.current = null;
        }}
      >
        {photo && (
          <div className="relative flex h-full w-full flex-col">
            <div className="flex items-center justify-between gap-3 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
              <DialogTitle className="min-w-0 truncate text-sm font-normal text-white/85">
                {m("photo_by").replace("{name}", photo.mine ? m("you") : photo.name)}
              </DialogTitle>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" asChild className="text-white/80 hover:text-white">
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={m("viewer_original")}
                  >
                    <ExternalLink />
                  </a>
                </Button>
                {photo.mine && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/80 hover:text-destructive"
                        aria-label={m("delete")}
                      >
                        <Trash2 />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent aria-describedby={undefined}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{m("delete_photo_confirm")}</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(photo)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {m("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white"
                  onClick={() => onIndexChange(null)}
                  aria-label={m("viewer_close")}
                >
                  <X />
                </Button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {/* eslint-disable-next-line @next/next/no-img-element -- photo d'invité sur Vercel Blob, l'optimiseur est désactivé */}
              <img
                key={photo.id}
                src={photo.url}
                alt=""
                className="animate-scale-in max-h-full max-w-full rounded-lg object-contain"
              />
              {photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="absolute left-2 hidden rounded-full bg-black/40 text-white hover:bg-black/60 sm:inline-flex"
                    onClick={() => go(-1)}
                    aria-label={m("viewer_prev")}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="absolute right-2 hidden rounded-full bg-black/40 text-white hover:bg-black/60 sm:inline-flex"
                    onClick={() => go(1)}
                    aria-label={m("viewer_next")}
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Dimensions d'une image préparée ; vide si le navigateur ne sait pas les lire. */
async function measure(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return size;
  } catch {
    return {};
  }
}
