"use client";

import { useEffect, useRef, useState } from "react";

import InvitationPreview from "@/components/invitation/InvitationPreview";

/**
 * Vignette d'un modèle : l'invitation rendue en lecture seule, réduite à
 * 40 % (iframe à 250 % de la carte, mise à l'échelle depuis le haut).
 *
 * L'iframe n'est créée qu'à l'approche de la carte à l'écran : une liste de
 * modèles ne charge ainsi que les invitations qu'on regarde (polices, photo
 * d'accueil), au lieu de toutes d'un coup. Une fois créée, elle reste.
 *
 * Remplit son parent, qui fixe les dimensions (ex. `aspect-3/4`).
 */
export default function TemplateThumbnail({
  template,
  event,
  guestName = "Marie Dupont",
  title,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0">
      {visible && (
        <div
          className="pointer-events-none absolute top-0 left-1/2"
          style={{
            width: "250%",
            height: "250%",
            transform: "translateX(-50%) scale(0.4)",
            transformOrigin: "top center",
          }}
        >
          <InvitationPreview
            template={template}
            event={event}
            guestName={guestName}
            title={title}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
