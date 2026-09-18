/**
 * Doctor Teleconsultation with Real WebRTC Video
 * Includes screen sharing, patient info panel, and real-time prescription
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Mic, MicOff, VideoOff, Phone, MessageSquare, Monitor,
  User, FileText, Pill, Activity, AlertCircle, X, Share2, CheckCircle,
  Download, Play, Pause
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { webrtcService, type ConnectionQuality } from '../../services/webrtc'

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const WS_URL = API_BASE.replace('http', 'ws') + '/ws'

export function DoctorTeleconsultPage() {
  const { userName, token, userId } = useApp()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const screenShareRef = useRef<MediaStream | null>(null)
  
  const [callActive, setCallActive] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [patientPanelOpen, setPatientPanelOpen] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [sessionId] = useState(`session-${Date.now()}`)
  const [callDuration, setCallDuration] = useState(0)
  const callStartTimeRef = useRef<number>(0)
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ from: string; text: string }>>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')

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
      }
    ],
    currentMedications: [
      { name: 'Salbutamol Inhaler', dosage: '2 puffs', frequency: 'As needed', since: 'Jan 2025' },
      { name: 'Montelukast', dosage: '10 mg', frequency: 'Once daily at night', since: 'Mar 2026' }
    ],
    symptoms: ['Persistent cough (5 days)', 'Mild fever', 'Chest discomfort', 'Fatigue'],
    diagnosis: 'Acute Bronchitis',
    medicines: [
      { name: 'Azithromycin', dosage: '500 mg', frequency: 'Once daily', duration: '5 days' },
      { name: 'Salbutamol Inhaler', dosage: '2 puffs', frequency: 'Every 6 hours as needed', duration: '10 days' },
      { name: 'Paracetamol', dosage: '650 mg', frequency: 'Every 8 hours if needed', duration: '5 days' }
    ] as Medicine[],
    advice: [
      'Complete the full antibiotic course',
      'Use inhaler before physical activity',
      'Stay well hydrated',
      'Avoid cold air exposure',
      'Return if symptoms worsen or fever persists'
    ],
    doctor: userName || 'Dr. Ramesh Patil',
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Setup WebRTC event handlers
  useEffect(() => {
    webrtcService.onRemoteStream = (userId, stream) => {
      console.log('Received remote stream (patient) from', userId)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
      }
    }

    webrtcService.onPeerConnected = (userId) => {
      console.log('Patient connected:', userId)
      setPatientPanelOpen(true) // Auto-open patient panel
    }

    webrtcService.onPeerDisconnected = (userId) => {
      console.log('Patient disconnected:', userId)
      endCall()
    }

    webrtcService.onConnectionQualityChange = (quality) => {
      setConnectionQuality(quality)
    }

    webrtcService.onError = (err) => {
      console.error('WebRTC error:', err)
      setError(err.message)
    }

    return () => {
      webrtcService.cleanup()
    }
  }, [])

  // Update call duration
  useEffect(() => {
    if (callActive) {
      const interval = setInterval(() => {
        if (callStartTimeRef.current > 0) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [callActive])

  // Start call (doctor is initiator)
  async function startCall() {
    try {
      setError(null)

      // Get local camera stream
      const stream = await webrtcService.getLocalStream()
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Connect to WebSocket signaling server
      await webrtcService.connect(WS_URL, token || '', userId || 'doctor-unknown')

      // Join the room as initiator (doctor initiates the call)
      await webrtcService.joinRoom(sessionId, true)

      setCallActive(true)
      callStartTimeRef.current = Date.now()

    } catch (err: any) {
      console.error('Failed to start call:', err)
      setError(err.message || 'Failed to start video call')
    }
  }

  // End call
  function endCall() {
    if (isScreenSharing) {
      stopScreenShare()
    }
    webrtcService.leaveRoom()
    webrtcService.stopLocalStream()
    setCallActive(false)
    setCallDuration(0)
  }

  // Toggle microphone
  function toggleMic() {
    const newState = !micOn
    setMicOn(newState)
    webrtcService.toggleMicrophone(newState)
  }

  // Toggle camera
  function toggleCamera() {
    const newState = !camOn
    setCamOn(newState)
    webrtcService.toggleCamera(newState)
  }

  // Start screen sharing
  async function startScreenShare() {
    try {
      const screenStream = await webrtcService.getScreenShare()
      screenShareRef.current = screenStream

      // Replace video track with screen share
      await webrtcService.replaceVideoTrack(screenStream)

      // Update local video to show screen share
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream
      }

      setIsScreenSharing(true)

      // Stop screen share when user stops it from browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
      }

    } catch (err: any) {
      console.error('Failed to start screen share:', err)
      setError('Screen sharing permission denied or not available')
    }
  }

  // Stop screen sharing
  async function stopScreenShare() {
    if (screenShareRef.current) {
      screenShareRef.current.getTracks().forEach(track => track.stop())
      screenShareRef.current = null
    }

    // Get camera stream back
    try {
      const cameraStream = await webrtcService.getLocalStream()
      await webrtcService.replaceVideoTrack(cameraStream)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream
      }

      setIsScreenSharing(false)
    } catch (err) {
      console.error('Failed to restore camera:', err)
    }
  }

  // Send chat message
  function sendChatMessage() {
    if (!chatInput.trim()) return
    setChatMessages(prev => [...prev, { from: 'doctor', text: chatInput }])
    setChatInput('')
    // In real app, send via WebSocket
  }

  // Format duration
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get quality indicator
  function getQualityLabel() {
    if (!connectionQuality) return 'Excellent'
    const labels = {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
      critical: 'Critical'
    }
    return labels[connectionQuality.quality]
  }

  // Export prescription
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
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-2 text-red-800 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Video size={24} className="text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Video Consultation</h1>
                <p className="text-sm text-gray-600">Real-time WebRTC video calling</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Session ID: {sessionId.slice(-6)}</p>
              <p className="text-xs text-gray-600">{consultationData.date}</p>
              {callActive && (
                <p className="text-xs text-teal-600 font-medium mt-1">
                  {formatDuration(callDuration)} · {getQualityLabel()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Patient Information Sliding Panel */}
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
                  {isScreenSharing ? 'Screen Share' : 'Video Call'}
                </h2>
                {!callActive && (
                  <button onClick={startCall} className="btn-primary text-sm py-2 px-4">
                    <Play size={14} />
                    Start Call
                  </button>
                )}
              </div>

              {/* Video Container */}
              <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg aspect-video">
                {callActive ? (
                  <>
                    {/* Remote video (patient) */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* Local video (self view) - Picture in picture */}
                    <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-white/50 shadow-lg">
                      {camOn && !isScreenSharing ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover mirror"
                        />
                      ) : isScreenSharing ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <VideoOff size={20} className="text-white/60" />
                        </div>
                      )}
                    </div>

                    {/* Call duration */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE · {formatDuration(callDuration)}
                    </div>

                    {/* Screen share indicator */}
                    {isScreenSharing && (
                      <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                        <Monitor size={12} />
                        Sharing Screen
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <Video size={64} className="text-gray-600 mb-4" />
                    <p className="text-lg font-semibold mb-2">Ready to Start</p>
                    <p className="text-sm text-gray-400">Click "Start Call" to begin consultation</p>
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls */}
            {callActive && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Call Controls</h3>
                  <button
                    onClick={() => setPatientPanelOpen(!patientPanelOpen)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                  >
                    {patientPanelOpen ? 'Hide' : 'Show'} Patient Info
                  </button>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={toggleMic}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      micOn ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-red-500 text-white'
                    }`}
                    title={micOn ? 'Mute' : 'Unmute'}
                  >
                    {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      camOn ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-red-500 text-white'
                    }`}
                    title={camOn ? 'Camera Off' : 'Camera On'}
                  >
                    {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>
                  <button
                    onClick={() => setChatOpen(!chatOpen)}
                    className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center relative"
                    title="Chat"
                  >
                    <MessageSquare size={20} />
                    {chatMessages.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                    title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                  >
                    {isScreenSharing ? <Share2 size={20} /> : <Monitor size={20} />}
                  </button>
                  <button
                    onClick={endCall}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                    title="End Call"
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
                <button onClick={exportPrescription} className="btn-secondary text-sm py-2 px-4">
                  <Download size={14} />
                  Export
                </button>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-6 min-h-[600px]">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center border-b border-teal-300 pb-4">
                    <h3 className="text-2xl font-bold text-teal-800">℞ Prescription</h3>
                    <p className="text-xs text-gray-600 mt-1">Teleconsultation Record</p>
                  </div>

                  {/* Patient Info */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-200">
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
                  </div>

                  {/* Symptoms */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-200">
                    <h4 className="font-bold text-sm text-gray-800 mb-2">Chief Complaints</h4>
                    <ul className="space-y-1.5">
                      {consultationData.symptoms.map((symptom, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-teal-500 mt-1">•</span>
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Diagnosis */}
                  <div className="bg-blue-50 rounded-lg p-4 shadow-sm border-2 border-blue-300">
                    <h4 className="font-bold text-sm text-blue-800 mb-2">Diagnosis</h4>
                    <p className="text-sm font-semibold text-blue-900">{consultationData.diagnosis}</p>
                  </div>

                  {/* Medicines */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Pill size={16} className="text-teal-600" />
                      <h4 className="font-bold text-sm text-gray-800">Prescribed Medicines</h4>
                    </div>
                    <div className="space-y-3">
                      {consultationData.medicines.map((med, i) => (
                        <div key={i} className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-bold text-sm text-teal-900">
                              {i + 1}. {med.name}
                            </p>
                            <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full">
                              {med.duration}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                            <div>
                              <span className="text-gray-500">Dosage: </span>
                              <span className="font-semibold">{med.dosage}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Frequency: </span>
                              <span className="font-semibold">{med.frequency}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advice */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-200">
                    <h4 className="font-bold text-sm text-gray-800 mb-2">Clinical Advice</h4>
                    <ul className="space-y-1.5">
                      {consultationData.advice.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Signature */}
                  <div className="border-t border-teal-300 pt-4 text-center">
                    <p className="text-sm font-semibold text-gray-800">{consultationData.doctor}</p>
                    <p className="text-xs text-gray-600">Consulting Physician</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  )
}
