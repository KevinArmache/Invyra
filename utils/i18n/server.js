import "server-only";

import { cookies, headers } from "next/headers";

import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
  translate,
} from "./config";

const DICTIONARIES = { fr, en };

/**
 * La langue vient du cookie posé par le sélecteur ; à la première visite on
 * retombe sur l'en-tête Accept-Language, puis sur le français.
 *
 * Elle est résolue côté serveur pour que le HTML parte déjà traduit : avec un
 * dictionnaire chargé dans un effet client, la page s'affiche d'abord avec les
 * clés brutes.
 */
export async function getLocale() {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie) return normalizeLocale(fromCookie);

  const acceptLanguage = (await headers()).get("accept-language");
  if (acceptLanguage) return normalizeLocale(acceptLanguage.split(",")[0]);

  return DEFAULT_LOCALE;
}

export function getDictionary(locale) {
  return DICTIONARIES[normalizeLocale(locale)] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Équivalent serveur de useTranslation(). Même signature de `t`, pour qu'un
 * composant puisse passer de client à serveur sans réécrire ses appels.
 */
export async function getTranslations() {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return {
    locale,
    dictionary,
    t: (key) => translate(dictionary, key),
  };
}
