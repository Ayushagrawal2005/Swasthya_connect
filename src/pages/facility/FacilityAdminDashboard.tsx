/**
 * Facility Administrator Dashboard
 * Overall facility management, staff oversight, resource allocation
 * INTEGRATED WITH REAL-TIME REFERRAL MANAGEMENT
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Activity, TrendingUp, AlertTriangle, Building2,
  UserPlus, Settings, BarChart3, Calendar, Clock, ArrowRight,
  CheckCircle2, XCircle, Loader2, Bed, Ambulance, MapPin,
  Bell, RefreshCw, Navigation, Siren
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { referralManagementService, type Referral, type Facility } from '../../services/referralManagement'
import EmergencyMap from '../../components/emergency/EmergencyMap'

type StaffMember = {
  id: string
  name: string
  role: string
  status: 'active' | 'on_leave' | 'off_duty'
  shift: string
}

type FacilityMetrics = {
  totalStaff: number
  activeStaff: number
  patientsToday: number
  bedsOccupied: number
  bedsTotal: number
  emergencies: number
}

type EmergencyAlert = {
  id: string
  emergencyNumber: string
  patientName: string
  patientId: string
  patientPhone: string
  location: {
    lat: number
    lng: number
    accuracy: number
  }
  severity: 'moderate' | 'high' | 'critical'
  notes: string
  status: 'active' | 'acknowledged' | 'en-route' | 'arrived' | 'resolved'
  triggeredAt: string
  bedReserved: boolean
  bedNumber?: string
  distance?: number
  eta?: string
}

export function FacilityAdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Facility data
  const [facilityInfo, setFacilityInfo] = useState<Facility | null>(null)
  const [bedsAvailable, setBedsAvailable] = useState(18)
  const [bedsTotal] = useState(30)
  
  // Referral data
  const [incomingReferrals, setIncomingReferrals] = useState<Referral[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  
  // Emergency alerts
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([])
  const [activeEmergencies, setActiveEmergencies] = useState(0)
  
  const [metrics, setMetrics] = useState<FacilityMetrics>({
    totalStaff: 45,
    activeStaff: 38,
    patientsToday: 127,
    bedsOccupied: 12,
    bedsTotal: 30,
    emergencies: 3
  })

  useEffect(() => {
    loadData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      // Load facility info (using mock for now - replace with actual facility ID)
      const facilities = await referralManagementService.searchNearbyFacilities({
        latitude: 18.9894,
        longitude: 75.7585,
        radius: 50
      })
      if (facilities.length > 0) {
        const phcBeed = facilities.find(f => f.name === 'PHC Beed') || facilities[0]
        setFacilityInfo(phcBeed)
        setBedsAvailable(phcBeed.bedsAvailable)
        setMetrics(prev => ({
          ...prev,
          bedsTotal: phcBeed.bedCapacity,
          bedsOccupied: phcBeed.bedCapacity - phcBeed.bedsAvailable
        }))
      }

      // Load incoming referrals
      const referrals = await referralManagementService.getReferrals({
        facilityId: 'fac_001', // PHC Beed
        status: ['pending', 'accepted', 'in_transit', 'arrived']
      })
      setIncomingReferrals(referrals)
      setPendingCount(referrals.filter(r => r.status === 'pending').length)
      
      // Load emergency alerts
      const API_BASE = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'
      const response = await fetch(`${API_BASE}/api/emergency?facilityId=fac_001&status=active,acknowledged,en-route`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const alerts = await response.json()
        setEmergencyAlerts(alerts)
        setActiveEmergencies(alerts.filter((a: EmergencyAlert) => ['active', 'acknowledged', 'en-route'].includes(a.status)).length)
        setMetrics(prev => ({
          ...prev,
          emergencies: alerts.length
        }))
      }
      
      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleAcceptReferral(referralId: string) {
    try {
      await referralManagementService.acceptReferral(referralId, {
        bedReserved: true,
        bedNumber: `B-${Math.floor(Math.random() * 30) + 1}`,
        estimatedAdmissionTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      })
      // Refresh data
      loadData()
    } catch (error) {
      console.error('Failed to accept referral:', error)
    }
  }

  async function handleRejectReferral(referralId: string) {
    try {
      await referralManagementService.rejectReferral(referralId, {
        reason: 'No beds available',
        alternativeFacilities: []
      })
      loadData()
    } catch (error) {
      console.error('Failed to reject referral:', error)
    }
  }

  async function handleUpdateBeds(newCount: number) {
    try {
      if (facilityInfo) {
        await referralManagementService.updateBedAvailability(facilityInfo.id, newCount)
        setBedsAvailable(newCount)
        setMetrics(prev => ({
          ...prev,
          bedsOccupied: bedsTotal - newCount
        }))
      }
    } catch (error) {
      console.error('Failed to update beds:', error)
    }
  }

  const bedOccupancyPercent = Math.round((metrics.bedsOccupied / metrics.bedsTotal) * 100)
  const staffUtilization = Math.round((metrics.activeStaff / metrics.totalStaff) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 size={40} className="animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2A] flex items-center gap-3">
            Facility Administration
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-base font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full animate-pulse">
                <Bell size={14} />
                {pendingCount} Pending Referral{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-[#5F5E5A] mt-1">
            {facilityInfo?.name || 'PHC Beed'} · Manage facility operations and resources
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setRefreshing(true); loadData() }}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-secondary">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Bed size={24} className="text-indigo-600" />}
          title="Bed Availability"
          value={`${bedsAvailable}/${bedsTotal}`}
          subtitle={`${bedOccupancyPercent}% occupied`}
          trend={bedOccupancyPercent > 80 ? 'urgent' : 'neutral'}
          bgColor="bg-indigo-50"
        />
        <MetricCard
          icon={<AlertTriangle size={24} className="text-red-600" />}
          title="Pending Referrals"
          value={pendingCount.toString()}
          subtitle="Awaiting response"
          trend={pendingCount > 0 ? 'urgent' : 'neutral'}
          bgColor="bg-red-50"
        />
        <MetricCard
          icon={<Users size={24} className="text-teal-600" />}
          title="Active Staff"
          value={`${metrics.activeStaff}/${metrics.totalStaff}`}
          subtitle={`${staffUtilization}% utilization`}
          trend="up"
          bgColor="bg-teal-50"
        />
        <MetricCard
          icon={<Activity size={24} className="text-blue-600" />}
          title="Patients Today"
          value={metrics.patientsToday.toString()}
          subtitle="12% increase from yesterday"
          trend="up"
          bgColor="bg-blue-50"
        />
      </div>

      {/* BACHAO BACHAO Emergency Alerts - Priority Display */}
      {activeEmergencies > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 shadow-2xl border-4 border-red-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <Siren size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🚨 ACTIVE EMERGENCIES ({activeEmergencies})
                </h2>
                <p className="text-red-100 text-sm">Live patient location tracking - बचाओ बचाओ alerts</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {emergencyAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-5 shadow-lg"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Alert Details */}
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                            {alert.emergencyNumber}
                          </span>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{alert.patientName}</h3>
                        <p className="text-sm text-gray-600">Patient ID: {alert.patientId}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone size={14} className="text-blue-600" />
                        <span>{alert.patientPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin size={14} className="text-green-600" />
                        <span>Distance: {alert.distance?.toFixed(2) || 'Calculating...'} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock size={14} className="text-purple-600" />
                        <span>ETA: {alert.eta || 'Calculating...'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Navigation size={14} className="text-indigo-600" />
                        <span>Accuracy: ±{alert.location.accuracy.toFixed(0)}m</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-600 mb-1">Emergency Notes:</p>
                      <p className="text-sm text-gray-900">{alert.notes}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {alert.bedReserved ? (
                          <span className="flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                            <CheckCircle2 size={14} />
                            Bed {alert.bedNumber} Reserved
                          </span>
                        ) : (
                          <span className="text-sm text-gray-600">No bed reserved yet</span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        alert.status === 'active' ? 'bg-red-100 text-red-700' :
                        alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-700' :
                        alert.status === 'en-route' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {alert.status.toUpperCase().replace('-', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Triggered: {new Date(alert.triggeredAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Mini Map */}
                  <div>
                    <div className="h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                      <EmergencyMap
                        patientLocation={{ lat: alert.location.lat, lng: alert.location.lng }}
                        facilities={facilityInfo ? [{
                          id: facilityInfo.id,
                          name: facilityInfo.name,
                          type: facilityInfo.type,
                          address: facilityInfo.address,
                          phone: facilityInfo.phone,
                          location: facilityInfo.location,
                          bedsAvailable: facilityInfo.bedsAvailable
                        }] : []}
                        accuracy={alert.location.accuracy}
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      {alert.status === 'active' && (
                        <button
                          onClick={async () => {
                            try {
                              const API_BASE = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'
                              await fetch(`${API_BASE}/api/emergency/${alert.id}/acknowledge`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({
                                  bedNumber: `B-${Math.floor(Math.random() * 30) + 1}`,
                                  notes: 'Ambulance dispatched, bed prepared'
                                })
                              })
                              loadData()
                            } catch (error) {
                              console.error('Failed to acknowledge:', error)
                            }
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <Ambulance size={16} />
                          Acknowledge & Dispatch
                        </button>
                      )}
                      <a
                        href={`tel:${alert.patientPhone}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Phone size={16} />
                        Call Patient
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Incoming Referrals - Priority Section */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#2C2C2A] flex items-center gap-2">
              <MapPin size={20} className="text-red-600" />
              Incoming Referrals
              {pendingCount > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                  {pendingCount} New
                </span>
              )}
            </h2>
            <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              View All →
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {incomingReferrals.length === 0 ? (
              <div className="text-center py-8 text-[#5F5E5A]">
                <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No incoming referrals</p>
              </div>
            ) : (
              incomingReferrals.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    referral.priority === 'high'
                      ? 'bg-red-50 border-red-300'
                      : referral.priority === 'normal'
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-300'
                  } ${referral.status === 'pending' ? 'border-l-4' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-[#2C2C2A]">{referral.patientName}</p>
                        <span className="text-xs bg-white px-2 py-0.5 rounded-full border">
                          {referral.referralNumber}
                        </span>
                        {referral.priority === 'high' && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <AlertTriangle size={10} />
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#5F5E5A] mb-2">
                        From: <span className="font-medium">{referral.referringFacilityName}</span>
                      </p>
                      <p className="text-sm text-[#2C2C2A] mb-2">
                        <strong>Reason:</strong> {referral.reason}
                      </p>
                      {referral.vitals && (
                        <div className="flex gap-3 text-xs text-[#5F5E5A] mb-2">
                          <span>BP: {referral.vitals.bloodPressure}</span>
                          <span>Temp: {referral.vitals.temperature}</span>
                          <span>SpO2: {referral.vitals.oxygenSaturation}</span>
                        </div>
                      )}
                      <p className="text-xs text-[#5F5E5A]">
                        Referred: {new Date(referral.referralDate).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {referral.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptReferral(referral.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={14} />
                        Accept & Reserve Bed
                      </button>
                      <button
                        onClick={() => handleRejectReferral(referral.id)}
                        className="bg-gray-200 hover:bg-gray-300 text-[#2C2C2A] text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        <XCircle size={14} className="inline mr-1" />
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        referral.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        referral.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                        referral.status === 'arrived' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {referral.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {referral.ambulanceDetails && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <Ambulance size={10} />
                          Ambulance En Route
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Bed Management & Quick Actions */}
        <div className="space-y-6">
          {/* Bed Management Card */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-[#2C2C2A] mb-4 flex items-center gap-2">
              <Bed size={20} className="text-indigo-600" />
              Bed Management
            </h2>
            
            <div className="space-y-4">
              {/* Bed Visualization */}
              <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-indigo-900">Capacity Status</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {bedsAvailable}/{bedsTotal}
                  </span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      bedOccupancyPercent > 80 ? 'bg-red-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${bedOccupancyPercent}%` }}
                  />
                </div>
                <p className="text-xs text-indigo-700">
                  {bedsTotal - bedsAvailable} occupied · {bedsAvailable} available
                </p>
              </div>

              {/* Quick Bed Update */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#2C2C2A]">Update Available Beds</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max={bedsTotal}
                    value={bedsAvailable}
                    onChange={(e) => setBedsAvailable(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border-2 border-[#D3D1C7] rounded-lg focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={() => handleUpdateBeds(bedsAvailable)}
                    className="btn-primary text-sm py-2"
                  >
                    Update
                  </button>
                </div>
                <p className="text-xs text-[#5F5E5A]">
                  This will update bed availability across the system
                </p>
              </div>

              {/* Bed Status Alert */}
              {bedOccupancyPercent > 80 && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">High Occupancy</p>
                    <p className="text-xs text-amber-700">Consider rejecting non-urgent referrals</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-[#2C2C2A] mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <ActionButton
                icon={<Users size={18} />}
                label="Manage Staff"
                onClick={() => navigate('/admin/staff')}
              />
              <ActionButton
                icon={<BarChart3 size={18} />}
                label="View Reports"
                onClick={() => {}}
              />
              <ActionButton
                icon={<Calendar size={18} />}
                label="Schedule Shifts"
                onClick={() => {}}
              />
              <ActionButton
                icon={<Ambulance size={18} />}
                label="Ambulance Status"
                onClick={() => navigate('/facility/ambulance')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Referral Activities */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-[#2C2C2A] mb-6 flex items-center gap-2">
          <Clock size={20} className="text-teal-600" />
          Recent Referral Activities
        </h2>
        <div className="space-y-3">
          {incomingReferrals.slice(0, 5).map((ref, idx) => (
            <ActivityItem
              key={ref.id}
              icon={
                ref.status === 'accepted' ? <CheckCircle2 size={16} className="text-green-600" /> :
                ref.status === 'pending' ? <Clock size={16} className="text-amber-600" /> :
                <Activity size={16} className="text-blue-600" />
              }
              text={`${ref.patientName} - ${ref.status.replace('_', ' ')}`}
              time={new Date(ref.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            />
          ))}
          {incomingReferrals.length === 0 && (
            <p className="text-sm text-[#5F5E5A] text-center py-4">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper Components
function MetricCard({ icon, title, value, subtitle, trend, bgColor }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${bgColor} border-2 border-transparent hover:border-teal-300 transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div>
        {trend === 'up' && <TrendingUp size={16} className="text-green-600" />}
        {trend === 'urgent' && <AlertTriangle size={16} className="text-red-600" />}
      </div>
      <h3 className="text-2xl font-bold text-[#2C2C2A] mb-1">{value}</h3>
      <p className="text-xs font-medium text-[#5F5E5A] mb-1">{title}</p>
      <p className="text-xs text-[#5F5E5A]">{subtitle}</p>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: 'bg-green-100 text-green-700 border-green-300',
    on_leave: 'bg-amber-100 text-amber-700 border-amber-300',
    off_duty: 'bg-gray-100 text-gray-700 border-gray-300'
  }
  const labels = {
    active: 'Active',
    on_leave: 'On Leave',
    off_duty: 'Off Duty'
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  )
}

function ActionButton({ icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-[#D3D1C7] hover:border-teal-500 hover:bg-teal-50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="text-teal-600 group-hover:scale-110 transition-transform">{icon}</div>
        <span className="font-medium text-[#2C2C2A]">{label}</span>
      </div>
      <ArrowRight size={16} className="text-[#5F5E5A] group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
    </button>
  )
}

function ActivityItem({ icon, text, time }: any) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-[#2C2C2A]">{text}</p>
        <p className="text-xs text-[#5F5E5A] mt-0.5">{time}</p>
      </div>
    </div>
  )
}
