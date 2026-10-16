"use client";

import { useRef } from "react";

import PaperFace from "@/components/stationery/PaperFace";
import { mainPiece } from "@/lib/print/config";
import styles from "@/components/stationery/PaperCard.module.css";

/**
 * Maquette 3D d'une invitation papier, à partir de ses faces réelles.
 *
 * Trois mécaniques, selon le format (lib/print/formats.js, champ `mockup`) :
 * - « flat » : carte plate, `flipped` la retourne sur son verso ;
 * - « book » : carte pliée, `open` ouvre la couverture comme un livre ;
 * - « tent » : carte pliée en haut, `open` fait basculer la couverture.
 *
 * La scène réserve la place de la carte ouverte : ouverte, la carte glisse
 * pour que les deux volets restent centrés. Avec `interactive`, elle
 * s'incline sous le pointeur et un reflet de lumière la parcourt.
 *
 * @param {string} [props.paper]  papier (lib/print/options.js) : grain et teinte
 * @param {string} props.label    description de la carte, pour les lecteurs d'écran
 */
export default function PaperCard({
  config,
  event,
  guestName = "",
  qr = null,
  paper = "matte",
  open = false,
  flipped = false,
  interactive = false,
  animated = true,
  lazy = true,
  rounded = false,
  label,
  className = "",
}) {
  const stageRef = useRef(null);
  const { format } = mainPiece(config);
  if (!format) return null;

  const { width: w, height: h } = format.trim;
  const mockup = format.mockup;

  const stageAspect =
    mockup === "book" ? `${2 * w} / ${h}` : mockup === "tent" ? `${w} / ${2 * h}` : `${w} / ${h}`;
  const cardBox =
    mockup === "book"
      ? { left: "25%", top: 0, width: "50%", height: "100%" }
      : mockup === "tent"
        ? { left: 0, top: "25%", width: "100%", height: "50%" }
        : { left: 0, top: 0, width: "100%", height: "100%" };
  const isOpen = open && mockup !== "flat";
  const isFlipped = flipped && !isOpen;
  const cardTransform = [
    mockup === "book" && isOpen ? "translateX(50%)" : "",
    mockup === "tent" && isOpen ? "translateY(50%)" : "",
    isFlipped ? "rotateY(180deg)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const shadowBox =
    mockup === "book"
      ? isOpen
        ? { left: "3%", width: "94%" }
        : { left: "28%", width: "44%" }
      : { left: "8%", width: "84%" };

  function face(id) {
    return (
      <PaperFace
        config={config}
        face={id}
        event={event}
        guestName={guestName}
        qr={qr}
        animated={animated}
        lazy={lazy}
        className="h-full w-full"
      />
    );
  }

  function side(id, { back = "", fold = "" } = {}) {
    return (
      <div className={`${styles.side} ${back}`}>
        {face(id)}
        <span className={styles.texture} data-paper={paper} aria-hidden="true" />
        {paper === "pearl" && <span className={styles.pearl} aria-hidden="true" />}
        {fold && <span className={`${styles.fold} ${fold}`} aria-hidden="true" />}
        {interactive && <span className={styles.light} aria-hidden="true" />}
      </div>
    );
  }

  function handlePointerMove(pointerEvent) {
    const node = stageRef.current;
    if (!node || pointerEvent.pointerType === "touch") return;
    const rect = node.getBoundingClientRect();
    const x = (pointerEvent.clientX - rect.left) / rect.width;
    const y = (pointerEvent.clientY - rect.top) / rect.height;
    node.style.setProperty("--tilt-x", `${(0.5 - y) * 10}deg`);
    node.style.setProperty("--tilt-y", `${(x - 0.5) * 14}deg`);
    node.style.setProperty("--light-x", `${x * 100}%`);
    node.style.setProperty("--light-y", `${y * 100}%`);
  }

  function handlePointerLeave() {
    const node = stageRef.current;
    if (!node) return;
    for (const property of ["--tilt-x", "--tilt-y", "--light-x", "--light-y"]) {
      node.style.removeProperty(property);
    }
  }

  let panels;
  if (mockup === "book") {
    panels = (
      <>
        <div className={styles.panel}>
          {side("inside-right", { fold: styles.foldRight })}
          {side("back", { back: styles.back })}
        </div>
        <div
          className={styles.panel}
          style={{
            transformOrigin: "left center",
            transform: `translateZ(0.6px) rotateY(${isOpen ? -178 : 0}deg)`,
          }}
        >
          {side("cover")}
          {side("inside-left", { back: styles.back, fold: styles.foldLeft })}
        </div>
      </>
    );
  } else if (mockup === "tent") {
    panels = (
      <>
        <div className={styles.panel}>
          {side("inside-bottom", { fold: styles.foldBottom })}
          {side("back", { back: styles.back })}
        </div>
        <div
          className={styles.panel}
          style={{
            transformOrigin: "center top",
            transform: `translateZ(0.6px) rotateX(${isOpen ? 178 : 0}deg)`,
          }}
        >
          {side("cover")}
          {side("inside-top", { back: styles.backX, fold: styles.foldTop })}
        </div>
      </>
    );
  } else {
    panels = (
      <div className={styles.panel}>
        {side("front")}
        {side("back", { back: styles.back })}
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label={label}
      className={`${styles.stage} ${isOpen ? styles.isOpen : ""} ${className}`}
      style={{ aspectRatio: stageAspect, "--corner": rounded ? "3.5%" : "1px" }}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
    >
      <span
        className={styles.shadow}
        style={{
          ...shadowBox,
          top: mockup === "tent" ? "93%" : "90%",
          height: "12%",
        }}
        aria-hidden="true"
      />
      <div className={styles.tilt}>
        <div className={styles.card} style={{ ...cardBox, transform: cardTransform }}>
          {panels}
        </div>
      </div>
    </div>
  );
}
