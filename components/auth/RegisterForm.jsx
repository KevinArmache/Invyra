"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { register } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/utils/i18n/Context";
import FormError from "@/components/auth/FormError";

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");

    // Vérifié aussi côté serveur : ce contrôle n'est là que pour éviter un
    // aller-retour réseau inutile.
    if (password !== formData.get("confirmPassword")) {
      setError(t("register.password_mismatch"));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("register.password_too_short"));
      return;
    }

    setIsPending(true);

    try {
      await register(
        formData.get("name"),
        formData.get("email"),
        password,
        formData.get("company"),
        formData.get("phone"),
      );
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught.message);
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormError message={error} />

      <div className="space-y-2">
        <Label htmlFor="name">{t("register.name")}</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder={t("register.name_placeholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("register.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          required
        />
      </div>

      {/* `items-end` aligne les champs entre eux : sans cela, un libellé qui
          passe sur deux lignes décale son input par rapport au voisin. */}
      <div className="grid items-end gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">
            {t("register.phone")}{" "}
            <span className="text-ink-400">({t("register.optional")})</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t("register.phone_placeholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">
            {t("register.company")}{" "}
            <span className="text-ink-400">({t("register.optional")})</span>
          </Label>
          <Input
            id="company"
            name="company"
            autoComplete="organization"
            placeholder={t("register.company_placeholder")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("register.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={t("register.password_placeholder")}
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("register.confirm_password")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder={t("register.password_placeholder")}
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? t("register.submitting") : t("register.submit")}
      </Button>

      <p className="pt-2 text-center text-sm text-ink-400">
        {t("register.has_account")}{" "}
        <Link
          href="/login"
          className="text-gold transition-colors hover:text-gold-bright"
        >
          {t("register.sign_in")}
        </Link>
      </p>
    </form>
  );
}
