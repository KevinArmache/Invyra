"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Eye, MapPin, Pencil, Search, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, Panel, StatusBadge } from "@/components/shell/primitives";
import { useTranslation } from "@/lib/i18n/Context";

const STATUSES = ["draft", "active", "archived"];

/** Pastille du propriétaire : initiale, nom, e-mail, « (vous) » si c'est soi. */
function Owner({ owner, isSelf }) {
  const { t } = useTranslation();
  const label = owner?.name || owner?.email || "?";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold"
      >
        {label.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-ink-100">
          {label}
          {isSelf && (
            <span className="ml-2 text-xs text-ink-400">
              ({t("portal.admin.you")})
            </span>
          )}
        </p>
        {owner?.name && (
          <p className="truncate text-xs text-ink-400">{owner.email}</p>
        )}
      </div>
    </div>
  );
}

/** Voir et modifier : l'admin a accès à tous les événements. */
function EventActions({ event }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="h-8 w-8 text-ink-400 hover:text-ink-50"
      >
        <Link
          href={`/dashboard/events/${event.id}`}
          aria-label={`${t("portal.admin.view_event")} : ${event.title}`}
          title={t("portal.admin.view_event")}
        >
          <Eye size={16} />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="h-8 w-8 text-ink-400 hover:text-ink-50"
      >
        <Link
          href={`/dashboard/events/${event.id}/edit`}
          aria-label={`${t("portal.admin.edit_event")} : ${event.title}`}
          title={t("portal.admin.edit_event")}
        >
          <Pencil size={16} />
        </Link>
      </Button>
    </div>
  );
}

/**
 * Tous les événements de la plateforme, chacun avec la mention de son
 * propriétaire. Recherche et filtre restent en mémoire, comme pour la liste
 * des utilisateurs.
 *
 * Sur grand écran, un tableau ; en dessous, des cartes empilées.
 *
 * @param {string} props.currentUserId  pour marquer « (vous) » ses propres événements
 */
export default function AdminEventsTable({ events, currentUserId }) {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  /** Les dates d'événement sont enregistrées à minuit UTC : lues en UTC. */
  function eventDay(date) {
    if (!date) return t("portal.events.list.date_not_set");
    return new Date(date).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  // En UTC aussi : le rendu serveur et l'hydratation affichent le même jour.
  function createdDay(date) {
    return new Date(date).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const counts = useMemo(() => {
    const result = { all: events.length };
    for (const value of STATUSES) {
      result[value] = events.filter((event) => event.status === value).length;
    }
    return result;
  }, [events]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return events.filter((event) => {
      if (status !== "all" && event.status !== status) return false;
      if (!needle) return true;
      return [event.title, event.location, event.user?.name, event.user?.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [events, query, status]);

  // Libellé puis nombre : pas d'accord singulier/pluriel à gérer.
  function guestsSummary(event) {
    return `${t("portal.analytics.confirmed")} ${event.confirmedCount}`;
  }

  return (
    <>
      <div
        className="animate-rise mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        style={{ "--rise-delay": "100ms" }}
      >
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("portal.admin.search_events")}
            aria-label={t("portal.admin.search_events")}
            className="pl-9"
          />
        </div>

        <div
          role="radiogroup"
          aria-label={t("portal.admin.filter_status")}
          className="flex flex-wrap gap-2"
        >
          {["all", ...STATUSES].map((value) => {
            const active = value === status;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setStatus(value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-gold bg-gold/10 text-ink-50"
                    : "border-border text-ink-300 hover:border-gold/40"
                }`}
              >
                {value === "all"
                  ? t("portal.admin.all_statuses")
                  : t(`portal.events.edit.status_${value}`)}{" "}
                <span data-numeric className="text-ink-400">
                  {counts[value]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Panel delay={180}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={events.length === 0 ? Calendar : Search}
            title={
              events.length === 0
                ? t("portal.admin.no_events")
                : t("common.no_results")
            }
          />
        ) : (
          <>
            {/* Mobile et tablette : cartes empilées. */}
            <ul className="divide-y divide-border/60 lg:hidden">
              {filtered.map((event) => (
                <li key={event.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="text-ink-50 transition-colors wrap-break-word hover:text-gold"
                      >
                        {event.title}
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {eventDay(event.eventDate)}
                        </span>
                        {event.location && (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                      </p>
                    </div>
                    <StatusBadge
                      status={event.status}
                      label={t(`portal.events.edit.status_${event.status}`)}
                    />
                  </div>

                  <p className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs text-gold">
                    <UserRound className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {t("portal.admin.owner")} : {event.user?.name || event.user?.email}
                      {event.user?.id === currentUserId &&
                        ` (${t("portal.admin.you")})`}
                    </span>
                  </p>
                  {event.user?.name && (
                    <p className="mt-1 truncate text-xs text-ink-400">
                      {event.user.email}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-ink-400">
                      <span data-numeric className="text-ink-100">
                        {event.guestCount}
                      </span>{" "}
                      {t("portal.events.list.guests")} · {guestsSummary(event)}
                    </p>
                    <EventActions event={event} />
                  </div>
                </li>
              ))}
            </ul>

            {/* Grand écran : tableau. */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[56rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left">
                    <th scope="col" className="px-5 py-3 font-normal text-ink-400">
                      {t("portal.admin.event")}
                    </th>
                    <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                      {t("portal.admin.owner")}
                    </th>
                    <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                      {t("portal.admin.date")}
                    </th>
                    <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                      {t("portal.admin.status")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right font-normal text-ink-400"
                    >
                      {t("portal.admin.guests")}
                    </th>
                    <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                      {t("portal.admin.created_on")}
                    </th>
                    <th scope="col" className="px-5 py-3">
                      <span className="sr-only">{t("portal.admin.actions")}</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/60">
                  {filtered.map((event, index) => (
                    <tr
                      key={event.id}
                      className="animate-rise transition-colors duration-300 hover:bg-ink-800/40"
                      style={{
                        "--rise-delay": `${200 + Math.min(index, 12) * 40}ms`,
                      }}
                    >
                      <th
                        scope="row"
                        className="max-w-xs px-5 py-3.5 text-left font-normal"
                      >
                        <Link
                          href={`/dashboard/events/${event.id}`}
                          className="block truncate text-ink-100 transition-colors hover:text-gold"
                        >
                          {event.title}
                        </Link>
                        {event.location && (
                          <p className="truncate text-xs text-ink-400">
                            {event.location}
                          </p>
                        )}
                      </th>

                      <td className="max-w-[16rem] px-3 py-3.5">
                        <Owner
                          owner={event.user}
                          isSelf={event.user?.id === currentUserId}
                        />
                      </td>

                      <td className="px-3 py-3.5 whitespace-nowrap text-ink-300">
                        {eventDay(event.eventDate)}
                      </td>

                      <td className="px-3 py-3.5">
                        <StatusBadge
                          status={event.status}
                          label={t(`portal.events.edit.status_${event.status}`)}
                        />
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        <p data-numeric className="text-ink-100">
                          {event.guestCount}
                        </p>
                        <p className="text-xs whitespace-nowrap text-ink-400">
                          {guestsSummary(event)}
                        </p>
                      </td>

                      <td className="px-3 py-3.5 whitespace-nowrap text-ink-300">
                        {createdDay(event.createdAt)}
                      </td>

                      <td className="px-5 py-3.5">
                        <EventActions event={event} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </>
  );
}
