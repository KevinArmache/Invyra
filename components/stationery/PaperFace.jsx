"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { buildFaceDocument } from "@/lib/print/document";
import { BLEED, PX_PER_MM, getFormat } from "@/lib/print/formats";

/**
 * Une face d'invitation papier, à l'échelle de son conteneur.
 *
 * La face est rendue à sa taille réelle (en mm, fond perdu compris) dans une
 * iframe sans script ni accès à la page (`sandbox=""`), puis réduite pour
 * remplir la largeur du conteneur. Le fond perdu reste hors cadre : on voit
 * la carte telle qu'elle sortira de la coupe.
 *
 * L'iframe n'est créée qu'à l'approche de l'écran (`lazy`) : une collection
 * ne charge que les cartes qu'on regarde.
 *
 * @param {object} props.config  modèle papier normalisé (normalizePrintConfig)
 * @param {string} props.face    face à montrer (cover, front, back…)
 * @param {object} props.event   événement (réel ou fictif)
 * @param {string} [props.qr]    SVG du QR code vers l'invitation en ligne
 */
export default function PaperFace({
  config,
  pieceIndex = 0,
  face,
  event,
  guestName = "",
  qr = null,
  animated = true,
  lazy = true,
  title = "",
  className = "",
}) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);
  const [visible, setVisible] = useState(!lazy);
  const format = getFormat(config?.pieces?.[pieceIndex]?.format);

  useEffect(() => {
    const node = ref.current;
    if (!node || !format) return;
    const resize = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / (format.trim.width * PX_PER_MM));
    });
    resize.observe(node);

    let intersect = null;
    if (lazy) {
      intersect = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setVisible(true);
            intersect.disconnect();
          }
        },
        { rootMargin: "300px 0px" },
      );
      intersect.observe(node);
    }
    return () => {
      resize.disconnect();
      intersect?.disconnect();
    };
  }, [format, lazy]);

  const html = useMemo(
    () =>
      visible && format
        ? buildFaceDocument({ config, pieceIndex, face, event, guestName, qr, animated })
        : null,
    [visible, format, config, pieceIndex, face, event, guestName, qr, animated],
  );

  if (!format) return null;

  const bleed = BLEED * PX_PER_MM;
  const width = (format.trim.width + 2 * BLEED) * PX_PER_MM;
  const height = (format.trim.height + 2 * BLEED) * PX_PER_MM;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${format.trim.width} / ${format.trim.height}` }}
    >
      {html && scale > 0 && (
        <iframe
          srcDoc={html}
          title={title}
          aria-hidden={title ? undefined : true}
          tabIndex={-1}
          // Aucun script, aucun accès à la page : la face n'est qu'une image.
          sandbox=""
          className="pointer-events-none absolute top-0 left-0 block border-0"
          style={{
            width,
            height,
            transform: `scale(${scale}) translate(${-bleed}px, ${-bleed}px)`,
            transformOrigin: "top left",
          }}
        />
      )}
    </div>
  );
}
