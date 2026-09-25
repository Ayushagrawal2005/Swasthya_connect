/**
 * Comprehensive Referral Management Service
 * Real-time referral tracking, notifications, and facility mapping
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'

// Debug log
console.log('🔧 Referral Management API URL:', BASE_URL)

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ReferralStatus = 
  | 'pending'        // Created, awaiting acceptance
  | 'accepted'       // Facility accepted referral
  | 'rejected'       // Facility rejected referral
  | 'in_transit'     // Patient traveling to facility
  | 'arrived'        // Patient arrived at facility
  | 'admitted'       // Patient admitted to facility
  | 'completed'      // Treatment completed
  | 'cancelled'      // Referral cancelled

export type ReferralPriority = 'routine' | 'urgent' | 'emergency'

export type FacilityType = 
  | 'phc'            // Primary Health Center
  | 'chc'            // Community Health Center
  | 'sdh'            // Sub-District Hospital
  | 'dh'             // District Hospital
  | 'medical_college' // Medical College/Tertiary

export interface Facility {
  id: string
  name: string
  type: FacilityType
  address: string
  district: string
  state: string
  pincode: string
  contactNumber: string
  email?: string
  services: string[]           // Available services/specialties
  bedCapacity: number
  bedsAvailable: number
  hasAmbulance: boolean
  isOperational: boolean
  latitude?: number
  longitude?: number
  distanceKm?: number          // Distance from referring location
}

export interface ReferralReason {
  category: string             // e.g., 'Specialist Consultation', 'Emergency', 'Diagnostic'
  condition: string            // Primary condition
  urgency: ReferralPriority
  clinicalNotes: string
  requiredServices: string[]   // Required specialties/services
}

export interface Referral {
  id: string
  referralNumber: string       // Unique reference number (e.g., REF-2024-001234)
  
  // Patient Info
  patientId: string
  patientName: string
  age: number
  gender: string
  
  // Referring Info
  referringFacilityId: string
  referringFacilityName: string
  referredBy: string           // Doctor/ASHA name
  referredById: string         // User ID
  referredByRole: 'asha' | 'doctor' | 'nurse'
  referralDate: string
  
  // Receiving Info
  receivingFacilityId: string
  receivingFacilityName: string
  assignedDoctorId?: string
  assignedDoctorName?: string
  acceptedDate?: string
  
  // Clinical Info
  reason: ReferralReason
  triageSessionId?: string
  vitals?: Record<string, string>
  attachments?: string[]       // URLs to documents/reports
  
  // Status Tracking
  status: ReferralStatus
  priority: ReferralPriority
  estimatedArrivalTime?: string
  actualArrivalTime?: string
  completedDate?: string
  
  // Communication
  notes: string[]              // Communication log
  lastUpdated: string
  
  // Transport
  ambulanceRequired: boolean
  ambulanceId?: string
  ambulanceStatus?: 'requested' | 'dispatched' | 'arrived'
  
  // Bed Management
  bedReserved: boolean
  bedNumber?: string
  wardName?: string
}

export interface ReferralNotification {
  id: string
  referralId: string
  type: 'new_referral' | 'status_update' | 'urgent_action' | 'arrival_alert' | 'completion'
  message: string
  priority: 'low' | 'normal' | 'high'
  recipientRole: string        // Which role should see this
  recipientId?: string         // Specific user (optional)
  facilityId?: string          // Facility-specific notification
  read: boolean
  createdAt: string
}

export interface ReferralStats {
  total: number
  pending: number
  accepted: number
  inTransit: number
  completed: number
  avgResponseTime: number      // minutes
  urgentCount: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getToken(): string | null {
  return localStorage.getItem('swasthya_token')
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }

  return res.json()
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRAL MANAGEMENT SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export const referralManagementService = {
  // ─── CREATE REFERRAL ─────────────────────────────────────────────────────────
  async createReferral(data: {
    patientId: string
    receivingFacilityId: string
    reason: ReferralReason
    triageSessionId?: string
    vitals?: Record<string, string>
    ambulanceRequired: boolean
    attachments?: string[]
  }): Promise<Referral> {
    return apiRequest<Referral>('POST', '/api/referrals', data)
  },

  // ─── GET REFERRALS ───────────────────────────────────────────────────────────
  async getReferrals(filters?: {
    facilityId?: string
    patientId?: string
    status?: ReferralStatus
    priority?: ReferralPriority
    dateFrom?: string
    dateTo?: string
  }): Promise<Referral[]> {
    const params = new URLSearchParams()
    if (filters?.facilityId) params.set('facilityId', filters.facilityId)
    if (filters?.patientId) params.set('patientId', filters.patientId)
    if (filters?.status) params.set('status', filters.status)
    if (filters?.priority) params.set('priority', filters.priority)
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters?.dateTo) params.set('dateTo', filters.dateTo)
    
    return apiRequest<Referral[]>('GET', `/api/referrals?${params}`)
  },

  // ─── GET SINGLE REFERRAL ─────────────────────────────────────────────────────
  async getReferral(referralId: string): Promise<Referral> {
    return apiRequest<Referral>('GET', `/api/referrals/${referralId}`)
  },

  // ─── UPDATE REFERRAL STATUS ──────────────────────────────────────────────────
  async updateStatus(
    referralId: string,
    status: ReferralStatus,
    note?: string
  ): Promise<Referral> {
    return apiRequest<Referral>('PATCH', `/api/referrals/${referralId}/status`, {
      status,
      note
    })
  },

  // ─── ACCEPT REFERRAL (Receiving Facility) ────────────────────────────────────
  async acceptReferral(
    referralId: string,
    doctorId: string,
    bedReserved: boolean = false,
    bedNumber?: string
  ): Promise<Referral> {
    return apiRequest<Referral>('POST', `/api/referrals/${referralId}/accept`, {
      doctorId,
      bedReserved,
      bedNumber
    })
  },

  // ─── REJECT REFERRAL ─────────────────────────────────────────────────────────
  async rejectReferral(
    referralId: string,
    reason: string
  ): Promise<Referral> {
    return apiRequest<Referral>('POST', `/api/referrals/${referralId}/reject`, {
      reason
    })
  },

  // ─── ADD NOTE/COMMUNICATION ──────────────────────────────────────────────────
  async addNote(
    referralId: string,
    note: string,
    isPrivate: boolean = false
  ): Promise<Referral> {
    return apiRequest<Referral>('POST', `/api/referrals/${referralId}/notes`, {
      note,
      isPrivate
    })
  },

  // ─── REQUEST AMBULANCE ───────────────────────────────────────────────────────
  async requestAmbulance(
    referralId: string,
    pickupAddress: string,
    contactNumber: string
  ): Promise<{ ambulanceId: string; estimatedArrival: string }> {
    return apiRequest('POST', `/api/referrals/${referralId}/ambulance`, {
      pickupAddress,
      contactNumber
    })
  },

  // ─── UPDATE AMBULANCE STATUS ─────────────────────────────────────────────────
  async updateAmbulanceStatus(
    referralId: string,
    status: 'dispatched' | 'arrived' | 'patient_picked_up' | 'en_route_to_facility' | 'delivered'
  ): Promise<Referral> {
    return apiRequest<Referral>('PATCH', `/api/referrals/${referralId}/ambulance/status`, {
      status
    })
  },

  // ─── MARK PATIENT ARRIVED ────────────────────────────────────────────────────
  async markArrived(referralId: string): Promise<Referral> {
    return this.updateStatus(referralId, 'arrived', 'Patient arrived at facility')
  },

  // ─── COMPLETE REFERRAL ───────────────────────────────────────────────────────
  async completeReferral(
    referralId: string,
    outcome: string,
    dischargeSummary?: string
  ): Promise<Referral> {
    return apiRequest<Referral>('POST', `/api/referrals/${referralId}/complete`, {
      outcome,
      dischargeSummary
    })
  },

  // ─── GET STATISTICS ──────────────────────────────────────────────────────────
  async getStats(facilityId?: string): Promise<ReferralStats> {
    const params = facilityId ? `?facilityId=${facilityId}` : ''
    return apiRequest<ReferralStats>('GET', `/api/referrals/stats${params}`)
  },

  // ─── TRACK REFERRAL (Real-time status) ───────────────────────────────────────
  async trackReferral(referralNumber: string): Promise<{
    referral: Referral
    timeline: Array<{
      status: ReferralStatus
      timestamp: string
      note: string
    }>
  }> {
    return apiRequest('GET', `/api/referrals/track/${referralNumber}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACILITY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export const facilityService = {
  // ─── SEARCH FACILITIES ───────────────────────────────────────────────────────
  async searchFacilities(criteria: {
    location?: string           // City/District
    type?: FacilityType
    services?: string[]         // Required services
    maxDistance?: number        // km
    hasAmbulance?: boolean
    minBedsAvailable?: number
    latitude?: number
    longitude?: number
  }): Promise<Facility[]> {
    return apiRequest<Facility[]>('POST', '/api/facilities/search', criteria)
  },

  // ─── GET NEARBY FACILITIES ───────────────────────────────────────────────────
  async getNearbyFacilities(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<Facility[]> {
    return apiRequest<Facility[]>('GET', 
      `/api/facilities/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`
    )
  },

  // ─── GET FACILITY DETAILS ────────────────────────────────────────────────────
  async getFacility(facilityId: string): Promise<Facility> {
    return apiRequest<Facility>('GET', `/api/facilities/${facilityId}`)
  },

  // ─── GET AVAILABLE FACILITIES (For Referral) ─────────────────────────────────
  async getAvailableFacilities(
    requiredServices: string[],
    priority: ReferralPriority,
    fromFacilityId: string
  ): Promise<Facility[]> {
    return apiRequest<Facility[]>('POST', '/api/facilities/available', {
      requiredServices,
      priority,
      fromFacilityId
    })
  },

  // ─── UPDATE BED AVAILABILITY ─────────────────────────────────────────────────
  async updateBedAvailability(
    facilityId: string,
    bedsAvailable: number
  ): Promise<{ success: boolean }> {
    return apiRequest('PATCH', `/api/facilities/${facilityId}/beds`, {
      bedsAvailable
    })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export const referralNotificationService = {
  // ─── GET NOTIFICATIONS ───────────────────────────────────────────────────────
  async getNotifications(filters?: {
    unreadOnly?: boolean
    facilityId?: string
    type?: ReferralNotification['type']
  }): Promise<ReferralNotification[]> {
    const params = new URLSearchParams()
    if (filters?.unreadOnly) params.set('unreadOnly', 'true')
    if (filters?.facilityId) params.set('facilityId', filters.facilityId)
    if (filters?.type) params.set('type', filters.type)
    
    return apiRequest<ReferralNotification[]>('GET', `/api/notifications/referrals?${params}`)
  },

  // ─── MARK AS READ ────────────────────────────────────────────────────────────
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    return apiRequest('PATCH', `/api/notifications/${notificationId}/read`, {})
  },

  // ─── MARK ALL AS READ ────────────────────────────────────────────────────────
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    return apiRequest('PATCH', '/api/notifications/read-all', {})
  },

  // ─── GET UNREAD COUNT ────────────────────────────────────────────────────────
  async getUnreadCount(): Promise<{ count: number }> {
    return apiRequest<{ count: number }>('GET', '/api/notifications/unread-count')
  },

  // ─── SUBSCRIBE TO REAL-TIME UPDATES (WebSocket/SSE) ──────────────────────────
  subscribeToReferralUpdates(
    facilityId: string,
    onNotification: (notification: ReferralNotification) => void
  ): () => void {
    const token = getToken()
    const eventSource = new EventSource(
      `${BASE_URL}/api/notifications/stream?facilityId=${facilityId}&token=${token}`
    )

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data) as ReferralNotification
      onNotification(notification)
    }

    eventSource.onerror = (error) => {
      console.error('Notification stream error:', error)
    }

    // Return cleanup function
    return () => {
      eventSource.close()
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const referralHelpers = {
  // ─── GENERATE REFERRAL NUMBER ────────────────────────────────────────────────
  generateReferralNumber(): string {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    return `REF-${year}-${random}`
  },

  // ─── GET STATUS COLOR ────────────────────────────────────────────────────────
  getStatusColor(status: ReferralStatus): string {
    const colors: Record<ReferralStatus, string> = {
      pending: 'amber',
      accepted: 'blue',
      rejected: 'red',
      in_transit: 'indigo',
      arrived: 'teal',
      admitted: 'purple',
      completed: 'green',
      cancelled: 'gray'
    }
    return colors[status]
  },

  // ─── GET PRIORITY BADGE ──────────────────────────────────────────────────────
  getPriorityBadgeClass(priority: ReferralPriority): string {
    const classes: Record<ReferralPriority, string> = {
      routine: 'bg-teal-100 text-teal-700 border-teal-300',
      urgent: 'bg-amber-100 text-amber-700 border-amber-300',
      emergency: 'bg-red-100 text-red-700 border-red-300'
    }
    return classes[priority]
  },

  // ─── FORMAT DISTANCE ─────────────────────────────────────────────────────────
  formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)}m`
    return `${km.toFixed(1)}km`
  },

  // ─── CALCULATE ETA ───────────────────────────────────────────────────────────
  calculateETA(distanceKm: number, priority: ReferralPriority): string {
    const avgSpeed = priority === 'emergency' ? 60 : priority === 'urgent' ? 40 : 30 // km/h
    const hours = distanceKm / avgSpeed
    const minutes = Math.round(hours * 60)
    
    if (minutes < 60) return `${minutes} min`
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }
}
