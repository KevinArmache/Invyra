import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Panel } from "@/components/shell/primitives";

/**
 * « Vos premiers pas » : les quatre étapes du parcours réel, cochées d'après
 * les données (pas d'après un clic), avec le lien qui fait avancer chacune.
 * Le tableau de bord ne l'affiche que tant qu'une étape reste à faire.
 *
 * @param {Array<{ key: string, done: boolean, href: string }>} props.steps
 */
export default function GettingStarted({ t, steps, delay = 0 }) {
  const done = steps.filter((step) => step.done).length;
  const share = Math.round((done / steps.length) * 100);

  return (
    <Panel
      className="mt-6"
      delay={delay}
      title={t("dashboard.checklist.title")}
      action={
        <span data-numeric className="text-sm text-ink-300">
          {t("dashboard.checklist.progress")
            .replace("{done}", String(done))
            .replace("{total}", String(steps.length))}
        </span>
      }
    >
      <div className="px-5 pt-5">
        <div
          className="h-1 overflow-hidden rounded-full bg-gold/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
          aria-label={t("dashboard.checklist.title")}
        >
          <div
            className="animate-grow-x h-full rounded-full bg-linear-to-r from-gold-deep to-gold"
            style={{ width: `${share}%`, "--rise-delay": `${delay + 250}ms` }}
          />
        </div>
      </div>

      <ol className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className="animate-rise"
            style={{ "--rise-delay": `${delay + 120 + index * 70}ms` }}
          >
            <Link
              href={step.href}
              className={`group flex h-full items-center gap-3 rounded-lg border p-4 transition-[border-color,background-color,translate] duration-300 hover:-translate-y-0.5 ${
                step.done
                  ? "border-positive/20 bg-positive/5"
                  : "border-border/70 hover:border-gold/40 hover:bg-ink-800/60"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${
                  step.done
                    ? "animate-pop border-positive/40 bg-positive/15 text-positive"
                    : "border-gold/30 font-display text-gold"
                }`}
                style={{ "--rise-delay": `${delay + 400 + index * 90}ms` }}
              >
                {step.done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
              </span>
              <span
                className={`text-sm leading-snug ${
                  step.done ? "text-ink-400" : "text-ink-100"
                }`}
              >
                {t(`dashboard.checklist.${step.key}`)}
              </span>
              {!step.done && (
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gold opacity-0 transition-[opacity,translate] duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
