"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  DoorOpen,
  ExternalLink,
  Loader2,
  MessageCircle,
  RefreshCw,
  ScanLine,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { regenerateCheckInLink } from "@/app/actions/checkin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { EmptyState, Panel, StatCard } from "@/components/shell/primitives";
import { clockLabel } from "@/lib/invitation/dates";
import { useTranslation } from "@/lib/i18n/Context";
import { expectedPeople } from "@/lib/tickets";

/**
 * Onglet « Jour J » d'un événement : compteurs d'arrivées, lien secret de
 * l'équipe d'accueil (voir app/actions/checkin.js) et liste des arrivées.
 *
 * @param {{ canManage: boolean, url: string | null }} props.checkIn  le lien
 *   n'est donné qu'au propriétaire et aux éditeurs
 */
export default function TabCheckIn({ eventId, eventTitle, guests, checkIn }) {
  const { t, locale } = useTranslation();
  const k = (key) => t(`portal.events.details.checkin.${key}`);
  const [url, setUrl] = useState(checkIn.url);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const confirmed = guests.filter((guest) => guest.rsvpStatus === "confirmed");
  const expected = confirmed.reduce((sum, guest) => sum + expectedPeople(guest), 0);
  const arrivals = guests
    .filter((guest) => guest.checkedInAt)
    .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt));
  const arrivedPeople = arrivals.reduce(
    (sum, guest) => sum + (guest.checkedInCount ?? expectedPeople(guest)),
    0,
  );

  const people = (count) =>
    count > 1 ? k("people_other").replace("{count}", String(count)) : k("people_one");

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const result = await regenerateCheckInLink(eventId);
      setUrl(result.url);
      toast.success(k("regenerated"));
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setRegenerating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(k("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.error"));
    }
  }

  const whatsappHref = url
    ? `https://wa.me/?text=${encodeURIComponent(
        k("whatsapp_message").replace("{title}", eventTitle).replace("{url}", url),
      )}`
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="grid content-start gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label={k("arrived_people")}
            value={arrivedPeople}
            icon={DoorOpen}
            progress={expected ? arrivedPeople / expected : 0}
            hint={k("of_expected").replace("{count}", String(expected))}
          />
          <StatCard
            label={k("arrived_guests")}
            value={arrivals.length}
            icon={Users}
            progress={confirmed.length ? arrivals.length / confirmed.length : 0}
            hint={k("of_confirmed").replace("{count}", String(confirmed.length))}
            index={1}
          />
        </div>

        <Panel title={k("link_title")} description={k("link_desc")} delay={150}>
          <div className="p-5">
            {!checkIn.canManage ? (
              <p className="text-sm text-ink-400">{k("viewer_hint")}</p>
            ) : !url ? (
              <Button onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? <Loader2 className="animate-spin" /> : <ScanLine />}
                {k("create")}
              </Button>
            ) : (
              <div className="grid gap-3">
                <Input
                  readOnly
                  value={url}
                  aria-label={k("link_title")}
                  onFocus={(event) => event.target.select()}
                  className="font-mono text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="animate-pop text-positive" /> : <Copy />}
                    {k("copy")}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle />
                      {k("whatsapp")}
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                      {k("open")}
                    </a>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-ink-400 hover:text-foreground"
                        disabled={regenerating}
                      >
                        {regenerating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                        {k("regenerate")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{k("regenerate_title")}</AlertDialogTitle>
                        <AlertDialogDescription>{k("regenerate_desc")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegenerate}>
                          {k("regenerate")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel title={k("arrivals")} description={k("subtitle")} delay={200}>
        {arrivals.length === 0 ? (
          <EmptyState icon={DoorOpen} title={k("title")} description={k("arrivals_empty")} />
        ) : (
          <ul className="divide-y divide-border/60">
            {arrivals.map((guest, index) => (
              <li
                key={guest.id}
                className="animate-rise flex items-center gap-3 px-5 py-3.5"
                style={{ "--rise-delay": `${Math.min(index, 12) * 40}ms` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-positive/25 bg-positive/10 font-display text-sm text-positive">
                  {guest.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-50">{guest.name}</p>
                  <p className="text-xs text-ink-400">
                    {people(guest.checkedInCount ?? expectedPeople(guest))}
                  </p>
                </div>
                <span data-numeric className="shrink-0 text-xs text-ink-300">
                  {clockLabel(guest.checkedInAt, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
