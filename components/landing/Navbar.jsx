"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import BrandMark from "@/components/common/BrandMark";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Sections de la page, dans l'ordre. `desktop: false` : seulement dans le
 * menu mobile (la barre n'a pas la place pour tout).
 */
const SECTIONS = [
  { id: "how-it-works", key: "nav.how_it_works" },
  { id: "features", key: "nav.features" },
  { id: "templates", key: "nav.templates", showcaseOnly: true },
  { id: "availability", key: "nav.availability", desktop: false },
  { id: "pricing", key: "nav.pricing" },
  { id: "faq", key: "nav.faq" },
];

/**
 * Barre de l'accueil.
 *
 * - progression de lecture : un filet or sous la barre, mis à jour à chaque
 *   image par une écriture directe dans le style (pas de rendu React par
 *   pixel défilé) ;
 * - section active : celle qui occupe le milieu de l'écran ;
 * - menu mobile : déplié par une transition de grille, liens en cascade.
 *
 * `isAuthenticated` vient du Server Component parent : pas de bouton fantôme
 * qui bascule après le chargement.
 */
export default function Navbar({
  isAuthenticated = false,
  hasShowcase = false,
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [active, setActive] = useState(null);
  const progressRef = useRef(null);

  const sections = SECTIONS.filter(
    (section) => hasShowcase || !section.showcaseOnly,
  );

  // ── Défilement : état « décollé » et progression ─────────────────────
  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
      setIsScrolled(window.scrollY > 16);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // ── Section active ───────────────────────────────────────────────────
  useEffect(() => {
    const order = SECTIONS.filter(
      (section) => hasShowcase || !section.showcaseOnly,
    ).map((section) => section.id);
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActive(order.find((id) => visible.has(id)) ?? null);
      },
      // Une bande au milieu de l'écran : la section qui la traverse est
      // celle qu'on lit.
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of order) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [hasShowcase]);

  // ── Menu mobile : page figée dessous, Échap pour fermer ──────────────
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    function onKey(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);
  const solid = isScrolled || isOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
        solid
          ? "border-border/60 bg-background/80 backdrop-blur-xl"
          : "border-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t("nav.skip")}
      </a>

      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 transition-[height] duration-500 sm:px-6 lg:px-8 ${
          isScrolled ? "h-14" : "h-[4.25rem]"
        }`}
      >
        <BrandMark href="/" size="sm" priority onClick={close} />

        <nav aria-label={t("nav.main")} className="hidden items-center gap-1 lg:flex">
          {sections
            .filter((section) => section.desktop !== false)
            .map((section) => {
              const isActive = active === section.id;
              return (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`group relative rounded-md px-3.5 py-2 text-sm transition-colors duration-300 ${
                    isActive ? "text-ink-50" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(section.key)}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3.5 bottom-1 h-px origin-left bg-gold transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
        </nav>

        <div className="hidden items-center gap-2 md:ml-auto md:flex lg:ml-0">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Button asChild size="sm" className="group">
              <Link href="/dashboard">
                {t("nav.dashboard")}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("nav.sign_in")}</Link>
              </Button>
              <Button asChild size="sm" className="group">
                <Link href="/register">
                  {t("nav.get_started")}
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center md:hidden">
          <LanguageSwitcher />
        </div>

        <button
          type="button"
          className="-mr-2 -ml-4 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground md:ml-0 lg:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? t("nav.close_menu") : t("nav.open_menu")}
        >
          <span className="relative block h-[22px] w-[22px]">
            <Menu
              size={22}
              className={`absolute inset-0 transition-all duration-300 ${
                isOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 opacity-100"
              }`}
            />
            <X
              size={22}
              className={`absolute inset-0 transition-all duration-300 ${
                isOpen ? "rotate-0 opacity-100" : "-rotate-90 scale-50 opacity-0"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Progression de lecture. */}
      <span
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[-1px] h-px origin-left bg-linear-to-r from-gold-deep via-gold to-gold-bright"
        style={{ transform: "scaleX(0)" }}
      />

      {/* ── Menu mobile ───────────────────────────────────────────── */}
      <div
        id="mobile-menu"
        inert={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <nav
            aria-label={t("nav.main")}
            className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-border/60 px-4 py-4"
          >
            <ul className="space-y-1">
              {sections.map((section, index) => (
                <li
                  key={section.id}
                  className={`transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                  }`}
                  style={{ transitionDelay: isOpen ? `${80 + index * 45}ms` : "0ms" }}
                >
                  <Link
                    href={`#${section.id}`}
                    onClick={close}
                    className={`flex items-center justify-between rounded-md px-3 py-3 text-base transition-colors hover:bg-secondary hover:text-foreground ${
                      active === section.id ? "text-ink-50" : "text-muted-foreground"
                    }`}
                  >
                    {t(section.key)}
                    {active === section.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <div
              className={`mt-4 grid gap-2 border-t border-border/60 pt-4 transition-[opacity,translate] duration-500 sm:grid-cols-2 md:hidden ${
                isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
              style={{ transitionDelay: isOpen ? "320ms" : "0ms" }}
            >
              {isAuthenticated ? (
                <Button asChild className="w-full sm:col-span-2">
                  <Link href="/dashboard" onClick={close}>
                    {t("nav.dashboard")}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login" onClick={close}>
                      {t("nav.sign_in")}
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register" onClick={close}>
                      {t("nav.get_started")}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
