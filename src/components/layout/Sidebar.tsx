import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Calendar, FileText, Video, Pill, Heart, ClipboardList,
  Inbox, BarChart2, AlertTriangle, Package, FlaskConical,
  Siren, Users, ArrowRight, LogOut, UserPlus, Search, Upload, Stethoscope, Activity,
  Baby, Droplet, Syringe,
} from 'lucide-react'
import { useApp, useT } from '../../context/AppContext'
import { cn } from '../../lib/utils'
import { useState, useEffect } from 'react'
import { patientsApi } from '../../services/api'

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

const accentMap: Record<string, string> = {
  asha:    'bg-gradient-to-r from-[#FF9933] to-[#E67300]',
  doctor:  'bg-gradient-to-r from-[#000080] to-[#0000CD]',
  admin:   'bg-gradient-to-r from-[#138808] to-[#0F6B06]',
  patient: 'bg-gradient-to-r from-[#FF9933] to-[#138808]',
}

export function Sidebar() {
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

  // Hide sidebar on public pages
  const publicPaths = ['/', '/login', '/ivr', '/test']
  if (publicPaths.includes(location.pathname)) {
    return null
  }

  if (!role) return null

  const navItems = role === 'asha' ? ashaNav
    : role === 'doctor' ? doctorNav
    : role === 'patient' ? patientNav.filter(item => !item.femaleOnly || patientGender === 'F')
    : adminNav

  return (
    <aside
      className="hidden lg:flex flex-col w-60 bg-white border-r border-[#D4D4D4] min-h-[calc(100vh-4rem)] flex-shrink-0"
      role="complementary"
      aria-label="Side navigation"
    >
      {/* Government Accent Strip */}
      <div className={cn('h-1 w-full', accentMap[role] || '')} aria-hidden="true" />

      {/* Portal Header - Government Style */}
      <div className="px-5 py-4 border-b border-[#D4D4D4] bg-gradient-to-br from-[#FFF5EB] to-white">
        <div className="flex items-center gap-2 mb-1">
          <Heart size={16} className="text-[#FF9933]" aria-hidden="true" />
          <span className="text-sm font-bold text-[#1A1A1A]">{t('appName')}</span>
        </div>
        <p className="text-xs text-[#6B6B6B] font-medium capitalize">
          {role === 'asha' ? t('frontlineWorkerPortal') : `${t(role)} ${t('portalLabel')}`}
        </p>
        <p className="text-[10px] text-[#6B6B6B] mt-0.5">{t('govIndia')}</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label={`${role} navigation`}>
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn('nav-item w-full', location.pathname === item.path && 'nav-item-active')}
            aria-current={location.pathname === item.path ? 'page' : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            {t(item.labelKey as any)}
          </button>
        ))}
      </nav>

      {/* Logout Button - Government Style */}
      <div className="px-3 py-4 border-t border-[#D4D4D4] bg-[#F8F9FA]">
        <button
          onClick={() => {
            // Clear all auth data
            localStorage.clear()
            setRole(null)
            // Hard redirect to login
            window.location.href = '/login'
          }}
          className="nav-item w-full text-[#DC2626] hover:bg-red-50 hover:text-red-700 border-l-[#DC2626]"
          aria-label="Sign out"
        >
          <LogOut size={18} aria-hidden="true" />
          {t('logout')}
        </button>
      </div>
    </aside>
  )
}
