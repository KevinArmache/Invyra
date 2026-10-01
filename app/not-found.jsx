import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import BrandMark from "@/components/common/BrandMark";
import LostLetter from "@/components/common/LostLetter";
import Particles from "@/components/landing/Particles";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: t("notfound.meta_title"),
    robots: { index: false, follow: false },
  };
}

/**
 * Page introuvable du site public (et de toute adresse inconnue). Les pages
 * de l'espace connecté ont la leur, dans la coquille (app/dashboard).
 */
export default async function NotFound() {
  const { t } = await getTranslations();

  return (
    <main
      id="main"
      className="grain relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
    >
      <div
        aria-hidden="true"
        className="animate-breathe pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 50% 40%, color-mix(in oklch, var(--gold) 13%, transparent), transparent 70%)",
        }}
      />
      <Particles count={14} />

      <div className="animate-fade-in absolute top-6 left-1/2 -translate-x-1/2">
        <BrandMark href="/" size="sm" />
      </div>

      <div className="relative">
        <LostLetter />

        <h1
          className="animate-rise mt-12 text-4xl text-balance text-ink-50 sm:text-5xl"
          style={{ "--rise-delay": "1400ms" }}
        >
          {t("notfound.title")}
        </h1>
        <hr
          className="rule-gold animate-draw-x mx-auto mt-6 w-24"
          style={{ "--rise-delay": "1550ms" }}
        />
        <p
          className="animate-rise mx-auto mt-6 max-w-md text-pretty text-ink-300"
          style={{ "--rise-delay": "1500ms" }}
        >
          {t("notfound.desc")}
        </p>

        <div
          className="animate-rise mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ "--rise-delay": "1650ms" }}
        >
          <Button asChild size="lg" className="group">
            <Link href="/">
              <ArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
              {t("notfound.home")}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">
              <LayoutDashboard />
              {t("notfound.dashboard")}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
