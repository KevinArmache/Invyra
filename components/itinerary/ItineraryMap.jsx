"use client";

import dynamic from "next/dynamic";

/**
 * Carte d'itinéraire, chargée seulement dans le navigateur : Leaflet a
 * besoin de `window`. Mêmes propriétés que LeafletMap.
 *
 * Le cadre isole les couches de Leaflet (z-index jusqu'à 1000) : menus,
 * fenêtres et en-tête restent au-dessus de la carte.
 */
const LeafletMap = dynamic(() => import("@/components/itinerary/LeafletMap"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full" aria-hidden="true" />,
});

export default function ItineraryMap({ className = "", ...props }) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-xl border border-border/60 bg-ink-850 ${className}`}
    >
      <LeafletMap {...props} />
    </div>
  );
}
