'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from '@/utils/i18n/Context'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading } = useUser()
  const { t } = useTranslation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gradient">Invyra</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.features')}
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.how_it_works')}
            </Link>
            {/* <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.pricing')}
            </Link> */}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {loading ? (
              <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <Button asChild>
                <Link href="/dashboard">{t('nav.dashboard')}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">{t('nav.sign_in')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">{t('nav.get_started')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              className="p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border">
          <div className="px-4 py-4 space-y-4">
            <Link
              href="#features"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.features')}
            </Link>
            <Link
              href="#how-it-works"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.how_it_works')}
            </Link>
            {/*
            <Link
              href="#pricing"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.pricing')}
            </Link>
            */}
            <div className="pt-4 space-y-2">
              {user ? (
                <Button asChild className="w-full">
                  <Link href="/dashboard">{t('nav.dashboard')}</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login">{t('nav.sign_in')}</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">{t('nav.get_started')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
