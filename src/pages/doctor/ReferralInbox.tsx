// Module 5 — Referral inbox (doctor view)
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ArrowRight, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, RefreshCw, Brain, Sparkles } from 'lucide-react'
import { referralsApi, type Referral } from '../../services/api'
import { generateReferralExplanation, type ReferralExplanation } from '../../lib/referralExplainer'
import { ReferralExplanationPanel } from '../../components/ui/ReferralExplanationPanel'
import { useApp, useT } from '../../context/AppContext'
import { createLocalizer } from '../../lib/localize'

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

  const { language } = useApp()
  const t = useT()
  const L = createLocalizer(language)

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <ArrowRight size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Referral Management</h1>
                <p className="text-blue-100 text-sm mt-1">Track incoming and outgoing patient referrals with AI insights</p>
              </div>
            </div>
            <button onClick={() => { setLoading(true); fetchAll() }}
              className="p-3 rounded-xl text-white hover:bg-white/10 transition-all duration-200">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-blue-100 mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" /> Live · updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex border-b-2 border-gray-200 bg-white rounded-t-2xl shadow-lg" role="tablist">
        {(['incoming', 'outgoing'] as Tab[]).map(t2 => (
          <button key={t2} role="tab" aria-selected={tab === t2}
            onClick={() => setTab(t2)}
            className={`flex-1 px-6 py-4 text-base font-bold capitalize border-b-4 transition-all duration-200
              ${tab === t2 ? 'border-[#E85D04] text-[#123B6D] bg-gradient-to-b from-orange-50/30 to-transparent' : 'border-transparent text-gray-600 hover:text-[#123B6D] hover:bg-gray-50'}`}>
            {t2 === 'incoming' ? t('incoming') : t('outgoing')}
            <span className={`ml-3 text-sm px-3 py-1 rounded-full font-bold ${t2 === 'incoming' ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-2 border-orange-300' : 'bg-gray-100 text-gray-600 border-2 border-gray-300'}`}>
              {t2 === 'incoming' ? incoming.length : outgoing.length}
            </span>
          </button>
        ))}
        </div>

        {/* Cards */}
        <div className="space-y-4" role="list">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#123B6D]" size={48} /></div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border-2 border-gray-100">
            <ArrowRight size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-bold text-[#123B6D]">{t('noReferrals')}</p>
          </div>
        ) : list.map((ref, i) => {
          return (
            <motion.article key={ref.id} role="listitem"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-white rounded-2xl shadow-xl p-6 space-y-4 border-2 border-gray-100 hover:shadow-2xl transition-all duration-200 ${ref.urgency === 'emergency' ? 'border-l-[6px] border-l-red-500' : ref.urgency === 'urgent' ? 'border-l-[6px] border-l-amber-400' : ''}`}>

              {/* Header */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <p className="font-bold text-lg text-[#123B6D]">{L.name(ref.patientName)}</p>
                    <span className="text-sm text-gray-600 font-medium">· #{ref.id.slice(0,8)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin size={16} className="text-[#FF9933]" />
                    <span className="font-medium">{L.facility('Sub-Centre Mandav')}</span>
                    <ArrowRight size={16} className="text-[#E85D04]" />
                    <span className="font-medium">{L.facility(ref.toFacilityName)}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold capitalize border-2 ${ref.urgency === 'emergency' ? 'bg-red-50 text-red-800 border-red-300' : ref.urgency === 'urgent' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-orange-50 text-[#E85D04] border-[#E85D04]'}`}>{L.status(ref.urgency)}</span>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold capitalize border-2 ${ref.status === 'accepted' || ref.status === 'treated' ? 'bg-green-50 text-green-800 border-green-300' : ref.status === 'redirected' ? 'bg-orange-50 text-[#E85D04] border-[#E85D04]' : 'bg-amber-50 text-amber-800 border-amber-300'}`}>{L.status(ref.status)}</span>
                </div>
              </div>

              <p className="text-base text-gray-700 leading-relaxed bg-gradient-to-br from-blue-50/50 to-orange-50/50 p-4 rounded-xl border-2 border-gray-200">{ref.reason}</p>

              {/* AI Explanation Button */}
              <button
                onClick={() => showAIExplanation(ref)}
                className="flex items-center gap-3 text-sm font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border-2 border-indigo-300 rounded-xl px-5 py-3 transition-all duration-200 shadow-md hover:shadow-lg w-full justify-center"
              >
                <Brain size={18} />
                <span>View AI Explanation</span>
                <Sparkles size={16} className="text-indigo-500" />
              </button>

              <div className="flex items-center text-sm text-gray-600 font-medium">
                <span className="flex items-center gap-2"><Clock size={14} /> {new Date(ref.createdAt).toLocaleDateString('en-IN')}</span>
              </div>

              {tab === 'incoming' && ref.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => accept(ref.id)}
                    className="flex-1 flex items-center justify-center gap-2 text-base font-bold py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-xl transition-all duration-200">
                    <CheckCircle size={18} /> {t('acceptReferral')}
                  </button>
                  <button onClick={() => redirect(ref.id)}
                    className="flex-1 flex items-center justify-center gap-2 text-base font-bold py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
                    <XCircle size={18} /> {t('redirectReferral')}
                  </button>
                </div>
              )}

              {ref.status === 'accepted' && (
                <div className="flex items-center gap-3 text-sm font-bold text-green-700 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl px-5 py-3">
                  <CheckCircle size={18} /> {t('accepted')} — {t('patientQueueLabel')}
                </div>
              )}

              {ref.urgency === 'emergency' && (
                <div className="flex items-center gap-3 text-sm font-bold text-red-600 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl px-5 py-3 animate-pulse">
                  <AlertTriangle size={18} /> {t('emergency')} — {t('urgent')}
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
    </div>
  )
}
