/**
 * Ambulance Coordinator Dashboard
 * Emergency transport, vehicle tracking, dispatch management
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Ambulance, MapPin, Phone, Clock, CheckCircle2, AlertTriangle,
  Loader2, Navigation, Activity
} from 'lucide-react'

type AmbulanceVehicle = {
  id: string
  vehicleNumber: string
  status: 'available' | 'dispatched' | 'en_route' | 'maintenance'
  driver: string
  location: string
  fuelLevel: number
}

type EmergencyRequest = {
  id: string
  patientName: string
  location: string
  priority: 'critical' | 'urgent' | 'non_urgent'
  status: 'pending' | 'dispatched' | 'completed'
  requestedAt: string
}

export function AmbulanceCoordinatorDashboard() {
  const [loading, setLoading] = useState(true)
  const [vehicles] = useState<AmbulanceVehicle[]>([
    { id: '1', vehicleNumber: 'MH-12-AB-1234', status: 'available', driver: 'Rajesh Kumar', location: 'Base Station', fuelLevel: 85 },
    { id: '2', vehicleNumber: 'MH-12-CD-5678', status: 'dispatched', driver: 'Suresh Patil', location: 'En Route to Gandhi Hospital', fuelLevel: 60 },
    { id: '3', vehicleNumber: 'MH-12-EF-9012', status: 'available', driver: 'Vijay Sharma', location: 'Base Station', fuelLevel: 90 },
    { id: '4', vehicleNumber: 'MH-12-GH-3456', status: 'maintenance', driver: '-', location: 'Workshop', fuelLevel: 20 }
  ])

  const [requests] = useState<EmergencyRequest[]>([
    { id: '1', patientName: 'Anita Devi (62F)', location: 'Shivaji Nagar, Ward 5', priority: 'critical', status: 'pending', requestedAt: '10:15 AM' },
    { id: '2', patientName: 'Ramesh Patil (45M)', location: 'Market Road', priority: 'urgent', status: 'dispatched', requestedAt: '10:30 AM' }
  ])

  const stats = {
    available: vehicles.filter(v => v.status === 'available').length,
    dispatched: vehicles.filter(v => v.status === 'dispatched').length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    completedToday: 8
  }

  useEffect(() => {
    setTimeout(() => setLoading(false), 600)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 size={40} className="animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-red-50 via-white to-orange-50 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2A]">Ambulance Coordination</h1>
          <p className="text-[#5F5E5A] mt-1">Emergency dispatch and vehicle management</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <MapPin size={18} />
            View Map
          </button>
          <button className="btn-primary">
            <Phone size={18} />
            Emergency Call
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Available" value={stats.available} icon={<CheckCircle2 size={24} className="text-green-600" />} bgColor="bg-green-50" />
        <StatsCard title="Dispatched" value={stats.dispatched} icon={<Navigation size={24} className="text-blue-600" />} bgColor="bg-blue-50" />
        <StatsCard title="Pending Requests" value={stats.pendingRequests} icon={<AlertTriangle size={24} className="text-amber-600" />} bgColor="bg-amber-50" />
        <StatsCard title="Completed Today" value={stats.completedToday} icon={<Activity size={24} className="text-teal-600" />} bgColor="bg-teal-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Emergency Requests */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-[#2C2C2A] mb-6">Emergency Requests</h2>
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className={`p-4 rounded-xl border-2 ${req.priority === 'critical' ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'} hover:shadow-lg transition-all`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-[#2C2C2A]">{req.patientName}</p>
                    <p className="text-sm text-[#5F5E5A] flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {req.location}
                    </p>
                  </div>
                  <PriorityBadge priority={req.priority} />
                </div>
                <p className="text-xs text-[#5F5E5A] mb-3">{req.requestedAt}</p>
                <button className="btn-primary w-full">Dispatch Ambulance</button>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Status */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-[#2C2C2A] mb-6">Fleet Status</h2>
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-4 rounded-xl border-2 border-[#D3D1C7] hover:border-red-300 hover:bg-red-50/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-[#2C2C2A]">{vehicle.vehicleNumber}</p>
                    <p className="text-sm text-[#5F5E5A]">{vehicle.driver}</p>
                  </div>
                  <VehicleStatusBadge status={vehicle.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-[#5F5E5A] mt-2">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {vehicle.location}</span>
                  <span>Fuel: {vehicle.fuelLevel}%</span>
                </div>
              </div>
            ))}
          </div>
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
  const styles = {
    critical: 'bg-red-600 text-white border-red-700',
    urgent: 'bg-amber-100 text-amber-700 border-amber-300',
    non_urgent: 'bg-teal-100 text-teal-700 border-teal-300'
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[priority as keyof typeof styles]}`}>{priority.toUpperCase()}</span>
}

function VehicleStatusBadge({ status }: { status: string }) {
  const styles = {
    available: 'bg-green-100 text-green-700 border-green-300',
    dispatched: 'bg-blue-100 text-blue-700 border-blue-300',
    en_route: 'bg-amber-100 text-amber-700 border-amber-300',
    maintenance: 'bg-gray-100 text-gray-700 border-gray-300'
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>{status.replace('_', ' ').toUpperCase()}</span>
}
