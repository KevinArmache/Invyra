import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/utils/auth/server";
import { getTranslations } from "@/utils/i18n/server";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Connexion" };

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");

  const { t } = await getTranslations();

  return (
    <AuthShell
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      tagline={t("login.tagline")}
    >
      {/* useSearchParams impose une frontière Suspense en rendu statique. */}
      <Suspense fallback={<div className="skeleton h-72 w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
