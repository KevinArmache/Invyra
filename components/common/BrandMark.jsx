import Image from "next/image";
import Link from "next/link";

/**
 * La marque : le lotus d'or et le nom en Fraunces.
 *
 * Le lotus est `apple-icon.png`, déjà détouré (180 px, affiché bien plus
 * petit, donc net sur écran dense). Au survol il se redresse légèrement et
 * le nom prend le reflet or.
 *
 * @param {string}  [props.href]       lien ; sans lien, un simple bloc
 * @param {boolean} [props.showName]   affiche le nom à côté du lotus
 * @param {"sm"|"md"|"lg"} [props.size]
 * @param {boolean} [props.priority]   précharge l'image (en haut de page)
 */
const SIZES = {
  sm: { mark: 24, text: "text-lg" },
  md: { mark: 30, text: "text-2xl" },
  lg: { mark: 40, text: "text-3xl" },
};

export default function BrandMark({
  href,
  showName = true,
  size = "md",
  className = "",
  onClick,
  priority = false,
}) {
  const { mark, text } = SIZES[size] ?? SIZES.md;

  const content = (
    <>
      <span className="relative inline-flex shrink-0 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-[-35%] rounded-full opacity-0 blur-md transition-opacity duration-500 group-hover/brand:opacity-100"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--gold) 35%, transparent), transparent 70%)",
          }}
        />
        <Image
          src="/apple-icon.png"
          alt=""
          width={mark}
          height={mark}
          priority={priority}
          className="relative transition-transform duration-500 ease-out group-hover/brand:-translate-y-0.5 group-hover/brand:scale-105"
        />
      </span>
      {showName && (
        <span
          className={`font-display tracking-tight text-ink-50 transition-colors duration-300 group-hover/brand:text-gold-bright ${text}`}
        >
          Invyra
        </span>
      )}
    </>
  );

  const classes = `group/brand inline-flex items-center gap-2.5 ${className}`;

  if (!href) return <span className={classes}>{content}</span>;

  return (
    <Link href={href} className={classes} onClick={onClick} aria-label="Invyra">
      {content}
    </Link>
  );
}
