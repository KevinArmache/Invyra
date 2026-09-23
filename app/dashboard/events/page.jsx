import Link from "next/link";
import { Plus } from "lucide-react";

import { getEvents } from "@/app/actions/event";
import { getTranslations } from "@/utils/i18n/server";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/ui";
import EventsBrowser from "@/components/dashboard/events/EventsBrowser";

export const metadata = { title: "Événements" };

export default async function EventsPage() {
  const [events, { t }] = await Promise.all([getEvents(), getTranslations()]);

  return (
    <>
      <PageHeader
        title={t("portal.events.list.title")}
        subtitle={t("portal.events.list.subtitle")}
        action={
          <Button asChild size="lg">
            <Link href="/dashboard/events/new">
              <Plus size={18} className="mr-2" />
              {t("portal.events.list.create_btn")}
            </Link>
          </Button>
        }
      />

      <EventsBrowser events={events} />
    </>
  );
}
