import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { I18nProvider } from "@/lib/i18n/Context";
import { getLocale, getDictionary, getTranslations } from "@/lib/i18n/server";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Toaster } from "@/components/ui/sonner";
import MotionRoot from "@/components/common/MotionRoot";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * Fraunces porte tous les titres. L'axe SOFT est laissé à 0 et WONK désactivé :
 * on veut l'autorité d'une serif de presse, pas son côté fantaisiste.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

/**
 * Métadonnées par défaut, dans la langue du visiteur. Chaque page publique
 * précise son titre ; les pages privées ne sont pas indexées (voir les
 * layouts dashboard et admin). L'image de partage vient de
 * app/opengraph-image.jsx.
 */
export async function generateMetadata() {
  const { t, locale } = await getTranslations();
  const title = t("landing.meta.title");
  const description = t("landing.meta.description");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s · ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    keywords: [
      "invitation numérique",
      "faire-part",
      "invitation mariage",
      "RSVP",
      "gestion d'invités",
      "invitation WhatsApp",
      "digital invitation",
    ],
    authors: [{ name: SITE_NAME }],
    formatDetection: { telephone: false },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    // favicon.ico (16, 32 et 48 px) et apple-icon.png (180 px) sont tirés du
    // logo ; logo-favicon.png, en 1536 × 1024, est bien trop lourd pour un
    // onglet.
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-icon.png",
    },
  };
}

export const viewport = {
  themeColor: "#232020",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geist.variable} ${geistMono.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <I18nProvider locale={locale} dictionary={dictionary}>
          {children}
          <Toaster position="top-center" richColors closeButton />
          <MotionRoot />
          <Analytics />
        </I18nProvider>
      </body>
    </html>
  );
}
