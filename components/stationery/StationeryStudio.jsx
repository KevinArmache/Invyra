"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  FileDown,
  MessageCircle,
  RotateCcw,
  ScanLine,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import PaperCard from "@/components/stationery/PaperCard";
import PaperFace from "@/components/stationery/PaperFace";
import FormatGuide from "@/components/stationery/FormatGuide";
import CardVotes from "@/components/templates/CardVotes";
import ShareTemplateButton from "@/components/templates/ShareTemplateButton";
import { mainPiece } from "@/lib/print/config";
import { availableFinishes, availablePapers } from "@/lib/print/options";
import { SAMPLE_GUEST } from "@/lib/print/sample";
import { whatsappLink } from "@/lib/site";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Ce que montre chaque face : carte fermée (couverture ou recto), retournée
 * (dos ou verso) ou ouverte (intérieur).
 */
function viewOf(format, face) {
  if (face === format.faces[0]) return { open: false, flipped: false };
  if (face === "back") return { open: false, flipped: true };
  return { open: true, flipped: false };
}

/**
 * Page d'un modèle papier : la maquette 3D à gauche (ouvrir, retourner,
 * changer de papier, version nominative), le modèle et sa commande à droite.
 *
 * @param {object} props.template  `{ id, name, category, config }`
 * @param {object} props.event     événement fictif (samplePrintEvent)
 * @param {string} [props.qr]      SVG du QR code d'exemple
 * @param {object} [props.votes]   votes du modèle : `{ likes, dislikes, myVote }`
 * @param {string} props.pageUrl   adresse publique de la page, citée dans la
 *   demande de commande
 */
export default function StationeryStudio({ template, event, qr, votes, isAuthenticated, categoryLabel, pageUrl }) {
  const { t } = useTranslation();
  const s = (key) => t(`stationery.${key}`);
  const { format } = mainPiece(template.config);
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [paper, setPaper] = useState(template.config.paper ?? "matte");
  const [named, setNamed] = useState(true);
  const papers = availablePapers();
  const finishes = availableFinishes(template.config.finishes);
  const guestName = named ? SAMPLE_GUEST : "";

  if (!format) return null;
  const orderHref = whatsappLink(
    s("order_message")
      .replace("{name}", template.name)
      .replace("{format}", t(`stationery.formats.${format.id}`))
      .replace("{url}", pageUrl),
  );
  const folded = Boolean(format.fold);

  function show(face) {
    const view = viewOf(format, face);
    setOpen(view.open);
    setFlipped(view.flipped);
  }

  return (
    <section className="relative isolate overflow-hidden px-4 pt-28 pb-16 sm:px-6 sm:pt-32 lg:px-8 lg:pb-24">
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-x-0 top-0 -z-10 h-[44rem]">
        <div
          className="animate-drift absolute -top-48 left-1/3 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in oklch, var(--gold) 12%, transparent), transparent 70%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl">
        <nav aria-label={t("templates_page.breadcrumb_label")} className="animate-rise">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
            <li>
              <Link href="/" className="transition-colors hover:text-gold">
                {t("templates_page.breadcrumb_home")}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3 w-3" />
            </li>
            <li>
              <Link href="/stationery" className="transition-colors hover:text-gold">
                {s("breadcrumb")}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3 w-3" />
            </li>
            <li aria-current="page" className="truncate text-ink-100">
              {template.name}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
          {/* ── Maquette ─────────────────────────────────────────────── */}
          <div className="animate-scale-in min-w-0">
            <div
              className="relative overflow-hidden rounded-2xl border border-border/60 px-[8%] py-[9%]"
              style={{
                background:
                  "radial-gradient(90% 80% at 50% 25%, color-mix(in oklch, var(--gold) 9%, var(--ink-850)), var(--ink-900) 78%)",
              }}
            >
              <div className="grain pointer-events-none absolute inset-0" aria-hidden="true" />
              <div className={`relative mx-auto ${format.mockup === "tent" ? "max-w-[30rem]" : format.mockup === "book" ? "max-w-[44rem]" : "max-w-[24rem]"}`}>
                <PaperCard
                  config={template.config}
                  event={event}
                  guestName={guestName}
                  qr={qr}
                  paper={paper}
                  open={open}
                  flipped={flipped}
                  interactive
                  lazy={false}
                  label={s("mockup_label").replace("{name}", template.name)}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {folded && (
                <Button
                  variant={open ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFlipped(false);
                    setOpen((value) => !value);
                  }}
                  aria-pressed={open}
                >
                  <BookOpen />
                  {open ? s("close_card") : s("open_card")}
                </Button>
              )}
              <Button
                variant={flipped ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setFlipped((value) => !value);
                }}
                aria-pressed={flipped}
              >
                <RotateCcw />
                {s("flip_card")}
              </Button>
              <Button
                variant={named ? "default" : "outline"}
                size="sm"
                onClick={() => setNamed((value) => !value)}
                aria-pressed={named}
                title={s("named_hint")}
              >
                <UserRound />
                {s("named_toggle")}
              </Button>
            </div>

            <ul className="mt-6 grid grid-cols-4 gap-3 sm:gap-4" aria-label={s("faces_label")}>
              {format.faces.map((face) => (
                <li key={face}>
                  <button
                    type="button"
                    onClick={() => show(face)}
                    className="group block w-full text-left focus-visible:outline-none"
                  >
                    <span className="block overflow-hidden rounded-[3px] shadow-[0_8px_20px_-10px_rgb(0_0_0/0.8)] ring-1 ring-white/10 transition-transform duration-500 group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-gold">
                      <PaperFace
                        config={template.config}
                        face={face}
                        event={event}
                        guestName={guestName}
                        qr={qr}
                        animated={false}
                      />
                    </span>
                    <span className="mt-2 block truncate text-center text-[11px] text-ink-400 group-hover:text-ink-100">
                      {s(`faces.${face}`)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Modèle et commande ───────────────────────────────────── */}
          <aside className="min-w-0 lg:sticky lg:top-24">
            <p className="animate-rise eyebrow text-gold/80">
              {[s("eyebrow_single"), categoryLabel].filter(Boolean).join(" · ")}
            </p>
            <h1
              className="animate-rise mt-3 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
              style={{ "--rise-delay": "80ms" }}
            >
              {template.name}
            </h1>
            <hr className="rule-gold-left animate-draw-x mt-5 w-20" style={{ "--rise-delay": "260ms" }} />
            <p
              className="animate-rise mt-5 leading-relaxed text-pretty text-ink-300"
              style={{ "--rise-delay": "160ms" }}
            >
              {s(`family_desc.${format.family}`)}
            </p>

            <div className="animate-rise mt-7 space-y-6" style={{ "--rise-delay": "220ms" }}>
              <FormatGuide format={format} />

              <fieldset>
                <legend className="eyebrow">{s("paper_label")}</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {papers.map((option) => {
                    const active = option.id === paper;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPaper(option.id)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors duration-300 ${
                          active
                            ? "border-gold bg-gold/10 text-ink-50"
                            : "border-border text-ink-400 hover:border-gold/30 hover:text-ink-100"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20"
                          style={{ background: option.tint }}
                        />
                        {s(`papers.${option.id}.name`)}
                        <span data-numeric className="text-ink-400">{option.weight} g</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-ink-400">{s(`papers.${paper}.desc`)}</p>
              </fieldset>

              {finishes.length > 0 && (
                <div>
                  <p className="eyebrow">{s("finishes_label")}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {finishes.map((finish) => (
                      <li
                        key={finish.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/5 px-3 py-1 text-xs text-gold"
                      >
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        {s(`finishes.${finish.id}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="flex gap-3 rounded-xl border border-border/60 bg-ink-850/60 p-4 text-sm leading-relaxed text-ink-300">
                <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                {s("duo_note")}
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild size="lg" className="h-11 sm:col-span-2">
                  <a href={orderHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle />
                    {s("order_cta")}
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11">
                  <a href={`/stationery/${template.id}/proof`} download>
                    <FileDown />
                    {s("proof_cta")}
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11">
                  <Link href={isAuthenticated ? "/dashboard/events/new" : "/register"}>
                    {s("create_cta")}
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-ink-400">{s("order_note")}</p>

              <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-5">
                {votes ? (
                  <CardVotes templateId={template.id} initial={votes} isAuthenticated={isAuthenticated} />
                ) : (
                  <span />
                )}
                <ShareTemplateButton
                  template={{ id: template.id, name: template.name }}
                  path={`/stationery/${template.id}`}
                  variant="button"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
