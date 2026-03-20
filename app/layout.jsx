import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { I18nProvider } from '@/utils/i18n/Context'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata = {
  title: 'Invyra - Custom HTML/JS event invitations',
  description: 'Create stunning, custom event invitations. Transform your events into unforgettable experiences with clean HTML/CSS/JS designs, personalized messaging, and smart RSVP tracking.',
  generator: 'Invyra',
  keywords: ['invitations', 'events', 'HTML', 'CSS', 'JS', 'custom designs', 'RSVP', 'wedding invitations', 'event management'],
  authors: [{ name: 'Invyra' }],
  openGraph: {
    title: 'Invyra - Custom HTML/JS event invitations',
    description: 'Create stunning, custom HTML/JS event invitations.',
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
          <Toaster position="top-center" richColors />
          <Analytics />
        </I18nProvider>
      </body>
    </html>
  )
}
