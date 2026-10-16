"use client";

import PaperFace from "@/components/stationery/PaperFace";
import { mainPiece } from "@/lib/print/config";
import styles from "@/components/stationery/PaperCard.module.css";

/**
 * Deux faces d'une invitation papier posées en éventail, comme sur une
 * table : la face principale (couverture ou recto) devant, une autre face
 * (verso, ou intérieur d'une carte pliée) derrière. Au survol de la carte
 * parente (`group`), l'éventail s'ouvre.
 *
 * Remplit son parent, qui fixe la scène (ex. `aspect-[4/3]`).
 */
export default function PaperFan({ config, event, guestName = "", qr = null, paper = "matte" }) {
  const { format } = mainPiece(config);
  if (!format) return null;

  const ratio = format.trim.height / format.trim.width;
  // Assez grande pour être lue, assez petite pour tenir dans la scène.
  const width = Math.min(ratio < 1 ? 56 : 42, 62 / ratio);
  const front = format.faces[0];
  const behind = format.fold ? format.faces[2] : format.faces[1];

  const sheet = (face, extra) => (
    <div
      className={`absolute top-1/2 left-1/2 overflow-hidden rounded-[2px] shadow-[0_18px_40px_-14px_rgb(0_0_0/0.75),0_2px_6px_rgb(0_0_0/0.35)] ring-1 ring-white/12 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${extra}`}
      style={{ width: `${width}%` }}
    >
      <PaperFace config={config} face={face} event={event} guestName={guestName} qr={qr} animated={false} />
      <span className={styles.texture} data-paper={paper} aria-hidden="true" />
    </div>
  );

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {sheet(
        behind,
        "-translate-x-[38%] -translate-y-1/2 rotate-[7deg] group-hover:-translate-x-[22%] group-hover:rotate-[11deg]",
      )}
      {sheet(
        front,
        "-translate-x-[62%] -translate-y-1/2 -rotate-[4deg] group-hover:-translate-x-[76%] group-hover:-translate-y-[53%] group-hover:-rotate-[7deg]",
      )}
    </div>
  );
}
