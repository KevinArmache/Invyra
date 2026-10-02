import { notFound } from "next/navigation";

import { getEventById } from "@/app/actions/event";
import { getGuests } from "@/app/actions/guest";
import { getCollaborators } from "@/app/actions/collaborator";
import { getSession } from "@/app/actions/auth";
import { getCheckInLink } from "@/app/actions/checkin";
import { getEventMemories } from "@/app/actions/memories";
import { getEventOwnerAdmin } from "@/app/actions/admin";
import { countdownTarget } from "@/lib/invitation/document";
import { getTranslations } from "@/lib/i18n/server";
import EventDetailView from "@/components/events/detail/EventDetailView";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const event = await getEventById(id);
    return { title: event.title };
  } catch {
    const { t } = await getTranslations();
    return { title: t("portal.sidebar.events") };
  }
}

/** Heure de la requête : une donnée, comme la session (voir le tableau de bord). */
function requestTime() {
  return Date.now();
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;

  // Les requêtes partent ensemble : en série, la page attendait
  // l'événement avant de demander les invités, puis les collaborateurs.
  let data;
  try {
    const [event, guests, collaborators, session, checkIn, memories] =
      await Promise.all([
        getEventById(id),
        getGuests(id),
        getCollaborators(id),
        getSession(),
        getCheckInLink(id),
        getEventMemories(id),
      ]);
    data = { event, guests, collaborators, session, checkIn, memories };
  } catch {
    // getEventById lève aussi bien pour un identifiant inconnu que pour un
    // accès refusé : dans les deux cas l'utilisateur n'a rien à voir ici.
    notFound();
  }

  // Un admin qui consulte l'événement d'un autre compte voit à qui il
  // appartient. Hors du try : requireAdmin peut rediriger, ce qui ne doit
  // pas finir en 404.
  const owner =
    data.session?.role === "admin" && data.event.userId !== data.session.userId
      ? await getEventOwnerAdmin(id)
      : null;

  // Compte à rebours seulement pour un événement daté, pas encore passé.
  const now = requestTime();
  const target = countdownTarget(data.event);
  const countdown =
    target && new Date(target).getTime() > now ? { target, now } : null;

  return (
    <EventDetailView
      event={data.event}
      guests={data.guests}
      collaborators={data.collaborators}
      countdown={countdown}
      owner={owner}
      checkIn={data.checkIn}
      memories={data.memories}
    />
  );
}
