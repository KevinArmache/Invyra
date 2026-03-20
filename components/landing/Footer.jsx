'use client'

import Link from 'next/link'

import { useTranslation } from '@/utils/i18n/Context'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useTranslation()

  const footerLinks = {
    explore: [
      { name: t('landing.footer.links.features'), href: '#features' }
    ],
    help: [
      { name: t('landing.footer.links.contact'), href: 'mailto:kevinarmache@gmail.com' }
    ]
  }

  return (
    <footer className="border-t border-border/50 px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-6 lg:col-span-7">
            <Link href="/" className="mb-4 inline-block">
              <span className="text-2xl font-bold text-gradient">{t('landing.footer.brand')}</span>
            </Link>
            <h3 className="max-w-xl text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              {t('landing.footer.headline')}
            </h3>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              {t('landing.footer.description')}
            </p>
          </div>

          {/* Explore Links */}
          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="mb-4 text-sm font-semibold text-foreground">{t('landing.footer.explore')}</h4>
            <ul className="space-y-2.5">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div className="md:col-span-3 lg:col-span-2">
            <h4 className="mb-4 text-sm font-semibold text-foreground">{t('landing.footer.help')}</h4>
            <ul className="space-y-2.5">
              {footerLinks.help.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            © {currentYear} Invyra. {t('landing.footer.rights')}{' '}
            <a
              href="https://instagram.com/kevinarmache"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline transition-colors"
            >
              Kevin Armache
            </a>
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/kevinarmache" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
