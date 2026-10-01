"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MailOpen, Music2, RotateCcw } from "lucide-react";

import DeviceFrame from "@/components/invitation/DeviceFrame";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import { sampleEvent } from "@/lib/landing/sample-event";
import { toEditableConfig } from "@/lib/templates/validation";
import { OPENING_FIELDS } from "@/lib/invitation/opening";
import { useTranslation } from "@/lib/i18n/Context";

/** Les styles d'ouverture standard, dans l'ordre de l'éditeur. */
const STYLES = OPENING_FIELDS.find((field) => field.key === "style").options;

/**
 * Démo de l'écran d'ouverture, avec le vrai rendu d'un modèle de la vitrine
 * (InvitationPreview, la même iframe que l'invité reçoit).
 *
 * Le style choisi remplace celui du modèle, et une ouverture écrite en code
 * est mise de côté pour que les trois styles standard soient comparables.
 * La musique est retirée : elle démarrerait au toucher, sur une page que le
 * visiteur n'a pas ouverte pour en écouter.
 *
 * L'iframe n'est créée qu'à l'approche de la section : le modèle (polices,
 * photos) n'est chargé que si le visiteur descend jusque-là.
 *
 * @param {{ name: string, config: object }} props.template
 */
export default function OpeningDemo({ template }) {
  const { t } = useTranslation();
  const [style, setStyle] = useState(STYLES[0]);
  const [replay, setReplay] = useState(0);
  const [event, setEvent] = useState(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        // Calculé ici, côté client : la date fictive reste toujours à venir.
        setEvent(sampleEvent());
        observer.disconnect();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const config = useMemo(() => {
    const base = toEditableConfig(template?.config);
    if (!base) return null;
    return {
      ...base,
      opening: { ...base.opening, style },
      openingCode: null,
      music: null,
    };
  }, [template, style]);

  function choose(next) {
    setStyle(next);
    setReplay((value) => value + 1);
  }

  const activeIndex = STYLES.indexOf(style);

  return (
    <section
      id="opening"
      aria-labelledby="opening-title"
      className="relative scroll-mt-20 overflow-hidden border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-[36rem] w-[36rem] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--gold) 10%, transparent), transparent 65%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-24">
        <div data-reveal="left" className="text-center lg:text-left">
          <p className="eyebrow text-gold/80">{t("landing.opening_demo.eyebrow")}</p>
          <h2
            id="opening-title"
            className="mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
          >
            {t("landing.opening_demo.title")}
            <em className="text-gold not-italic">
              {t("landing.opening_demo.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold-left mx-auto mt-7 w-24 lg:mx-0" />
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-pretty text-ink-300 lg:mx-0">
            {t("landing.opening_demo.subtitle")}
          </p>

          {/* Sélecteur : la pastille dorée glisse sous le style choisi. */}
          <div
            role="group"
            aria-label={t("portal.editor.fields.style")}
            className="relative mx-auto mt-10 grid w-full max-w-md grid-cols-3 rounded-full border border-border bg-ink-850 p-1 lg:mx-0"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-gold/15 ring-1 ring-gold/45 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            />
            {STYLES.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={style === key}
                onClick={() => choose(key)}
                className={`relative z-10 rounded-full px-2 py-2.5 text-xs whitespace-nowrap transition-colors duration-300 sm:px-3 sm:text-sm ${
                  style === key ? "text-ink-50" : "text-ink-400 hover:text-ink-100"
                }`}
              >
                {t(`portal.editor.options.style.${key}`)}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <p className="inline-flex items-center gap-2 text-sm text-ink-300">
              <MailOpen className="h-4 w-4 text-gold" strokeWidth={1.75} />
              {t("landing.opening_demo.hint")}
            </p>
            <button
              type="button"
              onClick={() => setReplay((value) => value + 1)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-ink-300 transition-colors hover:border-gold/40 hover:text-ink-50"
            >
              <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180" />
              {t("landing.opening_demo.replay")}
            </button>
          </div>

          <p className="mt-6 inline-flex items-center gap-2 text-xs text-ink-400">
            <Music2 className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.75} />
            {t("landing.opening_demo.music_note")}
          </p>
        </div>

        <div data-reveal="scale" ref={frameRef}>
          <DeviceFrame>
            {event && config ? (
              <InvitationPreview
                key={`${style}-${replay}`}
                template={config}
                event={event}
                guestName={t("landing.hero.scene.guest")}
                title={template.name}
              />
            ) : (
              <div className="skeleton h-full w-full rounded-none" />
            )}
          </DeviceFrame>
          <p className="mt-6 text-center text-xs text-ink-400">
            {t("landing.opening_demo.model_note").replace("{name}", template.name)}
          </p>
        </div>
      </div>
    </section>
  );
}
