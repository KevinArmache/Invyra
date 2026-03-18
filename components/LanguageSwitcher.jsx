'use client'

import * as React from "react"
import { Check } from "lucide-react"
import { useTranslation } from "@/utils/i18n/Context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' }
]

export function LanguageSwitcher({ variant = 'default' }) {
  const { locale, changeLocale } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2 text-xs font-bold uppercase tracking-widest">
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 min-w-0">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLocale(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="font-medium">{lang.code.toUpperCase()}</span>
            <span className="text-xs text-muted-foreground">{lang.name}</span>
            {locale === lang.code && <Check className="h-3.5 w-3.5 ml-2 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

