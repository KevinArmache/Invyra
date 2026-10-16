"use client";

import { BLEED, formatDimensions, openSize } from "@/lib/print/formats";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Schéma d'un format : la carte ouverte à plat, ses faces et sa ligne de
 * pli, avec les dimensions finies et ouvertes.
 */
export default function FormatGuide({ format }) {
  const { t } = useTranslation();
  if (!format) return null;

  const open = openSize(format);
  // Le plus grand côté du schéma mesure 100 unités.
  const scale = 100 / Math.max(open.width, open.height);
  const w = open.width * scale;
  const h = open.height * scale;
  const pad = 6;
  const sheet = format.sheets[format.sheets.length - 1];
  const labels = sheet.cells.map((cell, index) => {
    const col = index % sheet.cols;
    const row = Math.floor(index / sheet.cols);
    return {
      x: pad + (col + 0.5) * format.trim.width * scale,
      y: pad + (row + 0.5) * format.trim.height * scale,
      text: t(`stationery.faces.${cell.face}`),
    };
  });

  return (
    <figure className="surface rounded-xl p-5">
      <div className="flex items-center gap-5">
        <svg
          viewBox={`0 0 ${w + pad * 2} ${h + pad * 2}`}
          className="h-24 w-28 shrink-0 text-gold"
          aria-hidden="true"
        >
          <rect
            x={pad}
            y={pad}
            width={w}
            height={h}
            rx="1.2"
            fill="color-mix(in oklch, currentColor 8%, transparent)"
            stroke="currentColor"
            strokeWidth="0.9"
          />
          {Array.from({ length: sheet.cols - 1 }, (_, index) => {
            const x = pad + (index + 1) * format.trim.width * scale;
            return (
              <line key={`v${index}`} x1={x} y1={pad - 3} x2={x} y2={pad + h + 3} stroke="currentColor" strokeWidth="0.8" strokeDasharray="2.4 2" />
            );
          })}
          {Array.from({ length: sheet.rows - 1 }, (_, index) => {
            const y = pad + (index + 1) * format.trim.height * scale;
            return (
              <line key={`h${index}`} x1={pad - 3} y1={y} x2={pad + w + 3} y2={y} stroke="currentColor" strokeWidth="0.8" strokeDasharray="2.4 2" />
            );
          })}
          {labels.map((label) => (
            <text
              key={label.text}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="6.5"
              fill="currentColor"
              opacity="0.8"
            >
              {label.text}
            </text>
          ))}
        </svg>
        <figcaption className="min-w-0 text-sm">
          <p className="text-ink-50">{t(`stationery.formats.${format.id}`)}</p>
          <dl className="mt-2 space-y-1 text-xs text-ink-400">
            <div className="flex gap-2">
              <dt>{t(format.fold ? "stationery.size_closed" : "stationery.size_finished")}</dt>
              <dd data-numeric className="text-ink-200">{formatDimensions(format.trim)}</dd>
            </div>
            {format.fold && (
              <div className="flex gap-2">
                <dt>{t("stationery.size_open")}</dt>
                <dd data-numeric className="text-ink-200">{formatDimensions(open)}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt>{t("stationery.size_bleed")}</dt>
              <dd data-numeric className="text-ink-200">{BLEED} mm</dd>
            </div>
          </dl>
        </figcaption>
      </div>
    </figure>
  );
}
