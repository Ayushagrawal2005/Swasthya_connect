/**
 * SwasthyaConnect — Shared Risk Scoring Engine
 *
 * Produces a numeric score 0–100 from vitals + symptom answers.
 * Thresholds:
 *   0–39  → low      (green)
 *   40–59 → medium   (amber)
 *   60–74 → high     (coral/red)
 *   75+   → emergency → AUTO-ESCALATE to higher facility
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'emergency'

export interface ScoringInput {
  vitals?: {
    bp?:    string   // "120/80"
    temp?:  string   // "98.6"
    spo2?:  string   // "98"
    pulse?: string   // "80"
  }
  answers?: string[]   // free-text symptom answers
  selfReportedSeverity?: number  // 1–10 from triage question
}

export interface ScoringResult {
  score: number          // 0–100
  level: RiskLevel
  autoEscalate: boolean  // true when score >= 75
  breakdown: {
    vitalsScore:   number
    symptomsScore: number
    severityScore: number
  }
  triggeredFlags: string[]  // human-readable reasons
}

// ─── Vital sign bounds ───────────────────────────────────────────────────────

function scoreBP(raw: string): { points: number; flag?: string } {
  const parts = raw.split('/').map(s => Number(s.trim()))
  if (parts.length !== 2 || parts.some(isNaN)) return { points: 0 }
  const [sys, dia] = parts

  // Hypertensive crisis
  if (sys >= 180 || dia >= 120) return { points: 35, flag: `BP ${sys}/${dia} — hypertensive crisis` }
  // Stage 2 hypertension
  if (sys >= 160 || dia >= 100) return { points: 28, flag: `BP ${sys}/${dia} — stage 2 hypertension` }
  // Stage 1 hypertension
  if (sys >= 140 || dia >= 90)  return { points: 18, flag: `BP ${sys}/${dia} — elevated` }
  // Hypotension
  if (sys < 90  || dia < 60)   return { points: 22, flag: `BP ${sys}/${dia} — hypotension` }
  return { points: 0 }
}

function scoreTemp(raw: string): { points: number; flag?: string } {
  const t = Number(raw.trim())
  if (isNaN(t)) return { points: 0 }
  if (t >= 104)         return { points: 30, flag: `Temp ${t}°F — hyperpyrexia` }
  if (t >= 102)         return { points: 20, flag: `Temp ${t}°F — high fever` }
  if (t >= 100.4)       return { points: 10, flag: `Temp ${t}°F — fever` }
  if (t < 96)           return { points: 20, flag: `Temp ${t}°F — hypothermia` }
  return { points: 0 }
}

function scoreSpo2(raw: string): { points: number; flag?: string } {
  const s = Number(raw.trim())
  if (isNaN(s)) return { points: 0 }
  if (s < 85)          return { points: 35, flag: `SpO₂ ${s}% — severe hypoxia` }
  if (s < 90)          return { points: 28, flag: `SpO₂ ${s}% — significant hypoxia` }
  if (s < 95)          return { points: 15, flag: `SpO₂ ${s}% — mild hypoxia` }
  return { points: 0 }
}

function scorePulse(raw: string): { points: number; flag?: string } {
  const p = Number(raw.trim())
  if (isNaN(p)) return { points: 0 }
  if (p > 140 || p < 40)  return { points: 28, flag: `Pulse ${p} bpm — critical` }
  if (p > 120 || p < 50)  return { points: 18, flag: `Pulse ${p} bpm — abnormal` }
  if (p > 100 || p < 60)  return { points: 8,  flag: `Pulse ${p} bpm — borderline` }
  return { points: 0 }
}

// ─── Symptom keyword scoring ────────────────────────────────────────────────

const EMERGENCY_KEYWORDS: [RegExp, number, string][] = [
  [/chest pain|chest tightness/i,             35, 'Chest pain reported'],
  [/can'?t breathe|cannot breathe|struggling to breathe/i, 35, 'Severe breathing difficulty'],
  [/convuls|seizure|fitting/i,                35, 'Convulsion / seizure'],
  [/unconscious|unresponsive|collapse/i,      35, 'Loss of consciousness'],
  [/heavy bleed|excessive bleed|bleeding a lot/i, 30, 'Heavy bleeding'],
  [/severe headache|worst headache/i,         25, 'Severe headache'],
  [/stroke|facial droop|arm weakness/i,       35, 'Stroke symptoms'],
  [/can'?t walk|can'?t stand/i,               20, 'Unable to mobilise'],
]

const HIGH_KEYWORDS: [RegExp, number, string][] = [
  [/difficulty breath|shortness of breath|breathless/i, 20, 'Breathing difficulty'],
  [/high fever|fever\s*(for\s*\d|\d\s*days)/i, 15, 'Prolonged fever'],
  [/vomit|nausea/i,                            8,  'Vomiting'],
  [/severe pain|very painful/i,               18, 'Severe pain'],
  [/pregnant|pregnancy|antenatal/i,           10, 'Pregnancy — elevated baseline risk'],
  [/diabetes|diabetic/i,                       8, 'Diabetes — elevated risk'],
  [/hypertension|high blood pressure/i,        8, 'Known hypertension'],
]

function scoreSymptoms(answers: string[]): { points: number; flags: string[] } {
  const combined = answers.join(' ')
  let points = 0
  const flags: string[] = []

  for (const [rx, pts, label] of EMERGENCY_KEYWORDS) {
    if (rx.test(combined)) { points += pts; flags.push(label) }
  }
  for (const [rx, pts, label] of HIGH_KEYWORDS) {
    if (rx.test(combined) && !flags.some(f => f === label)) { points += pts; flags.push(label) }
  }
  return { points: Math.min(points, 50), flags }
}

// ─── Self-reported severity (1–10 scale) ───────────────────────────────────

function scoreSeverity(answers: string[]): number {
  // look for a digit 1–10 in any answer
  for (const a of answers) {
    const m = a.match(/\b(10|[1-9])\b/)
    if (m) {
      const n = Number(m[1])
      // Map 1-10 → 0-20 points
      return Math.round((n / 10) * 20)
    }
  }
  return 0
}

// ─── Main scorer ────────────────────────────────────────────────────────────

export function computeRiskScore(input: ScoringInput): ScoringResult {
  const flags: string[] = []
  let vitalsScore = 0

  if (input.vitals) {
    const { vitals } = input
    if (vitals.bp)    { const r = scoreBP(vitals.bp);      vitalsScore += r.points; if (r.flag) flags.push(r.flag) }
    if (vitals.temp)  { const r = scoreTemp(vitals.temp);  vitalsScore += r.points; if (r.flag) flags.push(r.flag) }
    if (vitals.spo2)  { const r = scoreSpo2(vitals.spo2);  vitalsScore += r.points; if (r.flag) flags.push(r.flag) }
    if (vitals.pulse) { const r = scorePulse(vitals.pulse); vitalsScore += r.points; if (r.flag) flags.push(r.flag) }
  }
  vitalsScore = Math.min(vitalsScore, 60) // cap vitals at 60 pts

  const answers = input.answers ?? []
  const { points: symptomsScore, flags: symFlags } = scoreSymptoms(answers)
  flags.push(...symFlags)

  const severityScore = scoreSeverity(answers)

  const raw = vitalsScore + symptomsScore + severityScore
  const score = Math.min(raw, 100)

  let level: RiskLevel
  if (score >= 75) level = 'emergency'
  else if (score >= 60) level = 'high'
  else if (score >= 40) level = 'medium'
  else level = 'low'

  return {
    score,
    level,
    autoEscalate: score >= 75,
    breakdown: { vitalsScore, symptomsScore, severityScore },
    triggeredFlags: flags,
  }
}

// Convenience: level → display config
export const riskDisplayConfig: Record<RiskLevel, {
  label: string
  color: string         // tailwind text color
  bg: string            // card bg + border
  badgeClass: string
  emoji: string
}> = {
  low: {
    label: 'Low Risk',
    color: 'text-green-800',
    bg: 'bg-green-50 border-green-200',
    badgeClass: 'badge-green',
    emoji: '🟢',
  },
  medium: {
    label: 'Moderate Risk',
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-200',
    badgeClass: 'badge-amber',
    emoji: '🟡',
  },
  high: {
    label: 'High Risk',
    color: 'text-coral-800',
    bg: 'bg-coral-50 border-coral-200',
    badgeClass: 'badge-red',
    emoji: '🔴',
  },
  emergency: {
    label: '🚨 Emergency — Auto-escalating',
    color: 'text-red-900',
    bg: 'bg-red-50 border-red-400 border-2',
    badgeClass: 'badge-red',
    emoji: '🚨',
  },
}
