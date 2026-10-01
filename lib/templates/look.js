import { safeUrl } from "@/lib/invitation/html";
import { decodeText, scanSource } from "@/lib/templates/visual-edit";

const BACKGROUND_VARIABLE = /--c-background\s*:\s*(#[0-9a-fA-F]{6})\b/;

/**
 * Couleur de fond et photo principale d'un modèle, lues dans son code :
 * elles servent à la transition vers l'invitation, à l'aperçu du lien
 * (Open Graph) et à l'e-mail d'invitation.
 *
 * - fond : la variable CSS `--c-background`, si le modèle en déclare une ;
 * - photo : la première image du HTML (`src`, `poster` ou `url(…)` d'un
 *   attribut `style`), en https. C'est en pratique la photo d'en-tête.
 *
 * @returns {{ background: string | null, image: string | null }}
 */
export function templateLook(config) {
  const background =
    BACKGROUND_VARIABLE.exec(config?.css ?? "")?.[1]?.toLowerCase() ?? null;

  let image = null;
  for (const slot of scanSource("html", config?.html ?? "")) {
    if (slot.kind !== "url" || slot.attribute === "href") continue;
    // Dans un attribut style, l'URL est échappée (&quot;…&amp;…&quot;).
    const url = safeUrl(decodeText(slot.value).trim().replace(/^["']|["']$/g, ""));
    if (url) {
      image = url;
      break;
    }
  }

  return { background, image };
}
