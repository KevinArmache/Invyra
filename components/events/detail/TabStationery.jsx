"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, FileDown, Loader2, MessageCircle, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/shell/primitives";
import PaperCard from "@/components/stationery/PaperCard";
import PaperFace from "@/components/stationery/PaperFace";
import { downloadFile } from "@/lib/download";
import { invitationPhotos, mainPiece, withPhotos } from "@/lib/print/config";
import { formatDimensions } from "@/lib/print/formats";
import { getFinish } from "@/lib/print/options";
import { linkQrSvg } from "@/lib/qr-svg";
import { whatsappLink } from "@/lib/site";
import { useTranslation } from "@/lib/i18n/Context";

/** Cartes nominatives par fichier HD (voir la route events/[id]/stationery). */
const PART_SIZE = 100;

/**
 * Onglet « Papeterie » d'un événement : choisir une invitation papier, la
 * voir remplie avec les informations et les photos de l'événement, puis
 * télécharger le bon à tirer et demander l'impression. Les admins y
 * trouvent aussi les fichiers HD de l'imprimeur.
 *
 * @param {Array}  props.catalog       modèles papier (config normalisée)
 * @param {object} props.event         informations de l'événement
 * @param {object} [props.invitation]  invitation en ligne (ses photos sont reprises)
 * @param {object} props.publicLink    lien unique (getPublicLink)
 * @param {number} props.guestCount
 */
export default function TabStationery({ eventId, event, invitation, catalog, publicLink, guestCount, isAdmin }) {
  const { t } = useTranslation();
  const k = (key) => t(`portal.events.details.stationery.${key}`);
  const s = (key) => t(`stationery.${key}`);
  const [selectedId, setSelectedId] = useState(catalog[0]?.id ?? null);
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [named, setNamed] = useState(false);
  const [qr, setQr] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const publicUrl = publicLink?.enabled ? publicLink.url : null;
  useEffect(() => {
    if (!publicUrl) return;
    let cancelled = false;
    linkQrSvg(publicUrl).then((svg) => !cancelled && setQr(svg));
    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  // Les photos de l'invitation en ligne prennent les cadres de chaque modèle.
  const photos = useMemo(() => invitationPhotos(invitation), [invitation]);
  const personalized = useMemo(
    () => catalog.map((template) => ({ ...template, config: withPhotos(template.config, photos) })),
    [catalog, photos],
  );
  const selected = personalized.find((template) => template.id === selectedId) ?? null;
  const config = selected?.config ?? null;
  const { format } = mainPiece(config);

  if (catalog.length === 0) {
    return (
      <Panel title={k("title")} description={k("subtitle")}>
        <EmptyState icon={Printer} title={k("empty_title")} description={k("empty_desc")} />
      </Panel>
    );
  }

  const base = `/dashboard/events/${eventId}/stationery?template=${encodeURIComponent(selectedId ?? "")}${named ? "&named=1" : ""}`;
  const parts = named ? Math.max(1, Math.ceil(guestCount / PART_SIZE)) : 1;
  const layers = [...new Set((config?.finishes ?? []).map((id) => getFinish(id)?.layer).filter(Boolean))];

  async function download(key, query) {
    setDownloading(key);
    try {
      await downloadFile(`${base}&${query}`, `${key}.pdf`);
    } catch {
      toast.error(t("invite.pdf_error"));
    } finally {
      setDownloading(null);
    }
  }

  const orderHref = selected
    ? whatsappLink(
        k("order_message")
          .replace("{event}", event.title)
          .replace("{name}", selected.name)
          .replace("{format}", format ? s(`formats.${format.id}`) : "")
          .replace("{mode}", named ? k("named_option").replace("{count}", String(guestCount)) : k("generic_option")),
      )
    : null;

  const fileButton = (key, label, query, primary = false) => (
    <Button
      key={key}
      size="sm"
      variant={primary ? "default" : "outline"}
      onClick={() => download(key, query)}
      disabled={downloading !== null}
    >
      {downloading === key ? <Loader2 className="animate-spin" /> : <FileDown />}
      {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <Panel title={k("title")} description={k("subtitle")}>
        <ul className="flex gap-4 overflow-x-auto p-5" aria-label={k("choose")}>
          {personalized.map((template) => {
            const { format: itemFormat } = mainPiece(template.config);
            const active = template.id === selectedId;
            return (
              <li key={template.id} className="w-28 shrink-0 sm:w-32">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(template.id);
                    setOpen(false);
                    setFlipped(false);
                  }}
                  aria-pressed={active}
                  className="group block w-full text-left focus-visible:outline-none"
                >
                  <span
                    className={`block overflow-hidden rounded-[3px] shadow-[0_10px_24px_-12px_rgb(0_0_0/0.8)] ring-2 transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 ${
                      active ? "ring-gold" : "ring-transparent group-focus-visible:ring-gold/60"
                    }`}
                  >
                    {itemFormat && (
                      <PaperFace
                        config={template.config}
                        face={itemFormat.faces[0]}
                        event={event}
                        animated={false}
                        title={template.name}
                      />
                    )}
                  </span>
                  <span className={`mt-2 block truncate text-xs ${active ? "text-ink-50" : "text-ink-400"}`}>
                    {template.name}
                  </span>
                  {itemFormat && (
                    <span className="block truncate text-[11px] text-ink-400">{s(`formats.${itemFormat.id}`)}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      {selected && format && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Panel delay={80} className="lg:self-start">
            <div
              className="rounded-t-xl px-[8%] py-[8%]"
              style={{
                background:
                  "radial-gradient(90% 80% at 50% 25%, color-mix(in oklch, var(--gold) 8%, var(--ink-850)), var(--ink-900) 78%)",
              }}
            >
              <div className={`mx-auto ${format.mockup === "book" ? "max-w-[40rem]" : format.mockup === "tent" ? "max-w-[26rem]" : "max-w-[20rem]"}`}>
                <PaperCard
                  config={config}
                  event={event}
                  guestName={named ? t("landing.hero.scene.guest") : ""}
                  qr={qr}
                  paper={config.paper}
                  open={open}
                  flipped={flipped}
                  interactive
                  lazy={false}
                  label={s("mockup_label").replace("{name}", selected.name)}
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 p-4">
              {format.fold && (
                <Button size="sm" variant={open ? "default" : "outline"} onClick={() => { setFlipped(false); setOpen((value) => !value); }} aria-pressed={open}>
                  <BookOpen />
                  {open ? s("close_card") : s("open_card")}
                </Button>
              )}
              <Button size="sm" variant={flipped ? "default" : "outline"} onClick={() => { setOpen(false); setFlipped((value) => !value); }} aria-pressed={flipped}>
                <RotateCcw />
                {s("flip_card")}
              </Button>
            </div>
          </Panel>

          <Panel delay={140} title={selected.name} description={`${s(`formats.${format.id}`)} · ${formatDimensions(format.trim)}`}>
            <div className="space-y-5 p-5">
              <p className="text-sm leading-relaxed text-ink-300">
                {photos.length > 0 ? k("photos_from_invitation") : k("photos_sample")}
              </p>

              <fieldset>
                <legend className="eyebrow">{k("mode_label")}</legend>
                <div className="mt-3 grid gap-2">
                  {[
                    { value: false, label: k("generic_option"), hint: publicUrl ? k("generic_hint") : k("generic_hint_no_link") },
                    {
                      value: true,
                      label: k("named_option").replace("{count}", String(guestCount)),
                      hint: k("named_hint"),
                      disabled: guestCount === 0,
                    },
                  ].map((option) => (
                    <label
                      key={String(option.value)}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                        named === option.value ? "border-gold bg-gold/5" : "border-border hover:border-gold/30"
                      } ${option.disabled ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <input
                        type="radio"
                        name="stationery-mode"
                        className="mt-1 accent-[var(--gold)]"
                        checked={named === option.value}
                        onChange={() => setNamed(option.value)}
                        disabled={option.disabled}
                      />
                      <span>
                        <span className="block text-sm text-ink-50">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-ink-400">{option.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {!named && !publicUrl && (
                  <p className="mt-2 text-xs text-ink-400">{k("enable_link_tip")}</p>
                )}
              </fieldset>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild size="lg" className="h-11 sm:col-span-2">
                  <a href={orderHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle />
                    {s("order_cta")}
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 sm:col-span-2"
                  onClick={() => download("proof", "mode=proof")}
                  disabled={downloading !== null}
                >
                  {downloading === "proof" ? <Loader2 className="animate-spin" /> : <FileDown />}
                  {s("proof_cta")}
                </Button>
              </div>
              <p className="text-xs text-ink-400">{s("order_note")}</p>

              {isAdmin && (
                <div className="border-t border-border/60 pt-4">
                  <p className="eyebrow">{s("files_title")}</p>
                  <p className="mt-1 text-xs text-ink-400">{s("files_desc")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from({ length: parts }, (_, index) => {
                      const part = index + 1;
                      const suffix = parts > 1 ? ` · ${part}/${parts}` : "";
                      return [
                        fileButton(`single-${part}`, `${s("files.print_single")}${suffix}`, `mode=print&layout=single&part=${part}`, true),
                        fileButton(`a3-${part}`, `${s("files.print_a3")}${suffix}`, `mode=print&layout=a3&part=${part}`),
                        fileButton(`sra3-${part}`, `${s("files.print_sra3")}${suffix}`, `mode=print&layout=sra3&part=${part}`),
                        fileButton(`a4-${part}`, `${s("files.print_a4")}${suffix}`, `mode=print&layout=a4&part=${part}`),
                      ];
                    })}
                    {layers.map((layer) =>
                      fileButton(`layer-${layer}`, s(`files.layer_${layer}`), `mode=print&layout=single&layer=${layer}`),
                    )}
                  </div>
                </div>
              )}

              <Link href={`/stationery/${selected.id}`} target="_blank" className="inline-block text-xs text-gold underline-offset-4 hover:underline">
                {k("see_template")}
              </Link>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
