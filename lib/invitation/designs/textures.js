/**
 * Textures communes aux designs, sous forme de valeurs CSS prêtes à l'emploi
 * (`background-image: ${NOISE}`). Un design n'importe jamais le fichier d'un
 * autre design : ce qui se partage vit ici.
 */

/**
 * Grain (papier, carton) : bruit SVG statique, rastérisé une fois par le
 * navigateur puis répété. Chaque design en règle l'intensité par l'opacité
 * de la couche qui le porte.
 */
const NOISE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>" +
  "<filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.2 -.52'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>";

export const NOISE = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;
