"use client";

import Link from "next/link";
import { Check, Copy, LayoutTemplate } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/dashboard/ui";
import RsvpBreakdown from "@/components/dashboard/analytics/RsvpBreakdown";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import { useTranslation } from "@/utils/i18n/Context";

function countByStatus(guests) {
  return guests.reduce(
    (counts, guest) => {
      if (guest.rsvpStatus === "confirmed") counts.confirmed += 1;
      else if (guest.rsvpStatus === "declined") counts.declined += 1;
      else if (guest.rsvpStatus === "maybe") counts.maybe += 1;
      else counts.pending += 1;
      return counts;
    },
    { confirmed: 0, declined: 0, maybe: 0, pending: 0 },
  );
}

/** Champ de résumé : n'affiche rien si la valeur est vide. */
function SummaryField({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 text-sm leading-relaxed text-ink-100">{children}</dd>
    </div>
  );
}

export default function TabOverview({ event, guests, sampleEvent }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const counts = countByStatus(guests);

  async function copyPublicLink() {
    // Il n'existe pas de lien public unique : chaque invité a son jeton. On
    // copie donc l'adresse de l'espace de gestion, pas une fausse invitation.
    const url = `${window.location.origin}/dashboard/events/${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("portal.events.details.overview.link_copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="space-y-6">
      <Panel title={t("portal.events.details.overview.stats_title")}>
        <RsvpBreakdown counts={counts} total={guests.length} t={t} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* « Personnaliser l'invitation » est déjà le bouton principal de
            l'en-tête de la page : pas de doublon ici. */}
        <Panel title={t("portal.events.details.overview.active_template")}>
          {event.invitationTemplate ? (
            <div className="p-5">
              <div className="relative h-64 overflow-hidden rounded-md border border-border/60 bg-ink-900">
                <InvitationPreview
                  template={event.invitationTemplate}
                  event={sampleEvent}
                  guestName="Exemple Invité"
                  readOnly
                />
              </div>
            </div>
          ) : (
            <EmptyState
              icon={LayoutTemplate}
              title={t("portal.events.edit.no_preview")}
              action={
                <Button asChild>
                  <Link href={`/dashboard/events/${event.id}/template`}>
                    {t("portal.events.edit.select_template")}
                  </Link>
                </Button>
              }
            />
          )}
        </Panel>

        <Panel
          title={t("portal.events.details.tabs.overview")}
          action={
            <Button variant="ghost" size="sm" onClick={copyPublicLink}>
              {copied ? (
                <Check className="mr-1.5 h-3.5 w-3.5 text-positive" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              {t("portal.events.details.overview.copy_link")}
            </Button>
          }
        >
          <dl className="space-y-6 p-5">
            <SummaryField label={t("portal.events.new.labels.description")}>
              {event.description}
            </SummaryField>

            <SummaryField label={t("portal.events.new.labels.dress_code")}>
              {event.dressCode}
            </SummaryField>

            <SummaryField label={t("portal.events.details.overview.message")}>
              {event.customMessage && (
                <span className="italic">« {event.customMessage} »</span>
              )}
            </SummaryField>

            {!event.description && !event.dressCode && !event.customMessage && (
              <p className="text-sm text-ink-400">
                {t("portal.events.details.overview.no_details")}
              </p>
            )}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
