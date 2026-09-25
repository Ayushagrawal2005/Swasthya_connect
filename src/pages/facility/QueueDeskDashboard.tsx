/**
 * Queue Desk Dashboard
 * Patient registration, queue management, appointment scheduling
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, UserPlus, Clock, Calendar, Search, Filter,
  CheckCircle2, AlertCircle, Loader2, QrCode, ArrowRight
} from 'lucide-react'

type QueuePatient = {
  id: string
  name: string
  age: number
  gender: string
  tokenNumber: string
  priority: 'routine' | 'urgent' | 'emergency'
  status: 'waiting' | 'in_consultation' | 'completed'
  waitTime: number
  arrivalTime: string
}

export function QueueDeskDashboard() {
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  
  const [queueStats] = useState({
    waiting: 15,
    inConsultation: 3,
    completed: 42,
    avgWaitTime: 18
  })

  const [queue, setQueue] = useState<QueuePatient[]>([
    { id: '1', name: 'Sunita Devi', age: 45, gender: 'F', tokenNumber: 'T101', priority: 'routine', status: 'waiting', waitTime: 12, arrivalTime: '09:15 AM' },
    { id: '2', name: 'Ramesh Kumar', age: 62, gender: 'M', tokenNumber: 'T102', priority: 'urgent', status: 'waiting', waitTime: 8, arrivalTime: '09:30 AM' },
    { id: '3', name: 'Anita Sharma', age: 28, gender: 'F', tokenNumber: 'E001', priority: 'emergency', status: 'in_consultation', waitTime: 2, arrivalTime: '09:45 AM' },
    { id: '4', name: 'Vijay Patil', age: 35, gender: 'M', tokenNumber: 'T103', priority: 'routine', status: 'waiting', waitTime: 15, arrivalTime: '09:00 AM' },
    { id: '5', name: 'Kavita Singh', age: 52, gender: 'F', tokenNumber: 'T104', priority: 'urgent', status: 'waiting', waitTime: 20, arrivalTime: '08:50 AM' }
  ])

  useEffect(() => {
    setTimeout(() => setLoading(false), 600)
  }, [])

  const filteredQueue = queue.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === 'all' || p.priority === filterPriority
    return matchesSearch && matchesPriority
  })

  const handleRegisterNew = () => {
    alert('New Patient Registration - Coming Soon')
  }

  const handleCallNext = () => {
    alert('Call Next Patient - Coming Soon')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 size={40} className="animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-teal-50 via-white to-blue-50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2A]">Queue Management</h1>
          <p className="text-[#5F5E5A] mt-1">Patient registration and queue control</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleCallNext} className="btn-secondary">
            <Users size={18} />
            Call Next
          </button>
          <button onClick={handleRegisterNew} className="btn-primary">
            <UserPlus size={18} />
            Register Patient
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          icon={<Clock size={24} className="text-amber-600" />}
          title="Waiting"
          value={queueStats.waiting}
          bgColor="bg-amber-50"
        />
        <StatsCard
          icon={<Users size={24} className="text-blue-600" />}
          title="In Consultation"
          value={queueStats.inConsultation}
          bgColor="bg-blue-50"
        />
        <StatsCard
          icon={<CheckCircle2 size={24} className="text-green-600" />}
          title="Completed Today"
          value={queueStats.completed}
          bgColor="bg-green-50"
        />
        <StatsCard
          icon={<Clock size={24} className="text-teal-600" />}
          title="Avg Wait Time"
          value={`${queueStats.avgWaitTime} min`}
          bgColor="bg-teal-50"
        />
      </div>

      {/* Search & Filter */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5A]" />
            <input
              type="text"
              placeholder="Search by name or token number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-[#5F5E5A]" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input-field"
            >
              <option value="all">All Priorities</option>
              <option value="emergency">Emergency</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-[#2C2C2A] mb-6 flex items-center gap-2">
          <Users size={20} className="text-teal-600" />
          Current Queue ({filteredQueue.length})
        </h2>

        <div className="space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="text-center py-12 text-[#5F5E5A]">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p>No patients found</p>
            </div>
          ) : (
            filteredQueue.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl border-2 border-[#D3D1C7] hover:border-teal-300 hover:bg-teal-50/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Token */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white ${
                    patient.priority === 'emergency' ? 'bg-red-500' :
                    patient.priority === 'urgent' ? 'bg-amber-500' : 'bg-teal-500'
                  }`}>
                    {patient.tokenNumber}
                  </div>

                  {/* Patient Info */}
                  <div>
                    <p className="font-bold text-[#2C2C2A]">{patient.name}</p>
                    <p className="text-sm text-[#5F5E5A]">
                      {patient.age} yrs • {patient.gender === 'M' ? 'Male' : 'Female'} • Arrived: {patient.arrivalTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Wait Time */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#5F5E5A]">Wait Time</p>
                    <p className="text-lg font-bold text-[#2C2C2A]">{patient.waitTime} min</p>
                  </div>

                  {/* Priority Badge */}
                  <PriorityBadge priority={patient.priority} />

                  {/* Status */}
                  <StatusBadge status={patient.status} />

                  {/* Actions */}
                  <button className="btn-secondary py-2 px-4">
                    View Details
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Helper Components
function StatsCard({ icon, title, value, bgColor }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card p-6 ${bgColor} border-2 border-transparent hover:border-teal-300 transition-all`}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-3xl font-bold text-[#2C2C2A] mb-1">{value}</h3>
      <p className="text-sm font-medium text-[#5F5E5A]">{title}</p>
    </motion.div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    emergency: 'bg-red-100 text-red-700 border-red-300',
    urgent: 'bg-amber-100 text-amber-700 border-amber-300',
    routine: 'bg-teal-100 text-teal-700 border-teal-300'
  }
  const labels = {
    emergency: 'Emergency',
    urgent: 'Urgent',
    routine: 'Routine'
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[priority as keyof typeof styles]}`}>
      {labels[priority as keyof typeof labels]}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    waiting: 'bg-amber-100 text-amber-700 border-amber-300',
    in_consultation: 'bg-blue-100 text-blue-700 border-blue-300',
    completed: 'bg-green-100 text-green-700 border-green-300'
  }
  const labels = {
    waiting: 'Waiting',
    in_consultation: 'In Progress',
    completed: 'Completed'
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  )
}
