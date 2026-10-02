import { cache } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  Images,
  MapPin,
  Phone,
  Ticket,
} from "lucide-react";

import { getTicketByToken } from "@/app/actions/invitation";
import BrandMark from "@/components/common/BrandMark";
import InvalidLink from "@/components/invitation/InvalidLink";
import InvitationUnavailable from "@/components/invitation/InvitationUnavailable";
import { Button } from "@/components/ui/button";
import { mapsLink } from "@/lib/email/invitation-email";
import { eventDayLabel } from "@/lib/invitation/dates";
import { getTranslations } from "@/lib/i18n/server";
import { ticketQrSvg } from "@/lib/qr";
import { templateLook } from "@/lib/templates/look";
import { toEditableConfig } from "@/lib/templates/validation";
import { formatTicketCode } from "@/lib/tickets";

/**
 * Billet d'entrée d'un invité : QR code à montrer à l'accueil, code lisible
 * pour une saisie à la main, et les informations pratiques.
 *
 * Accessible avec le jeton de l'invitation, comme l'invitation elle-même. Ne
 * compte pas comme une ouverture de l'invitation.
 */

/** Une lecture par requête, partagée entre métadonnées et page. */
const loadTicket = cache(async (token) => {
  try {
    return { ticket: await getTicketByToken(token) };
  } catch (error) {
    console.error("[ticket] Chargement impossible :", error.message);
    return { ticket: null, failed: true };
  }
});

export async function generateMetadata({ params }) {
  const { token } = await params;
  const [{ ticket }, { t }] = await Promise.all([
    loadTicket(token),
    getTranslations(),
  ]);

  // Un billet est nominatif : il ne doit jamais être indexé.
  const robots = { index: false, follow: false };
  if (!ticket) return { title: t("invite.ticket.meta_title"), robots };

  const title = `${t("invite.ticket.meta_title")} · ${ticket.event.title}`;
  const description = t("invite.ticket.meta_description").replace(
    "{name}",
    ticket.guest.name,
  );
  const { image } = templateLook(toEditableConfig(ticket.event.invitationTemplate));

  return {
    title: { absolute: title },
    description,
    robots,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image && { images: [{ url: image, alt: ticket.event.title }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function TicketPage({ params }) {
  const { token } = await params;
  const { ticket, failed } = await loadTicket(token);
  if (failed) return <InvitationUnavailable />;

  const { t, locale } = await getTranslations();
  const k = (key) => t(`invite.ticket.${key}`);

  if (!ticket) {
    return (
      <InvalidLink
        title={t("invite.invalid_title")}
        description={t("invite.invalid_desc")}
        icon={Ticket}
      />
    );
  }

  const { guest, event } = ticket;
  const showMemories = event.guestbookEnabled || event.photosEnabled;

  if (!guest.confirmed) {
    return (
      <TicketShell>
        <section className="animate-rise mt-8 w-full rounded-3xl border border-border/70 bg-ink-850 px-6 py-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
            <Ticket className="h-6 w-6 text-gold/80" strokeWidth={1.5} />
          </span>
          <h1 className="mt-5 font-display text-2xl text-ink-50">{k("pending_title")}</h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink-300">
            {k("pending_desc")}
          </p>
          <Button asChild className="mt-7 h-11">
            <Link href={`/invite/${token}`}>{k("open_invitation")}</Link>
          </Button>
        </section>
      </TicketShell>
    );
  }

  const svg = await ticketQrSvg(guest.ticketCode);
  const day = eventDayLabel(event.eventDate, locale);
  const when = [day, event.time].filter(Boolean).join(" · ");
  const pass =
    guest.people > 1
      ? k("pass_other").replace("{count}", String(guest.people))
      : k("pass_one");
  const dial = String(event.contactPhone ?? "").replace(/[^\d+]/g, "");

  return (
    <TicketShell>
      <article
        aria-labelledby="ticket-title"
        className="animate-rise relative mt-8 w-full overflow-hidden rounded-3xl border border-gold/25 bg-ink-850 shadow-elevation-3"
      >
        <div
          aria-hidden="true"
          className="h-1 bg-linear-to-r from-gold-deep via-gold-bright to-gold-deep"
        />

        <header className="px-6 pt-7 pb-5 text-center">
          <p className="eyebrow text-gold">{k("eyebrow")}</p>
          <h1
            id="ticket-title"
            className="mt-3 font-display text-3xl leading-tight wrap-break-word text-ink-50"
          >
            {event.title}
          </h1>
          <p className="mt-2 font-display text-lg text-ink-300 italic">
            {k("for").replace("{name}", guest.name)}
          </p>
          <p className="mt-4 inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
            {pass}
          </p>
        </header>

        {/* Perforation du billet. */}
        <div aria-hidden="true" className="relative h-6">
          <span className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full border border-gold/25 bg-ink-900" />
          <span className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full border border-gold/25 bg-ink-900" />
          <span className="absolute inset-x-6 top-1/2 border-t border-dashed border-gold/25" />
        </div>

        <div className="px-6 pt-4 pb-7 text-center">
          {/* SVG produit par lib/qr.js à partir d'un code [0-9A-Z]. */}
          <div
            role="img"
            aria-label={k("qr_alt")}
            className="animate-scale-in mx-auto w-full max-w-60 rounded-2xl bg-white p-3 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
            style={{ "--rise-delay": "150ms" }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="mt-4 text-[0.68rem] tracking-[0.2em] text-ink-400 uppercase">
            {k("code_label")}
          </p>
          <p className="mt-1 font-mono text-base tracking-[0.25em] text-ink-50">
            {formatTicketCode(guest.ticketCode)}
          </p>
          {guest.checkedInAt && (
            <p className="mt-4 inline-flex max-w-full items-center gap-1.5 rounded-full border border-positive/30 bg-positive/10 px-3 py-1 text-xs text-positive">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {k("checked_in").replace(
                "{date}",
                new Date(guest.checkedInAt).toLocaleString(
                  locale === "en" ? "en-US" : "fr-FR",
                  { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
                ),
              )}
            </p>
          )}
        </div>

        {(when || event.location || event.contactPhone) && (
          <dl className="grid gap-4 border-t border-border/60 px-6 py-6 text-sm">
            {when && (
              <Detail icon={CalendarDays} label={k("when")}>
                {when}
              </Detail>
            )}
            {event.location && (
              <Detail icon={MapPin} label={k("where")}>
                <span className="block">{event.location}</span>
                <a
                  href={mapsLink(event.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-gold underline-offset-4 hover:underline"
                >
                  {k("directions")}
                </a>
              </Detail>
            )}
            {event.contactPhone && (
              <Detail icon={Phone} label={k("contact")}>
                {dial ? (
                  <a href={`tel:${dial}`} className="hover:text-gold" data-numeric>
                    {event.contactPhone}
                  </a>
                ) : (
                  event.contactPhone
                )}
              </Detail>
            )}
          </dl>
        )}
      </article>

      <p
        className="animate-rise mt-5 max-w-xs text-center text-xs leading-relaxed text-ink-400"
        style={{ "--rise-delay": "200ms" }}
      >
        {k("show_at_entrance")}
      </p>

      <div
        className="animate-rise mt-6 grid w-full gap-2"
        style={{ "--rise-delay": "260ms" }}
      >
        <Button asChild className="h-11">
          <a href={`/invite/${token}/ticket/pdf`} download>
            <Download />
            {k("download_pdf")}
          </a>
        </Button>
        {showMemories && (
          <Button asChild variant="outline" className="h-11">
            <Link href={`/invite/${token}/memories`}>
              <Images />
              {k("memories")}
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" className="h-11">
          <Link href={`/invite/${token}`}>
            <ArrowLeft />
            {k("back_to_invitation")}
          </Link>
        </Button>
      </div>
    </TicketShell>
  );
}

/** Fond de la page : halo doré en haut, colonne étroite centrée. */
function TicketShell({ children }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink-900 px-4 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_14%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center">
        <BrandMark href="/" size="sm" priority />
        {children}
      </div>
    </main>
  );
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[0.68rem] tracking-[0.18em] text-ink-400 uppercase">{label}</dt>
        <dd className="mt-0.5 wrap-break-word text-ink-100">{children}</dd>
      </div>
    </div>
  );
}
