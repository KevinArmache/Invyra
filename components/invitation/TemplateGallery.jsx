"use client";

import { Check, LayoutTemplate } from "lucide-react";

import { EmptyState } from "@/components/dashboard/ui";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import { useTranslation } from "@/utils/i18n/Context";

const SAMPLE_EVENT = {
  title: "Votre événement",
  eventDate: "2027-06-12T00:00:00.000Z",
  location: "Lieu de réception",
  time: "19:00",
  dressCode: "Tenue de soirée",
};

/**
 * Galerie de modèles réutilisables.
 *
 * Les modèles sont passés en propriété par le Server Component parent : la
 * galerie allait auparavant les chercher elle-même au montage, ce qui
 * affichait « Chargement… » à chaque ouverture de l'onglet.
 */
export default function TemplateGallery({ templates, selectedId, onSelect }) {
  const { t } = useTranslation();

  if (!templates || templates.length === 0) {
    return (
      <EmptyState
        icon={LayoutTemplate}
        title={t("portal.events.new.no_templates")}
        description={t("portal.templates.list.no_templates_desc")}
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {templates.map((template) => {
        const isSelected = selectedId === template.id;

        return (
          <li key={template.id}>
            <button
              type="button"
              onClick={() => onSelect(template.id, template.config)}
              aria-pressed={isSelected}
              className={`relative aspect-3/4 w-full overflow-hidden rounded-md border bg-ink-900 text-left transition-colors ${
                isSelected
                  ? "border-gold"
                  : "border-border hover:border-gold/40"
              }`}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-1/2"
                style={{
                  width: "250%",
                  height: "250%",
                  transform: "translateX(-50%) scale(0.4)",
                  transformOrigin: "top center",
                }}
              >
                <InvitationPreview
                  template={template.config}
                  event={SAMPLE_EVENT}
                  guestName="Marie Dupont"
                  readOnly
                />
              </div>

              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900 via-ink-900/85 to-transparent px-2.5 pt-6 pb-2.5">
                <span className="block truncate text-xs text-ink-100">
                  {template.name}
                </span>
              </span>

              {isSelected && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold">
                  <Check
                    className="h-3 w-3 text-primary-foreground"
                    strokeWidth={3}
                  />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
