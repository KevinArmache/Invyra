"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { addEventPhoto, deleteMyPhoto } from "@/app/actions/memories";
import MediaThumb from "@/components/memories/MediaThumb";
import MediaViewer from "@/components/memories/MediaViewer";
import { prepareImage } from "@/lib/media/prepare-image";
import { readVideo } from "@/lib/media/prepare-video";
import {
  MAX_VIDEO_BYTES,
  POSTER_TYPE,
  isVideoType,
  mediaTypeOf,
  memoryPath,
  uploadErrorCode,
} from "@/lib/media/memories";
import { useTranslation } from "@/lib/i18n/Context";

const VIDEO_MB = MAX_VIDEO_BYTES / (1024 * 1024);

/** Au-delà, une vidéo part en plusieurs morceaux, relancés en cas d'échec. */
const MULTIPART_BYTES = 10 * 1024 * 1024;

/**
 * Mur des photos et vidéos de l'événement, vu par un invité : il ajoute les
 * siennes (plusieurs à la fois), voit celles des autres et les ouvre en grand.
 *
 * Chaque fichier est d'abord vérifié dans le navigateur (format, poids,
 * limites) : un refus du serveur n'arrive au navigateur que sous forme d'un
 * message générique. Une photo est ensuite préparée (prepareImage : 2000 px
 * au plus, JPEG léger) ; une vidéo part telle quelle, avec une image
 * d'aperçu (readVideo). Les fichiers vont directement sur Vercel Blob (le
 * jeton d'invitation sert d'autorisation, voir app/api/upload/route.js), puis
 * sont enregistrés par addEventPhoto.
 */
export default function PhotoWall({
  token,
  eventId,
  initialPhotos,
  initialCount,
  initialVideoCount = 0,
  max,
  maxVideos,
  enabled,
}) {
  const { t } = useTranslation();
  const m = (key) => t(`invite.memories.${key}`);
  const [photos, setPhotos] = useState(initialPhotos);
  const [count, setCount] = useState(initialCount);
  const [videoCount, setVideoCount] = useState(initialVideoCount);
  const [progress, setProgress] = useState(null);
  const [viewer, setViewer] = useState(null);
  const inputRef = useRef(null);

  const left = Math.max(0, max - count);
  const uploading = Boolean(progress);

  // Quitter la page pendant un envoi l'interromprait.
  useEffect(() => {
    if (!uploading) return;
    function warn(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  /** « IMG_1.jpg » ou « IMG_1.jpg et 2 autres ». */
  function filesLabel(names) {
    if (names.length === 1) return names[0];
    return m("files_other")
      .replace("{name}", names[0])
      .replace("{count}", String(names.length - 1));
  }

  function errorMessage(code, names) {
    const key = [
      "type",
      "size",
      "video_size",
      "limit",
      "video_limit",
      "closed",
      "refused",
      "network",
    ].includes(code)
      ? code
      : "server";
    return m(`error_${key}`)
      .replace("{files}", filesLabel(names))
      .replace("{count}", String(key === "video_limit" ? maxVideos : max))
      .replace("{size}", String(VIDEO_MB));
  }

  function successMessage({ photo, video }) {
    if (video === 0) {
      return photo > 1
        ? m("photos_added_other").replace("{count}", String(photo))
        : m("photos_added_one");
    }
    if (photo === 0) {
      return video > 1
        ? m("videos_added_other").replace("{count}", String(video))
        : m("videos_added_one");
    }
    return m("media_added").replace("{count}", String(photo + video));
  }

  const trackProgress = ({ percentage }) =>
    setProgress((current) => current && { ...current, percent: percentage });

  function uploadOptions(contentType) {
    return {
      access: "public",
      contentType,
      handleUploadUrl: "/api/upload",
      clientPayload: JSON.stringify({ token }),
    };
  }

  async function save(data) {
    const result = await addEventPhoto(token, data);
    if (result?.error) throw new Error(result.error);
    return result.photo;
  }

  async function sendPhoto(upload, file) {
    const prepared = await prepareImage(file);
    const size = await measure(prepared);
    const blob = await upload(memoryPath(eventId, "photo", prepared.type), prepared, {
      ...uploadOptions(prepared.type),
      onUploadProgress: trackProgress,
    });
    return save({ url: blob.url, pathname: blob.pathname, ...size });
  }

  async function sendVideo(upload, file) {
    const info = await readVideo(file);
    const blob = await upload(memoryPath(eventId, "video", file.type), file, {
      ...uploadOptions(file.type),
      multipart: file.size > MULTIPART_BYTES,
      onUploadProgress: trackProgress,
    });

    // Sans aperçu, la vidéo s'affiche quand même (icône à la place).
    let posterUrl = null;
    if (info.poster) {
      try {
        const poster = await upload(
          memoryPath(eventId, "poster"),
          info.poster,
          uploadOptions(POSTER_TYPE),
        );
        posterUrl = poster.url;
      } catch (error) {
        console.warn("[PhotoWall] Aperçu non envoyé :", file.name, error);
      }
    }

    return save({
      url: blob.url,
      pathname: blob.pathname,
      width: info.width,
      height: info.height,
      duration: info.duration,
      posterUrl,
    });
  }

  async function handleFiles(fileList) {
    const picked = Array.from(fileList ?? []);
    if (picked.length === 0) return;

    // Causes d'échec, chacune avec ses fichiers : un seul message par cause.
    const failures = {};
    const fail = (code, name) => {
      (failures[code] ??= []).push(name);
    };

    let slots = max - count;
    let videoSlots = maxVideos - videoCount;
    const queue = [];
    for (const original of picked) {
      const type = mediaTypeOf(original);
      const video = isVideoType(type);
      // Un sélecteur Android omet parfois le type : il est rétabli.
      const file =
        original.type === type ? original : new File([original], original.name, { type });

      if (!video && !type.startsWith("image/")) fail("type", file.name);
      else if (video && file.size > MAX_VIDEO_BYTES) fail("video_size", file.name);
      else if (slots <= 0) fail("limit", file.name);
      else if (video && videoSlots <= 0) fail("video_limit", file.name);
      else {
        slots -= 1;
        if (video) videoSlots -= 1;
        queue.push({ file, video });
      }
    }

    if (queue.length > 0) {
      const { upload } = await import("@vercel/blob/client");
      setProgress({ done: 0, total: queue.length, percent: null });
      const added = { photo: 0, video: 0 };

      for (const { file, video } of queue) {
        try {
          const photo = video
            ? await sendVideo(upload, file)
            : await sendPhoto(upload, file);
          setPhotos((current) => [photo, ...current]);
          setCount((value) => value + 1);
          if (photo.kind === "video") setVideoCount((value) => value + 1);
          added[photo.kind === "video" ? "video" : "photo"] += 1;
        } catch (error) {
          console.error("[PhotoWall] Envoi impossible :", file.name, error);
          const code = uploadErrorCode(error);
          fail(video && code === "size" ? "video_size" : code, file.name);
        }
        setProgress(
          (current) => current && { ...current, done: current.done + 1, percent: null },
        );
      }

      setProgress(null);
      if (added.photo + added.video > 0) toast.success(successMessage(added));
    }

    for (const [code, names] of Object.entries(failures)) {
      toast.error(errorMessage(code, names));
    }
  }

  async function handleDelete(photo) {
    try {
      await deleteMyPhoto(token, photo.id);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setCount((value) => Math.max(0, value - 1));
      if (photo.kind === "video") setVideoCount((value) => Math.max(0, value - 1));
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
            {m("photos_hint")
              .replace("{count}", String(max))
              .replace("{videos}", String(maxVideos))
              .replace("{size}", String(VIDEO_MB))}
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
              accept="image/*,video/*"
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
              disabled={uploading || left === 0}
              className="group flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold/35 bg-gold/5 px-3 text-center text-xs text-gold transition-colors duration-300 hover:border-gold/70 hover:bg-gold/10 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {progress ? (
                <UploadStatus progress={progress} m={m} />
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
              aria-label={m(photo.kind === "video" ? "video_by" : "photo_by").replace(
                "{name}",
                photo.mine ? m("you") : photo.name,
              )}
            >
              <MediaThumb
                item={photo}
                className="transition-transform duration-700 ease-out group-hover:scale-105"
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

      <MediaViewer
        items={photos}
        index={viewer}
        onIndexChange={setViewer}
        onDelete={handleDelete}
      />
    </div>
  );
}

/** Avancement dans la tuile d'ajout : fichier en cours, pourcentage, barre. */
function UploadStatus({ progress, m }) {
  const current = Math.min(progress.done + 1, progress.total);
  const percent = progress.percent == null ? null : Math.round(progress.percent);

  return (
    <>
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span data-numeric aria-live="polite">
        {m("photos_uploading")
          .replace("{done}", String(current))
          .replace("{total}", String(progress.total))}
        {percent == null ? "" : ` · ${m("photos_percent").replace("{n}", String(percent))}`}
      </span>
      <span className="h-1 w-3/4 overflow-hidden rounded-full bg-ink-800">
        <span
          className={`block h-full rounded-full bg-gold transition-[width] duration-300 ${
            percent == null ? "animate-pulse" : ""
          }`}
          style={{ width: `${percent == null ? 12 : Math.max(4, percent)}%` }}
        />
      </span>
    </>
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
