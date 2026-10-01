"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import BrandMark from "@/components/common/BrandMark";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import ShareTemplateButton from "@/components/templates/ShareTemplateButton";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Page publique d'un modèle, celle qu'ouvre un lien partagé : l'invitation
 * en plein écran, telle qu'un invité la recevrait (écran d'ouverture
 * compris), sous une barre fine qui rappelle le nom du modèle et propose de
 * le partager à son tour ou de l'utiliser.
 *
 * L'invitation reste rendue dans l'iframe isolée d'InvitationPreview : un
 * modèle contient du code, c'est cette isolation qui protège la page.
 *
 * @param {object} props.event      événement fictif (daté dans le futur)
 * @param {string} props.background couleur de fond du modèle
 * @param {string} [props.categoryLabel]
 */
export default function PublicTemplateView({
  template,
  event,
  background,
  categoryLabel,
}) {
  const { t } = useTranslation();
  const share = { id: template.id, name: template.name };

  return (
    <main className="flex h-[100dvh] flex-col" style={{ background }}>
      <h1 className="sr-only">
        {t("public_template.meta_title").replace("{name}", template.name)}
      </h1>

      <header
        className="animate-fade-in relative z-10 flex shrink-0 items-center gap-3 border-b border-white/10 bg-ink-900/85 px-3 pb-2.5 backdrop-blur-xl sm:gap-4 sm:px-5 sm:pt-3 sm:pb-3"
        style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top, 0px))" }}
      >
        <BrandMark href="/" size="sm" showName={false} className="shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] tracking-[0.18em] text-gold/80 uppercase">
            {t("public_template.eyebrow")}
            {categoryLabel && ` · ${categoryLabel}`}
          </p>
          <p className="truncate font-display text-base leading-snug text-ink-50 sm:text-lg">
            {template.name}
          </p>
        </div>

        <ShareTemplateButton template={share} className="sm:hidden" />
        <ShareTemplateButton
          template={share}
          variant="button"
          className="hidden sm:inline-flex"
        />

        <Button asChild size="sm" className="group shrink-0">
          <Link href="/register">
            <span className="sm:hidden">{t("public_template.use_short")}</span>
            <span className="hidden sm:inline">{t("public_template.use")}</span>
            <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <InvitationPreview
            template={template.config}
            event={event}
            guestName={t("landing.hero.scene.guest")}
            title={template.name}
          />
        </div>
      </div>
    </main>
  );
}
