import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/server";
import { getTranslations } from "@/lib/i18n/server";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: t("register.meta_title"),
    description: t("register.meta_description"),
    alternates: { canonical: "/register" },
  };
}

export default async function RegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");

  const { t } = await getTranslations();

  return (
    <AuthShell
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      tagline={t("register.tagline")}
    >
      <RegisterForm />
    </AuthShell>
  );
}
