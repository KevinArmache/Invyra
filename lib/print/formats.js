/**
 * Formats des invitations papier.
 *
 * Un format décrit la carte finie (après coupe et pliage) et comment ses
 * faces se répartissent sur la feuille imprimée :
 *
 * - `trim`    taille finie d'une face, en mm (carte fermée pour une pliée) ;
 * - `faces`   faces que le modèle dessine, dans l'ordre de lecture ;
 * - `fold`    null (carte plate), "vertical" (s'ouvre comme un livre) ou
 *             "horizontal" (s'ouvre vers le haut, carte « tente ») ;
 * - `sheets`  côtés de la feuille imprimée (recto, verso) : une grille de
 *             `cols` × `rows` faces. Une face notée `rotate: 180` est
 *             imprimée tête-bêche, pour être à l'endroit une fois pliée ;
 * - `mockup`  maquette 3D de la vitrine (voir components/stationery).
 *
 * Toutes les faces d'un format ont la même taille. Autour de chacune, le
 * modèle dessine 3 mm de fond perdu (BLEED), et garde son texte à 5 mm du
 * bord fini (SAFE).
 *
 * Module pur, importable côté serveur comme côté client. Les libellés vivent
 * dans les dictionnaires, sous `stationery.formats.<id>` et
 * `stationery.faces.<face>`.
 */

/** Fond perdu autour de chaque face (mm) : coupé après impression. */
export const BLEED = 3;

/** Marge de sécurité à l'intérieur du bord fini (mm) : rien d'important au-delà. */
export const SAFE = 5;

/** Marge technique autour de la feuille (mm) : traits de coupe et repères. */
export const SLUG = 10;

/** Pixels CSS par millimètre (96 px par pouce). */
export const PX_PER_MM = 96 / 25.4;

const FLAT_SHEETS = [
  { id: "recto", cols: 1, rows: 1, cells: [{ face: "front" }] },
  { id: "verso", cols: 1, rows: 1, cells: [{ face: "back" }] },
];

function flat(id, width, height) {
  return {
    id,
    family: "flat",
    fold: null,
    trim: { width, height },
    faces: ["front", "back"],
    sheets: FLAT_SHEETS,
    mockup: "flat",
  };
}

/** Carte pliée qui s'ouvre comme un livre : dos et couverture côte à côte. */
function book(id, width, height) {
  return {
    id,
    family: "folded",
    fold: "vertical",
    trim: { width, height },
    faces: ["cover", "inside-left", "inside-right", "back"],
    sheets: [
      {
        id: "outside",
        cols: 2,
        rows: 1,
        cells: [{ face: "back" }, { face: "cover" }],
      },
      {
        id: "inside",
        cols: 2,
        rows: 1,
        cells: [{ face: "inside-left" }, { face: "inside-right" }],
      },
    ],
    mockup: "book",
  };
}

/**
 * Carte pliée en haut (« tente ») : le dos est imprimé tête-bêche au-dessus
 * de la couverture, pour être à l'endroit une fois la carte retournée.
 */
function tent(id, width, height) {
  return {
    id,
    family: "folded",
    fold: "horizontal",
    trim: { width, height },
    faces: ["cover", "inside-top", "inside-bottom", "back"],
    sheets: [
      {
        id: "outside",
        cols: 1,
        rows: 2,
        cells: [{ face: "back", rotate: 180 }, { face: "cover" }],
      },
      {
        id: "inside",
        cols: 1,
        rows: 2,
        cells: [{ face: "inside-top" }, { face: "inside-bottom" }],
      },
    ],
    mockup: "tent",
  };
}

export const PRINT_FORMATS = [
  flat("flat-a6", 105, 148),
  flat("flat-5x7", 127, 178),
  flat("flat-a5", 148, 210),
  flat("flat-square", 150, 150),
  flat("flat-long", 99, 210),
  book("folded-a5", 148, 210),
  book("folded-5x7", 127, 178),
  book("folded-square", 150, 150),
  tent("folded-tent", 210, 148),
];

const BY_ID = new Map(PRINT_FORMATS.map((format) => [format.id, format]));

/** Familles, dans l'ordre des filtres de la vitrine. */
export const FORMAT_FAMILIES = ["flat", "folded"];

/** @returns {object | null} */
export function getFormat(id) {
  return BY_ID.get(id) ?? null;
}

/** Taille d'une feuille imprimée (mm), sans fond perdu ni marge technique. */
export function sheetSize(format, sheet) {
  return {
    width: format.trim.width * sheet.cols,
    height: format.trim.height * sheet.rows,
  };
}

/** Taille de la carte ouverte à plat (mm) : la plus grande feuille. */
export function openSize(format) {
  return format.sheets.reduce(
    (size, sheet) => {
      const { width, height } = sheetSize(format, sheet);
      return { width: Math.max(size.width, width), height: Math.max(size.height, height) };
    },
    { width: 0, height: 0 },
  );
}

/** « 148 × 210 mm » */
export function formatDimensions({ width, height }) {
  return `${width} × ${height} mm`;
}
