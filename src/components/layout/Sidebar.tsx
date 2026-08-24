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
  { label: 'Patient Queue',    icon: <Home size={18} />,          path: '/doctor' },
  { label: 'Full Patient Record', icon: <FileText size={18} />,   path: '/doctor/record' },
  { label: 'Consult View',     icon: <Stethoscope size={18} />,   path: '/doctor/patient' },
  { label: 'Referral Inbox',   icon: <Inbox size={18} />,         path: '/doctor/referrals' },
  { label: 'Follow-up Board',  icon: <AlertTriangle size={18} />, path: '/doctor/followup' },
  { label: 'Chronic Care',     icon: <Activity size={18} />,     path: '/doctor/chronic' },
  { label: 'Emergency',        icon: <Siren size={18} />,         path: '/doctor/emergency' },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard',        icon: <BarChart2 size={18} />,     path: '/admin' },
  { label: 'Diagnostics',      icon: <FlaskConical size={18} />,  path: '/admin/diagnostics' },
  { label: 'Medicine Stock',   icon: <Package size={18} />,       path: '/admin/inventory' },
  { label: 'Follow-up Board',  icon: <AlertTriangle size={18} />, path: '/admin/followup' },
  { label: 'Staff',            icon: <Users size={18} />,         path: '/admin/staff' },
]

const accentMap: Record<string, string> = {
  asha:    'bg-gradient-to-b from-green-500 to-teal-500',
  doctor:  'bg-gradient-to-b from-indigo-500 to-indigo-600',
  admin:   'bg-gradient-to-b from-teal-500 to-coral-500',
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
      className="hidden lg:flex flex-col w-60 bg-white border-r border-[#D3D1C7] min-h-[calc(100vh-4rem)] flex-shrink-0"
      role="complementary"
      aria-label="Side navigation"
    >
      <div className={cn('h-1 w-full', accentMap[role] || '')} aria-hidden="true" />

      <div className="px-5 py-4 border-b border-[#D3D1C7]">
        <div className="flex items-center gap-2">
          <Heart size={16} className="text-teal-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-[#2C2C2A]">SwasthyaConnect</span>
        </div>
        <p className="text-xs text-[#5F5E5A] mt-1 capitalize">
          {role === 'asha' ? 'Frontline Worker Portal' : `${role} portal`}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label={`${role} navigation`}>
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

      <div className="px-3 py-4 border-t border-[#D3D1C7]">
        <button
          onClick={() => { setRole(null); navigate('/') }}
          className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          aria-label="Sign out"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
