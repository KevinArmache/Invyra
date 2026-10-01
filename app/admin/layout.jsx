import { getCurrentUser, logout, requireAdmin } from "@/app/actions/auth";
import DashboardShell from "@/components/shell/DashboardShell";
import { getTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: { default: t("portal.sidebar.admin"), template: "%s · Admin" },
    robots: { index: false, follow: false },
  };
}

export default async function AdminLayout({ children }) {
  // Vérifie le rôle en base et redirige les non-admins : le filtre d'entrée
  // ne regarde que la présence d'un cookie.
  await requireAdmin();
  const user = await getCurrentUser();

  // Même coquille que l'espace principal, avec le menu d'administration. Le
  // menu est désigné par son nom : ses icônes sont des fonctions, qu'un
  // composant serveur ne peut pas transmettre à DashboardShell (client).
  return (
    <DashboardShell
      user={user}
      section="admin"
      homeHref="/admin"
      logoutAction={logout}
    >
      {children}
    </DashboardShell>
  );
}
