import { Calendar, Eye, TrendingUp, Users } from "lucide-react";

import { getEvents } from "@/app/actions/event";
import { getTranslations } from "@/lib/i18n/server";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatGrid,
} from "@/components/shell/primitives";
import RsvpBreakdown from "@/components/analytics/RsvpBreakdown";
import EventPerformanceTable from "@/components/analytics/EventPerformanceTable";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.analytics.title") };
}

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
      maybe: total.maybe + (Number(event.maybe_count) || 0),
    }),
    { guests: 0, views: 0, confirmed: 0, declined: 0, maybe: 0 },
  );

  // « Peut-être » est une réponse : elle compte dans le taux de réponse, et
  // seuls les invités qui n'ont rien répondu sont « sans réponse », comme sur
  // la fiche d'un événement. La soustraction est bornée à zéro : des
  // compteurs incohérents ne doivent pas produire un segment négatif.
  const responded = totals.confirmed + totals.declined + totals.maybe;
  const pending = Math.max(0, totals.guests - responded);

  const percent = (part) =>
    totals.guests > 0 ? Math.round((part / totals.guests) * 100) : 0;

  const responseRate = percent(responded);
  const viewRate = percent(totals.views);

  return (
    <>
      <PageHeader
        title={t("portal.analytics.title")}
        subtitle={t("portal.analytics.subtitle")}
      />

      <StatGrid>
        <StatCard
          index={0}
          label={t("portal.analytics.total_events")}
          value={events.length}
          icon={Calendar}
        />
        <StatCard
          index={1}
          label={t("portal.analytics.total_guests")}
          value={totals.guests}
          icon={Users}
        />
        <StatCard
          index={2}
          label={t("portal.analytics.view_rate")}
          value={viewRate}
          suffix="%"
          progress={viewRate / 100}
          hint={`${totals.views} ${t("portal.analytics.views")}`}
          icon={Eye}
        />
        <StatCard
          index={3}
          label={t("portal.analytics.response_rate")}
          value={responseRate}
          suffix="%"
          progress={responseRate / 100}
          hint={`${responded} / ${totals.guests}`}
          icon={TrendingUp}
        />
      </StatGrid>

      <Panel
        className="mt-8"
        delay={300}
        title={t("portal.analytics.rsvp_breakdown_title")}
        description={t("portal.analytics.rsvp_breakdown_desc")}
      >
        <RsvpBreakdown
          counts={{
            confirmed: totals.confirmed,
            declined: totals.declined,
            maybe: totals.maybe,
            pending,
          }}
          total={totals.guests}
          t={t}
          delay={300}
        />
      </Panel>

      <Panel
        className="mt-8"
        reveal
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
