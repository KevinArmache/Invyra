import { notFound } from "next/navigation";

import { getEventById } from "@/app/actions/event";
import EditEventForm from "@/components/dashboard/events/EditEventForm";

export const metadata = { title: "Modifier l'événement" };

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
