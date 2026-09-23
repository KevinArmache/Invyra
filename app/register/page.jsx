import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/utils/auth/server";
import { getTranslations } from "@/utils/i18n/server";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = { title: "Créer un compte" };

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
