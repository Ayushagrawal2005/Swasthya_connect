import { useState } from 'react'
import { Globe, Bell, Menu, X, Heart, ChevronDown } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useNavigate, useLocation } from 'react-router-dom'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
] as const

export function Navbar() {
  const { language, setLanguage, role } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const isLanding = location.pathname === '/'

  return (
    <>
      {/* Government of India Tricolor Header Strip */}
      <div className="gov-header-strip" aria-hidden="true" />
      
      <nav
        className="sticky top-0 z-40 bg-white border-b border-[#D4D4D4] shadow-sm"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo - Government Style */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF9933] rounded"
            aria-label="SwasthyaConnect — go to home"
          >
            {/* Government Emblem Style Icon */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9933] via-white to-[#138808] flex items-center justify-center shadow-md border border-[#D4D4D4]">
              <Heart size={20} className="text-[#000080]" fill="currentColor" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-bold text-[#1A1A1A] leading-tight tracking-tight">SwasthyaConnect</h1>
              <p className="text-[10px] text-[#6B6B6B] leading-tight font-medium">भारत सरकार | Government of India</p>
            </div>
          </button>

          {/* Desktop links - Government Portal Style */}
          {isLanding && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4A4A4A]">
              <a href="#how-it-works" className="hover:text-[#FF9933] transition-colors border-b-2 border-transparent hover:border-[#FF9933] pb-1">
                How it works
              </a>
              <a href="#impact" className="hover:text-[#FF9933] transition-colors border-b-2 border-transparent hover:border-[#FF9933] pb-1">
                Impact
              </a>
              <button onClick={() => navigate('/ivr')} className="hover:text-[#FF9933] transition-colors border-b-2 border-transparent hover:border-[#FF9933] pb-1">
                IVR helpline
              </button>
            </div>
          )}

          {/* Role Badge - Government Style */}
          {role && !isLanding && (
            <span className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-gradient-to-r from-[#FF9933] to-[#E67300] text-white px-4 py-1.5 rounded shadow-sm">
              <span className="capitalize">{role === 'asha' ? 'Frontline Worker Portal' : `${role} Portal`}</span>
            </span>
          )}

          <div className="flex items-center gap-2">
            {/* Language Picker - Government Portal Standard */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(p => !p)}
                className="flex items-center gap-1.5 text-sm text-[#4A4A4A] px-3 py-1.5 rounded hover:text-[#FF9933] border border-[#D4D4D4] hover:border-[#FF9933] transition-colors focus-visible:outline-2 focus-visible:outline-[#FF9933]"
                aria-label="Change language"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <Globe size={14} aria-hidden="true" />
                <span className="hidden sm:block font-medium">{languages.find(l => l.code === language)?.label}</span>
                <ChevronDown size={12} aria-hidden="true" />
              </button>
              {langOpen && (
                <div
                  role="listbox"
                  aria-label="Language options"
                  className="absolute right-0 top-full mt-1 bg-white rounded shadow-lg border border-[#D4D4D4] py-1 min-w-[140px] z-50 animate-slide-up"
                >
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      role="option"
                      aria-selected={language === lang.code}
                      onClick={() => { setLanguage(lang.code); setLangOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#FFF5EB] transition-colors ${
                        language === lang.code ? 'text-[#FF9933] font-semibold bg-[#FFF5EB]' : 'text-[#4A4A4A]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications - Government Style */}
            {role && (
              <button
                className="p-2 rounded text-[#4A4A4A] hover:text-[#FF9933] hover:bg-[#FFF5EB] relative transition-colors focus-visible:outline-2 focus-visible:outline-[#FF9933]"
                aria-label="Notifications"
                onClick={() => navigate('/notifications')}
              >
                <Bell size={18} aria-hidden="true" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF9933] rounded-full border-2 border-white" aria-hidden="true" />
              </button>
            )}

            {/* Auth CTA - Government Button Style */}
            {isLanding && (
              <button onClick={() => navigate('/login')} className="btn-primary py-2 px-5 text-sm font-semibold shadow-sm">
                Login / Register
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(p => !p)}
              className="md:hidden p-2 rounded text-[#4A4A4A] hover:bg-[#FFF5EB] transition-colors focus-visible:outline-2 focus-visible:outline-[#FF9933]"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Government Style */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-[#D4D4D4] px-4 py-3 space-y-2 animate-slide-up shadow-md">
            {isLanding && (
              <>
                <a href="#how-it-works" className="block px-4 py-2 text-sm font-medium text-[#4A4A4A] hover:text-[#FF9933] hover:bg-[#FFF5EB] rounded transition-colors" onClick={() => setMobileOpen(false)}>
                  How it works
                </a>
                <a href="#impact" className="block px-4 py-2 text-sm font-medium text-[#4A4A4A] hover:text-[#FF9933] hover:bg-[#FFF5EB] rounded transition-colors" onClick={() => setMobileOpen(false)}>
                  Impact
                </a>
                <button onClick={() => { navigate('/ivr'); setMobileOpen(false) }} className="block w-full text-left px-4 py-2 text-sm font-medium text-[#4A4A4A] hover:text-[#FF9933] hover:bg-[#FFF5EB] rounded transition-colors">
                  IVR helpline
                </button>
                <div className="pt-2">
                  <button onClick={() => { navigate('/login'); setMobileOpen(false) }} className="btn-primary w-full justify-center py-2.5">
                    Login / Register
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
