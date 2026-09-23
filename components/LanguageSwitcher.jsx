"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/utils/i18n/Context";
import { LOCALES, LOCALE_LABELS } from "@/utils/i18n/config";

export function LanguageSwitcher() {
  const { locale, changeLocale } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 px-2 text-xs font-semibold tracking-widest uppercase"
          aria-label={LOCALE_LABELS[locale]}
        >
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 min-w-0">
        {LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => changeLocale(code)}
            className="flex cursor-pointer items-center justify-between gap-2"
          >
            <span className="text-sm">{LOCALE_LABELS[code]}</span>
            {locale === code && (
              <Check className="h-3.5 w-3.5 shrink-0 text-gold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
