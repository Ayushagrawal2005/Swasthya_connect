import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Calendar, FileText, Video, Pill, Heart, ClipboardList,
  Inbox, BarChart2, AlertTriangle, Package, FlaskConical,
  Siren, Users, ArrowRight, LogOut, UserPlus, Search, Upload, Stethoscope, Activity,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { cn } from '../../lib/utils'

interface NavItem { label: string; icon: React.ReactNode; path: string }

const patientNav: NavItem[] = [
  { label: 'Home',             icon: <Home size={18} />,          path: '/patient' },
  { label: 'Symptom Checker',  icon: <ClipboardList size={18} />, path: '/patient/triage' },
  { label: 'Appointments',     icon: <Calendar size={18} />,      path: '/patient/appointments' },
  { label: 'Health Records',   icon: <FileText size={18} />,      path: '/patient/records' },
  { label: 'Teleconsult',      icon: <Video size={18} />,         path: '/patient/teleconsult' },
  { label: 'Referral Tracker', icon: <ArrowRight size={18} />,    path: '/patient/referrals' },
  { label: 'My Medicines',     icon: <Pill size={18} />,          path: '/patient/medicines' },
]

const ashaNav: NavItem[] = [
  { label: 'Dashboard',         icon: <Home size={18} />,          path: '/asha' },
  { label: 'Find Patient',      icon: <Search size={18} />,        path: '/asha/patients' },
  { label: 'Full Record',       icon: <FileText size={18} />,      path: '/asha/record' },
  { label: 'Register Patient',  icon: <UserPlus size={18} />,      path: '/asha/register' },
  { label: 'Book Appointment',  icon: <Calendar size={18} />,      path: '/asha/appointments' },
  { label: 'Triage Patient',    icon: <ClipboardList size={18} />, path: '/asha/triage' },
  { label: 'Teleconsult',       icon: <Video size={18} />,         path: '/asha/teleconsult' },
  { label: 'Upload Docs (OCR)', icon: <Upload size={18} />,        path: '/asha/ocr' },
  { label: 'Follow-up Board',   icon: <AlertTriangle size={18} />, path: '/asha/followup' },
  { label: 'Chronic Care',      icon: <Activity size={18} />,     path: '/asha/chronic' },
  { label: 'Referrals',         icon: <ArrowRight size={18} />,    path: '/asha/referrals' },
  { label: 'Emergency',         icon: <Siren size={18} />,         path: '/asha/emergency' },
]

const doctorNav: NavItem[] = [
  { label: 'Patient Queue',      icon: <Home size={18} />,          path: '/doctor' },
  { label: 'Find Patient',       icon: <Search size={18} />,        path: '/doctor/patients' },
  { label: 'Full Patient Record',icon: <FileText size={18} />,      path: '/doctor/record' },
  { label: 'Consult View',       icon: <Stethoscope size={18} />,   path: '/doctor/patient' },
  { label: 'Video Consultation', icon: <Video size={18} />,         path: '/doctor/teleconsult' },
  { label: 'Referral Inbox',     icon: <Inbox size={18} />,         path: '/doctor/referrals' },
  { label: 'Follow-up Board',    icon: <AlertTriangle size={18} />, path: '/doctor/followup' },
  { label: 'Chronic Care',       icon: <Activity size={18} />,      path: '/doctor/chronic' },
  { label: 'Emergency',          icon: <Siren size={18} />,         path: '/doctor/emergency' },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard',        icon: <BarChart2 size={18} />,     path: '/admin' },
  { label: 'Diagnostics',      icon: <FlaskConical size={18} />,  path: '/admin/diagnostics' },
  { label: 'Medicine Stock',   icon: <Package size={18} />,       path: '/admin/inventory' },
  { label: 'Follow-up Board',  icon: <AlertTriangle size={18} />, path: '/admin/followup' },
  { label: 'Staff',            icon: <Users size={18} />,         path: '/admin/staff' },
]

const accentMap: Record<string, string> = {
  asha:    'bg-gradient-to-r from-[#FF9933] to-[#E67300]',
  doctor:  'bg-gradient-to-r from-[#000080] to-[#0000CD]',
  admin:   'bg-gradient-to-r from-[#138808] to-[#0F6B06]',
  patient: 'bg-gradient-to-r from-[#FF9933] to-[#138808]',
}

export function Sidebar() {
  const { role, setRole } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  if (!role) return null

  const navItems = role === 'asha' ? ashaNav
    : role === 'doctor' ? doctorNav
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
          <span className="text-sm font-bold text-[#1A1A1A]">SwasthyaConnect</span>
        </div>
        <p className="text-xs text-[#6B6B6B] font-medium capitalize">
          {role === 'asha' ? 'Frontline Worker Portal' : `${role} Portal`}
        </p>
        <p className="text-[10px] text-[#6B6B6B] mt-0.5">Government of India</p>
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
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout Button - Government Style */}
      <div className="px-3 py-4 border-t border-[#D4D4D4] bg-[#F8F9FA]">
        <button
          onClick={() => { setRole(null); navigate('/') }}
          className="nav-item w-full text-[#DC2626] hover:bg-red-50 hover:text-red-700 border-l-[#DC2626]"
          aria-label="Sign out"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
