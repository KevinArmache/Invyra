"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchRecipients } from "@/app/actions/campaign";
import { useTranslation } from "@/lib/i18n/Context";

/** Un compte peut recevoir l'e-mail : actif et abonné aux nouveautés. */
export function canReceive(user) {
  return Boolean(user && user.marketingEmails && !user.suspended);
}

/** Pastille du compte : initiale, nom, adresse. */
function Identity({ user }) {
  const label = user.name || user.email;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold"
      >
        {label.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm text-ink-100">{label}</span>
        {user.name && (
          <span className="block truncate text-xs text-ink-400">{user.email}</span>
        )}
      </span>
    </span>
  );
}

/**
 * Choix d'une personne à qui écrire : recherche par nom ou adresse (les
 * derniers inscrits sans recherche). Un compte désabonné ou suspendu reste
 * affiché, grisé, avec la raison : l'admin comprend pourquoi il manque.
 *
 * @param {object|null} props.value     compte choisi
 * @param {(user: object|null) => void} props.onChange
 * @param {string} [props.initialQuery]  recherche de départ
 */
export default function RecipientPicker({ value, onChange, initialQuery = "" }) {
  const { t } = useTranslation();
  const inputId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const requestRef = useRef(0);

  // Recherche après une courte pause de frappe ; seule la dernière réponse
  // compte, une réponse plus lente ne remplace pas une plus récente.
  useEffect(() => {
    if (value) return;
    const request = ++requestRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchRecipients(query);
        if (request === requestRef.current) setResults(users);
      } catch {
        if (request === requestRef.current) setResults([]);
      } finally {
        if (request === requestRef.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, value]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2.5">
        <Identity user={value} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          className="h-8 w-8 shrink-0 text-ink-400 hover:text-ink-50"
          aria-label={t("portal.campaigns.person_remove").replace(
            "{name}",
            value.name || value.email,
          )}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="sr-only">
        {t("portal.campaigns.person_search_label")}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("portal.campaigns.person_search_placeholder")}
          autoComplete="off"
          className="pl-9"
        />
        {loading && (
          <Loader2
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-ink-400"
            aria-hidden="true"
          />
        )}
      </div>

      <ul
        aria-label={t("portal.campaigns.person_search_label")}
        aria-busy={loading}
        className="max-h-72 space-y-1 overflow-y-auto"
      >
        {!loading && results.length === 0 && (
          <li className="px-1 py-2 text-xs text-ink-400">
            {t("portal.campaigns.person_none")}
          </li>
        )}
        {results.map((user) => {
          const allowed = canReceive(user);
          return (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => allowed && onChange(user)}
                disabled={!allowed}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors hover:border-gold/30 hover:bg-ink-800/50 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-transparent disabled:hover:bg-transparent"
              >
                <Identity user={user} />
                {!allowed && (
                  <span className="shrink-0 rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-ink-400">
                    {user.suspended
                      ? t("portal.campaigns.person_suspended")
                      : t("portal.campaigns.person_opted_out")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
