/**
 * i18n Configuration
 * Multilingual support for SwasthyaConnect
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation files
import enTranslations from './translations/en.json'
import hiTranslations from './translations/hi.json'
import mrTranslations from './translations/mr.json'
import bnTranslations from './translations/bn.json'
import taTranslations from './translations/ta.json'

const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations },
  mr: { translation: mrTranslations },
  bn: { translation: bnTranslations },
  ta: { translation: taTranslations },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
