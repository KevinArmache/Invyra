/**
 * Figures en papier du design Origami, sous forme de facettes triangulaires
 * dans une boîte de 200 × 200.
 *
 * Toutes les figures ont exactement COUNT facettes : passer de l'une à
 * l'autre revient à déplacer les sommets de chaque facette (c'est le
 * « pliage » animé du carré en grue, de la carte-réponse en avion…). Une
 * figure qui a besoin de moins de facettes est complétée par des triangles
 * réduits à un point, invisibles.
 *
 * Une facette : [x1, y1, x2, y2, x3, y3, ombre, face, profondeur, aile]
 * - ombre : de -1 (plus sombre) à 1 (plus clair), appliquée à la couleur ;
 * - face : 0 papier (--c-card), 1 papier teinté (--c-accent),
 *   2 dorure (--c-accent2) ;
 * - profondeur : ordre d'empilement de la figure (0 au fond) ;
 * - aile : 1 si la facette bat quand la figure s'envole.
 *
 * Module pur : importé par le rendu (figure finale sans script) et injecté
 * tel quel dans le script du design.
 */

const COUNT = 12;

// Les facettes sont rangées dans le sens des aiguilles d'une montre à partir
// du coin haut gauche, comme l'éventail du carré de départ : chaque facette
// du carré devient ainsi la facette de la figure la plus proche.
const START = -0.75 * Math.PI;

function facet(points, shade = 0, side = 1, z = 0, wing = 0) {
  return { points, shade, side, z, wing };
}

function point(x, y) {
  return facet(
    [
      [x, y],
      [x, y],
      [x, y],
    ],
    0,
    1,
    0,
  );
}

/**
 * Éventail d'un rectangle depuis son centre : trois points par côté (coins
 * compris), soit douze triangles. Même découpe que celle du script, qui la
 * recalcule pour la carte-réponse à ses vraies dimensions.
 */
function fan(x, y, w, h, side, shades) {
  const edge = [];
  for (let i = 0; i < 3; i++) edge.push([x + (w * i) / 3, y]);
  for (let i = 0; i < 3; i++) edge.push([x + w, y + (h * i) / 3]);
  for (let i = 0; i < 3; i++) edge.push([x + w - (w * i) / 3, y + h]);
  for (let i = 0; i < 3; i++) edge.push([x, y + h - (h * i) / 3]);
  const center = [x + w / 2, y + h / 2];
  return edge.map((p, i) =>
    facet([center, p, edge[(i + 1) % 12]], shades[i % shades.length], side),
  );
}

/**
 * Met une figure dans la forme attendue par l'animation : premier sommet le
 * plus proche du centre, sommets dans le sens horaire, facettes rangées par
 * angle autour du centre, arrondi au dixième.
 */
function prepare(facets) {
  const all = facets.flatMap((item) => item.points);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const distance = (p) => Math.hypot(p[0] - cx, p[1] - cy);

  const ordered = facets.map((item) => {
    const [first, a, b] = [...item.points].sort(
      (p, q) => distance(p) - distance(q),
    );
    // Écran : y vers le bas, un produit vectoriel positif tourne dans le
    // sens horaire.
    const cross =
      (a[0] - first[0]) * (b[1] - first[1]) -
      (a[1] - first[1]) * (b[0] - first[0]);
    const points = cross >= 0 ? [first, a, b] : [first, b, a];
    const mx = (points[0][0] + points[1][0] + points[2][0]) / 3;
    const my = (points[0][1] + points[1][1] + points[2][1]) / 3;
    const angle = Math.atan2(my - cy, mx - cx);
    return {
      ...item,
      points,
      key: (angle - START + 4 * Math.PI) % (2 * Math.PI),
    };
  });

  ordered.sort((p, q) => p.key - q.key);

  const round = (value) => Math.round(value * 10) / 10;
  return ordered.map((item) => [
    ...item.points.flat().map(round),
    item.shade,
    item.side,
    item.z,
    item.wing,
  ]);
}

function complete(facets, filler) {
  const list = [...facets];
  while (list.length < COUNT) list.push(filler);
  return list;
}

// ─── Figures ────────────────────────────────────────────────────────────────

/** Feuille carrée, face teintée, marquée de plis très légers. */
const square = fan(40, 40, 120, 120, 1, [0.04, -0.02, 0.02, -0.04]);

/** Grue, de profil, bec à gauche, ailes levées. */
const crane = complete(
  [
    // Corps en losange, découpé par ses plis médians.
    facet([[70, 128], [100, 112], [100, 129]], 0.1, 1, 4),
    facet([[100, 112], [130, 128], [100, 129]], -0.04, 1, 4),
    facet([[130, 128], [100, 146], [100, 129]], -0.24, 1, 3),
    facet([[100, 146], [70, 128], [100, 129]], -0.14, 1, 3),
    // Cou, épaisseur du cou, tête.
    facet([[70, 128], [84, 121], [40, 64]], 0.12, 1, 2),
    facet([[70, 128], [40, 64], [62, 124]], -0.2, 1, 1),
    facet([[40, 64], [48, 62], [28, 80]], -0.06, 1, 3),
    // Queue et son revers.
    facet([[116, 121], [172, 62], [130, 128]], 0.04, 1, 2),
    facet([[130, 128], [172, 62], [138, 123]], -0.22, 1, 1),
    // Ailes : l'aile du fond montre l'envers du papier.
    facet([[98, 114], [128, 121], [150, 36]], -0.16, 0, 0, 1),
    facet([[82, 119], [118, 116], [118, 24]], 0.16, 1, 5, 1),
  ],
  point(100, 129),
);

/** Cœur facetté, plié depuis l'encoche du haut. */
const heart = complete(
  [
    facet([[100, 70], [78, 44], [52, 46]], 0.2, 1, 1),
    facet([[100, 70], [52, 46], [36, 68]], 0.1, 1, 1),
    facet([[100, 70], [36, 68], [40, 100]], 0.02, 1, 1),
    facet([[100, 70], [40, 100], [68, 134]], -0.06, 1, 1),
    facet([[100, 70], [68, 134], [100, 164]], -0.12, 1, 1),
    facet([[100, 70], [122, 44], [148, 46]], 0.04, 1, 1),
    facet([[100, 70], [148, 46], [164, 68]], -0.04, 1, 1),
    facet([[100, 70], [164, 68], [160, 100]], -0.12, 1, 1),
    facet([[100, 70], [160, 100], [132, 134]], -0.2, 1, 1),
    facet([[100, 70], [132, 134], [100, 164]], -0.28, 1, 1),
  ],
  point(100, 70),
);

/** Étoile à cinq branches, en relief, à la feuille dorée. */
const star = complete(
  (() => {
    const cx = 100;
    const cy = 104;
    const at = (radius, degrees) => {
      const radians = (degrees * Math.PI) / 180;
      return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
    };
    const list = [];
    for (let k = 0; k < 5; k++) {
      const tip = at(82, -90 + k * 72);
      const before = at(34, -126 + k * 72);
      const after = at(34, -54 + k * 72);
      list.push(facet([[cx, cy], before, tip], 0.18, 2, 1));
      list.push(facet([[cx, cy], tip, after], -0.2, 2, 1));
    }
    return list;
  })(),
  point(100, 104),
);

/** Avion de papier, nez à droite : la carte-réponse qui s'envole. */
const plane = complete(
  [
    facet([[182, 96], [26, 58], [70, 104]], 0.12, 0, 3),
    facet([[182, 96], [34, 74], [26, 58]], -0.08, 0, 1),
    facet([[182, 96], [70, 104], [40, 98]], -0.1, 0, 2),
    facet([[182, 96], [40, 98], [54, 120]], -0.24, 0, 2),
    facet([[182, 96], [54, 120], [86, 134]], -0.36, 0, 2),
  ],
  point(182, 96),
);

export const FIGURES = {
  square: prepare(square),
  crane: prepare(crane),
  heart: prepare(heart),
  star: prepare(star),
  plane: prepare(plane),
};

/** Figures proposées comme conclusion (réglage « Figure finale »). */
export const FINAL_FIGURES = ["crane", "heart", "star"];

const SIDES = ["var(--c-card)", "var(--c-accent)", "var(--c-accent2)"];

/**
 * Couleur d'une facette. Même calcul que `fill()` dans le script du design,
 * qui l'applique à chaque image pendant les animations.
 */
function facetFill(side, shade) {
  const base = SIDES[side] ?? SIDES[0];
  if (Math.abs(shade) < 0.005) return base;
  const mix = shade < 0 ? "#000" : "#fff";
  return `color-mix(in srgb, ${base}, ${mix} ${Math.round(Math.abs(shade) * 100)}%)`;
}

/**
 * Polygones SVG d'une figure, dans l'ordre d'empilement. `data-i` garde
 * l'indice de la facette, que le script utilise pour l'animer.
 */
export function figurePolygons(name, className = "") {
  const facets = FIGURES[name] ?? FIGURES.crane;
  return facets
    .map((values, index) => ({ values, index }))
    .sort((a, b) => a.values[8] - b.values[8])
    .map(({ values, index }) => {
      const points = `${values[0]},${values[1]} ${values[2]},${values[3]} ${values[4]},${values[5]}`;
      return `<polygon data-i="${index}"${className ? ` class="${className}"` : ""} points="${points}" style="fill:${facetFill(values[7], values[6])}"/>`;
    })
    .join("");
}
