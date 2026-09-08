/**
 * Explainable AI Panel for Referrals
 * Shows detailed reasoning why a referral was created
 */
import { motion } from 'framer-motion'
import {
  Brain, TrendingUp, Activity, FileText, AlertTriangle,
  CheckCircle, Info, Target, Shield, Building2, Sparkles,
  ThermometerSun, Heart, Wind, X
} from 'lucide-react'
import type { ReferralExplanation } from '../../lib/referralExplainer'

interface Props {
  explanation: ReferralExplanation
  onClose: () => void
}

const impactColors = {
  high: 'bg-red-100 border-red-300 text-red-800',
  medium: 'bg-amber-100 border-amber-300 text-amber-800',
  low: 'bg-blue-100 border-blue-300 text-blue-800'
}

const categoryIcons = {
  clinical: <Heart size={14} className="text-red-600" />,
  vital: <Activity size={14} className="text-blue-600" />,
  history: <FileText size={14} className="text-purple-600" />,
  risk: <AlertTriangle size={14} className="text-amber-600" />,
  resource: <Building2 size={14} className="text-teal-600" />,
  policy: <Shield size={14} className="text-indigo-600" />
}

const decisionBadge = {
  required: 'bg-red-100 border-red-300 text-red-800',
  recommended: 'bg-amber-100 border-amber-300 text-amber-800',
  optional: 'bg-blue-100 border-blue-300 text-blue-800'
}

export function ReferralExplanationPanel({ explanation, onClose }: Props) {
  const highImpactFactors = explanation.contributingFactors.filter(f => f.impact === 'high')
  const mediumImpactFactors = explanation.contributingFactors.filter(f => f.impact === 'medium')
  const lowImpactFactors = explanation.contributingFactors.filter(f => f.impact === 'low')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Brain size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Explainable AI
                  <Sparkles size={20} className="text-yellow-300" />
                </h2>
                <p className="text-sm text-indigo-100 mt-0.5">Referral Decision Analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-xs text-indigo-200 mb-1">Patient</p>
              <p className="font-bold text-lg">{explanation.patientName}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-xs text-indigo-200 mb-1">Decision</p>
              <p className="font-bold text-lg capitalize">{explanation.decision}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-xs text-indigo-200 mb-1">AI Confidence</p>
              <p className="font-bold text-lg">{explanation.confidence}%</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Decision Summary */}
          <div className={`border-2 rounded-xl p-4 ${decisionBadge[explanation.decision]}`}>
            <div className="flex items-start gap-3">
              {explanation.decision === 'required' ? (
                <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle size={24} className="flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  {explanation.decision === 'required' && 'Referral Required'}
                  {explanation.decision === 'recommended' && 'Referral Recommended'}
                  {explanation.decision === 'optional' && 'Referral Optional'}
                </h3>
                <p className="text-sm opacity-90">{explanation.primaryReason}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  explanation.urgencyLevel === 'emergency' ? 'bg-red-200 border-red-400 text-red-900' :
                  explanation.urgencyLevel === 'urgent' ? 'bg-amber-200 border-amber-400 text-amber-900' :
                  'bg-teal-200 border-teal-400 text-teal-900'
                }`}>
                  {explanation.urgencyLevel.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Reasoning */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={18} className="text-blue-600" />
              <h3 className="font-bold text-gray-800">Detailed Clinical Reasoning</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{explanation.detailedReasoning}</p>
          </div>

          {/* Contributing Factors */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-gray-700" />
              <h3 className="font-bold text-gray-800">Contributing Factors</h3>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                {explanation.contributingFactors.length} identified
              </span>
            </div>

            <div className="space-y-3">
              {/* High Impact */}
              {highImpactFactors.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                    High Impact Factors
                  </p>
                  {highImpactFactors.map((factor, idx) => (
                    <FactorCard key={idx} factor={factor} />
                  ))}
                </div>
              )}

              {/* Medium Impact */}
              {mediumImpactFactors.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 mt-4">
                    Medium Impact Factors
                  </p>
                  {mediumImpactFactors.map((factor, idx) => (
                    <FactorCard key={idx} factor={factor} />
                  ))}
                </div>
              )}

              {/* Low Impact */}
              {lowImpactFactors.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 mt-4">
                    Supporting Factors
                  </p>
                  {lowImpactFactors.map((factor, idx) => (
                    <FactorCard key={idx} factor={factor} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-600" />
              <h3 className="font-bold text-gray-800">Risk if Not Referred</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{explanation.riskIfNotReferred}</p>
          </div>

          {/* Expected Outcome */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-green-600" />
              <h3 className="font-bold text-gray-800">Expected Outcome with Referral</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{explanation.expectedOutcome}</p>
          </div>

          {/* Facility Recommendation */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={18} className="text-teal-600" />
              <h3 className="font-bold text-gray-800">Recommended Facility</h3>
            </div>
            <div className="mb-3">
              <p className="font-bold text-lg text-teal-900 mb-1">
                {explanation.facilityRecommendation.suggested}
              </p>
              <p className="text-sm text-gray-700">{explanation.facilityRecommendation.reason}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Available Capabilities:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {explanation.facilityRecommendation.capabilities.map((cap, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-teal-600 mt-0.5 flex-shrink-0" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Guidelines */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-purple-600" />
              <h3 className="font-bold text-gray-800">Clinical Guidelines Referenced</h3>
            </div>
            <ul className="space-y-2">
              {explanation.clinicalGuidelines.map((guideline, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Alternative Options */}
          {explanation.alternativeOptions && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info size={18} className="text-gray-600" />
                <h3 className="font-bold text-gray-800">Alternative Options to Consider</h3>
              </div>
              <ul className="space-y-2">
                {explanation.alternativeOptions.map((option, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-600 mt-1">→</span>
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confidence Breakdown */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} className="text-indigo-600" />
              <h3 className="font-bold text-gray-800">AI Confidence Analysis</h3>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-700">Decision Confidence</span>
                <span className="font-bold text-indigo-900">{explanation.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${explanation.confidence}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    explanation.confidence >= 80 ? 'bg-green-500' :
                    explanation.confidence >= 60 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                />
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Based on {explanation.contributingFactors.length} clinical factors, validated medical guidelines, 
              and pattern recognition from thousands of similar cases.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Analysis generated in real-time using clinical ML models
            </p>
            <button
              onClick={onClose}
              className="btn-primary text-sm py-2 px-6"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function FactorCard({ factor }: { factor: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 rounded-lg p-3 mb-2 ${impactColors[factor.impact]}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{categoryIcons[factor.category]}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-bold text-sm">{factor.factor}</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 capitalize whitespace-nowrap">
              {factor.impact} impact
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div>
              <span className="font-semibold">Value: </span>
              <span>{factor.value}</span>
            </div>
            {factor.threshold && (
              <div>
                <span className="font-semibold">Threshold: </span>
                <span>{factor.threshold}</span>
              </div>
            )}
          </div>
          <p className="text-sm opacity-90 leading-relaxed">{factor.explanation}</p>
        </div>
      </div>
    </motion.div>
  )
}
