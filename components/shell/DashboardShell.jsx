"use client";

import { useCallback, useState } from "react";
import { Menu } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/Context";
import BrandMark from "@/components/common/BrandMark";
import Sidebar from "@/components/shell/Sidebar";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import {
  ADMIN_LINK,
  ADMIN_NAVIGATION,
  DASHBOARD_LINK,
  NAVIGATION,
} from "@/components/shell/navigation";

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

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t("nav.skip")}
      </a>

      <div className="relative min-h-[100dvh] bg-background">
        {/* Voile du tiroir mobile, en fondu. */}
        <button
          type="button"
          tabIndex={isOpen ? 0 : -1}
          aria-hidden={!isOpen}
          aria-label={t("portal.sidebar.close_sidebar")}
          className={`fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={close}
        />

        <Sidebar
          user={user}
          navigation={navigation}
          homeHref={homeHref}
          footerLink={footerLink}
          showQuickAction={!isAdminSection}
          isOpen={isOpen}
          isCollapsed={isCollapsed}
          onClose={close}
          onToggleCollapse={toggleCollapse}
        />

        <div
          className={`relative flex min-h-[100dvh] flex-col transition-[padding] duration-300 ease-out ${
            isCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
          }`}
        >
          {/* Halo d'ambiance en haut du contenu : il éclaire l'en-tête de
              chaque page sans se lire comme une forme. */}
          <div
            aria-hidden="true"
            className="animate-breathe pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden"
          >
            <div
              className="absolute -top-40 left-1/2 h-80 w-[70%] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in oklch, var(--gold) 9%, transparent), transparent 70%)",
              }}
            />
          </div>

          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="-ml-2 rounded-md p-2 text-ink-400 transition-colors hover:text-foreground"
              aria-label={t("portal.sidebar.open_sidebar")}
              aria-expanded={isOpen}
            >
              <Menu size={22} />
            </button>
            <BrandMark href={homeHref} size="sm" priority />
          </header>

          <main
            id="main"
            className="relative flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10"
          >
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
