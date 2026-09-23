import { Calendar, Eye, TrendingUp, Users } from "lucide-react";

import { getEvents } from "@/app/actions/event";
import { getTranslations } from "@/utils/i18n/server";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatGrid,
} from "@/components/dashboard/ui";
import RsvpBreakdown from "@/components/dashboard/analytics/RsvpBreakdown";
import EventPerformanceTable from "@/components/dashboard/analytics/EventPerformanceTable";

export const metadata = { title: "Statistiques" };

export default async function AnalyticsPage() {
  const [events, { t, locale }] = await Promise.all([
    getEvents(),
    getTranslations(),
  ]);

  const totals = events.reduce(
    (total, event) => ({
      guests: total.guests + (Number(event.guest_count) || 0),
      views: total.views + (Number(event.viewed_count) || 0),
      confirmed: total.confirmed + (Number(event.confirmed_count) || 0),
      declined: total.declined + (Number(event.declined_count) || 0),
    }),
    { guests: 0, views: 0, confirmed: 0, declined: 0 },
  );

  // Un invité qui n'a ni accepté ni décliné est en attente. La soustraction
  // est bornée à zéro : des compteurs incohérents ne doivent pas produire un
  // segment négatif dans la barre.
  const pending = Math.max(
    0,
    totals.guests - totals.confirmed - totals.declined,
  );

  const percent = (part) =>
    totals.guests > 0 ? Math.round((part / totals.guests) * 100) : 0;

  const responseRate = percent(totals.confirmed + totals.declined);
  const viewRate = percent(totals.views);

  return (
    <>
      <PageHeader
        title={t("portal.analytics.title")}
        subtitle={t("portal.analytics.subtitle")}
      />

      <StatGrid>
        <StatCard
          label={t("portal.analytics.total_events")}
          value={events.length}
          icon={Calendar}
        />
        <StatCard
          label={t("portal.analytics.total_guests")}
          value={totals.guests}
          icon={Users}
        />
        <StatCard
          label={t("portal.analytics.view_rate")}
          value={`${viewRate}%`}
          hint={`${totals.views} ${t("portal.analytics.views")}`}
          icon={Eye}
        />
        <StatCard
          label={t("portal.analytics.response_rate")}
          value={`${responseRate}%`}
          hint={`${totals.confirmed + totals.declined} / ${totals.guests}`}
          icon={TrendingUp}
        />
      </StatGrid>

      <Panel
        className="mt-8"
        title={t("portal.analytics.rsvp_breakdown_title")}
        description={t("portal.analytics.rsvp_breakdown_desc")}
      >
        <RsvpBreakdown
          counts={{
            confirmed: totals.confirmed,
            declined: totals.declined,
            pending,
          }}
          total={totals.guests}
          t={t}
        />
      </Panel>

      <Panel
        className="mt-8"
        title={t("portal.analytics.event_performance_title")}
        description={t("portal.analytics.event_performance_desc")}
      >
        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t("portal.analytics.no_events")}
          />
        ) : (
          <EventPerformanceTable events={events} locale={locale} t={t} />
        )}
      </Panel>
    </>
  );
}
