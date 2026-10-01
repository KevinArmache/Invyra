import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Eye,
  Plus,
  Users,
} from "lucide-react";

import { getEvents, getRecentActivity } from "@/app/actions/event";
import { getSession } from "@/app/actions/auth";
import { getTranslations } from "@/lib/i18n/server";
import { countdownTarget } from "@/lib/invitation/document";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  MoreLink,
  Panel,
  ProgressRing,
  StatCard,
  StatGrid,
  StatusBadge,
} from "@/components/shell/primitives";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import GettingStarted from "@/components/dashboard/GettingStarted";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("dashboard.title") };
}

function formatEventDate(date, locale, fallback) {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );
}

/**
 * Heure de la requête. Ce composant est rendu sur le serveur à chaque
 * visite (layout dynamique) : l'heure est une donnée de la requête, au même
 * titre que la session, pas un effet de bord du rendu.
 */
function requestTime() {
  return Date.now();
}

/** Le prochain événement daté, à partir d'aujourd'hui (minuit UTC). */
function nextUpcoming(events, now) {
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  return (
    events
      .filter((event) => event.eventDate && new Date(event.eventDate) >= today)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))[0] ?? null
  );
}

/**
 * Les quatre étapes du parcours, cochées d'après les données. Chaque lien
 * mène là où l'étape se fait, sur l'événement le plus récent.
 */
function checklist(events) {
  const latest = events[0];
  const eventHref = latest ? `/dashboard/events/${latest.id}` : "/dashboard/events/new";
  return [
    {
      key: "create",
      done: events.length > 0,
      href: "/dashboard/events/new",
    },
    {
      key: "template",
      done: events.some((event) => event.invitationTemplate),
      href: latest ? `${eventHref}/template` : eventHref,
    },
    {
      key: "guests",
      done: events.some((event) => event.guest_count > 0),
      href: eventHref,
    },
    {
      key: "send",
      done: events.some((event) => event.sent_count > 0),
      href: eventHref,
    },
  ];
}

export default async function DashboardPage() {
  // Chargé sur le serveur : la page arrive peuplée, sans le passage par un
  // squelette que provoquait le fetch dans un effet client.
  const [events, activity, session, { t, locale }] = await Promise.all([
    getEvents(),
    getRecentActivity(8),
    getSession(),
    getTranslations(),
  ]);
  const now = requestTime();

  const stats = events.reduce(
    (total, event) => ({
      guests: total.guests + (Number(event.guest_count) || 0),
      views: total.views + (Number(event.viewed_count) || 0),
      confirmed: total.confirmed + (Number(event.confirmed_count) || 0),
    }),
    { guests: 0, views: 0, confirmed: 0 },
  );

  const firstName = session?.name?.trim().split(/\s+/)[0];
  const greeting = firstName
    ? t("dashboard.greeting").replace("{name}", firstName)
    : t("dashboard.greeting_anonymous");

  const upcoming = nextUpcoming(events, now);
  const nextEvent = upcoming
    ? {
        id: upcoming.id,
        title: upcoming.title,
        location: upcoming.location,
        dateLabel: [
          formatEventDate(upcoming.eventDate, locale, ""),
          upcoming.time,
        ]
          .filter(Boolean)
          .join(" · "),
        target: countdownTarget(upcoming),
      }
    : null;

  const steps = checklist(events);
  const showChecklist = steps.some((step) => !step.done);
  const recentEvents = events.slice(0, 5);
  const statusLabel = (status) => t(`portal.events.edit.status_${status}`);

  return (
    <>
      <WelcomeBanner t={t} greeting={greeting} nextEvent={nextEvent} now={now} />

      {showChecklist && <GettingStarted t={t} steps={steps} delay={150} />}

      <div className="mt-6">
        <StatGrid>
          <StatCard
            index={0}
            label={t("dashboard.total_events")}
            value={events.length}
            icon={Calendar}
          />
          <StatCard
            index={1}
            label={t("dashboard.total_guests")}
            value={stats.guests}
            icon={Users}
          />
          <StatCard
            index={2}
            label={t("dashboard.invitations_viewed")}
            value={stats.views}
            icon={Eye}
            progress={stats.guests > 0 ? stats.views / stats.guests : 0}
          />
          <StatCard
            index={3}
            label={t("dashboard.confirmed_rsvps")}
            value={stats.confirmed}
            icon={CheckCircle2}
            progress={stats.guests > 0 ? stats.confirmed / stats.guests : 0}
          />
        </StatGrid>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Panel
          delay={250}
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
              description={t("dashboard.no_events_desc")}
              action={
                <Button asChild>
                  <Link href="/dashboard/events/new">
                    <Plus size={18} />
                    {t("dashboard.create_event")}
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {recentEvents.map((event, index) => (
                <li
                  key={event.id}
                  className="animate-rise"
                  style={{ "--rise-delay": `${350 + index * 70}ms` }}
                >
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="group flex flex-col gap-4 px-5 py-4 transition-colors duration-300 hover:bg-ink-800/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <ProgressRing
                        value={Number(event.confirmed_count) || 0}
                        total={Number(event.guest_count) || 0}
                        delay={450 + index * 90}
                        label={`${event.confirmed_count || 0} ${t(
                          "portal.analytics.confirmed",
                        ).toLowerCase()} / ${event.guest_count || 0} ${t(
                          "dashboard.guests",
                        )}`}
                      />
                      <div className="min-w-0">
                        <h3 className="truncate font-sans text-base text-ink-50 transition-colors group-hover:text-gold-bright">
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
                        <span className="text-ink-400">{t("dashboard.guests")}</span>
                      </div>
                      <StatusBadge
                        status={event.status}
                        label={statusLabel(event.status)}
                      />
                      <ArrowRight className="hidden h-4 w-4 text-ink-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-gold sm:block" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <ActivityFeed t={t} locale={locale} items={activity} now={now} delay={320} />
      </div>
    </>
  );
}
