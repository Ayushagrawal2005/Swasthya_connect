/**
 * Language Selector Component
 * Allows users to choose their preferred language for triage questions
 */

import { Globe } from 'lucide-react'

interface Props {
  value: 'en' | 'hi' | 'mr'
  onChange: (lang: 'en' | 'hi' | 'mr') => void
  className?: string
}

const LANGUAGES = [
  { code: 'en' as const, name: 'English', nativeName: 'English' },
  { code: 'hi' as const, name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr' as const, name: 'Marathi', nativeName: 'मराठी' }
]

export function LanguageSelector({ value, onChange, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe size={16} className="text-[#5F5E5A]" />
      <div className="flex gap-1 bg-white border border-[#E0DFD9] rounded-lg p-0.5">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${value === lang.code
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-[#5F5E5A] hover:bg-gray-50'
              }
            `}
            title={lang.name}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    </div>
  )
}

export function LanguageSelectorDropdown({ value, onChange, className = '' }: Props) {
  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-medium text-[#5F5E5A] mb-1.5 flex items-center gap-1.5">
        <Globe size={14} />
        Assessment Language
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'en' | 'hi' | 'mr')}
        className="input text-sm"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
      <p className="text-xs text-[#5F5E5A] mt-1">
        Questions will be generated in your selected language
      </p>
    </div>
  )
}
