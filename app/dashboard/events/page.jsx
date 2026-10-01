import Link from "next/link";
import { Plus } from "lucide-react";

import { getEvents } from "@/app/actions/event";
import { getTranslations } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/primitives";
import EventsBrowser from "@/components/events/EventsBrowser";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.events.list.title") };
}

/** Jour de la requête (AAAA-MM-JJ, UTC), pour les comptes à rebours. */
function requestDay() {
  return new Date().toISOString().slice(0, 10);
}

export default async function EventsPage() {
  const [events, { t }] = await Promise.all([getEvents(), getTranslations()]);

  return (
    <>
      <PageHeader
        title={t("portal.events.list.title")}
        subtitle={t("portal.events.list.subtitle")}
        action={
          <Button asChild size="lg">
            <Link href="/dashboard/events/new" className="group">
              <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
              {t("portal.events.list.create_btn")}
            </Link>
          </Button>
        }
      />

      <EventsBrowser events={events} today={requestDay()} />
    </>
  );
}
