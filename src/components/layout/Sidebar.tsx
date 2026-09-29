import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Calendar, FileText, Video, Pill, Heart, ClipboardList,
  Inbox, BarChart2, AlertTriangle, Package, FlaskConical,
  Siren, Users, ArrowRight, LogOut, UserPlus, Search, Upload, Stethoscope, Activity,
  Baby, Droplet, Syringe, X,
} from 'lucide-react'
import { useApp, useT } from '../../context/AppContext'
import { cn } from '../../lib/utils'
import { useState, useEffect } from 'react'
import { patientsApi } from '../../services/api'
import swasthyaConnectLogo from '../../assets/images/swasthya_connect.png'

interface NavItem { labelKey: string; icon: React.ReactNode; path: string; femaleOnly?: boolean }

const patientNav: NavItem[] = [
  { labelKey: 'home',             icon: <Home size={18} />,          path: '/patient' },
  { labelKey: 'symptomChecker',   icon: <ClipboardList size={18} />, path: '/patient/triage' },
  { labelKey: 'appointments',     icon: <Calendar size={18} />,      path: '/patient/appointments' },
  { labelKey: 'healthRecords',    icon: <FileText size={18} />,      path: '/patient/records' },
  { labelKey: 'teleconsult',      icon: <Video size={18} />,         path: '/patient/direct-teleconsult' },
  { labelKey: 'referralTracker',  icon: <ArrowRight size={18} />,    path: '/patient/referrals' },
  { labelKey: 'myMedicines',      icon: <Pill size={18} />,          path: '/patient/medicines' },
  { labelKey: 'followUpBoard',    icon: <AlertTriangle size={18} />, path: '/patient/followups' },
  { labelKey: 'familyMembers',    icon: <Users size={18} />,         path: '/patient/family' },
  { labelKey: 'menstrualTracker', icon: <Droplet size={18} />,       path: '/patient/menstrual', femaleOnly: true },
  { labelKey: 'pregnancyTracker', icon: <Baby size={18} />,          path: '/patient/pregnancy', femaleOnly: true },
  { labelKey: 'vaccinations',     icon: <Syringe size={18} />,       path: '/patient/vaccinations' },
]

const ashaNav: NavItem[] = [
  { labelKey: 'dashboard',         icon: <Home size={18} />,          path: '/asha' },
  { labelKey: 'findPatient',       icon: <Search size={18} />,        path: '/asha/patients' },
  { labelKey: 'fullRecord',        icon: <FileText size={18} />,      path: '/asha/record' },
  { labelKey: 'registerPatient',   icon: <UserPlus size={18} />,      path: '/asha/register' },
  { labelKey: 'bookAppointment',   icon: <Calendar size={18} />,      path: '/asha/appointments' },
  { labelKey: 'triagePatient',     icon: <ClipboardList size={18} />, path: '/asha/triage' },
  { labelKey: 'teleconsult',       icon: <Video size={18} />,         path: '/asha/direct-teleconsult' },
  { labelKey: 'uploadDocs',        icon: <Upload size={18} />,        path: '/asha/ocr' },
  { labelKey: 'followUpBoard',     icon: <AlertTriangle size={18} />, path: '/asha/followup' },
  { labelKey: 'chronicCare',       icon: <Activity size={18} />,      path: '/asha/chronic' },
  { labelKey: 'referrals',         icon: <ArrowRight size={18} />,    path: '/asha/referrals' },
  { labelKey: 'emergency',         icon: <Siren size={18} />,         path: '/asha/emergency' },
]

const doctorNav: NavItem[] = [
  { labelKey: 'patientQueue',      icon: <Home size={18} />,          path: '/doctor' },
  { labelKey: 'findPatient',       icon: <Search size={18} />,        path: '/doctor/patients' },
  { labelKey: 'fullRecord',        icon: <FileText size={18} />,      path: '/doctor/record' },
  { labelKey: 'consultView',       icon: <Stethoscope size={18} />,   path: '/doctor/patient' },
  { labelKey: 'videoConsultation', icon: <Video size={18} />,         path: '/doctor/teleconsult' },
  { labelKey: 'referralInbox',     icon: <Inbox size={18} />,         path: '/doctor/referrals' },
  { labelKey: 'followUpBoard',     icon: <AlertTriangle size={18} />, path: '/doctor/followup' },
  { labelKey: 'chronicCare',       icon: <Activity size={18} />,      path: '/doctor/chronic' },
  { labelKey: 'emergency',         icon: <Siren size={18} />,         path: '/doctor/emergency' },
]

const adminNav: NavItem[] = [
  { labelKey: 'dashboard',        icon: <BarChart2 size={18} />,     path: '/admin' },
  { labelKey: 'diagnostics',      icon: <FlaskConical size={18} />,  path: '/admin/diagnostics' },
  { labelKey: 'inventory',        icon: <Package size={18} />,       path: '/admin/inventory' },
  { labelKey: 'followUpBoard',    icon: <AlertTriangle size={18} />, path: '/admin/followup' },
  { labelKey: 'staff',            icon: <Users size={18} />,         path: '/admin/staff' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, setRole, patientId } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const [patientGender, setPatientGender] = useState<string | null>(null)

  // Must be before any early returns (Rules of Hooks)
  useEffect(() => {
    if (role === 'patient' && patientId) {
      patientsApi.get(patientId).then(patient => {
        setPatientGender(patient.gender)
      }).catch(() => {})
    }
  }, [role, patientId])

  // Hide sidebar on public pages and facility portal
  const publicPaths = ['/', '/login', '/ivr', '/test']
  const isFacilityPath = location.pathname.startsWith('/facility')
  
  if (publicPaths.includes(location.pathname) || isFacilityPath) {
    return null
  }

  if (!role) return null

  const navItems = role === 'asha' ? ashaNav
    : role === 'doctor' ? doctorNav
    : role === 'patient' ? patientNav.filter(item => !item.femaleOnly || patientGender === 'F')
    : adminNav

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 shadow-xl transition-transform duration-300 ease-in-out",
          "min-h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="complementary"
        aria-label="Side navigation"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-[#E85D04] transition-colors z-10"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>

        {/* Portal Header with Logo */}
        <div className="px-4 py-5 border-b border-gray-200 bg-white">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 mb-3 w-full hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center p-1.5">
              <img src={swasthyaConnectLogo} alt="Swasthya Connect" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-[#123B6D] leading-tight">Swasthya Connect</h2>
              <p className="text-[10px] text-gray-600 leading-tight">स्वास्थ्य कनेक्ट</p>
            </div>
          </button>
          
          {/* Role Badge */}
          <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white px-3 py-2 rounded-lg text-xs font-semibold text-center">
            {role === 'asha' ? t('frontlineWorkerPortal') : `${t(role)} ${t('portalLabel')}`}
          </div>
        </div>

        {/* Navigation Menu - Card Style */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto" aria-label={`${role} navigation`}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  onClose() // Close sidebar on mobile after navigation
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white shadow-md'
                    : 'text-gray-700 hover:bg-white hover:shadow-sm hover:text-[#E85D04] bg-transparent'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span aria-hidden="true" className={cn(
                  'flex-shrink-0',
                  isActive ? 'text-white' : 'text-gray-600'
                )}>
                  {item.icon}
                </span>
                <span className="truncate">{t(item.labelKey as any)}</span>
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <button
            onClick={() => {
              // Clear all auth data
              localStorage.clear()
              setRole(null)
              // Hard redirect to login
              window.location.href = '/login'
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 border-2 border-red-200 hover:border-red-300"
            aria-label="Sign out"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
