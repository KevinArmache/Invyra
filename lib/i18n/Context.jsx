'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const I18nContext = createContext()

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('fr')
  const [translations, setTranslations] = useState(null)

  useEffect(() => {
    // Check localStorage first
    const savedLocale = localStorage.getItem('app-locale')
    if (savedLocale) {
      setLocale(savedLocale)
    } else {
      // Auto-detect browser language if possible, fallback to French
      const browserLang = navigator.language?.split('-')[0]
      if (browserLang === 'en' || browserLang === 'fr') {
        setLocale(browserLang)
      }
    }
  }, [])

  useEffect(() => {
    // Dynamic import to avoid loading all languages at once
    import(`../../locales/${locale}.json`)
      .then(module => {
        setTranslations(module.default)
      })
      .catch(err => console.error(`Failed to load translations for ${locale}`, err))
  }, [locale])

  const t = (key) => {
    if (!translations) return key
    
    // Support nested keys like "editor.title"
    const keys = key.split('.')
    let current = translations
    
    for (const k of keys) {
      if (current[k] === undefined) {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
      current = current[k]
    }
    
    return current
  }

  const changeLocale = (newLocale) => {
    setLocale(newLocale)
    localStorage.setItem('app-locale', newLocale)
  }

  return (
    <I18nContext.Provider value={{ locale, changeLocale, t, isReady: !!translations }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}
