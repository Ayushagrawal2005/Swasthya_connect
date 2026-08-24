/**
 * Add-on 3 — Hospital Kiosk Mode
 * Walk-in patients scan QR → registered in queue instantly
 * Designed for village community centre touchscreens / hospital lobby tablets
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, CheckCircle, Users, Clock, Printer, RotateCcw, Heart } from 'lucide-react'

interface QueueEntry {
  token: string
  name: string
  type: 'walk-in' | 'referred' | 'follow-up'
  time: string
  wait: string
}

const liveQueue: QueueEntry[] = [
  { token: 'K-001', name: 'Ramesh Jadhav',  type: 'referred',   time: '10:12 AM', wait: 'Now' },
  { token: 'K-002', name: 'Sunita Bai',     type: 'follow-up',  time: '10:18 AM', wait: '~8 min' },
  { token: 'K-003', name: 'Arjun Patil',    type: 'walk-in',    time: '10:24 AM', wait: '~16 min' },
  { token: 'K-004', name: 'Meena Patil',    type: 'referred',   time: '10:31 AM', wait: '~24 min' },
]

const typeBadge = {
  'walk-in':   'badge-teal',
  referred:    'badge-amber',
  'follow-up': 'badge-green',
}

export function KioskModePage() {
  const [scanned, setScanned] = useState(false)
  const [token, setToken]     = useState('')
  const [name, setName]       = useState('')
  const [printed, setPrinted] = useState(false)
  const [queue, setQueue]     = useState(liveQueue)

  function simulateScan() {
    const newToken = `K-00${queue.length + 1}`
    setToken(newToken)
    setScanned(true)
  }

  function registerWalkIn() {
    if (!name.trim()) return
    const entry: QueueEntry = {
      token,
      name,
      type: 'walk-in',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      wait: `~${(queue.length) * 8} min`,
    }
    setQueue(p => [...p, entry])
    setPrinted(false)
  }

  function reset() {
    setScanned(false); setToken(''); setName(''); setPrinted(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 p-4 sm:p-8">
      {/* Kiosk header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart size={22} className="text-teal-500" fill="currentColor" aria-hidden="true" />
          <span className="text-xl font-semibold text-[#2C2C2A]">SwasthyaConnect</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#2C2C2A]">Patient Check-In Kiosk</h1>
        <p className="text-[#5F5E5A] text-sm mt-1">PHC Beed · Village Community Centre</p>
      </div>

      <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-6">
        {/* Left: QR scan / registration */}
        <div className="card p-6 space-y-5">
          <AnimatePresence mode="wait">
            {!scanned ? (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-5">
                <h2 className="font-semibold text-[#2C2C2A] text-center">Scan your health card QR code</h2>

                {/* QR frame */}
                <div className="relative w-48 h-48 rounded-2xl border-4 border-teal-500 bg-white flex items-center justify-center overflow-hidden">
                  <QrCode size={80} className="text-[#2C2C2A] opacity-30" aria-hidden="true" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Scanning animation */}
                    <motion.div
                      initial={{ top: '10%' }} animate={{ top: '85%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                      className="absolute left-2 right-2 h-0.5 bg-teal-500/70 rounded-full"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-teal-500 rounded-tl" aria-hidden="true" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-teal-500 rounded-tr" aria-hidden="true" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-teal-500 rounded-bl" aria-hidden="true" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-teal-500 rounded-br" aria-hidden="true" />
                </div>

                <p className="text-sm text-[#5F5E5A] text-center">Position your ABDM health card QR code in the frame</p>

                <div className="w-full flex flex-col gap-2">
                  <button onClick={simulateScan} className="btn-primary w-full justify-center py-3.5 text-base">
                    <QrCode size={18} aria-hidden="true" /> Simulate QR scan
                  </button>
                  <div className="text-center text-xs text-[#5F5E5A]">— or —</div>
                  <div className="flex gap-2">
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Enter name for walk-in" className="input-field flex-1 text-sm" />
                    <button onClick={() => { setToken(`K-00${queue.length + 1}`); setScanned(true) }}
                      disabled={!name.trim()} className="btn-secondary text-sm px-4 disabled:opacity-40">
                      Walk-in
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="registered" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#2C2C2A]">Registered!</h3>
                  <p className="text-[#5F5E5A] text-sm mt-1">You've been added to the queue</p>
                </div>

                {/* Token */}
                <div className="card p-5 w-full bg-teal-50 border-teal-200">
                  <p className="text-xs text-teal-600 uppercase tracking-wide mb-1">Your token</p>
                  <p className="text-4xl font-bold text-teal-700 tabular-nums">{token}</p>
                  <p className="text-sm text-[#5F5E5A] mt-2">PHC Beed · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-sm font-medium text-teal-600 mt-1">Est. wait: ~{queue.length * 8} min</p>
                </div>

                <div className="flex gap-3 w-full">
                  {!printed ? (
                    <button onClick={() => setPrinted(true)}
                      className="btn-primary flex-1 justify-center text-sm py-2.5">
                      <Printer size={15} aria-hidden="true" /> Print token slip
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex-1 justify-center">
                      <CheckCircle size={14} /> Printing…
                    </div>
                  )}
                  <button onClick={reset} className="btn-secondary text-sm py-2.5 px-4">
                    <RotateCcw size={14} aria-hidden="true" /> New patient
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Live queue board */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#2C2C2A] flex items-center gap-2">
              <Users size={18} className="text-teal-500" aria-hidden="true" />
              Live queue
            </h2>
            <span className="badge-teal text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 status-dot-live" aria-hidden="true" />
              {queue.length} waiting
            </span>
          </div>

          <div className="space-y-2" role="list" aria-label="Current queue">
            {queue.map((entry, i) => (
              <motion.div key={entry.token} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? 'bg-teal-50 border-teal-200' : 'bg-white border-[#D3D1C7]'}`}
                role="listitem">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${i === 0 ? 'bg-teal-500 text-white' : 'bg-gray-100 text-[#5F5E5A]'}`}>
                  {entry.token.split('-')[1]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#2C2C2A] truncate">{entry.name}</p>
                  <p className="text-[10px] text-[#5F5E5A] flex items-center gap-1">
                    <Clock size={9} /> {entry.time}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`${typeBadge[entry.type]} text-[10px] capitalize`}>{entry.type}</span>
                  <p className={`text-xs mt-0.5 font-medium ${i === 0 ? 'text-teal-600' : 'text-[#5F5E5A]'}`}>
                    {entry.wait}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="card p-3 bg-indigo-50 border-indigo-100 text-xs text-indigo-700 leading-relaxed">
            Referred patients are auto-prioritized above walk-ins. Doctor queue updates in real-time.
          </div>
        </div>
      </div>
    </div>
  )
}
