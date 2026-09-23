import { redirect } from "next/navigation";
import { KeyRound, UserRound } from "lucide-react";

import { getCurrentUser } from "@/app/actions/auth";
import { getTranslations } from "@/utils/i18n/server";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import ProfileForm from "@/components/dashboard/settings/ProfileForm";
import PasswordForm from "@/components/dashboard/settings/PasswordForm";
import DeleteAccountCard from "@/components/dashboard/settings/DeleteAccountCard";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getTranslations()]);
  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="space-y-8">
        <Panel
          title={
            <span className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-gold/70" strokeWidth={1.75} />
              {t("settings.profile_title")}
            </span>
          }
          description={t("settings.profile_desc")}
        >
          <ProfileForm user={user} />
        </Panel>

        <Panel
          title={
            <span className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gold/70" strokeWidth={1.75} />
              {t("settings.password_title")}
            </span>
          }
          description={t("settings.password_desc")}
        >
          <PasswordForm />
        </Panel>

        <DeleteAccountCard isAdmin={user.role === "admin"} />
      </div>
    </div>
  );
}
