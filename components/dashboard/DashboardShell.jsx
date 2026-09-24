"use client";

import { useCallback, useState } from "react";
import { Menu } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/Context";
import Sidebar from "@/components/dashboard/Sidebar";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import {
  ADMIN_LINK,
  ADMIN_NAVIGATION,
  DASHBOARD_LINK,
  NAVIGATION,
} from "@/components/dashboard/navigation";

/**
 * Chrome de l'espace connecté. Seuls l'ouverture du tiroir et le repli du
 * panneau vivent ici ; les pages qu'il enveloppe restent des Server Components
 * et vont chercher leurs données elles-mêmes.
 *
 * Le repli est porté à ce niveau et non dans Sidebar, parce que la marge du
 * contenu principal doit le suivre. Sa persistance vit dans
 * useSidebarCollapsed.
 *
 * @param {"dashboard" | "admin"} [props.section]  menu affiché (voir
 *   navigation.js) : l'espace principal, ou l'administration avec un lien de
 *   retour vers l'espace principal.
 */
export default function DashboardShell({
  user,
  homeHref,
  section = "dashboard",
  brand = "Invyra",
  logoutAction,
  children,
}) {
  const isAdminSection = section === "admin";
  const navigation = isAdminSection ? ADMIN_NAVIGATION : NAVIGATION;
  const footerLink = isAdminSection
    ? DASHBOARD_LINK
    : user?.role === "admin"
      ? ADMIN_LINK
      : null;
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, toggleCollapse] = useSidebarCollapsed();
  const { t } = useTranslation();

  // Référence stable : Sidebar l'utilise dans un effet déclenché par la
  // navigation, qui rejouerait à chaque rendu si la fonction changeait.
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <TooltipProvider delayDuration={0}>
      {/* Déconnexion par server action : le bouton du panneau soumet ce
          formulaire, ce qui évite d'embarquer un gestionnaire client. */}
      <form id="logout-form" action={logoutAction} className="hidden" />

      <div className="min-h-[100dvh] bg-background">
        {isOpen && (
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
            onClick={close}
          />
        )}

        <Sidebar
          user={user}
          navigation={navigation}
          homeHref={homeHref}
          footerLink={footerLink}
          isOpen={isOpen}
          isCollapsed={isCollapsed}
          onClose={close}
          onToggleCollapse={toggleCollapse}
        />

        <div
          className={`flex min-h-[100dvh] flex-col transition-[padding] duration-300 ease-out ${
            isCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
          }`}
        >
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="-ml-2 rounded-md p-2 text-ink-400 transition-colors hover:text-foreground"
              aria-label={t("portal.sidebar.open_sidebar")}
            >
              <Menu size={22} />
            </button>
            <span className="font-display text-lg text-ink-50">{brand}</span>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
