"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { changePassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/utils/i18n/Context";
import FormError from "@/components/auth/FormError";

const MIN_LENGTH = 8;

export default function PasswordForm() {
  const { t } = useTranslation();
  const formRef = useRef(null);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const next = formData.get("newPassword");

    if (next !== formData.get("confirmPassword")) {
      setError(t("settings.password_mismatch"));
      return;
    }
    if (next.length < MIN_LENGTH) {
      setError(t("settings.password_length"));
      return;
    }

    setIsPending(true);

    try {
      await changePassword(formData.get("currentPassword"), next);
      toast.success(t("settings.password_success"));
      // Les champs ne doivent pas garder les mots de passe après succès.
      formRef.current?.reset();
    } catch (caught) {
      setError(caught.message || t("common.error"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 p-5">
      <FormError message={error} />

      <div className="space-y-2">
        <Label htmlFor="current-password">
          {t("settings.current_password")}
        </Label>
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          placeholder={t("settings.current_password_placeholder")}
          required
        />
      </div>

      <div className="grid items-end gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-password">{t("settings.new_password")}</Label>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={MIN_LENGTH}
            placeholder={t("settings.new_password_placeholder")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">
            {t("settings.confirm_password")}
          </Label>
          <Input
            id="confirm-new-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t("settings.confirm_password_placeholder")}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? t("settings.changing") : t("settings.change_password")}
      </Button>
    </form>
  );
}
