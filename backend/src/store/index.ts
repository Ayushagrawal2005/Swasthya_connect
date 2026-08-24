/**
 * In-memory store — single source of truth for all runtime data.
 * Seeded with the same demo data the frontend static files used.
 * No database required; all mutations happen directly on these arrays/maps.
 */
import { v4 as uuid } from 'uuid'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = 'asha' | 'doctor' | 'admin' | 'patient'
export type RiskLevel = 'low' | 'medium' | 'high' | 'emergency'
export type FacilityTier = 'sub-centre' | 'phc' | 'rural-hospital' | 'district'

export interface User {
  id: string
  email: string
  passwordHash: string   // plain text for demo — never do this in prod
  role: Role
  name: string
  facilityId: string
  patientId?: string     // for patient-role users
}

export interface Doctor {
  id: string
  facilityId: string
  name: string
  specialty: string
  available: boolean
  slotsToday: number
}

export interface Facility {
  id: string
  name: string
  tier: FacilityTier
  distance: string
  phone: string
  address: string
}

export interface VitalReading {
  date: string
  value: string
  numeric: number
  note?: string
  recordedBy: string
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

export interface VisitRecord {
  id: string
  patientId: string
  date: string
  facility: string
  tier: FacilityTier
  worker: string
  type: 'visit' | 'lab' | 'prescription' | 'diagnosis' | 'referral' | 'ocr-upload' | 'imaging'
  title: string
  detail: string
  vitals?: Record<string, string>
  riskScore?: number
  riskLevel?: RiskLevel
  reportFile?: string
}

export interface Patient {
  id: string
  healthId: string
  name: string
  age: number
  gender: 'M' | 'F' | 'O'
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
  registeredBy?: string
  createdAt: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  facilityId: string
  doctorId: string
  bookedBy: string
  date: string
  time: string
  type: 'in-person' | 'teleconsult'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  queuePosition: number
  estimatedWait: number
  token: string
  createdAt: string
}

export interface Referral {
  id: string
  patientId: string
  patientName: string
  fromFacilityId: string
  toFacilityId: string
  toFacilityName: string
  reason: string
  urgency: 'routine' | 'urgent' | 'emergency'
  status: 'pending' | 'accepted' | 'redirected' | 'reached' | 'treated' | 'missed'
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface FollowUp {
  id: string
  patientId: string
  patientName: string
  age: number
  condition: string
  risk: RiskLevel
  dueDate: string
  status: 'overdue' | 'due-today' | 'upcoming' | 'done'
  phone: string
  notes: string
  lastVisit: string
  nextStep: string
  assignedTo: string   // workerId or doctorId
  completedAt?: string
}

export interface ChronicCheckup {
  id: string
  chronicPatientId: string
  scheduledDate: string
  daysFromNow: number
  type: string
  status: 'upcoming' | 'due-today' | 'overdue' | 'completed'
  completedDate?: string
  result?: string
  note?: string
}

export interface ChronicAlert {
  id: string
  chronicPatientId: string
  level: 'none' | 'reminder' | 'warning' | 'urgent'
  message: string
  action: string
  triggeredBy: string
  createdAt: string
  acknowledged: boolean
}

export interface ChronicPatient {
  id: string
  patientId: string
  name: string
  age: number
  gender: 'M' | 'F'
  village: string
  phone: string
  worker: string
  condition: string
  conditionLabel: string
  since: string
  progressionStatus: 'stable' | 'improving' | 'worsening' | 'critical'
  alertLevel: 'none' | 'reminder' | 'warning' | 'urgent'
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

export interface StockItem {
  id: string
  facilityId: string
  name: string
  category: string
  current: number
  threshold: number
  unit: string
  lastRestocked: string
  critical: boolean
}

export interface DiagOrder {
  id: string
  patientId: string
  patientName: string
  test: string
  orderedBy: string
  facilityId: string
  date: string
  status: 'ordered' | 'sample-done' | 'result-ready' | 'reviewed' | 'not-available'
  available: boolean
  nearestAvailable?: string
  result?: string
  flagged?: boolean
}

export interface Escalation {
  id: string
  patientId?: string
  patientName: string
  reason: string
  fromFacilityId: string
  toFacilityId: string
  toFacilityName: string
  triggeredBy: string
  sentTime: string
  status: 'sent' | 'acknowledged' | 'arrived' | 'treated'
  arrivedAt?: string
}

export interface TeleconsultSession {
  id: string
  patientId: string
  doctorId: string
  initiatedBy: string
  roomToken: string
  startedAt?: string
  endedAt?: string
  notes?: string
  prescription?: string
  status: 'waiting' | 'active' | 'ended'
}

export interface IvrCase {
  id: string
  caseId: string
  phone: string
  answers: string[]
  riskScore: number
  riskLevel: RiskLevel
  actionAdvice: string
  lang: string
  createdAt: string
}

export interface KioskEntry {
  id: string
  facilityId: string
  patientId?: string
  name: string
  type: 'walk-in' | 'referred' | 'follow-up'
  token: string
  time: string
  status: 'waiting' | 'called' | 'done'
  queuePosition: number
  estimatedWait: number
}

export interface TriageSession {
  id: string
  patientId?: string
  workerId?: string
  vitals?: Record<string, string>
  answers: string[]
  score: number
  level: RiskLevel
  triggeredFlags: string[]
  autoEscalate: boolean
  mlUsed: boolean
  confidence?: number
  hospitalLevel: number
  hospitalLevelLabel: string
  hospitalLevelDesc: string
  createdAt: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const db = {
  users: [] as User[],
  patients: [] as Patient[],
  visits: [] as VisitRecord[],
  facilities: [] as Facility[],
  doctors: [] as Doctor[],
  appointments: [] as Appointment[],
  referrals: [] as Referral[],
  followUps: [] as FollowUp[],
  chronicPatients: [] as ChronicPatient[],
  stock: [] as StockItem[],
  diagOrders: [] as DiagOrder[],
  escalations: [] as Escalation[],
  teleconsultSessions: [] as TeleconsultSession[],
  ivrCases: [] as IvrCase[],
  kioskEntries: [] as KioskEntry[],
  triageSessions: [] as TriageSession[],
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

export function seedStore() {

  // ── Facilities ──────────────────────────────────────────────────────────
  const F1 = uuid(), F2 = uuid(), F3 = uuid(), F4 = uuid()
  db.facilities.push(
    { id: F1, name: 'Sub-centre Mandav',          tier: 'sub-centre',   distance: '0 km',   phone: '02164-221001', address: 'Mandav Village, Solapur' },
    { id: F2, name: 'PHC Beed',                   tier: 'phc',          distance: '12 km',  phone: '02446-222100', address: 'Beed Naka, Beed District' },
    { id: F3, name: 'Rural Hospital Osmanabad',   tier: 'rural-hospital',distance: '28 km', phone: '02472-224500', address: 'Civil Lines, Osmanabad' },
    { id: F4, name: 'District Hospital Solapur',  tier: 'district',     distance: '55 km',  phone: '0217-274000',  address: 'Railway Lines, Solapur' },
  )

  // ── Doctors ─────────────────────────────────────────────────────────────
  const D1 = uuid(), D2 = uuid(), D3 = uuid(), D4 = uuid(), D5 = uuid()
  db.doctors.push(
    { id: D1, facilityId: F2, name: 'Dr. Ramesh Patil',    specialty: 'General Medicine',  available: true,  slotsToday: 8 },
    { id: D2, facilityId: F2, name: 'Dr. Sunita Kale',     specialty: 'Gynaecology',       available: true,  slotsToday: 5 },
    { id: D3, facilityId: F3, name: 'Dr. Anil Shinde',     specialty: 'General Surgery',   available: false, slotsToday: 0 },
    { id: D4, facilityId: F4, name: 'Dr. Priya Deshmukh',  specialty: 'Cardiology',        available: true,  slotsToday: 3 },
    { id: D5, facilityId: F4, name: 'Dr. Vikas Jadhav',    specialty: 'Paediatrics',       available: true,  slotsToday: 6 },
  )

  // ── Users ────────────────────────────────────────────────────────────────
  const U_ASHA   = uuid()
  const U_DOC    = D1
  const U_ADMIN  = uuid()
  const U_PAT1   = uuid()
  const U_PAT2   = uuid()

  db.users.push(
    { id: U_ASHA,  email: 'asha@swasthya.in',    passwordHash: 'demo1234', role: 'asha',    name: 'ANM Kavita Shinde',  facilityId: F1 },
    { id: U_DOC,   email: 'doctor@swasthya.in',  passwordHash: 'demo1234', role: 'doctor',  name: 'Dr. Ramesh Patil',   facilityId: F2 },
    { id: U_ADMIN, email: 'admin@swasthya.in',   passwordHash: 'demo1234', role: 'admin',   name: 'Admin Ravi Bhosale', facilityId: F4 },
    { id: U_PAT1,  email: 'meena@swasthya.in',   passwordHash: 'demo1234', role: 'patient', name: 'Meena Patil',        facilityId: F2, patientId: 'P-MEENA-001' },
    { id: U_PAT2,  email: 'priya@swasthya.in',   passwordHash: 'demo1234', role: 'patient', name: 'Priya Sharma',       facilityId: F2, patientId: 'P-PRIYA-002' },
  )

  // ── Patients ─────────────────────────────────────────────────────────────
  const P1 = 'P-MEENA-001'
  const P2 = 'P-PRIYA-002'
  const P3 = uuid()
  const P4 = uuid()
  const P5 = uuid()

  db.patients.push(
    {
      id: P1, healthId: '91-7842-3301-6629', name: 'Meena Patil',
      age: 32, gender: 'F', dob: '1994-03-15', village: 'Mandav', phone: '9876543210',
      language: 'Marathi', bloodGroup: 'B+', allergies: ['Penicillin'],
      conditions: ['Gestational Hypertension', 'Anaemia'],
      diseaseHistory: [
        { name: 'Gestational Hypertension', since: 'Jan 2026', status: 'active', icd10: 'O13', notes: 'On Methyldopa 250mg BD' },
        { name: 'Anaemia (mild)', since: 'Dec 2025', status: 'active', icd10: 'D50', notes: 'IFA supplementation ongoing' },
        { name: 'Typhoid', since: 'Aug 2022', status: 'resolved', notes: 'Full recovery after 14-day course' },
      ],
      medications: [
        { drug: 'Methyldopa', dose: '250mg', frequency: 'BD', since: 'Jan 2026', prescribedBy: 'Dr. Ramesh Patil', status: 'current', source: 'prescription' },
        { drug: 'IFA (Iron-Folic Acid)', dose: '1 tablet', frequency: 'OD', since: 'Dec 2025', prescribedBy: 'ANM Kavita', status: 'current', source: 'prescription' },
        { drug: 'Calcium 500mg', dose: '500mg', frequency: 'BD', since: 'Jan 2026', prescribedBy: 'Dr. Ramesh Patil', status: 'current', source: 'ocr' },
      ],
      noShowCount: 1, totalFollowUps: 6, distanceKmFromPHC: 18,
      registeredBy: U_ASHA, createdAt: '2024-01-10T08:00:00Z',
    },
    {
      id: P2, healthId: '91-6321-4402-7731', name: 'Priya Sharma',
      age: 28, gender: 'F', dob: '1998-07-22', village: 'Kirloskarwadi', phone: '9765432109',
      language: 'Hindi', bloodGroup: 'O+', allergies: [],
      conditions: ['Anaemia (mild)'],
      diseaseHistory: [
        { name: 'Anaemia (mild)', since: 'Mar 2025', status: 'active', notes: 'Hb 9.8 g/dL — on IFA' },
      ],
      medications: [
        { drug: 'IFA (Iron-Folic Acid)', dose: '1 tablet', frequency: 'OD', since: 'Mar 2025', prescribedBy: 'Dr. Sunita Kale', status: 'current', source: 'prescription' },
      ],
      noShowCount: 0, totalFollowUps: 2, distanceKmFromPHC: 6,
      registeredBy: U_ASHA, createdAt: '2025-03-01T09:00:00Z',
    },
    {
      id: P3, healthId: '91-3341-2210-9021', name: 'Ganesh Wagh',
      age: 48, gender: 'M', dob: '1978-11-03', village: 'Mandav', phone: '9823456789',
      language: 'Marathi', bloodGroup: 'A+', allergies: [],
      conditions: ['Tuberculosis (DOTS)'],
      diseaseHistory: [
        { name: 'Tuberculosis', since: 'Jun 2026', status: 'active', icd10: 'A15', notes: 'DOTS week 12, compliance dropping' },
      ],
      medications: [
        { drug: 'Rifampicin', dose: '450mg', frequency: 'OD', since: 'Jun 2026', prescribedBy: 'Dr. Ramesh Patil', status: 'current', source: 'prescription' },
        { drug: 'Isoniazid', dose: '300mg', frequency: 'OD', since: 'Jun 2026', prescribedBy: 'Dr. Ramesh Patil', status: 'current', source: 'prescription' },
      ],
      noShowCount: 2, totalFollowUps: 12, distanceKmFromPHC: 18,
      registeredBy: U_ASHA, createdAt: '2026-06-05T07:00:00Z',
    },
    {
      id: P4, healthId: '91-9921-0033-4410', name: 'Lata Desai',
      age: 62, gender: 'F', dob: '1964-04-18', village: 'Kirloskarwadi', phone: '9765432100',
      language: 'Marathi', bloodGroup: 'AB+', allergies: ['Sulfa'],
      conditions: ['Type 2 Diabetes'],
      diseaseHistory: [
        { name: 'Type 2 Diabetes', since: 'Mar 2020', status: 'chronic', icd10: 'E11', notes: 'HbA1c 8.1% — needs dietary review' },
      ],
      medications: [
        { drug: 'Metformin', dose: '500mg', frequency: 'BD', since: 'Mar 2020', prescribedBy: 'Dr. Ramesh Patil', status: 'current', source: 'prescription' },
        { drug: 'Glipizide', dose: '5mg', frequency: 'OD', since: 'Mar 2020', prescribedBy: 'Dr. Ramesh Patil', status: 'current', source: 'prescription' },
      ],
      noShowCount: 1, totalFollowUps: 6, distanceKmFromPHC: 6,
      registeredBy: U_ASHA, createdAt: '2020-03-15T10:00:00Z',
    },
    {
      id: P5, healthId: '91-2200-8812-3309', name: 'Suresh Kadam',
      age: 55, gender: 'M', dob: '1971-09-29', village: 'Tembhurni', phone: '9812345678',
      language: 'Marathi', bloodGroup: 'B-', allergies: [],
      conditions: ['Chronic Kidney Disease (Stage 2)', 'Hypertension'],
      diseaseHistory: [
        { name: 'Chronic Kidney Disease', since: 'Aug 2024', status: 'chronic', icd10: 'N18.2', notes: 'Creatinine stable 1.4 mg/dL' },
        { name: 'Hypertension', since: 'Jun 2022', status: 'chronic', icd10: 'I10', notes: 'On Amlodipine 5mg' },
      ],
      medications: [
        { drug: 'Amlodipine', dose: '5mg', frequency: 'OD', since: 'Jun 2022', prescribedBy: 'Dr. Kale', status: 'current', source: 'prescription' },
        { drug: 'Folic Acid', dose: '5mg', frequency: 'OD', since: 'Aug 2024', prescribedBy: 'Dr. Kale', status: 'current', source: 'prescription' },
      ],
      noShowCount: 1, totalFollowUps: 5, distanceKmFromPHC: 22,
      registeredBy: U_ASHA, createdAt: '2024-08-01T09:00:00Z',
    },
  )

  // ── Visits ───────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]
  db.visits.push(
    { id: uuid(), patientId: P1, date: '2026-08-23', facility: 'Sub-centre Mandav', tier: 'sub-centre', worker: 'ANM Kavita Shinde', type: 'visit', title: 'Routine ANC check', detail: 'BP 168/104 mmHg. Referred to PHC for review.', vitals: { bp: '168/104', temp: '98.6', pulse: '88', spo2: '97' }, riskScore: 72, riskLevel: 'high' },
    { id: uuid(), patientId: P1, date: '2026-08-04', facility: 'Sub-centre Mandav', tier: 'sub-centre', worker: 'ANM Kavita Shinde', type: 'visit', title: 'Follow-up BP check', detail: 'BP 158/100. Methyldopa compliance confirmed.', vitals: { bp: '158/100', temp: '98.4', pulse: '84' }, riskScore: 65, riskLevel: 'high' },
    { id: uuid(), patientId: P1, date: '2026-07-10', facility: 'PHC Beed', tier: 'phc', worker: 'Dr. Ramesh Patil', type: 'lab', title: 'HB & CBC', detail: 'Hb 9.2 g/dL. IFA dose increased.' },
    { id: uuid(), patientId: P1, date: '2026-06-20', facility: 'PHC Beed', tier: 'phc', worker: 'Dr. Ramesh Patil', type: 'prescription', title: 'Prescription renewed', detail: 'Methyldopa 250mg BD continued. Calcium 500mg added.' },
    { id: uuid(), patientId: P2, date: '2026-08-10', facility: 'PHC Beed', tier: 'phc', worker: 'Dr. Sunita Kale', type: 'visit', title: 'ANC visit', detail: 'Hb 9.8 g/dL. BP normal. IFA compliance good.', vitals: { bp: '118/76', temp: '98.4', pulse: '78', hb: '9.8' }, riskScore: 28, riskLevel: 'low' },
    { id: uuid(), patientId: P3, date: '2026-08-16', facility: 'Sub-centre Mandav', tier: 'sub-centre', worker: 'ANM Kavita Shinde', type: 'visit', title: 'DOTS observation', detail: 'Week 11 observation. Missed 3 doses this week.', riskScore: 80, riskLevel: 'emergency' },
    { id: uuid(), patientId: P4, date: '2026-08-23', facility: 'PHC Beed', tier: 'phc', worker: 'Dr. Ramesh Patil', type: 'lab', title: 'HbA1c review', detail: 'HbA1c 8.1% — slight rise. Dietary counselling advised.', vitals: { rbs: '210' } },
    { id: uuid(), patientId: P5, date: '2026-08-01', facility: 'Rural Hospital Osmanabad', tier: 'rural-hospital', worker: 'Dr. Kale', type: 'lab', title: 'Creatinine + urine protein', detail: 'Creatinine 1.4 mg/dL — stable. BP 132/82.', vitals: { bp: '132/82' } },
  )

  // ── Appointments ─────────────────────────────────────────────────────────
  db.appointments.push(
    {
      id: uuid(), patientId: P1, patientName: 'Meena Patil',
      facilityId: F2, doctorId: D1, bookedBy: U_ASHA,
      date: today, time: '10:30 AM', type: 'in-person',
      status: 'scheduled', queuePosition: 3, estimatedWait: 25,
      token: 'T-003', createdAt: new Date().toISOString(),
    },
    {
      id: uuid(), patientId: P2, patientName: 'Priya Sharma',
      facilityId: F2, doctorId: D2, bookedBy: U_PAT2,
      date: today, time: '11:00 AM', type: 'teleconsult',
      status: 'scheduled', queuePosition: 1, estimatedWait: 5,
      token: 'T-001', createdAt: new Date().toISOString(),
    },
  )

  // ── Referrals ────────────────────────────────────────────────────────────
  const R1 = uuid()
  db.referrals.push(
    {
      id: R1, patientId: P1, patientName: 'Meena Patil',
      fromFacilityId: F1, toFacilityId: F2, toFacilityName: 'PHC Beed',
      reason: 'Elevated BP (168/104) in third trimester', urgency: 'urgent',
      status: 'accepted', createdBy: U_ASHA,
      createdAt: '2026-08-23T11:00:00Z', updatedAt: '2026-08-23T11:30:00Z',
    },
    {
      id: uuid(), patientId: P3, patientName: 'Ganesh Wagh',
      fromFacilityId: F1, toFacilityId: F2, toFacilityName: 'PHC Beed',
      reason: 'TB DOTS non-compliance — needs physician review', urgency: 'urgent',
      status: 'pending', createdBy: U_ASHA,
      createdAt: '2026-08-16T09:00:00Z', updatedAt: '2026-08-16T09:00:00Z',
    },
    {
      id: uuid(), patientId: P4, patientName: 'Lata Desai',
      fromFacilityId: F2, toFacilityId: F3, toFacilityName: 'Rural Hospital Osmanabad',
      reason: 'Diabetic foot exam + lipid profile', urgency: 'routine',
      status: 'pending', createdBy: U_DOC,
      createdAt: '2026-08-20T10:00:00Z', updatedAt: '2026-08-20T10:00:00Z',
    },
  )

  // ── Follow-ups ───────────────────────────────────────────────────────────
  db.followUps.push(
    { id: uuid(), patientId: P1, patientName: 'Meena Patil', age: 32, condition: 'Gestational Hypertension', risk: 'high', dueDate: today, status: 'due-today', phone: '9876543210', notes: 'BP worsening trend — escort to PHC if possible', lastVisit: '23 Aug 2026', nextStep: 'PHC visit today', assignedTo: U_ASHA },
    { id: uuid(), patientId: P3, patientName: 'Ganesh Wagh', age: 48, condition: 'TB (DOTS)', risk: 'emergency', dueDate: today, status: 'overdue', phone: '9823456789', notes: 'CRITICAL: 60% compliance — drug resistance risk', lastVisit: '16 Aug 2026', nextStep: 'Home visit — DOTS observation', assignedTo: U_ASHA },
    { id: uuid(), patientId: P4, patientName: 'Lata Desai', age: 62, condition: 'Type 2 Diabetes', risk: 'medium', dueDate: '2026-08-25', status: 'upcoming', phone: '9765432100', notes: 'HbA1c slight rise — dietary review', lastVisit: '23 Aug 2026', nextStep: 'Phone follow-up', assignedTo: U_ASHA },
    { id: uuid(), patientId: P5, patientName: 'Suresh Kadam', age: 55, condition: 'CKD Stage 2', risk: 'medium', dueDate: '2026-08-22', status: 'overdue', phone: '9812345678', notes: 'Missed creatinine test', lastVisit: '01 Aug 2026', nextStep: 'Reschedule lab', assignedTo: U_ASHA },
    { id: uuid(), patientId: P2, patientName: 'Priya Sharma', age: 28, condition: 'Anaemia', risk: 'low', dueDate: '2026-09-01', status: 'upcoming', phone: '9765432109', notes: 'IFA compliance good. Routine check', lastVisit: '10 Aug 2026', nextStep: 'Monthly check', assignedTo: U_DOC },
  )

  // ── Chronic patients ─────────────────────────────────────────────────────
  const CP1 = uuid(), CP2 = uuid(), CP3 = uuid(), CP4 = uuid(), CP5 = uuid()
  db.chronicPatients.push(
    {
      id: CP1, patientId: P1, name: 'Meena Patil', age: 32, gender: 'F', village: 'Mandav', phone: '9876543210', worker: 'ANM Kavita Shinde',
      condition: 'hypertension', conditionLabel: 'Hypertension', since: 'Jan 2026',
      progressionStatus: 'worsening', alertLevel: 'warning',
      readings: [
        { date: '14 Jun 2026', value: '152/98',  numeric: 152, recordedBy: 'ANM Kavita' },
        { date: '10 Jul 2026', value: '150/96',  numeric: 150, recordedBy: 'ANM Kavita' },
        { date: '4 Aug 2026',  value: '158/100', numeric: 158, recordedBy: 'ANM Kavita' },
        { date: '23 Aug 2026', value: '168/104', numeric: 168, recordedBy: 'ANM Kavita' },
      ],
      checkups: [
        { id: uuid(), chronicPatientId: CP1, scheduledDate: '23 Jul 2026', daysFromNow: -31, type: 'BP check + medication review', status: 'overdue', note: 'Patient did not attend' },
        { id: uuid(), chronicPatientId: CP1, scheduledDate: '23 Aug 2026', daysFromNow: 0,   type: 'BP check + triage', status: 'due-today' },
        { id: uuid(), chronicPatientId: CP1, scheduledDate: '23 Sep 2026', daysFromNow: 31,  type: 'BP check + medication review', status: 'upcoming' },
      ],
      alerts: [
        { id: uuid(), chronicPatientId: CP1, level: 'warning', message: 'BP has risen from 152 to 168 mmHg over 4 readings — worsening trend', action: 'Contact Meena today and schedule PHC visit. Check Amlodipine compliance.', triggeredBy: 'Rising BP trend (152→158→168)', createdAt: '23 Aug 2026', acknowledged: false },
      ],
      medications: ['Amlodipine 5mg OD', 'Methyldopa 250mg BD'],
      missedCheckups: 1, totalCheckups: 3, lastContactDate: '4 Aug 2026', nextCheckupDate: '23 Aug 2026',
      notes: 'Patient compliance uncertain. Lives far from PHC. Needs proactive outreach.',
    },
    {
      id: CP2, patientId: P3, name: 'Ganesh Wagh', age: 48, gender: 'M', village: 'Mandav', phone: '9823456789', worker: 'ANM Kavita Shinde',
      condition: 'tb', conditionLabel: 'Tuberculosis (DOTS)', since: 'Jun 2026',
      progressionStatus: 'worsening', alertLevel: 'urgent',
      readings: [
        { date: '5 Jun 2026',  value: 'Week 1 — 100%',  numeric: 100, recordedBy: 'ASHA Rekha', note: 'Started DOTS' },
        { date: '12 Jun 2026', value: 'Week 2 — 100%',  numeric: 100, recordedBy: 'ASHA Rekha' },
        { date: '19 Jun 2026', value: 'Week 3 — 85%',   numeric: 85,  recordedBy: 'ASHA Rekha' },
        { date: '2 Aug 2026',  value: 'Week 8 — 60%',   numeric: 60,  recordedBy: 'ASHA Rekha', note: 'Non-compliant' },
      ],
      checkups: [
        { id: uuid(), chronicPatientId: CP2, scheduledDate: '16 Aug 2026', daysFromNow: -7,  type: 'DOTS observation + sputum AFB', status: 'overdue' },
        { id: uuid(), chronicPatientId: CP2, scheduledDate: '23 Aug 2026', daysFromNow: 0,   type: 'DOTS observation', status: 'due-today' },
        { id: uuid(), chronicPatientId: CP2, scheduledDate: '30 Aug 2026', daysFromNow: 7,   type: 'Weekly DOTS + weight check', status: 'upcoming' },
      ],
      alerts: [
        { id: uuid(), chronicPatientId: CP2, level: 'urgent', message: 'DOTS compliance dropped to 60% — high risk of treatment failure', action: 'Urgent home visit today. Contact Dr. Patil if unable to reach.', triggeredBy: 'Compliance drop below 70%', createdAt: '2 Aug 2026', acknowledged: false },
      ],
      medications: ['Rifampicin 450mg', 'Isoniazid 300mg', 'Pyrazinamide 1500mg', 'Ethambutol 800mg'],
      missedCheckups: 1, totalCheckups: 8, lastContactDate: '9 Aug 2026', nextCheckupDate: '23 Aug 2026',
      notes: 'CRITICAL: Non-compliance risk. Drug-resistant TB risk if doses missed further.',
    },
    {
      id: CP3, patientId: P4, name: 'Lata Desai', age: 62, gender: 'F', village: 'Kirloskarwadi', phone: '9765432100', worker: 'ANM Priya More',
      condition: 'diabetes', conditionLabel: 'Type 2 Diabetes', since: 'Mar 2020',
      progressionStatus: 'stable', alertLevel: 'reminder',
      readings: [
        { date: '10 Feb 2026', value: '8.4%', numeric: 8.4, recordedBy: 'Dr. Patil', note: 'HbA1c' },
        { date: '10 May 2026', value: '7.9%', numeric: 7.9, recordedBy: 'Dr. Patil', note: 'HbA1c — improved' },
        { date: '23 Aug 2026', value: '8.1%', numeric: 8.1, recordedBy: 'ANM Priya',  note: 'HbA1c — slight rise' },
      ],
      checkups: [
        { id: uuid(), chronicPatientId: CP3, scheduledDate: '10 Aug 2026', daysFromNow: -13, type: 'HbA1c + BP check + foot exam', status: 'overdue' },
        { id: uuid(), chronicPatientId: CP3, scheduledDate: '23 Aug 2026', daysFromNow: 0,   type: 'HbA1c review', status: 'due-today' },
        { id: uuid(), chronicPatientId: CP3, scheduledDate: '5 Oct 2026',  daysFromNow: 43,  type: 'Quarterly review + lipid profile', status: 'upcoming' },
      ],
      alerts: [
        { id: uuid(), chronicPatientId: CP3, level: 'reminder', message: 'HbA1c slightly elevated at 8.1% — was improving, now rising again', action: 'Call Lata to remind her about dietary compliance and today\'s checkup.', triggeredBy: 'HbA1c rise 7.9% → 8.1%', createdAt: '23 Aug 2026', acknowledged: false },
      ],
      medications: ['Metformin 500mg BD', 'Glipizide 5mg OD'],
      missedCheckups: 1, totalCheckups: 6, lastContactDate: '23 Aug 2026', nextCheckupDate: '23 Aug 2026',
      notes: 'Generally compliant. Diet counselling needed.',
    },
    {
      id: CP4, patientId: P5, name: 'Suresh Kadam', age: 55, gender: 'M', village: 'Tembhurni', phone: '9812345678', worker: 'ANM Priya More',
      condition: 'ckd', conditionLabel: 'Chronic Kidney Disease (Stage 2)', since: 'Aug 2024',
      progressionStatus: 'stable', alertLevel: 'reminder',
      readings: [
        { date: '1 Feb 2026',  value: '1.4 mg/dL', numeric: 1.4, recordedBy: 'Dr. Kale' },
        { date: '1 May 2026',  value: '1.5 mg/dL', numeric: 1.5, recordedBy: 'Dr. Kale' },
        { date: '1 Aug 2026',  value: '1.4 mg/dL', numeric: 1.4, recordedBy: 'Dr. Kale', note: 'Stable' },
      ],
      checkups: [
        { id: uuid(), chronicPatientId: CP4, scheduledDate: '22 Aug 2026', daysFromNow: -1,  type: 'Creatinine + urine protein', status: 'overdue' },
        { id: uuid(), chronicPatientId: CP4, scheduledDate: '12 Sep 2026', daysFromNow: 20,  type: 'Monthly kidney function', status: 'upcoming' },
      ],
      alerts: [
        { id: uuid(), chronicPatientId: CP4, level: 'reminder', message: 'Monthly kidney function test due yesterday — not completed', action: 'Contact Suresh to reschedule creatinine test this week.', triggeredBy: 'Missed scheduled creatinine check', createdAt: '22 Aug 2026', acknowledged: false },
      ],
      medications: ['Amlodipine 5mg OD', 'Folic Acid 5mg OD'],
      missedCheckups: 1, totalCheckups: 5, lastContactDate: '1 Aug 2026', nextCheckupDate: '22 Aug 2026',
      notes: 'Avoid NSAIDs. Low-protein diet. BP control critical.',
    },
    {
      id: CP5, patientId: P2, name: 'Priya Sharma', age: 28, gender: 'F', village: 'Kirloskarwadi', phone: '9765432109', worker: 'ANM Kavita Shinde',
      condition: 'anaemia', conditionLabel: 'Anaemia', since: 'Mar 2025',
      progressionStatus: 'improving', alertLevel: 'none',
      readings: [
        { date: '1 Apr 2026', value: '9.2 g/dL', numeric: 9.2, recordedBy: 'ANM Kavita' },
        { date: '1 Jun 2026', value: '9.8 g/dL', numeric: 9.8, recordedBy: 'ANM Kavita' },
        { date: '10 Aug 2026', value: '10.4 g/dL', numeric: 10.4, recordedBy: 'Dr. Kale', note: 'Improving on IFA' },
      ],
      checkups: [
        { id: uuid(), chronicPatientId: CP5, scheduledDate: '1 Sep 2026', daysFromNow: 9, type: 'Monthly Hb check', status: 'upcoming' },
      ],
      alerts: [],
      medications: ['IFA tablet OD'],
      missedCheckups: 0, totalCheckups: 3, lastContactDate: '10 Aug 2026', nextCheckupDate: '1 Sep 2026',
      notes: 'Good compliance. Hb improving. Continue IFA.',
    },
  )

  // ── Stock ────────────────────────────────────────────────────────────────
  db.stock.push(
    { id: uuid(), facilityId: F2, name: 'Paracetamol 500mg', category: 'Analgesic/Antipyretic', current: 340, threshold: 500, unit: 'tablets', lastRestocked: '1 Aug 2026', critical: false },
    { id: uuid(), facilityId: F2, name: 'ORS Sachets', category: 'Rehydration', current: 45, threshold: 200, unit: 'sachets', lastRestocked: '15 Jul 2026', critical: true },
    { id: uuid(), facilityId: F2, name: 'IFA Tablets', category: 'Micronutrients', current: 120, threshold: 300, unit: 'tablets', lastRestocked: '10 Aug 2026', critical: false },
    { id: uuid(), facilityId: F2, name: 'Amoxicillin 250mg', category: 'Antibiotic', current: 18, threshold: 100, unit: 'capsules', lastRestocked: '25 Jul 2026', critical: true },
    { id: uuid(), facilityId: F2, name: 'Metformin 500mg', category: 'Antidiabetic', current: 200, threshold: 150, unit: 'tablets', lastRestocked: '5 Aug 2026', critical: false },
    { id: uuid(), facilityId: F2, name: 'Methyldopa 250mg', category: 'Antihypertensive', current: 60, threshold: 100, unit: 'tablets', lastRestocked: '1 Aug 2026', critical: false },
    { id: uuid(), facilityId: F2, name: 'Rifampicin 450mg', category: 'Antitubercular', current: 8, threshold: 60, unit: 'capsules', lastRestocked: '20 Jul 2026', critical: true },
    { id: uuid(), facilityId: F2, name: 'Zinc Sulphate 20mg', category: 'Micronutrients', current: 250, threshold: 200, unit: 'tablets', lastRestocked: '5 Aug 2026', critical: false },
  )

  // ── Diagnostics ──────────────────────────────────────────────────────────
  db.diagOrders.push(
    { id: uuid(), patientId: P1, patientName: 'Meena Patil',    test: 'Complete Blood Count',         orderedBy: 'Dr. Ramesh Patil', facilityId: F2, date: '22 Aug 2026', status: 'result-ready', available: true, result: 'Hb 9.2 g/dL, WBC 8200, Platelets 210K', flagged: true },
    { id: uuid(), patientId: P3, patientName: 'Ganesh Wagh',    test: 'Sputum AFB Smear',             orderedBy: 'Dr. Ramesh Patil', facilityId: F2, date: '15 Aug 2026', status: 'sample-done', available: true },
    { id: uuid(), patientId: P4, patientName: 'Lata Desai',     test: 'HbA1c',                        orderedBy: 'Dr. Ramesh Patil', facilityId: F2, date: '23 Aug 2026', status: 'result-ready', available: true, result: 'HbA1c 8.1%', flagged: false },
    { id: uuid(), patientId: P5, patientName: 'Suresh Kadam',   test: 'Serum Creatinine',             orderedBy: 'Dr. Kale',         facilityId: F3, date: '1 Aug 2026',  status: 'result-ready', available: true, result: '1.4 mg/dL' },
    { id: uuid(), patientId: P2, patientName: 'Priya Sharma',   test: 'Urine Routine',                orderedBy: 'Dr. Sunita Kale',  facilityId: F2, date: '20 Aug 2026', status: 'ordered',      available: false, nearestAvailable: 'Rural Hospital Osmanabad' },
    { id: uuid(), patientId: P1, patientName: 'Meena Patil',    test: 'Foetal Ultrasound (28 weeks)', orderedBy: 'Dr. Ramesh Patil', facilityId: F4, date: '23 Aug 2026', status: 'ordered',      available: true },
  )

  // ── Kiosk entries ────────────────────────────────────────────────────────
  db.kioskEntries.push(
    { id: uuid(), facilityId: F2, patientId: P1, name: 'Meena Patil',  type: 'follow-up', token: 'T-001', time: '09:15 AM', status: 'called',   queuePosition: 1, estimatedWait: 0 },
    { id: uuid(), facilityId: F2, patientId: P3, name: 'Ganesh Wagh',  type: 'referred',  token: 'T-002', time: '09:32 AM', status: 'waiting',  queuePosition: 2, estimatedWait: 10 },
    { id: uuid(), facilityId: F2,                name: 'Walk-in Patient', type: 'walk-in', token: 'T-003', time: '09:45 AM', status: 'waiting',  queuePosition: 3, estimatedWait: 20 },
    { id: uuid(), facilityId: F2, patientId: P4, name: 'Lata Desai',   type: 'follow-up', token: 'T-004', time: '10:00 AM', status: 'waiting',  queuePosition: 4, estimatedWait: 30 },
  )

  console.log('✅ In-memory store seeded successfully')
}
