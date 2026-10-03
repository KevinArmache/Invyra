"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Trash2,
  X,
} from "lucide-react";

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
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Photo ou vidéo en grand, avec navigation au clavier et au balayage.
 *
 * Une vidéo se lit avec les commandes du navigateur. Son lecteur est recréé
 * à chaque élément (clé), ce qui arrête la lecture quand on passe au suivant
 * ou qu'on ferme. Les flèches et le balayage sont laissés au lecteur quand il
 * a la main, pour qu'on puisse avancer dans la vidéo.
 */
export default function MediaViewer({ items, index, onIndexChange, onDelete }) {
  const { t } = useTranslation();
  const m = (key) => t(`invite.memories.${key}`);
  const open = index != null && items[index] != null;
  const item = open ? items[index] : null;
  const isVideo = item?.kind === "video";
  const touchStart = useRef(null);

  const go = useCallback(
    (step) => {
      if (index == null || items.length === 0) return;
      onIndexChange((index + step + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    function handleKey(event) {
      if (document.activeElement?.tagName === "VIDEO") return;
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, go]);

  const author = item?.mine ? m("you") : item?.name;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onIndexChange(null)}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="h-dvh max-h-dvh w-screen max-w-none rounded-none border-0 bg-black/95 p-0 sm:max-w-none"
        onTouchStart={(event) => {
          touchStart.current = event.target.closest?.("video")
            ? null
            : (event.touches[0]?.clientX ?? null);
        }}
        onTouchEnd={(event) => {
          if (touchStart.current == null) return;
          const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
          if (Math.abs(delta) > 50) go(delta > 0 ? -1 : 1);
          touchStart.current = null;
        }}
      >
        {item && (
          <div className="relative flex h-full w-full flex-col">
            <div className="flex items-center justify-between gap-3 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
              <DialogTitle className="min-w-0 truncate text-sm font-normal text-white/85">
                {m(isVideo ? "video_by" : "photo_by").replace("{name}", author)}
              </DialogTitle>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" asChild className="text-white/80 hover:text-white">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={m("viewer_original")}
                  >
                    <ExternalLink />
                  </a>
                </Button>
                {item.mine && onDelete && (
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
                        <AlertDialogTitle>
                          {m(isVideo ? "delete_video_confirm" : "delete_photo_confirm")}
                        </AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(item)}
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
              {isVideo ? (
                <VideoPlayer key={item.id} item={item} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- photo d'invité sur Vercel Blob, l'optimiseur est désactivé
                <img
                  key={item.id}
                  src={item.url}
                  alt=""
                  className="animate-scale-in max-h-full max-w-full rounded-lg object-contain"
                />
              )}
              {items.length > 1 && (
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

/**
 * Lecteur d'une vidéo. Un format que l'appareil ne lit pas (vidéo HEVC
 * d'iPhone sur certains navigateurs) laisse place à un lien vers le fichier.
 */
function VideoPlayer({ item }) {
  const { t } = useTranslation();
  const m = (key) => t(`invite.memories.${key}`);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex max-w-xs flex-col items-center gap-4 text-center">
        <Film className="h-10 w-10 text-white/50" strokeWidth={1.25} aria-hidden="true" />
        <p className="text-sm leading-relaxed text-white/80">{m("video_unplayable")}</p>
        <Button asChild variant="outline">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            {m("video_open")}
          </a>
        </Button>
      </div>
    );
  }

  return (
    <video
      src={item.url}
      poster={item.posterUrl || undefined}
      controls
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      className="animate-scale-in max-h-full max-w-full rounded-lg bg-black"
    />
  );
}
