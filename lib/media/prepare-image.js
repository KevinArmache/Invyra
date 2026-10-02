/**
 * Prépare une photo avant son envoi : quelle que soit sa taille d'origine,
 * elle repart légère et à une définition raisonnable.
 *
 * - le grand côté est ramené à 2000 px, assez pour un plein écran en haute
 *   densité ;
 * - ré-encodage en JPEG, lu partout : invitations, e-mails (Outlook ignore le
 *   WebP et l'AVIF), aperçus de lien ;
 * - l'orientation enregistrée par l'appareil photo (EXIF) est appliquée.
 *
 * Un PNG, qui peut être transparent, reste un PNG tant qu'il tient dans la
 * limite. Un GIF n'est jamais retouché : le canvas perdrait l'animation.
 *
 * Erreurs : `type` (fichier illisible ou format refusé) et `size`.
 *
 * Navigateur uniquement (canvas, createImageBitmap).
 */

/** Poids maximal du fichier choisi, avant compression. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

/** Poids maximal envoyé (voir app/api/upload/route.js). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const MAX_DIMENSION = 2000;

/** En dessous, une image JPEG ou PNG déjà à la bonne taille part telle quelle. */
const LIGHT_BYTES = 1.5 * 1024 * 1024;
const PASSTHROUGH_TYPES = new Set(["image/jpeg", "image/png"]);

const JPEG_QUALITIES = [0.85, 0.72];

/** Image décodée, dessinable dans un canvas. */
async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Format que createImageBitmap ne lit pas : on retente avec <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * @param {File} file  image choisie, déposée ou collée
 * @returns {Promise<File>} le fichier à envoyer
 */
export async function prepareImage(file) {
  // Un SVG peut embarquer du script : il n'est jamais accepté.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("type");
  }
  if (file.size > MAX_SOURCE_BYTES) throw new Error("size");

  if (file.type === "image/gif") {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("size");
    return file;
  }

  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error("type");
  }
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  if (!width || !height) throw new Error("type");

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  if (
    scale === 1 &&
    file.size <= LIGHT_BYTES &&
    PASSTHROUGH_TYPES.has(file.type)
  ) {
    source.close?.();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();

  const name = file.name.replace(/\.[^.]*$/, "") || "image";

  if (file.type === "image/png") {
    const png = await toBlob(canvas, "image/png");
    if (png && png.size <= MAX_UPLOAD_BYTES) {
      return new File([png], `${name}.png`, { type: "image/png" });
    }
  }

  // Le JPEG n'a pas de transparence : un fond blanc plutôt que noir.
  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (const quality of JPEG_QUALITIES) {
    const jpeg = await toBlob(canvas, "image/jpeg", quality);
    if (jpeg && jpeg.size <= MAX_UPLOAD_BYTES) {
      return new File([jpeg], `${name}.jpg`, { type: "image/jpeg" });
    }
  }
  throw new Error("size");
}
