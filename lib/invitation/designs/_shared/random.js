/**
 * Générateur pseudo-aléatoire déterministe : la même graine donne toujours
 * la même suite, donc le même rendu (formes d'onde, codes-barres…).
 */
export function random(seed) {
  let x = (seed * 7919 + 104729) % 233280;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}
