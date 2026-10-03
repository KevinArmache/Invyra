"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  LocateFixed,
  MapPin,
  MapPinOff,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import ItineraryMap from "@/components/itinerary/ItineraryMap";
import PlaceSearch from "@/components/itinerary/PlaceSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reversePlace } from "@/lib/geocoding";
import {
  MAX_STOPS,
  distanceMeters,
  emptyStop,
  hasCoords,
  newStopId,
} from "@/lib/itinerary";
import { useTranslation } from "@/lib/i18n/Context";

/** Au-delà de ce déplacement, l'adresse suit le repère. */
const READDRESS_METERS = 200;

/** Zoom de la carte sur la position de l'hôte. */
const LOCATION_ZOOM = 17;

const round = (value) => Math.round(value * 1e6) / 1e6;

/**
 * Itinéraire de l'événement dans le formulaire de création et d'édition :
 * une liste d'étapes (cérémonie, réception…) et une carte.
 *
 * Une étape est « active » : la recherche, le clic sur la carte et « Ma
 * position » la placent. Un repère se déplace en le faisant glisser ;
 * l'adresse est alors retrouvée, sauf si l'hôte l'a saisie et que le repère
 * n'a que peu bougé. Tout reste modifiable à la main, carte ou pas.
 *
 * Les étapes partent dans le champ caché `itinerary` (JSON), lu avec les
 * autres champs du formulaire ; le serveur les valide (lib/itinerary.js).
 */
export default function ItineraryField({ defaultStops }) {
  const { t, locale } = useTranslation();
  const k = (key) => t(`portal.events.itinerary.${key}`);
  const baseId = useId();
  const [stops, setStops] = useState(() =>
    defaultStops?.length ? defaultStops : [emptyStop()],
  );
  const [activeId, setActiveId] = useState(() => defaultStops?.[0]?.id ?? "s1");
  const [focus, setFocus] = useState(null);
  const [locating, setLocating] = useState(false);
  const view = useRef(null);
  const mapRef = useRef(null);
  const lookups = useRef(new Map());

  useEffect(() => {
    const pending = lookups.current;
    return () => pending.forEach((controller) => controller.abort());
  }, []);

  const activeIndex = Math.max(0, stops.findIndex((stop) => stop.id === activeId));
  const active = stops[activeIndex];
  const step = String(activeIndex + 1);

  function update(id, changes) {
    setStops((current) =>
      current.map((stop) => (stop.id === id ? { ...stop, ...changes } : stop)),
    );
  }

  /** Adresse d'un point que l'hôte vient de placer. */
  async function lookUpAddress(id, position, previous) {
    lookups.current.get(id)?.abort();
    const controller = new AbortController();
    lookups.current.set(id, controller);

    let place = null;
    try {
      place = await reversePlace(position, { locale, signal: controller.signal });
    } catch {
      // Service indisponible : l'adresse reste à saisir.
    }
    if (!place || controller.signal.aborted) return;

    const moved =
      !hasCoords(previous) || distanceMeters(previous, position) > READDRESS_METERS;
    setStops((current) =>
      current.map((stop) =>
        stop.id === id
          ? {
              ...stop,
              place: stop.place || place.place,
              address:
                !stop.address || moved ? place.address || place.place : stop.address,
            }
          : stop,
      ),
    );
  }

  function placeStop(stop, position) {
    const rounded = { lat: round(position.lat), lng: round(position.lng) };
    update(stop.id, rounded);
    setActiveId(stop.id);
    lookUpAddress(stop.id, rounded, stop);
  }

  function chooseSearchResult(place) {
    update(active.id, {
      place: place.place,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    });
    setFocus({ lat: place.lat, lng: place.lng });
  }

  function locateMe() {
    if (!navigator.geolocation) {
      toast.error(k("location_unavailable"));
      return;
    }
    const target = active;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        const position = { lat: coords.latitude, lng: coords.longitude };
        placeStop(target, position);
        setFocus({ ...position, zoom: LOCATION_ZOOM });
      },
      (error) => {
        setLocating(false);
        toast.error(
          k(error.code === error.PERMISSION_DENIED ? "location_denied" : "location_unavailable"),
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function addStop() {
    if (stops.length >= MAX_STOPS) return;
    const stop = emptyStop(newStopId());
    setStops((current) => [...current, stop]);
    setActiveId(stop.id);
  }

  function removeStop(id) {
    lookups.current.get(id)?.abort();
    const index = stops.findIndex((stop) => stop.id === id);
    if (stops.length === 1) {
      // La dernière étape est vidée, pas retirée : le formulaire en garde une.
      setStops([emptyStop(id)]);
      return;
    }
    const neighbour = stops[index + 1] ?? stops[index - 1];
    setStops((current) => current.filter((stop) => stop.id !== id));
    if (activeId === id) setActiveId(neighbour.id);
  }

  function moveStop(id, offset) {
    setStops((current) => {
      const from = current.findIndex((stop) => stop.id === id);
      const to = from + offset;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  /** Rend la main à la carte pour placer une étape sans repère. */
  function pinOnMap(id) {
    setActiveId(id);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="itinerary" value={JSON.stringify(stops)} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <PlaceSearch
            onSelect={chooseSearchResult}
            getNear={() => (view.current?.zoom >= 5 ? view.current : null)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={locateMe}
          disabled={locating}
          className="shrink-0"
        >
          {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
          {k("use_location")}
        </Button>
      </div>

      <div ref={mapRef} className="scroll-mt-24">
        <ItineraryMap
          className="h-64 sm:h-80"
          stops={stops}
          activeId={active.id}
          editable
          onPick={(position) => placeStop(active, position)}
          onMove={(id, position) => {
            const stop = stops.find((item) => item.id === id);
            if (stop) placeStop(stop, position);
          }}
          onSelect={setActiveId}
          onView={(value) => {
            view.current = value;
          }}
          focus={focus}
          label={k("map_label")}
        />
        <p className="mt-2 text-xs leading-relaxed text-ink-400">
          {k("map_hint").replace("{n}", step)}
        </p>
      </div>

      <ol className="space-y-3">
        {stops.map((stop, index) => {
          const isActive = stop.id === active.id;
          const id = (field) => `${baseId}-${stop.id}-${field}`;
          return (
            <li
              key={stop.id}
              onFocusCapture={() => setActiveId(stop.id)}
              onPointerDown={() => setActiveId(stop.id)}
              aria-current={isActive ? "step" : undefined}
              className={`rounded-xl border p-4 transition-colors duration-300 ${
                isActive ? "border-gold/40 bg-gold/5" : "border-border/60 bg-ink-800/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-sm text-ink-100">
                  <span
                    data-numeric
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-gold text-ink-900"
                        : "border border-ink-600 text-ink-300"
                    }`}
                  >
                    {index + 1}
                  </span>
                  {k("stop_number").replace("{n}", String(index + 1))}
                </span>
                <span className="flex shrink-0 items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-ink-400 hover:text-ink-50"
                    onClick={() => moveStop(stop.id, -1)}
                    disabled={index === 0}
                    aria-label={k("move_up")}
                    title={k("move_up")}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-ink-400 hover:text-ink-50"
                    onClick={() => moveStop(stop.id, 1)}
                    disabled={index === stops.length - 1}
                    aria-label={k("move_down")}
                    title={k("move_down")}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-ink-400 hover:text-destructive"
                    onClick={() => removeStop(stop.id)}
                    aria-label={k("remove_stop")}
                    title={k("remove_stop")}
                  >
                    <Trash2 />
                  </Button>
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <div className="space-y-1.5">
                  <Label htmlFor={id("title")} className="text-xs font-normal text-ink-400">
                    {k("stop_title")}
                  </Label>
                  <Input
                    id={id("title")}
                    value={stop.title}
                    maxLength={60}
                    onChange={(event) => update(stop.id, { title: event.target.value })}
                    placeholder={k("stop_title_placeholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={id("time")} className="text-xs font-normal text-ink-400">
                    {k("stop_time")}
                  </Label>
                  <Input
                    id={id("time")}
                    type="time"
                    value={stop.time}
                    onChange={(event) => update(stop.id, { time: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={id("place")} className="text-xs font-normal text-ink-400">
                    {k("stop_place")}
                  </Label>
                  <Input
                    id={id("place")}
                    value={stop.place}
                    maxLength={150}
                    onChange={(event) => update(stop.id, { place: event.target.value })}
                    placeholder={k("stop_place_placeholder")}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={id("address")} className="text-xs font-normal text-ink-400">
                    {k("stop_address")}
                  </Label>
                  <Input
                    id={id("address")}
                    value={stop.address}
                    maxLength={300}
                    onChange={(event) => update(stop.id, { address: event.target.value })}
                    placeholder={k("stop_address_placeholder")}
                  />
                </div>
              </div>

              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-400">
                {hasCoords(stop) ? (
                  <>
                    <MapPin className="h-3.5 w-3.5 text-gold/80" aria-hidden="true" />
                    {k("pin_set")}
                    <button
                      type="button"
                      onClick={() => update(stop.id, { lat: null, lng: null })}
                      className="text-ink-300 underline-offset-4 hover:text-ink-50 hover:underline"
                    >
                      {k("clear_pin")}
                    </button>
                  </>
                ) : (
                  <>
                    <MapPinOff className="h-3.5 w-3.5" aria-hidden="true" />
                    {k("pin_missing")}
                    <button
                      type="button"
                      onClick={() => pinOnMap(stop.id)}
                      className="text-gold underline-offset-4 hover:underline"
                    >
                      {k("pin_on_map")}
                    </button>
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStop}
          disabled={stops.length >= MAX_STOPS}
        >
          <Plus />
          {k("add_stop")}
        </Button>
        {stops.length >= MAX_STOPS && (
          <p className="text-xs text-ink-400">
            {k("max_stops").replace("{count}", String(MAX_STOPS))}
          </p>
        )}
      </div>
    </div>
  );
}
