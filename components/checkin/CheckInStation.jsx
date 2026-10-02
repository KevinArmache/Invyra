"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CameraOff,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Minus,
  Plus,
  ScanLine,
  Search,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  checkInGuest,
  getCheckInState,
  scanTicket,
  searchCheckInGuests,
  setCheckInCount,
  undoCheckIn,
} from "@/app/actions/checkin";
import BrandMark from "@/components/common/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clockLabel, eventDayLabel } from "@/lib/invitation/dates";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Écran de l'équipe d'accueil, pensé pour un téléphone tenu à la porte.
 *
 * - « Scanner » : la caméra lit le QR code du billet (qr-scanner, chargé à
 *   la demande) ; un code se tape aussi à la main.
 * - « Rechercher » : par nom, pour l'invité sans téléphone ou au billet
 *   illisible.
 *
 * Chaque résultat occupe tout l'écran, avec un son et une vibration : vert,
 * l'invité entre ; orange, déjà entré ou présence non confirmée (l'agent
 * décide) ; rouge, billet inconnu. Un résultat vert passe tout seul au
 * suivant, sauf si l'agent y touche.
 *
 * Plusieurs agents scannent en même temps : les compteurs se rafraîchissent
 * toutes les 20 s et après chaque entrée.
 */

const REFRESH_MS = 20_000;
/** Un même code relu par la caméra juste après son résultat est ignoré. */
const SAME_CODE_COOLDOWN = 4000;
const AUTO_NEXT_MS = 3500;
const SEARCH_DEBOUNCE = 250;
const MAX_COUNT = 20;

export default function CheckInStation({ token, initialState }) {
  const { t, locale } = useTranslation();
  const c = useCallback((key) => t(`checkin.${key}`), [t]);
  const [state, setState] = useState(initialState);
  const [tab, setTab] = useState("scan");
  const [result, setResult] = useState(null);
  const [acting, setActing] = useState(false);
  // Change à chaque résultat refermé : la recherche se relance, à jour.
  const [version, setVersion] = useState(0);
  const busy = useRef(false);
  const lastCode = useRef({ value: "", at: 0 });
  const { unlock, play } = useFeedback();

  const refresh = useCallback(async () => {
    try {
      const next = await getCheckInState(token);
      if (next) setState(next);
    } catch {
      // On garde les compteurs affichés : le prochain tour réessaiera.
    }
  }, [token]);

  useEffect(() => {
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const showResult = useCallback(
    (outcome) => {
      busy.current = true;
      setResult(outcome);
      play(outcome.status === "ok" ? "ok" : outcome.status === "unknown" ? "error" : "warn");
      refresh();
    },
    [play, refresh],
  );

  const handleCode = useCallback(
    async (raw, { manual = false } = {}) => {
      const value = String(raw ?? "").trim();
      if (!value || busy.current) return;
      const now = Date.now();
      const repeated =
        value === lastCode.current.value &&
        now - lastCode.current.at < SAME_CODE_COOLDOWN;
      if (repeated && !manual) return;

      busy.current = true;
      lastCode.current = { value, at: now };
      try {
        showResult(await scanTicket(token, value));
      } catch {
        busy.current = false;
        toast.error(c("error"));
      }
    },
    [token, showResult, c],
  );

  const dismiss = useCallback(() => {
    setResult(null);
    setVersion((value) => value + 1);
    lastCode.current.at = Date.now();
    busy.current = false;
  }, []);

  async function act(action) {
    setActing(true);
    try {
      await action();
    } catch {
      toast.error(c("error"));
    } finally {
      setActing(false);
    }
  }

  /** Invité choisi dans la recherche. */
  async function selectGuest(guest) {
    if (busy.current) return;
    if (guest.checkedInAt) return showResult({ status: "already", guest });
    if (guest.rsvpStatus !== "confirmed") {
      return showResult({ status: "not_confirmed", guest });
    }
    busy.current = true;
    setActing(true);
    try {
      showResult(await checkInGuest(token, guest.id));
    } catch {
      busy.current = false;
      toast.error(c("error"));
    } finally {
      setActing(false);
    }
  }

  const { event, summary, recent } = state;
  const share = summary.expectedPeople
    ? Math.min(1, summary.arrivedPeople / summary.expectedPeople)
    : 0;
  const when = [eventDayLabel(event.eventDate, locale), event.time]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="min-h-dvh bg-ink-900 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-ink-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <BrandMark showName={false} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-[0.62rem] text-gold/80">{c("eyebrow")}</p>
            <h1 className="truncate font-display text-lg leading-tight text-ink-50">
              {event.title}
            </h1>
          </div>
          <p className="shrink-0 text-right" aria-live="polite">
            <span data-numeric className="font-display text-2xl text-gold">
              {summary.arrivedPeople}
            </span>
            <span data-numeric className="text-sm text-ink-400">
              {" "}/ {summary.expectedPeople}
            </span>
            <span className="sr-only"> {c("people_label")}</span>
          </p>
        </div>
        <div className="h-0.5 bg-gold/10" aria-hidden="true">
          <div
            className="h-full bg-gold transition-[width] duration-700 ease-out"
            style={{ width: `${Math.round(share * 100)}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pt-5">
        <section className="animate-rise flex items-end justify-between gap-4 rounded-2xl border border-border/60 bg-ink-850 px-5 py-4">
          <div className="min-w-0">
            <p className="font-display text-3xl text-ink-50" data-numeric>
              {c("people_counter")
                .replace("{arrived}", String(summary.arrivedPeople))
                .replace("{expected}", String(summary.expectedPeople))}
            </p>
            <p className="mt-0.5 text-xs text-ink-400">{c("people_label")}</p>
          </div>
          <div className="min-w-0 text-right text-xs leading-relaxed text-ink-400">
            <p>
              {c("guests_counter")
                .replace("{arrived}", String(summary.arrivedGuests))
                .replace("{confirmed}", String(summary.confirmedGuests))}
            </p>
            {when && <p className="truncate">{when}</p>}
          </div>
        </section>

        <Tabs value={tab} onValueChange={setTab} className="mt-5 gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="scan">
              <ScanLine />
              {c("tabs.scan")}
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search />
              {c("tabs.search")}
            </TabsTrigger>
          </TabsList>

          {/* Montés en permanence : la caméra garde sa vidéo, la recherche son texte. */}
          <TabsContent value="scan" forceMount className="data-[state=inactive]:hidden">
            <ScanPanel
              active={tab === "scan"}
              onDecode={handleCode}
              onUnlock={unlock}
              onSearch={() => setTab("search")}
            />
            <ManualCode onSubmit={(code) => handleCode(code, { manual: true })} />
            <RecentArrivals guests={recent} />
          </TabsContent>

          <TabsContent value="search" forceMount className="data-[state=inactive]:hidden">
            <SearchPanel
              token={token}
              version={version}
              disabled={acting}
              onSelect={selectGuest}
            />
          </TabsContent>
        </Tabs>
      </div>

      {result && (
        <ResultOverlay
          key={`${result.status}-${result.guest?.id ?? "none"}`}
          result={result}
          acting={acting}
          onNext={dismiss}
          onAdmit={() =>
            act(async () => showResult(await checkInGuest(token, result.guest.id)))
          }
          onUndo={() =>
            act(async () => {
              await undoCheckIn(token, result.guest.id);
              toast.success(c("result.undone"));
              dismiss();
              refresh();
            })
          }
          onCount={(count) =>
            act(async () => {
              const { guest } = await setCheckInCount(token, result.guest.id, count);
              setResult((current) => current && { ...current, guest });
              refresh();
            })
          }
        />
      )}
    </main>
  );
}

// ─── Caméra ─────────────────────────────────────────────────────────────────

/**
 * Lecture des QR codes à la caméra arrière. `status` : idle, starting,
 * running, denied (permission refusée), missing (pas de caméra), insecure
 * (page en http : le navigateur refuse la caméra).
 *
 * L'écran reste allumé tant que la caméra tourne (Wake Lock, si disponible).
 */
function useQrScanner(videoRef, onDecode) {
  const [status, setStatus] = useState("idle");
  const scanner = useRef(null);
  const wakeLock = useRef(null);
  const onDecodeRef = useRef(onDecode);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  const start = useCallback(async () => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus("insecure");
      return;
    }
    setStatus("starting");
    try {
      const { default: QrScanner } = await import("qr-scanner");
      if (!(await QrScanner.hasCamera())) {
        setStatus("missing");
        return;
      }
      if (!scanner.current) {
        scanner.current = new QrScanner(
          videoRef.current,
          (found) => onDecodeRef.current(found.data),
          {
            preferredCamera: "environment",
            maxScansPerSecond: 6,
            highlightScanRegion: false,
            highlightCodeOutline: false,
            returnDetailedScanResult: true,
          },
        );
      }
      await scanner.current.start();
      setStatus("running");
      wakeLock.current = await navigator.wakeLock?.request("screen").catch(() => null);
    } catch (error) {
      const message = `${error?.name ?? ""} ${error?.message ?? error}`;
      setStatus(/NotAllowed|Permission|denied/i.test(message) ? "denied" : "missing");
    }
  }, [videoRef]);

  const stop = useCallback(() => {
    scanner.current?.stop();
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
    setStatus("idle");
  }, []);

  useEffect(
    () => () => {
      scanner.current?.destroy();
      scanner.current = null;
      wakeLock.current?.release().catch(() => {});
    },
    [],
  );

  return { status, start, stop };
}

function ScanPanel({ active, onDecode, onUnlock, onSearch }) {
  const { t } = useTranslation();
  const c = (key) => t(`checkin.${key}`);
  const videoRef = useRef(null);
  const { status, start, stop } = useQrScanner(videoRef, onDecode);
  const resumeOnReturn = useRef(false);

  // La caméra s'arrête pendant la recherche et reprend au retour.
  useEffect(() => {
    if (!active && status === "running") {
      resumeOnReturn.current = true;
      stop();
    } else if (active && status === "idle" && resumeOnReturn.current) {
      resumeOnReturn.current = false;
      start();
    }
  }, [active, status, start, stop]);

  const running = status === "running";
  const blocked = ["denied", "missing", "insecure"].includes(status);
  const blockedMessage = {
    denied: c("camera_denied"),
    missing: c("camera_missing"),
    insecure: c("camera_insecure"),
  }[status];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border/70 bg-black sm:aspect-4/3">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            running ? "opacity-100" : "opacity-0"
          }`}
        />

        {running ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="relative aspect-square w-[64%]">
              <span className="absolute top-0 left-0 h-9 w-9 rounded-tl-2xl border-t-2 border-l-2 border-gold" />
              <span className="absolute top-0 right-0 h-9 w-9 rounded-tr-2xl border-t-2 border-r-2 border-gold" />
              <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-2xl border-b-2 border-l-2 border-gold" />
              <span className="absolute right-0 bottom-0 h-9 w-9 rounded-br-2xl border-r-2 border-b-2 border-gold" />
              <span className="absolute inset-x-4 top-1/2 h-px animate-pulse bg-gold/80 shadow-[0_0_14px_var(--gold)]" />
            </div>
            <p className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white/85 backdrop-blur">
              {c("camera_hint")}
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-850 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
              {blocked ? (
                <CameraOff className="h-6 w-6 text-gold/80" strokeWidth={1.5} />
              ) : (
                <ScanLine className="h-6 w-6 text-gold/80" strokeWidth={1.5} />
              )}
            </span>
            <h2 className="mt-4 font-display text-xl text-ink-50">
              {blocked ? c("camera_unavailable") : c("start_title")}
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-300">
              {blocked ? blockedMessage : c("start_desc")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {status !== "missing" && status !== "insecure" && (
                <Button
                  className="h-11"
                  disabled={status === "starting"}
                  onClick={() => {
                    onUnlock();
                    start();
                  }}
                >
                  {status === "starting" ? <Loader2 className="animate-spin" /> : <ScanLine />}
                  {status === "starting" ? c("starting") : c("start")}
                </Button>
              )}
              {blocked && (
                <Button variant="outline" className="h-11" onClick={onSearch}>
                  <Search />
                  {c("tabs.search")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {running && (
        <div className="mt-2 flex justify-center">
          <Button variant="ghost" size="sm" onClick={stop}>
            {c("stop")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Code tapé à la main, quand l'écran de l'invité ne se scanne pas. */
function ManualCode({ onSubmit }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");

  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!code.trim()) return;
        onSubmit(code);
        setCode("");
      }}
    >
      <Label htmlFor="checkin-code" className="sr-only">
        {t("checkin.manual_label")}
      </Label>
      <Input
        id="checkin-code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder={t("checkin.manual_placeholder")}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="h-11 font-mono tracking-widest uppercase"
      />
      <Button type="submit" variant="outline" className="h-11" disabled={!code.trim()}>
        {t("checkin.manual_submit")}
      </Button>
    </form>
  );
}

// ─── Recherche ──────────────────────────────────────────────────────────────

function SearchPanel({ token, version, disabled, onSelect }) {
  const { t, locale } = useTranslation();
  const c = (key) => t(`checkin.${key}`);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState({ query: "", guests: [] });
  const needle = query.trim();
  const searching = needle.length >= 2 && found.query !== `${needle}#${version}`;

  useEffect(() => {
    if (needle.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const key = `${needle}#${version}`;
      try {
        const { guests } = await searchCheckInGuests(token, needle);
        if (!cancelled) setFound({ query: key, guests });
      } catch {
        if (cancelled) return;
        setFound({ query: key, guests: [] });
        toast.error(t("checkin.error"));
      }
    }, SEARCH_DEBOUNCE);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [needle, token, version, t]);

  const guests = needle.length >= 2 ? found.guests : [];

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={c("search_placeholder")}
          aria-label={c("search_placeholder")}
          autoComplete="off"
          className="h-12 pl-10 text-base"
        />
        {searching && (
          <Loader2 className="absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 animate-spin text-ink-400" />
        )}
      </div>

      {needle.length < 2 ? (
        <p className="mt-4 text-center text-sm text-ink-400">{c("search_hint")}</p>
      ) : !searching && guests.length === 0 ? (
        <p className="mt-4 text-center text-sm text-ink-400">{c("search_empty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-ink-850">
          {guests.map((guest) => {
            const status = guest.rsvpStatus ?? "pending";
            return (
              <li key={guest.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(guest)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-300 hover:bg-ink-800/60 focus-visible:bg-ink-800/60 focus-visible:outline-none disabled:opacity-60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold">
                    {guest.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-50">{guest.name}</span>
                    <span className="block truncate text-xs text-ink-400">
                      {peopleLabel(t, guest.people)} · {c(`status.${status}`)}
                    </span>
                  </span>
                  {guest.checkedInAt ? (
                    <span className="shrink-0 rounded-full border border-positive/30 bg-positive/10 px-2.5 py-1 text-xs text-positive">
                      {c("status.arrived").replace("{time}", clockLabel(guest.checkedInAt, locale))}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs text-gold">
                      {c("let_in")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RecentArrivals({ guests }) {
  const { t, locale } = useTranslation();

  return (
    <section className="mt-8" aria-labelledby="checkin-recent">
      <h2 id="checkin-recent" className="eyebrow text-ink-400">
        {t("checkin.recent")}
      </h2>
      {guests.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">{t("checkin.recent_empty")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/60 rounded-2xl border border-border/60 bg-ink-850">
          {guests.map((guest) => (
            <li key={guest.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="truncate text-ink-100">{guest.name}</span>
              <span data-numeric className="shrink-0 text-xs text-ink-400">
                {peopleLabel(t, guest.checkedInCount ?? guest.people)} ·{" "}
                {clockLabel(guest.checkedInAt, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Résultat d'un scan ─────────────────────────────────────────────────────

const TONES = {
  ok: {
    icon: CheckCircle2,
    ring: "border-positive/50 bg-positive/15 text-positive",
    wash: "bg-positive/10",
  },
  already: {
    icon: AlertTriangle,
    ring: "border-caution/50 bg-caution/15 text-caution",
    wash: "bg-caution/10",
  },
  not_confirmed: {
    icon: HelpCircle,
    ring: "border-caution/50 bg-caution/15 text-caution",
    wash: "bg-caution/10",
  },
  unknown: {
    icon: XCircle,
    ring: "border-negative/50 bg-negative/15 text-negative",
    wash: "bg-negative/10",
  },
};

function ResultOverlay({ result, acting, onNext, onAdmit, onUndo, onCount }) {
  const { t, locale } = useTranslation();
  const r = (key) => t(`checkin.result.${key}`);
  const { status, guest } = result;
  const tone = TONES[status] ?? TONES.unknown;
  const Icon = tone.icon;
  // Un résultat vert passe au suivant tout seul, sauf si l'agent y touche.
  const [auto, setAuto] = useState(status === "ok");

  useEffect(() => {
    if (!auto) return;
    const timer = setTimeout(onNext, AUTO_NEXT_MS);
    return () => clearTimeout(timer);
  }, [auto, onNext]);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext]);

  const arrived = status === "ok" || status === "already";
  const count = guest?.checkedInCount ?? guest?.people ?? 1;
  const description = {
    ok: guest &&
      [
        peopleLabel(t, count),
        guest.seats > 1 && r("seats").replace("{count}", String(guest.seats)),
      ]
        .filter(Boolean)
        .join(" · "),
    already: guest && r("already_desc").replace("{time}", clockLabel(guest.checkedInAt, locale)),
    not_confirmed:
      guest &&
      r(guest.rsvpStatus === "declined" ? "declined_desc" : "not_confirmed_desc").replace(
        "{name}",
        guest.name,
      ),
    unknown: r("unknown_desc"),
  }[status];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="checkin-result-title"
      aria-describedby="checkin-result-desc"
      className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-ink-900"
      onPointerDown={() => setAuto(false)}
    >
      <div aria-hidden="true" className={`absolute inset-0 ${tone.wash}`} />
      {auto && <AutoNextBar />}

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <span
          className={`animate-pop flex h-24 w-24 items-center justify-center rounded-full border-2 ${tone.ring}`}
        >
          <Icon className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h2 id="checkin-result-title" className="mt-6 font-display text-4xl text-ink-50">
          {r(`${status}_title`)}
        </h2>
        {guest && (
          <p className="mt-3 text-2xl wrap-break-word text-ink-50">{guest.name}</p>
        )}
        <p id="checkin-result-desc" className="mt-2 text-sm leading-relaxed text-ink-300">
          {description}
        </p>

        {arrived && guest?.checkedInAt && (
          <div className="mt-8 w-full rounded-2xl border border-border/70 bg-ink-850/80 p-4">
            <p className="text-xs text-ink-400">{r("fix_count")}</p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon-lg"
                disabled={acting || count <= 1}
                onClick={() => onCount(count - 1)}
                aria-label={t("invite.rsvp_sheet.people_decrease")}
              >
                <Minus />
              </Button>
              <output data-numeric aria-live="polite" className="w-12 font-display text-3xl text-ink-50">
                {count}
              </output>
              <Button
                variant="outline"
                size="icon-lg"
                disabled={acting || count >= MAX_COUNT}
                onClick={() => onCount(count + 1)}
                aria-label={t("invite.rsvp_sheet.people_increase")}
              >
                <Plus />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="relative mx-auto grid w-full max-w-md gap-2 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {status === "not_confirmed" ? (
          <>
            <Button className="h-12 text-base" disabled={acting} onClick={onAdmit} autoFocus>
              {acting && <Loader2 className="animate-spin" />}
              {r("admit")}
            </Button>
            <Button variant="outline" className="h-12" disabled={acting} onClick={onNext}>
              {r("refuse")}
            </Button>
          </>
        ) : (
          <>
            <Button className="h-12 text-base" disabled={acting} onClick={onNext} autoFocus>
              {r("next")}
            </Button>
            {arrived && guest?.checkedInAt && (
              <Button variant="ghost" className="h-11" disabled={acting} onClick={onUndo}>
                <Undo2 />
                {r("undo")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Filet qui se vide pendant le passage automatique au suivant. */
function AutoNextBar() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setStarted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-1 origin-left bg-positive"
      style={{
        transform: `scaleX(${started ? 0 : 1})`,
        transition: `transform ${AUTO_NEXT_MS}ms linear`,
      }}
    />
  );
}

// ─── Utilitaires ────────────────────────────────────────────────────────────

function peopleLabel(t, count) {
  return count > 1
    ? t("checkin.result.people_other").replace("{count}", String(count))
    : t("checkin.result.people_one");
}

/**
 * Son et vibration de chaque résultat. Le son passe par Web Audio, débloqué
 * au premier geste de l'agent (« Démarrer la caméra ») : sans geste, iOS le
 * coupe.
 */
function useFeedback() {
  const audio = useRef(null);

  const unlock = useCallback(() => {
    if (audio.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audio.current = new AudioContext();
  }, []);

  const play = useCallback((kind) => {
    navigator.vibrate?.(kind === "ok" ? 80 : [90, 60, 90]);

    const context = audio.current;
    if (!context) return;
    if (context.state === "suspended") context.resume();

    const notes =
      kind === "ok"
        ? [[880, 0], [1320, 0.09]]
        : kind === "warn"
          ? [[520, 0], [520, 0.17]]
          : [[196, 0]];
    const length = kind === "error" ? 0.35 : 0.12;

    for (const [frequency, delay] of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + delay;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + length + 0.05);
    }
  }, []);

  return { unlock, play };
}
