// Module 5 — Referral inbox (doctor view)
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ArrowRight, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, RefreshCw, Brain, Sparkles } from 'lucide-react'
import { referralsApi, type Referral } from '../../services/api'
import { generateReferralExplanation, type ReferralExplanation } from '../../lib/referralExplainer'
import { ReferralExplanationPanel } from '../../components/ui/ReferralExplanationPanel'

type Tab = 'incoming' | 'outgoing'

interface ReferralItem {
  id: string
  patient: string
  age: number
  from: string
  to: string
  reason: string
  urgency: string
  date: string
  status: string
}

const incoming: ReferralItem[] = [
  { id: 'REF010', patient: 'Meena Jadhav', age: 24, from: 'Sub-centre Mandav', to: 'PHC Beed', reason: 'High-risk pregnancy — BP 150/100, 32 weeks', urgency: 'urgent', date: '23 Aug 2026', status: 'pending' },
  { id: 'REF011', patient: 'Arjun Patil', age: 8, from: 'Sub-centre Tembhurni', to: 'PHC Beed', reason: 'Persistent fever + rash × 5 days, suspect viral exanthem', urgency: 'routine', date: '23 Aug 2026', status: 'pending' },
  { id: 'REF009', patient: 'Sunita Bai', age: 67, from: 'ASHA Worker Rekha', to: 'PHC Beed', reason: 'Uncontrolled hypertension — BP 170/108', urgency: 'urgent', date: '22 Aug 2026', status: 'accepted' },
]

const outgoing: ReferralItem[] = [
  { id: 'REF001', patient: 'Priya Sharma', age: 28, from: 'PHC Beed', to: 'Rural Hospital Beed', reason: 'Low Hb (11.2) in 28W pregnancy — specialist review', urgency: 'urgent', date: '20 Aug 2026', status: 'accepted' },
  { id: 'REF002', patient: 'Ramesh Jadhav', age: 54, from: 'PHC Beed', to: 'District Hospital Beed', reason: 'Acute chest pain — ECG inconclusive', urgency: 'emergency', date: '19 Aug 2026', status: 'treated' },
]

const urgencyBadge: Record<string, string> = { routine: 'badge-teal', urgent: 'badge-amber', emergency: 'badge-red' }
const statusBadge: Record<string, string> = { pending: 'badge-amber', accepted: 'badge-green', redirected: 'badge-teal', treated: 'badge-green' }

export function ReferralInboxPage() {
  const [tab, setTab] = useState<Tab>('incoming')
  const [incoming, setIncoming] = useState<Referral[]>([])
  const [outgoing, setOutgoing] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [currentExplanation, setCurrentExplanation] = useState<ReferralExplanation | null>(null)

  const fetchAll = useCallback(() => {
    return Promise.all([referralsApi.incoming(), referralsApi.outgoing()])
      .then(([inc, out]) => {
        setIncoming(inc)
        setOutgoing(out)
        setLastUpdated(new Date())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  function accept(id: string) {
    referralsApi.accept(id).then(() => setIncoming(p => p.map(r => r.id === id ? { ...r, status: 'accepted' } : r)))
  }
  function redirect(id: string) {
    referralsApi.redirect(id).then(() => setIncoming(p => p.map(r => r.id === id ? { ...r, status: 'redirected' } : r)))
  }

  function showAIExplanation(referral: Referral) {
    const explanation = generateReferralExplanation(
      {
        name: referral.patientName,
        age: 52,
        gender: 'F',
        vitals: {
          bp: '168/104',
          temp: '98.6°F',
          pulse: '88 bpm',
          spo2: '96%',
          weight: '64 kg'
        },
        conditions: ['Hypertension', 'Iron-deficiency Anaemia'],
        riskScore: referral.urgency === 'emergency' ? 85 : referral.urgency === 'urgent' ? 65 : 45
      },
      {
        reason: referral.reason,
        urgency: referral.urgency as 'routine' | 'urgent' | 'emergency',
        toFacility: referral.toFacilityName,
        fromFacility: 'Sub-centre Mandav'
      }
    )
    
    setCurrentExplanation(explanation)
    setShowExplanation(true)
  }

  const list = tab === 'incoming' ? incoming : outgoing

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#2C2C2A]">Referrals</h1>
          {lastUpdated && (
            <p className="text-[10px] text-[#9E9C94] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Live · updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button onClick={() => { setLoading(true); fetchAll() }}
          className="p-2 rounded-lg text-[#5F5E5A] hover:text-[#138808] hover:bg-green-50 transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D3D1C7]" role="tablist">
        {(['incoming', 'outgoing'] as Tab[]).map(t => (
          <button key={t} role="tab" aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
              ${tab === t ? 'border-teal-500 text-teal-600' : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'}`}>
            {t}
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${t === 'incoming' ? 'bg-coral-100 text-coral-700' : 'bg-gray-100 text-[#5F5E5A]'}`}>
              {t === 'incoming' ? incoming.length : outgoing.length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3" role="list">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#138808]" /></div>
        ) : list.length === 0 ? (
          <p className="text-sm text-[#5F5E5A] text-center py-8">No {tab} referrals.</p>
        ) : list.map((ref, i) => {
          return (
            <motion.article key={ref.id} role="listitem"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`card p-5 space-y-3 ${ref.urgency === 'emergency' ? 'border-l-4 border-l-red-500' : ref.urgency === 'urgent' ? 'border-l-4 border-l-amber-400' : ''}`}>

              {/* Header */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{ref.patientName}</p>
                    <span className="text-xs text-[#5F5E5A]">· #{ref.id.slice(0,8)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5F5E5A]">
                    <MapPin size={11} className="text-[#FF9933]" />
                    Sub-centre <ArrowRight size={11} /> {ref.toFacilityName}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className={`${urgencyBadge[ref.urgency]} text-[10px] capitalize`}>{ref.urgency}</span>
                  <span className={`${statusBadge[ref.status] || 'badge-amber'} text-[10px] capitalize`}>{ref.status}</span>
                </div>
              </div>

              <p className="text-sm text-[#5F5E5A] leading-relaxed">{ref.reason}</p>

              {/* AI Explanation Button */}
              <button
                onClick={() => showAIExplanation(ref)}
                className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-2 transition-colors font-medium w-full sm:w-auto"
              >
                <Brain size={14} />
                <span>View AI Explanation</span>
                <Sparkles size={12} className="text-indigo-500" />
              </button>

              <div className="flex items-center text-[10px] text-[#5F5E5A]">
                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(ref.createdAt).toLocaleDateString('en-IN')}</span>
              </div>

              {tab === 'incoming' && ref.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => accept(ref.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-btn bg-[#138808] text-white hover:bg-green-700 transition-colors font-medium">
                    <CheckCircle size={13} /> Accept — add to queue
                  </button>
                  <button onClick={() => redirect(ref.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-btn border-2 border-[#D3D1C7] text-[#5F5E5A] hover:border-gray-300 transition-colors font-medium">
                    <XCircle size={13} /> Redirect
                  </button>
                </div>
              )}

              {ref.status === 'accepted' && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle size={13} /> Accepted — patient added to your queue
                </div>
              )}

              {ref.urgency === 'emergency' && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={13} /> Emergency — priority routing active
                </div>
              )}
            </motion.article>
          )
        })}
      </div>
      
      {/* Explainable AI Panel */}
      <AnimatePresence>
        {showExplanation && currentExplanation && (
          <ReferralExplanationPanel
            explanation={currentExplanation}
            onClose={() => setShowExplanation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
