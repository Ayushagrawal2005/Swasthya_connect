/**
 * Consent Management Types
 */

export type ConsentStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'PENDING'

export type DataCategory =
  | 'Personal Information'
  | 'Medical Records'
  | 'Lab Reports'
  | 'Prescriptions'
  | 'Vaccination Records'
  | 'Diagnosis/Conditions'
  | 'Insurance Information'
  | 'Government Scheme Information'
  | 'Documents/Certificates'
  | 'All Health Data'

export interface Consent {
  id: string
  patientId: string
  grantedBy: string
  recipientId: string
  recipientRole: string
  recipientName?: string
  facilityId?: string
  dataCategory: DataCategory
  purpose: string
  status: ConsentStatus
  grantedAt: string
  expiresAt?: string | null
  revokedAt?: string | null
  revokedBy?: string | null
  createdAt?: any
  updatedAt?: any
}

export interface ConsentCreateRequest {
  recipientId: string
  recipientRole: string
  recipientName?: string
  dataCategory: DataCategory
  purpose: string
  durationDays?: number
}

export interface ConsentCheckRequest {
  patientId: string
  dataCategory: DataCategory
}

export interface ConsentCheckResponse {
  hasConsent: boolean
  patientId: string
  dataCategory: DataCategory
}
