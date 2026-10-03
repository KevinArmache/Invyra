import styles from "@/components/landing/Signature.module.css";

/** Le paraphe : un seul trait, souple, qui finit par une petite boucle. */
const FLOURISH =
  "M2 9.5C22 4 38 12.5 60 8.5S100 2.5 124 7.5C134 9.5 143 10 150 6.5C154 4.5 156 2.5 153.5 2.2C150.5 2 149 6 152 9.5C154 11.5 157 11 158 10";

/**
 * Signature du pied de page : le nom en or, traversé par le reflet du site
 * (.text-gold-shimmer), et un paraphe qui se trace sous lui quand le bas de
 * page apparaît. Au survol ou au focus, une lueur court le long du trait et
 * une étoile se pose à côté du nom.
 *
 * Le parent porte `data-reveal` : le trait (data-reveal-child) attend que le
 * bloc soit visible pour se dessiner.
 *
 * @param {string} props.name
 * @param {string} props.href
 * @param {string} props.label  nom accessible du lien
 */
export default function Signature({ name, href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`${styles.signature} rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background`}
    >
      <span className={`text-gold-shimmer font-display italic ${styles.name}`}>
        {name}
      </span>
      <span aria-hidden="true" className={styles.spark}>
        ✦
      </span>
      <svg
        aria-hidden="true"
        className={styles.flourish}
        viewBox="0 0 160 14"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          data-reveal-child
          className={styles.stroke}
          d={FLOURISH}
          pathLength="1"
        />
        <path className={styles.glint} d={FLOURISH} pathLength="1" />
      </svg>
    </a>
  );
}
