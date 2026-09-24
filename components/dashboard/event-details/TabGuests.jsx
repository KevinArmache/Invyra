"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState, Panel } from "@/components/dashboard/ui";
import CSVImporter from "@/components/invitation/CSVImporter";
import {
  addGuest,
  deleteGuest,
  sendBulkInvitations,
} from "@/app/actions/guest";
import {
  generateWhatsAppLink,
  markWhatsAppSent,
  sendInvitationEmail,
} from "@/app/actions/notify";
import { useTranslation } from "@/lib/i18n/Context";

const RSVP_STYLES = {
  confirmed: {
    icon: CheckCircle2,
    className: "border-positive/30 bg-positive/10 text-positive",
    labelKey: "portal.events.details.guests.status.attending",
  },
  declined: {
    icon: XCircle,
    className: "border-negative/30 bg-negative/10 text-negative",
    labelKey: "portal.events.details.guests.status.declined",
  },
  maybe: {
    icon: HelpCircle,
    className: "border-info/30 bg-info/10 text-info",
    labelKey: "portal.events.details.guests.status.maybe",
  },
};

const PENDING_STYLE = {
  icon: Clock,
  className: "border-border bg-secondary text-ink-300",
  labelKey: "portal.events.details.guests.status.pending",
};

function RsvpBadge({ status }) {
  const { t } = useTranslation();
  const style = RSVP_STYLES[status] ?? PENDING_STYLE;
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${style.className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t(style.labelKey)}
    </span>
  );
}

function GuestRow({ guest }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [sending, setSending] = useState(null);
  const [isPending, startTransition] = useTransition();

  const emailSent = Boolean(guest.emailSentAt || guest.invitationSentAt);
  const whatsappSent = Boolean(guest.whatsappSentAt);

  async function handleEmail() {
    setSending("email");
    try {
      await sendInvitationEmail(guest.id);
      toast.success(t("portal.events.details.actions.email_sent"));
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setSending(null);
    }
  }

  async function handleWhatsApp() {
    setSending("whatsapp");
    try {
      const { link } = await generateWhatsAppLink(guest.id);
      window.open(link, "_blank", "noopener,noreferrer");
      await markWhatsAppSent(guest.id);
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setSending(null);
    }
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteGuest(guest.id);
        toast.success(t("portal.events.details.actions.guest_deleted"));
        router.refresh();
      } catch (caught) {
        toast.error(caught.message || t("common.error"));
      }
    });
  }

  return (
    <li className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-ink-800/40 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold">
          {guest.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-ink-50">
            <span className="truncate">{guest.name}</span>
            {guest.plusOne && (
              <span className="shrink-0 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">
                +1
              </span>
            )}
          </p>
          <p className="truncate text-xs text-ink-400">{guest.email}</p>
          {(guest.dietaryRestrictions || guest.notes) && (
            <p className="mt-0.5 truncate text-xs text-ink-400">
              {[guest.dietaryRestrictions, guest.notes]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <RsvpBadge status={guest.rsvpStatus} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={handleEmail}
          disabled={sending === "email"}
          className={`h-8 gap-1.5 text-xs ${emailSent ? "border-positive/25 text-positive" : ""}`}
        >
          {sending === "email" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : emailSent ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Mail className="h-3.5 w-3.5" />
          )}
          {emailSent
            ? t("portal.events.details.guests.resend")
            : t("portal.events.details.guests.table.email")}
        </Button>

        {guest.phone && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleWhatsApp}
            disabled={sending === "whatsapp"}
            className={`h-8 gap-1.5 text-xs ${whatsappSent ? "border-positive/25 text-positive" : ""}`}
          >
            {sending === "whatsapp" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : whatsappSent ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <MessageCircle className="h-3.5 w-3.5" />
            )}
            {whatsappSent
              ? t("portal.events.details.guests.resend")
              : t("portal.events.details.guests.table.whatsapp")}
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-ink-400 hover:bg-destructive/10 hover:text-destructive"
              aria-label={`${t("portal.events.list.delete_btn")} ${guest.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("portal.events.list.delete_btn")} « {guest.name} » ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("portal.events.details.guests.delete_confirm")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(clickEvent) => {
                  clickEvent.preventDefault();
                  handleDelete();
                }}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("portal.events.list.delete_btn")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}

/**
 * @param {boolean} props.hasTemplate  l'événement a un design d'invitation :
 *   sans lui, l'envoi en masse enverrait un lien vers une page vide.
 */
export default function TabGuests({ guests, eventId, hasTemplate = false }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Même règle que sendBulkInvitationEmails : seuls ceux qui n'ont pas
  // encore reçu l'email sont concernés.
  const pendingEmails = guests.filter(
    (guest) => guest.email && !guest.emailSentAt,
  ).length;

  async function handleSendBulk() {
    setIsSendingBulk(true);
    try {
      const result = await sendBulkInvitations(eventId);
      toast.success(result.message);
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setIsSendingBulk(false);
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return guests;
    return guests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(needle) ||
        guest.email.toLowerCase().includes(needle),
    );
  }, [guests, query]);

  async function handleAdd(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget;

    setIsAdding(true);
    try {
      await addGuest(eventId, {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
      });
      toast.success(t("portal.events.new.success_guest"));
      form.reset();
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setIsAdding(false);
    }
  }

  async function handleImport(rows) {
    // Les échecs individuels (doublon d'email, quota atteint) ne doivent pas
    // interrompre l'import : on compte et on rapporte.
    let imported = 0;
    const failures = [];

    for (const row of rows) {
      try {
        await addGuest(eventId, row);
        imported += 1;
      } catch (caught) {
        failures.push(`${row.email} : ${caught.message}`);
      }
    }

    if (imported > 0) {
      toast.success(`${imported} ${t("portal.events.new.guests_added")}`);
    }
    if (failures.length > 0) {
      toast.error(
        `${failures.length} ${t("portal.events.details.guests.import_failed")}`,
        { description: failures.slice(0, 3).join("\n") },
      );
    }

    setShowAdd(false);
    router.refresh();
  }

  const confirmed = guests.filter((g) => g.rsvpStatus === "confirmed").length;

  return (
    <Panel
      title={t("portal.events.details.guests.title")}
      description={`${guests.length} ${t("portal.events.list.guests")} · ${confirmed} ${t("portal.events.details.guests.status.attending").toLowerCase()}`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {guests.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSendBulk}
              disabled={!hasTemplate || pendingEmails === 0 || isSendingBulk}
              title={
                hasTemplate
                  ? undefined
                  : t("portal.events.details.guests.bulk_needs_template")
              }
            >
              {isSendingBulk ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-1.5 h-4 w-4" />
              )}
              {isSendingBulk
                ? t("portal.events.details.actions.sending")
                : t("portal.events.details.actions.send_invitations")}
              {!isSendingBulk && (
                <span data-numeric className="ml-1.5 text-ink-400">
                  ({pendingEmails})
                </span>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant={showAdd ? "secondary" : "default"}
            onClick={() => setShowAdd((open) => !open)}
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            {showAdd
              ? t("common.close")
              : t("portal.events.details.guests.add_btn")}
          </Button>
        </div>
      }
    >
      {showAdd && (
        <div className="grid gap-8 border-b border-border/60 bg-ink-800/30 p-5 md:grid-cols-2">
          <form onSubmit={handleAdd} className="space-y-3">
            <h3 className="eyebrow">{t("portal.events.new.add_guest")}</h3>

            <div className="space-y-1.5">
              <Label htmlFor="guest-name" className="sr-only">
                {t("portal.events.new.labels.name")}
              </Label>
              <Input
                id="guest-name"
                name="name"
                placeholder={t("portal.events.new.labels.name")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guest-email" className="sr-only">
                {t("portal.events.new.labels.email")}
              </Label>
              <Input
                id="guest-email"
                name="email"
                type="email"
                placeholder={t("portal.events.new.labels.email")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guest-phone" className="sr-only">
                {t("portal.events.new.labels.phone")}
              </Label>
              <Input
                id="guest-phone"
                name="phone"
                type="tel"
                placeholder={t("portal.events.new.labels.phone")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isAdding}>
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("portal.events.new.buttons.add")}
            </Button>
          </form>

          <div className="space-y-3">
            <h3 className="eyebrow">{t("portal.events.new.import_csv")}</h3>
            <CSVImporter onImport={handleImport} />
          </div>
        </div>
      )}

      {!hasTemplate && guests.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/60 bg-caution/5 px-5 py-3 text-sm text-ink-300">
          {t("portal.events.details.guests.bulk_needs_template")}
          <Link
            href={`/dashboard/events/${eventId}/template`}
            className="text-gold underline-offset-4 hover:underline"
          >
            {t("portal.events.details.actions.customize_invitation")}
          </Link>
        </p>
      )}

      {guests.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={t("portal.events.new.no_guests_yet")}
          description={t("portal.events.details.guests.subtitle")}
          action={
            !showAdd && (
              <Button onClick={() => setShowAdd(true)}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                {t("portal.events.details.guests.add_btn")}
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="border-b border-border/60 p-5">
            <div className="relative max-w-sm">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("portal.events.details.guests.search")}
                aria-label={t("portal.events.details.guests.search")}
                className="pl-9"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Search} title={t("common.no_results")} />
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((guest) => (
                <GuestRow key={guest.id} guest={guest} />
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}
