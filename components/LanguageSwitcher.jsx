'use client'

import * as React from "react"
import { Check, Globe } from "lucide-react"
import { useTranslation } from "@/lib/i18n/Context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
]

export function LanguageSwitcher({ variant = 'default' }) {
  const { locale, changeLocale, t } = useTranslation()
  const currentLang = languages.find(l => l.code === locale) || languages[0]

  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent px-4 py-3 h-auto rounded-lg"
          >
            <Globe size={20} />
            <span className="flex-1 text-left">{currentLang.flag} {currentLang.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t('nav.language')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLocale(lang.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span>{lang.flag} {lang.name}</span>
              {locale === lang.code && <Check className="h-4 w-4 ml-2 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('nav.language')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLocale(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{lang.flag} {lang.name}</span>
            {locale === lang.code && <Check className="h-4 w-4 ml-2 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
