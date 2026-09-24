import { getCurrentUser, logout, requireAdmin } from "@/app/actions/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Administration", template: "%s · Admin" } };

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
      brand="Invyra Admin"
      logoutAction={logout}
    >
      {children}
    </DashboardShell>
  );
}
