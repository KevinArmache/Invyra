"use client";

import { useRef, useState } from "react";
import { Crosshair, Route } from "lucide-react";

import ItineraryMap from "@/components/itinerary/ItineraryMap";
import { Button } from "@/components/ui/button";
import {
  appleMapsLink,
  fullRouteLink,
  googleMapsLink,
  hasCoords,
  wazeLink,
} from "@/lib/itinerary";
import { useTranslation } from "@/lib/i18n/Context";

const APPS = [
  { key: "google", link: googleMapsLink },
  { key: "waze", link: wazeLink },
  { key: "apple", link: appleMapsLink },
];

function scrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

/**
 * Itinéraire vu par un invité : la carte des étapes (si l'hôte les a placées)
 * et, pour chaque étape, de quoi lancer sa navigation dans Google Maps, Waze
 * ou Plans. Toucher un repère met son étape en avant dans la liste.
 */
export default function DirectionsView({ stops }) {
  const { t } = useTranslation();
  const d = (key) => t(`invite.directions.${key}`);
  const [activeId, setActiveId] = useState(stops[0]?.id ?? null);
  const [focus, setFocus] = useState(null);
  const mapRef = useRef(null);
  const items = useRef(new Map());

  const showMap = stops.some(hasCoords);
  const route = fullRouteLink(stops);

  function selectFromMap(id) {
    setActiveId(id);
    items.current.get(id)?.scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
  }

  function showOnMap(stop) {
    setActiveId(stop.id);
    setFocus({ lat: stop.lat, lng: stop.lng });
    mapRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
  }

  return (
    <div
      className={
        showMap
          ? "grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-8"
          : "mx-auto max-w-2xl"
      }
    >
      {showMap && (
        <div ref={mapRef} className="scroll-mt-6 lg:sticky lg:top-6">
          <ItineraryMap
            className="h-72 sm:h-96 lg:h-[70vh]"
            stops={stops}
            activeId={activeId}
            onSelect={selectFromMap}
            focus={focus}
            label={d("map_label")}
          />
        </div>
      )}

      <div className="space-y-4">
        {route && (
          <div className="surface rounded-xl p-5">
            <Button asChild className="h-11 w-full">
              <a href={route} target="_blank" rel="noopener noreferrer">
                <Route />
                {d("full_route")}
              </a>
            </Button>
            <p className="mt-2 text-center text-xs leading-relaxed text-ink-400">
              {d("full_route_hint")}
            </p>
          </div>
        )}

        <ol className="space-y-4">
          {stops.map((stop, index) => {
            const step = d("step").replace("{n}", String(index + 1));
            // Une étape seulement placée sur la carte n'a pas de nom.
            const heading = stop.title || stop.place || stop.address || step;
            const active = stop.id === activeId;
            return (
              <li
                key={stop.id}
                ref={(element) => {
                  if (element) items.current.set(stop.id, element);
                  else items.current.delete(stop.id);
                }}
                className="scroll-mt-6"
              >
                <article
                  className={`surface rounded-xl p-5 transition-shadow duration-300 ${
                    active && showMap ? "ring-1 ring-gold/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      data-numeric
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/5 text-sm text-gold"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow text-ink-400" data-numeric>
                        {[step, stop.time].filter(Boolean).join(" · ")}
                      </p>
                      <h2 className="mt-1 font-display text-xl leading-snug wrap-break-word text-ink-50">
                        {heading}
                      </h2>
                      {stop.title && stop.place && (
                        <p className="mt-1 text-sm wrap-break-word text-ink-100">{stop.place}</p>
                      )}
                      {stop.address && stop.address !== heading && (
                        <p className="mt-0.5 text-sm wrap-break-word text-ink-400">
                          {stop.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {APPS.map((app) => (
                      <Button key={app.key} asChild variant="outline" size="sm">
                        <a
                          href={app.link(stop)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={d("open_with")
                            .replace("{place}", heading)
                            .replace("{app}", d(app.key))}
                        >
                          {d(app.key)}
                        </a>
                      </Button>
                    ))}
                  </div>

                  {showMap && hasCoords(stop) && (
                    <button
                      type="button"
                      onClick={() => showOnMap(stop)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-300 transition-colors hover:text-gold"
                    >
                      <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                      {d("show_on_map")}
                    </button>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
