import { safeUrl } from "@/lib/invitation/html";
import { decodeUrl, scanCss, scanSource } from "@/lib/templates/visual-edit";

const BACKGROUND_VARIABLE = /--c-background\s*:\s*(#[0-9a-fA-F]{6})\b/;
const ACCENT_VARIABLE = /--c-accent\s*:\s*(#[0-9a-fA-F]{6})\b/;

/** Couleur de repli quand le modèle ne laisse deviner aucun accent. */
const NEUTRAL_ACCENT = "#8a8580";

/** Saturation et luminosité (0–1) d'une couleur #rrggbb. */
function hsl(hex) {
  const [r, g, b] = [1, 3, 5].map(
    (index) => parseInt(hex.slice(index, index + 2), 16) / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const saturation =
    max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
  return { saturation, lightness };
}

/**
 * Couleur d'accent d'un modèle qui ne déclare pas de variable --c-accent :
 * la couleur franche (ni grise, ni presque noire ou blanche) la
 * plus utilisée dans son CSS.
 */
export function accentFromCss(css) {
  const counts = new Map();
  for (const slot of scanCss(css)) {
    if (slot.kind !== "color") continue;
    const value = slot.value.toLowerCase();
    const hex =
      value.length === 4
        ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
        : value;
    const { saturation, lightness } = hsl(hex);
    if (saturation < 0.25 || lightness < 0.2 || lightness > 0.85) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  let best = null;
  for (const [hex, count] of counts) {
    if (!best || count > best.count) best = { hex, count };
  }
  return best?.hex ?? NEUTRAL_ACCENT;
}

/**
 * Couleur de fond, couleur d'accent et photo principale d'un modèle, lues
 * dans son code : elles servent à la transition vers l'invitation, au
 * panneau de réponse, à l'aperçu du lien (Open Graph) et à l'e-mail
 * d'invitation.
 *
 * - fond : la variable CSS `--c-background`, si le modèle en déclare une ;
 * - accent : la variable `--c-accent`, sinon la couleur franche la plus
 *   utilisée du CSS (voir accentFromCss) ;
 * - photo : la première image du HTML (`src`, `poster` ou `url(…)` d'un
 *   attribut `style`), en https. C'est en pratique la photo d'en-tête.
 *
 * @returns {{ background: string | null, accent: string, image: string | null }}
 */
export function templateLook(config) {
  const css = config?.css ?? "";
  const background = BACKGROUND_VARIABLE.exec(css)?.[1]?.toLowerCase() ?? null;
  const accent =
    ACCENT_VARIABLE.exec(css)?.[1]?.toLowerCase() ?? accentFromCss(css);

  let image = null;
  for (const slot of scanSource("html", config?.html ?? "")) {
    if (slot.kind !== "url" || slot.attribute === "href") continue;
    // Dans un attribut style, l'URL est échappée (&quot;…&amp;…&quot;).
    const url = safeUrl(decodeUrl(slot.value, true));
    if (url) {
      image = url;
      break;
    }
  }

  return { background, accent, image };
}
