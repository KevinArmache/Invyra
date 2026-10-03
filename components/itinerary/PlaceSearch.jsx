"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { MIN_QUERY_LENGTH, searchPlaces } from "@/lib/geocoding";
import { useTranslation } from "@/lib/i18n/Context";

/** Attente après la dernière frappe avant d'interroger le service. */
const DEBOUNCE_MS = 300;

/**
 * Recherche d'un lieu avec suggestions (lib/geocoding.js), au clavier
 * (↑ ↓ Entrée Échap) comme au toucher.
 *
 * Le champ vit dans le formulaire de l'événement : Entrée choisit une
 * suggestion et ne soumet jamais le formulaire.
 *
 * @param {(place) => void} props.onSelect  lieu choisi :
 *   { place, address, lat, lng }
 * @param {() => ({ lat, lng }|null)} [props.getNear]  position autour de
 *   laquelle favoriser les résultats
 */
export default function PlaceSearch({ onSelect, getNear }) {
  const { t, locale } = useTranslation();
  const k = (key) => t(`portal.events.itinerary.${key}`);
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const timer = useRef(null);
  const request = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      request.current?.abort();
    },
    [],
  );

  function search(value) {
    setQuery(value);
    setOpen(true);
    setHighlighted(-1);
    clearTimeout(timer.current);
    request.current?.abort();

    const q = value.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus("idle");
      return;
    }

    setStatus("searching");
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      try {
        const places = await searchPlaces(q, {
          locale,
          near: getNear?.() ?? null,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setResults(places);
        setStatus("done");
      } catch (error) {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        console.warn("[PlaceSearch] Recherche impossible :", error);
        setResults([]);
        setStatus("error");
      }
    }, DEBOUNCE_MS);
  }

  function choose(place) {
    onSelect(place);
    setQuery("");
    setResults([]);
    setStatus("idle");
    setOpen(false);
    setHighlighted(-1);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      const place = results[highlighted] ?? results[0];
      if (open && place) choose(place);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setHighlighted((current) =>
        event.key === "ArrowDown"
          ? Math.min(current + 1, results.length - 1)
          : Math.max(current - 1, 0),
      );
      return;
    }
    if (event.key === "Escape" && (open || query)) {
      event.preventDefault();
      if (open && results.length > 0) setOpen(false);
      else search("");
    }
  }

  const expanded = open && results.length > 0;
  const message =
    status === "error"
      ? k("search_unavailable")
      : status === "done" && results.length === 0
        ? k("no_results")
        : "";

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        {k("search_label")}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
      <Input
        id={inputId}
        type="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          expanded && highlighted >= 0 ? `${listId}-${highlighted}` : undefined
        }
        autoComplete="off"
        enterKeyHint="search"
        value={query}
        onChange={(event) => search(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={k("search_placeholder")}
        className="pr-9 pl-9"
      />
      {status === "searching" && (
        <Loader2
          className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-ink-400"
          aria-hidden="true"
        />
      )}

      <ul
        id={listId}
        role="listbox"
        aria-label={k("search_label")}
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-elevation-2"
      >
        {results.map((place, index) => (
          <li
            key={place.key}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === highlighted}
            // Le champ garde la main : sinon il se fermerait avant le clic.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(place)}
            onMouseEnter={() => setHighlighted(index)}
            className={`flex cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
              index === highlighted ? "bg-ink-800" : ""
            }`}
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-ink-50">{place.place}</span>
              {place.address && (
                <span className="block truncate text-xs text-ink-400">{place.address}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <p aria-live="polite" className={message ? "mt-1.5 text-xs text-ink-400" : "sr-only"}>
        {status === "searching" ? k("searching") : message}
      </p>
    </div>
  );
}
