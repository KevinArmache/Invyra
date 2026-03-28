"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import {
  updateProfile,
  changePassword,
  deleteMyAccount,
} from "@/app/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Building, Key, Phone } from "lucide-react";
import { useTranslation } from "@/utils/i18n/Context";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, mutate } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({
    name: user?.name || "",
    company: user?.company || "",
    phone: user?.phone || "",
  });

  // Synchroniser le formulaire quand les données de l'utilisateur sont chargées
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        company: user.company || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await updateProfile(
        profile.name,
        profile.company,
        profile.phone,
      );
      mutate(updatedUser);
      setSuccess(t("settings.profile_success"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      setError(t("settings.password_mismatch"));
      return;
    }

    if (passwords.new.length < 8) {
      setError(t("settings.password_length"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await changePassword(passwords.current, passwords.new);
      setSuccess(t("settings.password_success"));
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (user?.role === "admin") {
      setError(
        "Un compte administrateur ne peut pas etre supprime depuis les parametres.",
      );
      return;
    }

    const confirmWord = window.prompt(
      t("settings.delete_prompt") ||
        "Tapez SUPPRIMER pour confirmer la suppression définitive de votre compte :",
    );
    if (confirmWord !== "SUPPRIMER" && confirmWord !== "DELETE") {
      if (confirmWord !== null) {
        setError(
          t("settings.delete_cancel") ||
            "Suppression annulée : le mot de confirmation est incorrect.",
        );
      }
      return;
    }

    setLoading(true);
    setError("");
    try {
      await deleteMyAccount();
      // Redirection après suppression
      router.push("/");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t("settings.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="p-4 text-sm text-green-400 bg-green-500/10 rounded-lg border border-green-500/20">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t("settings.profile_title")}
          </CardTitle>
          <CardDescription>{t("settings.profile_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {t("settings.email")}
              </label>
              <Input
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.email_desc")}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {t("settings.name")}
              </label>
              <Input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, name: e.target.value }))
                }
                placeholder={t("settings.name_placeholder")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                {t("settings.company")}
              </label>
              <Input
                type="text"
                value={profile.company}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, company: e.target.value }))
                }
                placeholder={t("settings.company_placeholder")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {t("settings.phone")}
              </label>
              <Input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder={t("settings.phone_placeholder")}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? t("settings.saving") : t("settings.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {t("settings.password_title")}
          </CardTitle>
          <CardDescription>{t("settings.password_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.current_password")}
              </label>
              <Input
                type="password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
                placeholder={t("settings.current_password_placeholder")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.new_password")}
              </label>
              <Input
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, new: e.target.value }))
                }
                placeholder={t("settings.new_password_placeholder")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("settings.confirm_password")}
              </label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, confirm: e.target.value }))
                }
                placeholder={t("settings.confirm_password_placeholder")}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? t("settings.changing") : t("settings.change_password")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">
            {t("settings.danger_zone")}
          </CardTitle>
          <CardDescription>{t("settings.irreversible")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            disabled={loading || user?.role === "admin"}
            onClick={handleDeleteAccount}
          >
            {t("settings.delete_account")}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {t("settings.delete_desc")}
          </p>
          {user?.role === "admin" && (
            <p className="text-xs text-amber-400 mt-2">
              Les comptes admin ne peuvent pas etre supprimes depuis cette
              section.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
