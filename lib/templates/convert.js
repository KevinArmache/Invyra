import { normalizeDesignConfig, renderDesign } from "@/lib/invitation/designs";
import { RSVP_SCRIPT } from "@/lib/invitation/rsvp";
import { CODE_TYPE } from "@/lib/templates/config";

/**
 * Convertit un modèle design en modèle code équivalent, pour qu'un admin
 * puisse le retoucher à la main.
 *
 * Les valeurs propres à un événement (date, lieu, compte à rebours…) sont
 * rendues sous forme de jetons, pour que le code reste valable pour
 * n'importe quel événement.
 */
export function designToCode(config) {
  const normalized = normalizeDesignConfig(config);
  const rendered = renderDesign(normalized, {
    details: [
      { icon: "📅", key: "date", value: "{{EVENT_DATE}}" },
      { icon: "⏰", key: "time", value: "{{TIME}}" },
      { icon: "📍", key: "location", value: "{{EVENT_LOCATION}}" },
      { icon: "👗", key: "dressCode", value: "{{DRESS_CODE}}" },
    ],
    eventDate: "{{COUNTDOWN_DATE}}",
  });
  return {
    type: CODE_TYPE,
    html: rendered.html.trim(),
    css: rendered.css.trim(),
    js: [RSVP_SCRIPT, rendered.js, rendered.staticJs]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n\n"),
    fonts: rendered.fonts,
    opening: normalized.content.opening,
    // Un design qui a sa propre ouverture la garde une fois passé en code.
    openingCode: rendered.openingCode ?? null,
    music: normalized.music,
  };
}
