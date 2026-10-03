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

/**
 * Motif du QR code des billets, 9 × 9. Les trois coins sont les repères
 * (dessinés à part) : leurs cellules ne sont pas rendues, et la grille place
 * les autres autour d'eux dans l'ordre de lecture.
 */
const QR = [
  "000101000",
  "000010000",
  "000111000",
  "101100101",
  "010011010",
  "110101011",
  "000110100",
  "000011010",
  "000101101",
];
const inFinder = (r, c) => (r < 3 && (c < 3 || c > 5)) || (r > 5 && c < 3);
const QR_CELLS = QR.flatMap((row, r) =>
  [...row].flatMap((cell, c) =>
    inFinder(r, c) ? [] : [{ key: `${r}-${c}`, on: cell === "1" }],
  ),
);

function QrCode({ className = "" }) {
  return (
    <span className={`${styles.qr} ${className}`}>
      <b />
      <b />
      <b />
      {QR_CELLS.map((cell) => (
        <i key={cell.key} className={cell.on ? styles.qrOn : undefined} />
      ))}
    </span>
  );
}

/** Le billet de l'invité : son nom, ses places et le QR code, balayé. */
export function TicketVisual({ labels }) {
  return (
    <Visual>
      <div className={styles.ticket}>
        <div className={styles.ticketMain}>
          <p className={styles.ticketEyebrow}>{labels.eyebrow}</p>
          <p className={styles.ticketName}>{labels.guest}</p>
          <p className={styles.ticketPass}>{labels.pass}</p>
          <p className={styles.ticketCode}>7K3M-Q9PX</p>
        </div>
        <div className={styles.ticketStub}>
          <QrCode />
          <span className={styles.scanLine} />
        </div>
      </div>
    </Visual>
  );
}

/** Le viseur de l'accueil : le billet est lu, l'invité entre, le compte monte. */
export function CheckInVisual({ labels }) {
  return (
    <Visual>
      <div className={styles.checkin}>
        <div className={styles.viewfinder}>
          <QrCode className={styles.qrScanned} />
          <span className={`${styles.corner} ${styles.cornerTl}`} />
          <span className={`${styles.corner} ${styles.cornerTr}`} />
          <span className={`${styles.corner} ${styles.cornerBl}`} />
          <span className={`${styles.corner} ${styles.cornerBr}`} />
          <span className={styles.beam} />
          <span className={styles.welcome}>
            <Check strokeWidth={2.5} />
            {labels.welcome}
          </span>
        </div>
        <div className={styles.counter}>
          <p className={styles.counterValue}>
            <span className={styles.counterDigits}>
              <span>23</span>
              <span>24</span>
            </span>
            <span className={styles.counterTotal}>/ 30</span>
          </p>
          <p className={styles.counterLabel}>{labels.arrived}</p>
        </div>
      </div>
    </Visual>
  );
}

/** Le trajet qui se trace d'une étape à l'autre, et les applis de navigation. */
export function DirectionsVisual({ labels }) {
  const route = "M20 80C58 74 66 34 110 36S172 78 220 22";
  return (
    <Visual>
      <div className={styles.directions}>
        <div className={styles.map}>
          <svg
            className={styles.route}
            viewBox="0 0 240 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <path className={styles.routeGhost} d={route} />
            <path className={styles.routeLine} d={route} pathLength="1" />
          </svg>
          {/* Positions des épingles : les points du tracé, en % du cadre. */}
          {[
            { className: styles.pin1, left: "8.33%", top: "80%" },
            { className: styles.pin2, left: "45.8%", top: "36%" },
            { className: styles.pin3, left: "91.7%", top: "22%" },
          ].map(({ className, ...position }, index) => (
            <span
              key={className}
              className={`${styles.pin} ${className}`}
              style={position}
            >
              {index + 1}
            </span>
          ))}
        </div>
        <div className={styles.apps}>
          {labels.apps.map((app, index) => (
            <span key={app} className={styles.app} style={{ "--app": index }}>
              {app}
            </span>
          ))}
        </div>
      </div>
    </Visual>
  );
}

/** Des photos qui se posent en éventail, et un mot laissé au livre d'or. */
export function MemoriesVisual({ labels }) {
  return (
    <Visual>
      <div className={styles.memories}>
        <span className={`${styles.polaroid} ${styles.polaroid1}`}>
          <span />
        </span>
        <span className={`${styles.polaroid} ${styles.polaroid2}`}>
          <span />
        </span>
        <span className={`${styles.polaroid} ${styles.polaroid3}`}>
          <span />
        </span>
        <span className={styles.note}>
          <span className={styles.noteLabel}>{labels.guestbook}</span>
          <span className={styles.noteText}>{labels.note}</span>
        </span>
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
