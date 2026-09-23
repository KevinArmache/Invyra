"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  FileText,
  LayoutTemplate,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import EventFields from "@/components/dashboard/events/EventFields";
import TemplateGallery from "@/components/invitation/TemplateGallery";
import CSVImporter from "@/components/invitation/CSVImporter";
import { createEvent } from "@/app/actions/event";
import { addGuest } from "@/app/actions/guest";
import { assignTemplateToEvent } from "@/app/actions/template";
import { useTranslation } from "@/utils/i18n/Context";

const STEPS = [
  { id: 1, icon: FileText, key: "portal.events.new.steps.details" },
  { id: 2, icon: LayoutTemplate, key: "portal.events.new.steps.template" },
  { id: 3, icon: Users, key: "portal.events.new.steps.guests" },
];

/** Fil d'Ariane des étapes : état courant, franchies, à venir. */
function Steps({ current }) {
  const { t } = useTranslation();

  return (
    <ol className="mb-8 flex items-center gap-2 sm:gap-4">
      {STEPS.map((step, index) => {
        const isDone = current > step.id;
        const isCurrent = current === step.id;

        return (
          <li key={step.id} className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm transition-colors ${
                  isDone
                    ? "border-gold/40 bg-gold/15 text-gold"
                    : isCurrent
                      ? "border-gold bg-gold text-primary-foreground"
                      : "border-border bg-secondary text-ink-400"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <step.icon className="h-4 w-4" strokeWidth={1.75} />
                )}
              </span>
              <span
                className={`hidden truncate text-sm sm:block ${
                  isCurrent ? "text-ink-50" : "text-ink-400"
                }`}
              >
                {t(step.key)}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${isDone ? "bg-gold/40" : "bg-border"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function NewEventWizard({ templates, isAdmin = false }) {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [eventId, setEventId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [guests, setGuests] = useState([]);
  const [isPending, setIsPending] = useState(false);

  // ── Étape 1 ──────────────────────────────────────────────────────────
  async function handleCreate(formEvent) {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);

    setIsPending(true);
    try {
      const created = await createEvent(Object.fromEntries(formData));
      setEventId(created.id);
      toast.success(t("portal.events.new.success_event"));
      setStep(2);
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setIsPending(false);
    }
  }

  // ── Étape 2 ──────────────────────────────────────────────────────────
  async function handlePickTemplate(templateId) {
    setIsPending(true);
    try {
      await assignTemplateToEvent(eventId, templateId);
      setSelectedTemplateId(templateId);
      toast.success(t("portal.events.edit.template_applied"));
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setIsPending(false);
    }
  }

  // ── Étape 3 ──────────────────────────────────────────────────────────
  async function handleAddGuest(formEvent) {
    formEvent.preventDefault();
    const form = formEvent.currentTarget;
    const formData = new FormData(form);

    setIsPending(true);
    try {
      const guest = await addGuest(eventId, {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
      });
      setGuests((previous) => [...previous, guest]);
      form.reset();
      toast.success(t("portal.events.new.success_guest"));
    } catch (caught) {
      toast.error(caught.message || t("portal.events.new.error_guest"));
    } finally {
      setIsPending(false);
    }
  }

  async function handleImport(rows) {
    setIsPending(true);
    const added = [];
    const failures = [];

    for (const row of rows) {
      try {
        added.push(await addGuest(eventId, row));
      } catch (caught) {
        failures.push(`${row.email} : ${caught.message}`);
      }
    }

    setGuests((previous) => [...previous, ...added]);
    setIsPending(false);

    if (added.length > 0) {
      toast.success(`${added.length} ${t("portal.events.new.guests_added")}`);
    }
    if (failures.length > 0) {
      toast.error(
        `${failures.length} ${t("portal.events.details.guests.import_failed")}`,
        { description: failures.slice(0, 3).join("\n") },
      );
    }
  }

  function finish() {
    router.push(`/dashboard/events/${eventId}`);
    router.refresh();
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t("portal.events.new.title")}
        subtitle={t("portal.events.new.subtitle")}
      />

      <Steps current={step} />

      {step === 1 && (
        <Panel
          title={t("portal.events.new.details_title")}
          description={t("portal.events.new.details_desc")}
        >
          <form onSubmit={handleCreate} className="p-5">
            <EventFields />

            <div className="mt-7 flex justify-end">
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isPending
                  ? t("portal.events.new.buttons.creating")
                  : t("portal.events.new.buttons.continue")}
                {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {step === 2 && (
        <Panel
          title={t("portal.events.new.template_title")}
          description={t("portal.events.new.template_desc")}
        >
          <div className="p-5">
            {templates.length === 0 ? (
              <EmptyState
                icon={LayoutTemplate}
                title={t("portal.events.new.no_templates")}
                description={t("portal.templates.list.no_templates_desc")}
                action={
                  // Seuls les admins créent des modèles ; un client pourra
                  // partir d'un thème depuis la page de l'événement.
                  isAdmin ? (
                    <Button asChild variant="outline">
                      <Link href="/dashboard/templates/new" target="_blank">
                        {t("portal.events.new.buttons.first_template")}
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <TemplateGallery
                templates={templates}
                selectedId={selectedTemplateId}
                onSelect={handlePickTemplate}
              />
            )}

            <div className="mt-7 flex flex-wrap justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(3)}>
                {t("portal.events.new.buttons.skip")}
              </Button>
              <Button
                size="lg"
                onClick={() => setStep(3)}
                disabled={isPending || !selectedTemplateId}
              >
                {t("portal.events.new.buttons.continue_with_template")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {step === 3 && (
        <Panel
          title={t("portal.events.new.guest_list")}
          description={`${guests.length} ${t("portal.events.new.guests_added")}`}
        >
          <div className="grid gap-8 p-5 md:grid-cols-2">
            <form onSubmit={handleAddGuest} className="space-y-3">
              <h3 className="eyebrow">{t("portal.events.new.add_guest")}</h3>

              <div className="space-y-1.5">
                <Label htmlFor="new-guest-name" className="sr-only">
                  {t("portal.events.new.labels.name")}
                </Label>
                <Input
                  id="new-guest-name"
                  name="name"
                  placeholder={t("portal.events.new.labels.name")}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-guest-email" className="sr-only">
                  {t("portal.events.new.labels.email")}
                </Label>
                <Input
                  id="new-guest-email"
                  name="email"
                  type="email"
                  placeholder={t("portal.events.new.labels.email")}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-guest-phone" className="sr-only">
                  {t("portal.events.new.labels.phone")}
                </Label>
                <Input
                  id="new-guest-phone"
                  name="phone"
                  type="tel"
                  placeholder={t("portal.events.new.labels.phone")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("portal.events.new.buttons.add")}
              </Button>
            </form>

            <div className="space-y-3">
              <h3 className="eyebrow">{t("portal.events.new.import_csv")}</h3>
              <CSVImporter onImport={handleImport} />

              {guests.length > 0 && (
                <ul className="mt-4 max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-border/60 p-2">
                  {guests.map((guest) => (
                    <li
                      key={guest.id}
                      className="flex items-center gap-2 px-2 py-1 text-sm text-ink-300"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0 text-positive" />
                      <span className="truncate">{guest.name}</span>
                      <span className="ml-auto truncate text-xs text-ink-400">
                        {guest.email}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-border/60 px-5 py-4">
            <Button size="lg" onClick={finish}>
              {t("portal.events.new.buttons.finish")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
