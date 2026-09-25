/**
 * Facility Portal - Role Selection Landing
 * 6 roles: Admin, Queue Desk, Pharmacist, Lab Tech, Ambulance, District Officer
 */

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Users, Pill, FlaskConical, Ambulance, Building2,
  ArrowRight, Activity
} from 'lucide-react'

type FacilityRole = {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  color: string
  bgColor: string
  route: string
}

const FACILITY_ROLES: FacilityRole[] = [
  {
    id: 'facility_admin',
    name: 'Facility Administrator',
    icon: <Shield size={32} />,
    description: 'Manage facility operations, staff, and resource allocation',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 hover:bg-purple-200 border-purple-300',
    route: '/facility/admin'
  },
  {
    id: 'queue_desk',
    name: 'Queue Desk',
    icon: <Users size={32} />,
    description: 'Patient registration, queue management, and appointment scheduling',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 hover:bg-teal-200 border-teal-300',
    route: '/facility/queue'
  },
  {
    id: 'pharmacist',
    name: 'Pharmacist',
    icon: <Pill size={32} />,
    description: 'Prescription processing, inventory management, and drug dispensing',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
    route: '/facility/pharmacy'
  },
  {
    id: 'lab_technician',
    name: 'Lab Technician',
    icon: <FlaskConical size={32} />,
    description: 'Sample collection, test processing, and report generation',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300',
    route: '/facility/lab'
  },
  {
    id: 'ambulance_coordinator',
    name: 'Ambulance Coordinator',
    icon: <Ambulance size={32} />,
    description: 'Emergency transport, vehicle tracking, and dispatch management',
    color: 'text-red-600',
    bgColor: 'bg-red-100 hover:bg-red-200 border-red-300',
    route: '/facility/ambulance'
  },
  {
    id: 'district_officer',
    name: 'District Health Officer',
    icon: <Building2 size={32} />,
    description: 'District oversight, analytics, and policy implementation',
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 mb-6">
            <Activity size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#2C2C2A] mb-3">
            Facility Portal
          </h1>
          <p className="text-lg text-[#5F5E5A] max-w-2xl mx-auto">
            Select your role to access specialized dashboard and tools
          </p>
        </motion.div>

        {/* Role Cards */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FACILITY_ROLES.map((role, index) => (
            <motion.button
              key={role.id}
              variants={fadeUp}
              custom={index}
              onClick={() => navigate(role.route)}
              className={`card p-8 text-left border-2 ${role.bgColor} transition-all duration-300 hover:scale-105 hover:shadow-xl group`}
            >
              {/* Icon */}
              <div className={`${role.color} mb-4 transition-transform group-hover:scale-110`}>
                {role.icon}
              </div>

              {/* Role Name */}
              <h3 className="text-xl font-bold text-[#2C2C2A] mb-2 group-hover:text-teal-700 transition-colors">
                {role.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#5F5E5A] mb-4 leading-relaxed">
                {role.description}
              </p>

              {/* Arrow */}
              <div className="flex items-center text-teal-600 font-medium text-sm group-hover:gap-2 transition-all">
                <span>Access Dashboard</span>
                <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center"
        >
          <p className="text-sm text-blue-900">
            <strong>Need Help?</strong> Contact your facility administrator or IT support for role assignment and access management.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
