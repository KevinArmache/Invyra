"use client";

import { useState } from "react";
import { Camera, ExternalLink, Eye, EyeOff, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteMessage,
  deletePhoto,
  setMessageHidden,
  setPhotoHidden,
  updateMemoriesSettings,
} from "@/app/actions/memories";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState, Panel } from "@/components/shell/primitives";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Onglet « Souvenirs » d'un événement : livre d'or et photos partagés par
 * les invités (voir app/actions/memories.js).
 *
 * Le propriétaire et les éditeurs ouvrent ou ferment chaque espace, masquent
 * (l'élément disparaît pour les invités, réversible) ou suppriment. Un
 * collaborateur en lecture seule voit tout sans pouvoir agir.
 *
 * @param {object} props.memories  résultat de getEventMemories
 */
export default function TabMemories({ eventId, memories }) {
  const { t, locale } = useTranslation();
  const k = (key) => t(`portal.events.details.memories.${key}`);
  const { canManage } = memories;
  const [settings, setSettings] = useState({
    guestbookEnabled: memories.guestbookEnabled,
    photosEnabled: memories.photosEnabled,
  });
  const [messages, setMessages] = useState(memories.messages);
  const [photos, setPhotos] = useState(memories.photos);

  const dateOf = (value) =>
    new Date(value).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  /** Exécute une action ; en cas d'échec, l'état précédent est rétabli. */
  async function run(action, rollback) {
    try {
      await action();
    } catch (caught) {
      rollback?.();
      toast.error(caught.message || t("common.error"));
    }
  }

  function toggleSetting(key) {
    const previous = settings;
    const value = !settings[key];
    setSettings({ ...settings, [key]: value });
    run(async () => {
      await updateMemoriesSettings(eventId, { [key]: value });
      toast.success(k("settings_saved"));
    }, () => setSettings(previous));
  }

  function toggleMessage(message) {
    const previous = messages;
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, hidden: !item.hidden } : item,
      ),
    );
    run(() => setMessageHidden(message.id, !message.hidden), () => setMessages(previous));
  }

  function removeMessage(message) {
    const previous = messages;
    setMessages((current) => current.filter((item) => item.id !== message.id));
    run(async () => {
      await deleteMessage(message.id);
      toast.success(k("deleted"));
    }, () => setMessages(previous));
  }

  function togglePhoto(photo) {
    const previous = photos;
    setPhotos((current) =>
      current.map((item) =>
        item.id === photo.id ? { ...item, hidden: !item.hidden } : item,
      ),
    );
    run(() => setPhotoHidden(photo.id, !photo.hidden), () => setPhotos(previous));
  }

  function removePhoto(photo) {
    const previous = photos;
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    run(async () => {
      await deletePhoto(photo.id);
      toast.success(k("deleted"));
    }, () => setPhotos(previous));
  }

  return (
    <div className="grid gap-6">
      <Panel title={k("title")} description={k("subtitle")}>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <SwitchRow
            id="memories-guestbook"
            label={k("guestbook_toggle")}
            checked={settings.guestbookEnabled}
            disabled={!canManage}
            onChange={() => toggleSetting("guestbookEnabled")}
          />
          <SwitchRow
            id="memories-photos"
            label={k("photos_toggle")}
            checked={settings.photosEnabled}
            disabled={!canManage}
            onChange={() => toggleSetting("photosEnabled")}
          />
        </div>
        <p className="px-5 pb-5 text-xs leading-relaxed text-ink-400">{k("guest_access")}</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel title={`${k("guestbook")} (${messages.length})`} delay={100}>
          {messages.length === 0 ? (
            <EmptyState icon={PenLine} title={k("messages_empty")} />
          ) : (
            <ul className="divide-y divide-border/60">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={`flex gap-3 px-5 py-4 transition-opacity duration-300 ${
                    message.hidden ? "opacity-55" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed whitespace-pre-line text-ink-100 wrap-break-word">
                      {message.message}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-400">
                      <span className="text-gold">{message.name}</span>
                      <span data-numeric>{dateOf(message.createdAt)}</span>
                      {message.hidden && (
                        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-ink-300">
                          {k("hidden")}
                        </span>
                      )}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-start gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-ink-400 hover:text-gold"
                        onClick={() => toggleMessage(message)}
                        aria-label={message.hidden ? k("show") : k("hide")}
                        title={message.hidden ? k("show") : k("hide")}
                      >
                        {message.hidden ? <Eye /> : <EyeOff />}
                      </Button>
                      <ConfirmDelete
                        title={k("delete_message_confirm")}
                        onConfirm={() => removeMessage(message)}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`${k("photos")} (${photos.length})`} delay={160}>
          {photos.length === 0 ? (
            <EmptyState icon={Camera} title={k("photos_empty")} />
          ) : (
            <ul className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:gap-3 sm:p-5 xl:grid-cols-4">
              {photos.map((photo) => (
                <li
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-ink-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- photo d'invité sur Vercel Blob, l'optimiseur est désactivé */}
                  <img
                    src={photo.url}
                    alt={k("by").replace("{name}", photo.name)}
                    loading="lazy"
                    decoding="async"
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      photo.hidden ? "opacity-35" : ""
                    }`}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-linear-to-t from-black/80 to-transparent px-2 pt-8 pb-1.5">
                    <span className="min-w-0 truncate pb-1 text-[11px] text-white/85">
                      {photo.hidden ? k("hidden") : photo.name}
                    </span>
                    <span className="flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        asChild
                        className="text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={k("open_original")}
                          title={k("open_original")}
                        >
                          <ExternalLink />
                        </a>
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-white/80 hover:bg-white/10 hover:text-white"
                            onClick={() => togglePhoto(photo)}
                            aria-label={photo.hidden ? k("show") : k("hide")}
                            title={photo.hidden ? k("show") : k("hide")}
                          >
                            {photo.hidden ? <Eye /> : <EyeOff />}
                          </Button>
                          <ConfirmDelete
                            title={k("delete_photo_confirm")}
                            onConfirm={() => removePhoto(photo)}
                            className="text-white/80 hover:bg-white/10 hover:text-destructive"
                          />
                        </>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/** Interrupteur : un réglage ouvert ou fermé. */
function SwitchRow({ id, label, checked, disabled, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-ink-800/30 px-4 py-3">
      <label htmlFor={id} className="text-sm text-ink-100">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "border-gold/60 bg-gold/80" : "border-border bg-ink-700"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4.5 w-4.5 rounded-full bg-ink-50 shadow transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ConfirmDelete({ title, onConfirm, className = "text-ink-400 hover:text-destructive" }) {
  const { t } = useTranslation();
  const k = (key) => t(`portal.events.details.memories.${key}`);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className={className} aria-label={k("delete")}>
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{k("delete_desc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {k("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
