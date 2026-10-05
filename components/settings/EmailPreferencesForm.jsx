"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateMyEmailPreferences } from "@/app/actions/auth";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Recevoir ou non les nouveautés d'Invyra (e-mails d'annonce envoyés depuis
 * l'administration). Un interrupteur enregistré dès le clic ; les e-mails
 * liés aux événements ne dépendent pas de ce réglage.
 */
export default function EmailPreferencesForm({ marketingEmails }) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(Boolean(marketingEmails));
  const [isPending, setIsPending] = useState(false);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setIsPending(true);
    try {
      await updateMyEmailPreferences(next);
      toast.success(t(next ? "settings.marketing_on" : "settings.marketing_off"));
    } catch (caught) {
      setEnabled(!next);
      toast.error(caught.message || t("common.error"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-5 p-5">
      <div className="min-w-0">
        <p id="settings-marketing-label" className="text-sm text-ink-50">
          {t("settings.marketing_label")}
        </p>
        <p id="settings-marketing-desc" className="mt-1 text-xs leading-relaxed text-ink-400">
          {t("settings.marketing_desc")}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby="settings-marketing-label"
        aria-describedby="settings-marketing-desc"
        onClick={toggle}
        disabled={isPending}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60 ${
          enabled ? "border-gold/60 bg-gold/80" : "border-border bg-ink-800"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4.5 w-4.5 rounded-full shadow-sm transition-transform duration-300 ${
            enabled ? "translate-x-[1.375rem] bg-ink-900" : "translate-x-0.5 bg-ink-300"
          }`}
        />
      </button>
    </div>
  );
}
