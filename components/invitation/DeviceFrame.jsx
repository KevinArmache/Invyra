/**
 * Cadre de téléphone autour d'une invitation : c'est sur un écran de ce
 * format que la plupart des invités l'ouvriront.
 *
 * Sans état ni hook : utilisable dans un composant serveur comme dans un
 * composant client. Le contenu remplit l'écran (iframe, image, vignette).
 *
 * @param {boolean} [props.glow]  halo doré derrière l'appareil
 * @param {string}  [props.className]  largeur maximale, marges
 */
export default function DeviceFrame({ children, glow = true, className = "max-w-[19rem]" }) {
  return (
    <div className={`relative mx-auto w-full ${className}`}>
      {glow && (
        <div
          aria-hidden="true"
          className="glow-gold animate-breathe pointer-events-none absolute -inset-14 -z-10"
        />
      )}
      <div className="relative rounded-[2.6rem] border border-ink-600 bg-linear-to-b from-ink-800 to-ink-900 p-2.5 shadow-elevation-3 ring-1 ring-gold/10">
        {/* Boutons latéraux, pour la silhouette. */}
        <span
          aria-hidden="true"
          className="absolute top-24 -left-[3px] h-12 w-[3px] rounded-l-sm bg-ink-600"
        />
        <span
          aria-hidden="true"
          className="absolute top-40 -left-[3px] h-12 w-[3px] rounded-l-sm bg-ink-600"
        />
        <span
          aria-hidden="true"
          className="absolute top-32 -right-[3px] h-16 w-[3px] rounded-r-sm bg-ink-600"
        />

        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.1rem] bg-black">
          {children}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2.5 left-1/2 z-10 h-[1.35rem] w-[5.5rem] -translate-x-1/2 rounded-full bg-black"
          />
        </div>
      </div>
    </div>
  );
}
