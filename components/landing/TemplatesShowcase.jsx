"use client";

import { useState } from "react";
import { ArrowRight, Eye } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import TemplateThumbnail from "@/components/invitation/TemplateThumbnail";
import { sampleEvent } from "@/lib/invitation/sample";
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
  // { template, event } du modèle ouvert.
  const [preview, setPreview] = useState(null);

  if (!templates || templates.length === 0) return null;

  return (
    <section
      id="templates"
      className="scroll-mt-16 border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <header className="reveal mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl leading-tight text-ink-50 sm:text-5xl">
            {t("landing.templates.title")}
            <em className="text-gold not-italic">
              {t("landing.templates.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-pretty text-lg leading-relaxed text-ink-300">
            {t("landing.templates.subtitle")}
          </p>
        </header>

        <ul className="reveal mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => setPreview({ template, event: sampleEvent() })}
                className="group surface-interactive block w-full overflow-hidden text-left"
              >
                <div className="relative aspect-3/4 overflow-hidden border-b border-border/60 bg-ink-900">
                  <div className="absolute inset-0 origin-top transition-transform duration-700 group-hover:scale-[1.02]">
                    <TemplateThumbnail
                      template={template.config}
                      event={sample}
                      guestName="Sophie"
                      title={template.name}
                    />
                  </div>
                  <span className="absolute inset-0 flex items-end justify-center bg-linear-to-t from-ink-900/80 via-transparent to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-ink-850 px-4 py-2 text-xs tracking-wider text-gold uppercase">
                      <Eye className="h-3.5 w-3.5" />
                      {t("landing.templates.preview")}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 p-5">
                  <h3 className="truncate text-lg text-ink-50">
                    {template.name}
                  </h3>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gold transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="h-[90vh] max-w-[95vw] overflow-hidden border-border bg-black p-0 md:max-w-[620px]">
          <DialogTitle className="sr-only">
            {preview?.template.name ?? t("landing.templates.preview")}
          </DialogTitle>
          {preview && (
            <div className="h-full w-full overflow-auto">
              <InvitationPreview
                template={preview.template.config}
                event={preview.event}
                guestName="Sophie"
                title={preview.template.name}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
