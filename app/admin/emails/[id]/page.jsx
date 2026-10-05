import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { getCampaign } from "@/app/actions/campaign";
import { getTranslations } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/shell/primitives";
import CampaignSender from "@/components/admin/emails/CampaignSender";

/**
 * Durée maximale des fonctions de cette page, server actions comprises :
 * un lot de sendCampaignBatch (une dizaine d'e-mails) tient largement dedans.
 */
export const maxDuration = 60;

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.campaigns.view") };
}

/** Une ligne du récapitulatif : libellé discret, valeur. */
function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="mt-1 text-ink-100">{children}</dd>
    </div>
  );
}

/**
 * Un envoi : son avancement (et la reprise s'il a été interrompu), son
 * contenu et ses échecs. `?start=1` arrive du formulaire, juste après le
 * lancement : l'envoi démarre seul.
 */
export default async function CampaignPage({ params, searchParams }) {
  const { id } = await params;
  const { start } = await searchParams;
  const [campaign, { t, locale }] = await Promise.all([getCampaign(id), getTranslations()]);
  if (!campaign) notFound();

  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const createdOn = new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(campaign.createdAt);
  const author = campaign.createdBy?.name || campaign.createdBy?.email || "?";

  return (
    <>
      <PageHeader
        eyebrow={t("portal.admin.emails")}
        title={campaign.subject}
        subtitle={t("portal.campaigns.created_by")
          .replace("{name}", author)
          .replace("{date}", createdOn)}
        action={
          <Button asChild variant="outline" className="group">
            <Link href="/admin/emails">
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              {t("portal.campaigns.back")}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <CampaignSender
            campaignId={campaign.id}
            total={campaign.total}
            initialStatus={campaign.status}
            initialCounts={campaign.counts}
            initialError={campaign.lastError}
            autoStart={start === "1"}
          />

          {campaign.failures.length > 0 && (
            <Panel
              delay={200}
              title={t("portal.campaigns.failures_title")}
              description={t("portal.campaigns.failures_desc")}
            >
              <ul className="divide-y divide-border/60">
                {campaign.failures.map((failure) => (
                  <li key={failure.id} className="px-5 py-3.5 text-sm">
                    <p className="truncate text-ink-100">{failure.email}</p>
                    {failure.error && (
                      <p className="mt-0.5 text-xs wrap-break-word text-negative/90">
                        {failure.error}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <Panel delay={180} title={t("portal.campaigns.content_recap")}>
          <dl className="space-y-4 p-5 text-sm">
            <Detail label={t("portal.campaigns.audience")}>
              {t(`portal.campaigns.audience_${campaign.audience}`)}
            </Detail>

            {campaign.template && (
              <Detail label={t("portal.campaigns.template_linked")}>
                <Link
                  href={`/templates/${campaign.template.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-gold transition-colors hover:text-gold-bright"
                >
                  {campaign.template.name}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Detail>
            )}

            {campaign.preheader && (
              <Detail label={t("portal.campaigns.preheader")}>{campaign.preheader}</Detail>
            )}

            <Detail label={t("portal.campaigns.heading")}>
              <span className="font-display text-base text-ink-50">{campaign.heading}</span>
            </Detail>

            <Detail label={t("portal.campaigns.message")}>
              <span className="block whitespace-pre-line text-ink-300">{campaign.message}</span>
            </Detail>

            {campaign.ctaLabel && campaign.ctaUrl && (
              <Detail label={t("portal.campaigns.button_recap")}>
                <a
                  href={campaign.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-gold transition-colors hover:text-gold-bright"
                >
                  {campaign.ctaLabel}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <span className="mt-0.5 block truncate text-xs text-ink-400">
                  {campaign.ctaUrl}
                </span>
              </Detail>
            )}
          </dl>
        </Panel>
      </div>
    </>
  );
}
