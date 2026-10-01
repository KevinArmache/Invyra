import {
  Check,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Inbox,
  Lock,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";

import styles from "@/components/landing/FeatureVisuals.module.css";

/**
 * Mini-illustrations des cartes de fonctionnalités : la fonction réelle,
 * en mouvement (FeatureVisuals.module.css). Composants serveur sans état ;
 * les libellés arrivent déjà traduits.
 */

function Visual({ children }) {
  return (
    <div aria-hidden="true" data-loop className={styles.visual}>
      {children}
    </div>
  );
}

/** Enveloppe, cachet de cire et rideau, qui s'ouvrent l'un après l'autre. */
export function OpeningVisual({ labels }) {
  const card = (
    <span className={styles.innerCard}>
      <i />
      <i />
      <i />
    </span>
  );

  return (
    <Visual>
      <div className={styles.openings}>
        <div className={styles.stageItem}>
          <div className={styles.stageFrame}>
            <span className={styles.miniEnvelope}>
              <span className={styles.mBack} />
              <span className={styles.mLetter} />
              <span className={styles.mFront} />
              <span className={styles.mFlap} />
              <span className={styles.mSeal} />
            </span>
          </div>
          <p className={styles.stageLabel}>{labels.envelope}</p>
        </div>

        <div className={styles.stageItem}>
          <div className={styles.stageFrame}>
            {card}
            <span className={`${styles.door} ${styles.doorLeft}`} />
            <span className={`${styles.door} ${styles.doorRight}`} />
            <span className={styles.bigSeal}>C&amp;A</span>
          </div>
          <p className={styles.stageLabel}>{labels.seal}</p>
        </div>

        <div className={styles.stageItem}>
          <div className={styles.stageFrame}>
            {card}
            <span className={`${styles.curtain} ${styles.curtainLeft}`} />
            <span className={`${styles.curtain} ${styles.curtainRight}`} />
          </div>
          <p className={styles.stageLabel}>{labels.curtain}</p>
        </div>
      </div>
    </Visual>
  );
}

/** Le bouton de musique de l'invitation, l'onde et des notes qui montent. */
export function MusicVisual() {
  return (
    <Visual>
      <div className={styles.music}>
        <span className={styles.musicButton}>
          <span className={styles.bars}>
            <span />
            <span />
            <span />
          </span>
        </span>
        <span className={styles.wave}>
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} style={{ animationDelay: `${-index * 0.17}s` }} />
          ))}
        </span>
      </div>
      <span className={styles.notes}>
        <span>♪</span>
        <span>♫</span>
        <span>♪</span>
      </span>
    </Visual>
  );
}

/** Un champ qui se remplit, une couleur choisie, l'aperçu qui suit. */
export function NoCodeVisual({ labels }) {
  return (
    <Visual>
      <div className={styles.editor}>
        <div className={styles.form}>
          <span className={styles.fieldLabel}>{labels.title}</span>
          <span className={styles.input}>
            <span className={styles.typed}>{labels.typed}</span>
          </span>
          <span className={styles.fieldLabel}>{labels.colors}</span>
          <span className={styles.swatches}>
            <span />
            <span />
            <span />
            <span />
          </span>
        </div>
        <div className={styles.preview}>
          <p className={styles.previewTitle}>{labels.typed}</p>
          <i />
          <i />
          <span className={styles.previewButton} />
        </div>
      </div>
    </Visual>
  );
}

const GUESTS = ["M", "J", "S"];

/** Un fichier CSV importé, ligne après ligne. */
export function GuestsVisual({ labels }) {
  return (
    <Visual>
      <div className={styles.guests}>
        <p className={styles.file}>
          <FileSpreadsheet strokeWidth={1.75} />
          {labels.file}
        </p>
        {GUESTS.map((initial) => (
          <div key={initial} className={styles.row}>
            <span className={styles.avatar}>{initial}</span>
            <span className={styles.rowLine} />
            <Check className={styles.rowCheck} strokeWidth={2.5} />
          </div>
        ))}
      </div>
    </Visual>
  );
}

/** Deux canaux, deux envois qui arrivent chez l'invité. */
export function SendingVisual({ labels }) {
  return (
    <Visual>
      <div className={styles.sending}>
        <span className={`${styles.channel} ${styles.channelEmail}`}>
          <span>
            <Mail strokeWidth={2} />
          </span>
          {labels.email}
        </span>
        <span className={`${styles.channel} ${styles.channelWhatsapp}`}>
          <span>
            <MessageCircle strokeWidth={2} />
          </span>
          {labels.whatsapp}
        </span>
        <Send className={`${styles.plane} ${styles.planeEmail}`} strokeWidth={1.75} />
        <Send className={`${styles.plane} ${styles.planeWhatsapp}`} strokeWidth={1.75} />
        <span className={styles.inbox}>
          <Inbox strokeWidth={1.6} />
        </span>
      </div>
    </Visual>
  );
}

/** La répartition des réponses qui se remplit, et deux totaux. */
export function TrackingVisual({ labels }) {
  return (
    <Visual>
      <div className={styles.tracking}>
        <div className={styles.track}>
          <span className={`${styles.segment} ${styles.segConfirmed}`} />
          <span className={`${styles.segment} ${styles.segMaybe}`} />
          <span className={`${styles.segment} ${styles.segDeclined}`} />
        </div>
        <div className={styles.legend}>
          <div className={styles.stat}>
            <Eye style={{ color: "var(--gold)" }} strokeWidth={1.75} />
            <div>
              <p className={styles.statValue}>12</p>
              <p className={styles.statLabel}>{labels.opened}</p>
            </div>
          </div>
          <div className={styles.stat}>
            <CheckCircle2 style={{ color: "var(--positive)" }} strokeWidth={1.75} />
            <div>
              <p className={styles.statValue}>8</p>
              <p className={styles.statLabel}>{labels.confirmed}</p>
            </div>
          </div>
        </div>
      </div>
    </Visual>
  );
}

/** Le lien personnel et l'aperçu qu'en donne une messagerie. */
export function PrivacyVisual({ labels, domain }) {
  return (
    <Visual>
      <div className={styles.privacy}>
        <span className={styles.link}>
          <Lock className={styles.lock} strokeWidth={2} />
          {domain}/invite/x7Kp2…
        </span>
        <div className={styles.ogCard}>
          <div className={styles.ogImage} />
          <div className={styles.ogText}>
            <p className={styles.ogTitle}>{labels.preview}</p>
            <p className={styles.ogDomain}>{domain}</p>
          </div>
        </div>
      </div>
    </Visual>
  );
}

/** Un proche rejoint l'événement, comme éditeur ou comme lecteur. */
export function TeamVisual({ labels }) {
  return (
    <Visual>
      <div className={styles.team}>
        <div className={styles.avatars}>
          <span>C</span>
          <span>A</span>
          <span>M</span>
          <span>+</span>
        </div>
        <div className={styles.roles}>
          <span className={styles.role}>{labels.editor}</span>
          <span className={styles.role}>{labels.viewer}</span>
        </div>
      </div>
    </Visual>
  );
}
