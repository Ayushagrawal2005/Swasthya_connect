/**
 * Language Switcher Component
 * Dropdown to switch between supported languages
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Check, ChevronDown } from 'lucide-react'

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    localStorage.setItem('language', languageCode)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-4 py-2 rounded-lg
          bg-white border border-gray-200 hover:border-blue-400
          transition-all duration-200 hover:shadow-md
          text-gray-700 hover:text-blue-600
        "
      >
        <Globe size={18} />
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <span className="text-xl sm:hidden">{currentLanguage.flag}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="
                absolute top-full right-0 mt-2 w-64
                bg-white rounded-xl shadow-2xl border border-gray-100
                overflow-hidden z-50
              "
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <div className="flex items-center gap-2">
                  <Globe size={18} />
                  <span className="text-sm font-semibold">Select Language</span>
                </div>
              </div>

              {/* Language Options */}
              <div className="py-2">
                {languages.map((language) => {
                  const isActive = language.code === currentLanguage.code

                  return (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`
                        w-full px-4 py-3 flex items-center justify-between
                        transition-all duration-150
                        ${isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{language.flag}</span>
                        <div className="text-left">
                          <div className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                            {language.nativeName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {language.name}
                          </div>
                        </div>
                      </div>

                      {/* Check Icon */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-blue-600"
                        >
                          <Check size={18} />
                        </motion.div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Footer Note */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-600 text-center">
                  Language preference saved locally
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
