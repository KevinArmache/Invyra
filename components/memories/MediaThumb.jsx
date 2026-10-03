import { Film, Play } from "lucide-react";

import { formatDuration } from "@/lib/media/memories";

/**
 * Vignette carrée d'un souvenir, pour le mur des invités (PhotoWall) et
 * l'onglet de modération de l'hôte (TabMemories). Remplit son parent.
 *
 * Une vidéo n'est jamais chargée dans la grille : son aperçu (posterUrl)
 * la remplace, avec un repère de lecture et sa durée. Sans aperçu (vidéo que
 * le navigateur de l'invité n'a pas su lire), une icône en tient lieu.
 */
export default function MediaThumb({ item, alt = "", className = "" }) {
  const isVideo = item.kind === "video";
  const src = isVideo ? item.posterUrl : item.url;

  return (
    <span className={`relative block h-full w-full ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- fichier d'invité sur Vercel Blob, l'optimiseur est désactivé
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-linear-to-br from-ink-800 to-ink-850">
          <Film className="h-8 w-8 text-ink-400" strokeWidth={1.25} aria-hidden="true" />
          {alt && <span className="sr-only">{alt}</span>}
        </span>
      )}

      {isVideo && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-sm">
              <Play className="ml-0.5 h-5 w-5 fill-current" strokeWidth={1.5} />
            </span>
          </span>
          {item.duration > 0 && (
            <span
              data-numeric
              className="pointer-events-none absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] leading-none text-white/90"
            >
              {formatDuration(item.duration)}
            </span>
          )}
        </>
      )}
    </span>
  );
}
