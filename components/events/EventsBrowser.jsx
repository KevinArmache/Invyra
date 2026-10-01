"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Eye,
  LayoutTemplate,
  MapPin,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  EmptyState,
  MiniRsvpBar,
  StatusBadge,
} from "@/components/shell/primitives";
import DeviceFrame from "@/components/invitation/DeviceFrame";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import TemplateThumbnail from "@/components/invitation/TemplateThumbnail";
import DeleteEventDialog from "@/components/events/DeleteEventDialog";
import { useTranslation } from "@/lib/i18n/Context";

const DAY = 86_400_000;

function formatDate(date, locale, fallback) {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );
}

/**
 * Jours entre aujourd'hui et la date de l'événement, en jours civils UTC
 * (les dates sont enregistrées ainsi). `today` vient du serveur : le rendu
 * serveur et l'hydratation tombent d'accord.
 */
function daysUntil(eventDate, today) {
  if (!eventDate) return null;
  const day = Date.parse(`${new Date(eventDate).toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.round((day - Date.parse(`${today}T00:00:00Z`)) / DAY);
}

/** Événement sous la forme attendue par les aperçus d'invitation. */
function previewEvent(event) {
  return {
    title: event.title,
    eventDate: event.eventDate,
    location: event.location,
    time: event.time,
    dressCode: event.dressCode,
    customMessage: event.customMessage,
  };
}

/**
 * Les événements arrivent déjà chargés depuis le Server Component parent.
 * Ce composant ne gère que le filtre de saisie et l'aperçu — le filtrage reste
 * en mémoire parce qu'un utilisateur a rarement assez d'événements pour
 * justifier un aller-retour serveur à chaque frappe.
 *
 * @param {string} props.today  AAAA-MM-JJ (UTC), pour les comptes à rebours
 */
export default function EventsBrowser({ events, today }) {
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

  function countdownLabel(days) {
    if (days == null) return null;
    if (days < 0) return t("common.countdown.past");
    if (days === 0) return t("common.countdown.today");
    if (days === 1) return t("common.countdown.tomorrow");
    return t("common.countdown.in_days").replace("{n}", String(days));
  }

  if (events.length === 0) {
    return (
      <div className="surface animate-rise rounded-xl" style={{ "--rise-delay": "150ms" }}>
        <EmptyState
          icon={Calendar}
          title={t("portal.events.list.no_events_yet")}
          description={t("portal.events.list.create_first_event")}
          action={
            <Button asChild>
              <Link href="/dashboard/events/new">
                <Plus size={18} />
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
      <div
        className="animate-rise relative mb-6 max-w-md"
        style={{ "--rise-delay": "120ms" }}
      >
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
        <div className="surface animate-scale-in rounded-xl">
          <EmptyState
            icon={Search}
            title={t("portal.events.list.no_events_found")}
            description={t("portal.events.list.try_different_search")}
          />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event, index) => {
            const guests = Number(event.guest_count) || 0;
            const confirmed = Number(event.confirmed_count) || 0;
            const declined = Number(event.declined_count) || 0;
            const maybe = Number(event.maybe_count) || 0;
            const days = daysUntil(event.eventDate, today);
            const countdown = countdownLabel(days);
            // Libellé puis nombre : pas d'accord singulier/pluriel à gérer.
            const rsvpSummary = [
              `${t("portal.analytics.confirmed")} ${confirmed}`,
              `${t("portal.analytics.declined")} ${declined}`,
              `${t("portal.events.details.guests.status.maybe")} ${maybe}`,
            ].join(" · ");

            return (
              <li
                key={event.id}
                data-reveal
                style={{ "--i": index % 3 }}
              >
                <article className="group tilt spotlight surface-interactive relative flex h-full flex-col overflow-hidden rounded-xl">
                  {/* Vignette de l'invitation, ou l'appel à choisir un modèle. */}
                  <div className="relative h-40 overflow-hidden border-b border-border/60 bg-ink-900">
                    {event.invitationTemplate ? (
                      <div className="absolute inset-0 transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]">
                        <TemplateThumbnail
                          template={event.invitationTemplate}
                          event={previewEvent(event)}
                          guestName={t("landing.hero.scene.guest")}
                          title={event.title}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-400">
                        <span className="animate-float flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
                          <LayoutTemplate className="h-4 w-4 text-gold/80" strokeWidth={1.6} />
                        </span>
                        <span className="text-xs">{t("portal.events.list.no_template")}</span>
                      </div>
                    )}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink-850 via-transparent to-ink-900/40"
                    />
                    <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                      <StatusBadge
                        status={event.status}
                        label={t(`portal.events.edit.status_${event.status}`)}
                      />
                      {countdown && (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap backdrop-blur ${
                            days != null && days >= 0
                              ? "border-gold/35 bg-ink-900/70 text-gold"
                              : "border-border bg-ink-900/70 text-ink-400"
                          }`}
                        >
                          {countdown}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-5">
                    <h3 className="text-lg leading-snug wrap-break-word text-ink-50">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        // Étend la zone cliquable à toute la carte, tout en
                        // laissant les boutons d'action au-dessus.
                        className="transition-colors before:absolute before:inset-0 hover:text-gold"
                      >
                        {event.title}
                      </Link>
                    </h3>

                    <dl className="mt-3 space-y-1.5 text-sm text-ink-400">
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">{t("portal.events.details.meta.date")}</dt>
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
                          <dt className="sr-only">{t("portal.events.details.meta.location")}</dt>
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <dd className="truncate">{event.location}</dd>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">{t("portal.events.list.guests")}</dt>
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <dd>
                          <span data-numeric>{guests}</span>{" "}
                          {t("portal.events.list.guests")}
                        </dd>
                      </div>
                    </dl>

                    {guests > 0 && (
                      <div className="mt-4 space-y-2">
                        <MiniRsvpBar
                          counts={{ confirmed, declined, maybe }}
                          total={guests}
                          label={rsvpSummary}
                          delay={200 + (index % 3) * 100}
                        />
                        <p className="text-xs text-ink-400">{rsvpSummary}</p>
                      </div>
                    )}
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
                      title={t("portal.events.list.preview_btn")}
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
                        title={t("portal.events.list.edit_btn")}
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
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="max-h-[94dvh] w-auto max-w-[95vw] overflow-y-auto border-0 bg-transparent p-2 shadow-none sm:max-w-none">
          <DialogTitle className="sr-only">
            {t("portal.events.list.preview_btn")}
          </DialogTitle>

          {preview?.invitationTemplate ? (
            <DeviceFrame glow={false} className="w-[min(88vw,21rem,calc((90dvh-1.5rem)*9/19))]">
              <InvitationPreview
                template={preview.invitationTemplate}
                event={previewEvent(preview)}
                guestName={t("landing.hero.scene.guest")}
              />
            </DeviceFrame>
          ) : (
            <div className="surface rounded-xl">
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
