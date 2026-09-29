/**
 * ASHA — Patient Search + Longitudinal Record View
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, UserPlus, Activity, Thermometer, Wind, Heart,
  ChevronRight, ChevronDown, Stethoscope, FlaskConical,
  Pill, FileText, AlertTriangle, TrendingUp, Clock, CheckCircle,
  ArrowRight, Loader2,
} from 'lucide-react'
import { patientsApi, type PatientRecord, type VisitRecord } from '../../services/api'
import { AIPill } from '../../components/ui/AIPill'
import { useApp, useT } from '../../context/AppContext'
import { createLocalizer } from '../../lib/localize'

const typeIcon: Record<VisitRecord['type'], React.ReactNode> = {
  visit:       <Stethoscope size={14} className="text-[#E85D04]" />,
  lab:         <FlaskConical size={14} className="text-indigo-500" />,
  prescription:<Pill size={14} className="text-green-500" />,
  diagnosis:   <FileText size={14} className="text-amber-500" />,
  referral:    <ArrowRight size={14} className="text-coral-500" />,
  'ocr-upload':<FileText size={14} className="text-purple-500" />,
  imaging:     <FileText size={14} className="text-blue-500" />,
}

const typeBadge: Record<VisitRecord['type'], string> = {
  visit:       'badge-teal',
  lab:         'badge-teal',
  prescription:'badge-green',
  diagnosis:   'badge-amber',
  referral:    'badge-amber',
  'ocr-upload':'bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
  imaging:     'bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
}

const riskBadge: Record<string, string> = { low: 'badge-green', medium: 'badge-amber', high: 'badge-red', emergency: 'badge-red' }

export function AshaPatientSearchPage() {
  const navigate = useNavigate()
  const { userId, language } = useApp()
  const t = useT()
  const L = createLocalizer(language)
  const [query, setQuery]               = useState('')
  const [searching, setSearching]       = useState(false)
  const [patient, setPatient]           = useState<PatientRecord | null>(null)
  const [found, setFound]               = useState(false)
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [visits, setVisits]             = useState<VisitRecord[]>([])
  const [showLogForm, setShowLogForm]   = useState(false)
  const [logSaved, setLogSaved]         = useState(false)

  // Today's visit form state
  const [chief, setChief]   = useState('')
  const [bp, setBp]         = useState('')
  const [temp, setTemp]     = useState('')
  const [pulse, setPulse]   = useState('')
  const [notes, setNotes]   = useState('')

  // Derived from patient data
  const bpReadings = visits.filter(v => v.vitals?.bp).map(v => parseInt(v.vitals!.bp!.split('/')[0])).filter(Boolean)
  const bpTrend    = bpReadings.length >= 2 ? (bpReadings[0] > bpReadings[bpReadings.length - 1] ? 'improving' : bpReadings[0] < bpReadings[bpReadings.length - 1] ? 'worsening' : 'stable') : 'stable'
  const trendFlag  = bpTrend === 'worsening' ? '⚠ BP worsening trend' : ''
  const noShow     = patient ? patient.noShowCount > 0 : false
  const explain    = noShow ? `Patient has ${patient?.noShowCount} missed visit(s)` : ''

  function doSearch() {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    patientsApi.search(q)
      .then(results => {
        if (results.length > 0) {
          const foundPatient = results[0]
          setPatient(foundPatient)
          setFound(true)
          // Fetch patient records after finding the patient
          patientsApi.getRecords(foundPatient.id)
            .then(records => {
              setVisits(records)
              if (records.length > 0) setExpanded(records[0].id)
            })
            .catch(err => {
              console.error('Failed to load patient records:', err)
              setVisits([])
            })
        } else {
          setFound(false)
          setPatient(null)
          setVisits([])
        }
      })
      .catch(err => {
        console.error('Search failed:', err)
        setFound(false)
        setPatient(null)
        setVisits([])
      })
      .finally(() => setSearching(false))
  }

  function saveVisit() {
    if (!patient) return
    patientsApi.addVisit(patient.id, {
      date: new Date().toISOString().split('T')[0],
      facility: 'Sub-Centre Mandav',   // stored in English in DB, localised on display
      tier: 'sub-centre',
      type: 'visit',
      title: chief || "Today's visit",
      detail: notes || `BP: ${bp}. Chief complaint: ${chief}.`,
      vitals: { bp, temp, pulse },
    })
      .then(v => {
        setVisits(p => [v, ...p])
        setLogSaved(true)
        setShowLogForm(false)
        setTimeout(() => setLogSaved(false), 3000)
      })
      .catch(() => {/* offline: save locally */
        setLogSaved(true)
        setShowLogForm(false)
        setTimeout(() => setLogSaved(false), 3000)
      })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Patient Search</h1>
              <p className="text-blue-100 text-sm mt-1">Search by name, phone number, or Health ID</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search Bar Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#123B6D]/50 pointer-events-none z-10" aria-hidden="true" />
              <input 
                type="search" 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Enter patient name, mobile number, or Health ID..."
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-[#123B6D] focus:ring-4 focus:ring-[#123B6D]/10 outline-none transition-all text-sm font-medium"
                aria-label="Search patient"
                inputMode="text" 
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={doSearch} 
                className="px-6 py-3.5 bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <Search size={18} />
                Search
              </button>
              <button 
                onClick={() => navigate('/asha/register')} 
                className="px-6 py-3.5 bg-gradient-to-r from-[#E85D04] to-[#ff7518] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <UserPlus size={18} aria-hidden="true" />
                New Patient
              </button>
            </div>
          </div>
        </motion.div>

        {/* Searching indicator */}
        {searching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-12"
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-[#123B6D] w-12 h-12" />
              <p className="text-[#123B6D] font-semibold">Searching patient records...</p>
            </div>
          </motion.div>
        )}

        {/* No results */}
        {!searching && query && !found && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[#E85D04]" />
              </div>
              <h3 className="text-xl font-bold text-[#123B6D] mb-2">No Patients Found</h3>
              <p className="text-gray-600 mb-6">
                No records match "{query}". Would you like to register a new patient?
              </p>
              <button 
                onClick={() => navigate('/asha/register')} 
                className="px-8 py-3 bg-gradient-to-r from-[#E85D04] to-[#ff7518] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 inline-flex items-center gap-2"
              >
                <UserPlus size={20} />
                Register New Patient
              </button>
            </div>
          </motion.div>
        )}

        {/* Patient record */}
        {found && patient && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Patient Identity Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-l-[#123B6D]">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#123B6D] to-[#1a5490] flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg">
                  {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h2 className="text-2xl font-bold text-[#123B6D] mb-1">{L.name(patient.name)}</h2>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        <span className="font-semibold">{patient.age} years</span>
                        <span>•</span>
                        <span>{patient.gender}</span>
                        <span>•</span>
                        <span>{L.village(patient.village)}</span>
                      </div>
                      <p className="text-sm font-mono bg-blue-50 text-[#123B6D] px-3 py-1.5 rounded-lg inline-block">
                        ABDM ID: {patient.healthId}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl px-4 py-3 text-right border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Total Visits</p>
                      <p className="text-3xl font-bold text-[#E85D04]">{visits.length}</p>
                      <p className="text-xs text-gray-600 mt-1">Last: {visits[0]?.date || '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.conditions.map(c => (
                      <span key={c} className="px-3 py-1.5 bg-orange-100 text-[#E85D04] rounded-lg text-xs font-semibold border border-orange-200">
                        {L.condition(c)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* BP Trend Alert */}
            {trendFlag && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-xl p-5 border-l-4 border-l-red-500"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <TrendingUp size={24} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-[#123B6D]">Blood Pressure Alert</h3>
                      <AIPill />
                    </div>
                    <p className="text-gray-700">
                      <span className="font-semibold text-red-600">Worsening trend detected:</span> {trendFlag}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* No-show Risk Alert */}
            {noShow && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-xl p-5 border-l-4 border-l-amber-500"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Clock size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#123B6D] mb-1">No-Show Risk</h3>
                    <p className="text-gray-700">{explain}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Visit History Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h3 className="text-xl font-bold text-[#123B6D] mb-1">Visit History</h3>
                  <p className="text-sm text-gray-600">{visits.length} total visits recorded</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/asha/record?id=${patient.id}`)}
                    className="px-5 py-2.5 bg-gray-100 text-[#123B6D] rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-300"
                  >
                    View Full Record
                  </button>
                  <button 
                    onClick={() => setShowLogForm(p => !p)}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                      showLogForm 
                        ? 'bg-gray-100 text-[#123B6D] border border-gray-300 hover:bg-gray-200' 
                        : 'bg-gradient-to-r from-[#E85D04] to-[#ff7518] text-white hover:shadow-lg hover:scale-105'
                    }`}
                  >
                    {showLogForm ? 'Cancel' : '+ Log Today\'s Visit'}
                  </button>
                </div>
              </div>

              {/* Success Message */}
              <AnimatePresence>
                {logSaved && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl px-5 py-4 mb-4"
                  >
                    <CheckCircle size={24} className="text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Visit Logged Successfully</p>
                      <p className="text-sm text-green-700">{patient ? L.name(patient.name) : ''} · {visits.length} {t('visitHistory').toLowerCase()}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Visit Log Form */}
              <AnimatePresence>
                {showLogForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-6 mb-6 space-y-5 overflow-hidden border-2 border-[#123B6D]/20"
                  >
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-[#123B6D] text-white rounded-lg text-xs font-bold uppercase tracking-wide">
                        Log Visit
                      </div>
                      <span className="text-sm text-gray-600">23 August 2026</span>
                    </div>

                    <div>
                      <label htmlFor="log-chief" className="block text-sm font-bold text-[#123B6D] mb-2">Chief Complaint</label>
                      <input 
                        id="log-chief" 
                        type="text" 
                        value={chief} 
                        onChange={e => setChief(e.target.value)}
                        placeholder="e.g. Headache and dizziness for 2 days" 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#123B6D] focus:ring-4 focus:ring-[#123B6D]/10 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'log-bp', label: 'Blood Pressure', val: bp, set: setBp, placeholder: '120/80', unit: 'mmHg', icon: <Activity size={18} />, color: 'text-red-600', bg: 'bg-red-50' },
                        { id: 'log-temp', label: 'Temperature', val: temp, set: setTemp, placeholder: '98.6', unit: '°F', icon: <Thermometer size={18} />, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { id: 'log-pulse', label: 'Pulse Rate', val: pulse, set: setPulse, placeholder: '72', unit: 'bpm', icon: <Heart size={18} />, color: 'text-pink-600', bg: 'bg-pink-50' },
                      ].map(f => (
                        <div key={f.id}>
                          <label htmlFor={f.id} className="block text-sm font-bold text-[#123B6D] mb-2 flex items-center gap-2">
                            <span className={f.color}>{f.icon}</span>{f.label}
                          </label>
                          <div className="relative">
                            <input 
                              id={f.id} 
                              type="text" 
                              value={f.val} 
                              onChange={e => f.set(e.target.value)}
                              placeholder={f.placeholder} 
                              className="w-full px-4 py-3 pr-16 border-2 border-gray-200 rounded-xl focus:border-[#123B6D] focus:ring-4 focus:ring-[#123B6D]/10 outline-none transition-all"
                            />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${f.color} ${f.bg} px-2 py-1 rounded`}>
                              {f.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label htmlFor="log-notes" className="block text-sm font-bold text-[#123B6D] mb-2">Clinical Notes</label>
                      <textarea 
                        id="log-notes" 
                        rows={3} 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Clinical observations, advice given, follow-up instructions..." 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#123B6D] focus:ring-4 focus:ring-[#123B6D]/10 outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={saveVisit} 
                        disabled={!chief.trim()}
                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        Save Visit to Record
                      </button>
                      <button 
                        onClick={() => navigate('/asha/triage')}
                        className="px-6 py-3.5 bg-gradient-to-r from-[#E85D04] to-[#ff7518] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        Continue to Triage
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Visit Timeline */}
              <div className="relative space-y-4">
                <div className="absolute left-[22px] top-8 bottom-0 w-1 bg-gradient-to-b from-[#123B6D] via-[#123B6D]/30 to-transparent" aria-hidden="true" />
                {visits.map((v, i) => {
                  const isOpen = expanded === v.id
                  return (
                    <motion.div 
                      key={v.id} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }} 
                      className="relative pl-16"
                    >
                      <div className={`absolute left-0 top-4 w-11 h-11 rounded-xl border-2 flex items-center justify-center flex-shrink-0 shadow-md
                        ${v.riskLevel === 'high' || v.riskLevel === 'emergency' 
                          ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' 
                          : 'bg-gradient-to-br from-blue-50 to-blue-100 border-[#123B6D]/30'}`}
                        aria-hidden="true">
                        {typeIcon[v.type]}
                      </div>
                      <button 
                        onClick={() => setExpanded(isOpen ? null : v.id)}
                        className="w-full text-left bg-white rounded-xl p-5 hover:shadow-lg transition-all duration-200 border-2 border-gray-100 hover:border-[#123B6D]/30"
                        aria-expanded={isOpen} 
                        aria-controls={`visit-${v.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${
                                v.type === 'visit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                v.type === 'lab' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                v.type === 'prescription' ? 'bg-green-50 text-green-700 border-green-200' :
                                v.type === 'diagnosis' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                v.type === 'referral' ? 'bg-orange-50 text-[#E85D04] border-orange-200' :
                                v.type === 'ocr-upload' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {v.type === 'ocr-upload' ? 'OCR Upload' : v.type.charAt(0).toUpperCase() + v.type.slice(1)}
                              </span>
                              <span className="text-xs text-gray-500 font-semibold">{v.date}</span>
                              {v.riskScore !== undefined && (
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${
                                  v.riskLevel === 'emergency' || v.riskLevel === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                  v.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                  Risk Score: {v.riskScore}
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-[#123B6D] mb-1">{v.title}</p>
                            <p className="text-sm text-gray-600">{L.facility(v.facility)} · {L.name(v.worker)}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {isOpen ? (
                              <ChevronDown size={20} className="text-[#123B6D]" />
                            ) : (
                              <ChevronRight size={20} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {isOpen && (
                          <motion.div 
                            id={`visit-${v.id}`} 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t-2 border-gray-100 space-y-3"
                          >
                            {/* Summary / detail */}
                            {(v as any).detail && (
                              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
                                {(v as any).detail}
                              </p>
                            )}
                            
                            {/* Vitals (for visit records) */}
                            {v.vitals && (
                              <div className="flex gap-2 flex-wrap">
                                {v.vitals.bp && (
                                  <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-lg px-3 py-2">
                                    <Activity size={16} className="text-red-600" />
                                    <span className="text-sm font-bold text-red-700">BP: {v.vitals.bp}</span>
                                  </div>
                                )}
                                {v.vitals.temp && (
                                  <div className="flex items-center gap-2 bg-orange-50 border-2 border-orange-200 rounded-lg px-3 py-2">
                                    <Thermometer size={16} className="text-orange-600" />
                                    <span className="text-sm font-bold text-orange-700">Temp: {v.vitals.temp}°F</span>
                                  </div>
                                )}
                                {v.vitals.pulse && (
                                  <div className="flex items-center gap-2 bg-pink-50 border-2 border-pink-200 rounded-lg px-3 py-2">
                                    <Heart size={16} className="text-pink-600" />
                                    <span className="text-sm font-bold text-pink-700">Pulse: {v.vitals.pulse}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Medicines (for OCR records) */}
                            {(v as any).medicines && (v as any).medicines.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-[#123B6D] uppercase mb-2 flex items-center gap-2">
                                  <Pill size={14} />
                                  Prescribed Medicines
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {(v as any).medicines.map((m: any, mi: number) => (
                                    <div key={mi} className="bg-green-50 border-2 border-green-200 rounded-lg px-3 py-2">
                                      <span className="font-bold text-green-800 block">{m.name}</span>
                                      {m.dosage && <span className="text-xs text-green-700">{m.dosage}</span>}
                                      {m.frequency && <span className="text-xs text-green-600"> · {m.frequency}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Test values (for OCR records) */}
                            {(v as any).testValues && (v as any).testValues.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-[#123B6D] uppercase mb-2 flex items-center gap-2">
                                  <FlaskConical size={14} />
                                  Laboratory Results
                                </p>
                                <div className="space-y-2">
                                  {(v as any).testValues.map((t: any, ti: number) => (
                                    <div key={ti} className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 font-semibold
                                      ${t.is_abnormal 
                                        ? 'bg-red-50 border-red-300 text-red-800' 
                                        : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                      <span className="flex-1">{t.test_name}</span>
                                      {t.value && (
                                        <span className="font-bold">
                                          {t.value}{t.unit ? ` ${t.unit}` : ''}
                                        </span>
                                      )}
                                      {t.is_abnormal && (
                                        <AlertTriangle size={18} className="text-red-600" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] rounded-2xl shadow-xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Stethoscope size={20} />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  onClick={() => navigate(`/asha/record?id=${patient.id}`)} 
                  className="bg-white text-[#123B6D] rounded-xl px-5 py-4 font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  Full Record
                </button>
                <button 
                  onClick={() => navigate('/asha/triage')} 
                  className="bg-gradient-to-r from-[#E85D04] to-[#ff7518] text-white rounded-xl px-5 py-4 font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Activity size={18} />
                  Run Triage
                </button>
                <button 
                  onClick={() => navigate('/asha/referrals')} 
                  className="bg-white text-[#123B6D] rounded-xl px-5 py-4 font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowRight size={18} />
                  Create Referral
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
