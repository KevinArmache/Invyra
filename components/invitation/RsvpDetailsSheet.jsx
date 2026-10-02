"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Images, Loader2, Minus, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";

import { saveRsvpDetails } from "@/app/actions/invitation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Panneau de réponse : il s'ouvre par-dessus l'invitation quand l'invité
 * vient de répondre depuis le modèle.
 *
 * - « confirmé » : nombre de personnes (si plusieurs places lui sont
 *   réservées), régime et mot pour les hôtes, puis son billet ;
 * - « décliné » ou « peut-être » : un mot pour les hôtes, facultatif.
 *
 * Il vit hors de l'iframe du modèle : il fonctionne avec tous les modèles,
 * sans toucher à leur code. Feuille en bas d'écran sur mobile, carte centrée
 * à partir de la tablette. Le statut est déjà enregistré quand il s'ouvre :
 * « Plus tard » ne fait rien perdre.
 *
 * @param {"confirmed"|"declined"|"maybe"} props.status
 * @param {object} props.guest     invité tel que renvoyé par les actions
 *   (seats, attending_count, dietary_restrictions, notes)
 * @param {string} props.accent    couleur d'accent du modèle (#rrggbb)
 * @param {(guest: object) => void} props.onSaved
 */
export default function RsvpDetailsSheet({
  open,
  onOpenChange,
  status,
  token,
  guest,
  accent,
  showMemories = false,
  onSaved,
}) {
  const { t } = useTranslation();
  const s = (key) => t(`invite.rsvp_sheet.${key}`);
  const confirmed = status === "confirmed";
  const seats = Math.max(1, guest.seats ?? 1);

  const [count, setCount] = useState(
    Math.min(seats, guest.attending_count ?? seats),
  );
  const [dietary, setDietary] = useState(guest.dietary_restrictions ?? "");
  const [notes, setNotes] = useState(guest.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [ticket, setTicket] = useState(null);

  const buttonStyle = accent
    ? { backgroundColor: accent, color: textOn(accent) }
    : undefined;

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveRsvpDetails(
        token,
        confirmed
          ? { attendingCount: count, dietaryRestrictions: dietary, notes }
          : { notes },
      );
      onSaved?.(result.guest);
      if (confirmed && result.ticket) {
        setTicket(result.ticket);
      } else {
        if (notes.trim()) toast.success(s("note_sent"));
        onOpenChange(false);
      }
    } catch {
      toast.error(s("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Pas de focus d'office sur le premier bouton (ni de clavier qui
        // s'ouvre sur mobile) : le focus va au panneau lui-même.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          event.currentTarget.focus();
        }}
        className="top-auto bottom-0 left-0 max-h-[92dvh] max-w-full translate-x-0 translate-y-0 gap-5 overflow-y-auto rounded-t-3xl rounded-b-none border-x-0 border-b-0 bg-ink-850 px-5 pt-7 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border sm:p-7"
      >
        {/* Poignée de la feuille, sur mobile. */}
        <span
          aria-hidden="true"
          className="absolute top-2.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-ink-600 sm:hidden"
        />

        {ticket ? (
          <TicketStep
            ticket={ticket}
            token={token}
            buttonStyle={buttonStyle}
            showMemories={showMemories}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5">
            <DialogHeader className="text-left">
              {confirmed && (
                <p className="eyebrow text-gold">{s("confirmed_eyebrow")}</p>
              )}
              <DialogTitle className="font-display text-2xl leading-tight font-normal text-ink-50">
                {confirmed
                  ? s("confirmed_title").replace("{name}", guest.name?.trim() ?? "")
                  : s(`${status}_title`)}
              </DialogTitle>
              <DialogDescription className="leading-relaxed text-ink-300">
                {s(confirmed ? "confirmed_desc" : `${status}_desc`)}
              </DialogDescription>
            </DialogHeader>

            {confirmed && seats > 1 && (
              <div
                role="group"
                aria-labelledby="rsvp-people-label"
                className="rounded-xl border border-border/70 bg-ink-800/40 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p id="rsvp-people-label" className="text-sm text-ink-50">
                      {s("people_label")}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {s("people_hint").replace("{count}", String(seats))}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setCount((value) => Math.max(1, value - 1))}
                      disabled={count <= 1}
                      aria-label={s("people_decrease")}
                    >
                      <Minus />
                    </Button>
                    <output
                      aria-live="polite"
                      data-numeric
                      className="w-8 text-center font-display text-2xl text-ink-50"
                    >
                      {count}
                      <span className="sr-only">
                        {" "}
                        {s(count > 1 ? "person_other" : "person_one")}
                      </span>
                    </output>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setCount((value) => Math.min(seats, value + 1))}
                      disabled={count >= seats}
                      aria-label={s("people_increase")}
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {confirmed && (
              <div className="grid gap-2">
                <Label htmlFor="rsvp-dietary" className="text-ink-100">
                  {s("dietary_label")}
                </Label>
                <Input
                  id="rsvp-dietary"
                  value={dietary}
                  onChange={(event) => setDietary(event.target.value)}
                  placeholder={s("dietary_placeholder")}
                  maxLength={200}
                  autoComplete="off"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="rsvp-notes" className="text-ink-100">
                {s("notes_label")}
              </Label>
              <Textarea
                id="rsvp-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={s("notes_placeholder")}
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                {s("later")}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                style={buttonStyle}
                className="h-11 sm:h-9"
              >
                {saving && <Loader2 className="animate-spin" />}
                {saving ? s("saving") : s(confirmed ? "submit" : "send")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Dernière étape après une confirmation : l'aperçu du billet. */
function TicketStep({ ticket, token, buttonStyle, showMemories, onClose }) {
  const { t } = useTranslation();
  const s = (key) => t(`invite.rsvp_sheet.${key}`);
  const pass =
    ticket.people > 1
      ? t("invite.ticket.pass_other").replace("{count}", String(ticket.people))
      : t("invite.ticket.pass_one");

  return (
    <div className="flex flex-col items-center text-center">
      <span className="animate-pop flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
        <CheckCircle2 className="h-6 w-6 text-gold" strokeWidth={1.75} />
      </span>
      <DialogTitle className="mt-4 font-display text-2xl font-normal text-ink-50">
        {s("ticket_title")}
      </DialogTitle>
      <DialogDescription className="mt-2 max-w-xs leading-relaxed text-ink-300">
        {s("ticket_desc")}
      </DialogDescription>

      {/* SVG produit par lib/qr.js à partir d'un code [0-9A-Z]. */}
      <div
        role="img"
        aria-label={t("invite.ticket.qr_alt")}
        className="animate-scale-in mt-5 w-44 rounded-2xl bg-white p-3 shadow-elevation-3 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: ticket.svg }}
      />
      <p className="mt-3 font-mono text-sm tracking-[0.2em] text-ink-100">
        {ticket.code}
      </p>
      <p className="mt-1 text-xs text-gold">{pass}</p>

      <div className="mt-6 grid w-full gap-2">
        <Button asChild style={buttonStyle} className="h-11">
          <Link href={`/invite/${token}/ticket`}>
            <Ticket />
            {s("view_ticket")}
          </Link>
        </Button>
        {showMemories && (
          <Button asChild variant="outline" className="h-11">
            <Link href={`/invite/${token}/memories`}>
              <Images />
              {s("memories")}
            </Link>
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          {s("back")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Couleur de texte lisible sur l'accent du modèle : sombre sur une couleur
 * claire, ivoire sur une couleur foncée (seuil de luminance relative WCAG où
 * les deux contrastes s'équilibrent).
 */
function textOn(hex) {
  const channel = (index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.179 ? "#100d0b" : "#f9f6f0";
}
