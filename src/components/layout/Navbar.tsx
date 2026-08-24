import { useState } from 'react'
import { Globe, Moon, Sun, Bell, Menu, X, Heart } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useNavigate, useLocation } from 'react-router-dom'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
] as const

export function Navbar() {
  const { language, setLanguage, darkMode, toggleDarkMode, role } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const isLanding = location.pathname === '/'

  return (
    <nav
      className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#D3D1C7]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-teal-500 hover:text-teal-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 rounded"
          aria-label="SwasthyaConnect — go to home"
        >
          <Heart size={22} fill="currentColor" aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight text-[#2C2C2A]">
            Swasthya<span className="text-teal-500">Connect</span>
          </span>
        </button>

        {/* Desktop links */}
        {isLanding && (
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5F5E5A]">
            <a href="#how-it-works" className="hover:text-teal-500 transition-colors">How it works</a>
            <a href="#impact" className="hover:text-teal-500 transition-colors">Impact</a>
            <button onClick={() => navigate('/kiosk')} className="hover:text-teal-500 transition-colors">Kiosk mode</button>
            <button onClick={() => navigate('/ivr')}   className="hover:text-teal-500 transition-colors">IVR helpline</button>
          </div>
        )}

        {/* Role breadcrumb */}
        {role && !isLanding && (
          <span className="hidden sm:block text-xs text-[#5F5E5A] bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
            {role === 'asha' ? 'Frontline Worker Portal' : `${role} portal`}
          </span>
        )}

        <div className="flex items-center gap-2">
          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(p => !p)}
              className="flex items-center gap-1 text-sm text-[#5F5E5A] px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
              aria-label="Change language"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
            >
              <Globe size={16} aria-hidden="true" />
              <span className="hidden sm:block">{languages.find(l => l.code === language)?.label}</span>
            </button>
            {langOpen && (
              <div
                role="listbox"
                aria-label="Language options"
                className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-modal border border-[#D3D1C7] py-1 min-w-[130px] z-50 animate-slide-up"
              >
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={language === lang.code}
                    onClick={() => { setLanguage(lang.code); setLangOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-teal-50 transition-colors ${language === lang.code ? 'text-teal-600 font-medium' : 'text-[#2C2C2A]'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark mode */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-[#5F5E5A] hover:bg-gray-100 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>

          {/* Notifications */}
          {role && (
            <button
              className="p-2 rounded-lg text-[#5F5E5A] hover:bg-gray-100 relative transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
              aria-label="Notifications — 3 unread"
              onClick={() => navigate('/notifications')}
            >
              <Bell size={18} aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full" aria-hidden="true" />
            </button>
          )}

          {/* Auth CTA */}
          {isLanding ? (
            <button onClick={() => navigate('/login')} className="btn-primary py-2 px-4 text-xs">
              Get Started
            </button>
          ) : null}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(p => !p)}
            className="md:hidden p-2 rounded-lg text-[#5F5E5A] hover:bg-gray-100 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#D3D1C7] px-4 py-3 space-y-1 animate-slide-up">
          {isLanding && (
            <>
              <a href="#how-it-works" className="nav-item" onClick={() => setMobileOpen(false)}>How it works</a>
              <a href="#impact" className="nav-item" onClick={() => setMobileOpen(false)}>Impact</a>
            </>
          )}
          <button onClick={() => { navigate('/login'); setMobileOpen(false) }} className="btn-primary w-full justify-center">
            Get Started
          </button>
        </div>
      )}
    </nav>
  )
}
