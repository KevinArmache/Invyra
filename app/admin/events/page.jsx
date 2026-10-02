import { getAllEventsAdmin } from "@/app/actions/admin";
import { getSession } from "@/app/actions/auth";
import { getTranslations } from "@/lib/i18n/server";
import { PageHeader } from "@/components/shell/primitives";
import AdminEventsTable from "@/components/admin/AdminEventsTable";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.admin.events") };
}

/**
 * Tous les événements de la plateforme, avec leur propriétaire. Le layout
 * admin vérifie déjà le rôle en base et exclut la page des moteurs de
 * recherche.
 */
export default async function AdminEventsPage() {
  const [events, session, { t }] = await Promise.all([
    getAllEventsAdmin(),
    getSession(),
    getTranslations(),
  ]);

  return (
    <>
      <PageHeader
        title={t("portal.admin.events_management")}
        subtitle={t("portal.admin.events_count").replace(
          "{count}",
          String(events.length),
        )}
      />

      <AdminEventsTable events={events} currentUserId={session?.userId} />
    </>
  );
}
