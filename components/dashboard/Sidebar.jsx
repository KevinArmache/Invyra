"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/utils/i18n/Context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function isActive(pathname, href, exact) {
  // Une racine de section (`/dashboard`, `/admin`) ne doit pas rester active
  // sur ses pages filles, alors que `/dashboard/events` doit l'être sur
  // `/dashboard/events/123`.
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  user,
  navigation,
  homeHref = "/dashboard",
  footerLink,
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Une navigation ferme le tiroir mobile, sinon il masque la page d'arrivée.
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Le repli ne vaut qu'en grand écran : en mobile le tiroir est toujours
  // déployé, sinon il n'offrirait que des icônes sans libellé.
  const showLabels = !isCollapsed || isOpen;

  const initials = (user.name || user.email || "?").charAt(0).toUpperCase();

  function navLink(item) {
    const active = isActive(pathname, item.href, item.exact);

    const link = (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center rounded-md transition-colors ${
          showLabels ? "gap-3 px-3 py-2.5" : "justify-center p-2.5"
        } ${
          active
            ? "bg-sidebar-accent text-ink-50"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-ink-50"
        }`}
      >
        {/* Le repère actif est un filet doré à gauche, pas un aplat : l'or
            reste un accent même quand cinq entrées sont visibles. */}
        {active && (
          <span
            aria-hidden="true"
            className="absolute inset-y-1.5 -left-3 w-0.5 rounded-full bg-gold"
          />
        )}
        <item.icon size={19} strokeWidth={1.75} className="shrink-0" />
        {showLabels && (
          <span className="truncate text-sm">{t(item.key)}</span>
        )}
      </Link>
    );

    if (showLabels) return <li key={item.href}>{link}</li>;

    return (
      <li key={item.href}>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="ml-1">
            {t(item.key)}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-300 ease-out lg:translate-x-0 ${
        isOpen ? "w-64 translate-x-0" : "-translate-x-full"
      } ${isCollapsed ? "lg:w-[72px]" : "lg:w-64"}`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* ── En-tête ─────────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-3">
        <Link
          href={homeHref}
          className={`font-display text-xl text-ink-50 ${
            showLabels ? "px-2" : "mx-auto"
          }`}
        >
          {showLabels ? "Invyra" : "I"}
        </Link>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="ml-auto hidden h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-ink-50 lg:flex"
          aria-label={isCollapsed ? "Déplier le menu" : "Replier le menu"}
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent lg:hidden"
          aria-label="Fermer le menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-1">{navigation.map(navLink)}</ul>

        {footerLink && (
          <>
            <hr className="my-5 border-sidebar-border" />
            <ul>{navLink(footerLink)}</ul>
          </>
        )}
      </nav>

      {/* ── Pied ────────────────────────────────────────────────────── */}
      <div className="shrink-0 space-y-3 border-t border-sidebar-border p-3">
        <div
          className={`flex items-center gap-3 ${showLabels ? "px-2" : "justify-center"}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold">
            {initials}
          </span>
          {showLabels && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-100">
                {user.name || t("portal.sidebar.account")}
              </p>
              <p className="truncate text-xs text-ink-400">{user.email}</p>
            </div>
          )}
        </div>

        <div
          className={`flex gap-1 ${showLabels ? "items-center" : "flex-col items-stretch"}`}
        >
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="sm"
            className={`text-ink-400 hover:text-ink-50 ${showLabels ? "flex-1 justify-start" : "justify-center px-0"}`}
            asChild
          >
            <button type="submit" form="logout-form">
              <LogOut size={17} className="shrink-0" />
              {showLabels && (
                <span className="ml-2 truncate">
                  {t("portal.sidebar.sign_out")}
                </span>
              )}
            </button>
          </Button>
        </div>
      </div>
    </aside>
  );
}
