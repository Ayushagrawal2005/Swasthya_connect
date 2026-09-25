/**
 * Pharmacist Dashboard
 * Prescription processing, inventory management, drug dispensing
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Pill, Package, AlertTriangle, TrendingDown, Search,
  CheckCircle2, Clock, Loader2, Plus, FileText
} from 'lucide-react'

type Prescription = {
  id: string
  patientName: string
  tokenNumber: string
  medicines: number
  status: 'pending' | 'ready' | 'dispensed'
  time: string
}

type StockItem = {
  id: string
  name: string
  quantity: number
  minStock: number
  expiryDate: string
  status: 'ok' | 'low' | 'critical'
}

export function PharmacyDashboard() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'inventory'>('prescriptions')

  const [stats] = useState({
    pending: 8,
    ready: 12,
    dispensed: 45,
    lowStock: 6
  })

  const [prescriptions] = useState<Prescription[]>([
    { id: '1', patientName: 'Sunita Devi', tokenNumber: 'T101', medicines: 3, status: 'pending', time: '10:15 AM' },
    { id: '2', patientName: 'Ramesh Kumar', tokenNumber: 'T102', medicines: 5, status: 'ready', time: '10:30 AM' },
    { id: '3', patientName: 'Anita Sharma', tokenNumber: 'E001', medicines: 2, status: 'ready', time: '10:45 AM' }
  ])

  const [inventory] = useState<StockItem[]>([
    { id: '1', name: 'Paracetamol 500mg', quantity: 250, minStock: 500, expiryDate: '2025-06-30', status: 'low' },
    { id: '2', name: 'Amoxicillin 250mg', quantity: 80, minStock: 200, expiryDate: '2025-03-15', status: 'critical' },
    { id: '3', name: 'Metformin 500mg', quantity: 800, minStock: 300, expiryDate: '2025-12-31', status: 'ok' },
    { id: '4', name: 'Aspirin 75mg', quantity: 150, minStock: 400, expiryDate: '2024-08-20', status: 'low' }
  ])

  useEffect(() => {
    setTimeout(() => setLoading(false), 600)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2A]">Pharmacy Dashboard</h1>
          <p className="text-[#5F5E5A] mt-1">Prescription processing and inventory control</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <FileText size={18} />
            Print Report
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Add Stock
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Pending" value={stats.pending} icon={<Clock size={24} className="text-amber-600" />} bgColor="bg-amber-50" />
        <StatsCard title="Ready to Dispense" value={stats.ready} icon={<CheckCircle2 size={24} className="text-green-600" />} bgColor="bg-green-50" />
        <StatsCard title="Dispensed Today" value={stats.dispensed} icon={<Pill size={24} className="text-blue-600" />} bgColor="bg-blue-50" />
        <StatsCard title="Low Stock Items" value={stats.lowStock} icon={<AlertTriangle size={24} className="text-red-600" />} bgColor="bg-red-50" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-[#D3D1C7]">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'prescriptions'
              ? 'text-blue-600 border-b-2 border-blue-600 -mb-0.5'
              : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          Prescriptions
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'inventory'
              ? 'text-blue-600 border-b-2 border-blue-600 -mb-0.5'
              : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          Inventory
        </button>
      </div>

      {/* Content */}
      {activeTab === 'prescriptions' ? (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-[#2C2C2A] mb-6">Active Prescriptions</h2>
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-[#D3D1C7] hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div>
                  <p className="font-bold text-[#2C2C2A]">{rx.patientName}</p>
                  <p className="text-sm text-[#5F5E5A]">{rx.tokenNumber} • {rx.medicines} medicines • {rx.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={rx.status} />
                  <button className="btn-primary py-2 px-4">Process</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-[#2C2C2A] mb-6">Medicine Inventory</h2>
          <div className="space-y-3">
            {inventory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-[#D3D1C7] hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div>
                  <p className="font-bold text-[#2C2C2A]">{item.name}</p>
                  <p className="text-sm text-[#5F5E5A]">Expires: {item.expiryDate} • Min stock: {item.minStock}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-[#5F5E5A]">Available</p>
                    <p className="text-xl font-bold text-[#2C2C2A]">{item.quantity}</p>
                  </div>
                  <StockStatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-300',
    ready: 'bg-green-100 text-green-700 border-green-300',
    dispensed: 'bg-gray-100 text-gray-700 border-gray-300'
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>{status.toUpperCase()}</span>
}

function StockStatusBadge({ status }: { status: string }) {
  const styles = {
    ok: 'bg-green-100 text-green-700 border-green-300',
    low: 'bg-amber-100 text-amber-700 border-amber-300',
    critical: 'bg-red-100 text-red-700 border-red-300'
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles]}`}>{status.toUpperCase()}</span>
}
