import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useApp, useT } from '../context/AppContext'
import {
  Activity,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Heart,
  HelpCircle,
  Hospital,
  Link2,
  Menu,
  Search,
  Shield,
  ShieldCheck,
  Siren,
  Stethoscope,
  Users,
  Video,
  X,
} from 'lucide-react'

// Import local images
import heroImage from '../assets/images/hero(1).jpg'
import patientImage from '../assets/images/patient.jpg'
import workerImage from '../assets/images/worker.jpg'
import digitalIndiaLogo from '../assets/images/digital india.svg'
import gandhiLogo from '../assets/images/gandhi.svg'
import ministryLogo from '../assets/images/ministry of affairs.svg'
import nhmLogo from '../assets/images/national-health-mission-logo-png_seeklogo-389828.png'
import indianGovtLogo from '../assets/images/indian govt.png'
import swasthyaConnectLogo from '../assets/images/swasthya_connect.png'

export function LandingPage() {
  const navigate = useNavigate()
  const { language, setLanguage } = useApp()
  const t = useT()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const languageMenuRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'bn', name: 'বাংলা' },
  ]

  const currentLanguage = languages.find(l => l.code === language) || languages[0]

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

  // Log language changes for debugging
  useEffect(() => {
    console.log('Language changed to:', language, currentLanguage.name)
  }, [language, currentLanguage.name])

  const navItems = [
    'Home',
    'About',
    'Services',
    'For Patients',
    'For Frontline Workers',
    'For Doctors',
    'For Facilities',
    'Schemes & Policies',
    'Resources',
    'Help',
    'Contact',
  ]

  const govUpdates = [
    'New: Ayushman Bharat Digital Mission registration now available at all Primary Health Centers across the country',
    'Announcement: Free health checkup camps scheduled in 150 villages from October 1-15, 2026',
    'Update: COVID-19 booster doses now available for senior citizens at all government health centers',
    'Advisory: Maternal and child health services enhanced under Pradhan Mantri Jan Arogya Yojana scheme',
    'Launch: Tele-MANAS mental health helpline number 14416 now operational round the clock',
    'Alert: Malaria and dengue prevention drive launched in monsoon-affected districts',
    'Notice: National Deworming Day scheduled for October 10, 2026 - Children aged 1-19 years to be covered',
    'Success: Over 2.4 lakh citizens successfully registered on Swasthya Connect healthcare platform by HealthSync1 Team (ID: 165109)',
    'Information: e-Sanjeevani telemedicine service reaches 10 crore consultations milestone',
    'Circular: Health and Wellness Centers to provide comprehensive primary healthcare services',
  ]

  const featureCards = [
    {
      title: 'AI-Powered Triage',
      subtitle: 'Early risk detection and guidance',
      icon: <Activity size={22} />,
      bgColor: 'bg-white',
      iconBg: 'bg-[#e8eef5]',
      iconColor: 'text-[#123B6D]',
      delay: '0s',
    },
    {
      title: 'Teleconsultation',
      subtitle: 'Consult doctors remotely',
      icon: <Video size={22} />,
      bgColor: 'bg-white',
      iconBg: 'bg-[#e8eef5]',
      iconColor: 'text-[#123B6D]',
      delay: '0.1s',
    },
    {
      title: 'Smart Referrals',
      subtitle: 'Seamless patient care coordination',
      icon: <Link2 size={22} />,
      bgColor: 'bg-white',
      iconBg: 'bg-[#e8eef5]',
      iconColor: 'text-[#123B6D]',
      delay: '0.2s',
    },
    {
      title: 'Emergency Support',
      subtitle: 'Ambulance coordination',
      icon: <Siren size={22} />,
      bgColor: 'bg-white',
      iconBg: 'bg-[#e8eef5]',
      iconColor: 'text-[#123B6D]',
      delay: '0.3s',
    },
    {
      title: 'Health Records',
      subtitle: 'Longitudinal and consent-based',
      icon: <FileText size={22} />,
      bgColor: 'bg-white',
      iconBg: 'bg-[#e8eef5]',
      iconColor: 'text-[#123B6D]',
      delay: '0.4s',
    },
    {
      title: 'Medicine & Lab',
      subtitle: 'Integrated facility services',
      icon: <ShieldCheck size={22} />,
      bgColor: 'bg-white',
      iconBg: 'bg-[#e8eef5]',
      iconColor: 'text-[#123B6D]',
      delay: '0.5s',
    },
  ]

  const metrics = [
    { value: '2.4+', label: 'Lakh', sub: 'People Reached' },
    { value: '150+', label: '', sub: 'Villages' },
    { value: '500+', label: '', sub: 'Teleconsultations' },
    { value: '95%', label: '', sub: 'Follow-up Rate' },
  ]

  const whoCanUse = [
    {
      title: 'Patient',
      desc: 'Manage your health, book appointments and access records',
      icon: <Users size={22} />,
    },
    {
      title: 'Frontline Worker',
      desc: 'Register patients, conduct triage, track follow-ups',
      icon: <Stethoscope size={22} />,
    },
    {
      title: 'Doctor',
      desc: 'View referrals, consult patients and manage care',
      icon: <Activity size={22} />,
    },
    {
      title: 'Health Facility',
      desc: 'Manage queue, pharmacy, lab, ambulance and more',
      icon: <Building2 size={22} />,
    },
  ]

  const citizenServices = [
    { title: 'Patient Services', text: 'Register, book appointments, view records' },
    { title: 'Find a Health Facility', text: 'Locate nearby PHC, CHC and district hospital' },
    { title: 'Health Schemes', text: 'Learn about eligibility and benefits' },
    { title: 'Emergency Services', text: 'Get help in case of medical emergency' },
  ]

  const workerServices = [
    { title: 'Frontline Workers', text: 'Register patients, conduct triage, follow-ups' },
    { title: 'Doctors', text: 'Manage consultations and patient care' },
    { title: 'Facility Staff', text: 'Manage queue, pharmacy, lab and operations' },
    { title: 'District Administration', text: 'View district health overview and reports' },
  ]

  const importantLinks = [
    {
      title: 'User Guide',
      desc: 'Guides for all users',
      icon: <BookOpen size={18} />,
    },
    {
      title: 'Training Materials',
      desc: 'Learn how to use Swasthya Connect',
      icon: <Calendar size={18} />,
    },
    {
      title: 'FAQs',
      desc: 'Frequently Asked Questions',
      icon: <HelpCircle size={18} />,
    },
    {
      title: 'Policy Documents',
      desc: 'Guidelines, privacy policy, terms & conditions',
      icon: <FileText size={18} />,
    },
  ]

  const news = [
    {
      day: '27',
      month: 'Sep',
      year: '2026',
      type: 'Announcement',
      badge: 'bg-[#123B6D] text-white',
      title: 'Swasthya Connect prototype launched for Smart India Hackathon 2026',
    },
    {
      day: '25',
      month: 'Sep',
      year: '2026',
      type: 'Update',
      badge: 'bg-[#1E7FE4] text-white',
      title: 'User guide for frontline workers now available',
    },
    {
      day: '20',
      month: 'Sep',
      year: '2026',
      type: 'Advisory',
      badge: 'bg-[#D79B00] text-white',
      title: 'Guidelines on maternal and child health services',
    },
    {
      day: '18',
      month: 'Sep',
      year: '2026',
      type: 'Event',
      badge: 'bg-[#1E9B6B] text-white',
      title: 'Webinar on Digital Health for Rural Communities',
    },
  ]

  return (
    <div className="min-h-screen bg-[#eef2f6] text-[#123B6D]">
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

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

        .float-card {
          animation: float 3s ease-in-out infinite;
        }

        .float-card-delayed {
          animation: float 3.5s ease-in-out infinite;
        }

        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .slide-in-right {
          animation: slideInRight 0.8s ease-out forwards;
        }

        .feature-card {
          transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(232, 93, 4, 0.1), transparent);
          transition: left 0.5s;
        }

        .feature-card:hover::before {
          left: 100%;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 32px rgba(18, 59, 109, 0.15);
        }

        .testimonial-card {
          backdrop-filter: blur(20px);
          animation: pulse 3s ease-in-out infinite;
        }

        .service-item {
          transition: all 0.2s ease;
        }

        .service-item:hover {
          background-color: #f0f5fb;
          padding-left: 1rem;
        }

        .news-item {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .news-item:hover {
          background-color: #fafbfc;
          transform: translateX(4px);
        }

        .cta-button {
          position: relative;
          overflow: hidden;
        }

        .cta-button::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .cta-button:hover::after {
          width: 300px;
          height: 300px;
        }

        .app-phone {
          transform: perspective(1000px) rotateY(-5deg);
          transition: transform 0.3s ease;
        }

        .app-phone:hover {
          transform: perspective(1000px) rotateY(0deg) scale(1.02);
        }
      `}</style>

      {/* Top utility bar */}
      <div className="h-[24px] bg-[#171717] text-[11px] text-white relative z-[100] overflow-visible">
        <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between px-2 md:px-4">
          <div className="hidden sm:block text-[10px] sm:text-[11px]">{t('govIndia')} | Team - HealthSync1 Team ID- 165109 </div>
          <div className="sm:hidden text-[9px]">{t('govIndia')}</div>
          <div className="flex items-center gap-1 sm:gap-3">
            <button className="opacity-90 hover:opacity-100 hidden md:block">Skip to main content</button>
            <button className="opacity-90 hover:opacity-100 hidden md:block">Screen Reader Access</button>
            <div className="hidden sm:flex items-center gap-2 border-l border-white/20 pl-2">
              <button className="hover:text-[#E85D04] transition-colors">A-</button>
              <button className="hover:text-[#E85D04] transition-colors">A</button>
              <button className="font-bold hover:text-[#E85D04] transition-colors">A+</button>
            </div>
            {/* Language Selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1 opacity-90 hover:opacity-100 hover:text-[#E85D04] transition-all border-l border-white/20 pl-2 sm:pl-3"
                aria-label="Select Language"
                aria-expanded={showLanguageMenu}
              >
                <span className="font-medium text-[10px] sm:text-[11px]">{currentLanguage.name}</span>
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
                  <div className="absolute right-0 top-full mt-1 bg-white border-2 border-gray-300 rounded-md shadow-2xl py-1 min-w-[120px] sm:min-w-[140px] z-[200]">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 ${
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
          <div className="mx-auto max-w-[1800px] px-2 sm:px-4 py-2 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
              {/* Left - Government & Health Ministry Logos */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-5 flex-shrink-0">
                {/* Indian Government Logo */}
                <div className="flex h-[40px] w-[40px] sm:h-[50px] sm:w-[50px] md:h-[70px] md:w-[70px] items-center justify-center overflow-hidden">
                  <img src={indianGovtLogo} alt="Government of India" className="h-full w-full object-contain" />
                </div>

                {/* Ministry of Health Logo */}
                <div className="hidden sm:flex h-[50px] w-[50px] md:h-[70px] md:w-[70px] items-center justify-center overflow-hidden">
                  <img src={ministryLogo} alt="Ministry of Health" className="h-full w-full object-contain" />
                </div>

                <div className="hidden md:block h-12 md:h-16 border-r-2 border-gray-300" />

                {/* Swasthya Connect Logo & Text */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="flex h-[40px] w-[40px] sm:h-[48px] sm:w-[48px] md:h-[64px] md:w-[64px] items-center justify-center overflow-hidden">
                    <img src={swasthyaConnectLogo} alt="Swasthya Connect" className="h-full w-full object-contain" />
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <h1 className="text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] font-bold leading-none text-[#123B6D]">Swasthya Connect</h1>
                    <p className="text-[9px] sm:text-[11px] md:text-[13px] text-gray-600 mt-0.5 sm:mt-1 md:mt-1.5">by HealthSync1 Team *ID - 165109*</p>
                    <p className="hidden sm:block text-[9px] md:text-[11px] text-gray-500 mt-0.5">Integrated Rural Healthcare Platform</p>
                  </div>
                </div>

                <div className="hidden lg:block h-16 border-r-2 border-gray-300" />

                {/* Prototype Badge */}
                <span className="hidden lg:inline-flex flex-col items-start rounded-lg bg-[#E85D04] px-4 py-2 text-white whitespace-nowrap shadow-md">
                  <span className="text-[11px] font-bold">Prototype • Smart India Hackathon 2026</span>
                  <span className="text-[9px] font-semibold">HealthSync1 Team *ID - 165109*</span>
                </span>
              </div>

              {/* Right - Digital India & Additional Logos */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-shrink-0">
                {/* Gandhi's Specs Logo */}
                <div className="hidden md:flex h-[48px] w-[48px] lg:h-[64px] lg:w-[64px] items-center justify-center rounded-lg overflow-hidden">
                  <img src={gandhiLogo} alt="Swachh Bharat" className="h-full w-full object-contain" />
                </div>

                {/* National Health Mission Logo */}
                <div className="hidden md:flex h-[48px] w-[48px] lg:h-[64px] lg:w-[64px] items-center justify-center rounded-lg overflow-hidden">
                  <img src={nhmLogo} alt="National Health Mission" className="h-full w-full object-contain" />
                </div>

                {/* Digital India Logo Section */}
                <div className="hidden sm:flex items-center gap-2 md:gap-3 border-l-2 border-r-2 border-gray-300 px-2 md:px-3 lg:px-5">
                  <div className="flex h-[40px] w-[40px] sm:h-[48px] sm:w-[48px] lg:h-[64px] lg:w-[64px] items-center justify-center rounded-lg overflow-hidden">
                    <img src={digitalIndiaLogo} alt="Digital India" className="h-full w-full object-contain" />
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <div className="text-[12px] lg:text-[16px] font-bold text-[#123B6D]">Digital India</div>
                    <div className="text-[9px] lg:text-[11px] text-gray-600">Power to Empower</div>
                  </div>
                </div>

                {/* Enhanced Login Button */}
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-lg sm:rounded-xl bg-[#E85D04] px-3 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-[12px] sm:text-[14px] md:text-[17px] font-bold text-white shadow-xl transition hover:bg-[#d34b03] hover:shadow-2xl hover:scale-105"
                >
                  <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">{t('login')} / {t('register')}</span>
                    <span className="sm:hidden">{t('login')}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar with Search */}
        <div className="bg-[#123B6D] border-t border-blue-700">
          <div className="mx-auto max-w-[1800px] px-2 sm:px-4 py-0">
            <div className="flex items-center justify-between gap-2">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden flex items-center text-white p-2"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Navigation Menu - Desktop */}
              <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
                {navItems.map((item, index) => (
                  <button
                    key={item}
                    className={`flex h-[48px] items-center px-3 text-[12px] font-medium whitespace-nowrap transition ${
                      index === 0
                        ? 'border-b-3 border-[#E85D04] bg-[#1a5a8f] text-white'
                        : 'text-white hover:bg-[#1a5a8f] hover:text-[#E85D04]'
                    }`}
                  >
                    {item}
                    {[
                      'Services',
                      'For Patients',
                      'For Frontline Workers',
                      'For Doctors',
                      'For Facilities',
                      'Schemes & Policies',
                      'Resources',
                    ].includes(item) && <ChevronDown size={12} className="ml-1" />}
                  </button>
                ))}
              </nav>

              {/* Mobile Menu Title */}
              <div className="lg:hidden flex-1 text-white text-sm font-medium text-center">
                Swasthya Connect
              </div>

              {/* Search Bar - Hidden on small screens */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center overflow-hidden rounded-lg bg-white shadow-sm border border-gray-300">
                  <Search size={14} className="ml-2 text-[#8b99aa]" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="h-[36px] w-[120px] md:w-[150px] lg:w-[180px] bg-transparent px-2 text-[12px] text-[#123B6D] outline-none placeholder:text-[#7d8ba0]"
                  />
                  <button className="flex h-[36px] w-[36px] md:w-[40px] items-center justify-center bg-[#E85D04] text-white transition hover:bg-[#d34b03]">
                    <Search size={14} />
                  </button>
                </div>
              </div>

              {/* Mobile Search Icon */}
              <button className="md:hidden p-2 text-white">
                <Search size={20} />
              </button>
            </div>

            {/* Mobile Navigation Menu */}
            {showMobileMenu && (
              <nav className="lg:hidden py-2 border-t border-blue-700 mt-2">
                {navItems.map((item, index) => (
                  <button
                    key={item}
                    onClick={() => setShowMobileMenu(false)}
                    className={`w-full text-left px-4 py-3 text-[13px] font-medium transition ${
                      index === 0
                        ? 'bg-[#1a5a8f] text-white border-l-4 border-[#E85D04]'
                        : 'text-white hover:bg-[#1a5a8f] hover:border-l-4 hover:border-[#E85D04]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {item}
                      {[
                        'Services',
                        'For Patients',
                        'For Frontline Workers',
                        'For Doctors',
                        'For Facilities',
                        'Schemes & Policies',
                        'Resources',
                      ].includes(item) && <ChevronDown size={14} />}
                    </div>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Government Updates Ticker Strip */}
      <section className="bg-[#123B6D] py-2 sm:py-3 border-b border-white/10 overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-2 sm:gap-4 animate-scroll">
            <span className="flex-shrink-0 flex items-center gap-1 sm:gap-2 bg-[#E85D04] text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-[11px] md:text-[12px] font-bold uppercase">
              Latest Updates
            </span>
            {govUpdates.map((update, index) => (
              <span key={index} className="flex-shrink-0 text-white text-[11px] sm:text-[12px] md:text-[13px] font-medium px-3 sm:px-4 md:px-6 border-l border-white/20">
                {update}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {govUpdates.map((update, index) => (
              <span key={`dup-${index}`} className="flex-shrink-0 text-white text-[11px] sm:text-[12px] md:text-[13px] font-medium px-3 sm:px-4 md:px-6 border-l border-white/20">
                {update}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#123B6D] py-8 sm:py-12 md:py-16">
        {/* Background with increased opacity for better visibility */}
        <div className="absolute inset-0 opacity-85 md:opacity-95">
          <img 
            src={heroImage} 
            alt="Rural healthcare background"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-[#123B6D]/75 via-[#123B6D]/55 to-[#123B6D]/30 md:from-[#123B6D]/65 md:via-[#123B6D]/45 md:to-transparent" />

        <div className="relative mx-auto max-w-[1800px] px-3 sm:px-4 md:px-6 lg:px-4">
          {/* Left Content */}
          <div className="text-white max-w-[700px]">
            <div className="mb-4 md:mb-6 inline-block rounded-full border border-white/30 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-white/90">
              Integrated Rural Healthcare Platform
            </div>

            <h2 className="max-w-[90%] sm:max-w-[600px] md:max-w-[700px] text-[32px] sm:text-[42px] md:text-[52px] lg:text-[64px] font-bold leading-[1.1] sm:leading-[1.05] md:leading-[1.0] mb-4 sm:mb-5 md:mb-6 text-white">
              Healthcare that reaches
              <br />
              every home in <span className="text-[#E85D04]">rural India</span>
            </h2>

            <p className="text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] font-medium text-white/90 mb-3 sm:mb-4">
              Accessible. People-Centric. Technology-Enabled.
            </p>

            <p className="max-w-[95%] sm:max-w-[600px] md:max-w-[680px] text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] leading-relaxed text-white/85 mb-6 sm:mb-7 md:mb-8">
              {t('appName')} by HealthSync1 Team (ID: 165109) brings together patients, frontline workers, doctors and health
              facilities for continuous, equitable healthcare in rural communities.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
              <button
                onClick={() => navigate('/login')}
                className="cta-button flex items-center justify-center gap-2 rounded-lg bg-[#E85D04] px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 text-[14px] sm:text-[15px] md:text-[16px] font-semibold text-white transition hover:bg-[#d64b03] shadow-lg w-full sm:w-auto"
              >
                Access Services
                <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              <button className="rounded-lg border-2 border-white bg-transparent px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 text-[14px] sm:text-[15px] md:text-[16px] font-semibold text-white transition hover:bg-white/10 w-full sm:w-auto">
                Learn More
              </button>
            </div>

            {/* Testimonial Card */}
            <div className="testimonial-card max-w-full sm:max-w-[90%] md:max-w-[540px] rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white flex-shrink-0">
                  <Users size={16} className="sm:w-[18px] sm:h-[18px]" color="#E85D04" />
                </div>
                <div>
                  <p className="text-[14px] sm:text-[15px] md:text-[16px] font-bold text-white">Sushila Devi</p>
                  <p className="text-[11px] sm:text-[12px] text-white/80">Frontline Worker, Beed District</p>
                </div>
              </div>

              <p className="text-[12px] sm:text-[13px] md:text-[14px] italic text-white leading-relaxed">
                "सुस्वास्थ्य से हमारे गांव की महिलाओं को समय पर इलाज मिल रहा है, पहले नहीं मिलता था"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main content cards */}
      <section className="bg-[#f2f4f7] py-10">
        <div className="mx-auto grid max-w-[1800px] grid-cols-[1.05fr_1.05fr_1fr_1.25fr] gap-6 px-4">
          {/* Citizens */}
          <div className="overflow-hidden rounded-lg border border-[#dfe6ef] bg-white shadow-sm hover:shadow-lg transition-shadow">
            <div className="bg-[#123B6D] px-5 py-4 text-[18px] font-bold text-white">
              For Citizens
            </div>

            <div className="flex h-[300px]">
              <div
                className="w-[150px] bg-cover bg-center"
                style={{
                  backgroundImage: `url(${patientImage})`,
                }}
              />
              <div className="flex-1 overflow-y-auto">
                {citizenServices.map((item, index) => (
                  <div
                    key={item.title}
                    className="service-item flex items-start gap-3 border-b border-[#edf1f5] px-3 py-3"
                  >
                    <span className="mt-1 text-[13px] font-bold text-[#E85D04]">{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#123B6D]">{item.title}</p>
                      <p className="text-[11px] leading-tight text-[#5d6f88]">{item.text}</p>
                    </div>
                    <ChevronRight size={14} className="mt-1 text-[#8a97ab]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Health workers */}
          <div className="overflow-hidden rounded-lg border border-[#dfe6ef] bg-white shadow-sm hover:shadow-lg transition-shadow">
            <div className="bg-[#E85D04] px-5 py-4 text-[18px] font-bold text-white">
              For Health Workers & Professionals
            </div>

            <div className="flex h-[300px]">
              <div
                className="w-[150px] bg-cover bg-center"
                style={{
                  backgroundImage: `url(${workerImage})`,
                }}
              />
              <div className="flex-1 overflow-y-auto">
                {workerServices.map((item, index) => (
                  <div
                    key={item.title}
                    className="service-item flex items-start gap-3 border-b border-[#edf1f5] px-3 py-3"
                  >
                    <span className="mt-1 text-[13px] font-bold text-[#E85D04]">{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#123B6D]">{item.title}</p>
                      <p className="text-[11px] leading-tight text-[#5d6f88]">{item.text}</p>
                    </div>
                    <ChevronRight size={14} className="mt-1 text-[#8a97ab]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Important links */}
          <div className="overflow-hidden rounded-lg border border-[#dfe6ef] bg-white shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 bg-[#123B6D] px-5 py-4 text-[18px] font-bold text-white">
              <Link2 size={18} />
              Important Links
            </div>

            <div className="divide-y divide-[#edf1f5]">
              {importantLinks.map((item) => (
                <button
                  key={item.title}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f5f9fd] transition-colors"
                >
                  <div className="rounded bg-[#edf4fd] p-2 text-[#123B6D]">{item.icon}</div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#123B6D]">{item.title}</p>
                    <p className="text-[11px] text-[#5d6f88]">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-[#9aa7b7]" />
                </button>
              ))}
            </div>
          </div>

          {/* What's new */}
          <div className="overflow-hidden rounded-lg border border-[#dfe6ef] bg-white shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between border-b border-[#edf1f5] px-5 py-4">
              <h3 className="text-[18px] font-bold text-[#123B6D]">What's New</h3>
              <button className="text-[12px] font-semibold text-[#123B6D] hover:text-[#E85D04]">View All</button>
            </div>

            <div className="divide-y divide-[#edf1f5] max-h-[320px] overflow-y-auto">
              {news.map((item) => (
                <div key={item.title} className="news-item flex items-start gap-3 px-4 py-4">
                  <div className="w-[52px] text-center flex-shrink-0">
                    <div className="text-[18px] font-bold text-[#123B6D]">{item.day}</div>
                    <div className="text-[10px] text-[#7b8aa0]">{item.month}</div>
                    <div className="text-[10px] text-[#7b8aa0]">{item.year}</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${item.badge}`}>
                      {item.type}
                    </span>
                    <p className="mt-2 text-[12px] leading-tight text-[#2f3f54]">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-[#123B6D] text-white">
        <div className="mx-auto grid max-w-[1800px] grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-8 px-4 py-6">
          {metrics.map((item) => (
            <div key={item.sub} className="border-r border-white/10 pr-6 last:border-r-0">
              <div className="text-[38px] font-bold leading-none">{item.value}</div>
              {item.label && <div className="mt-1 text-[12px] text-blue-200">{item.label}</div>}
              <div className="mt-1 text-[12px] text-blue-200">{item.sub}</div>
            </div>
          ))}

          <div className="flex items-center gap-3 rounded border border-[#E85D04] bg-[#123B6D] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#E85D04]">
            <Check size={14} />
            Prototype Demo Data
          </div>
        </div>
      </section>

      {/* Key Services Section */}
      <section className="bg-[#eef2f6] py-12">
        <div className="mx-auto max-w-[1800px] px-4">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-[28px] sm:text-[32px] md:text-[36px] font-bold text-[#123B6D] mb-2 sm:mb-3">Key Services</h2>
            <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#5f718a] px-4">Comprehensive healthcare solutions for rural India</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {featureCards.map((card, index) => (
              <div
                key={card.title}
                className="fade-in-up"
                style={{ animationDelay: card.delay }}
              >
                <div
                  className={`feature-card ${card.bgColor} rounded-xl border border-[#d8e1ea] p-5 sm:p-6 ${
                    index % 2 === 0 ? 'float-card' : 'float-card-delayed'
                  }`}
                  style={{ animationDelay: card.delay }}
                >
                  <div className={`mb-3 sm:mb-4 inline-block rounded-lg p-2.5 sm:p-3 ${card.iconBg} ${card.iconColor}`}>
                    {card.icon}
                  </div>

                  <h4 className="text-[14px] sm:text-[15px] font-bold text-[#123B6D] mb-1.5 sm:mb-2">{card.title}</h4>
                  <p className="text-[12px] sm:text-[13px] text-[#5f718a] leading-relaxed">{card.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Showcase Section */}
      <section className="bg-gradient-to-br from-[#123B6D] to-[#1a4a7f] text-white py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center">
            {/* Left: App Info */}
            <div className="order-2 lg:order-1">
              <div className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#E85D04] rounded-full text-[11px] sm:text-[12px] font-bold">
                NOW AVAILABLE
              </div>
              <h2 className="text-[42px] font-bold leading-tight mb-6 text-white">
                Download the<br />
                <span className="text-[#E85D04]">Swasthya Connect</span> <span className="text-white">App</span>
              </h2>
              <p className="text-[14px] text-blue-100 mb-2 font-semibold">by HealthSync1 Team *ID - 165109*</p>
              <p className="text-[18px] text-blue-100 mb-6 leading-relaxed">
                Access healthcare services anytime, anywhere. AI-powered triage, teleconsultation, 
                health records, and more - right at your fingertips.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E85D04] flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-[16px]">Offline-First Technology</p>
                    <p className="text-[14px] text-blue-200">Works without internet connectivity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E85D04] flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-[16px]">Voice & Local Language Support</p>
                    <p className="text-[14px] text-blue-200">Available in 6 Indian languages</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E85D04] flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-[16px]">Secure & Privacy-First</p>
                    <p className="text-[14px] text-blue-200">End-to-end encrypted health records</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex items-center gap-3 bg-black hover:bg-black/90 px-6 py-3 rounded-lg transition">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-blue-200">Download on the</div>
                    <div className="text-[16px] font-bold">App Store</div>
                  </div>
                </button>

                <button className="flex items-center gap-3 bg-black hover:bg-black/90 px-6 py-3 rounded-lg transition">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-blue-200">GET IT ON</div>
                    <div className="text-[16px] font-bold">Google Play</div>
                  </div>
                </button>
              </div>

              <p className="mt-6 text-[12px] text-blue-200">
                <strong className="text-white">Note:</strong> This is a prototype app for demonstration purposes.
              </p>
            </div>

            {/* Right: Phone Mockup */}
            <div className="order-1 lg:order-2 flex justify-center app-phone">
              <div className="h-[480px] w-[240px] sm:h-[580px] sm:w-[290px] md:h-[680px] md:w-[340px] rounded-[40px] sm:rounded-[50px] bg-gradient-to-b from-gray-900 to-black p-2 sm:p-3 shadow-2xl">
                {/* Dynamic Island */}
                <div className="absolute left-1/2 top-0 z-20 h-[24px] w-[90px] sm:h-[28px] sm:w-[110px] md:h-[32px] md:w-[120px] -translate-x-1/2 rounded-b-2xl sm:rounded-b-3xl bg-black" />
                
                {/* Screen */}
                <div className="relative h-full w-full overflow-hidden rounded-[36px] sm:rounded-[40px] md:rounded-[44px] bg-gray-100">
                  {/* Status Bar */}
                  <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-8 pt-3 text-[11px] font-semibold text-[#123B6D]">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      <svg className="h-3 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="h-3 w-6 rounded-sm border border-current">
                        <div className="h-full w-4/5 bg-current" />
                      </div>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="h-full overflow-y-auto bg-gradient-to-b from-[#f5f8fb] to-white pb-20 pt-12">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#123B6D] to-[#1a5a8f] px-5 pb-6 pt-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg p-1.5">
                            <img src={swasthyaConnectLogo} alt="Swasthya Connect" className="h-full w-full object-contain" />
                          </div>
                          <div>
                            <p className="text-[15px] font-bold text-white">Swasthya Connect</p>
                            <p className="text-[9px] text-blue-200 font-semibold">by HealthSync1 Team *ID-165109*</p>
                          </div>
                        </div>
                      </div>

                      {/* Welcome Card */}
                      <div className="rounded-2xl bg-white/95 p-4 shadow-lg">
                        <p className="text-[16px] font-bold text-[#123B6D] mb-1">Welcome, Meena Devi</p>
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                          <span className="text-[11px] font-semibold text-green-700">Offline Ready</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="px-5 py-5">
                      <h3 className="mb-3 text-[13px] font-bold text-gray-600">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { icon: <Activity size={22} />, label: 'AI Triage', bg: 'bg-orange-50' },
                          { icon: <Video size={22} />, label: 'Teleconsult', bg: 'bg-blue-50' },
                          { icon: <FileText size={22} />, label: 'Records', bg: 'bg-purple-50' },
                          { icon: <Calendar size={22} />, label: 'Appointments', bg: 'bg-green-50' },
                        ].map((item, idx) => (
                          <div key={idx} className={`rounded-2xl ${item.bg} p-4 text-[#123B6D]`}>
                            <div className="mb-2">{item.icon}</div>
                            <p className="text-[12px] font-bold">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Health Summary */}
                    <div className="mx-5 mb-5 rounded-2xl bg-white p-4 shadow-md">
                      <h3 className="mb-3 text-[13px] font-bold text-gray-700">Your Health</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-orange-50 p-3 text-center">
                          <p className="text-[22px] font-bold text-[#E85D04]">3</p>
                          <p className="text-[10px] text-gray-600">Checkups</p>
                        </div>
                        <div className="rounded-xl bg-green-50 p-3 text-center">
                          <p className="text-[22px] font-bold text-green-600">12</p>
                          <p className="text-[10px] text-gray-600">Records</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3 text-center">
                          <p className="text-[22px] font-bold text-blue-600">1</p>
                          <p className="text-[10px] text-gray-600">Upcoming</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Navigation */}
                  <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95">
                    <div className="flex items-center justify-around px-2 py-3">
                      {[
                        { icon: <Activity size={20} />, label: 'Home', active: true },
                        { icon: <Calendar size={20} />, label: 'Appointments', active: false },
                        { icon: <FileText size={20} />, label: 'Records', active: false },
                        { icon: <Users size={20} />, label: 'Profile', active: false },
                      ].map((item, idx) => (
                        <button key={idx} className="flex flex-col items-center gap-1">
                          <div className={item.active ? 'text-[#E85D04]' : 'text-gray-400'}>
                            {item.icon}
                          </div>
                          <span className={`text-[9px] font-medium ${item.active ? 'text-[#E85D04]' : 'text-gray-400'}`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#123B6D] text-white">
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10 px-4 sm:px-5 py-8 sm:py-10 md:py-12 max-w-[1800px]">
          <div className="sm:col-span-2 lg:col-span-1 pr-0 lg:pr-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-[36px] w-[36px] sm:h-[42px] sm:w-[42px] items-center justify-center rounded bg-white p-1 flex-shrink-0">
                <img src={swasthyaConnectLogo} alt="Swasthya Connect" className="h-full w-full object-contain" />
              </div>
              <div>
                <h3 className="text-[16px] sm:text-[18px] font-bold text-white">Swasthya Connect</h3>
                <p className="text-[10px] sm:text-[11px] text-blue-200">by HealthSync1 Team *ID - 165109*</p>
                <p className="hidden sm:block text-[9px] sm:text-[10px] text-blue-200">Integrated Rural Healthcare Platform</p>
              </div>
            </div>
            <p className="mt-3 sm:mt-5 text-[11px] sm:text-[12px] text-blue-200">Prototype • Smart India Hackathon 2026</p>
          </div>

          {[
            ['About', ['Overview', 'Objectives', 'Team', 'Contact Us']],
            ['Services', ['For Patients', 'For Frontline Workers', 'For Doctors', 'For Facilities']],
            ['Resources', ['User Guide', 'Training Materials', 'Research & Reports', 'Media Gallery']],
            ['Help & Support', ['FAQs', 'Feedback', 'Report an Issue', 'Sitemap']],
          ].map(([heading, links]) => (
            <div key={heading as string}>
              <h4 className="mb-3 sm:mb-4 text-[14px] sm:text-[15px] md:text-[16px] font-bold text-white">{heading}</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-[12px] sm:text-[13px] text-blue-200">
                {(links as string[]).map((link) => (
                  <li key={link} className="hover:text-white transition-colors cursor-pointer">{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-blue-700">
          <div className="mx-auto flex flex-col sm:flex-row max-w-[1800px] items-center justify-between gap-3 sm:gap-6 px-4 sm:px-5 py-3 sm:py-4 text-[11px] sm:text-[12px] text-blue-200 text-center sm:text-left">
            <div>Content owned by Team - HealthSync1 Team ID- 165109 (Prototype).</div>
            <div className="hidden sm:block">Not an official Government of India website.</div>
            <div>Prototype for Smart India Hackathon 2026</div>
          </div>
        </div>
      </footer>
    </div>
  )
}