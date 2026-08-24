/**
 * Chronic Disease Management Engine
 * Tracks progression, computes checkup schedules, and flags patients proactively
 */

export type ChronicCondition = 'hypertension' | 'diabetes' | 'tb' | 'copd' | 'ckd' | 'heart-disease' | 'anaemia'
export type ProgressionStatus = 'stable' | 'improving' | 'worsening' | 'critical'
export type CheckupStatus = 'upcoming' | 'due-today' | 'overdue' | 'completed'
export type AlertLevel = 'none' | 'reminder' | 'warning' | 'urgent'

export interface VitalReading {
  date: string
  value: string          // "168/104" or "8.2" etc.
  numeric: number        // primary numeric for trending (systolic BP, HbA1c, etc.)
  note?: string
  recordedBy: string
}

export interface ChronicCheckup {
  id: string
  scheduledDate: string
  daysFromNow: number    // negative = overdue
  type: string           // "BP check", "HbA1c test", "Sputum AFB", etc.
  status: CheckupStatus
  completedDate?: string
  result?: string
  note?: string
}

export interface ChronicAlert {
  id: string
  level: AlertLevel
  message: string
  action: string         // what the worker should do
  triggeredBy: string    // "Missed 2 checkups" or "HbA1c rising trend" etc.
  createdAt: string
  acknowledged: boolean
}

export interface ChronicPatient {
  id: string
  name: string
  age: number
  gender: 'M' | 'F'
  village: string
  phone: string
  worker: string         // assigned frontline worker
  condition: ChronicCondition
  conditionLabel: string
  since: string
  progressionStatus: ProgressionStatus
  alertLevel: AlertLevel
  readings: VitalReading[]
  checkups: ChronicCheckup[]
  alerts: ChronicAlert[]
  medications: string[]
  missedCheckups: number
  totalCheckups: number
  lastContactDate: string
  nextCheckupDate: string
  notes: string
}

// ─── Protocol: how often each condition needs checkup ──────────────────────
export const checkupIntervalDays: Record<ChronicCondition, number> = {
  hypertension:  30,    // monthly BP check
  diabetes:      45,    // every 6 weeks — HbA1c quarterly, BP monthly
  tb:            7,     // weekly DOTS observation
  copd:          30,
  ckd:           21,
  'heart-disease': 30,
  anaemia:       45,
}

export const conditionMetric: Record<ChronicCondition, string> = {
  hypertension:    'BP (mmHg)',
  diabetes:        'HbA1c (%)',
  tb:              'Compliance (%)',
  copd:            'FEV1 (%)',
  ckd:             'Creatinine (mg/dL)',
  'heart-disease': 'BP (mmHg)',
  anaemia:         'Hb (g/dL)',
}

// ─── Seeded chronic patient cohort ─────────────────────────────────────────
export const chronicPatients: ChronicPatient[] = [
  // 1 — Meena Patil — Hypertension (worsening)
  {
    id: 'CP001', name: 'Meena Patil', age: 52, gender: 'F',
    village: 'Mandav', phone: '9876543210', worker: 'ANM Kavita Shinde',
    condition: 'hypertension', conditionLabel: 'Hypertension',
    since: 'Jan 2022', progressionStatus: 'worsening', alertLevel: 'warning',
    readings: [
      { date: '14 Jun 2026', value: '152/98',  numeric: 152, recordedBy: 'ANM Kavita' },
      { date: '10 Jul 2026', value: '150/96',  numeric: 150, recordedBy: 'ANM Kavita' },
      { date: '4 Aug 2026',  value: '158/100', numeric: 158, recordedBy: 'ANM Kavita' },
      { date: '23 Aug 2026', value: '168/104', numeric: 168, recordedBy: 'ANM Kavita' },
    ],
    checkups: [
      { id: 'CK001', scheduledDate: '23 Jul 2026', daysFromNow: -31, type: 'BP check + medication review', status: 'overdue', note: 'Patient did not attend — lives 18 km from PHC' },
      { id: 'CK002', scheduledDate: '23 Aug 2026', daysFromNow: 0,   type: 'BP check + triage', status: 'due-today' },
      { id: 'CK003', scheduledDate: '23 Sep 2026', daysFromNow: 31,  type: 'BP check + medication review', status: 'upcoming' },
    ],
    alerts: [
      { id: 'AL001', level: 'warning', message: 'BP has risen from 152 to 168 mmHg over 4 readings — worsening trend', action: 'Contact Meena today and schedule PHC visit. Check Amlodipine compliance.', triggeredBy: 'Rising BP trend (152→158→168)', createdAt: '23 Aug 2026', acknowledged: false },
      { id: 'AL002', level: 'reminder', message: 'Missed 1 of 3 scheduled checkups (33% miss rate)', action: 'Call patient before next visit. Consider ASHA escort given 18 km distance.', triggeredBy: 'Missed checkup on 23 Jul 2026', createdAt: '24 Jul 2026', acknowledged: false },
    ],
    medications: ['Amlodipine 5mg OD'],
    missedCheckups: 1, totalCheckups: 3,
    lastContactDate: '4 Aug 2026', nextCheckupDate: '23 Aug 2026',
    notes: 'Patient compliance is uncertain. Lives far from PHC. Needs proactive outreach.',
  },

  // 2 — Ganesh Wagh — TB (non-compliant DOTS)
  {
    id: 'CP002', name: 'Ganesh Wagh', age: 48, gender: 'M',
    village: 'Mandav', phone: '9823456789', worker: 'ANM Kavita Shinde',
    condition: 'tb', conditionLabel: 'Tuberculosis (DOTS)',
    since: 'Jun 2026', progressionStatus: 'worsening', alertLevel: 'urgent',
    readings: [
      { date: '5 Jun 2026',  value: 'Week 1 — 100%',  numeric: 100, recordedBy: 'ASHA Rekha', note: 'Started DOTS' },
      { date: '12 Jun 2026', value: 'Week 2 — 100%',  numeric: 100, recordedBy: 'ASHA Rekha' },
      { date: '19 Jun 2026', value: 'Week 3 — 85%',   numeric: 85,  recordedBy: 'ASHA Rekha', note: 'Missed 1 dose' },
      { date: '2 Aug 2026',  value: 'Week 8 — 60%',   numeric: 60,  recordedBy: 'ASHA Rekha', note: 'Missed 3 doses this week — non-compliant' },
    ],
    checkups: [
      { id: 'CK004', scheduledDate: '16 Aug 2026', daysFromNow: -7,  type: 'DOTS observation + sputum AFB', status: 'overdue', note: 'Patient was not home during ASHA visit' },
      { id: 'CK005', scheduledDate: '23 Aug 2026', daysFromNow: 0,   type: 'DOTS observation', status: 'due-today' },
      { id: 'CK006', scheduledDate: '30 Aug 2026', daysFromNow: 7,   type: 'Weekly DOTS + weight check', status: 'upcoming' },
    ],
    alerts: [
      { id: 'AL003', level: 'urgent', message: 'DOTS compliance dropped to 60% — high risk of treatment failure and drug resistance', action: 'Urgent home visit required today. Contact Dr. Patil if unable to reach.', triggeredBy: 'Compliance drop below 70% threshold', createdAt: '2 Aug 2026', acknowledged: false },
    ],
    medications: ['Rifampicin 450mg', 'Isoniazid 300mg', 'Pyrazinamide 1500mg', 'Ethambutol 800mg'],
    missedCheckups: 1, totalCheckups: 8,
    lastContactDate: '9 Aug 2026', nextCheckupDate: '23 Aug 2026',
    notes: 'CRITICAL: Non-compliance risk. Drug-resistant TB risk if doses missed further.',
  },

  // 3 — Lata Desai — Diabetes (borderline controlled)
  {
    id: 'CP003', name: 'Lata Desai', age: 62, gender: 'F',
    village: 'Kirloskarwadi', phone: '9765432109', worker: 'ANM Priya More',
    condition: 'diabetes', conditionLabel: 'Type 2 Diabetes',
    since: 'Mar 2020', progressionStatus: 'stable', alertLevel: 'reminder',
    readings: [
      { date: '10 Feb 2026', value: '8.4%', numeric: 8.4, recordedBy: 'Dr. Patil', note: 'HbA1c' },
      { date: '10 May 2026', value: '7.9%', numeric: 7.9, recordedBy: 'Dr. Patil', note: 'HbA1c — improved' },
      { date: '23 Aug 2026', value: '8.1%', numeric: 8.1, recordedBy: 'ANM Priya',  note: 'HbA1c — slight rise' },
    ],
    checkups: [
      { id: 'CK007', scheduledDate: '10 Aug 2026', daysFromNow: -13, type: 'HbA1c + BP check + foot exam', status: 'overdue', note: 'Patient forgot appointment' },
      { id: 'CK008', scheduledDate: '23 Aug 2026', daysFromNow: 0,   type: 'HbA1c review', status: 'due-today' },
      { id: 'CK009', scheduledDate: '5 Oct 2026',  daysFromNow: 43,  type: 'Quarterly review + lipid profile', status: 'upcoming' },
    ],
    alerts: [
      { id: 'AL004', level: 'reminder', message: 'HbA1c slightly elevated at 8.1% — was improving, now rising again', action: 'Call Lata to remind her about dietary compliance and today\'s checkup.', triggeredBy: 'HbA1c rise 7.9% → 8.1%', createdAt: '23 Aug 2026', acknowledged: false },
    ],
    medications: ['Metformin 500mg BD', 'Glipizide 5mg OD'],
    missedCheckups: 1, totalCheckups: 6,
    lastContactDate: '23 Aug 2026', nextCheckupDate: '23 Aug 2026',
    notes: 'Generally compliant. Diet counselling needed. Foot exam overdue.',
  },

  // 4 — Suresh Kadam — CKD (stable)
  {
    id: 'CP004', name: 'Suresh Kadam', age: 55, gender: 'M',
    village: 'Tembhurni', phone: '9812345678', worker: 'ANM Priya More',
    condition: 'ckd', conditionLabel: 'Chronic Kidney Disease (Stage 2)',
    since: 'Aug 2024', progressionStatus: 'stable', alertLevel: 'reminder',
    readings: [
      { date: '1 Feb 2026',  value: '1.4 mg/dL', numeric: 1.4, recordedBy: 'Dr. Kale', note: 'Creatinine' },
      { date: '1 May 2026',  value: '1.5 mg/dL', numeric: 1.5, recordedBy: 'Dr. Kale', note: 'Creatinine — borderline rise' },
      { date: '1 Aug 2026',  value: '1.4 mg/dL', numeric: 1.4, recordedBy: 'Dr. Kale', note: 'Stable' },
    ],
    checkups: [
      { id: 'CK010', scheduledDate: '22 Aug 2026', daysFromNow: -1,  type: 'Creatinine + urine protein', status: 'overdue' },
      { id: 'CK011', scheduledDate: '12 Sep 2026', daysFromNow: 20,  type: 'Monthly kidney function', status: 'upcoming' },
    ],
    alerts: [
      { id: 'AL005', level: 'reminder', message: 'Monthly kidney function test due yesterday — not completed', action: 'Contact Suresh to reschedule creatinine test this week.', triggeredBy: 'Missed scheduled creatinine check', createdAt: '22 Aug 2026', acknowledged: false },
    ],
    medications: ['Amlodipine 5mg OD', 'Folic Acid 5mg OD'],
    missedCheckups: 1, totalCheckups: 5,
    lastContactDate: '1 Aug 2026', nextCheckupDate: '22 Aug 2026',
    notes: 'Avoid NSAIDs. Low-protein diet. BP control critical.',
  },

  // 5 — Radha Pawar — Stable hypertension
  {
    id: 'CP005', name: 'Radha Pawar', age: 45, gender: 'F',
    village: 'Mandav', phone: '9854321098', worker: 'ANM Kavita Shinde',
    condition: 'hypertension', conditionLabel: 'Hypertension',
    since: 'Oct 2023', progressionStatus: 'improving', alertLevel: 'none',
    readings: [
      { date: '1 May 2026',  value: '148/94', numeric: 148, recordedBy: 'ANM Kavita' },
      { date: '1 Jun 2026',  value: '142/90', numeric: 142, recordedBy: 'ANM Kavita' },
      { date: '1 Jul 2026',  value: '136/86', numeric: 136, recordedBy: 'ANM Kavita' },
      { date: '1 Aug 2026',  value: '132/84', numeric: 132, recordedBy: 'ANM Kavita' },
    ],
    checkups: [
      { id: 'CK012', scheduledDate: '1 Sep 2026', daysFromNow: 9, type: 'Monthly BP check', status: 'upcoming' },
    ],
    alerts: [],
    medications: ['Losartan 50mg OD'],
    missedCheckups: 0, totalCheckups: 4,
    lastContactDate: '1 Aug 2026', nextCheckupDate: '1 Sep 2026',
    notes: 'Good compliance. BP improving consistently. Continue current regimen.',
  },
]

// ─── Alert level config ─────────────────────────────────────────────────────
export const alertConfig: Record<AlertLevel, { label: string; color: string; bg: string; border: string }> = {
  none:     { label: 'Stable',   color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  reminder: { label: 'Reminder', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  warning:  { label: 'Warning',  color: 'text-coral-700',  bg: 'bg-coral-50',  border: 'border-coral-200' },
  urgent:   { label: 'Urgent',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-300'   },
}

export const progressionConfig: Record<ProgressionStatus, { label: string; color: string; arrow: string }> = {
  stable:    { label: 'Stable',    color: 'text-teal-600',  arrow: '→' },
  improving: { label: 'Improving', color: 'text-green-600', arrow: '↓' },
  worsening: { label: 'Worsening', color: 'text-red-600',   arrow: '↑' },
  critical:  { label: 'Critical',  color: 'text-red-700',   arrow: '↑↑' },
}
