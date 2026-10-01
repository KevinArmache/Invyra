"use client";

import { useEffect } from "react";

/**
 * Le seul script d'animation du site. Monté une fois dans le layout racine,
 * il ne rend rien : tout le mouvement est en CSS (globals.css), ce composant
 * ne fait que dire au CSS ce qu'il ne peut pas savoir seul.
 *
 * - `[data-reveal]` : reçoit `data-visible` en entrant dans la fenêtre, une
 *   fois pour toutes.
 * - `[data-loop]` : reçoit `data-inview="true|false"`, pour que les boucles
 *   infinies (scènes, bandeau défilant) s'arrêtent hors écran.
 * - `.spotlight` : reçoit `--mx` / `--my`, la position du pointeur.
 * - `.tilt` : reçoit `--rx` / `--ry`, une légère inclinaison vers le pointeur.
 *
 * Des attributs plutôt que des classes : React réécrit `className` quand un
 * composant se met à jour, il laisse les attributs qu'il ne gère pas.
 *
 * Les nœuds ajoutés après coup (navigation côté client, filtres, dialogues)
 * sont suivis par un MutationObserver.
 */

const REVEAL = "[data-reveal]";
const LOOP = "[data-loop]";
/** Inclinaison maximale, en degrés. */
const MAX_TILT = 5;

export default function MotionRoot() {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ── Révélation ────────────────────────────────────────────────────
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-visible", "");
          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    // ── Boucles ───────────────────────────────────────────────────────
    const loopObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.setAttribute(
            "data-inview",
            entry.isIntersecting ? "true" : "false",
          );
        }
      },
      { rootMargin: "120px 0px" },
    );

    function track(node) {
      if (!(node instanceof Element)) return;
      const reveals = node.matches(REVEAL)
        ? [node, ...node.querySelectorAll(REVEAL)]
        : node.querySelectorAll(REVEAL);
      for (const element of reveals) {
        if (element.hasAttribute("data-visible")) continue;
        if (reduceMotion) element.setAttribute("data-visible", "");
        else revealObserver.observe(element);
      }
      const loops = node.matches(LOOP)
        ? [node, ...node.querySelectorAll(LOOP)]
        : node.querySelectorAll(LOOP);
      for (const element of loops) loopObserver.observe(element);
    }

    track(document.body);
    root.setAttribute("data-motion", "ready");

    // Les ajouts sont traités par lot, une fois par image : l'éditeur de
    // code, par exemple, insère des nœuds à chaque frappe.
    let added = new Set();
    let batch = 0;
    function flush() {
      batch = 0;
      const nodes = added;
      added = new Set();
      for (const node of nodes) {
        if (node.isConnected && !node.closest(".monaco-editor")) track(node);
      }
    }
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) added.add(node);
        }
      }
      if (added.size > 0 && !batch) batch = requestAnimationFrame(flush);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    // ── Pointeur ──────────────────────────────────────────────────────
    // Seulement avec une souris ou un pavé : au doigt, il n'y a pas de
    // survol, et une carte inclinée sous le pouce gênerait le défilement.
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    let frame = 0;
    let pending = null;
    let tilted = null;

    function resetTilt(element) {
      element.style.setProperty("--rx", "0deg");
      element.style.setProperty("--ry", "0deg");
    }

    function applyPointer() {
      frame = 0;
      if (!pending) return;
      const { x, y, target } = pending;
      pending = null;

      const spotlight = target.closest?.(".spotlight");
      if (spotlight) {
        const box = spotlight.getBoundingClientRect();
        spotlight.style.setProperty("--mx", `${x - box.left}px`);
        spotlight.style.setProperty("--my", `${y - box.top}px`);
      }

      const tilt = target.closest?.(".tilt");
      if (tilted && tilted !== tilt) resetTilt(tilted);
      tilted = tilt ?? null;
      if (tilt) {
        const box = tilt.getBoundingClientRect();
        const ratioX = (x - box.left) / box.width - 0.5;
        const ratioY = (y - box.top) / box.height - 0.5;
        tilt.style.setProperty("--ry", `${(ratioX * MAX_TILT * 2).toFixed(2)}deg`);
        tilt.style.setProperty("--rx", `${(-ratioY * MAX_TILT * 2).toFixed(2)}deg`);
      }
    }

    function handlePointer(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      pending = { x: event.clientX, y: event.clientY, target: event.target };
      if (!frame) frame = requestAnimationFrame(applyPointer);
    }

    // Le pointeur quitte la fenêtre : `relatedTarget` est alors vide.
    function handleOut(event) {
      if (event.relatedTarget) return;
      if (tilted) resetTilt(tilted);
      tilted = null;
    }

    if (finePointer && !reduceMotion) {
      document.addEventListener("pointermove", handlePointer, { passive: true });
      document.addEventListener("pointerout", handleOut);
    }

    return () => {
      revealObserver.disconnect();
      loopObserver.disconnect();
      mutations.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (batch) cancelAnimationFrame(batch);
      document.removeEventListener("pointermove", handlePointer);
      document.removeEventListener("pointerout", handleOut);
      root.removeAttribute("data-motion");
    };
  }, []);

  return null;
}
