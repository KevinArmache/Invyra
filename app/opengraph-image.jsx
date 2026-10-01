import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { BRAND_HEX } from "@/lib/email/invitation-email";
import { SITE_URL } from "@/lib/site";

/**
 * Image d'aperçu des liens vers le site (WhatsApp, réseaux, messageries).
 * Les invitations ont la leur : la photo de leur modèle (voir
 * app/invite/[token]/page.jsx).
 *
 * Le logo officiel occupe le centre ; sous lui, seulement l'adresse du site,
 * pour que l'image vaille dans les deux langues. Générée une fois, au build.
 */
export const alt = "Invyra, invitations numériques";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Le fond du logo (#090908) est celui de la page : il s'y fond sans cadre.
  const logo = await readFile(join(process.cwd(), "public", "logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  const host = new URL(SITE_URL).host;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: BRAND_HEX.page,
          backgroundImage:
            "radial-gradient(ellipse at 50% 40%, rgba(226, 185, 99, 0.16), rgba(9, 8, 6, 0) 62%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendu par next/og, pas par le navigateur */}
        <img
          src={src}
          alt=""
          width={922}
          height={614}
          style={{ position: "absolute", top: -40, left: 139 }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 62,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div style={{ width: 72, height: 1, backgroundColor: BRAND_HEX.goldDeep }} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: BRAND_HEX.gold,
            }}
          >
            {host}
          </div>
          <div style={{ width: 72, height: 1, backgroundColor: BRAND_HEX.goldDeep }} />
        </div>
      </div>
    ),
    size,
  );
}
