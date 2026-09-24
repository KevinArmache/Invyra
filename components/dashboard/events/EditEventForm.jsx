"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel } from "@/components/dashboard/ui";
import EventFields from "@/components/dashboard/events/EventFields";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import { updateEvent } from "@/app/actions/event";
import { useTranslation } from "@/lib/i18n/Context";

const STATUSES = [
  { value: "draft", labelKey: "portal.events.edit.status_draft" },
  { value: "active", labelKey: "portal.events.edit.status_active" },
  { value: "archived", labelKey: "portal.events.edit.status_archived" },
];

/**
 * Convertit une date issue de la base vers la forme attendue par
 * `<input type="datetime-local">`, qui n'accepte que « YYYY-MM-DDTHH:mm » en
 * heure locale.
 */
function toLocalInputValue(date) {
  if (!date) return "";
  const value = new Date(date);
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default function EditEventForm({ event }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [status, setStatus] = useState(event.status || "draft");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(formEvent) {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);

    setIsSaving(true);
    try {
      await updateEvent(event.id, {
        ...Object.fromEntries(formData),
        status,
      });
      toast.success(t("portal.events.edit.success"));
      router.push(`/dashboard/events/${event.id}`);
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Link
        href={`/dashboard/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {event.title}
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="text-3xl leading-tight text-ink-50 sm:text-4xl">
          {t("portal.events.edit.title")}
        </h1>
        <hr className="rule-gold-left mt-3.5 w-16" />
      </header>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,340px)]">
          <Panel title={t("portal.events.new.details_title")}>
            <div className="p-5">
              <EventFields
                defaults={{
                  title: event.title,
                  description: event.description,
                  event_date: toLocalInputValue(event.eventDate),
                  location: event.location,
                  time: event.time,
                  dress_code: event.dressCode,
                  custom_message: event.customMessage,
                }}
              />

              <div className="mt-5 space-y-2">
                <Label htmlFor="event-status">
                  {t("portal.events.edit.status_label")}
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="event-status" className="sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel
              title={t("portal.events.edit.preview_title")}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/events/${event.id}/template`}>
                    {t("portal.events.edit.select_template")}
                  </Link>
                </Button>
              }
            >
              <div className="p-5">
                {event.invitationTemplate ? (
                  <div className="relative aspect-3/4 overflow-hidden rounded-md border border-border/60 bg-ink-900">
                    <InvitationPreview
                      template={event.invitationTemplate}
                      event={event}
                      guestName="Exemple Invité"
                      readOnly
                    />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-ink-400">
                    {t("portal.events.edit.no_preview")}
                  </p>
                )}
              </div>
            </Panel>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving
                ? t("settings.saving")
                : t("portal.events.edit.update_btn")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
