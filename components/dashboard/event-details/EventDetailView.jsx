"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Palette,
  Pencil,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/dashboard/ui";
import DeleteEventDialog from "@/components/dashboard/events/DeleteEventDialog";
import CollaboratorModal from "@/components/dashboard/event-details/CollaboratorModal";
import TabOverview from "@/components/dashboard/event-details/TabOverview";
import TabGuests from "@/components/dashboard/event-details/TabGuests";
import { useTranslation } from "@/lib/i18n/Context";

export default function EventDetailView({ event, guests, collaborators }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [showCollaborators, setShowCollaborators] = useState(false);

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString(
        locale === "fr" ? "fr-FR" : "en-US",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" },
      )
    : null;

  const sampleEvent = {
    title: event.title,
    eventDate: event.eventDate,
    location: event.location,
    time: event.time || "",
    dressCode: event.dressCode || "",
    customMessage: event.customMessage || "",
  };

  return (
    <>
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("portal.events.details.actions.back_to_events")}
      </Link>

      <header className="mt-4 mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl leading-tight wrap-break-word text-ink-50 sm:text-4xl">
              {event.title}
            </h1>
            <StatusBadge status={event.status} />
          </div>

          <hr className="rule-gold-left mt-3.5 w-16" />

          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300">
            {formattedDate && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Date</dt>
                <Calendar className="h-4 w-4 shrink-0 text-ink-400" />
                <dd>{formattedDate}</dd>
              </div>
            )}
            {event.time && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Heure</dt>
                <Clock className="h-4 w-4 shrink-0 text-ink-400" />
                <dd>{event.time}</dd>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Lieu</dt>
                <MapPin className="h-4 w-4 shrink-0 text-ink-400" />
                <dd>{event.location}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          {/* Le design se modifie sur la copie propre à l'événement : le
              modèle d'origine n'est jamais touché. L'envoi en masse est dans
              la carte des invités. */}
          <Button asChild>
            <Link href={`/dashboard/events/${event.id}/template`}>
              <Palette className="mr-2 h-4 w-4" />
              {t("portal.events.details.actions.customize_invitation")}
            </Link>
          </Button>

          <Button variant="outline" onClick={() => setShowCollaborators(true)}>
            <Users className="mr-2 h-4 w-4" />
            {t("portal.events.details.collaborators")} ({collaborators.length})
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/dashboard/events/${event.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
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

      <Tabs defaultValue="overview">
        <TabsList>
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
