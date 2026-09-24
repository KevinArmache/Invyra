import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { I18nProvider } from "@/lib/i18n/Context";
import { getLocale, getDictionary } from "@/lib/i18n/server";
import { Toaster } from "@/components/ui/sonner";

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

export const metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  title: {
    default: "Invyra — Invitations d'événement sur mesure",
    template: "%s · Invyra",
  },
  description:
    "Composez des invitations en HTML, CSS et JavaScript, envoyez-les par email ou WhatsApp, et suivez les réponses en temps réel.",
  applicationName: "Invyra",
  keywords: [
    "invitation",
    "événement",
    "RSVP",
    "mariage",
    "HTML",
    "faire-part",
    "gestion d'invités",
  ],
  authors: [{ name: "Invyra" }],
  openGraph: {
    title: "Invyra — Invitations d'événement sur mesure",
    description:
      "Composez des invitations en HTML, CSS et JavaScript, et suivez les réponses en temps réel.",
    type: "website",
    siteName: "Invyra",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invyra — Invitations d'événement sur mesure",
    description:
      "Composez des invitations en HTML, CSS et JavaScript, et suivez les réponses en temps réel.",
  },
  // favicon.ico (16, 32 et 48 px) et apple-icon.png (180 px) sont tirés du
  // logo ; logo-favicon.png, en 1536 × 1024, est bien trop lourd pour un
  // onglet.
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

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
          <Analytics />
        </I18nProvider>
      </body>
    </html>
  );
}
