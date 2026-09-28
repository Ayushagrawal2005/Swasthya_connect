import { useState } from 'react'
import { Globe, Menu, X, ChevronDown, Bell, LogOut } from 'lucide-react'
import { useApp, useT } from '../../context/AppContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { NotificationBell } from '../ui/NotificationBell'
import { ReferralNotificationBell } from '../ui/ReferralNotificationBell'
import swasthyaConnectLogo from '../../assets/images/swasthya_connect.png'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
] as const

export function Navbar() {
  const { language, setLanguage, role, logout } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const isLanding = location.pathname === '/'
  const isFacilityPath = location.pathname.startsWith('/facility')

  // Hide navbar on facility portal pages (they have their own header)
  if (isFacilityPath) {
    return null
  }

  return (
    <nav
      className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
        {/* Logo - Swasthya Connect Branding */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 sm:gap-3 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#E85D04] rounded-lg p-1"
          aria-label="Swasthya Connect — go to home"
        >
          {/* Logo Icon */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center p-1.5">
            <img src={swasthyaConnectLogo} alt="Swasthya Connect" className="w-full h-full object-contain" />
          </div>
          <div className="text-left">
            <h1 className="text-base sm:text-lg font-bold text-[#123B6D] leading-tight">Swasthya Connect</h1>
            <p className="text-[10px] sm:text-xs text-gray-600 leading-tight font-medium">स्वास्थ्य कनेक्ट</p>
          </div>
        </button>

        {/* Desktop links */}
        {isLanding && (
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <a href="#how-it-works" className="hover:text-[#E85D04] transition-colors">
              How it works
            </a>
            <a href="#impact" className="hover:text-[#E85D04] transition-colors">
              Impact
            </a>
            <button onClick={() => navigate('/ivr')} className="hover:text-[#E85D04] transition-colors">
              IVR helpline
            </button>
          </div>
        )}

        {/* Role Badge */}
        {role && !isLanding && (
          <span className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white px-4 py-2 rounded-lg shadow-sm">
            <span className="capitalize">
              {role === 'asha' ? t('frontlineWorkerPortal') : `${t(role)} ${t('portalLabel')}`}
            </span>
          </span>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications - shown when logged in */}
          {role && !isLanding && (
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <ReferralNotificationBell />
            </div>
          )}
          
          {/* Language Picker */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(p => !p)}
              className="flex items-center gap-1.5 text-sm text-gray-700 px-3 py-2 rounded-lg hover:text-[#E85D04] hover:bg-gray-50 border border-gray-200 hover:border-[#E85D04] transition-all focus:outline-none focus:ring-2 focus:ring-[#E85D04]"
              aria-label="Change language"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:block font-medium">{languages.find(l => l.code === language)?.label}</span>
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </button>
            {langOpen && (
              <div
                role="listbox"
                aria-label="Language options"
                className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[160px] z-50 animate-slide-up"
              >
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={language === lang.code}
                    onClick={() => { setLanguage(lang.code); setLangOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#E85D04]/5 transition-colors ${
                      language === lang.code ? 'text-[#E85D04] font-semibold bg-[#E85D04]/10' : 'text-gray-700'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button - When logged in */}
          {role && !isLanding && (
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-[#E85D04] hover:bg-gray-50 border border-gray-200 hover:border-[#E85D04] transition-all focus:outline-none focus:ring-2 focus:ring-[#E85D04]"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}

          {/* Login Button - When not logged in */}
          {isLanding && (
            <button 
              onClick={() => navigate('/login')} 
              className="bg-gradient-to-r from-[#E85D04] to-[#d94f03] hover:from-[#d94f03] hover:to-[#c44803] text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              {t('login')}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(p => !p)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-[#E85D04] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E85D04]"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3 space-y-2 shadow-lg">
          {isLanding && (
            <>
              <a 
                href="#how-it-works" 
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E85D04] hover:bg-gray-50 rounded-lg transition-colors" 
                onClick={() => setMobileOpen(false)}
              >
                How it works
              </a>
              <a 
                href="#impact" 
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E85D04] hover:bg-gray-50 rounded-lg transition-colors" 
                onClick={() => setMobileOpen(false)}
              >
                Impact
              </a>
              <button 
                onClick={() => { navigate('/ivr'); setMobileOpen(false) }} 
                className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E85D04] hover:bg-gray-50 rounded-lg transition-colors"
              >
                IVR helpline
              </button>
              <div className="pt-2">
                <button 
                  onClick={() => { navigate('/login'); setMobileOpen(false) }} 
                  className="bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white w-full py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  {t('login')}
                </button>
              </div>
            </>
          )}
          
          {/* Mobile Logout */}
          {role && !isLanding && (
            <button
              onClick={() => { logout(); setMobileOpen(false) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E85D04] hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
