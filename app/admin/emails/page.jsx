import Link from "next/link";
import { LayoutTemplate, Mail, Plus } from "lucide-react";

import { getCampaigns } from "@/app/actions/campaign";
import { getTranslations } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel } from "@/components/shell/primitives";
import {
  CampaignProgress,
  CampaignStatusBadge,
} from "@/components/admin/emails/CampaignProgress";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.admin.emails") };
}

/**
 * Historique des e-mails d'annonce envoyés à tous les utilisateurs, et point
 * de départ d'un nouvel envoi.
 *
 * Sur grand écran, un tableau ; en dessous, des cartes empilées.
 */
export default async function AdminEmailsPage() {
  const [campaigns, { t, locale }] = await Promise.all([
    getCampaigns(),
    getTranslations(),
  ]);

  const dateFormat = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const newButton = (
    <Button asChild className="group">
      <Link href="/admin/emails/new">
        <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
        {t("portal.campaigns.new")}
      </Link>
    </Button>
  );

  const author = (campaign) =>
    campaign.createdBy?.name || campaign.createdBy?.email || "?";
  const progressLabel = (campaign) =>
    t("portal.campaigns.progress_label")
      .replace("{done}", String(campaign.sentCount))
      .replace("{total}", String(campaign.total));
  // Envoi à une personne : son nom (ou son adresse) plutôt que « Une personne ».
  const person = (campaign) =>
    campaign.audience === "user"
      ? campaign.recipients[0]?.name || campaign.recipients[0]?.email || null
      : null;
  const audienceLabel = (campaign) =>
    person(campaign) ?? t(`portal.campaigns.audience_${campaign.audience}`);

  return (
    <>
      <PageHeader
        title={t("portal.campaigns.title")}
        subtitle={t("portal.campaigns.subtitle")}
        action={newButton}
      />

      <Panel
        delay={120}
        title={t("portal.campaigns.history")}
        description={campaigns.length > 0 ? t("portal.campaigns.history_desc") : undefined}
      >
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Mail}
            title={t("portal.campaigns.empty_title")}
            description={t("portal.campaigns.empty_desc")}
            action={newButton}
          />
        ) : (
          <>
            {/* Mobile et tablette : cartes empilées. */}
            <ul className="divide-y divide-border/60 lg:hidden">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/emails/${campaign.id}`}
                        className="text-ink-50 transition-colors wrap-break-word hover:text-gold"
                      >
                        {campaign.subject}
                      </Link>
                      <p className="mt-1 text-xs text-ink-400">
                        {dateFormat.format(campaign.createdAt)} · {author(campaign)}
                      </p>
                    </div>
                    <CampaignStatusBadge status={campaign.status} t={t} />
                  </div>

                  <p className="mt-3 truncate text-xs text-ink-400">
                    {person(campaign) && `${t("portal.campaigns.audience_user")} : `}
                    {audienceLabel(campaign)}
                    {campaign.template && (
                      <>
                        {" · "}
                        <span className="text-ink-300">{campaign.template.name}</span>
                      </>
                    )}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <CampaignProgress
                      sent={campaign.sentCount}
                      failed={campaign.failedCount}
                      total={campaign.total}
                      label={progressLabel(campaign)}
                    />
                    <span data-numeric className="shrink-0 text-xs text-ink-300">
                      {campaign.sentCount}/{campaign.total}
                    </span>
                  </div>
                  {campaign.failedCount > 0 && (
                    <p className="mt-1 text-xs text-negative">
                      {t("portal.campaigns.failed_count").replace(
                        "{count}",
                        String(campaign.failedCount),
                      )}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            {/* Grand écran : tableau. */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[52rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left">
                    <th scope="col" className="px-5 py-3 font-normal text-ink-400">
                      {t("portal.campaigns.subject")}
                    </th>
                    <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                      {t("portal.campaigns.audience")}
                    </th>
                    <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                      {t("portal.campaigns.status")}
                    </th>
                    <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                      {t("portal.campaigns.progress")}
                    </th>
                    <th scope="col" className="px-3 py-3 font-normal text-ink-400">
                      {t("portal.campaigns.date")}
                    </th>
                    <th scope="col" className="px-5 py-3 font-normal text-ink-400">
                      {t("portal.campaigns.author")}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/60">
                  {campaigns.map((campaign, index) => (
                    <tr
                      key={campaign.id}
                      className="animate-rise transition-colors duration-300 hover:bg-ink-800/40"
                      style={{ "--rise-delay": `${200 + Math.min(index, 12) * 40}ms` }}
                    >
                      <th scope="row" className="max-w-xs px-5 py-3.5 text-left font-normal">
                        <Link
                          href={`/admin/emails/${campaign.id}`}
                          className="block truncate text-ink-100 transition-colors hover:text-gold"
                        >
                          {campaign.subject}
                        </Link>
                        {campaign.template && (
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-400">
                            <LayoutTemplate className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {campaign.template.name}
                          </p>
                        )}
                      </th>

                      <td className="max-w-[14rem] px-3 py-3.5 text-ink-300">
                        <p className="truncate whitespace-nowrap">{audienceLabel(campaign)}</p>
                        {person(campaign) && (
                          <p className="text-xs text-ink-400">
                            {t("portal.campaigns.audience_user")}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-3.5">
                        <CampaignStatusBadge status={campaign.status} t={t} />
                      </td>

                      <td className="w-48 px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <CampaignProgress
                            sent={campaign.sentCount}
                            failed={campaign.failedCount}
                            total={campaign.total}
                            label={progressLabel(campaign)}
                          />
                          <span data-numeric className="shrink-0 text-xs text-ink-300">
                            {campaign.sentCount}/{campaign.total}
                          </span>
                        </div>
                        {campaign.failedCount > 0 && (
                          <p className="mt-1 text-xs text-negative">
                            {t("portal.campaigns.failed_count").replace(
                              "{count}",
                              String(campaign.failedCount),
                            )}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-3.5 whitespace-nowrap text-ink-300">
                        {dateFormat.format(campaign.createdAt)}
                      </td>

                      <td className="max-w-[12rem] truncate px-5 py-3.5 text-ink-300">
                        {author(campaign)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </>
  );
}
