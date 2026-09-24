"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";

import { LOCALE_COOKIE, normalizeLocale, translate } from "./config";

const I18nContext = createContext(null);

/**
 * Le dictionnaire arrive déjà résolu depuis le layout racine (Server
 * Component). Le contexte ne charge donc rien : il ne fait que distribuer aux
 * composants clients ce que le serveur a déjà calculé, ce qui supprime
 * l'affichage transitoire des clés brutes au montage.
 */
export function I18nProvider({ locale, dictionary, children }) {
  const router = useRouter();

  const changeLocale = useCallback(
    (nextLocale) => {
      const safe = normalizeLocale(nextLocale);
      // Un an, sur tout le site. `SameSite=Lax` suffit : aucun enjeu de
      // sécurité, c'est une préférence d'affichage.
      document.cookie = `${LOCALE_COOKIE}=${safe}; path=/; max-age=31536000; samesite=lax`;
      // refresh() rejoue le rendu serveur avec la nouvelle langue sans perdre
      // l'état client de la page.
      router.refresh();
    },
    [router],
  );

  const value = useMemo(
    () => ({
      locale,
      changeLocale,
      t: (key) => translate(dictionary, key),
      isReady: true,
    }),
    [locale, dictionary, changeLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation doit être utilisé dans un I18nProvider");
  }
  return context;
}
