"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import PaginationNav from "@/components/common/PaginationNav";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import PreviewDialog from "@/components/invitation/PreviewDialog";
import TemplateThumbnail from "@/components/invitation/TemplateThumbnail";
import ShareTemplateButton from "@/components/templates/ShareTemplateButton";
import { sampleEvent } from "@/lib/landing/sample-event";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Vitrine publique des modèles mis en avant par un admin (étoile dans la
 * page Modèles). Les vignettes sont statiques ; un clic ouvre l'aperçu
 * vivant, avec ses animations et la réponse RSVP simulée. Chaque modèle se
 * partage par un lien vers sa page publique (/templates/[id]).
 *
 * L'événement fictif est daté dans le futur (voir sampleEvent) : celui des
 * vignettes vient du serveur, pour que le rendu serveur et l'hydratation
 * coïncident ; l'aperçu, lui, recalcule sa date à chaque ouverture.
 *
 * Les modèles se feuillettent par pages (?page=N). Chaque lien ramène sur
 * la section (#templates), pas en haut de l'accueil.
 *
 * @param {object} props.sample     événement fictif des vignettes
 * @param {number} props.page       page affichée (à partir de 1)
 * @param {number} props.pageCount
 */
export default function TemplatesShowcase({
  templates,
  page = 1,
  pageCount = 1,
  sample,
}) {
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
              {/* La carte entière ouvre l'aperçu (bouton étendu en dessous) ;
                  le partage est un bouton à part, posé au-dessus : jamais un
                  bouton dans un bouton. */}
              <article className="group tilt spotlight surface-interactive relative overflow-hidden rounded-xl">
                <div className="relative aspect-3/4 overflow-hidden border-b border-border/60 bg-ink-900">
                  <div className="absolute inset-0 origin-top transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]">
                    <TemplateThumbnail
                      template={template.config}
                      event={sample}
                      guestName={guestName}
                      title={template.name}
                    />
                  </div>
                  <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-linear-to-t from-ink-900/85 via-ink-900/10 to-transparent p-6 opacity-0 transition-opacity duration-500 group-focus-within:opacity-100 group-hover:opacity-100">
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
                  <ShareTemplateButton
                    template={{ id: template.id, name: template.name }}
                    className="relative z-10 shrink-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPreview({ template, event: sampleEvent() })}
                  aria-label={`${t("landing.templates.preview")} : ${template.name}`}
                  className="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                />
              </article>
            </li>
          ))}
        </ul>

        {pageCount > 1 && (
          <div className="mt-6">
            <PaginationNav
              page={page}
              pageCount={pageCount}
              hrefFor={(target) =>
                target > 1 ? `/?page=${target}#templates` : "/#templates"
              }
            />
          </div>
        )}
      </div>

      <PreviewDialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
        title={preview?.template.name ?? t("landing.templates.preview")}
        subtitle={t("public_template.sample_note")}
        actions={
          preview && (
            <>
              <ShareTemplateButton
                template={{ id: preview.template.id, name: preview.template.name }}
              />
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8 text-ink-400 hover:text-gold"
              >
                <Link
                  href={`/templates/${preview.template.id}`}
                  target="_blank"
                  aria-label={t("public_template.open_page")}
                  title={t("public_template.open_page")}
                >
                  <ExternalLink size={15} />
                </Link>
              </Button>
            </>
          )
        }
      >
        {preview && (
          <InvitationPreview
            template={preview.template.config}
            event={preview.event}
            guestName={guestName}
            title={preview.template.name}
          />
        )}
      </PreviewDialog>
    </section>
  );
}
