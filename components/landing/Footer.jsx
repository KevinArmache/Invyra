import Link from "next/link";
import { MessageCircle } from "lucide-react";

import BrandMark from "@/components/common/BrandMark";
import { getTranslations } from "@/lib/i18n/server";
import { WHATSAPP_URL } from "@/lib/site";

/** Lien du pied de page : un filet or se trace sous lui au survol. */
function FooterLink({ href, children, external = false }) {
  const className =
    "group relative inline-flex items-center gap-2 text-sm text-ink-300 transition-colors duration-300 hover:text-gold";
  const underline = (
    <span
      aria-hidden="true"
      className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold/60 transition-transform duration-500 group-hover:scale-x-100"
    />
  );

  if (external || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
        {underline}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
      {underline}
    </Link>
  );
}

/**
 * @param {boolean} props.hasShowcase    la vitrine des modèles est sur l'accueil
 * @param {boolean} props.hasCollection  la collection /templates a des modèles
 * @param {boolean} props.hasStationery  la papeterie (/stationery) a des modèles
 *   mis en avant : « Modèles » y mène plutôt qu'à la section de l'accueil
 */
export default async function Footer({
  isAuthenticated = false,
  hasShowcase = false,
  hasCollection = false,
  hasStationery = false,
}) {
  const { t } = await getTranslations();
  const year = new Date().getFullYear();
  const link = (key) => t(`landing.footer.links.${key}`);

  const columns = [
    {
      heading: t("landing.footer.product"),
      links: [
        { label: link("how_it_works"), href: "/#how-it-works" },
        { label: link("features"), href: "/#features" },
        ...(hasShowcase
          ? [{ label: link("opening"), href: "/#opening" }]
          : []),
        ...(hasShowcase || hasCollection
          ? [
              {
                label: link("templates"),
                href: hasCollection ? "/templates" : "/#templates",
              },
            ]
          : []),
        ...(hasStationery ? [{ label: link("stationery"), href: "/stationery" }] : []),
        { label: link("availability"), href: "/#availability" },
        { label: link("pricing"), href: "/#pricing" },
        { label: link("faq"), href: "/#faq" },
      ],
    },
    {
      heading: t("landing.footer.account"),
      links: isAuthenticated
        ? [{ label: link("dashboard"), href: "/dashboard" }]
        : [
            { label: link("sign_in"), href: "/login" },
            { label: link("register"), href: "/register" },
          ],
    },
  ];

  return (
    <footer className="grain relative overflow-hidden border-t border-border/60 px-4 pt-20 pb-10 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-12">
          <div data-reveal className="md:col-span-5">
            <BrandMark href="/" size="md" />
            <hr className="rule-gold-left mt-5 w-24" />
            <p className="mt-7 max-w-md font-display text-2xl leading-snug text-balance text-ink-50">
              {t("landing.footer.headline")}
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-300">
              {t("landing.footer.description")}
            </p>
          </div>

          {columns.map((column, index) => (
            <nav
              key={column.heading}
              aria-label={column.heading}
              data-reveal
              style={{ "--i": index + 1 }}
              className="md:col-span-2 md:col-start-auto"
            >
              <h2 className="eyebrow font-sans">{column.heading}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((item) => (
                  <li key={item.href}>
                    <FooterLink href={item.href}>{item.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div data-reveal style={{ "--i": 3 }} className="md:col-span-3">
            <h2 className="eyebrow font-sans">{t("landing.footer.contact")}</h2>
            <ul className="mt-5 space-y-3">
              <li>
                <FooterLink href={WHATSAPP_URL} external>
                  <MessageCircle className="h-4 w-4 text-gold/80" />
                  {link("whatsapp")}
                </FooterLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Le nom en très grand, à peine visible, traversé par le reflet or. */}
        <p
          aria-hidden="true"
          className="text-gold-shimmer pointer-events-none mt-16 font-display text-[22vw] leading-[0.8] tracking-tight opacity-[0.14] select-none lg:text-[13rem]"
        >
          Invyra
        </p>

        <div className="mt-6 border-t border-border/60 pt-7 text-xs text-ink-400">
          <p>
            © {year} Invyra. {t("landing.footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
