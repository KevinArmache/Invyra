import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  getAnnounceableTemplates,
  getAudienceCounts,
  getRecipient,
} from "@/app/actions/campaign";
import { getTranslations } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/primitives";
import CampaignComposer from "@/components/admin/emails/CampaignComposer";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.campaigns.new_title") };
}

/**
 * Rédaction d'un e-mail aux utilisateurs, à tous ou à une personne.
 * `?template=<id>` arrive de la galerie (« Annoncer par e-mail ») : le
 * modèle est déjà choisi. `?user=<id>` arrive de la liste des utilisateurs :
 * le destinataire est déjà choisi.
 */
export default async function NewEmailPage({ searchParams }) {
  const { template, user } = await searchParams;
  const [templates, audienceCounts, recipient, { t }] = await Promise.all([
    getAnnounceableTemplates(),
    getAudienceCounts(),
    typeof user === "string" ? getRecipient(user) : null,
    getTranslations(),
  ]);

  return (
    <>
      <PageHeader
        title={t("portal.campaigns.new_title")}
        subtitle={t("portal.campaigns.new_subtitle")}
        action={
          <Button asChild variant="outline" className="group">
            <Link href="/admin/emails">
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              {t("portal.campaigns.back")}
            </Link>
          </Button>
        }
      />

      <CampaignComposer
        templates={templates}
        audienceCounts={audienceCounts}
        initialTemplateId={typeof template === "string" ? template : ""}
        initialRecipient={recipient}
      />
    </>
  );
}
