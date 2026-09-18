/**
 * Teleconsultation Types
 * Data models for eSanjeevani-style structured triage and teleconsultation
 */

export interface AllergyEntry {
  id: string
  name: string
  duration?: string
  severity?: 'mild' | 'moderate' | 'severe'
  stillExists: boolean
  notes?: string
  addedAt: string
}

export interface MedicationEntry {
  id: string
  medicineName: string
  frequency: string
  dose: string
  type: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'other'
  durationValue: number
  durationType: 'days' | 'weeks' | 'months' | 'ongoing'
  notes?: string
  addedAt: string
}

export interface PatientHistory {
  medical: string[]
  medicalNotes?: string
  personal: string[]
  personalNotes?: string
  family: string[]
  familyNotes?: string
}

export interface TriageQuestionResponse {
  questionId: string
  answer: string | string[] | number | boolean
  answeredAt: string
}

export interface TriageSession {
  id: string
  patientId: string
  visitId?: string
  initiatedBy: string // userId of patient or ASHA
  sourcePortal: 'patient' | 'asha'
  
  // Chief complaint
  chiefComplaint: string
  selectedConditions: string[]
  symptomsDescription?: string
  
  // Dynamic questions
  questions: TriageQuestionResponse[]
  
  // Vitals
  vitals?: {
    temperature?: number
    bloodPressure?: string
    heartRate?: number
    spO2?: number
    bloodSugar?: number
    weight?: number
    height?: number
  }
  
  // History
  history: PatientHistory
  allergies: AllergyEntry[]
  medications: MedicationEntry[]
  
  // Documents
  documentIds: string[]
  
  // Summary
  summaryId?: string
  summaryText?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'emergency'
  riskScore?: number
  confidence?: number
  triggeredFlags: string[]
  
  // Care orchestration
  hospitalLevel: number
  hospitalLevelLabel: string
  hospitalLevelDesc: string
  recommendedFacilityId?: string
  recommendedFacilityName?: string
  recommendedAction?: string
  
  // Status
  status: 'draft' | 'in-progress' | 'completed' | 'submitted'
  currentStep: number
  totalSteps: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

export interface TriageSummary {
  id: string
  triageSessionId: string
  patientId: string
  
  // Core information
  chiefComplaint: string
  suspectedConditions: string[]
  symptoms: string[]
  duration?: string
  severity?: string
  
  // Red flags
  redFlags: string[]
  
  // History summary
  medicalHistory: string[]
  personalHistory: string[]
  familyHistory: string[]
  
  // Current state
  allergies: AllergyEntry[]
  medications: MedicationEntry[]
  
  // Documents
  uploadedDocumentIds: string[]
  documentSummary?: string
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'emergency'
  riskScore: number
  confidence?: number
  
  // AI-generated summary
  summaryText: string
  aiAssisted: boolean
  reviewedBy?: string
  reviewedAt?: string
  
  // Recommendations
  recommendedAction: string
  recommendedFacilityId?: string
  recommendedFacilityName?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface TeleconsultQueue {
  id: string
  triageSessionId: string
  patientId: string
  patientName: string
  age: number
  gender: string
  
  // Queue information
  priority: 'routine' | 'standard' | 'priority' | 'urgent' | 'emergency'
  token: string
  estimatedWaitMinutes?: number
  
  // Assignment
  assignedDoctorId?: string
  assignedDoctorName?: string
  
  // Status
  status: 'waiting' | 'called' | 'in-progress' | 'completed' | 'cancelled'
  
  // Triage summary for doctor
  chiefComplaint: string
  riskLevel: 'low' | 'medium' | 'high' | 'emergency'
  redFlags: string[]
  summaryId?: string
  
  // Timestamps
  queuedAt: string
  calledAt?: string
  startedAt?: string
  completedAt?: string
}

export interface ConsultationNotes {
  id: string
  teleconsultQueueId: string
  triageSessionId: string
  patientId: string
  doctorId: string
  
  // Consultation details
  clinicalImpression: string
  diagnosis?: string
  notes: string
  
  // Prescription
  prescription: MedicationEntry[]
  advice: string
  
  // Follow-up
  followUpRequired: boolean
  followUpDate?: string
  followUpNotes?: string
  
  // Referral
  referralRequired: boolean
  referralFacilityId?: string
  referralReason?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface DocumentUpload {
  id: string
  patientId: string
  triageSessionId?: string
  
  // File information
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  
  // Document classification
  documentType: 'prescription' | 'lab-report' | 'imaging' | 'discharge-summary' | 'other'
  
  // OCR results
  ocrProcessed: boolean
  ocrText?: string
  ocrStructuredData?: any
  ocrConfidence?: number
  needsReview: boolean
  reviewedBy?: string
  reviewedAt?: string
  
  // Metadata
  uploadedBy: string
  uploadedAt: string
  notes?: string
}

export interface LongitudinalRecord {
  id: string
  patientId: string
  
  // Record type
  recordType: 'triage' | 'teleconsult' | 'prescription' | 'lab-report' | 'referral' | 'follow-up' | 'appointment' | 'document'
  
  // Reference IDs
  triageSessionId?: string
  teleconsultQueueId?: string
  consultationNotesId?: string
  documentId?: string
  appointmentId?: string
  referralId?: string
  followUpId?: string
  
  // Summary information
  title: string
  summary: string
  createdBy: string
  createdByRole: string
  
  // Clinical data
  riskLevel?: 'low' | 'medium' | 'high' | 'emergency'
  diagnosis?: string
  medications?: MedicationEntry[]
  
  // Timestamps
  recordDate: string
  createdAt: string
}

// ═══════════════════════════════════════════════════════════════
// API Request/Response Types
// ═══════════════════════════════════════════════════════════════

export interface CreateTriageSessionRequest {
  patientId: string
  visitId?: string
  sourcePortal: 'patient' | 'asha'
}

export interface SaveTriageAnswersRequest {
  sessionId: string
  chiefComplaint?: string
  selectedConditions?: string[]
  symptomsDescription?: string
  questions?: TriageQuestionResponse[]
  vitals?: TriageSession['vitals']
  history?: Partial<PatientHistory>
  allergies?: AllergyEntry[]
  medications?: MedicationEntry[]
  currentStep?: number
}

export interface GenerateSummaryRequest {
  sessionId: string
  useAI: boolean
}

export interface GenerateSummaryResponse {
  summary: TriageSummary
  aiAssisted: boolean
}

export interface SubmitTriageRequest {
  sessionId: string
  summaryId: string
  confirmed: boolean
}

export interface SubmitTriageResponse {
  triageSession: TriageSession
  queueEntry: TeleconsultQueue
  followUpCreated: boolean
}

export interface SearchLongitudinalRequest {
  patientId: string
  recordType?: LongitudinalRecord['recordType']
  fromDate?: string
  toDate?: string
  searchTerm?: string
  limit?: number
  offset?: number
}

export interface SearchLongitudinalResponse {
  records: LongitudinalRecord[]
  total: number
  hasMore: boolean
}

export interface CompleteConsultationRequest {
  queueId: string
  notes: ConsultationNotes
  followUpDate?: string
  autoFollowUp: boolean
}

// ═══════════════════════════════════════════════════════════════
// Gemini AI Types
// ═══════════════════════════════════════════════════════════════

export interface GeminiQuestionRequest {
  condition: string
  chiefComplaint: string
  existingAnswers?: TriageQuestionResponse[]
  maxQuestions?: number
  language?: 'en' | 'hi' | 'mr'
}

export interface GeminiQuestionResponse {
  questions: {
    id: string
    question: string
    type: string
    options?: string[]
    priority: number
  }[]
  suggestedKeywords: string[]
}

export interface GeminiSummaryRequest {
  triageSession: TriageSession
  language?: 'en' | 'hi' | 'mr'
}

export interface GeminiSummaryResponse {
  summaryText: string
  keyFindings: string[]
  redFlags: string[]
  recommendedAction: string
  confidence: number
}

export interface GeminiKeywordRequest {
  condition: string
  chiefComplaint: string
  language?: 'en' | 'hi' | 'mr'
}

export interface GeminiKeywordResponse {
  keywords: string[]
  relatedTerms: string[]
  suggestedQuestions: string[]
}
