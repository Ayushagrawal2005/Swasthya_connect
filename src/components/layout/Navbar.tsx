import { useState, useEffect, useRef } from 'react'
import { Search, Menu, X, ChevronDown } from 'lucide-react'
import { useApp, useT } from '../../context/AppContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { NotificationBell } from '../ui/NotificationBell'
import { ReferralNotificationBell } from '../ui/ReferralNotificationBell'

// Import logos
import swasthyaConnectLogo from '../../assets/images/swasthya_connect.png'
import digitalIndiaLogo from '../../assets/images/digital india.svg'
import gandhiLogo from '../../assets/images/gandhi.svg'
import ministryLogo from '../../assets/images/ministry of affairs.svg'
import nhmLogo from '../../assets/images/national-health-mission-logo-png_seeklogo-389828.png'
import indianGovtLogo from '../../assets/images/indian govt.png'

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'mr', name: 'मराठी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'bn', name: 'বাংলা' },
] as const

// Role-specific navigation items - ALL items from sidebar
const roleNavigationMap = {
  asha: [
    'Dashboard', 'Find Patient', 'Full Record', 'Register Patient', 
    'Book Appointment', 'Triage Patient', 'Teleconsult', 'Upload Docs',
    'Follow-Up Board', 'Chronic Care', 'Referrals', 'Emergency'
  ],
  doctor: [
    'Patient Queue', 'Find Patient', 'Full Record', 'Consult View',
    'Video Consultation', 'Referral Inbox', 'Follow-Up Board', 
    'Chronic Care', 'Emergency'
  ],
  patient: [
    'Home', 'Symptom Checker', 'Appointments', 'Health Records',
    'Teleconsult', 'Referral Tracker', 'My Medicines', 'Follow-Up Board',
    'Family Members', 'Menstrual Tracker', 'Pregnancy Tracker', 'Vaccinations'
  ],
  admin: [
    'Dashboard', 'Diagnostics', 'Inventory', 'Follow-Up Board', 'Staff'
  ],
} as const

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps = {}) {
  const { language, setLanguage, role, logout } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const languageMenuRef = useRef<HTMLDivElement>(null)

  const isLanding = location.pathname === '/'
  const isFacilityPath = location.pathname.startsWith('/facility')
  const isLogin = location.pathname === '/login'

  const currentLanguage = languages.find(l => l.code === language) || languages[0]
  
  // Get role-specific navigation items
  const navItems = role && roleNavigationMap[role as keyof typeof roleNavigationMap] 
    ? roleNavigationMap[role as keyof typeof roleNavigationMap]
    : ['Home', 'About', 'Services', 'Help', 'Contact']

  // Navigation handler
  const handleNavigation = (item: string) => {
    if (role === 'asha') {
      if (item === 'Dashboard') navigate('/asha')
      else if (item === 'Find Patient') navigate('/asha/patients')
      else if (item === 'Full Record') navigate('/asha/record')
      else if (item === 'Register Patient') navigate('/asha/register')
      else if (item === 'Book Appointment') navigate('/asha/appointments')
      else if (item === 'Triage Patient') navigate('/asha/triage')
      else if (item === 'Teleconsult') navigate('/asha/direct-teleconsult')
      else if (item === 'Upload Docs') navigate('/asha/ocr')
      else if (item === 'Follow-Up Board') navigate('/asha/followup')
      else if (item === 'Chronic Care') navigate('/asha/chronic')
      else if (item === 'Referrals') navigate('/asha/referrals')
      else if (item === 'Emergency') navigate('/asha/emergency')
    } else if (role === 'doctor') {
      if (item === 'Patient Queue') navigate('/doctor')
      else if (item === 'Find Patient') navigate('/doctor/patients')
      else if (item === 'Full Record') navigate('/doctor/record')
      else if (item === 'Consult View') navigate('/doctor/patient')
      else if (item === 'Video Consultation') navigate('/doctor/teleconsult')
      else if (item === 'Referral Inbox') navigate('/doctor/referrals')
      else if (item === 'Follow-Up Board') navigate('/doctor/followup')
      else if (item === 'Chronic Care') navigate('/doctor/chronic')
      else if (item === 'Emergency') navigate('/doctor/emergency')
    } else if (role === 'patient') {
      if (item === 'Home') navigate('/patient')
      else if (item === 'Symptom Checker') navigate('/patient/triage')
      else if (item === 'Appointments') navigate('/patient/appointments')
      else if (item === 'Health Records') navigate('/patient/records')
      else if (item === 'Teleconsult') navigate('/patient/direct-teleconsult')
      else if (item === 'Referral Tracker') navigate('/patient/referrals')
      else if (item === 'My Medicines') navigate('/patient/medicines')
      else if (item === 'Follow-Up Board') navigate('/patient/followups')
      else if (item === 'Family Members') navigate('/patient/family')
      else if (item === 'Menstrual Tracker') navigate('/patient/menstrual')
      else if (item === 'Pregnancy Tracker') navigate('/patient/pregnancy')
      else if (item === 'Vaccinations') navigate('/patient/vaccinations')
    } else if (role === 'admin') {
      if (item === 'Dashboard') navigate('/admin')
      else if (item === 'Diagnostics') navigate('/admin/diagnostics')
      else if (item === 'Inventory') navigate('/admin/inventory')
      else if (item === 'Follow-Up Board') navigate('/admin/followup')
      else if (item === 'Staff') navigate('/admin/staff')
    }
  }

  // Close language menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false)
      }
    }

    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showLanguageMenu])

  // Hide navbar on landing page, facility portal pages and login
  if (isLanding || isFacilityPath || isLogin) {
    return null
  }

  return (
    <>
      {/* Top utility bar */}
      <div className="h-auto sm:h-[24px] bg-[#171717] text-white relative z-[100] overflow-visible">
        <div className="mx-auto flex flex-col sm:flex-row h-full max-w-full sm:max-w-[1800px] items-start sm:items-center justify-between px-2 sm:px-3 md:px-4 py-1.5 sm:py-0 gap-1 sm:gap-3">
          <div className="text-[9px] sm:text-[11px] order-1">{t('govIndia')} | Team - HealthSync1 Team ID- 165109</div>
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 order-2 ml-auto sm:ml-0">
            <div className="hidden sm:flex items-center gap-2 border-l border-white/20 pl-2 md:pl-3">
              <button className="hover:text-[#E85D04] transition-colors text-[9px] sm:text-[11px]">A-</button>
              <button className="hover:text-[#E85D04] transition-colors text-[9px] sm:text-[11px]">A</button>
              <button className="font-bold hover:text-[#E85D04] transition-colors text-[9px] sm:text-[11px]">A+</button>
            </div>
            {/* Language Selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1 opacity-90 hover:opacity-100 hover:text-[#E85D04] transition-all border-l border-white/20 pl-1 sm:pl-2 md:pl-3"
                aria-label="Select Language"
                aria-expanded={showLanguageMenu}
              >
                <span className="font-medium text-[9px] sm:text-[11px]">{currentLanguage.name}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${showLanguageMenu ? 'rotate-180' : ''}`}
                />
              </button>
              {showLanguageMenu && (
                <>
                  {/* Backdrop overlay */}
                  <div 
                    className="fixed inset-0 z-[150]" 
                    onClick={() => setShowLanguageMenu(false)}
                  />
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-1 bg-white border-2 border-gray-300 rounded-md shadow-2xl py-1 min-w-[120px] z-[200]">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full text-left px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-150 ${
                          lang.code === language
                            ? 'bg-[#E85D04] text-white shadow-sm'
                            : 'text-gray-800 hover:bg-[#123B6D] hover:text-white'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Header */}
      <header className="bg-white text-[#123B6D] sticky top-0 z-50 shadow-lg">
        {/* Top Header with Logos */}
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-[1800px] px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
              {/* Left - Government & Health Ministry Logos */}
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 flex-shrink min-w-0">
                {/* Indian Government Logo */}
                <div className="flex h-[42px] w-[42px] sm:h-[45px] sm:w-[45px] md:h-[50px] md:w-[50px] lg:h-[55px] lg:w-[55px] items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={indianGovtLogo} alt="Government of India" className="h-full w-full object-contain" />
                </div>

                {/* Ministry of Health Logo */}
                <div className="flex h-[42px] w-[42px] sm:h-[45px] sm:w-[45px] md:h-[50px] md:w-[50px] lg:h-[55px] lg:w-[55px] items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={ministryLogo} alt="Ministry of Health" className="h-full w-full object-contain" />
                </div>

                <div className="hidden md:block h-10 lg:h-12 border-r-2 border-gray-300" />

                {/* Swasthya Connect Logo & Text */}
                <button 
                  onClick={() => navigate('/')}
                  className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 hover:opacity-80 transition-opacity"
                >
                  <div className="flex h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] md:h-[45px] md:w-[45px] lg:h-[52px] lg:w-[52px] items-center justify-center overflow-hidden flex-shrink-0">
                    <img src={swasthyaConnectLogo} alt="Swasthya Connect" className="h-full w-full object-contain" />
                  </div>
                  
                  <div className="flex flex-col justify-center min-w-0">
                    <h1 className="text-[14px] sm:text-[16px] md:text-[19px] lg:text-[23px] xl:text-[26px] font-bold leading-tight text-[#123B6D]">Swasthya Connect</h1>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] text-gray-600 leading-tight">by HealthSync1 *ID - 165109*</p>
                    <p className="hidden sm:block text-[8px] md:text-[9px] lg:text-[10px] text-gray-500 leading-tight">Integrated Rural Healthcare</p>
                  </div>
                </button>

                <div className="hidden xl:block h-12 border-r-2 border-gray-300 mx-2" />

                {/* Prototype Badge */}
                <span className="hidden xl:inline-flex flex-col items-start rounded-lg bg-[#E85D04] px-3 py-1.5 text-white whitespace-nowrap shadow-md">
                  <span className="text-[9px] font-bold leading-tight">Prototype • SIH 2026</span>
                  <span className="text-[8px] font-semibold leading-tight">HealthSync1 *ID - 165109*</span>
                </span>
              </div>

              {/* Right - Digital India & Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 flex-shrink-0">
                {/* Gandhi's Specs Logo */}
                <div className="hidden lg:flex h-[48px] w-[48px] xl:h-[55px] xl:w-[55px] items-center justify-center rounded overflow-hidden">
                  <img src={gandhiLogo} alt="Swachh Bharat" className="h-full w-full object-contain" />
                </div>

                {/* National Health Mission Logo */}
                <div className="hidden lg:flex h-[48px] w-[48px] xl:h-[55px] xl:w-[55px] items-center justify-center rounded overflow-hidden">
                  <img src={nhmLogo} alt="National Health Mission" className="h-full w-full object-contain" />
                </div>

                {/* Digital India Logo Section */}
                <div className="flex items-center gap-1 md:gap-1.5 border-l-2 border-gray-300 pl-1.5 sm:pl-2 md:px-2.5 lg:px-3">
                  <div className="flex h-[40px] w-[40px] sm:h-[42px] sm:w-[42px] md:h-[48px] md:w-[48px] lg:h-[52px] lg:w-[52px] items-center justify-center rounded overflow-hidden flex-shrink-0">
                    <img src={digitalIndiaLogo} alt="Digital India" className="h-full w-full object-contain" />
                  </div>
                  <div className="hidden md:flex flex-col items-start min-w-0">
                    <div className="text-[11px] lg:text-[13px] xl:text-[14px] font-bold text-[#123B6D] leading-tight">Digital India</div>
                    <div className="text-[8px] lg:text-[9px] text-gray-600 leading-tight">Power to Empower</div>
                  </div>
                </div>

                {/* Notifications (when logged in) */}
                {role && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <NotificationBell />
                    <ReferralNotificationBell />
                  </div>
                )}

                {/* Login / Logout Button */}
                {role ? (
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="rounded-lg bg-[#E85D04] px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-[12px] md:text-[13px] lg:text-[15px] font-bold text-white shadow-lg transition hover:bg-[#d34b03] hover:shadow-xl hover:scale-105 whitespace-nowrap flex-shrink-0"
                  >
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="rounded-lg bg-[#E85D04] px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-[12px] md:text-[13px] lg:text-[15px] font-bold text-white shadow-lg transition hover:bg-[#d34b03] hover:shadow-xl hover:scale-105 whitespace-nowrap flex-shrink-0"
                  >
                    {t('login')} / {t('register')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar with Search */}
        <div className="bg-[#123B6D] border-t border-blue-700">
          <div className="mx-auto max-w-full px-2 sm:px-3 md:px-4 py-0">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden flex items-center text-white p-1.5 sm:p-2"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X size={20} className="sm:w-[24px] sm:h-[24px]" /> : <Menu size={20} className="sm:w-[24px] sm:h-[24px]" />}
              </button>

              {/* Navigation Menu - Desktop */}
              <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
                {/* Menu Button - Opens Sidebar */}
                {role && onMenuClick && (
                  <button
                    onClick={onMenuClick}
                    className="flex h-[44px] lg:h-[48px] items-center px-3 md:px-4 text-[11px] md:text-[12px] lg:text-[13px] font-medium whitespace-nowrap transition text-white hover:bg-[#1a5a8f] hover:text-[#E85D04] border-r border-blue-700"
                  >
                    <Menu size={16} className="mr-1.5" />
                    Menu
                  </button>
                )}
                {navItems.map((item, index) => (
                  <button
                    key={item}
                    onClick={() => handleNavigation(item)}
                    className={`flex h-[44px] lg:h-[48px] items-center px-2 md:px-3 text-[11px] md:text-[12px] lg:text-[13px] font-medium whitespace-nowrap transition ${
                      index === 0
                        ? 'border-b-3 border-[#E85D04] bg-[#1a5a8f] text-white'
                        : 'text-white hover:bg-[#1a5a8f] hover:text-[#E85D04]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </nav>

              {/* Mobile Menu Title */}
              <div className="lg:hidden flex-1 text-white text-[12px] sm:text-[13px] font-medium text-center">
                {role ? (role === 'asha' ? 'Frontline Worker Portal' : `${role.charAt(0).toUpperCase() + role.slice(1)} Portal`) : 'Swasthya Connect'}
              </div>

              {/* Search Bar - Responsive */}
              <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                <div className="flex items-center overflow-hidden rounded-lg bg-white shadow-sm border border-gray-300">
                  <Search size={13} className="sm:w-[14px] sm:h-[14px] ml-1.5 text-[#8b99aa]" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="h-[32px] md:h-[36px] lg:h-[40px] w-[90px] md:w-[110px] lg:w-[150px] bg-transparent px-1.5 md:px-2 text-[11px] md:text-[12px] text-[#123B6D] outline-none placeholder:text-[#7d8ba0]"
                  />
                  <button className="flex h-[32px] md:h-[36px] lg:h-[40px] w-[32px] md:w-[36px] lg:w-[40px] items-center justify-center bg-[#E85D04] text-white transition hover:bg-[#d34b03]">
                    <Search size={13} className="md:w-[14px] md:h-[14px]" />
                  </button>
                </div>
              </div>

              {/* Mobile Search Icon */}
              <button className="md:hidden p-1.5 sm:p-2 text-white">
                <Search size={18} className="sm:w-[20px] sm:h-[20px]" />
              </button>
            </div>

            {/* Mobile Navigation Menu */}
            {showMobileMenu && (
              <nav className="lg:hidden py-1 sm:py-2 border-t border-blue-700 mt-1 max-h-[70vh] overflow-y-auto">
                {navItems.map((item, index) => (
                  <button
                    key={item}
                    onClick={() => {
                      handleNavigation(item)
                      setShowMobileMenu(false)
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-[12px] sm:text-[13px] font-medium transition ${
                      index === 0
                        ? 'bg-[#1a5a8f] text-white border-l-4 border-[#E85D04]'
                        : 'text-white hover:bg-[#1a5a8f] hover:border-l-4 hover:border-[#E85D04]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Government Updates Ticker Strip - Only show when logged in */}
      {role && (
        <section className="bg-[#123B6D] py-1 sm:py-2 md:py-3 border-b border-white/10 overflow-hidden sticky top-0 z-40">
          <div className="relative">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 animate-scroll">
              <span className="flex-shrink-0 flex items-center gap-1 bg-[#E85D04] text-white px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded text-[8px] sm:text-[10px] md:text-[11px] font-bold uppercase">
                Updates
              </span>
              {[
                'New: Ayushman Bharat Digital Mission registration now available at all Primary Health Centers',
                'Announcement: Free health checkup camps scheduled in 150 villages from October 1-15, 2026',
                'Update: COVID-19 booster doses now available for senior citizens at all government health centers',
                'Advisory: Maternal and child health services enhanced under Pradhan Mantri Jan Arogya Yojana',
                'Launch: Tele-MANAS mental health helpline 14416 now operational 24/7',
                'Alert: Malaria and dengue prevention drive launched in monsoon-affected districts',
                'Notice: National Deworming Day scheduled for October 10, 2026',
                'Success: Over 2.4 lakh citizens registered on Swasthya Connect by HealthSync1 Team (ID: 165109)',
                'Information: e-Sanjeevani telemedicine service reaches 10 crore consultations milestone',
                'Circular: Health and Wellness Centers providing comprehensive primary healthcare services',
              ].map((update, index) => (
                <span key={index} className="flex-shrink-0 text-white text-[9px] sm:text-[11px] md:text-[12px] font-medium px-2 sm:px-3 md:px-4 border-l border-white/20">
                  {update}
                </span>
              ))}
              {/* Duplicate for seamless loop */}
              {[
                'New: Ayushman Bharat Digital Mission registration now available at all Primary Health Centers',
                'Announcement: Free health checkup camps scheduled in 150 villages from October 1-15, 2026',
                'Update: COVID-19 booster doses now available for senior citizens at all government health centers',
                'Advisory: Maternal and child health services enhanced under Pradhan Mantri Jan Arogya Yojana',
                'Launch: Tele-MANAS mental health helpline 14416 now operational 24/7',
                'Alert: Malaria and dengue prevention drive launched in monsoon-affected districts',
                'Notice: National Deworming Day scheduled for October 10, 2026',
                'Success: Over 2.4 lakh citizens registered on Swasthya Connect by HealthSync1 Team (ID: 165109)',
                'Information: e-Sanjeevani telemedicine service reaches 10 crore consultations milestone',
                'Circular: Health and Wellness Centers providing comprehensive primary healthcare services',
              ].map((update, index) => (
                <span key={`dup-${index}`} className="flex-shrink-0 text-white text-[9px] sm:text-[11px] md:text-[12px] font-medium px-2 sm:px-3 md:px-4 border-l border-white/20">
                  {update}
                </span>
              ))}
            </div>
          </div>

          {/* CSS for ticker animation */}
          <style>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }

            .animate-scroll {
              display: flex;
              animation: scroll 60s linear infinite;
            }

            .animate-scroll:hover {
              animation-play-state: paused;
            }
          `}</style>
        </section>
      )}
    </>
  )
}
