import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, TriageSession } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const HOSPITAL_LEVELS: Record<string, { level: number; label: string; desc: string }> = {
  low:       { level: 1, label: 'Sub-Centre / ASHA',         desc: 'Manage at home with ASHA guidance' },
  medium:    { level: 2, label: 'PHC / CHC',                 desc: 'Primary Health Centre or Community Health Centre' },
  high:      { level: 3, label: 'District Hospital',          desc: 'District or Rural Hospital' },
  emergency: { level: 4, label: 'Tertiary / Medical College', desc: 'Tertiary care — Medical College or Super-Speciality Hospital' },
}

// POST /triage/assess — proxy to Python ML backend
router.post('/assess', requireAuth, async (req, res) => {
  try {
    const mlResp = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    if (!mlResp.ok) throw new Error('ML backend error')
    const data = await mlResp.json() as Record<string, unknown>
    res.json(data)
  } catch {
    // Rule-based fallback when ML is down
    const vitals = (req.body.vitals || {}) as Record<string, string>
    const answers = (req.body.answers || []) as string[]
    const text = answers.join(' ').toLowerCase()

    let score = 35
    const flags: string[] = []

    if (vitals.bp) {
      const sys = parseInt(vitals.bp.split('/')[0] || '120')
      if (sys > 180) { score += 30; flags.push('Critical blood pressure') }
      else if (sys > 160) { score += 20; flags.push('High blood pressure') }
    }
    if (vitals.spo2 && parseFloat(vitals.spo2) < 90) { score += 25; flags.push('Low oxygen saturation') }
    if (vitals.temp && parseFloat(vitals.temp) >= 102) { score += 15; flags.push('High fever') }
    if (/chest pain|chest tight/.test(text)) { score += 20; flags.push('Chest pain reported') }
    if (/breathless|can.t breathe|difficulty breath/.test(text)) { score += 15; flags.push('Breathing difficulty') }
    if (/bleed|haemorrhage/.test(text)) { score += 15; flags.push('Bleeding reported') }
    if (/seiz|convuls|fits/.test(text)) { score += 25; flags.push('Seizure reported') }

    score = Math.min(score, 100)
    const level = score >= 75 ? 'emergency' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low'
    const hosp = HOSPITAL_LEVELS[level]

    res.json({
      urgency_level: ['low','medium','high','emergency'].indexOf(level),
      risk_level: level, risk_label: level.charAt(0).toUpperCase() + level.slice(1),
      score, confidence: 70, auto_escalate: score >= 75, flags,
      hospital_level: hosp.level, hospital_level_label: hosp.label, hospital_level_desc: hosp.desc,
      probabilities: { low: level==='low'?70:10, medium: level==='medium'?70:10, high: level==='high'?70:10, emergency: level==='emergency'?70:10 },
      mlUsed: false,
    })
  }
})

// POST /triage/save
router.post('/save', requireAuth, (req, res) => {
  const session: TriageSession = {
    id: uuid(),
    patientId: req.body.patientId,
    workerId: req.user!.userId,
    vitals: req.body.vitals,
    answers: req.body.answers || [],
    score: req.body.score,
    level: req.body.level,
    triggeredFlags: req.body.triggeredFlags || [],
    autoEscalate: req.body.autoEscalate || false,
    mlUsed: req.body.mlUsed || false,
    confidence: req.body.confidence,
    hospitalLevel: req.body.hospitalLevel,
    hospitalLevelLabel: req.body.hospitalLevelLabel,
    hospitalLevelDesc: req.body.hospitalLevelDesc,
    createdAt: new Date().toISOString(),
  }
  db.triageSessions.push(session)
  res.status(201).json({ triageId: session.id, savedAt: session.createdAt })
})

// GET /triage/sessions?patientId=
router.get('/sessions', requireAuth, (req, res) => {
  const { patientId } = req.query
  let sessions = db.triageSessions
  if (patientId) sessions = sessions.filter(s => s.patientId === patientId)
  res.json(sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
})

export default router
