import { ArrowLeft, LayoutDashboard, Users } from "lucide-react";

import { getCurrentUser, logout, requireAdmin } from "@/app/actions/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Administration", template: "%s · Admin" } };

const NAVIGATION = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    key: "portal.admin.overview",
    exact: true,
  },
  { href: "/admin/users", icon: Users, key: "portal.admin.users" },
];

const BACK_LINK = {
  href: "/dashboard",
  icon: ArrowLeft,
  key: "portal.sidebar.dashboard",
};

export default async function AdminLayout({ children }) {
  // Vérifie le rôle en base et redirige les non-admins : le filtre d'entrée
  // ne regarde que la présence d'un cookie.
  await requireAdmin();
  const user = await getCurrentUser();

  // Même coquille que l'espace principal, avec une autre navigation : les deux
  // panneaux étaient auparavant deux composants quasi identiques.
  return (
    <DashboardShell
      user={user}
      navigation={NAVIGATION}
      homeHref="/admin"
      footerLink={BACK_LINK}
      brand="Invyra Admin"
      logoutAction={logout}
    >
      {children}
    </DashboardShell>
  );
}
