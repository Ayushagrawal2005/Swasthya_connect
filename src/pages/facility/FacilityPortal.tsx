/**
 * Facility Portal - Role Selection Landing
 * 6 roles: Admin, Queue Desk, Pharmacist, Lab Tech, Ambulance, District Officer
 * Multilingual support via i18n
 */

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Users, Pill, FlaskConical, Ambulance, Building2,
  ArrowRight, Activity
} from 'lucide-react'
import { useT } from '../../context/AppContext'

type FacilityRole = {
  id: string
  nameKey: string
  icon: React.ReactNode
  descKey: string
  color: string
  bgColor: string
  route: string
}

const FACILITY_ROLES: FacilityRole[] = [
  {
    id: 'facility_admin',
    nameKey: 'facilityAdministrator',
    icon: <Shield size={32} />,
    descKey: 'manageFacilityOps',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 hover:bg-purple-200 border-purple-300',
    route: '/facility/admin'
  },
  {
    id: 'queue_desk',
    nameKey: 'queueDesk',
    icon: <Users size={32} />,
    descKey: 'queueDeskDesc',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 hover:bg-teal-200 border-teal-300',
    route: '/facility/queue'
  },
  {
    id: 'pharmacist',
    nameKey: 'pharmacist',
    icon: <Pill size={32} />,
    descKey: 'pharmacistDesc',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
    route: '/facility/pharmacy'
  },
  {
    id: 'lab_technician',
    nameKey: 'labTechnician',
    icon: <FlaskConical size={32} />,
    descKey: 'labTechnicianDesc',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300',
    route: '/facility/lab'
  },
  {
    id: 'ambulance_coordinator',
    nameKey: 'ambulanceCoordinator',
    icon: <Ambulance size={32} />,
    descKey: 'ambulanceCoordinatorDesc',
    color: 'text-red-600',
    bgColor: 'bg-red-100 hover:bg-red-200 border-red-300',
    route: '/facility/ambulance'
  },
  {
    id: 'district_officer',
    nameKey: 'districtHealthOfficer',
    icon: <Building2 size={32} />,
    descKey: 'districtOfficerDesc',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 hover:bg-amber-200 border-amber-300',
    route: '/facility/district'
  }
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  })
}

export function FacilityPortal() {
  const navigate = useNavigate()
  const t = useT()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-[#123B6D] to-[#1a5490] mb-6 shadow-xl">
            <Activity size={48} className="text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#123B6D] to-[#1a5490] bg-clip-text text-transparent mb-4">
            {t('facilityPortal')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('selectRoleMessage')}
          </p>
        </motion.div>

        {/* Role Cards */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {FACILITY_ROLES.map((role, index) => (
            <motion.button
              key={role.id}
              variants={fadeUp}
              custom={index}
              onClick={() => navigate(role.route)}
              className="bg-white rounded-2xl shadow-lg p-8 text-left border-2 border-gray-100 hover:border-[#E85D04] hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
            >
              {/* Icon */}
              <div className={`${role.color} mb-6 transition-transform group-hover:scale-110 duration-300`}>
                {role.icon}
              </div>

              {/* Role Name */}
              <h3 className="text-xl font-bold text-[#123B6D] mb-3 group-hover:text-[#E85D04] transition-colors">
                {t(role.nameKey)}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-6 leading-relaxed min-h-[3rem]">
                {t(role.descKey)}
              </p>

              {/* Arrow */}
              <div className="flex items-center text-[#E85D04] font-semibold text-sm group-hover:gap-2 transition-all">
                <span>{t('accessDashboard')}</span>
                <ArrowRight size={18} className="ml-1 transition-transform group-hover:translate-x-2" />
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 text-center shadow-lg"
        >
          <p className="text-sm font-medium text-blue-900">
            {t('needHelpContact')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
