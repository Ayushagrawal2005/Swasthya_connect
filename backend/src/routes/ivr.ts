import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { db, IvrCase } from '../store/index.js'

const router = Router()

const IVR_ADVICE: Record<string, string> = {
  low:       'Stay home, rest, drink fluids. Call back if symptoms worsen.',
  medium:    'Visit your nearest PHC within 24 hours.',
  high:      'Go to the rural hospital today. Call ASHA worker.',
  emergency: 'Call 104 immediately or go to nearest hospital. This is an emergency.',
}

// POST /ivr/case
router.post('/case', (req, res) => {
  const { phone, answers, riskScore, lang } = req.body as {
    phone: string; answers: string[]; riskScore: number; lang: string
  }
  const score = riskScore ?? 35
  const level = score >= 75 ? 'emergency' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low'

  const ivrCase: IvrCase = {
    id: uuid(),
    caseId: `IVR-${Date.now().toString().slice(-6)}`,
    phone,
    answers: answers || [],
    riskScore: score,
    riskLevel: level as IvrCase['riskLevel'],
    actionAdvice: IVR_ADVICE[level],
    lang: lang || 'mr',
    createdAt: new Date().toISOString(),
  }

  db.ivrCases.push(ivrCase)
  res.status(201).json(ivrCase)
})

// GET /ivr/cases
router.get('/cases', (req, res) => {
  res.json(db.ivrCases.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
})

export default router
