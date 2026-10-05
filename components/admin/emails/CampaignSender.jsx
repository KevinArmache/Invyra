"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shell/primitives";
import {
  pauseCampaign,
  retryFailedRecipients,
  sendCampaignBatch,
} from "@/app/actions/campaign";
import {
  CampaignProgress,
  CampaignStatusBadge,
} from "@/components/admin/emails/CampaignProgress";
import { useTranslation } from "@/lib/i18n/Context";

/** Tuile de compteur : libellé, nombre, aide facultative. */
function Count({ label, value, hint, tone = "text-ink-50" }) {
  return (
    <div className="rounded-lg border border-border/60 bg-ink-800/40 px-4 py-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p data-numeric className={`mt-1 font-display text-2xl ${tone}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] leading-snug text-ink-400">{hint}</p>}
    </div>
  );
}

/**
 * Pilote de l'envoi : appelle sendCampaignBatch lot après lot tant que la
 * page est ouverte, et affiche l'avancement. Chaque lot ne dure qu'une
 * dizaine de secondes : aucune fonction serveur n'atteint sa durée maximale,
 * et une pause (demandée, ou quota SMTP atteint) laisse l'envoi dans un état
 * propre, prêt à reprendre.
 *
 * @param {boolean} props.autoStart  démarrer dès l'arrivée (juste après le lancement)
 */
export default function CampaignSender({
  campaignId,
  total,
  initialStatus,
  initialCounts,
  initialError,
  autoStart,
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const [status, setStatus] = useState(initialStatus);
  const [counts, setCounts] = useState(initialCounts);
  const [lastError, setLastError] = useState(initialError);
  const [running, setRunning] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [stalled, setStalled] = useState(false);

  const stopRef = useRef(false);
  const startedRef = useRef(false);

  const done = counts.sent + counts.failed + counts.skipped;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const finished = status === "sent";

  async function run() {
    if (running) return;
    stopRef.current = false;
    setRunning(true);
    setStalled(false);
    setLastError(null);

    try {
      for (;;) {
        const result = await sendCampaignBatch(campaignId);
        setStatus(result.status);
        setCounts(result.counts);
        setLastError(result.lastError);

        if (result.done) {
          toast.success(
            t("portal.campaigns.done_toast").replace("{count}", String(result.counts.sent)),
          );
          break;
        }
        if (result.paused) break;
        // Rien à prendre, mais pas fini : un autre onglet envoie, ou des
        // destinataires attendent d'être repris (voir STALE_MS).
        if (result.processed === 0) {
          setStalled(true);
          break;
        }
        if (stopRef.current) {
          await pauseCampaign(campaignId);
          setStatus("paused");
          break;
        }
      }
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setRunning(false);
      setPausing(false);
      // L'historique des échecs, rendu par le serveur, suit l'envoi.
      router.refresh();
    }
  }

  async function handleRetry() {
    setRetrying(true);
    try {
      const { count } = await retryFailedRecipients(campaignId);
      toast.success(t("portal.campaigns.retry_done").replace("{count}", String(count)));
      if (count > 0) {
        setStatus("paused");
        setCounts((current) => ({
          ...current,
          pending: current.pending + count,
          failed: 0,
        }));
      }
      router.refresh();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
    } finally {
      setRetrying(false);
    }
  }

  // Juste après le lancement (?start=1) : l'envoi démarre seul, et l'adresse
  // perd son paramètre pour qu'un rechargement ne le relance pas.
  // Le drapeau est posé dans le minuteur, pas dans l'effet : en mode strict,
  // le premier montage est défait (minuteur annulé) puis rejoué.
  useEffect(() => {
    if (!autoStart || initialStatus === "sent") return;
    const timer = setTimeout(() => {
      if (startedRef.current) return;
      startedRef.current = true;
      window.history.replaceState(null, "", `/admin/emails/${campaignId}`);
      run();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quitter la page pendant un lot : le navigateur demande confirmation.
  useEffect(() => {
    if (!running) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  const progressLabel = t("portal.campaigns.progress_label")
    .replace("{done}", String(done))
    .replace("{total}", String(total));

  return (
    <Panel
      delay={100}
      title={t("portal.campaigns.progress")}
      action={<CampaignStatusBadge status={running ? "sending" : status} t={t} />}
    >
      <div className="space-y-5 p-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink-300">{progressLabel}</span>
            <span data-numeric className="font-display text-xl text-gold">
              {percent}%
            </span>
          </div>
          <CampaignProgress
            sent={counts.sent}
            failed={counts.failed}
            skipped={counts.skipped}
            total={total}
            label={progressLabel}
            className="h-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Count label={t("portal.campaigns.sent")} value={counts.sent} tone="text-gold" />
          <Count
            label={t("portal.campaigns.pending")}
            value={counts.pending + counts.sending}
          />
          <Count
            label={t("portal.campaigns.failed")}
            value={counts.failed}
            tone={counts.failed > 0 ? "text-negative" : "text-ink-50"}
          />
          <Count
            label={t("portal.campaigns.skipped")}
            value={counts.skipped}
            hint={t("portal.campaigns.skipped_hint")}
          />
        </div>

        {/* État de l'envoi, annoncé aux lecteurs d'écran. */}
        <div aria-live="polite" className="space-y-3 text-sm">
          {running && (
            <p className="flex items-start gap-2 text-ink-100">
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-gold" />
              <span>
                {t("portal.campaigns.sending_now")}{" "}
                <span className="text-ink-400">{t("portal.campaigns.keep_open")}</span>
              </span>
            </p>
          )}

          {!running && finished && (
            <p className="flex items-center gap-2 text-positive">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {t("portal.campaigns.done")}
            </p>
          )}

          {!running && !finished && lastError && (
            <p className="flex items-start gap-2 rounded-lg border border-caution/30 bg-caution/10 px-3.5 py-3 text-caution">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {lastError}
            </p>
          )}

          {!running && !finished && stalled && (
            <p className="text-ink-300">{t("portal.campaigns.stalled")}</p>
          )}

          {!running && !finished && !lastError && !stalled && done > 0 && (
            <p className="text-ink-300">{t("portal.campaigns.paused_msg")}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border/60 pt-5 sm:flex-row sm:flex-wrap">
          {running ? (
            <Button
              type="button"
              variant="outline"
              disabled={pausing}
              onClick={() => {
                stopRef.current = true;
                setPausing(true);
              }}
            >
              {pausing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
              {pausing ? t("portal.campaigns.pausing") : t("portal.campaigns.pause")}
            </Button>
          ) : (
            !finished && (
              <Button type="button" onClick={run} disabled={retrying}>
                <Play className="h-4 w-4" />
                {done === 0 ? t("portal.campaigns.start") : t("portal.campaigns.resume")}
              </Button>
            )
          )}

          {!running && counts.failed > 0 && (
            <Button type="button" variant="outline" onClick={handleRetry} disabled={retrying}>
              {retrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {t("portal.campaigns.retry_failed")}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
