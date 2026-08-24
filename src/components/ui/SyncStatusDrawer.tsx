/**
 * Add-on 1 — Offline Sync Status Drawer
 * Shows queued records, last sync time, and sync log
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, WifiOff, CheckCircle, Clock, ChevronDown,
  FileText, Activity, ArrowRight, X,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

interface SyncEntry {
  id: string
  type: 'visit' | 'triage' | 'referral' | 'registration'
  patient: string
  timestamp: string
  status: 'pending' | 'synced' | 'failed'
}

const demoQueue: SyncEntry[] = [
  { id: 'S001', type: 'visit',        patient: 'Meena Patil',    timestamp: '23 Aug, 10:42 AM', status: 'pending' },
  { id: 'S002', type: 'triage',       patient: 'Meena Patil',    timestamp: '23 Aug, 10:44 AM', status: 'pending' },
  { id: 'S003', type: 'referral',     patient: 'Lata Kale',      timestamp: '23 Aug, 09:15 AM', status: 'pending' },
  { id: 'S004', type: 'registration', patient: 'Rakesh Sharma',  timestamp: '22 Aug, 04:30 PM', status: 'synced' },
  { id: 'S005', type: 'visit',        patient: 'Sunita Bai',     timestamp: '22 Aug, 03:10 PM', status: 'synced' },
]

const typeIcon = {
  visit: <Activity size={13} className="text-teal-500" />,
  triage: <FileText size={13} className="text-amber-500" />,
  referral: <ArrowRight size={13} className="text-coral-500" />,
  registration: <FileText size={13} className="text-indigo-500" />,
}

export function SyncStatusDrawer() {
  const { isOnline } = useApp()
  const [open, setOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [entries, setEntries] = useState(demoQueue)

  const pending = entries.filter(e => e.status === 'pending')
  const synced  = entries.filter(e => e.status === 'synced')

  function triggerSync() {
    if (!isOnline) return
    setSyncing(true)
    setTimeout(() => {
      setEntries(p => p.map(e => ({ ...e, status: 'synced' as const })))
      setSyncing(false)
    }, 2000)
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-modal text-sm font-medium transition-all
          ${isOnline
            ? pending.length > 0 ? 'bg-amber-500 text-white' : 'bg-teal-500 text-white'
            : 'bg-gray-700 text-white'}`}
        aria-label={`Sync status: ${pending.length} pending`}
      >
        {isOnline
          ? pending.length > 0
            ? <><RefreshCw size={15} className={syncing ? 'animate-spin' : ''} aria-hidden="true" /> {pending.length} pending</>
            : <><CheckCircle size={15} aria-hidden="true" /> All synced</>
          : <><WifiOff size={15} aria-hidden="true" /> Offline</>
        }
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
              onClick={() => setOpen(false)} aria-hidden="true" />

            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white z-50 flex flex-col shadow-modal"
              role="dialog" aria-label="Sync status" aria-modal="true"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#D3D1C7]">
                <div>
                  <h2 className="font-semibold text-[#2C2C2A]">Sync status</h2>
                  <p className="text-xs text-[#5F5E5A] mt-0.5">
                    {isOnline ? 'Connected · Last sync: just now' : 'Offline · Data saved locally'}
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg text-[#5F5E5A] hover:bg-gray-100 transition-colors" aria-label="Close">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {/* Summary */}
              <div className="px-5 py-4 border-b border-[#D3D1C7]">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 text-center ${pending.length > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                    <p className={`text-2xl font-bold tabular-nums ${pending.length > 0 ? 'text-amber-700' : 'text-green-700'}`}>{pending.length}</p>
                    <p className="text-xs text-[#5F5E5A] mt-0.5">Pending upload</p>
                  </div>
                  <div className="rounded-xl p-3 text-center bg-teal-50">
                    <p className="text-2xl font-bold tabular-nums text-teal-700">{synced.length}</p>
                    <p className="text-xs text-[#5F5E5A] mt-0.5">Synced to cloud</p>
                  </div>
                </div>

                {isOnline && pending.length > 0 && (
                  <button onClick={triggerSync} disabled={syncing}
                    className="btn-primary w-full justify-center mt-3 text-sm py-2.5">
                    {syncing
                      ? <><RefreshCw size={14} className="animate-spin" /> Syncing {pending.length} records…</>
                      : <><RefreshCw size={14} /> Sync now</>}
                  </button>
                )}

                {!isOnline && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <WifiOff size={13} /> All {pending.length} records saved encrypted on-device. Will auto-sync when connected.
                  </div>
                )}
              </div>

              {/* Log */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-3">Sync log</p>
                {entries.map(entry => (
                  <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-xl border
                    ${entry.status === 'pending' ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-[#D3D1C7]'}`}>
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                      {typeIcon[entry.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#2C2C2A] capitalize">{entry.type} — {entry.patient}</p>
                      <p className="text-[10px] text-[#5F5E5A] flex items-center gap-1">
                        <Clock size={9} /> {entry.timestamp}
                      </p>
                    </div>
                    {entry.status === 'synced'
                      ? <CheckCircle size={15} className="text-green-500 flex-shrink-0" aria-label="Synced" />
                      : <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" aria-label="Pending" />
                    }
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-[#D3D1C7] bg-gray-50">
                <p className="text-[10px] text-[#5F5E5A] leading-relaxed">
                  All on-device data is AES-256 encrypted. Sync uses TLS 1.3. ABDM-compliant data handling. Records are never lost — even if the device is replaced.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
