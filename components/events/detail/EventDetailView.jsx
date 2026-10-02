"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Palette,
  Pencil,
  Phone,
  Send,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shell/primitives";
import AnimatedNumber from "@/components/common/AnimatedNumber";
import Countdown from "@/components/common/Countdown";
import DeleteEventDialog from "@/components/events/DeleteEventDialog";
import CollaboratorModal from "@/components/events/detail/CollaboratorModal";
import TabOverview from "@/components/events/detail/TabOverview";
import TabGuests from "@/components/events/detail/TabGuests";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Fiche d'un événement.
 *
 * @param {object} [props.countdown]  `{ target, now }` calculés côté serveur,
 *   ou absent si l'événement n'a pas de date à venir
 */
export default function EventDetailView({ event, guests, collaborators, countdown }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [showCollaborators, setShowCollaborators] = useState(false);

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString(
        locale === "fr" ? "fr-FR" : "en-US",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        },
      )
    : null;

  const sampleEvent = {
    title: event.title,
    eventDate: event.eventDate,
    location: event.location,
    time: event.time || "",
    dressCode: event.dressCode || "",
    contactPhone: event.contactPhone || "",
    customMessage: event.customMessage || "",
  };

  // Le parcours d'une invitation, en quatre chiffres.
  const total = guests.length;
  const sent = guests.filter((guest) => guest.invitationSentAt).length;
  const opened = guests.filter((guest) => guest.invitationViewedAt).length;
  const responded = guests.filter((guest) => guest.rsvpStatus).length;
  const kpis = [
    { key: "invited", value: total, icon: Users },
    { key: "sent", value: sent, icon: Send, share: total ? sent / total : 0 },
    { key: "opened", value: opened, icon: Eye, share: total ? opened / total : 0 },
    {
      key: "responded",
      value: responded,
      icon: CheckCircle2,
      share: total ? responded / total : 0,
    },
  ];

  return (
    <>
      <Link
        href="/dashboard/events"
        className="animate-fade-in group inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        {t("portal.events.details.actions.back_to_events")}
      </Link>

      <header className="mt-4 mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="animate-rise flex flex-wrap items-center gap-3">
            <h1 className="text-3xl leading-tight wrap-break-word text-ink-50 sm:text-4xl">
              {event.title}
            </h1>
            <StatusBadge
              status={event.status}
              label={t(`portal.events.edit.status_${event.status}`)}
            />
          </div>

          <hr
            className="rule-gold-left animate-draw-x mt-3.5 w-16"
            style={{ "--rise-delay": "180ms" }}
          />

          <dl
            className="animate-rise mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300"
            style={{ "--rise-delay": "100ms" }}
          >
            {formattedDate && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{t("portal.events.details.meta.date")}</dt>
                <Calendar className="h-4 w-4 shrink-0 text-ink-400" />
                <dd className="first-letter:uppercase">{formattedDate}</dd>
              </div>
            )}
            {event.time && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{t("portal.events.details.meta.time")}</dt>
                <Clock className="h-4 w-4 shrink-0 text-ink-400" />
                <dd>{event.time}</dd>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{t("portal.events.details.meta.location")}</dt>
                <MapPin className="h-4 w-4 shrink-0 text-ink-400" />
                <dd>{event.location}</dd>
              </div>
            )}
            {event.contactPhone && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{t("portal.events.details.meta.contact_phone")}</dt>
                <Phone className="h-4 w-4 shrink-0 text-ink-400" />
                <dd data-numeric>{event.contactPhone}</dd>
              </div>
            )}
          </dl>

          {countdown && (
            <div
              className="animate-rise mt-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1"
              style={{ "--rise-delay": "160ms" }}
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
              <Countdown
                target={countdown.target}
                now={countdown.now}
                variant="compact"
              />
            </div>
          )}
        </div>

        <div
          className="animate-fade-in flex flex-wrap items-center gap-2 lg:shrink-0"
          style={{ "--rise-delay": "200ms" }}
        >
          {/* L'invitation se modifie sur la copie propre à l'événement : le
              modèle d'origine n'est jamais touché. L'envoi en masse est dans
              la carte des invités. */}
          <Button asChild className="group">
            <Link href={`/dashboard/events/${event.id}/template`}>
              <Palette className="transition-transform duration-500 group-hover:-rotate-12" />
              {t("portal.events.details.actions.customize_invitation")}
            </Link>
          </Button>

          <Button variant="outline" onClick={() => setShowCollaborators(true)}>
            <Users />
            {t("portal.events.details.collaborators")} ({collaborators.length})
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/dashboard/events/${event.id}/edit`}>
              <Pencil />
              {t("portal.events.details.actions.edit")}
            </Link>
          </Button>

          <DeleteEventDialog
            eventId={event.id}
            eventTitle={event.title}
            onDeleted={() => router.push("/dashboard/events")}
          />
        </div>
      </header>

      {/* Le parcours de l'invitation : invités, envoyées, ouvertes, réponses. */}
      <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.key}
            className="animate-rise flex flex-col-reverse bg-ink-850 p-5"
            style={{ "--rise-delay": `${150 + index * 70}ms` }}
          >
            <dt className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-400">
              <kpi.icon className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.75} />
              {t(`portal.events.details.kpi.${kpi.key}`)}
            </dt>
            <dd>
              <span className="font-display text-3xl text-ink-50">
                <AnimatedNumber value={kpi.value} delay={250 + index * 100} />
              </span>
              {kpi.share != null && (
                <span className="mt-3 block h-1 overflow-hidden rounded-full bg-gold/15" aria-hidden="true">
                  <span
                    className="animate-grow-x block h-full rounded-full bg-gold"
                    style={{
                      width: `${Math.round(kpi.share * 100)}%`,
                      "--rise-delay": `${350 + index * 100}ms`,
                    }}
                  />
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <Tabs defaultValue="overview">
        <TabsList className="animate-fade-in" style={{ "--rise-delay": "300ms" }}>
          <TabsTrigger value="overview">
            {t("portal.events.details.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="guests">
            {t("portal.events.details.tabs.guests")} ({guests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <TabOverview
            event={event}
            guests={guests}
            sampleEvent={sampleEvent}
          />
        </TabsContent>

        <TabsContent value="guests" className="mt-6">
          <TabGuests
            guests={guests}
            eventId={event.id}
            hasTemplate={Boolean(event.invitationTemplate)}
          />
        </TabsContent>
      </Tabs>

      <CollaboratorModal
        open={showCollaborators}
        onClose={() => setShowCollaborators(false)}
        eventId={event.id}
        initialCollaborators={collaborators}
      />
    </>
  );
}
