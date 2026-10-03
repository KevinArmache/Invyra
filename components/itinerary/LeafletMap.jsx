"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  DEFAULT_VIEW,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  hasCoords,
} from "@/lib/itinerary";

/** Zoom d'une étape seule, ou après une recherche. */
const STOP_ZOOM = 16;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Carte Leaflet des étapes d'un itinéraire : repères numérotés dans l'ordre
 * de la liste, reliés par un tracé en pointillés (à vol d'oiseau : le trajet
 * réel est laissé aux applications de navigation).
 *
 * Navigateur uniquement : chargée par ItineraryMap, sans rendu serveur.
 * Leaflet manipule le DOM lui-même ; React ne fait que lui transmettre les
 * étapes. Aucun texte saisi par l'hôte n'entre dans le HTML des repères.
 *
 * @param {object[]} props.stops  étapes (voir lib/itinerary.js) ; seules
 *   celles qui ont une position apparaissent
 * @param {boolean} [props.editable]  clic sur la carte et repères déplaçables
 * @param {(position) => void} [props.onPick]  clic sur la carte
 * @param {(id, position) => void} [props.onMove]  repère déplacé
 * @param {(id) => void} [props.onSelect]  repère touché
 * @param {(view) => void} [props.onView]  vue changée : { lat, lng, zoom }
 * @param {{ lat, lng, zoom? }} [props.focus]  centre la carte (nouvel objet
 *   à chaque demande)
 */
export default function LeafletMap({
  stops,
  activeId,
  editable = false,
  onPick,
  onMove,
  onSelect,
  onView,
  focus,
  label,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const handlers = useRef({});
  const stopsRef = useRef(stops);

  // Les écouteurs Leaflet sont posés une fois : ils lisent la dernière
  // version des fonctions et des étapes.
  useEffect(() => {
    handlers.current = { onPick, onMove, onSelect, onView, editable };
    stopsRef.current = stops;
  });

  useEffect(() => {
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      worldCopyJump: true,
    });
    map.attributionControl.setPrefix(false);
    L.tileLayer(OSM_TILE_URL, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);

    const points = stopsRef.current.filter(hasCoords).map((stop) => [stop.lat, stop.lng]);
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: STOP_ZOOM });
    else if (points.length === 1) map.setView(points[0], STOP_ZOOM);
    else map.setView([DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], DEFAULT_VIEW.zoom);

    map.on("click", (event) => {
      if (!handlers.current.editable) return;
      handlers.current.onPick?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    });
    map.on("moveend", () => {
      const center = map.getCenter();
      handlers.current.onView?.({ lat: center.lat, lng: center.lng, zoom: map.getZoom() });
    });
    // La molette ne zoome que si la carte a la main : sinon elle bloquerait
    // le défilement de la page.
    map.on("focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    mapRef.current = map;

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Repères et tracé, redessinés à chaque changement d'étape.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const points = [];
    stops.forEach((stop, index) => {
      if (!hasCoords(stop)) return;
      const position = [stop.lat, stop.lng];
      points.push(position);

      const active = stop.id === activeId;
      const marker = L.marker(position, {
        icon: L.divIcon({
          className: `itinerary-pin${active ? " is-active" : ""}`,
          html: `<span>${index + 1}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        draggable: editable,
        keyboard: true,
        // Attribut title : du texte, jamais interprété comme du HTML.
        title: [index + 1, stop.title, stop.place].filter(Boolean).join(" · "),
        zIndexOffset: active ? 1000 : 0,
      });
      marker.on("click", () => handlers.current.onSelect?.(stop.id));
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        handlers.current.onMove?.(stop.id, { lat, lng });
      });
      marker.addTo(layer);
    });

    if (points.length > 1) {
      L.polyline(points, {
        className: "itinerary-route",
        weight: 2,
        dashArray: "6 8",
        interactive: false,
      }).addTo(layer);
    }
  }, [stops, activeId, editable]);

  // Nombre de repères changé : la vue suit (toutes les étapes, ou la seule
  // étape si elle sort du cadre). Déplacer un repère ne bouge pas la carte.
  const pinned = stops.filter(hasCoords).length;
  const previousPinned = useRef(pinned);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || previousPinned.current === pinned) return;
    previousPinned.current = pinned;

    const points = stopsRef.current.filter(hasCoords).map((stop) => [stop.lat, stop.lng]);
    if (points.length > 1) {
      map.fitBounds(points, {
        padding: [40, 40],
        maxZoom: STOP_ZOOM,
        animate: !prefersReducedMotion(),
      });
    } else if (points.length === 1 && !map.getBounds().contains(points[0])) {
      map.panTo(points[0], { animate: !prefersReducedMotion() });
    }
  }, [pinned]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const target = [focus.lat, focus.lng];
    const zoom = focus.zoom ?? STOP_ZOOM;
    if (prefersReducedMotion()) map.setView(target, zoom);
    else map.flyTo(target, zoom, { duration: 0.8 });
  }, [focus]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={label}
      className="itinerary-map h-full w-full"
    />
  );
}
