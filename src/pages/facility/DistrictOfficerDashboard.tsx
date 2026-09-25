/**
 * District Health Officer Dashboard
 * District oversight, analytics, policy implementation
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, TrendingUp, Users, Activity, MapPin, AlertTriangle,
  Loader2, FileText, BarChart3, Download
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const performanceData = [
  { month: 'Jan', patients: 3200, facilities: 18 },
  { month: 'Feb', patients: 3800, facilities: 18 },
  { month: 'Mar', patients: 4200, facilities: 19 },
  { month: 'Apr', patients: 4800, facilities: 19 },
  { month: 'May', patients: 5200, facilities: 20 },
  { month: 'Jun', patients: 5800, facilities: 20 }
]

type FacilityPerformance = {
  id: string
  name: string
  type: string
  patients: number
  staff: number
  rating: number
  status: 'excellent' | 'good' | 'needs_attention'
}

export function DistrictOfficerDashboard() {
  const [loading, setLoading] = useState(true)
  const [facilities] = useState<FacilityPerformance[]>([
    { id: '1', name: 'PHC Gandhi Nagar', type: 'Primary Health Center', patients: 850, staff: 12, rating: 4.5, status: 'excellent' },
    { id: '2', name: 'CHC Shivaji Road', type: 'Community Health Center', patients: 1200, staff: 25, rating: 4.2, status: 'good' },
    { id: '3', name: 'PHC Market Area', type: 'Primary Health Center', patients: 650, staff: 10, rating: 3.8, status: 'good' },
    { id: '4', name: 'PHC Nehru Nagar', type: 'Primary Health Center', patients: 420, staff: 8, rating: 3.2, status: 'needs_attention' }
  ])

  const stats = {
    totalFacilities: 20,
    totalPatients: 5800,
    totalStaff: 245,
    avgSatisfaction: 4.1
  }

  useEffect(() => {
    setTimeout(() => setLoading(false), 600)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 size={40} className="animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-amber-50 via-white to-yellow-50 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2A]">District Health Overview</h1>
          <p className="text-[#5F5E5A] mt-1">District-wide analytics and policy monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <BarChart3 size={18} />
            Analytics
          </button>
          <button className="btn-primary">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Facilities" value={stats.totalFacilities} icon={<Building2 size={24} className="text-amber-600" />} bgColor="bg-amber-50" />
        <StatsCard title="Patients (Month)" value={stats.totalPatients} icon={<Users size={24} className="text-blue-600" />} bgColor="bg-blue-50" />
        <StatsCard title="Total Staff" value={stats.totalStaff} icon={<Activity size={24} className="text-teal-600" />} bgColor="bg-teal-50" />
        <StatsCard title="Avg Satisfaction" value={`${stats.avgSatisfaction}/5`} icon={<TrendingUp size={24} className="text-green-600" />} bgColor="bg-green-50" />
      </div>

      {/* Performance Chart */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-[#2C2C2A] mb-6">District Performance Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="patients" stroke="#14b8a6" fillOpacity={1} fill="url(#colorPatients)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Facility Performance */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-[#2C2C2A] mb-6">Facility Performance</h2>
        <div className="space-y-3">
          {facilities.map((facility) => (
            <div key={facility.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-[#D3D1C7] hover:border-amber-300 hover:bg-amber-50/30 transition-all">
              <div>
                <p className="font-bold text-[#2C2C2A]">{facility.name}</p>
                <p className="text-sm text-[#5F5E5A]">{facility.type} • {facility.staff} staff</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-[#5F5E5A]">Patients</p>
                  <p className="text-lg font-bold text-[#2C2C2A]">{facility.patients}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#5F5E5A]">Rating</p>
                  <p className="text-lg font-bold text-[#2C2C2A]">{facility.rating}⭐</p>
                </div>
                <PerformanceStatusBadge status={facility.status} />
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

function PerformanceStatusBadge({ status }: { status: string }) {
  const styles = {
    excellent: 'bg-green-100 text-green-700 border-green-300',
    good: 'bg-blue-100 text-blue-700 border-blue-300',
    needs_attention: 'bg-amber-100 text-amber-700 border-amber-300'
  }
  const labels = {
    excellent: 'Excellent',
    good: 'Good',
    needs_attention: 'Needs Attention'
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>{labels[status as keyof typeof labels]}</span>
}
