"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  regeneratePublicLink,
  setPublicLinkEnabled,
  updatePublicLinkSettings,
} from "@/app/actions/public-link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel } from "@/components/shell/primitives";
import { slugify } from "@/lib/pdf/filename";
import { linkQrPngDataUrl, linkQrSvg } from "@/lib/qr-svg";
import { useTranslation } from "@/lib/i18n/Context";
import { PUBLIC_MAX_SEATS } from "@/lib/tickets";

const SEAT_OPTIONS = Array.from({ length: PUBLIC_MAX_SEATS }, (_, index) => index + 1);

/**
 * Lien unique de l'invitation, en tête de l'onglet Invités (voir
 * app/actions/public-link.js) : un seul lien à partager, chaque personne y
 * saisit son nom et obtient son invitation personnelle. Les inscrits
 * rejoignent la liste ci-dessous avec le badge « Via le lien ».
 *
 * Le QR code du lien se télécharge en PNG, assez grand pour être imprimé sur
 * un faire-part ou une affiche.
 *
 * @param {{ canManage: boolean, enabled: boolean, url: string | null, maxSeats: number }} props.link
 * @param {number} props.joinedCount  invités inscrits par le lien
 * @param {boolean} props.hasTemplate  sans modèle, la page du lien serait vide
 */
export default function PublicLinkPanel({ eventId, eventTitle, link: initialLink, joinedCount, hasTemplate }) {
  const { t } = useTranslation();
  const k = (key) => t(`portal.events.details.guests.public_link.${key}`);
  const router = useRouter();
  const [link, setLink] = useState(initialLink);
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState("");

  useEffect(() => {
    if (!link.enabled || !link.url) return;
    let cancelled = false;
    linkQrSvg(link.url).then((svg) => {
      if (!cancelled) setQrSvg(svg);
    });
    return () => {
      cancelled = true;
    };
  }, [link.enabled, link.url]);

  /** Lance une action du serveur et reprend l'état du lien qu'elle renvoie. */
  async function run(name, action, successKey) {
    setBusy(name);
    try {
      setLink(await action());
      if (successKey) toast.success(k(successKey));
      // L'aperçu de l'événement propose aussi le lien : il se met à jour.
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success(k("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.error"));
    }
  }

  async function handleDownloadQr() {
    setBusy("qr");
    try {
      const anchor = document.createElement("a");
      anchor.href = await linkQrPngDataUrl(link.url);
      anchor.download = `qr-${slugify(eventTitle)}.png`;
      anchor.click();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(null);
    }
  }

  const whatsappHref = link.url
    ? `https://wa.me/?text=${encodeURIComponent(
        k("whatsapp_message").replace("{title}", eventTitle).replace("{url}", link.url),
      )}`
    : null;

  const joinedLabel =
    joinedCount === 0
      ? k("joined_none")
      : (joinedCount === 1 ? k("joined_one") : k("joined_other")).replace(
          "{count}",
          String(joinedCount),
        );

  return (
    <Panel
      title={k("title")}
      description={k("desc")}
      action={
        link.canManage && link.url ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${
              link.enabled
                ? "border-positive/30 bg-positive/10 text-positive"
                : "border-border bg-secondary text-ink-300"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${link.enabled ? "bg-positive" : "bg-ink-400"}`}
            />
            {link.enabled ? k("status_on") : k("status_off")}
          </span>
        ) : null
      }
    >
      <div className="p-5">
        {!link.canManage ? (
          <p className="text-sm text-ink-400">{k("viewer_hint")}</p>
        ) : !link.url ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ol className="grid gap-1.5 text-sm text-ink-300">
              {["step_1", "step_2", "step_3"].map((key, index) => (
                <li key={key} className="flex gap-2.5">
                  <span
                    data-numeric
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/30 text-[10px] text-gold"
                  >
                    {index + 1}
                  </span>
                  {k(key)}
                </li>
              ))}
            </ol>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <Button
                onClick={() => run("enable", () => setPublicLinkEnabled(eventId, true), "enabled")}
                disabled={!hasTemplate || busy !== null}
              >
                {busy === "enable" ? <Loader2 className="animate-spin" /> : <Link2 />}
                {k("enable")}
              </Button>
              {!hasTemplate && (
                <Link
                  href={`/dashboard/events/${eventId}/template`}
                  className="text-xs text-gold underline-offset-4 hover:underline"
                >
                  {k("needs_template")}
                </Link>
              )}
            </div>
          </div>
        ) : !link.enabled ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-300">{k("paused_desc")}</p>
            <Button
              onClick={() => run("enable", () => setPublicLinkEnabled(eventId, true), "enabled")}
              disabled={busy !== null}
              className="shrink-0"
            >
              {busy === "enable" ? <Loader2 className="animate-spin" /> : <Play />}
              {k("resume")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid min-w-0 content-start gap-3">
              <Input
                readOnly
                value={link.url}
                aria-label={k("title")}
                onFocus={(focusEvent) => focusEvent.target.select()}
                className="font-mono text-xs"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleCopy}>
                  {copied ? <Check className="animate-pop" /> : <Copy />}
                  {k("copy")}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle />
                    {k("whatsapp")}
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    {k("open")}
                  </a>
                </Button>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span id="public-seats-label" className="text-sm text-ink-300">
                  {k("seats_label")}
                </span>
                <Select
                  value={String(link.maxSeats)}
                  onValueChange={(value) =>
                    run("seats", () => updatePublicLinkSettings(eventId, { maxSeats: value }), "saved")
                  }
                  disabled={busy !== null}
                >
                  <SelectTrigger size="sm" className="w-20" aria-labelledby="public-seats-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEAT_OPTIONS.map((count) => (
                      <SelectItem key={count} value={String(count)}>
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-ink-400">{k("seats_hint")}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-border/60 pt-3">
                <p data-numeric className="mr-auto text-sm text-ink-300">
                  {joinedLabel}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-ink-400 hover:text-foreground"
                  onClick={() => run("pause", () => setPublicLinkEnabled(eventId, false), "paused")}
                  disabled={busy !== null}
                >
                  {busy === "pause" ? <Loader2 className="animate-spin" /> : <Pause />}
                  {k("pause")}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-ink-400 hover:text-foreground"
                      disabled={busy !== null}
                    >
                      {busy === "regenerate" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
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
                      <AlertDialogAction
                        onClick={() =>
                          run("regenerate", () => regeneratePublicLink(eventId), "regenerated")
                        }
                      >
                        {k("regenerate")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <figure className="flex flex-row items-center gap-4 sm:flex-col sm:items-center sm:gap-2">
              <span className="block h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-gold/25 bg-white p-1.5">
                {qrSvg && (
                  // eslint-disable-next-line @next/next/no-img-element -- SVG généré sur place (data URI), rien à optimiser
                  <img
                    src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
                    alt={k("qr_alt")}
                    width={112}
                    height={112}
                    className="h-full w-full"
                  />
                )}
              </span>
              <figcaption className="grid gap-1.5 sm:justify-items-center">
                <span className="text-xs text-ink-400 sm:text-center">{k("qr_hint")}</span>
                <Button size="sm" variant="outline" onClick={handleDownloadQr} disabled={busy === "qr"}>
                  {busy === "qr" ? <Loader2 className="animate-spin" /> : <Download />}
                  {k("qr_download")}
                </Button>
              </figcaption>
            </figure>
          </div>
        )}
      </div>
    </Panel>
  );
}
