"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DeviceFrame from "@/components/invitation/DeviceFrame";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import TemplateThumbnail from "@/components/invitation/TemplateThumbnail";
import { sampleEvent } from "@/lib/landing/sample-event";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Vitrine publique des modèles mis en avant par un admin (étoile dans la
 * page Modèles). Les vignettes sont statiques ; un clic ouvre l'aperçu
 * vivant, avec ses animations et la réponse RSVP simulée.
 *
 * L'événement fictif est daté dans le futur (voir sampleEvent) : celui des
 * vignettes vient du serveur, pour que le rendu serveur et l'hydratation
 * coïncident ; l'aperçu, lui, recalcule sa date à chaque ouverture.
 *
 * @param {object} props.sample  événement fictif des vignettes
 */
export default function TemplatesShowcase({ templates, sample }) {
  const { t } = useTranslation();
  const guestName = t("landing.hero.scene.guest");
  // { template, event } du modèle ouvert.
  const [preview, setPreview] = useState(null);

  if (!templates || templates.length === 0) return null;

  return (
    <section
      id="templates"
      aria-labelledby="templates-title"
      className="relative scroll-mt-20 overflow-hidden border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <header data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold/80">{t("landing.templates.eyebrow")}</p>
          <h2
            id="templates-title"
            className="mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
          >
            {t("landing.templates.title")}
            <em className="text-gold not-italic">
              {t("landing.templates.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-lg leading-relaxed text-pretty text-ink-300">
            {t("landing.templates.subtitle")}
          </p>
        </header>

        <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <li
              key={template.id}
              data-reveal
              style={{ "--i": index % 3 }}
            >
              <button
                type="button"
                onClick={() => setPreview({ template, event: sampleEvent() })}
                className="group tilt spotlight surface-interactive block w-full overflow-hidden rounded-xl text-left"
              >
                <div className="relative aspect-3/4 overflow-hidden border-b border-border/60 bg-ink-900">
                  <div className="absolute inset-0 origin-top transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]">
                    <TemplateThumbnail
                      template={template.config}
                      event={sample}
                      guestName={guestName}
                      title={template.name}
                    />
                  </div>
                  <span className="absolute inset-0 flex items-end justify-center bg-linear-to-t from-ink-900/85 via-ink-900/10 to-transparent p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="inline-flex translate-y-3 items-center gap-2 rounded-full border border-gold/35 bg-ink-850/95 px-4 py-2 text-xs tracking-wider text-gold uppercase transition-transform duration-500 group-hover:translate-y-0">
                      <Eye className="h-3.5 w-3.5" />
                      {t("landing.templates.preview")}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg text-ink-50">
                      {template.name}
                    </h3>
                    {template.category && (
                      <p className="mt-0.5 truncate text-xs text-ink-400">
                        {t(`portal.templates.categories.${template.category}`)}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gold transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </button>
            </li>
          ))}
        </ul>

        <div data-reveal className="mt-14 text-center">
          <Button asChild size="lg" className="group h-12 px-7">
            <Link href="/register">
              {t("landing.templates.cta")}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="max-h-[94dvh] w-auto max-w-[95vw] overflow-y-auto border-0 bg-transparent p-2 shadow-none sm:max-w-none">
          <DialogTitle className="sr-only">
            {preview?.template.name ?? t("landing.templates.preview")}
          </DialogTitle>
          {preview && (
            <DeviceFrame glow={false} className="w-[min(88vw,21rem,calc((90dvh-1.5rem)*9/19))]">
              <InvitationPreview
                template={preview.template.config}
                event={preview.event}
                guestName={guestName}
                title={preview.template.name}
              />
            </DeviceFrame>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
