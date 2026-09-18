/**
 * Chief Complaint Step — Step 1
 * Patient types their main complaint; conditions are auto-detected from it.
 * Groq keyword suggestions appear as clickable chips while typing.
 */

import { useState, useEffect } from 'react'
import { Lightbulb, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { medicalConditions } from '../../data/triageQuestionBank'
import { generateKeywordsFromGemini } from '../../services/geminiService'

interface Props {
  chiefComplaint: string
  setChiefComplaint: (v: string) => void
  selectedConditions: string[]
  setSelectedConditions: (v: string[]) => void
  symptomsDescription: string
  setSymptomsDescription: (v: string) => void
  sessionId: string | null
  language?: 'en' | 'hi' | 'mr'
}

// keyword → condition mapping for auto-detection
const KEYWORD_CONDITION_MAP: Record<string, string> = {
  // hypertension
  'blood pressure': 'hypertension', 'hypertension': 'hypertension', 'bp high': 'hypertension',
  'high bp': 'hypertension', 'headache': 'hypertension', 'dizziness': 'hypertension',
  // diabetes
  'diabetes': 'diabetes', 'sugar': 'diabetes', 'blood sugar': 'diabetes',
  'thirst': 'diabetes', 'frequent urination': 'diabetes', 'fatigue': 'diabetes',
  // pregnancy
  'pregnant': 'pregnancy', 'pregnancy': 'pregnancy', 'baby': 'pregnancy',
  'fetal': 'pregnancy', 'trimester': 'pregnancy', 'labor': 'pregnancy',
  // respiratory
  'cough': 'respiratory', 'fever': 'respiratory', 'cold': 'respiratory',
  'flu': 'respiratory', 'breathless': 'respiratory', 'breathing': 'respiratory',
  'chest congestion': 'respiratory', 'wheezing': 'respiratory', 'sore throat': 'respiratory',
  // mental health
  'anxiety': 'mental', 'depression': 'mental', 'stress': 'mental',
  'sleep': 'mental', 'sad': 'mental', 'hopeless': 'mental', 'panic': 'mental',
  // cardiovascular
  'chest pain': 'cardiovascular', 'heart': 'cardiovascular', 'palpitation': 'cardiovascular',
  'irregular heartbeat': 'cardiovascular', 'swollen legs': 'cardiovascular',
}

function detectConditions(text: string): string[] {
  const lower = text.toLowerCase()
  const detected = new Set<string>()
  for (const [kw, cond] of Object.entries(KEYWORD_CONDITION_MAP)) {
    if (lower.includes(kw)) detected.add(cond)
  }
  return Array.from(detected)
}

export function ChiefComplaintStep({
  chiefComplaint,
  setChiefComplaint,
  selectedConditions,
  setSelectedConditions,
  symptomsDescription,
  setSymptomsDescription,
  sessionId,
  language = 'en',
}: Props) {
  const [keywords, setKeywords] = useState<string[]>([])
  const [loadingKeywords, setLoadingKeywords] = useState(false)
  const [autoDetected, setAutoDetected] = useState<string[]>([])

  // Auto-detect conditions from complaint text
  useEffect(() => {
    if (chiefComplaint.trim().length > 3) {
      const detected = detectConditions(chiefComplaint)
      setAutoDetected(detected)
      // Auto-select detected conditions (merge, don't overwrite manual picks)
      if (detected.length > 0) {
        const merged = Array.from(new Set([...selectedConditions, ...detected]))
        setSelectedConditions(merged)
      }
    }
  }, [chiefComplaint])

  // Fetch Groq keyword suggestions
  useEffect(() => {
    if (chiefComplaint.trim().length > 5) {
      const timer = setTimeout(fetchKeywords, 900)
      return () => clearTimeout(timer)
    }
  }, [chiefComplaint, selectedConditions, language])

  async function fetchKeywords() {
    if (!chiefComplaint.trim()) return
    const condition = selectedConditions[0] || detectConditions(chiefComplaint)[0] || 'general'
    setLoadingKeywords(true)
    try {
      const kws = await generateKeywordsFromGemini(chiefComplaint, condition, language)
      setKeywords(kws)
    } catch {
      // silently ignore
    } finally {
      setLoadingKeywords(false)
    }
  }

  function addKeyword(keyword: string) {
    const updated = chiefComplaint
      ? `${chiefComplaint}, ${keyword}`
      : keyword
    setChiefComplaint(updated)
  }

  function toggleCondition(id: string) {
    setSelectedConditions(
      selectedConditions.includes(id)
        ? selectedConditions.filter(c => c !== id)
        : [...selectedConditions, id]
    )
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#2C2C2A] mb-1">
          What brings you here today?
        </h2>
        <p className="text-sm text-[#5F5E5A]">
          Describe your main symptoms — conditions and questions will be generated automatically
        </p>
      </div>

      {/* Chief Complaint */}
      <div>
        <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
          Main Complaint <span className="text-red-500">*</span>
        </label>
        <textarea
          value={chiefComplaint}
          onChange={e => setChiefComplaint(e.target.value)}
          placeholder="e.g. I have had a headache and high blood pressure for 3 days..."
          className="input-field min-h-[110px] resize-none"
          maxLength={500}
          autoFocus
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-[#5F5E5A] flex items-center gap-1">
            <Lightbulb size={11} />
            Be specific — duration, severity, what makes it better or worse
          </p>
          <span className="text-xs text-[#5F5E5A]">{chiefComplaint.length}/500</span>
        </div>
      </div>

      {/* Auto-detected conditions badge */}
      {autoDetected.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-teal-700 font-medium">Auto-detected:</span>
          {autoDetected.map(c => {
            const cond = medicalConditions.find(m => m.id === c)
            return cond ? (
              <span key={c} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-teal-50 border border-teal-300 text-teal-800 rounded-full">
                <CheckCircle2 size={10} />
                {cond.name.split(' / ')[0]}
              </span>
            ) : null
          })}
        </div>
      )}

      {/* Gemini keyword suggestions */}
      {chiefComplaint.trim().length > 5 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-purple-600" />
            <span className="text-xs font-semibold text-purple-900">AI Symptom Suggestions</span>
            {loadingKeywords && <Loader2 size={12} className="animate-spin text-purple-500 ml-auto" />}
          </div>
          {keywords.length > 0 ? (
            <>
              <p className="text-xs text-purple-700 mb-2">Click to add to your complaint:</p>
              <div className="flex flex-wrap gap-2">
                {keywords.slice(0, 12).map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => addKeyword(kw)}
                    className="px-3 py-1 rounded-full bg-white border border-purple-300 text-purple-900 text-xs hover:bg-purple-100 transition-colors"
                  >
                    + {kw}
                  </button>
                ))}
              </div>
            </>
          ) : !loadingKeywords ? (
            <p className="text-xs text-purple-600">Type more details to get AI-powered suggestions...</p>
          ) : null}
        </div>
      )}

      {/* Manual condition override (collapsed by default if auto-detected) */}
      <details open={autoDetected.length === 0} className="group">
        <summary className="text-sm font-medium text-[#2C2C2A] cursor-pointer select-none flex items-center gap-2 list-none">
          <span className="w-4 h-4 border-2 border-[#D3D1C7] rounded flex items-center justify-center text-[10px] group-open:border-teal-500 group-open:bg-teal-50">
            ▾
          </span>
          {autoDetected.length > 0
            ? 'Override / add more conditions (optional)'
            : 'Select related condition'}
          {selectedConditions.length > 0 && (
            <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {selectedConditions.length} selected
            </span>
          )}
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {medicalConditions.map(c => (
            <button
              key={c.id}
              onClick={() => toggleCondition(c.id)}
              className={`text-left px-4 py-3 rounded-xl border-2 transition-all text-sm
                ${selectedConditions.includes(c.id)
                  ? 'border-teal-500 bg-teal-50 text-teal-900'
                  : 'border-[#D3D1C7] hover:border-teal-300 text-[#2C2C2A]'}
              `}
            >
              <div className="font-medium">{c.name}</div>
              {c.nameHi && <div className="text-xs opacity-60 mt-0.5">{c.nameHi}</div>}
            </button>
          ))}
        </div>
      </details>

      {/* Additional details */}
      <div>
        <label className="block text-sm font-medium text-[#2C2C2A] mb-2">
          Additional Details (optional)
        </label>
        <textarea
          value={symptomsDescription}
          onChange={e => setSymptomsDescription(e.target.value)}
          placeholder="Any other symptoms, when they started, what makes them better or worse..."
          className="input-field min-h-[70px] resize-none"
          maxLength={1000}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
        <p className="font-medium mb-1">💡 Why we ask this</p>
        <p className="leading-relaxed">
          Your description is used to generate personalized follow-up questions and an AI-assisted
          summary for the doctor. Be as specific as possible.
        </p>
      </div>
    </div>
  )
}
