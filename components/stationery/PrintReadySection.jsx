"use client";

import { FileCheck2, Layers, Printer, Ruler, Scissors, ScanLine, Sparkles } from "lucide-react";

import { useTranslation } from "@/lib/i18n/Context";

const POINTS = [
  { key: "formats", icon: Ruler },
  { key: "bleed", icon: Scissors },
  { key: "pdf", icon: FileCheck2 },
  { key: "sheets", icon: Layers },
  { key: "finishes", icon: Sparkles },
  { key: "qr", icon: ScanLine },
];

/**
 * « Prêt pour l'imprimerie » : ce que contient le fichier d'une invitation
 * papier (voir lib/print/document.js), puis les étapes d'une commande.
 * Partagé par la collection /stationery et la page de chaque modèle.
 */
export default function PrintReadySection() {
  const { t } = useTranslation();
  const p = (key) => t(`stationery.print_ready.${key}`);
  const steps = t("stationery.steps.items");

  return (
    <section
      aria-labelledby="print-ready-title"
      className="relative border-t border-border/60 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <header data-reveal>
            <p className="eyebrow text-gold/80">{p("eyebrow")}</p>
            <h2
              id="print-ready-title"
              className="mt-4 text-3xl leading-tight text-balance text-ink-50 sm:text-4xl"
            >
              {p("title")}
              <em className="text-gold not-italic">{p("title_highlight")}</em>
            </h2>
            <hr className="rule-gold-left mt-6 w-20" />
            <p className="mt-6 leading-relaxed text-pretty text-ink-300">{p("subtitle")}</p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/5 px-3.5 py-1.5 text-xs text-gold">
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              {p("badge")}
            </p>
          </header>

          <ul className="grid gap-4 sm:grid-cols-2">
            {POINTS.map(({ key, icon: Icon }, index) => (
              <li
                key={key}
                data-reveal
                style={{ "--i": index % 2 }}
                className="surface rounded-xl p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
                  <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base text-ink-50">{p(`points.${key}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{p(`points.${key}.desc`)}</p>
              </li>
            ))}
          </ul>
        </div>

        {Array.isArray(steps) && (
          <div className="mt-20">
            <h2 data-reveal className="text-center text-2xl text-ink-50 sm:text-3xl">
              {t("stationery.steps.title")}
            </h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  data-reveal
                  style={{ "--i": index }}
                  className="surface relative rounded-xl p-5"
                >
                  <span data-numeric className="font-display text-3xl text-gold/80">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-base text-ink-50">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
