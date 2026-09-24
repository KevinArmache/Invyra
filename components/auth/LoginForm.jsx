"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/Context";
import FormError from "@/components/auth/FormError";

export default function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      await login(formData.get("email"), formData.get("password"));
      // Le filtre d'entrée range la destination d'origine dans `redirect` :
      // on y revient plutôt que de toujours retomber sur le tableau de bord.
      const target = searchParams.get("redirect");
      router.push(target?.startsWith("/") ? target : "/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught.message || t("login.error_generic"));
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormError message={error} />

      <div className="space-y-2">
        <Label htmlFor="email">{t("login.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("login.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={t("login.password_placeholder")}
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? t("login.submitting") : t("login.submit")}
      </Button>

      <p className="pt-2 text-center text-sm text-ink-400">
        {t("login.no_account")}{" "}
        <Link
          href="/register"
          className="text-gold transition-colors hover:text-gold-bright"
        >
          {t("login.create_one")}
        </Link>
      </p>
    </form>
  );
}
