/**
 * Facility Portal TypeScript Types
 */

import { Timestamp, FieldValue } from 'firebase-admin/firestore'

export type FacilityRole = 
  | 'facility_admin' 
  | 'queue_desk' 
  | 'lab_technician' 
  | 'pharmacist' 
  | 'ambulance_coordinator'
  | 'district_officer'

export type FacilityType = 'sub-centre' | 'phc' | 'rural-hospital' | 'district-hospital'

export type TriageColour = 'green' | 'yellow' | 'red'

export type QueueStatus = 'waiting' | 'in-consultation' | 'completed' | 'no-show'

export type DiagnosticStatus = 'ordered' | 'sample-collected' | 'in-process' | 'result-ready' | 'reviewed'

export type Priority = 'routine' | 'urgent'

export type AmbulanceStatus = 'available' | 'dispatched' | 'en-route' | 'at-patient' | 'transporting' | 'at-hospital' | 'out-of-service'

export type EmergencyStatus = 'pending-confirmation' | 'confirmed' | 'dispatched' | 'en-route' | 'arrived-at-patient' | 'transporting' | 'handed-over' | 'cancelled'

export type ReferralStatus = 'created' | 'accepted' | 'rejected' | 'patient-arrived' | 'consulted' | 'outcome' | 'returned' | 'stalled'

// ====== Facility ======

export interface Facility {
  id: string
  name: string
  type: FacilityType
  address: string
  geo: {
    lat: number
    lng: number
  }
  districtId: string
  services: string[]
  testsOffered: string[]
  capacity: {
    beds: number
    doctors: number
    ambulances: number
  }
  contact: {
    phone: string
    email: string
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ====== Staff ======

export interface StaffMember {
  id: string
  name: string
  email: string
  role: FacilityRole
  phone: string
  active: boolean
  onDutyToday: boolean
  lastLogin: Timestamp | null
  createdAt: Timestamp
  createdBy: string
}

// ====== Queue ======

export interface QueueEntry {
  id: string
  tokenNumber: string
  patientId: string
  patientName: string
  patientIdentifier: string
  triageColour: TriageColour
  department: string
  doctorId: string | null
  doctorName: string | null
  status: QueueStatus
  priority: number
  manualPriorityOverride: boolean
  overrideReason: string | null
  createdAt: Timestamp
  calledAt: Timestamp | null
  completedAt: Timestamp | null
  waitTimeMinutes: number
  estimatedWaitMinutes: number
  notificationSent: boolean
  source: 'appointment' | 'walk-in'
  appointmentId: string | null
}

// ====== Diagnostics ======

export interface DiagnosticOrder {
  id: string
  patientId: string
  patientName: string
  testCode: string
  testName: string
  priority: Priority
  clinicalIndication: string
  orderedBy: string
  orderedByName: string
  orderedAt: Timestamp
  status: DiagnosticStatus
  sampleCollectedAt: Timestamp | null
  inProcessAt: Timestamp | null
  resultReadyAt: Timestamp | null
  reviewedAt: Timestamp | null
  reviewedBy: string | null
  result: {
    value: string
    unit: string
    referenceRange: string
    abnormal: boolean
    critical: boolean
  } | null
  resultFiles: string[]
  turnaroundTimeMinutes: number | null
  notes: string
}

// ====== Medicine ======

export interface MedicineBatch {
  batchNumber: string
  expiryDate: string
  quantity: number
}

export interface MedicineInventory {
  id: string
  genericName: string
  strength: string
  form: string
  batches: MedicineBatch[]
  totalQuantity: number
  reorderLevel: number
  unit: string
  category: 'essential' | 'non-essential'
  lastVerifiedAt: Timestamp | null
  lastVerifiedBy: string | null
  lowStock: boolean
  stockOut: boolean
  nearExpiry: Array<{
    batchNumber: string
    daysUntilExpiry: number
  }>
  updatedAt: Timestamp
}

export interface StockEvent {
  id: string
  medicineId: string
  medicineName: string
  type: 'adjust' | 'dispense' | 'receive' | 'verified' | 'stock-out' | 'stock-in'
  delta: number
  beforeQuantity: number
  afterQuantity: number
  batchNumber: string | null
  reason: string
  prescriptionId: string | null
  userId: string
  userName: string
  facilityId: string
  createdAt: Timestamp
}

// ====== Ambulance ======

export interface Ambulance {
  id: string
  vehicleNumber: string
  type: 'bls' | 'als'
  driver: {
    name: string
    phone: string
  }
  status: AmbulanceStatus
  currentEmergencyId: string | null
  lastLocation: {
    lat: number
    lng: number
    updatedAt: Timestamp
  } | null
  maintenanceDue: string | null
  facilityId: string
}

// ====== Emergency ======

export interface Emergency {
  id: string
  patientId: string
  patientName: string
  patientAge: number
  patientGender: string
  chiefComplaint: string
  vitals: {
    heartRate: number
    bloodPressure: string
    temperature: number
    oxygenSaturation: number
  }
  location: {
    address: string
    lat: number
    lng: number
  }
  source: 'asha' | 'patient' | 'ivr' | 'facility'
  sourceUserId: string
  aiGenerated: boolean
  confirmedByHuman: boolean
  confirmedBy: string | null
  confirmedAt: Timestamp | null
  downgraded: boolean
  downgradeReason: string | null
  status: EmergencyStatus
  assignedVehicleId: string | null
  assignedVehicleNumber: string | null
  destinationFacilityId: string
  destinationFacilityName: string
  timeline: Array<{
    status: string
    timestamp: Timestamp
    userId: string
  }>
  receivedAt: Timestamp
  dispatchedAt: Timestamp | null
  arrivedAt: Timestamp | null
  handedOverAt: Timestamp | null
  responseTimeMinutes: number | null
}

// ====== Referral (Extends existing) ======

export interface ReferralOutcome {
  diagnosis: string
  treatmentGiven: string
  followUpPlan: string
  recordedBy: string
  recordedAt: Timestamp
}

export interface Referral {
  id: string
  fromFacilityId: string
  fromFacilityName: string
  toFacilityId: string
  toFacilityName: string
  patientId: string
  patientName: string
  reason: string
  clinicalSummary: string
  urgency: Priority | 'emergency'
  status: ReferralStatus
  rejectionReason: string | null
  rejectionCategory: 'no-beds' | 'no-specialist' | 'equipment-unavailable' | 'other' | null
  alternativeFacilities: string[] | null
  acceptedBy: string | null
  acceptedAt: Timestamp | null
  patientArrivedAt: Timestamp | null
  consultedAt: Timestamp | null
  outcome: ReferralOutcome | null
  stalled: boolean
  stalledAt: Timestamp | null
  stalledReason: string | null
  transportRequired: boolean
  ambulanceAssigned: string | null
  createdAt: Timestamp
  createdBy: string
  updatedAt: Timestamp
  acceptanceDeadline: Timestamp
  stallThreshold: number
}

// ====== SLA ======

export interface SLARules {
  facilityId: string
  rules: {
    labTurnaroundRoutineHours: number
    labTurnaroundUrgentHours: number
    emergencyDispatchMinutes: number
    referralAcceptanceHours: number
    queueWaitRoutineMinutes: number
    queueWaitUrgentMinutes: number
  }
  updatedAt: Timestamp
  updatedBy: string
}

export interface SLABreach {
  id: string
  facilityId: string
  entityType: 'lab-order' | 'emergency' | 'referral' | 'queue'
  entityId: string
  ruleName: string
  threshold: number
  actualValue: number
  breachedAt: Timestamp
  resolvedAt: Timestamp | null
  ownerRole: FacilityRole
  ownerUserId: string | null
  status: 'open' | 'resolved'
  notes: string
}

// ====== Audit Log ======

export interface AuditLog {
  id: string
  userId: string
  userName: string
  role: FacilityRole
  facilityId: string
  action: 'create' | 'update' | 'delete' | 'view-sensitive' | 'override'
  entityType: string
  entityId: string
  before: any
  after: any
  reason: string | null
  ipAddress: string
  userAgent: string
  timestamp: Timestamp
}

// ====== KPIs ======

export interface FacilityKPIs {
  avgWaitTimeMinutes: number
  avgTimeToConsultMinutes: number
  patientsSeen: number
  referralCompletionPercent: number
  stockOutHours: number
  labTATMinutes: number
  emergencyResponseTimeMinutes: number
  followUpCompletionPercent: number
}

export interface LiveTiles {
  queueLength: number
  lowStockCount: number
  pendingLabOrders: number
  activeEmergencies: number
  stalledReferrals: number
}

// ====== Dashboard ======

export interface HealthScore {
  facilityId: string
  score: number
  slaCompliance: number
  stockAvailability: number
  referralCompletion: number
  emergencyResponse: number
  calculatedAt: Timestamp
}
