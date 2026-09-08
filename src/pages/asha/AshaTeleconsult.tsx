/**
 * ASHA — Assisted Teleconsultation (Module 3, frontline-facilitated)
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Mic, MicOff, VideoOff, Phone, MessageSquare,
  CheckCircle, Wifi, WifiOff, Volume2, User, FileText,
  Monitor, Pill, Loader2, Upload, Play, Pause, Download,
  ChevronRight, ChevronLeft, Activity, AlertCircle, X,
} from 'lucide-react'
import { teleconsultApi, patientsApi, type Doctor } from '../../services/api'
import { AIPill } from '../../components/ui/AIPill'
import { useApp } from '../../context/AppContext'
import { meena } from '../../data/meenaPatient'

type CallState = 'setup' | 'waiting' | 'live' | 'ended'

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface PrescriptionData {
  patientName: string
  patientAge: number
  patientGender: string
  symptoms: string[]
  diagnosis: string
  medicines: Medicine[]
  advice: string[]
  doctorName: string
  date: string
}

const preChecks = [
  { label: 'Microphone working',  icon: <Mic size={15} />,     ok: true },
  { label: 'Camera working',      icon: <Video size={15} />,   ok: true },
  { label: 'Internet / hotspot',  icon: <Wifi size={15} />,    ok: true },
  { label: 'Speaker audible',     icon: <Volume2 size={15} />, ok: true },
]

export function AshaTeleconsultPage() {
  const { isOnline, userName } = useApp()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [availableDoctors, setAvailableDoctors] = useState<(Doctor & { facility: string })[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<(Doctor & { facility: string }) | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [callState, setCallState] = useState<CallState>('setup')
  const [micOn, setMicOn]         = useState(true)
  const [camOn, setCamOn]         = useState(true)
  const [chatOpen, setChatOpen]   = useState(false)
  const [patientPanelOpen, setPatientPanelOpen] = useState(false)
  const [chatMsg, setChatMsg]     = useState('')
  const [messages, setMessages]   = useState([
    { from: 'doctor', text: "Good morning. I can see the patient's record. Let me review the vitals and history before we start." },
  ])
  
  // Video consultation recording feature
  const [hasVideo, setHasVideo] = useState(false)
  const [videoURL, setVideoURL] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  
  // Prescription state
  const [prescriptionRevealed, setPrescriptionRevealed] = useState<Set<string>>(new Set())
  const [postNotes, setPostNotes]   = useState('')
  const [postRx, setPostRx]         = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  
  // Prescription data that reveals during video
  const prescription: PrescriptionData = {
    patientName: meena.name,
    patientAge: meena.age,
    patientGender: meena.gender,
    symptoms: ['Fever (2 days)', 'Fatigue', 'Mild headache'],
    diagnosis: 'Viral Upper Respiratory Tract Infection',
    medicines: [
      { name: 'Paracetamol', dosage: '650 mg', frequency: 'Every 6 hours', duration: '3 days' },
      { name: 'Cetirizine', dosage: '10 mg', frequency: 'Once at night', duration: '5 days' },
      { name: 'Warm Saline Gargles', dosage: '—', frequency: '3 times daily', duration: '7 days' }
    ],
    advice: [
      'Take adequate rest',
      'Drink plenty of fluids',
      'Avoid cold beverages',
      'Follow up if fever persists beyond 3 days'
    ],
    doctorName: selectedDoctor?.name || 'Dr. Ramesh Patil',
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  
  // Patient information for panel
  const patientInfo = {
    patient: {
      name: meena.name,
      age: meena.age,
      gender: meena.gender,
      id: meena.id,
      bloodGroup: 'O+',
      allergies: ['Sulfa drugs'],
      conditions: meena.conditions
    },
    vitals: {
      bp: meena.visits[0]?.vitals?.bp || '168/104 mmHg',
      temp: meena.visits[0]?.vitals?.temp || '98.4°F',
      pulse: meena.visits[0]?.vitals?.pulse || '88 bpm',
      spo2: meena.visits[0]?.vitals?.spo2 || '96%',
      weight: meena.visits[0]?.vitals?.weight || '64 kg'
    },
    currentMedications: [
      { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily morning', since: 'Jan 2025' },
      { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily with meals', since: 'Mar 2024' }
    ],
    previousRecords: meena.visits.slice(0, 3).map((visit, idx) => ({
      date: new Date(Date.now() - (idx + 1) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { 
        day: '2-digit', month: 'short', year: 'numeric' 
      }),
      diagnosis: visit.title || 'Follow-up visit',
      doctor: 'Dr. Patil',
      medicines: ['Amlodipine 5mg', 'Metformin 500mg']
    }))
  }
  
  // Timeline for prescription reveals (in seconds)
  const revealTimeline = [
    { time: 2, section: 'patient' },
    { time: 8, section: 'symptoms' },
    { time: 15, section: 'diagnosis' },
    { time: 25, section: 'medicines' },
    { time: 35, section: 'advice' }
  ]

  useEffect(() => {
    teleconsultApi.availableDoctors()
      .then(docs => {
        setAvailableDoctors(docs)
        if (docs.length > 0) setSelectedDoctor(docs[0])
      })
      .catch(() => {})
  }, [])
  
  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
      
      // Check if we should reveal prescription sections
      revealTimeline.forEach(item => {
        if (video.currentTime >= item.time && !prescriptionRevealed.has(item.section)) {
          setPrescriptionRevealed(prev => new Set(prev).add(item.section))
        }
      })
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [prescriptionRevealed])
  
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setVideoURL(url)
      setHasVideo(true)
      setPrescriptionRevealed(new Set())
    }
  }
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const exportPrescription = () => {
    const text = `
TELECONSULTATION PRESCRIPTION
====================================

Date: ${prescription.date}
Patient: ${prescription.patientName}
Age: ${prescription.patientAge} years
Gender: ${prescription.patientGender}

SYMPTOMS:
${prescription.symptoms.map(s => `• ${s}`).join('\n')}

DIAGNOSIS:
${prescription.diagnosis}

PRESCRIBED MEDICINES:
${prescription.medicines.map((m, i) => `${i + 1}. ${m.name} ${m.dosage}
   ${m.frequency} for ${m.duration}`).join('\n\n')}

ADVICE:
${prescription.advice.map(a => `• ${a}`).join('\n')}

Doctor: ${prescription.doctorName}
ASHA Worker: ${userName}
    `.trim()

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Prescription_${prescription.patientName.replace(/\s+/g, '_')}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function startCall() {
    setCallState('waiting')
    teleconsultApi.initiate('', selectedDoctor?.id || '')
      .then(res => { 
        setSessionId(res.sessionId)
        setTimeout(() => {
          setCallState('live')
          setPatientPanelOpen(true) // Auto-open patient panel when call goes live
        }, 1500)
      })
      .catch(() => {
        setTimeout(() => {
          setCallState('live')
          setPatientPanelOpen(true) // Auto-open patient panel when call goes live
        }, 1500)
      })
  }

  function endCall() {
    setCallState('ended')
    setPatientPanelOpen(false) // Close patient panel when call ends
    if (sessionId) {
      teleconsultApi.saveNotes(sessionId, postNotes, postRx).catch(() => {})
    }
  }

  function saveNotes() {
    if (sessionId) {
      teleconsultApi.saveNotes(sessionId, postNotes, postRx)
        .then(() => setNotesSaved(true))
        .catch(() => {})
    }
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 3000)
  }

  function sendMsg() {
    if (!chatMsg.trim()) return
    setMessages(p => [...p, { from: 'asha', text: chatMsg }])
    setChatMsg('')
    setTimeout(() => {
      setMessages(p => [...p, { from: 'doctor', text: 'Understood. I recommend reviewing the medication and scheduling a follow-up within 5 days.' }])
    }, 1500)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <AnimatePresence mode="wait">

        {/* ── Setup ── */}
        {callState === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full space-y-5 animate-fade-in">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[#2C2C2A]">Assisted teleconsult</h1>
              <p className="text-sm text-[#5F5E5A] mt-1">Connect patient with PHC doctor</p>
            </div>

            {/* Patient card */}
            <div className="card p-4 w-full flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center font-semibold text-teal-700 flex-shrink-0">MP</div>
              <div>
                <p className="font-semibold text-sm text-[#2C2C2A]">{prescription.patientName}</p>
                <p className="text-xs text-[#5F5E5A]">{meena.age}y · {meena.conditions.join(', ')}</p>
              </div>
              <span className="ml-auto badge-amber text-[10px]">Risk: 52/100</span>
            </div>

            {/* Doctor available */}
            <div className="card p-4 w-full flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 flex-shrink-0">RP</div>
              <div>
                <p className="font-semibold text-sm text-[#2C2C2A]">{selectedDoctor?.name ?? "Dr. Patil"}</p>
                <p className="text-xs text-[#5F5E5A]">PHC Beed · General Medicine</p>
              </div>
              <span className="ml-auto badge-green text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-dot-live" aria-hidden="true" /> Available
              </span>
            </div>

            {/* Offline warning */}
            {!isOnline && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 w-full">
                <WifiOff size={13} /> No internet — teleconsult requires connectivity. Audio-only fallback may be available.
              </div>
            )}

            {/* Pre-call checklist */}
            <div className="card p-4 w-full">
              <p className="text-xs font-semibold text-[#5F5E5A] mb-3 uppercase tracking-wide">Pre-call checklist</p>
              <div className="space-y-2">
                {preChecks.map(c => (
                  <div key={c.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-[#5F5E5A]">
                      <span aria-hidden="true">{c.icon}</span> {c.label}
                    </div>
                    <CheckCircle size={15} className="text-green-500" aria-label="OK" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => startCall()} className="btn-primary w-full justify-center text-base py-3.5">
              <Video size={18} aria-hidden="true" /> Start teleconsult
            </button>
          </motion.div>
        )}

        {/* ── Waiting room ── */}
        {callState === 'waiting' && (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full space-y-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-semibold text-indigo-700">RP</div>
              <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping opacity-30" aria-hidden="true" />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" aria-label="Doctor online" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[#2C2C2A]">Connecting to Dr. Patil…</p>
              <p className="text-sm text-[#5F5E5A] mt-1">PHC Beed · Est. wait: ~1 min</p>
            </div>
            <p className="text-xs text-center text-[#5F5E5A] max-w-xs">
              Doctor is receiving Meena's full record: 4 visit history, BP trend (152→158→168), OCR prescription, and today's triage score (52/100).
            </p>
            <button onClick={() => setCallState('live')} className="btn-primary text-sm py-2.5 px-8">
              Doctor joined — join call
            </button>
            <button onClick={() => setCallState('setup')} className="text-sm text-[#5F5E5A] hover:text-teal-600">
              Cancel
            </button>
          </motion.div>
        )}

        {/* ── Live call ── */}
        {callState === 'live' && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col bg-[#0f1a16] relative overflow-hidden">
            
            {/* Patient Information Sliding Panel - Fixed Overlay */}
            <AnimatePresence>
              {patientPanelOpen && (
                <motion.div
                  initial={{ x: -400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -400, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed left-0 top-20 bottom-0 w-96 bg-white shadow-2xl border-r-2 border-teal-200 z-50 overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <User size={18} className="text-teal-600" />
                        Patient Information
                      </h3>
                      <button
                        onClick={() => setPatientPanelOpen(false)}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Patient Details */}
                    <div className="bg-teal-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-teal-200 rounded-full flex items-center justify-center text-teal-800 font-bold text-lg">
                          {patientInfo.patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{patientInfo.patient.name}</p>
                          <p className="text-xs text-gray-600">{patientInfo.patient.id}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Age / Gender</p>
                          <p className="font-semibold text-gray-800">{patientInfo.patient.age}y / {patientInfo.patient.gender}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Blood Group</p>
                          <p className="font-semibold text-gray-800">{patientInfo.patient.bloodGroup}</p>
                        </div>
                      </div>
                    </div>

                    {/* Allergies */}
                    {patientInfo.patient.allergies.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={14} className="text-red-600" />
                          <p className="text-xs font-bold text-red-800 uppercase">Allergies</p>
                        </div>
                        {patientInfo.patient.allergies.map((allergy, i) => (
                          <p key={i} className="text-sm text-red-700">• {allergy}</p>
                        ))}
                      </div>
                    )}

                    {/* Current Conditions */}
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Current Conditions</h4>
                      <div className="space-y-1">
                        {patientInfo.patient.conditions.map((condition, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                            {condition}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Latest Vitals */}
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
                        <Activity size={14} />
                        Latest Vitals
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(patientInfo.vitals).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded p-2">
                            <p className="text-xs text-gray-500 capitalize">{key}</p>
                            <p className="text-sm font-semibold text-gray-800">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Current Medications */}
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
                        <Pill size={14} />
                        Current Medications
                      </h4>
                      <div className="space-y-2">
                        {patientInfo.currentMedications.map((med, i) => (
                          <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <p className="text-sm font-semibold text-blue-900">{med.name}</p>
                            <p className="text-xs text-blue-700">{med.dosage} · {med.frequency}</p>
                            <p className="text-xs text-gray-500">Since {med.since}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Previous Records */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
                        <FileText size={14} />
                        Previous Consultations
                      </h4>
                      <div className="space-y-2">
                        {patientInfo.previousRecords.map((record, i) => (
                          <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-semibold text-gray-800">{record.date}</p>
                              <span className="text-xs text-gray-500">{record.doctor}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700 mb-2">{record.diagnosis}</p>
                            <div className="text-xs text-gray-600">
                              <p className="font-semibold mb-1">Medicines:</p>
                              {record.medicines.map((med, j) => (
                                <p key={j} className="ml-2">• {med}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Doctor video */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="w-full h-full bg-gradient-to-br from-[#1B2E28] to-[#0f1a16] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-900/60 flex items-center justify-center text-xl font-semibold text-indigo-300 mx-auto mb-2">RP</div>
                  <p className="text-white font-medium text-sm">{selectedDoctor?.name ?? "Dr. Patil"}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-dot-live" aria-hidden="true" />
                    <span className="text-green-400 text-xs">Live</span>
                  </div>
                </div>
              </div>

              {/* ANM self-view */}
              <div className="absolute bottom-4 right-4 w-24 h-16 rounded-xl bg-[#1B2E28] border border-white/20 flex items-center justify-center overflow-hidden">
                {camOn ? (
                  <div className="w-full h-full bg-teal-900/40 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-xs text-white font-semibold">KS</div>
                  </div>
                ) : (
                  <VideoOff size={16} className="text-white/40" aria-hidden="true" />
                )}
              </div>

              {/* Patient info strip */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                <User size={11} aria-hidden="true" />
                <span>{selectedDoctor ? `Patient (via ${selectedDoctor.name})` : "Patient"} · BP {meena.visits[0].vitals?.bp} · Score 52</span>
              </div>

              {/* Timer */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-dot-live" aria-hidden="true" />
                03:14
              </div>
            </div>

            {/* Chat panel */}
            {chatOpen && (
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} className="absolute right-0 top-0 bottom-0 w-72 bg-white flex flex-col border-l border-[#D3D1C7]">
                <div className="p-3 border-b flex items-center justify-between">
                  <p className="font-semibold text-sm text-[#2C2C2A]">Chat with doctor</p>
                  <button onClick={() => setChatOpen(false)} className="text-[#5F5E5A] text-xs">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2" aria-live="polite">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.from === 'asha' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] text-xs px-3 py-2 rounded-2xl leading-relaxed
                        ${m.from === 'asha' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-[#2C2C2A]'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t flex gap-2">
                  <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMsg()}
                    placeholder="Message doctor…" className="input-field text-xs py-2 flex-1" aria-label="Chat message" />
                  <button onClick={sendMsg} className="btn-primary text-xs py-2 px-3">Send</button>
                </div>
              </motion.div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 py-4 bg-black/60 backdrop-blur-sm">
              <button onClick={() => setPatientPanelOpen(p => !p)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${patientPanelOpen ? 'bg-teal-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                aria-label={patientPanelOpen ? 'Hide patient info' : 'Show patient info'} 
                aria-pressed={patientPanelOpen}
                title={patientPanelOpen ? 'Hide patient info' : 'Show patient info'}>
                <User size={20} />
              </button>
              <button onClick={() => setMicOn(p => !p)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}
                aria-label={micOn ? 'Mute' : 'Unmute'} aria-pressed={!micOn}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button onClick={() => setCamOn(p => !p)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}
                aria-label={camOn ? 'Camera off' : 'Camera on'} aria-pressed={!camOn}>
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button onClick={() => setChatOpen(p => !p)}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center relative"
                aria-label="Toggle chat" aria-pressed={chatOpen}>
                <MessageSquare size={20} />
                {messages.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-coral-500" aria-hidden="true" />}
              </button>
              <button onClick={() => endCall()}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                aria-label="End call">
                <Phone size={22} className="rotate-[135deg]" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Post-call: doctor's notes ── */}
        {callState === 'ended' && (
          <motion.div key="ended" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#2C2C2A]">Call ended</h2>
                <p className="text-sm text-[#5F5E5A]">Duration: 6 min 42 sec · {selectedDoctor?.name ?? "Dr. Patil"}</p>
              </div>
            </div>

            {/* Doctor's notes from call */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-teal-500" aria-hidden="true" />
                <p className="font-semibold text-sm text-[#2C2C2A]">Add doctor's notes to Meena's record</p>
                <AIPill />
              </div>
              <div>
                <label htmlFor="post-notes" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Consultation notes</label>
                <textarea id="post-notes" rows={3} value={postNotes} onChange={e => setPostNotes(e.target.value)}
                  placeholder="e.g. BP 168/104 on assessment. Amlodipine non-compliant. Increasing dose and adding Losartan. In-person review in 5 days."
                  className="input-field resize-none text-sm" />
              </div>
              <div>
                <label htmlFor="post-rx" className="block text-sm font-medium text-[#2C2C2A] mb-1.5 flex items-center gap-2">
                  <Pill size={14} className="text-teal-500" aria-hidden="true" /> Prescription
                </label>
                <textarea id="post-rx" rows={2} value={postRx} onChange={e => setPostRx(e.target.value)}
                  placeholder="e.g. Tab Amlodipine 10mg OD · Tab Losartan 50mg OD"
                  className="input-field resize-none text-sm" />
              </div>

              {!notesSaved ? (
                <button onClick={() => saveNotes()} className="btn-primary w-full justify-center text-sm py-2.5">
                  Save to Meena's record
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle size={15} /> Notes and prescription saved to Meena's longitudinal record.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setCallState('setup')} className="btn-secondary flex-1 justify-center text-sm">
                <Monitor size={15} /> New consultation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


