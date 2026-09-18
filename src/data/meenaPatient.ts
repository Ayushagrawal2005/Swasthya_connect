/**
 * SwasthyaConnect — Meena's complete longitudinal patient record (seeded demo)
 * Accessible to ASHA workers and Doctors. Includes disease history,
 * uploaded reports, lab results, imaging, prescriptions, and OCR-extracted docs.
 */

export type FacilityTier = 'sub-centre' | 'phc' | 'rural-hospital' | 'district'
export type RecordType = 'visit' | 'lab' | 'prescription' | 'diagnosis' | 'referral' | 'ocr-upload' | 'imaging'

export interface VitalsRecord {
  bp?: string
  temp?: string
  spo2?: string
  pulse?: string
  weight?: string
  height?: string
  rbs?: string   // random blood sugar
  hb?: string    // hemoglobin
}

export interface VisitRecord {
  id: string
  date: string
  facility: string
  tier: FacilityTier
  worker: string
  type: RecordType
  title: string
  detail: string
  vitals?: VitalsRecord
  riskScore?: number
  riskLevel?: 'low' | 'medium' | 'high' | 'emergency'
  reportFile?: string
}

export interface DiseaseEntry {
  name: string
  since: string
  status: 'active' | 'resolved' | 'chronic'
  icd10?: string
  notes: string
}

export interface MedicationEntry {
  drug: string
  dose: string
  frequency: string
  since: string
  prescribedBy: string
  status: 'current' | 'discontinued' | 'completed'
  source: 'prescription' | 'ocr'
}

export interface PatientRecord {
  id: string
  healthId: string
  name: string
  age: number
  gender: 'F' | 'M' | 'O'
  dob: string
  village: string
  phone: string
  language: string
  bloodGroup: string
  allergies: string[]
  conditions: string[]
  diseaseHistory: DiseaseEntry[]
  medications: MedicationEntry[]
  noShowCount: number
  totalFollowUps: number
  distanceKmFromPHC: number
  visits: VisitRecord[]
}

// ─── Meena Patil — 52-year-old from rural Maharashtra ───────────────────────

export const meena: PatientRecord = {
  id: 'P-MEENA-001',
  healthId: '91-7842-3301-6629',
  name: 'Meena Patil',
  age: 52,
  gender: 'F',
  dob: '12 Mar 1974',
  village: 'Mandav, Beed District',
  phone: '9876543210',
  language: 'Marathi',
  bloodGroup: 'B+',
  allergies: ['Penicillin (rash)'],
  conditions: ['Hypertension (Stage 2, chronic)', 'Iron-deficiency anaemia', 'Mild LVH (echo)'],

  diseaseHistory: [
    {
      name: 'Essential Hypertension',
      since: 'Jan 2022',
      status: 'chronic',
      icd10: 'I10',
      notes: 'Diagnosed at PHC Beed. Progressive — BP trending upward over 3 recent visits (152→158→168 mmHg systolic). Poorly controlled despite Amlodipine prescribed at district hospital.',
    },
    {
      name: 'Iron-deficiency Anaemia',
      since: 'Aug 2023',
      status: 'active',
      icd10: 'D50.9',
      notes: 'Hb 10.4 g/dL on CBC (Aug 2026). Iron supplements prescribed; compliance uncertain. MCV low — microcytic pattern.',
    },
    {
      name: 'Left Ventricular Hypertrophy (mild)',
      since: 'Jan 2026',
      status: 'active',
      icd10: 'I51.7',
      notes: 'Detected on echocardiogram Jan 2026. EF 62% (normal). Likely secondary to long-standing hypertension. Repeat ECHO in 1 year recommended.',
    },
    {
      name: 'Dyslipidaemia (borderline)',
      since: 'Dec 2025',
      status: 'active',
      icd10: 'E78.5',
      notes: 'Total cholesterol 214, LDL 138, HDL 42. Dietary modification advised. Statin therapy deferred pending BP control.',
    },
    {
      name: 'Acute Viral Fever',
      since: 'Jul 2026',
      status: 'resolved',
      icd10: 'A99',
      notes: 'Low-grade fever × 2 days. Resolved with paracetamol. No further follow-up needed.',
    },
    {
      name: 'Gestational Hypertension',
      since: '1998',
      status: 'resolved',
      icd10: 'O13',
      notes: 'Elevated BP during 3rd pregnancy (1998). Resolved post-delivery. May be a precursor to current essential hypertension.',
    },
  ],

  medications: [
    {
      drug: 'Amlodipine',
      dose: '5 mg',
      frequency: 'Once daily (OD)',
      since: 'Feb 2026',
      prescribedBy: 'Dr. S. Kulkarni — District Hospital Beed',
      status: 'current',
      source: 'ocr',
    },
    {
      drug: 'Iron + Folic Acid',
      dose: '1 tablet',
      frequency: 'Once daily after food',
      since: 'Aug 2023',
      prescribedBy: 'Dr. Ramesh Patil — PHC Beed',
      status: 'current',
      source: 'prescription',
    },
    {
      drug: 'Paracetamol 500mg',
      dose: '1 tablet',
      frequency: 'Three times daily (TDS) × 3 days',
      since: 'Jul 2026',
      prescribedBy: 'ANM Kavita Shinde — Sub-Centre Mandav',
      status: 'completed',
      source: 'prescription',
    },
  ],

  noShowCount: 1,
  totalFollowUps: 3,
  distanceKmFromPHC: 18,

  visits: [
    {
      id: 'V010',
      date: '23 Aug 2026',
      facility: 'Sub-Centre Mandav',
      tier: 'sub-centre',
      worker: 'ANM Kavita Shinde',
      type: 'visit',
      title: 'Headache + dizziness — triage (TODAY)',
      detail: 'Patient reports headache and dizziness for 2 days. No chest pain, no blurred vision, no focal neurological deficit. BP critically elevated at 168/104. Triage score: 52/100 (High). Referral to PHC Beed initiated.',
      vitals: { bp: '168/104', temp: '98.4', pulse: '88', weight: '65 kg' },
      riskScore: 52,
      riskLevel: 'high',
    },
    {
      id: 'V009',
      date: '4 Aug 2026',
      facility: 'Sub-Centre Mandav',
      tier: 'sub-centre',
      worker: 'ANM Kavita Shinde',
      type: 'visit',
      title: 'BP follow-up',
      detail: 'BP still elevated at 158/100. Worsening trend noted (152→158). Amlodipine compliance questioned — patient admits missing doses. Advised strict compliance. Referral to PHC recommended but patient declined (travel distance).',
      vitals: { bp: '158/100', temp: '98.0', pulse: '86', weight: '65 kg' },
      riskScore: 35,
      riskLevel: 'medium',
    },
    {
      id: 'V008',
      date: '4 Aug 2026',
      facility: 'Sub-Centre Mandav',
      tier: 'sub-centre',
      worker: 'Lab — PHC Beed',
      type: 'lab',
      title: 'CBC — Complete Blood Count',
      detail: 'Hb: 10.4 g/dL (LOW), WBC: 7,200/µL (normal), Platelets: 2.3 lac/µL (normal), MCV: 72 fL (LOW — microcytic). Iron deficiency anaemia pattern confirmed.',
      vitals: { hb: '10.4' },
      riskScore: 12,
      riskLevel: 'low',
      reportFile: 'CBC_Meena_04Aug2026.pdf',
    },
    {
      id: 'V007',
      date: '25 Jul 2026',
      facility: 'PHC Beed',
      tier: 'phc',
      worker: 'System',
      type: 'referral',
      title: 'Missed scheduled PHC follow-up',
      detail: 'Patient did not attend PHC appointment scheduled for BP review. No-show logged. SMS reminder sent. ASHA notified for home follow-up.',
      riskScore: 0,
      riskLevel: 'low',
    },
    {
      id: 'V006',
      date: '10 Jul 2026',
      facility: 'Sub-Centre Mandav',
      tier: 'sub-centre',
      worker: 'ANM Kavita Shinde',
      type: 'visit',
      title: 'Acute viral fever',
      detail: 'Low-grade fever 100.1°F × 2 days. No other symptoms. Paracetamol 500mg TDS × 3 days dispensed. Advised rest and fluids. Follow-up if fever persists.',
      vitals: { bp: '150/96', temp: '100.1', pulse: '90', weight: '64 kg' },
      riskScore: 22,
      riskLevel: 'medium',
    },
    {
      id: 'V005',
      date: '14 Jun 2026',
      facility: 'Sub-Centre Mandav',
      tier: 'sub-centre',
      worker: 'ANM Kavita Shinde',
      type: 'visit',
      title: 'Routine BP check',
      detail: 'Routine check. BP 152/98. No acute complaints. Advised salt restriction, daily 30-min walk. Medication compliance discussed.',
      vitals: { bp: '152/98', temp: '98.2', pulse: '82', weight: '64 kg' },
      riskScore: 28,
      riskLevel: 'medium',
    },
    {
      id: 'V004',
      date: '14 Feb 2026',
      facility: 'District Hospital Beed',
      tier: 'district',
      worker: 'Dr. S. Kulkarni',
      type: 'ocr-upload',
      title: 'OCR — Old prescription (Amlodipine 5mg)',
      detail: 'Paper prescription photographed and OCR-extracted. Drug: Tab Amlodipine 5mg OD. Diagnosis: Essential Hypertension. Patient was on BP medication 6 months ago — current compliance uncertain.',
      reportFile: 'Prescription_DistrictHospital_Feb2026.jpg',
    },
    {
      id: 'V003',
      date: '14 Feb 2026',
      facility: 'District Hospital Beed',
      tier: 'district',
      worker: 'Dr. S. Kulkarni',
      type: 'visit',
      title: 'Specialist consultation — Hypertension',
      detail: 'BP: 162/106. Stage 2 Essential Hypertension diagnosed. Amlodipine 5mg OD initiated. Low-salt diet, weight reduction advised. Follow-up in 3 months.',
      vitals: { bp: '162/106', pulse: '88', weight: '63 kg' },
      riskScore: 38,
      riskLevel: 'high',
    },
    {
      id: 'V002',
      date: '20 Jan 2026',
      facility: 'Rural Hospital Beed',
      tier: 'rural-hospital',
      worker: 'Dr. M. Desai',
      type: 'imaging',
      title: 'Echocardiogram (2D ECHO)',
      detail: 'Mild left ventricular hypertrophy (LVH) consistent with long-standing hypertension. EF: 62% (normal). No valvular abnormality detected. Repeat ECHO in 1 year recommended.',
      reportFile: 'ECHO_Meena_Jan2026.pdf',
    },
    {
      id: 'V001',
      date: '15 Dec 2025',
      facility: 'PHC Beed',
      tier: 'phc',
      worker: 'Dr. Ramesh Patil',
      type: 'lab',
      title: 'Fasting lipid profile',
      detail: 'Total cholesterol: 214 mg/dL (borderline HIGH), LDL: 138 mg/dL (elevated), HDL: 42 mg/dL (LOW), Triglycerides: 168 mg/dL. Cardiovascular risk elevated. Dietary counselling given. Statin deferred.',
      riskScore: 15,
      riskLevel: 'medium',
      reportFile: 'LipidProfile_Meena_Dec2025.pdf',
    },
  ],
}

// ─── Derived analytics ───────────────────────────────────────────────────────

export function getBPTrend(patient: PatientRecord) {
  return patient.visits
    .filter(v => v.vitals?.bp)
    .map(v => {
      const parts = (v.vitals!.bp ?? '0/0').split('/').map(Number)
      return { date: v.date, bp: v.vitals!.bp ?? '', sys: parts[0], dia: parts[1] }
    })
}

export function getTrendFlag(patient: PatientRecord): {
  isTrending: boolean
  direction: 'rising' | 'falling' | 'stable'
  summary: string
} {
  const trend = getBPTrend(patient).filter(t => !isNaN(t.sys))
  if (trend.length < 2) return { isTrending: false, direction: 'stable', summary: 'Insufficient data for trend' }
  const first = trend[0].sys
  const last  = trend[trend.length - 1].sys
  const delta = last - first
  if (delta >= 10) return {
    isTrending: true, direction: 'rising',
    summary: `BP has risen over ${trend.length} visits (${trend.map(t => t.sys).join('→')} mmHg). Worsening hypertension.`,
  }
  if (delta <= -10) return {
    isTrending: true, direction: 'falling',
    summary: `BP improving over ${trend.length} visits (${trend.map(t => t.sys).join('→')} mmHg).`,
  }
  return { isTrending: false, direction: 'stable', summary: 'BP relatively stable.' }
}

export function getNoShowRisk(patient: PatientRecord): { level: 'low' | 'medium' | 'high'; explanation: string } {
  const missRate = patient.noShowCount / patient.totalFollowUps
  const far = patient.distanceKmFromPHC > 10
  if (missRate >= 0.4 || (missRate >= 0.25 && far)) return {
    level: 'high',
    explanation: `Missed ${patient.noShowCount} of ${patient.totalFollowUps} follow-ups. Lives ${patient.distanceKmFromPHC} km from PHC — high dropout risk. Recommend SMS reminder + ASHA escort.`,
  }
  if (missRate >= 0.2 || far) return {
    level: 'medium',
    explanation: `Missed ${patient.noShowCount} of ${patient.totalFollowUps} follow-ups. ${patient.distanceKmFromPHC} km from PHC. Recommend reminder call before next visit.`,
  }
  return { level: 'low', explanation: 'Good follow-up compliance.' }
}

export function getExplainableFlag(patient: PatientRecord): string {
  const bpVals = getBPTrend(patient).map(t => t.bp).join(' → ')
  return `${patient.name}'s blood pressure has risen over her last ${getBPTrend(patient).length} visits (${bpVals}). She missed ${patient.noShowCount} of her last ${patient.totalFollowUps} follow-ups and lives ${patient.distanceKmFromPHC} km from this facility — recommend a reminder call before her next visit.`
}

export const ocrExtractedMed = {
  raw: 'Tab. Amlodipine 5mg — Once daily (OD) — prescribed by Dr. S. Kulkarni, District Hospital, 14 Feb 2026',
  structured: {
    drug: 'Amlodipine', dose: '5 mg', frequency: 'Once daily',
    prescribedBy: 'Dr. S. Kulkarni', prescribedAt: 'District Hospital Beed', date: '14 Feb 2026',
  },
}

export const todayVisit: Omit<VisitRecord, 'id'> = {
  date: '23 Aug 2026', facility: 'Sub-Centre Mandav', tier: 'sub-centre',
  worker: 'ANM Kavita Shinde', type: 'visit',
  title: 'Headache + dizziness — triage',
  detail: 'Patient reports headache and dizziness for 2 days. BP: 168/104.',
  vitals: { bp: '168/104', temp: '98.4', pulse: '88' },
  riskScore: 52, riskLevel: 'high',
}
