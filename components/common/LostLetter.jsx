import styles from "@/components/common/LostLetter.module.css";

/**
 * Une enveloppe qui s'ouvre une fois et laisse sortir une lettre portant
 * `code` (« 404 »). Décorative : le titre de la page dit déjà l'essentiel.
 */
export default function LostLetter({ code = "404" }) {
  return (
    <div aria-hidden="true" className={styles.letterScene}>
      <span className={styles.back} />
      <span className={styles.letter}>
        <span className={styles.code}>{code}</span>
        <span className={styles.line} />
      </span>
      <span className={styles.front} />
      <span className={styles.flap} />
    </div>
  );
}
