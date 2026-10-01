"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  LogOut,
  Plus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BrandMark from "@/components/common/BrandMark";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/Context";
import { whatsappLink } from "@/lib/site";

function isActive(pathname, href, exact) {
  // Une racine de section (`/dashboard`, `/admin`) ne doit pas rester active
  // sur ses pages filles, alors que `/dashboard/events` doit l'être sur
  // `/dashboard/events/123`.
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Panneau latéral de l'espace connecté.
 *
 * Le repère de la page active est un filet or qui se déplie, l'icône prend
 * l'or ; au survol, l'icône avance d'un cran. En bas, la carte du compte
 * indique la formule (Découverte ou Premium) et, pour un compte gratuit, le
 * chemin vers le premium.
 *
 * @param {boolean} props.showQuickAction  bouton « Nouvel événement » en tête
 */
export default function Sidebar({
  user,
  navigation,
  homeHref = "/dashboard",
  footerLink,
  showQuickAction = true,
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
  const isPremium = user.plan === "premium";

  /** Lien avec infobulle quand le panneau est replié. */
  function withTooltip(element, label, key) {
    if (showLabels) return <li key={key}>{element}</li>;
    return (
      <li key={key}>
        <Tooltip>
          <TooltipTrigger asChild>{element}</TooltipTrigger>
          <TooltipContent side="right" className="ml-1">
            {label}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  function navLink(item) {
    const active = isActive(pathname, item.href, item.exact);
    const label = t(item.key);

    const link = (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center rounded-md transition-colors duration-300 ${
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
            className="animate-draw-y absolute inset-y-1.5 -left-3 w-0.5 rounded-full bg-gold shadow-[0_0_10px_var(--gold)]"
          />
        )}
        <item.icon
          size={19}
          strokeWidth={1.75}
          className={`shrink-0 transition-[color,translate] duration-300 group-hover:translate-x-0.5 ${
            active ? "text-gold" : ""
          }`}
        />
        {showLabels && <span className="truncate text-sm">{label}</span>}
      </Link>
    );

    return withTooltip(link, label, item.href);
  }

  const newEventLabel = t("portal.sidebar.new_event");
  const newEventButton = (
    <Button asChild className="group w-full">
      <Link href="/dashboard/events/new" aria-label={newEventLabel}>
        <Plus className="transition-transform duration-300 group-hover:rotate-90" />
        {showLabels && <span className="truncate">{newEventLabel}</span>}
      </Link>
    </Button>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-300 ease-out lg:translate-x-0 ${
        isOpen ? "w-64 translate-x-0" : "-translate-x-full"
      } ${isCollapsed ? "lg:w-[72px]" : "lg:w-64"}`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Lueur discrète en haut du panneau. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 0%, color-mix(in oklch, var(--gold) 8%, transparent), transparent 70%)",
        }}
      />

      {/* ── En-tête ─────────────────────────────────────────────────── */}
      <div className="relative flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-3">
        <BrandMark
          href={homeHref}
          size="sm"
          showName={showLabels}
          className={showLabels ? "px-1.5" : "mx-auto"}
        />

        <button
          type="button"
          onClick={onToggleCollapse}
          className="ml-auto hidden h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-ink-50 lg:flex"
          aria-label={
            isCollapsed
              ? t("portal.sidebar.expand")
              : t("portal.sidebar.collapse")
          }
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
          aria-label={t("portal.sidebar.close_sidebar")}
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Action principale ───────────────────────────────────────── */}
      {showQuickAction && (
        <div className="relative px-3 pt-5">
          {showLabels ? (
            newEventButton
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>{newEventButton}</TooltipTrigger>
              <TooltipContent side="right" className="ml-1">
                {newEventLabel}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav
        aria-label={t("portal.sidebar.main_nav")}
        className="no-scrollbar relative flex-1 overflow-y-auto px-3 py-5"
      >
        <ul className="space-y-1">{navigation.map(navLink)}</ul>

        {footerLink && (
          <>
            <hr className="my-5 border-sidebar-border" />
            <ul>{navLink(footerLink)}</ul>
          </>
        )}
      </nav>

      {/* ── Pied ────────────────────────────────────────────────────── */}
      <div className="relative shrink-0 space-y-3 border-t border-sidebar-border p-3">
        <div
          className={`flex items-center gap-3 ${showLabels ? "px-2" : "justify-center"}`}
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold">
            {initials}
            {isPremium && (
              <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full border border-sidebar bg-gold text-primary-foreground">
                <Crown className="h-2.5 w-2.5" strokeWidth={2.5} />
              </span>
            )}
          </span>
          {showLabels && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-100">
                {user.name || t("portal.sidebar.account")}
              </p>
              <p className="flex items-center gap-1.5 truncate text-xs text-ink-400">
                <span
                  className={`rounded-full border px-1.5 py-px text-[10px] leading-tight ${
                    isPremium
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-border text-ink-300"
                  }`}
                >
                  {isPremium
                    ? t("portal.sidebar.plan_premium")
                    : t("portal.sidebar.plan_free")}
                </span>
                <span className="truncate">{user.email}</span>
              </p>
            </div>
          )}
        </div>

        {showLabels && !isPremium && user.role !== "admin" && (
          <a
            href={whatsappLink(
              t("settings.plan_upgrade_message").replace("{email}", user.email),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-md border border-gold/20 bg-gold/5 px-3 py-2 text-xs text-gold transition-colors hover:border-gold/45 hover:bg-gold/10"
          >
            <Crown className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-12" />
            {t("portal.sidebar.upgrade")}
          </a>
        )}

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
