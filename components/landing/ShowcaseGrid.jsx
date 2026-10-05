"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import PreviewDialog from "@/components/invitation/PreviewDialog";
import TemplateThumbnail from "@/components/invitation/TemplateThumbnail";
import CardVotes from "@/components/templates/CardVotes";
import ShareTemplateButton from "@/components/templates/ShareTemplateButton";
import { sampleEvent } from "@/lib/landing/sample-event";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Grille publique des modèles, partagée par la vitrine de l'accueil et la
 * collection (/templates). Les vignettes sont statiques ; un clic ouvre
 * l'aperçu vivant, avec ses animations et la réponse RSVP simulée. Chaque
 * modèle se partage par un lien vers sa page publique (/templates/[id]).
 *
 * Votes : un modèle qui arrive avec ses `votes` (la collection, voir
 * withVoteCounts) porte les boutons « j'aime » / « je n'aime pas » sur sa
 * carte ; sinon (l'accueil), la carte ne montre que le nombre de « j'aime ».
 *
 * L'événement fictif est daté dans le futur (voir sampleEvent) : celui des
 * vignettes vient du serveur, pour que le rendu serveur et l'hydratation
 * coïncident ; l'aperçu, lui, recalcule sa date à chaque ouverture.
 *
 * @param {object} props.sample     événement fictif des vignettes
 * @param {string} [props.titleTag] balise du nom de chaque modèle
 * @param {boolean} [props.isAuthenticated] pour voter depuis les cartes
 */
/**
 * Nombre de « j'aime » d'une carte, seulement s'il y en a. Rien n'est
 * cliquable : le clic reste à la carte.
 */
function LikeCount({ count = 0 }) {
  const { t } = useTranslation();
  if (count === 0) return null;

  return (
    <p data-numeric className="inline-flex items-center gap-1 text-xs text-ink-400">
      <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">
        {t("template_feedback.likes_count").replace("{count}", String(count))}
      </span>
    </p>
  );
}

export default function ShowcaseGrid({
  templates,
  sample,
  titleTag = "h3",
  isAuthenticated = false,
}) {
  const { t } = useTranslation();
  const guestName = t("landing.hero.scene.guest");
  // { template, event } du modèle ouvert.
  const [preview, setPreview] = useState(null);
  const Title = titleTag;

  if (!templates || templates.length === 0) return null;

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, index) => (
          <li
            key={template.id}
            data-reveal
            style={{ "--i": index % 3 }}
          >
            {/* La carte entière ouvre l'aperçu (bouton étendu en dessous) ;
                le partage et les votes sont des boutons à part, posés
                au-dessus : jamais un bouton dans un bouton. */}
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
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Title className="truncate text-lg text-ink-50">
                      {template.name}
                    </Title>
                    {template.category && (
                      <p className="mt-0.5 truncate text-xs text-ink-400">
                        {t(`portal.templates.categories.${template.category}`)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!template.votes && <LikeCount count={template.likeCount} />}
                    <ShareTemplateButton
                      template={{ id: template.id, name: template.name }}
                      className="relative z-10 shrink-0"
                    />
                  </div>
                </div>
                {template.votes && (
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <p className="truncate text-xs text-ink-400">
                      {t("template_feedback.vote_question")}
                    </p>
                    <CardVotes
                      templateId={template.id}
                      initial={template.votes}
                      isAuthenticated={isAuthenticated}
                      className="relative z-10 shrink-0"
                    />
                  </div>
                )}
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
    </>
  );
}
