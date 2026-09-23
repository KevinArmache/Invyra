"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Eye, MapPin, Pencil, Plus, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, StatusBadge } from "@/components/dashboard/ui";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import DeleteEventDialog from "@/components/dashboard/events/DeleteEventDialog";
import { useTranslation } from "@/utils/i18n/Context";

function formatDate(date, locale, fallback) {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { weekday: "short", day: "numeric", month: "short", year: "numeric" },
  );
}

/**
 * Les événements arrivent déjà chargés depuis le Server Component parent.
 * Ce composant ne gère que le filtre de saisie et l'aperçu — le filtrage reste
 * en mémoire parce qu'un utilisateur a rarement assez d'événements pour
 * justifier un aller-retour serveur à chaque frappe.
 */
export default function EventsBrowser({ events }) {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return events;
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(needle) ||
        (event.location || "").toLowerCase().includes(needle),
    );
  }, [events, query]);

  if (events.length === 0) {
    return (
      <div className="surface">
        <EmptyState
          icon={Calendar}
          title={t("portal.events.list.no_events_yet")}
          description={t("portal.events.list.create_first_event")}
          action={
            <Button asChild>
              <Link href="/dashboard/events/new">
                <Plus size={18} className="mr-2" />
                {t("portal.events.list.create_btn")}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-6 max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("portal.events.list.search_placeholder")}
          aria-label={t("portal.events.list.search_placeholder")}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Search}
            title={t("portal.events.list.no_events_found")}
            description={t("portal.events.list.try_different_search")}
          />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <li
              key={event.id}
              // `relative` ancre le pseudo-élément qui rend toute la carte
              // cliquable.
              className="surface-interactive relative flex flex-col"
            >
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gold/20 bg-gold/5">
                    <Calendar
                      className="h-5 w-5 text-gold/80"
                      strokeWidth={1.5}
                    />
                  </span>
                  <StatusBadge status={event.status} />
                </div>

                <h3 className="mt-4 text-lg leading-snug wrap-break-word text-ink-50">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    // Étend la zone cliquable à toute la carte, tout en
                    // laissant les boutons d'action au-dessus.
                    className="before:absolute before:inset-0 hover:text-gold"
                  >
                    {event.title}
                  </Link>
                </h3>

                <dl className="mt-3 space-y-1.5 text-sm text-ink-400">
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Date</dt>
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <dd>
                      {formatDate(
                        event.eventDate,
                        locale,
                        t("portal.events.list.date_not_set"),
                      )}
                    </dd>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <dt className="sr-only">Lieu</dt>
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <dd className="truncate">{event.location}</dd>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">{t("portal.events.list.guests")}</dt>
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <dd>
                      <span data-numeric>{event.guest_count || 0}</span>{" "}
                      {t("portal.events.list.guests")}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* `relative z-10` garde ces boutons cliquables au-dessus du
                  pseudo-élément qui rend la carte entière cliquable. */}
              <div className="relative z-10 flex items-center gap-1 border-t border-border/60 px-3 py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-ink-400 hover:text-ink-50"
                  onClick={() => setPreview(event)}
                  aria-label={t("portal.events.list.preview_btn")}
                >
                  <Eye size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-8 w-8 text-ink-400 hover:text-ink-50"
                >
                  <Link
                    href={`/dashboard/events/${event.id}/edit`}
                    aria-label={t("portal.events.list.edit_btn")}
                  >
                    <Pencil size={16} />
                  </Link>
                </Button>
                <div className="ml-auto">
                  <DeleteEventDialog
                    eventId={event.id}
                    eventTitle={event.title}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="h-[90vh] max-w-[95vw] overflow-hidden border-border bg-black p-0 md:max-w-[620px]">
          <DialogTitle className="sr-only">
            {t("portal.events.list.preview_btn")}
          </DialogTitle>

          {preview?.invitationTemplate ? (
            <div className="h-full w-full overflow-auto">
              <InvitationPreview
                template={preview.invitationTemplate}
                event={{
                  title: preview.title,
                  eventDate: preview.eventDate,
                  location: preview.location,
                  time: preview.time,
                  dressCode: preview.dressCode,
                  customMessage: preview.customMessage,
                }}
                guestName="Exemple Invité"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <EmptyState
                icon={Eye}
                title={t("portal.events.edit.no_preview")}
                action={
                  <Button asChild variant="outline">
                    <Link
                      href={`/dashboard/events/${preview?.id}/template`}
                      onClick={() => setPreview(null)}
                    >
                      {t("portal.events.edit.select_template")}
                    </Link>
                  </Button>
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
