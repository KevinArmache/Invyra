import { notFound } from "next/navigation";

import { getEventById } from "@/app/actions/event";
import { getGuests } from "@/app/actions/guest";
import { getCollaborators } from "@/app/actions/collaborator";
import EventDetailView from "@/components/dashboard/event-details/EventDetailView";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const event = await getEventById(id);
    return { title: event.title };
  } catch {
    return { title: "Événement" };
  }
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;

  // Les trois requêtes partent ensemble : en série, la page attendait
  // l'événement avant de demander les invités, puis les collaborateurs.
  let data;
  try {
    const [event, guests, collaborators] = await Promise.all([
      getEventById(id),
      getGuests(id),
      getCollaborators(id),
    ]);
    data = { event, guests, collaborators };
  } catch {
    // getEventById lève aussi bien pour un identifiant inconnu que pour un
    // accès refusé : dans les deux cas l'utilisateur n'a rien à voir ici.
    notFound();
  }

  return (
    <EventDetailView
      event={data.event}
      guests={data.guests}
      collaborators={data.collaborators}
    />
  );
}
