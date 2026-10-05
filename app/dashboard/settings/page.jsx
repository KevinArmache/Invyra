import { redirect } from "next/navigation";
import { Check, Crown, KeyRound, Mail, MessageCircle, UserRound } from "lucide-react";

import { getCurrentUser } from "@/app/actions/auth";
import { getTranslations } from "@/lib/i18n/server";
import { whatsappLink } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/shell/primitives";
import ProfileForm from "@/components/settings/ProfileForm";
import PasswordForm from "@/components/settings/PasswordForm";
import DeleteAccountCard from "@/components/settings/DeleteAccountCard";
import EmailPreferencesForm from "@/components/settings/EmailPreferencesForm";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("settings.title") };
}

/** Titre de panneau avec son icône. */
function PanelTitle({ icon: Icon, children }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gold/70" strokeWidth={1.75} />
      {children}
    </span>
  );
}

export default async function SettingsPage() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getTranslations()]);
  if (!user) redirect("/login");

  const isPremium = user.plan === "premium";
  // Les admins ne sont soumis à aucune limite (voir canCreateEvent et
  // addGuest) : leur proposer le premium n'aurait pas de sens.
  const isAdmin = user.role === "admin";

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="space-y-8">
        {/* La formule réelle du compte, avec ses limites telles que
            l'application les applique. */}
        <Panel
          delay={80}
          title={<PanelTitle icon={Crown}>{t("settings.plan_title")}</PanelTitle>}
          description={t("settings.plan_desc")}
        >
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${
                  isPremium
                    ? "border-gold/50 bg-gold/15 text-gold"
                    : "border-border bg-ink-800 text-ink-300"
                }`}
              >
                {isPremium && <span className="pulse-ring absolute inset-0 rounded-full" />}
                <Crown className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <div>
                <p className="font-display text-xl text-ink-50">
                  {t(isPremium ? "settings.plan_premium_name" : "settings.plan_free_name")}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-300">
                  <Check className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />
                  {t(
                    isAdmin
                      ? "settings.plan_admin_limits"
                      : isPremium
                        ? "settings.plan_premium_limits"
                        : "settings.plan_free_limits",
                  )}
                </p>
              </div>
            </div>

            {isAdmin ? null : isPremium ? (
              <p className="text-sm text-ink-400">{t("settings.plan_premium_hint")}</p>
            ) : (
              <div className="sm:text-right">
                <Button asChild className="group">
                  <a
                    href={whatsappLink(
                      t("settings.plan_upgrade_message").replace("{email}", user.email),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="transition-transform duration-300 group-hover:-rotate-12" />
                    {t("settings.plan_upgrade")}
                  </a>
                </Button>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-400 sm:ml-auto">
                  {t("settings.plan_upgrade_hint")}
                </p>
              </div>
            )}
          </div>
        </Panel>

        <Panel
          delay={160}
          title={<PanelTitle icon={UserRound}>{t("settings.profile_title")}</PanelTitle>}
          description={t("settings.profile_desc")}
        >
          <ProfileForm user={user} />
        </Panel>

        <Panel
          delay={240}
          title={<PanelTitle icon={KeyRound}>{t("settings.password_title")}</PanelTitle>}
          description={t("settings.password_desc")}
        >
          <PasswordForm />
        </Panel>

        <Panel
          delay={320}
          title={<PanelTitle icon={Mail}>{t("settings.emails_title")}</PanelTitle>}
          description={t("settings.emails_desc")}
        >
          <EmailPreferencesForm marketingEmails={user.marketingEmails} />
        </Panel>

        <div className="animate-rise" style={{ "--rise-delay": "400ms" }}>
          <DeleteAccountCard isAdmin={user.role === "admin"} />
        </div>
      </div>
    </div>
  );
}
