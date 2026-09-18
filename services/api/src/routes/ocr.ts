import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import path from 'path'
import { db } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const upload = multer({ dest: 'uploads/' })

// POST /ocr/extract  — accepts file, returns structured medication data
router.post('/extract', requireAuth, upload.single('file'), (req, res) => {
  // In production: call a real OCR service (Google Vision / Tesseract).
  // Here we return a plausible structured result based on the uploaded filename.
  const patientId = req.body.patientId as string
  const filename  = req.file?.originalname || 'document.jpg'

  // Simulated OCR extraction
  const raw = `Patient: Meena Patil  Date: ${new Date().toLocaleDateString('en-IN')}
Dr. Ramesh Patil  PHC Beed  Reg: MH-1234
Rx:
1. Tab. Methyldopa 250mg BD x 30 days
2. Tab. Calcium 500mg BD x 30 days  
3. Tab. IFA 1 OD x 60 days
Follow up after 2 weeks.`

  const structured = {
    drug: 'Methyldopa 250mg',
    dose: '250mg',
    frequency: 'BD',
    prescribedBy: 'Dr. Ramesh Patil',
    prescribedAt: 'PHC Beed',
    date: new Date().toLocaleDateString('en-IN'),
    additionalMeds: [
      { drug: 'Calcium 500mg', dose: '500mg', frequency: 'BD' },
      { drug: 'IFA tablet',    dose: '1 tab',  frequency: 'OD' },
    ],
  }

  // Save as visit record if patientId provided
  if (patientId) {
    const patient = db.patients.find(p => p.id === patientId)
    if (patient) {
      db.visits.push({
        id: uuid(),
        patientId,
        date: new Date().toISOString().split('T')[0],
        facility: 'PHC Beed',
        tier: 'phc',
        worker: req.user!.name,
        type: 'ocr-upload',
        title: 'OCR — Prescription scanned',
        detail: raw,
        reportFile: filename,
      })
    }
  }

  res.json({ raw, structured })
})

export default router
