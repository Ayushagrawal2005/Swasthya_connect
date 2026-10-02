import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, Clock, ChevronRight, User, Activity, Loader2, ArrowRight, RefreshCw, GitMerge, Phone, Bell } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { appointmentsApi, referralsApi, chronicApi, type Appointment, type Referral, type ChronicPatient } from '../../services/api'
import { useApp, useT } from '../../context/AppContext'
import { webrtcService } from '../../services/webrtc'

interface TeleconsultRequest {
  sessionId: string
  ashaId: string
  ashaName: string
  patientId: string
  patientName: string
  triageData?: any
  timestamp: number
}

const urgencyBorder: Record<string, string> = { routine: '', urgent: 'border-l-4 border-l-amber-400', emergency: 'border-l-4 border-l-red-500' }
const urgencyBadge:  Record<string, string> = { routine: 'bg-orange-100 text-[#E85D04] px-2.5 py-1 rounded-full text-xs font-medium', urgent: 'bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium', emergency: 'bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium' }

export function DoctorHome() {
  const navigate = useNavigate()
  const { userName, userId, token } = useApp()
  const t = useT()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [acceptedReferrals, setAcceptedReferrals] = useState<Referral[]>([])
  const [pendingReferrals, setPendingReferrals]   = useState<Referral[]>([])
  const [chronicPatients, setChronicPatients] = useState<ChronicPatient[]>([])
  const [loading, setLoading]   = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Teleconsult queue
  const [teleconsultRequests, setTeleconsultRequests] = useState<TeleconsultRequest[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // Connect to signaling server for teleconsult notifications
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    const WS_URL = API_BASE.replace('http', 'ws') + '/ws'

    async function connectToSignaling() {
      try {
        await webrtcService.connect(WS_URL, token || '', userId || 'doctor-unknown')
        setIsConnected(true)
        
        // Register as doctor to receive notifications
        webrtcService.emit('register-doctor', { doctorId: userId })
        
        // Listen for new teleconsult requests
        webrtcService.on('new-teleconsult-request', (request: TeleconsultRequest) => {
          console.log('📞 New teleconsult request:', request)
          setTeleconsultRequests(prev => [...prev, request])
          
          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Teleconsult Request', {
              body: `Patient: ${request.patientName}`,
              icon: '/favicon.svg'
            })
          }
        })

        // Listen for current queue
        webrtcService.on('teleconsult-queue', (queue: TeleconsultRequest[]) => {
          console.log('📋 Current teleconsult queue:', queue)
          setTeleconsultRequests(queue)
        })

        // Listen for accepted/cancelled requests
        webrtcService.on('teleconsult-accepted', (data: { sessionId: string }) => {
          setTeleconsultRequests(prev => prev.filter(r => r.sessionId !== data.sessionId))
        })

        webrtcService.on('teleconsult-cancelled', (data: { sessionId: string }) => {
          setTeleconsultRequests(prev => prev.filter(r => r.sessionId !== data.sessionId))
        })
      } catch (error) {
        console.error('Failed to connect to signaling server:', error)
        setIsConnected(false)
      }
    }

    connectToSignaling()

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      // Cleanup on unmount
      webrtcService.off('new-teleconsult-request')
      webrtcService.off('teleconsult-queue')
      webrtcService.off('teleconsult-accepted')
      webrtcService.off('teleconsult-cancelled')
    }
  }, [token, userId])

  const fetchAll = useCallback(() => {
    return Promise.all([
      appointmentsApi.list({ date: today }).catch(() => [] as Appointment[]),
      referralsApi.incoming().catch(() => [] as Referral[]),
      chronicApi.list().catch(() => [] as ChronicPatient[]),
    ]).then(([appts, refs, chronic]) => {
      setAppointments(appts as Appointment[])
      setAcceptedReferrals((refs as Referral[]).filter(r => r.status === 'accepted'))
      setPendingReferrals((refs as Referral[]).filter(r => r.status === 'pending'))
      setChronicPatients(chronic as ChronicPatient[])
      setLastUpdated(new Date())
    }).finally(() => setLoading(false))
  }, [today])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  const queue = [
    ...appointments.map(a => ({ ...a, _type: 'appointment' as const })),
    ...acceptedReferrals.map(r => ({
      id: r.id,
      patientName: r.patientName,
      time: '—',
      token: 'REF',
      estimatedWait: 0,
      type: 'referral',
      status: 'accepted',
      urgency: r.urgency,
      reason: r.reason,
      _type: 'referral' as const,
    })),
  ]

  const stats: { labelKey: string; value: number | string; icon: React.ReactNode; subKey: string; subVal: number | null; alert?: boolean }[] = [
    { labelKey: 'patientsToday', value: appointments.length,                                        icon: <User size={20} />,     subKey: 'remaining', subVal: appointments.filter(a => a.status === 'scheduled').length },
    { labelKey: 'avgWaitTime',   value: '8m',                                                        icon: <Clock size={20} />,    subKey: 'estimated', subVal: null },
    { labelKey: 'teleconsults',  value: appointments.filter(a => a.type === 'teleconsult').length,   icon: <Video size={20} />,    subKey: 'today',     subVal: null },
    { labelKey: 'referralsIn',   value: pendingReferrals.length + acceptedReferrals.length,          icon: <GitMerge size={20} />, subKey: 'pending',   subVal: pendingReferrals.length, alert: pendingReferrals.length > 0 },
  ]

  // Accept teleconsult request
  function acceptTeleconsult(request: TeleconsultRequest) {
    console.log('✅ Accepting teleconsult:', request.sessionId)
    
    // Emit accept event
    webrtcService.emit('accept-teleconsult', {
      sessionId: request.sessionId,
      doctorId: userId,
      doctorName: userName
    })

    // Navigate to teleconsult page with session ID
    navigate('/doctor/teleconsult', {
      state: {
        sessionId: request.sessionId,
        patientId: request.patientId,
        patientName: request.patientName,
        triageData: request.triageData
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#123B6D] to-[#1a5490] bg-clip-text text-transparent">
                {t('goodMorning')}, Dr. {userName ?? 'Doctor'} 👋
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {lastUpdated && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-medium">{t('live')}</span>
                  <span>·</span>
                  <span>{t('updated')} {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setLoading(true); fetchAll() }}
                className="p-3 rounded-xl bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white hover:shadow-lg transition-all duration-200 hover:scale-105" 
                title="Refresh"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {t('onDuty')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.labelKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition-all duration-200 hover:shadow-xl ${
                  s.alert 
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white' 
                    : 'border-gray-100 hover:border-[#123B6D]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-xl ${s.alert ? 'bg-amber-100 text-amber-600' : 'bg-gradient-to-br from-[#123B6D] to-[#1a5490] text-white'}`}>
                    {s.icon}
                  </div>
                </div>
                <dt className="text-sm text-gray-600 font-medium mb-1">
                  {t(s.labelKey as any)}
                </dt>
                <dd className={`text-3xl font-bold mb-1 ${s.alert ? 'text-amber-600' : 'text-[#123B6D]'}`}>
                  {loading ? <Loader2 size={24} className="animate-spin text-[#E85D04]" /> : s.value}
                </dd>
                <p className="text-xs text-gray-500">
                  {s.subVal !== null ? `${s.subVal} ` : ''}{t(s.subKey as any)}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Chronic Care Summary */}
        {chronicPatients.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#123B6D] flex items-center gap-2">
                <Activity size={20} className="text-[#E85D04]" />
                Chronic Care Patients
                {chronicPatients.filter(p => p.alertLevel === 'urgent' || p.alertLevel === 'warning').length > 0 && (
                  <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Bell size={12} className="animate-pulse" />
                    {chronicPatients.filter(p => p.alertLevel === 'urgent' || p.alertLevel === 'warning').length} Need Review
                  </span>
                )}
              </h2>
              <button 
                onClick={() => navigate('/doctor/chronic')} 
                className="text-sm font-semibold text-[#E85D04] hover:text-[#d94f03] transition-colors"
              >
                View All Chronic Patients →
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-lg p-5 border-2 border-red-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-red-700">Urgent</span>
                  <div className="p-2 rounded-lg bg-red-100">
                    <Activity size={14} className="text-red-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {chronicPatients.filter(p => p.alertLevel === 'urgent').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Need immediate attention</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-lg p-5 border-2 border-amber-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-amber-700">Warning</span>
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Activity size={14} className="text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-amber-600">
                  {chronicPatients.filter(p => p.alertLevel === 'warning').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Worsening condition</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-lg p-5 border-2 border-orange-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#E85D04]">Reminder</span>
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Activity size={14} className="text-[#E85D04]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#E85D04]">
                  {chronicPatients.filter(p => p.alertLevel === 'reminder').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Routine follow-up needed</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-5 border-2 border-[#123B6D]/20 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#123B6D]">Total Managed</span>
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Activity size={14} className="text-[#123B6D]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#123B6D]">
                  {chronicPatients.length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Under continuous care</p>
              </motion.div>
            </div>
          </section>
        )}

        {/* Teleconsult Requests Alert */}
        {teleconsultRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-50 to-orange-50 border-2 border-green-300 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <Phone className="text-white animate-pulse" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2 mb-4">
                  <Bell size={20} className="animate-bounce" />
                  {teleconsultRequests.length} Incoming Teleconsult Request{teleconsultRequests.length > 1 ? 's' : ''}
                </h3>
                <div className="space-y-3">
                  {teleconsultRequests.map((request) => (
                    <div key={request.sessionId} className="bg-white rounded-xl p-4 flex items-center justify-between border-2 border-green-200 shadow-md hover:shadow-lg transition-all">
                      <div className="flex-1">
                        <p className="font-bold text-[#123B6D] text-base">{request.patientName}</p>
                        <p className="text-sm text-gray-600 mt-1">ASHA: {request.ashaName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Waiting {Math.floor((Date.now() - request.timestamp) / 1000 / 60)}m
                        </p>
                      </div>
                      <button
                        onClick={() => acceptTeleconsult(request)}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                      >
                        <Video size={18} />
                        Accept Call
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending referrals alert */}
        {!loading && pendingReferrals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-amber-800">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ArrowRight size={20} className="text-amber-600" />
                </div>
                <span className="font-bold text-base">
                  {pendingReferrals.length} {t('incomingReferralsWaiting')}
                </span>
              </div>
              <button 
                onClick={() => navigate('/doctor/referrals')}
                className="bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                {t('review')} →
              </button>
            </div>
          </motion.div>
        )}

        {/* Queue */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#123B6D] flex items-center gap-2">
              {t('patientQueueLabel')}
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                {queue.length} {t('total')}
              </span>
            </h2>
            <button 
              onClick={() => navigate('/doctor/referrals')} 
              className="text-sm font-semibold text-[#E85D04] hover:text-[#d94f03] transition-colors flex items-center gap-1"
            >
              {t('referrals')} <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 bg-white rounded-2xl shadow-lg">
              <Loader2 className="animate-spin text-[#E85D04]" size={32} />
            </div>
          ) : queue.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-100">
              <p className="text-gray-600">{t('noPatientsInQueue')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item, i) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    const pid = (item as any).patientId || null
                    navigate('/doctor/patient', { state: { patientId: pid, patientName: item.patientName } })
                  }}
                  className={`bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4 cursor-pointer border-2 hover:shadow-xl transition-all duration-200 group ${
                    item._type === 'referral' ? `${urgencyBorder[(item as any).urgency] || ''} border-gray-100 hover:border-[#E85D04]` : 'border-gray-100 hover:border-[#123B6D]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    item._type === 'referral' 
                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' 
                      : 'bg-gradient-to-br from-[#123B6D] to-[#1a5490] text-white'
                  }`}>
                    {item._type === 'referral'
                      ? <ArrowRight size={20} />
                      : item.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-[#123B6D] text-base">{item.patientName}</p>
                      {item._type === 'referral' ? (
                        <>
                          <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium">
                            {t('referrals')}
                          </span>
                          <span className={urgencyBadge[(item as any).urgency] || 'bg-orange-100 text-[#E85D04] px-2.5 py-1 rounded-full text-xs font-medium'}>
                            {t((item as any).urgency as any) || (item as any).urgency}
                          </span>
                        </>
                      ) : (
                        <span className={`${item.type === 'teleconsult' ? 'bg-orange-100 text-[#E85D04]' : 'bg-green-100 text-green-700'} px-2.5 py-1 rounded-full text-xs font-medium`}>
                          {item.type}
                        </span>
                      )}
                    </div>
                    {item._type === 'referral' ? (
                      <p className="text-sm text-gray-600 truncate">{(item as any).reason}</p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {item.time} · {t('token')} {item.token} · ~{item.estimatedWait}m
                      </p>
                    )}
                    {(item as any).patientId && (
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/doctor/patients') }}
                        className="text-xs text-[#E85D04] hover:text-[#d94f03] hover:underline mt-1 inline-block font-medium">
                        ID: {(item as any).patientId.slice(0, 12)}… · {t('searchRecords')} →
                      </button>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-[#E85D04] group-hover:translate-x-1 transition-all" />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/doctor/patients')}  
              className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105 text-center"
            >
              {t('findPatientBtn')}
            </button>
            <button 
              onClick={() => navigate('/doctor/referrals')} 
              className="bg-white border-2 border-[#123B6D] text-[#123B6D] px-6 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105 text-center"
            >
              {t('referralInboxBtn')}
            </button>
            <button 
              onClick={() => navigate('/doctor/followup')}  
              className="bg-white border-2 border-[#123B6D] text-[#123B6D] px-6 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105 text-center"
            >
              {t('followUpBoardBtn')}
            </button>
            <button 
              onClick={() => navigate('/doctor/emergency')} 
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105 text-center"
            >
              {t('emergencyEscalationBtn')}
            </button>
          </div>
        </section>

        <AIPill />
      </div>
    </div>
  )
}
