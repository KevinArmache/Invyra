import { getCurrentUser, getSession } from "@/app/actions/auth";
import { getTemplates } from "@/app/actions/template";
import NewEventWizard from "@/components/events/NewEventWizard";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.events.new.title") };
}

export default async function NewEventPage() {
  // Chargés d'emblée plutôt qu'à l'arrivée sur l'étape 2 : l'assistant n'a
  // alors pas à afficher un état de chargement au milieu du parcours.
  const [templates, session, user] = await Promise.all([
    getTemplates(),
    getSession(),
    getCurrentUser(),
  ]);

  return (
    <NewEventWizard
      templates={templates}
      isAdmin={session?.role === "admin"}
      defaultContactPhone={user?.phone ?? ""}
    />
  );
}
