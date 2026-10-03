import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

import BrandMark from "@/components/common/BrandMark";
import Signature from "@/components/landing/Signature";
import { getTranslations } from "@/lib/i18n/server";
import { CONTACT_EMAIL, INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/site";

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

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
 *   mis en avant : « Modèles » y mène plutôt qu'à la section de l'accueil
 */
export default async function Footer({
  isAuthenticated = false,
  hasShowcase = false,
  hasCollection = false,
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
                <FooterLink href={`mailto:${CONTACT_EMAIL}`}>
                  <Mail className="h-4 w-4 text-gold/80" />
                  {link("email")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href={WHATSAPP_URL} external>
                  <MessageCircle className="h-4 w-4 text-gold/80" />
                  {link("whatsapp")}
                </FooterLink>
              </li>
              <li>
                <FooterLink href={INSTAGRAM_URL} external>
                  <InstagramIcon className="h-4 w-4 text-gold/80" />
                  {link("instagram")}
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

        <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-7 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Invyra. {t("landing.footer.rights")}
          </p>
          <p data-reveal="fade" className="flex items-baseline gap-1.5">
            {t("landing.footer.made_by")}
            <Signature
              name="Kevin Armache"
              href={INSTAGRAM_URL}
              label={t("landing.footer.made_by_label").replace(
                "{name}",
                "Kevin Armache",
              )}
            />
          </p>
        </div>
      </div>
    </footer>
  );
}
