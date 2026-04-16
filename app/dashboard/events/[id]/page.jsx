"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr as dateFr, enUS as dateEn } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEventById, deleteEvent, updateEvent } from "@/app/actions/event";
import {
  getGuests,
  sendBulkInvitations,
  deleteGuest,
} from "@/app/actions/guest";
import {
  sendInvitationEmail,
  generateWhatsAppLink,
  markWhatsAppSent,
} from "@/app/actions/notify";
import {
  Calendar,
  MapPin,
  Mail,
  Edit,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import TabOverview from "@/components/dashboard/event-details/TabOverview";
import TabGuests from "@/components/dashboard/event-details/TabGuests";
import CollaboratorModal from "@/components/dashboard/CollaboratorModal";
import { useTranslation } from "@/utils/i18n/Context";
import { getCollaborators } from "@/app/actions/collaborator";
import { Users } from "lucide-react";
import CodeTemplateEditor from "@/components/invitation/CodeTemplateEditor";
import InvitationPreview from "@/components/invitation/InvitationPreview";

export default function EventDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { t, locale } = useTranslation();

  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [eventTemplate, setEventTemplate] = useState({
    type: "code",
    html: "",
    css: "",
    js: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eData, gData, cData] = await Promise.all([
        getEventById(id),
        getGuests(id),
        getCollaborators(id),
      ]);

      setEvent(eData);
      setEventTemplate(
        eData?.invitationTemplate || {
          type: "code",
          html: "",
          css: "",
          js: "",
        },
      );
      setGuests(gData);
      setCollaborators(cData);
    } catch (err) {
      console.error(err);
      router.push("/dashboard/events");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeleteEvent() {
    if (!confirm(t("portal.events.details.actions.delete_event_confirm")))
      return;
    setDeleting(true);
    try {
      await deleteEvent(id);
      toast.success(t("portal.events.details.actions.event_deleted"));
      router.push("/dashboard/events");
    } catch (e) {
      toast.error("Erreur: " + e.message);
      setDeleting(false);
    }
  }

  async function handleSendBulk() {
    if (!confirm(t("portal.events.details.actions.send_bulk_confirm"))) return;
    setSendingBulk(true);
    try {
      const res = await sendBulkInvitations(id);
      toast.success(res.message);
      loadData();
    } catch (e) {
      toast.error("Erreur: " + e.message);
    } finally {
      setSendingBulk(false);
    }
  }

  async function handleSendSingleEmail(guestId) {
    try {
      await sendInvitationEmail(guestId);
      toast.success(t("portal.events.details.actions.email_sent"));
      loadData();
    } catch (e) {
      toast.error("Erreur lors de l'envoi: " + e.message);
    }
  }

  async function handleSendWhatsApp(guestId) {
    try {
      const res = await generateWhatsAppLink(guestId);
      window.open(res.link, "_blank");
      await markWhatsAppSent(guestId);
      loadData();
    } catch (e) {
      toast.error("Erreur WhatsApp: " + e.message);
    }
  }

  async function handleRemoveGuest(guestId) {
    if (!confirm(t("portal.events.details.guests.delete_confirm"))) return;
    try {
      await deleteGuest(guestId);
      toast.success(t("portal.events.details.actions.guest_deleted"));
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    try {
      await updateEvent(id, { invitation_template: eventTemplate });
      setEvent((prev) => ({ ...prev, invitationTemplate: eventTemplate }));
      toast.success("Le template de cet événement a été enregistré.");
    } catch (e) {
      toast.error("Erreur: " + e.message);
    } finally {
      setSavingTemplate(false);
    }
  }

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!event) return null;

  const demoEvent = {
    title: event.title,
    eventDate: event.eventDate,
    location: event.location,
    time: event.time || "",
    dressCode: event.dressCode || "",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/events"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />{" "}
            {t("portal.events.details.actions.back_to_events")}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            {event.eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />{" "}
                {format(new Date(event.eventDate), "PPP", {
                  locale: locale === "en" ? dateEn : dateFr,
                })}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {event.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.invitationTemplate && (
            <Button
              variant="secondary"
              onClick={handleSendBulk}
              disabled={sendingBulk}
            >
              {sendingBulk ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              {sendingBulk
                ? t("portal.events.details.actions.sending")
                : t("portal.events.details.actions.send_invitations")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowCollabModal(true)}
            className="gap-2"
          >
            <Users className="w-4 h-4" /> Collaborateurs ({collaborators.length}
            )
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/events/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />{" "}
              {t("portal.events.details.actions.edit")}
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteEvent}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            {t("portal.events.details.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="guests">
            {t("portal.events.details.tabs.guests")} ({guests.length})
          </TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <TabOverview
            event={{ ...event, id }}
            guests={guests}
            demoEvent={demoEvent}
          />
        </TabsContent>

        <TabsContent value="guests" className="mt-6">
          <TabGuests
            guests={guests}
            eventId={id}
            onRefresh={loadData}
            onSendSingleEmail={handleSendSingleEmail}
            onSendWhatsApp={handleSendWhatsApp}
            onRemoveGuest={handleRemoveGuest}
          />
        </TabsContent>

        <TabsContent value="template" className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  Template de l'événement
                </h3>
                <p className="text-sm text-muted-foreground">
                  Les modifications sont appliquées uniquement a la copie liee a
                  cet evenement.
                </p>
              </div>
              <Button
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {savingTemplate
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
              </Button>
            </div>

            <div className="grid lg:grid-cols-[440px_1fr] gap-5 min-h-[600px]">
              <div className="overflow-hidden flex flex-col h-full bg-card rounded-xl border border-border shadow-sm">
                <CodeTemplateEditor
                  template={eventTemplate}
                  onChange={setEventTemplate}
                />
              </div>

              <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20 h-full shadow-inner flex items-center justify-center p-0">
                <div className="w-full h-full overflow-auto">
                  <InvitationPreview
                    template={eventTemplate}
                    event={demoEvent}
                    guestName="Exemple Invite"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CollaboratorModal
        open={showCollabModal}
        onClose={() => setShowCollabModal(false)}
        eventId={id}
        initialCollaborators={collaborators}
      />
    </div>
  );
}
