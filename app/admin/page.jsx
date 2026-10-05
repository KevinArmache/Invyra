import Link from "next/link";
import { Calendar, LayoutTemplate, Mail, Shield, Users } from "lucide-react";

import { getAdminStats } from "@/app/actions/admin";
import { getTranslations } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatCard, StatGrid } from "@/components/shell/primitives";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.admin.overview") };
}

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
          index={0}
          label={t("portal.admin.users")}
          value={stats.totalUsers}
          icon={Users}
        />
        <StatCard
          index={1}
          label={t("portal.admin.events")}
          value={stats.totalEvents}
          icon={Calendar}
        />
        <StatCard
          index={2}
          label={t("portal.admin.templates")}
          value={stats.totalTemplates}
          icon={LayoutTemplate}
        />
        <StatCard
          index={3}
          label={t("portal.admin.admins")}
          value={stats.admins}
          icon={Shield}
        />
      </StatGrid>

      <Panel className="mt-8" delay={300} title={t("portal.admin.quick_actions")}>
        <div className="flex flex-wrap gap-3 p-5">
          <Button asChild className="group">
            <Link href="/admin/users">
              <Users className="h-4 w-4" />
              {t("portal.admin.manage_users")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/events">
              <Calendar className="h-4 w-4" />
              {t("portal.admin.view_events")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/templates">
              <LayoutTemplate className="h-4 w-4" />
              {t("portal.admin.templates")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/emails/new">
              <Mail className="h-4 w-4" />
              {t("portal.admin.send_email")}
            </Link>
          </Button>
        </div>
      </Panel>
    </>
  );
}
