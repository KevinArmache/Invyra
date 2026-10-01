"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateProfile } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/Context";

export default function ProfileForm({ user }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      await updateProfile(
        formData.get("name"),
        formData.get("company"),
        formData.get("phone"),
      );
      toast.success(t("settings.profile_success"));
      // Le nom est repris dans le panneau latéral : on refait le rendu serveur
      // pour qu'il ne reste pas sur l'ancienne valeur.
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5">
      <div className="space-y-2">
        <Label htmlFor="settings-email">{t("settings.email")}</Label>
        <Input
          id="settings-email"
          type="email"
          value={user.email}
          disabled
          readOnly
        />
        <p className="text-xs text-ink-400">{t("settings.email_desc")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-name">{t("settings.name")}</Label>
        <Input
          id="settings-name"
          name="name"
          defaultValue={user.name ?? ""}
          placeholder={t("settings.name_placeholder")}
          autoComplete="name"
        />
      </div>

      <div className="grid items-end gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="settings-company">{t("settings.company")}</Label>
          <Input
            id="settings-company"
            name="company"
            defaultValue={user.company ?? ""}
            placeholder={t("settings.company_placeholder")}
            autoComplete="organization"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-phone">{t("settings.phone")}</Label>
          <Input
            id="settings-phone"
            name="phone"
            type="tel"
            defaultValue={user.phone ?? ""}
            placeholder={t("settings.phone_placeholder")}
            autoComplete="tel"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? t("settings.saving") : t("settings.save")}
      </Button>
    </form>
  );
}
