"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles, ThumbsUp } from "lucide-react";

import PaperFan from "@/components/stationery/PaperFan";
import CardVotes from "@/components/templates/CardVotes";
import ShareTemplateButton from "@/components/templates/ShareTemplateButton";
import { mainPiece } from "@/lib/print/config";
import { getFinish } from "@/lib/print/options";
import { samplePrintEvent } from "@/lib/print/sample";
import { useTranslation } from "@/lib/i18n/Context";

/** Nombre de « j'aime », seulement s'il y en a (vitrine de l'accueil). */
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

/**
 * Grille publique des invitations papier, partagée par la vitrine de
 * l'accueil et la collection (/stationery). Chaque carte montre deux faces
 * en éventail sur une table sombre ; un clic ouvre la page du modèle, avec
 * sa maquette 3D.
 *
 * Votes : comme ShowcaseGrid, les boutons « j'aime » / « je n'aime pas »
 * quand le modèle arrive avec ses `votes`, sinon le seul nombre de
 * « j'aime ».
 *
 * @param {string} [props.qr]  SVG d'un QR code d'exemple
 * @param {string} [props.titleTag]
 */
export default function StationeryGrid({ templates, qr = null, titleTag = "h3", isAuthenticated = false }) {
  const { t } = useTranslation();
  const Title = titleTag;
  if (!templates || templates.length === 0) return null;

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template, index) => {
        const { format } = mainPiece(template.config);
        const foil = (template.config?.finishes ?? []).some(
          (id) => getFinish(id)?.layer === "foil",
        );
        const href = `/stationery/${template.id}`;
        return (
          <li key={template.id} data-reveal style={{ "--i": index % 3 }}>
            <article className="group tilt spotlight surface-interactive relative overflow-hidden rounded-xl">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-border/60 bg-ink-900">
                {/* Une table sombre, éclairée par le haut. */}
                <div
                  aria-hidden="true"
                  className="grain absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(80% 70% at 50% 30%, color-mix(in oklch, var(--gold) 10%, var(--ink-850)), var(--ink-900) 75%)",
                  }}
                />
                <PaperFan
                  config={template.config}
                  event={samplePrintEvent(template.category)}
                  qr={qr}
                  paper={template.config?.paper}
                />
                {foil && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-gold/30 bg-ink-900/80 px-2.5 py-1 text-[11px] text-gold backdrop-blur">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    {t("stationery.badge_foil")}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Title className="truncate text-lg text-ink-50">{template.name}</Title>
                    <p className="mt-0.5 truncate text-xs text-ink-400">
                      {format && t(`stationery.formats.${format.id}`)}
                      {template.category && (
                        <>
                          <span aria-hidden="true"> · </span>
                          {t(`portal.templates.categories.${template.category}`)}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!template.votes && <LikeCount count={template.likeCount} />}
                    <ShareTemplateButton
                      template={{ id: template.id, name: template.name }}
                      path={href}
                      className="relative z-10 shrink-0"
                    />
                  </div>
                </div>
                {template.votes && (
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <p className="truncate text-xs text-ink-400">{t("template_feedback.vote_question")}</p>
                    <CardVotes
                      templateId={template.id}
                      initial={template.votes}
                      isAuthenticated={isAuthenticated}
                      className="relative z-10 shrink-0"
                    />
                  </div>
                )}
              </div>
              <Link
                href={href}
                aria-label={`${t("stationery.open_template")} : ${template.name}`}
                className="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                <span className="pointer-events-none absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-ink-900/80 text-gold opacity-0 backdrop-blur transition-opacity duration-500 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
