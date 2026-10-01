import { Check, Eye, MessageCircle } from "lucide-react";

import { getTranslations } from "@/lib/i18n/server";
import { sampleEvent } from "@/lib/landing/sample-event";
import styles from "@/components/landing/HeroScene.module.css";

/**
 * Scène du héros : l'enveloppe à son nom qui s'ouvre, l'invitation, la
 * réponse, et côté organisateur les trois pastilles de suivi. Tout est en
 * CSS (HeroScene.module.css) : la scène est peinte dès le premier octet.
 *
 * La date est celle de l'événement fictif des aperçus, toujours à venir, et
 * suit la langue du visiteur. La scène est décorative : le texte du héros dit
 * déjà ce qu'elle montre.
 */
export default async function HeroScene() {
  const { t, locale } = await getTranslations();
  const event = sampleEvent();
  const date = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(event.eventDate));

  const scene = (key) => t(`landing.hero.scene.${key}`);
  const monogram = `${scene("bride").charAt(0)}&${scene("groom").charAt(0)}`;

  return (
    <div
      aria-hidden="true"
      data-loop
      className="animate-rise-card relative select-none"
      style={{ "--rise-delay": "250ms" }}
    >
      <div className="glow-gold animate-breathe pointer-events-none absolute -inset-16 -z-10" />

      <div className={styles.scene}>
        <div className={styles.frame}>
          {/* ── L'écran d'ouverture ─────────────────────────────── */}
          <div className={styles.opening}>
            <p className={styles.invited}>{scene("invited")}</p>
            <p className={styles.guest}>{scene("guest")}</p>
            <div className={styles.envelope}>
              <span className={styles.envBack} />
              <span className={styles.envLetter}>
                <span className={styles.envMono}>{monogram}</span>
                <span className={styles.envLine} />
              </span>
              <span className={styles.envFront} />
              <span className={styles.envFlap} />
              <span className={styles.seal}>{monogram}</span>
              <span className={styles.touchEnvelope} />
            </div>
            <p className={styles.hint}>{scene("hint")}</p>
          </div>

          {/* ── L'invitation ────────────────────────────────────── */}
          <div className={styles.card}>
            <div className={styles.rule}>
              <span />
              <span />
            </div>
            <p className={styles.cardEyebrow}>{scene("card_eyebrow")}</p>
            <p className={styles.names}>
              {scene("bride")}
              <span className={styles.amp}>&amp;</span>
              {scene("groom")}
            </p>
            <p className={styles.date}>{date}</p>
            <p className={styles.place}>{scene("place")}</p>
            <span className={styles.rsvp}>
              <span className={styles.rsvpIdle}>{scene("rsvp")}</span>
              <span className={styles.rsvpDone}>
                <Check strokeWidth={2.5} />
                {scene("rsvp_done")}
              </span>
              <span className={styles.touchButton} />
            </span>
            <div className={`${styles.rule} ${styles.ruleBottom} ${styles.ruleSpaced}`}>
              <span />
              <span />
            </div>
          </div>
        </div>

        {/* ── Côté organisateur ─────────────────────────────────── */}
        <p className={`${styles.chip} ${styles.chipSent}`}>
          <span className={styles.chipIcon}>
            <MessageCircle strokeWidth={2} />
          </span>
          {scene("chip_sent")}
        </p>
        <p className={`${styles.chip} ${styles.chipOpened}`}>
          <span className={styles.chipIcon}>
            <Eye strokeWidth={2} />
          </span>
          {scene("chip_opened")}
        </p>
        <p className={`${styles.chip} ${styles.chipConfirmed}`}>
          <span className={styles.chipIcon}>
            <Check strokeWidth={2.5} />
          </span>
          {scene("chip_confirmed")}
        </p>
      </div>
    </div>
  );
}
