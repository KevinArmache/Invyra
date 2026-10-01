import { MessageCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getTranslations } from "@/lib/i18n/server";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Questions fréquentes. Chaque réponse décrit le comportement réel de la
 * plateforme ; les mêmes textes alimentent les données structurées
 * FAQPage de la page (voir app/page.jsx).
 */
export default async function FaqSection() {
  const { t } = await getTranslations();
  const items = t("landing.faq.items");

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative scroll-mt-20 border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <header data-reveal="left" className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-gold/80">{t("landing.faq.eyebrow")}</p>
          <h2
            id="faq-title"
            className="mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
          >
            {t("landing.faq.title")}
            <em className="text-gold not-italic">
              {t("landing.faq.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold-left mt-7 w-24" />
          <p className="mt-7 text-lg leading-relaxed text-pretty text-ink-300">
            {t("landing.faq.subtitle")}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="group mt-8 inline-flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-gold"
          >
            <MessageCircle className="h-4 w-4 text-gold transition-transform duration-300 group-hover:-rotate-12" />
            {CONTACT_EMAIL}
          </a>
        </header>

        <Accordion type="single" collapsible className="space-y-3">
          {(Array.isArray(items) ? items : []).map((item, index) => (
            <div key={item.q} data-reveal style={{ "--i": index % 4 }}>
              <AccordionItem
                value={`faq-${index}`}
                className="surface-interactive rounded-xl border px-5 last:border-b data-[state=open]:border-gold/35 data-[state=open]:bg-ink-800/60"
              >
                <AccordionTrigger className="py-5 text-left font-display text-lg leading-snug font-normal text-ink-50 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[0.95rem] leading-relaxed text-pretty text-ink-300">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
