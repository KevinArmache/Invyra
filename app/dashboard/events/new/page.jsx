import { getSession } from "@/app/actions/auth";
import { getTemplates } from "@/app/actions/template";
import NewEventWizard from "@/components/dashboard/events/NewEventWizard";

export const metadata = { title: "Créer un événement" };

export default async function NewEventPage() {
  // Chargés d'emblée plutôt qu'à l'arrivée sur l'étape 2 : l'assistant n'a
  // alors pas à afficher un état de chargement au milieu du parcours.
  const [templates, session] = await Promise.all([
    getTemplates(),
    getSession(),
  ]);

  return (
    <NewEventWizard templates={templates} isAdmin={session?.role === "admin"} />
  );
}
