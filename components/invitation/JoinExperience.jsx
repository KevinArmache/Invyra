"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarDays, Loader2, MapPin, Minus, Phone, Plus } from "lucide-react";

import { joinEvent } from "@/app/actions/public-link";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventDayLabel } from "@/lib/invitation/dates";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Délai avant de réécrire l'aperçu avec le nom saisi : chaque changement
 * recharge l'iframe, on attend donc que l'invité marque une pause.
 */
const PREVIEW_DELAY = 450;

/** Écran reproduit par l'aperçu (px) : celui d'un téléphone. */
const SCREEN = { width: 390, height: 693 };

/**
 * Écran de téléphone réduit : l'invitation est rendue à la taille d'un vrai
 * téléphone puis mise à l'échelle du cadre, pour garder la mise en page
 * mobile du modèle quelle que soit la largeur du cadre.
 *
 * L'aperçu montre l'écran d'ouverture (enveloppe, cachet…), qui porte le nom
 * de l'invité ({{GUEST_NAME}}). Il ne reçoit pas les touchers : l'invité ne
 * doit pas l'ouvrir ici, il l'ouvrira sur sa vraie invitation.
 */
function PhoneScreen({ children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / SCREEN.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-[1.25rem] sm:rounded-[1.6rem]"
      style={{ aspectRatio: `${SCREEN.width} / ${SCREEN.height}` }}
    >
      {scale > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0"
          style={{
            width: SCREEN.width,
            height: SCREEN.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Page du lien unique (app/join/[slug]/page.jsx) : l'invité saisit son nom,
 * qui s'écrit sur l'aperçu du vrai modèle pendant qu'il tape, puis son
 * téléphone. L'action joinEvent crée son invitation personnelle et l'y
 * envoie.
 *
 * Mise en page : sur mobile, l'aperçu puis le formulaire ; sur grand écran,
 * l'aperçu dans un cadre de téléphone à gauche, le formulaire à droite.
 *
 * @param {string} props.accent  couleur d'accent du modèle, pour le halo
 * @param {boolean} props.full   limite d'invités atteinte : pas de formulaire
 */
export default function JoinExperience({ slug, event, maxSeats = 1, accent, full = false }) {
  const { t, locale } = useTranslation();
  const j = (key) => t(`join.${key}`);
  const [state, formAction, pending] = useActionState(joinEvent, null);
  // Champs contrôlés : React vide les champs libres d'un formulaire après
  // son action, l'invité perdrait sa saisie à la moindre erreur.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [seats, setSeats] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setPreviewName(name.trim()), PREVIEW_DELAY);
    return () => clearTimeout(timer);
  }, [name]);

  const day = eventDayLabel(event.eventDate, locale);
  const when = [day, event.time].filter(Boolean).join(" · ");
  const error = state?.error ? j(`errors.${state.error}`) : null;
  const closed = full || state?.error === "full" || state?.error === "closed";
  const dial = String(event.contactPhone ?? "").replace(/[^\d+]/g, "");

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-background">
      {/* Fond : un halo de la couleur du modèle, qui dérive lentement. */}
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 -z-10">
        <div
          className="animate-drift absolute -top-56 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full opacity-70"
          style={{
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in oklch, ${accent || "var(--gold)"} 20%, transparent), transparent 70%)`,
          }}
        />
      </div>

      <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 lg:px-8">
        <section
          aria-label={j("preview_label")}
          className="animate-scale-in flex justify-center"
        >
          <div className="relative w-full max-w-[10.5rem] rounded-[1.6rem] border border-white/10 bg-ink-900 p-1.5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] sm:max-w-[13rem] sm:rounded-[2rem] lg:max-w-[19rem]">
            <PhoneScreen>
              <InvitationPreview
                template={event.invitationTemplate}
                event={event}
                guestName={previewName || j("preview_name")}
                title={t("invite.frame_title").replace("{title}", event.title)}
              />
            </PhoneScreen>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl min-w-0 lg:max-w-none">
          <p className="animate-rise eyebrow text-gold/80">{j("eyebrow")}</p>
          <h1
            className="animate-rise mt-3 text-3xl leading-tight text-balance wrap-break-word text-ink-50 sm:text-4xl"
            style={{ "--rise-delay": "80ms" }}
          >
            {event.title}
          </h1>
          <hr
            className="rule-gold-left animate-draw-x mt-5 w-20"
            style={{ "--rise-delay": "260ms" }}
          />
          {(when || event.location) && (
            <ul
              className="animate-rise mt-5 space-y-2 text-sm text-ink-300"
              style={{ "--rise-delay": "160ms" }}
            >
              {when && (
                <li className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" aria-hidden="true" />
                  {when}
                </li>
              )}
              {event.location && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" aria-hidden="true" />
                  <span className="min-w-0 wrap-break-word">{event.location}</span>
                </li>
              )}
            </ul>
          )}

          {closed ? (
            <div
              role="status"
              className="surface animate-rise mt-8 rounded-xl p-6"
              style={{ "--rise-delay": "220ms" }}
            >
              <h2 className="text-xl text-ink-50">
                {j(state?.error === "closed" ? "closed_title" : "full_title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">
                {j(state?.error === "closed" ? "closed_desc" : "full_desc")}
              </p>
              {dial && (
                <Button asChild variant="outline" className="mt-5">
                  <a href={`tel:${dial}`}>
                    <Phone />
                    {event.contactPhone}
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <>
              <p
                className="animate-rise mt-6 leading-relaxed text-pretty text-ink-300"
                style={{ "--rise-delay": "200ms" }}
              >
                {j("intro")}
              </p>

              <form
                action={formAction}
                noValidate
                className="surface animate-rise mt-6 grid gap-4 rounded-xl p-5 sm:p-6"
                style={{ "--rise-delay": "260ms" }}
              >
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="seats" value={seats} />
                {/* Piège à robots : invisible et hors du parcours clavier. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label>
                    Website
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="join-name">{j("name_label")}</Label>
                  <Input
                    id="join-name"
                    name="name"
                    value={name}
                    onChange={(changeEvent) => setName(changeEvent.target.value)}
                    autoComplete="name"
                    maxLength={120}
                    required
                    aria-invalid={state?.field === "name" || undefined}
                    aria-describedby="join-name-hint"
                    className="h-11"
                  />
                  <p id="join-name-hint" className="text-xs text-ink-400">
                    {j("name_hint")}
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="join-phone">{j("phone_label")}</Label>
                  <Input
                    id="join-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(changeEvent) => setPhone(changeEvent.target.value)}
                    placeholder="+243 81 234 5678"
                    maxLength={30}
                    required
                    aria-invalid={state?.field === "phone" || undefined}
                    className="h-11"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="join-email">
                    {j("email_label")}
                    <span className="font-normal text-ink-400">{j("optional")}</span>
                  </Label>
                  <Input
                    id="join-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(changeEvent) => setEmail(changeEvent.target.value)}
                    maxLength={200}
                    aria-invalid={state?.field === "email" || undefined}
                    aria-describedby="join-email-hint"
                    className="h-11"
                  />
                  <p id="join-email-hint" className="text-xs text-ink-400">
                    {j("email_hint")}
                  </p>
                </div>

                {maxSeats > 1 && (
                  <div className="flex items-center justify-between gap-4">
                    <span id="join-seats-label" className="text-sm font-medium">
                      {j("seats_label")}
                    </span>
                    <div
                      role="group"
                      aria-labelledby="join-seats-label"
                      className="flex items-center gap-3"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSeats((value) => Math.max(1, value - 1))}
                        disabled={seats <= 1}
                        aria-label={t("invite.rsvp_sheet.people_decrease")}
                      >
                        <Minus />
                      </Button>
                      <output
                        aria-live="polite"
                        data-numeric
                        className="w-8 text-center font-display text-2xl text-ink-50"
                      >
                        {seats}
                      </output>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSeats((value) => Math.min(maxSeats, value + 1))}
                        disabled={seats >= maxSeats}
                        aria-label={t("invite.rsvp_sheet.people_increase")}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                )}

                {error && (
                  <p role="alert" className="rounded-md border border-negative/30 bg-negative/10 px-3 py-2 text-sm text-negative">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" disabled={pending} className="mt-1 h-11 w-full">
                  {pending && <Loader2 className="animate-spin" />}
                  {pending ? j("submitting") : j("submit")}
                </Button>
                <p className="text-center text-xs leading-relaxed text-ink-400">
                  {j("privacy")}
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
