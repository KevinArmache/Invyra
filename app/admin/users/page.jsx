import { getAllUsers } from "@/app/actions/admin";
import { getCurrentUser } from "@/app/actions/auth";
import { getTranslations } from "@/utils/i18n/server";
import { PageHeader } from "@/components/dashboard/ui";
import UsersTable from "@/components/admin/UsersTable";

export const metadata = { title: "Utilisateurs" };

export default async function AdminUsersPage() {
  const [users, currentUser, { t }] = await Promise.all([
    getAllUsers(),
    getCurrentUser(),
    getTranslations(),
  ]);

  return (
    <>
      <PageHeader
        title={t("portal.admin.users_management")}
        subtitle={t("portal.admin.users_count").replace(
          "{count}",
          String(users.length),
        )}
      />

      {/* `currentUserId` permet à la table de griser les actions qu'un admin
          ne peut pas exercer sur son propre compte, au lieu de laisser le
          serveur refuser après coup. */}
      <UsersTable users={users} currentUserId={currentUser.id} />
    </>
  );
}
