/**
 * Lab Technician Dashboard
 * Sample collection, test processing, report generation
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FlaskConical, FileText, Clock, CheckCircle2, AlertCircle,
  Loader2, Upload, Download
} from 'lucide-react'

type LabTest = {
  id: string
  patientName: string
  testName: string
  sampleType: string
  status: 'pending' | 'processing' | 'completed'
  priority: 'routine' | 'urgent'
  requestedAt: string
}

export function LabTechnicianDashboard() {
  const [loading, setLoading] = useState(true)
  const [tests] = useState<LabTest[]>([
    { id: '1', patientName: 'Sunita Devi', testName: 'CBC', sampleType: 'Blood', status: 'pending', priority: 'routine', requestedAt: '09:15 AM' },
    { id: '2', patientName: 'Ramesh Kumar', testName: 'Blood Sugar (Fasting)', sampleType: 'Blood', status: 'processing', priority: 'urgent', requestedAt: '09:30 AM' },
    { id: '3', patientName: 'Anita Sharma', testName: 'Urine Analysis', sampleType: 'Urine', status: 'completed', priority: 'routine', requestedAt: '08:45 AM' },
    { id: '4', patientName: 'Vijay Patil', testName: 'Lipid Profile', sampleType: 'Blood', status: 'pending', priority: 'routine', requestedAt: '10:00 AM' }
  ])

  const stats = {
    pending: tests.filter(t => t.status === 'pending').length,
    processing: tests.filter(t => t.status === 'processing').length,
    completed: tests.filter(t => t.status === 'completed').length,
    urgent: tests.filter(t => t.priority === 'urgent').length
  }

  useEffect(() => {
    setTimeout(() => setLoading(false), 600)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2A]">Laboratory Dashboard</h1>
          <p className="text-[#5F5E5A] mt-1">Sample processing and report management</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Download size={18} />
            Export Reports
          </button>
          <button className="btn-primary">
            <Upload size={18} />
            Upload Result
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Pending Tests" value={stats.pending} icon={<Clock size={24} className="text-amber-600" />} bgColor="bg-amber-50" />
        <StatsCard title="Processing" value={stats.processing} icon={<FlaskConical size={24} className="text-blue-600" />} bgColor="bg-blue-50" />
        <StatsCard title="Completed Today" value={stats.completed} icon={<CheckCircle2 size={24} className="text-green-600" />} bgColor="bg-green-50" />
        <StatsCard title="Urgent" value={stats.urgent} icon={<AlertCircle size={24} className="text-red-600" />} bgColor="bg-red-50" />
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-[#2C2C2A] mb-6">Test Queue</h2>
        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-[#D3D1C7] hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
              <div>
                <p className="font-bold text-[#2C2C2A]">{test.patientName}</p>
                <p className="text-sm text-[#5F5E5A]">{test.testName} • {test.sampleType} • {test.requestedAt}</p>
              </div>
              <div className="flex items-center gap-3">
                <PriorityBadge priority={test.priority} />
                <StatusBadge status={test.status} />
                <button className="btn-primary py-2 px-4">Process</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, bgColor }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`card p-6 ${bgColor}`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-3xl font-bold text-[#2C2C2A] mb-1">{value}</h3>
      <p className="text-sm font-medium text-[#5F5E5A]">{title}</p>
    </motion.div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = { urgent: 'bg-red-100 text-red-700 border-red-300', routine: 'bg-teal-100 text-teal-700 border-teal-300' }
  return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[priority as keyof typeof styles]}`}>{priority.toUpperCase()}</span>
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-300',
    processing: 'bg-blue-100 text-blue-700 border-blue-300',
    completed: 'bg-green-100 text-green-700 border-green-300'
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>{status.toUpperCase()}</span>
}
