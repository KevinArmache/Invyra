"use client";

import Link from "next/link";
import { Check, Copy, FileDown, LayoutTemplate, Loader2, Palette } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/shell/primitives";
import RsvpBreakdown from "@/components/analytics/RsvpBreakdown";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import { downloadFile } from "@/lib/download";
import { useTranslation } from "@/lib/i18n/Context";

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
function SummaryField({ label, children, index = 0 }) {
  if (!children) return null;
  return (
    <div className="animate-rise" style={{ "--rise-delay": `${200 + index * 70}ms` }}>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 text-sm leading-relaxed text-ink-100">{children}</dd>
    </div>
  );
}

export default function TabOverview({ event, guests, sampleEvent }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const counts = countByStatus(guests);

  async function copyPageLink() {
    // Il n'existe pas de lien public unique : chaque invité a son jeton. On
    // copie donc l'adresse de cette page de gestion, utile à un
    // collaborateur, et le libellé le dit.
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

  /** Invitation générique en PDF, fidèle au modèle (route invitation/pdf). */
  async function downloadPdf() {
    setDownloading(true);
    try {
      await downloadFile(`/dashboard/events/${event.id}/invitation/pdf`, "invitation.pdf");
    } catch {
      toast.error(t("invite.pdf_error"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Panel title={t("portal.events.details.overview.stats_title")}>
        <RsvpBreakdown counts={counts} total={guests.length} t={t} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* « Personnaliser l'invitation » est déjà le bouton principal de
            l'en-tête de la page : ici, un simple rappel sous l'aperçu. */}
        <Panel title={t("portal.events.details.overview.active_template")} delay={100}>
          {event.invitationTemplate ? (
            <div className="p-5">
              <div className="relative mx-auto aspect-3/4 w-full max-w-[18rem] overflow-hidden rounded-xl border border-border/60 bg-ink-900">
                <InvitationPreview
                  template={event.invitationTemplate}
                  event={sampleEvent}
                  guestName={t("landing.hero.scene.guest")}
                  readOnly
                />
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline" size="sm" className="group">
                  <Link href={`/dashboard/events/${event.id}/template`}>
                    <Palette className="transition-transform duration-500 group-hover:-rotate-12" />
                    {t("portal.events.details.actions.customize_invitation")}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadPdf}
                  disabled={downloading}
                >
                  {downloading ? <Loader2 className="animate-spin" /> : <FileDown />}
                  {downloading
                    ? t("portal.events.details.actions.downloading_pdf")
                    : t("portal.events.details.actions.download_pdf")}
                </Button>
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
          delay={160}
          title={t("portal.events.details.overview.summary")}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={copyPageLink}
              title={t("portal.events.details.overview.copy_link_hint")}
            >
              {copied ? (
                <Check className="animate-pop h-3.5 w-3.5 text-positive" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {t("portal.events.details.overview.copy_link")}
            </Button>
          }
        >
          <dl className="space-y-6 p-5">
            <SummaryField index={0} label={t("portal.events.new.labels.description")}>
              {event.description}
            </SummaryField>

            <SummaryField index={1} label={t("portal.events.new.labels.dress_code")}>
              {event.dressCode}
            </SummaryField>

            <SummaryField index={2} label={t("portal.events.details.overview.message")}>
              {event.customMessage && (
                <span className="block border-l-2 border-gold/50 pl-4 font-display text-base italic">
                  « {event.customMessage} »
                </span>
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
