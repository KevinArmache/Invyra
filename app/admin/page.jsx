import Link from "next/link";
import { Calendar, LayoutTemplate, Shield, Users } from "lucide-react";

import { getAdminStats } from "@/app/actions/admin";
import { getTranslations } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatCard, StatGrid } from "@/components/dashboard/ui";

export const metadata = { title: "Vue d'ensemble" };

export default async function AdminPage() {
  const [stats, { t }] = await Promise.all([getAdminStats(), getTranslations()]);

  return (
    <>
      <PageHeader
        title={t("portal.admin.overview")}
        subtitle={t("portal.admin.overview_subtitle")}
      />

      <StatGrid>
        <StatCard
          label={t("portal.admin.users")}
          value={stats.totalUsers}
          icon={Users}
        />
        <StatCard
          label={t("portal.admin.events")}
          value={stats.totalEvents}
          icon={Calendar}
        />
        <StatCard
          label={t("portal.admin.templates")}
          value={stats.totalTemplates}
          icon={LayoutTemplate}
        />
        <StatCard
          label={t("portal.admin.admins")}
          value={stats.admins}
          icon={Shield}
        />
      </StatGrid>

      <Panel className="mt-8" title={t("portal.admin.quick_actions")}>
        <div className="p-5">
          <Button asChild>
            <Link href="/admin/users">
              <Users className="mr-2 h-4 w-4" />
              {t("portal.admin.manage_users")}
            </Link>
          </Button>
        </div>
      </Panel>
    </>
  );
}
