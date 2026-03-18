import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { I18nProvider } from '@/lib/i18n/Context'

import './globals.css'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata = {
  title: 'Invyra - Cinematic AI-Powered Invitations',
  description: 'Create stunning, cinematic event invitations powered by AI. Transform your events into unforgettable experiences with 3D animations, personalized messaging, and smart RSVP tracking.',
  generator: 'Invyra',
  keywords: ['invitations', 'events', 'AI', 'cinematic', '3D animations', 'RSVP', 'wedding invitations', 'event management'],
  authors: [{ name: 'Invyra' }],
  openGraph: {
    title: 'Invyra - Cinematic AI-Powered Invitations',
    description: 'Create stunning, cinematic event invitations powered by AI.',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <I18nProvider>
          {children}
          <Analytics />
        </I18nProvider>
      </body>
    </html>
  )
}
