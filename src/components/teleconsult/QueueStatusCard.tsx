/**
 * Queue Status Card
 * Shows patient's position in teleconsult queue.
 * Demo: auto-advances to "Doctor is Ready" after 30 seconds.
 */

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Video, Clock, Users, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function getAuthHeaders() {
  const token = localStorage.getItem('swasthya_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface Props {
  triageSessionId: string
  patientId: string
  onConsultationStart: (queueId: string) => void
}

export function QueueStatusCard({ triageSessionId, patientId, onConsultationStart }: Props) {
  const [queueData, setQueueData]   = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [countdown, setCountdown]   = useState(30)
  const [demoReady, setDemoReady]   = useState(false)
  const mountedAt                   = useRef(Date.now())

  // 30-second countdown → auto-ready
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed    = Math.floor((Date.now() - mountedAt.current) / 1000)
      const remaining  = Math.max(0, 30 - elapsed)
      setCountdown(remaining)
      if (remaining === 0) {
        setDemoReady(true)
        clearInterval(timer)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Poll queue status every 5 s
  useEffect(() => {
    fetchQueueStatus()
    const interval = setInterval(fetchQueueStatus, 5000)
    return () => clearInterval(interval)
  }, [patientId])

  async function fetchQueueStatus() {
    try {
      const response = await axios.get(
        `${API_BASE}/teleconsult-queue/queue/status/${patientId}`,
        { headers: getAuthHeaders() }
      )
      setQueueData(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Queue API unavailable')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !queueData && !demoReady) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-sm text-[#5F5E5A]">Joining teleconsultation queue...</p>
        </div>
      </div>
    )
  }

  const queueEntry   = queueData?.queueEntry
  const position     = queueData?.position     ?? 1
  const totalWaiting = queueData?.totalWaiting ?? 1
  const isReady      = demoReady || queueEntry?.status === 'called'
  const token        = queueEntry?.token || `TC-${(triageSessionId?.slice(-6) ?? 'DEMO').toUpperCase()}`
  const priority     = queueEntry?.priority || 'standard'

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 space-y-6 text-center">

          {/* Status icon */}
          <div className="relative inline-flex items-center justify-center">
            {isReady ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
              >
                <CheckCircle2 size={48} className="text-green-600" />
              </motion.div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center relative">
                <Users size={48} className="text-teal-600" />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center text-xl font-bold"
                >
                  #{position}
                </motion.div>
              </div>
            )}
          </div>

          {/* Status message */}
          <div>
            {isReady ? (
              <>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Doctor is Ready!</h2>
                <p className="text-[#5F5E5A]">Your doctor is ready to see you now</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-[#2C2C2A] mb-2">You're in the Queue</h2>
                <p className="text-[#5F5E5A]">
                  {position <= 1 ? "You're next!" : `${position - 1} patient(s) ahead of you`}
                </p>
              </>
            )}
          </div>

          {/* Token */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-[#5F5E5A] mb-1">Your Queue Token</p>
            <p className="text-3xl font-bold text-teal-600 font-mono">{token}</p>
          </div>

          {/* Countdown / ready info */}
          {!isReady ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <Clock size={20} className="text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-blue-700 mb-1">Connecting in</p>
                  <p className="text-2xl font-bold text-blue-900">{countdown}s</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <Users size={20} className="text-purple-600 mx-auto mb-2" />
                  <p className="text-xs text-purple-700 mb-1">In Queue</p>
                  <p className="text-lg font-bold text-purple-900">{totalWaiting}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal-500 rounded-full"
                  animate={{ width: `${(countdown / 30) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'linear' }}
                />
              </div>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800 font-medium">
                🎉 A doctor has been assigned to your session
              </p>
            </div>
          )}

          {/* Priority badge */}
          {priority && priority !== 'standard' && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              ${priority === 'emergency' ? 'bg-red-100 text-red-700'    :
                priority === 'urgent'    ? 'bg-orange-100 text-orange-700' :
                priority === 'priority'  ? 'bg-amber-100 text-amber-700'  :
                                           'bg-blue-100 text-blue-700'}
            `}>
              {priority === 'emergency' && '🚨'}
              {priority === 'urgent'    && '⚡'}
              {priority === 'priority'  && '⭐'}
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
            </div>
          )}

          {/* CTA */}
          {isReady ? (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onConsultationStart(queueEntry?.id || triageSessionId)}
              className="btn-primary w-full justify-center text-lg py-4"
            >
              <Video size={20} />
              Join Doctor Now
            </motion.button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-[#5F5E5A]">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-teal-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>
              <span>Connecting you to a doctor...</span>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left text-xs text-blue-900">
            <p className="font-medium mb-1">💡 While you wait</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Ensure your camera and microphone are working</li>
              <li>• Find a quiet, well-lit place for the consultation</li>
              <li>• Keep any relevant documents or medications handy</li>
            </ul>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
