import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, Eye, Plus, Users } from "lucide-react";

import { getEvents } from "@/app/actions/event";
import { getTranslations } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  MoreLink,
  PageHeader,
  Panel,
  StatCard,
  StatGrid,
  StatusBadge,
} from "@/components/dashboard/ui";

export const metadata = { title: "Tableau de bord" };

function formatEventDate(date, locale, fallback) {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { day: "numeric", month: "long", year: "numeric" },
  );
}

export default async function DashboardPage() {
  // Chargé sur le serveur : la page arrive peuplée, sans le passage par un
  // squelette que provoquait le fetch dans un effet client.
  const [events, { t, locale }] = await Promise.all([
    getEvents(),
    getTranslations(),
  ]);

  const stats = events.reduce(
    (total, event) => ({
      guests: total.guests + (Number(event.guest_count) || 0),
      views: total.views + (Number(event.viewed_count) || 0),
      confirmed: total.confirmed + (Number(event.confirmed_count) || 0),
    }),
    { guests: 0, views: 0, confirmed: 0 },
  );

  const recentEvents = events.slice(0, 5);

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.welcome")}
        action={
          <Button asChild size="lg">
            <Link href="/dashboard/events/new">
              <Plus size={18} className="mr-2" />
              {t("dashboard.create_event")}
            </Link>
          </Button>
        }
      />

      <StatGrid>
        <StatCard
          label={t("dashboard.total_events")}
          value={events.length}
          icon={Calendar}
        />
        <StatCard
          label={t("dashboard.total_guests")}
          value={stats.guests}
          icon={Users}
        />
        <StatCard
          label={t("dashboard.invitations_viewed")}
          value={stats.views}
          icon={Eye}
        />
        <StatCard
          label={t("dashboard.confirmed_rsvps")}
          value={stats.confirmed}
          icon={CheckCircle2}
        />
      </StatGrid>

      <Panel
        className="mt-8"
        title={t("dashboard.recent_events")}
        action={
          events.length > 0 && (
            <MoreLink href="/dashboard/events">
              {t("dashboard.view_all")}
            </MoreLink>
          )
        }
      >
        {recentEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t("dashboard.no_events")}
            action={
              <Button asChild>
                <Link href="/dashboard/events/new">
                  <Plus size={18} className="mr-2" />
                  {t("dashboard.create_event")}
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {recentEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="group flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-ink-800/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gold/20 bg-gold/5">
                      <Calendar
                        className="h-5 w-5 text-gold/80"
                        strokeWidth={1.5}
                      />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-sans text-base text-ink-50">
                        {event.title}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-ink-400">
                        {formatEventDate(
                          event.eventDate,
                          locale,
                          t("portal.analytics.no_date"),
                        )}
                        {event.location && ` · ${event.location}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:shrink-0">
                    <div className="text-sm">
                      <span data-numeric className="text-ink-50">
                        {event.guest_count || 0}
                      </span>{" "}
                      <span className="text-ink-400">
                        {t("dashboard.guests")}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span data-numeric className="text-gold">
                        {event.confirmed_count || 0}
                      </span>{" "}
                      <span className="text-ink-400">
                        {t("portal.analytics.confirmed").toLowerCase()}
                      </span>
                    </div>
                    <StatusBadge status={event.status} />
                    <ArrowRight className="hidden h-4 w-4 text-ink-400 transition-transform group-hover:translate-x-0.5 sm:block" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
