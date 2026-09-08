import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Video,
  FileText, Pill, User, Calendar, Clock,
  Download, CheckCircle, Upload, Mic, Phone, MessageSquare,
  ChevronRight, ChevronLeft, Activity, AlertCircle, X
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { patientsApi } from '../../services/api'

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
}

export function DoctorTeleconsultPage() {
  const { userName } = useApp()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [hasVideoFile, setHasVideoFile] = useState(false)
  const [videoURL, setVideoURL] = useState<string>('')
  const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set())
  
  // Consultation state
  const [callActive, setCallActive] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [patientPanelOpen, setPatientPanelOpen] = useState(false)

  const consultationData = {
    patient: {
      name: 'Priya Sharma',
      age: 28,
      gender: 'Female',
      id: 'P-2026-5438',
      bloodGroup: 'B+',
      allergies: ['Penicillin'],
      conditions: ['Asthma (controlled)', 'Seasonal allergies']
    },
    vitals: {
      bp: '118/76 mmHg',
      temp: '98.6°F',
      pulse: '78 bpm',
      spo2: '97%',
      weight: '58 kg'
    },
    previousRecords: [
      {
        date: '15 Aug 2026',
        diagnosis: 'Acute Upper Respiratory Infection',
        doctor: 'Dr. Mehta',
        medicines: ['Azithromycin 500mg', 'Cetirizine 10mg']
      },
      {
        date: '10 Jul 2026',
        diagnosis: 'Seasonal Allergic Rhinitis',
        doctor: 'Dr. Patil',
        medicines: ['Montelukast 10mg', 'Cetirizine 10mg']
      },
      {
        date: '22 May 2026',
        diagnosis: 'Routine Check-up',
        doctor: 'Dr. Sharma',
        medicines: ['Multivitamin']
      }
    ],
    currentMedications: [
      { name: 'Salbutamol Inhaler', dosage: '2 puffs', frequency: 'As needed', since: 'Jan 2025' },
      { name: 'Montelukast', dosage: '10 mg', frequency: 'Once daily at night', since: 'Mar 2026' }
    ],
    symptoms: ['Persistent cough (5 days)', 'Mild fever', 'Chest discomfort', 'Fatigue'],
    diagnosis: 'Acute Bronchitis',
    medicines: [
      {
        name: 'Azithromycin',
        dosage: '500 mg',
        frequency: 'Once daily',
        duration: '5 days'
      },
      {
        name: 'Salbutamol Inhaler',
        dosage: '2 puffs',
        frequency: 'Every 6 hours as needed',
        duration: '10 days'
      },
      {
        name: 'Paracetamol',
        dosage: '650 mg',
        frequency: 'Every 8 hours if needed',
        duration: '5 days'
      }
    ] as Medicine[],
    advice: [
      'Complete the full antibiotic course',
      'Use inhaler before physical activity',
      'Stay well hydrated',
      'Avoid cold air exposure',
      'Return if symptoms worsen or fever persists'
    ],
    doctor: userName || 'Dr. Ramesh Patil',
    date: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Timeline for auto-reveal (in seconds)
  const revealTimeline = [
    { time: 3, section: 'patient' },
    { time: 10, section: 'symptoms' },
    { time: 18, section: 'diagnosis' },
    { time: 28, section: 'medicines' },
    { time: 40, section: 'advice' }
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setVideoURL(url)
      setHasVideoFile(true)
      setRevealedSections(new Set())
      setCallActive(false)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)

      revealTimeline.forEach(item => {
        if (video.currentTime >= item.time && !revealedSections.has(item.section)) {
          setRevealedSections(prev => new Set(prev).add(item.section))
        }
      })
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCallActive(false)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [revealedSections])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setCallActive(false)
        setPatientPanelOpen(false)
      } else {
        videoRef.current.play()
        setCallActive(true)
        setPatientPanelOpen(true) // Auto-open patient panel when call starts
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * duration
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const exportPrescription = () => {
    const text = `
TELECONSULTATION RECORD
====================================

Date: ${consultationData.date}
Patient: ${consultationData.patient.name}
Age: ${consultationData.patient.age} years
Gender: ${consultationData.patient.gender}
ID: ${consultationData.patient.id}

CHIEF COMPLAINTS:
${consultationData.symptoms.map(s => `• ${s}`).join('\n')}

DIAGNOSIS:
${consultationData.diagnosis}

PRESCRIBED MEDICINES:
${consultationData.medicines.map((m, i) => `${i + 1}. ${m.name} ${m.dosage}
   Frequency: ${m.frequency}
   Duration: ${m.duration}`).join('\n\n')}

CLINICAL ADVICE:
${consultationData.advice.map(a => `• ${a}`).join('\n')}

Consulting Physician: ${consultationData.doctor}
    `.trim()

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Consultation_${consultationData.patient.name.replace(/\s+/g, '_')}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Video size={24} className="text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Video Consultation</h1>
                <p className="text-sm text-gray-600">Live consultation with prescription</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Session ID: TC-{Date.now().toString().slice(-6)}</p>
              <p className="text-xs text-gray-600">{consultationData.date}</p>
            </div>
          </div>
        </div>

        {/* Patient Information Sliding Panel - Fixed Overlay */}
        <AnimatePresence>
          {patientPanelOpen && callActive && (
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
                      {consultationData.patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{consultationData.patient.name}</p>
                      <p className="text-xs text-gray-600">{consultationData.patient.id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Age / Gender</p>
                      <p className="font-semibold text-gray-800">{consultationData.patient.age}y / {consultationData.patient.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Blood Group</p>
                      <p className="font-semibold text-gray-800">{consultationData.patient.bloodGroup}</p>
                    </div>
                  </div>
                </div>

                {/* Allergies */}
                {consultationData.patient.allergies.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="text-red-600" />
                      <p className="text-xs font-bold text-red-800 uppercase">Allergies</p>
                    </div>
                    {consultationData.patient.allergies.map((allergy, i) => (
                      <p key={i} className="text-sm text-red-700">• {allergy}</p>
                    ))}
                  </div>
                )}

                {/* Current Conditions */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Current Conditions</h4>
                  <div className="space-y-1">
                    {consultationData.patient.conditions.map((condition, i) => (
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
                    {Object.entries(consultationData.vitals).map(([key, value]) => (
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
                    {consultationData.currentMedications.map((med, i) => (
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
                    {consultationData.previousRecords.map((record, i) => (
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

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Video Consultation */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Video size={20} className="text-teal-600" />
                  Consultation Video
                </h2>
                {!hasVideoFile && (
                  <label className="btn-primary text-sm py-2 px-4 cursor-pointer">
                    <Upload size={14} />
                    Upload Video
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg aspect-video">
                {hasVideoFile ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoURL}
                      className="w-full h-full object-contain"
                    />

                    {/* Video Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                      <div
                        className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer mb-3 group"
                        onClick={handleProgressClick}
                      >
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={togglePlay}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                          >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                          </button>
                          <button
                            onClick={toggleMute}
                            className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                          >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                          </button>
                          <span className="text-sm font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>
                        <button
                          onClick={handleFullscreen}
                          className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                        >
                          <Maximize size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Call Status */}
                    {callActive && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        LIVE
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <Video size={64} className="text-gray-600 mb-4" />
                    <p className="text-lg font-semibold mb-2">Start Video Consultation</p>
                    <p className="text-sm text-gray-400 mb-4">Upload a recorded consultation to begin</p>
                    <label className="btn-primary cursor-pointer">
                      <Upload size={16} />
                      Choose Video File
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls (when active) */}
            {callActive && hasVideoFile && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Call Controls</h3>
                  <button
                    onClick={() => setPatientPanelOpen(!patientPanelOpen)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                  >
                    {patientPanelOpen ? 'Hide' : 'Show'} Patient Info
                    {patientPanelOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setMicOn(!micOn)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      micOn ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-red-500 text-white'
                    }`}
                  >
                    <Mic size={20} />
                  </button>
                  <button
                    onClick={() => setCamOn(!camOn)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      camOn ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-red-500 text-white'
                    }`}
                  >
                    <Video size={20} />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center">
                    <MessageSquare size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      setCallActive(false)
                      setIsPlaying(false)
                      setPatientPanelOpen(false)
                      if (videoRef.current) videoRef.current.pause()
                    }}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                  >
                    <Phone size={22} className="rotate-[135deg]" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Prescription Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileText size={20} className="text-teal-600" />
                  Consultation Notes
                </h2>
                {revealedSections.size > 0 && (
                  <button
                    onClick={exportPrescription}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    <Download size={14} />
                    Export
                  </button>
                )}
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-6 min-h-[600px]">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center border-b border-teal-300 pb-4">
                    <h3 className="text-2xl font-bold text-teal-800">℞ Prescription</h3>
                    <p className="text-xs text-gray-600 mt-1">Teleconsultation Record</p>
                  </div>

                  {/* Patient Info */}
                  <AnimatePresence>
                    {revealedSections.has('patient') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg p-4 shadow-sm border border-teal-200"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <User size={16} className="text-teal-600" />
                          <h4 className="font-bold text-sm text-gray-800">Patient Information</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="font-semibold text-gray-800">{consultationData.patient.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Age / Gender</p>
                            <p className="font-semibold text-gray-800">
                              {consultationData.patient.age}y / {consultationData.patient.gender}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Patient ID</p>
                            <p className="font-semibold text-gray-800">{consultationData.patient.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="font-semibold text-gray-800">{consultationData.date}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Symptoms */}
                  <AnimatePresence>
                    {revealedSections.has('symptoms') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg p-4 shadow-sm border border-teal-200"
                      >
                        <h4 className="font-bold text-sm text-gray-800 mb-2">Chief Complaints</h4>
                        <ul className="space-y-1.5">
                          {consultationData.symptoms.map((symptom, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <span className="text-teal-500 mt-1">•</span>
                              {symptom}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Diagnosis */}
                  <AnimatePresence>
                    {revealedSections.has('diagnosis') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 rounded-lg p-4 shadow-sm border-2 border-blue-300"
                      >
                        <h4 className="font-bold text-sm text-blue-800 mb-2">Diagnosis</h4>
                        <p className="text-sm font-semibold text-blue-900">{consultationData.diagnosis}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Medicines */}
                  <AnimatePresence>
                    {revealedSections.has('medicines') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg p-4 shadow-sm border border-teal-200"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Pill size={16} className="text-teal-600" />
                          <h4 className="font-bold text-sm text-gray-800">Prescribed Medicines</h4>
                        </div>
                        <div className="space-y-3">
                          {consultationData.medicines.map((med, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.15 }}
                              className="bg-teal-50 rounded-lg p-3 border border-teal-200"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="font-bold text-sm text-teal-900">
                                  {i + 1}. {med.name}
                                </p>
                                <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full">
                                  {med.duration}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                {med.dosage !== '—' && (
                                  <div>
                                    <span className="text-gray-500">Dosage: </span>
                                    <span className="font-semibold">{med.dosage}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-500">Frequency: </span>
                                  <span className="font-semibold">{med.frequency}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Advice */}
                  <AnimatePresence>
                    {revealedSections.has('advice') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg p-4 shadow-sm border border-teal-200"
                      >
                        <h4 className="font-bold text-sm text-gray-800 mb-2">Clinical Advice</h4>
                        <ul className="space-y-1.5">
                          {consultationData.advice.map((item, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <CheckCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Doctor Signature */}
                  <AnimatePresence>
                    {revealedSections.has('advice') && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="border-t border-teal-300 pt-4 mt-6"
                      >
                        <div className="text-right">
                          <p className="font-bold text-gray-800">{consultationData.doctor}</p>
                          <p className="text-sm text-gray-600">Consulting Physician</p>
                          <div className="mt-2">
                            <div className="text-3xl font-dancing text-teal-700 inline-block">
                              {consultationData.doctor}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Empty State */}
                  {revealedSections.size === 0 && (
                    <div className="text-center py-16 text-gray-400">
                      <FileText size={64} className="mx-auto mb-4 opacity-50" />
                      <p className="font-semibold">Prescription will appear here</p>
                      <p className="text-sm mt-2">Start the consultation to view notes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
