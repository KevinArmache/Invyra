/**
 * Poussière d'or : quelques points qui montent lentement et s'éteignent.
 *
 * Les positions sont calculées, pas tirées au hasard : le rendu serveur et
 * le navigateur produisent exactement les mêmes, sans écart d'hydratation.
 * Les délais négatifs démarrent chaque point au milieu de sa course, pour
 * que la scène soit déjà vivante au premier affichage.
 *
 * Le parent doit être positionné ; le bloc s'arrête hors écran (data-loop).
 */
export default function Particles({ count = 16, className = "" }) {
  const particles = Array.from({ length: count }, (_, index) => {
    const duration = 8 + ((index * 5) % 7);
    return {
      left: (index * 37 + 11) % 100,
      top: 35 + ((index * 53 + 7) % 65),
      size: 1.5 + ((index * 7) % 5) * 0.5,
      duration,
      delay: -((index * 1.7) % duration),
      drift: ((index * 13) % 40) - 20,
      opacity: 0.25 + ((index * 3) % 5) * 0.1,
    };
  });

  return (
    <div
      aria-hidden="true"
      data-loop
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {particles.map((particle, index) => (
        <span
          key={index}
          className="particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            "--dur": `${particle.duration}s`,
            "--delay": `${particle.delay.toFixed(2)}s`,
            "--drift-x": `${particle.drift}px`,
            "--particle-opacity": particle.opacity.toFixed(2),
          }}
        />
      ))}
    </div>
  );
}
