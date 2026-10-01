import { notFound } from "next/navigation";

import { getEventById } from "@/app/actions/event";
import EditEventForm from "@/components/events/EditEventForm";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.events.edit.title") };
}

export default async function EditEventPage({ params }) {
  const { id } = await params;

  let event;
  try {
    event = await getEventById(id);
  } catch {
    notFound();
  }

  return <EditEventForm event={event} />;
}
