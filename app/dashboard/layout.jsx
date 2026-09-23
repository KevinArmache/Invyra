import { redirect } from "next/navigation";

import { getCurrentUser, logout } from "@/app/actions/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

// Chaque écran dépend de la session et de la langue, toutes deux dans des
// cookies. Le dire explicitement évite à la compilation de tenter un
// pré-rendu statique qui échoue de toute façon, et rend le journal lisible.
export const dynamic = "force-dynamic";


export default async function DashboardLayout({ children }) {
  // Le filtre d'entrée n'a vu qu'un cookie ; c'est ici que la session est
  // réellement vérifiée en base, et que l'utilisateur est chargé une seule
  // fois pour toute la section.
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.suspended) redirect("/login");

  return (
    <DashboardShell
      user={user}
      homeHref="/dashboard"
      logoutAction={logout}
    >
      {children}
    </DashboardShell>
  );
}
