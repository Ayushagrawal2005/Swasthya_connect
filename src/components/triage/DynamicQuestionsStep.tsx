/**
 * Dynamic Questions Step — Step 2
 * Calls Groq directly from the frontend (no backend hop).
 * Questions are fully generated from the patient's chief complaint.
 */

import { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle, Sparkles, CheckCircle, RefreshCw } from 'lucide-react'
import { generateQuestionsFromGemini, type GeminiQuestion } from '../../services/geminiService'
import type { TriageQuestionResponse } from '../../types/teleconsult'

interface Props {
  sessionId: string
  condition: string
  chiefComplaint: string
  responses: TriageQuestionResponse[]
  setResponses: (r: TriageQuestionResponse[]) => void
  language?: 'en' | 'hi' | 'mr'
}

export function DynamicQuestionsStep({
  sessionId,
  condition,
  chiefComplaint,
  responses,
  setResponses,
  language = 'en',
}: Props) {
  const [questions, setQuestions] = useState<GeminiQuestion[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const lastFetched = useRef({ condition: '', chiefComplaint: '', language: '' })

  useEffect(() => {
    if (
      lastFetched.current.condition === condition &&
      lastFetched.current.chiefComplaint === chiefComplaint &&
      lastFetched.current.language === language
    ) return
    fetchQuestions()
  }, [condition, chiefComplaint, language])

  async function fetchQuestions() {
    setLoading(true)
    setError(null)
    lastFetched.current = { condition, chiefComplaint, language }
    try {
      const qs = await generateQuestionsFromGemini(
        chiefComplaint || 'general health concern',
        condition || 'general',
        7,
        language
      )
      setQuestions(qs)
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(questionId: string, answer: any) {
    const existing = responses.find(r => r.questionId === questionId)
    if (existing) {
      setResponses(responses.map(r =>
        r.questionId === questionId
          ? { ...r, answer, answeredAt: new Date().toISOString() }
          : r
      ))
    } else {
      setResponses([...responses, { questionId, answer, answeredAt: new Date().toISOString() }])
    }
  }

  function getAnswer(id: string) {
    return responses.find(r => r.questionId === id)?.answer
  }

  const answered = responses.filter(r => questions.some(q => q.id === r.questionId)).length

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card p-12 text-center space-y-4">
        <Loader2 size={36} className="animate-spin text-teal-600 mx-auto" />
        <div>
          <p className="font-semibold text-[#2C2C2A]">Generating personalized questions...</p>
          <p className="text-sm text-[#5F5E5A] mt-1 italic">
            "{chiefComplaint.slice(0, 80)}{chiefComplaint.length > 80 ? '…' : ''}"
          </p>
        </div>
        <p className="text-xs text-purple-600 flex items-center justify-center gap-1">
          <Sparkles size={12} /> Powered by Groq AI
        </p>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-3 text-red-900">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-medium">Could not generate questions</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button onClick={fetchQuestions} className="btn-primary flex items-center gap-2">
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    )
  }

  // ── Questions ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#2C2C2A]">Health Assessment Questions</h2>
            <p className="text-sm text-[#5F5E5A] mt-1">
              Based on: <span className="font-medium text-teal-700 italic">
                "{chiefComplaint.slice(0, 80)}{chiefComplaint.length > 80 ? '…' : ''}"
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
              <Sparkles size={11} /> AI Generated
            </span>
            <button onClick={fetchQuestions}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700">
              <RefreshCw size={11} /> Regenerate
            </button>
          </div>
        </div>
        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#5F5E5A] mb-1">
            <span>{answered} of {questions.length} answered</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question cards */}
      {questions.map((q, idx) => {
        const answer     = getAnswer(q.id)
        const isAnswered = answer !== undefined && answer !== null && answer !== ''

        return (
          <div key={q.id}
            className={`card p-5 transition-all
              ${isAnswered ? 'border-teal-300 bg-teal-50/30' : 'border-[#D3D1C7]'}
              ${q.redFlag ? 'border-l-4 border-l-red-500' : ''}`}
          >
            {/* Question */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                ${isAnswered ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {isAnswered ? <CheckCircle size={14} /> : idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#2C2C2A] leading-relaxed">
                  {q.question}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </p>
                {q.redFlag && (
                  <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                    <AlertCircle size={11} /> Important safety question
                  </p>
                )}
              </div>
            </div>

            {/* Answer */}
            <div className="ml-10">
              {q.type === 'yes-no' && (
                <div className="flex gap-3">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt}
                      onClick={() => handleAnswer(q.id, opt === 'Yes')}
                      className={`flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition-all
                        ${answer === (opt === 'Yes')
                          ? 'border-teal-500 bg-teal-500 text-white'
                          : 'border-[#D3D1C7] hover:border-teal-300 text-[#2C2C2A]'}`}
                    >{opt}</button>
                  ))}
                </div>
              )}

              {q.type === 'single' && q.options && (
                <div className="space-y-2">
                  {q.options.map(opt => (
                    <button key={opt}
                      onClick={() => handleAnswer(q.id, opt)}
                      className={`w-full text-left py-2.5 px-4 rounded-lg border-2 text-sm transition-all
                        ${answer === opt
                          ? 'border-teal-500 bg-teal-50 text-teal-900 font-medium'
                          : 'border-[#D3D1C7] hover:border-teal-300 text-[#2C2C2A]'}`}
                    >{opt}</button>
                  ))}
                </div>
              )}

              {q.type === 'multi' && q.options && (
                <div className="space-y-2">
                  {q.options.map(opt => {
                    const sel = Array.isArray(answer) && answer.includes(opt)
                    return (
                      <button key={opt}
                        onClick={() => {
                          const cur = Array.isArray(answer) ? answer : []
                          handleAnswer(q.id, sel ? cur.filter(v => v !== opt) : [...cur, opt])
                        }}
                        className={`w-full text-left py-2.5 px-4 rounded-lg border-2 text-sm flex items-center gap-2 transition-all
                          ${sel
                            ? 'border-teal-500 bg-teal-50 text-teal-900 font-medium'
                            : 'border-[#D3D1C7] hover:border-teal-300 text-[#2C2C2A]'}`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${sel ? 'bg-teal-500 border-teal-500' : 'border-gray-400'}`}>
                          {sel && <CheckCircle size={11} className="text-white" />}
                        </div>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'text' && (
                <input type="text" value={answer as string || ''}
                  onChange={e => handleAnswer(q.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="input-field w-full"
                />
              )}

              {q.type === 'number' && (
                <div className="flex items-center gap-2">
                  <input type="number"
                    value={answer as number || ''}
                    onChange={e => handleAnswer(q.id, Number(e.target.value))}
                    min={q.minValue} max={q.maxValue}
                    placeholder="Enter value..."
                    className="input-field flex-1"
                  />
                  {q.unit && <span className="text-sm text-[#5F5E5A]">{q.unit}</span>}
                </div>
              )}

              {q.type === 'scale' && (
                <div className="space-y-2">
                  <div className="flex justify-between gap-1">
                    {[1,2,3,4,5,6,7,8,9,10].map(v => (
                      <button key={v}
                        onClick={() => handleAnswer(q.id, v)}
                        className={`flex-1 aspect-square rounded-lg border-2 font-semibold text-xs transition-all
                          ${answer === v
                            ? 'border-teal-500 bg-teal-500 text-white scale-110'
                            : 'border-[#D3D1C7] hover:border-teal-300 text-[#2C2C2A]'}`}
                      >{v}</button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-[#5F5E5A]">
                    <span>No pain</span><span>Worst pain</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
