"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock,
  DoorOpen,
  Eye,
  EyeOff,
  FileDown,
  HelpCircle,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, Panel } from "@/components/shell/primitives";
import CSVImporter from "@/components/events/CSVImporter";
import {
  addGuest,
  deleteGuest,
  sendBulkInvitations,
  updateGuest,
} from "@/app/actions/guest";
import {
  generateWhatsAppLink,
  markWhatsAppSent,
  sendInvitationEmail,
} from "@/app/actions/notify";
import { clockLabel } from "@/lib/invitation/dates";
import { useTranslation } from "@/lib/i18n/Context";
import { MAX_SEATS } from "@/lib/tickets";

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

/**
 * Ouverture de l'invitation : l'œil doré et la date au survol, ou un œil
 * barré tant que l'invité ne l'a pas ouverte. La date vient de la première
 * ouverture (getInvitationByToken), robots d'aperçu exclus.
 */
function OpenedBadge({ viewedAt }) {
  const { t, locale } = useTranslation();

  if (!viewedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ink-400">
        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
        {t("portal.events.details.guests.not_opened")}
      </span>
    );
  }

  const date = new Date(viewedAt).toLocaleString(
    locale === "fr" ? "fr-FR" : "en-US",
    { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
  );
  const label = t("portal.events.details.guests.opened_on").replace("{date}", date);

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-gold"
      title={label}
    >
      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
      {t("portal.events.details.guests.opened")}
      <span className="sr-only">: {label}</span>
    </span>
  );
}

/**
 * Places de l'invité : « 3 places », ou « 2/3 pers. » une fois qu'il a
 * confirmé et précisé combien ils seront. Rien pour une seule place.
 */
function SeatsBadge({ guest }) {
  const { t } = useTranslation();
  if (guest.seats <= 1) return null;
  const label =
    guest.rsvpStatus === "confirmed" && guest.attendingCount != null
      ? t("portal.events.details.guests.attending_badge")
          .replace("{attending}", String(guest.attendingCount))
          .replace("{seats}", String(guest.seats))
      : t("portal.events.details.guests.seats_badge").replace(
          "{count}",
          String(guest.seats),
        );
  return (
    <span
      data-numeric
      className="shrink-0 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold"
    >
      {label}
    </span>
  );
}

function GuestRow({ guest, index }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [sending, setSending] = useState(null);
  const [editing, setEditing] = useState(false);
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
    <li
      className="group animate-rise flex flex-col gap-3 px-5 py-4 transition-colors duration-300 hover:bg-ink-800/40 sm:flex-row sm:items-center"
      // Cascade limitée aux premières lignes : une longue liste ne doit pas
      // mettre plusieurs secondes à apparaître.
      style={{ "--rise-delay": `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold transition-transform duration-300 group-hover:scale-105">
          {guest.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-ink-50">
            <span className="truncate">{guest.name}</span>
            <SeatsBadge guest={guest} />
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

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5">
        <OpenedBadge viewedAt={guest.invitationViewedAt} />
        <RsvpBadge status={guest.rsvpStatus} />
        {guest.checkedInAt && (
          <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-positive">
            <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {t("portal.events.details.guests.arrived_badge").replace(
              "{time}",
              clockLabel(guest.checkedInAt, locale),
            )}
          </span>
        )}
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
            <Check className="animate-pop h-3.5 w-3.5" />
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
              <Check className="animate-pop h-3.5 w-3.5" />
            ) : (
              <MessageCircle className="h-3.5 w-3.5" />
            )}
            {whatsappSent
              ? t("portal.events.details.guests.resend")
              : t("portal.events.details.guests.table.whatsapp")}
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-ink-400 hover:text-gold"
          onClick={() => setEditing(true)}
          aria-label={`${t("portal.events.details.guests.edit")} ${guest.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <EditGuestDialog guest={guest} open={editing} onOpenChange={setEditing} />

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

/** Modification d'un invité : identité, contact et places réservées. */
function EditGuestDialog({ guest, open, onOpenChange }) {
  const { t } = useTranslation();
  const g = (key) => t(`portal.events.details.guests.${key}`);
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await updateGuest(guest.id, {
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        seats: form.get("seats"),
      });
      toast.success(g("saved"));
      onOpenChange(false);
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{g("edit_title")}</DialogTitle>
          <DialogDescription>{g("edit_desc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor={`edit-name-${guest.id}`}>
              {t("portal.events.new.labels.name")}
            </Label>
            <Input
              id={`edit-name-${guest.id}`}
              name="name"
              defaultValue={guest.name}
              required
              maxLength={120}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`edit-email-${guest.id}`}>
              {t("portal.events.new.labels.email")}
            </Label>
            <Input
              id={`edit-email-${guest.id}`}
              name="email"
              type="email"
              defaultValue={guest.email}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <div className="grid gap-1.5">
              <Label htmlFor={`edit-phone-${guest.id}`}>
                {t("portal.events.new.labels.phone")}
              </Label>
              <Input
                id={`edit-phone-${guest.id}`}
                name="phone"
                type="tel"
                defaultValue={guest.phone ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`edit-seats-${guest.id}`}>{g("seats_label")}</Label>
              <Input
                id={`edit-seats-${guest.id}`}
                name="seats"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_SEATS}
                defaultValue={guest.seats ?? 1}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {g("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * @param {boolean} props.hasTemplate  l'événement a une invitation :
 *   sans lui, l'envoi en masse enverrait un lien vers une page vide.
 */
export default function TabGuests({ guests, eventId, hasTemplate = false }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [exporting, setExporting] = useState(null);

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

  const confirmedCount = guests.filter(
    (guest) => guest.rsvpStatus === "confirmed",
  ).length;

  /**
   * Le PDF est généré par la route guests/pdf. Il est récupéré ici plutôt que
   * par un simple lien, pour montrer la génération en cours et signaler un
   * échec au lieu de télécharger une page d'erreur.
   *
   * @param {"all"|"confirmed"} scope
   */
  async function handleExport(scope) {
    setExporting(scope);
    try {
      const query = scope === "confirmed" ? "?status=confirmed" : "";
      const response = await fetch(
        `/dashboard/events/${eventId}/guests/pdf${query}`,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const filename =
        /filename="([^"]+)"/.exec(
          response.headers.get("content-disposition") ?? "",
        )?.[1] ?? "guests.pdf";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Laisse au navigateur le temps de lancer le téléchargement.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error(t("portal.events.details.guests.export.error"));
    } finally {
      setExporting(null);
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
        seats: formData.get("seats"),
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

  return (
    <Panel
      title={t("portal.events.details.guests.title")}
      description={t("portal.events.details.guests.subtitle")}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {guests.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={exporting !== null}>
                  {exporting ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-1.5 h-4 w-4" />
                  )}
                  {exporting
                    ? t("portal.events.details.guests.export.exporting")
                    : t("portal.events.details.guests.export.button")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onSelect={() => handleExport("all")}
                  className="cursor-pointer"
                >
                  <Users className="h-4 w-4 text-gold" />
                  {t("portal.events.details.guests.export.all")}
                  <span data-numeric className="ml-auto text-xs text-ink-400">
                    {guests.length}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => handleExport("confirmed")}
                  disabled={confirmedCount === 0}
                  className="cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  {t("portal.events.details.guests.export.confirmed")}
                  <span data-numeric className="ml-auto text-xs text-ink-400">
                    {confirmedCount}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {guests.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSendBulk}
              disabled={!hasTemplate || pendingEmails === 0 || isSendingBulk}
              title={
                hasTemplate
                  ? t("portal.events.details.guests.bulk_hint")
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
        <div className="grid animate-in fade-in-0 slide-in-from-top-2 gap-8 border-b border-border/60 bg-ink-800/30 p-5 duration-500 md:grid-cols-2">
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

            <div className="flex items-center gap-3">
              <Label
                htmlFor="guest-seats"
                className="shrink-0 text-xs font-normal text-ink-300"
              >
                {t("portal.events.details.guests.seats_label")}
              </Label>
              <Input
                id="guest-seats"
                name="seats"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_SEATS}
                defaultValue={1}
                required
                className="w-20"
              />
              <span className="text-xs leading-snug text-ink-400">
                {t("portal.events.details.guests.seats_hint")}
              </span>
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
              {filtered.map((guest, index) => (
                <GuestRow key={guest.id} guest={guest} index={index} />
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}
