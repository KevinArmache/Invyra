"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "invyra_sidebar_collapsed";

/**
 * Préférence « panneau replié », conservée dans localStorage.
 *
 * Lue via `useSyncExternalStore` et non dans un effet : localStorage est un
 * magasin extérieur à React, et le lire dans un `useEffect` puis appeler
 * `setState` provoque un rendu en cascade à chaque montage. Cette API est
 * faite exactement pour ce cas, et elle prend en charge le rendu serveur par
 * son troisième argument.
 *
 * Bénéfice annexe : l'abonnement à l'événement `storage` synchronise les
 * onglets ouverts sur l'application.
 */

const listeners = new Set();

function subscribe(onChange) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // Navigation privée ou stockage bloqué : la barre reste dépliée.
    return false;
  }
}

// Le serveur ne connaît pas la préférence. Renvoyer `false` fait correspondre
// le premier rendu client au HTML, puis React réconcilie si besoin.
function getServerSnapshot() {
  return false;
}

export function useSidebarCollapsed() {
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(!getSnapshot()));
    } catch {
      // Écriture refusée : on ne peut pas mémoriser, tant pis.
    }
    // `storage` ne se déclenche que sur les *autres* onglets : il faut
    // notifier celui-ci à la main.
    for (const listener of listeners) listener();
  }, []);

  return [isCollapsed, toggle];
}
