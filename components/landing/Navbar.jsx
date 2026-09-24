"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/Context";

const SECTIONS = [
  { href: "#features", key: "nav.features" },
  { href: "#templates", key: "nav.templates", showcaseOnly: true },
  { href: "#how-it-works", key: "nav.how_it_works" },
  { href: "#availability", key: "nav.availability" },
  { href: "#pricing", key: "nav.pricing" },
];

/**
 * `isAuthenticated` vient du Server Component parent : la barre n'a pas à
 * demander la session au montage, donc pas de bouton fantôme qui clignote
 * pendant le chargement.
 */
export default function Navbar({
  isAuthenticated = false,
  hasShowcase = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();
  // Le lien « Modèles » n'apparaît que si la vitrine a du contenu.
  const sections = SECTIONS.filter(
    (section) => hasShowcase || !section.showcaseOnly,
  );

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Un menu plein écran ouvert ne doit pas laisser la page défiler dessous.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isScrolled || isOpen
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight text-ink-50"
          onClick={() => setIsOpen(false)}
        >
          Invyra
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="relative py-1 text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              {t(section.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link href="/dashboard">{t("nav.dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("nav.sign_in")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t("nav.get_started")}</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="space-y-1 px-4 py-4">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="block rounded-md px-2 py-3 text-base text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {t(section.key)}
              </Link>
            ))}

            <div className="space-y-2 pt-4">
              {isAuthenticated ? (
                <Button asChild className="w-full">
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    {t("nav.dashboard")}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      {t("nav.sign_in")}
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      {t("nav.get_started")}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
