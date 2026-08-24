/**
 * Central API service — all backend calls go through here.
 * Base URL: http://localhost:4000
 */

const BASE = 'http://localhost:4000'

function getToken(): string | null {
  return localStorage.getItem('swasthya_token')
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false,
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('swasthya_token')
    window.location.href = '/login'
    throw new Error('Unauthorised')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || res.statusText)
  }

  return res.json() as Promise<T>
}

const get  = <T>(path: string) => request<T>('GET', path)
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    post<{ token: string; user: { id: string; username: string; role: string; name: string } }>(
      '/auth/login', { username, password }),
  me: () => get<{ user: { id: string; username: string; role: string; name: string } }>('/auth/me'),
}

// ─── Patients ─────────────────────────────────────────────────────────────────
export const patientsApi = {
  search: (q: string) => get<PatientRecord[]>(`/patients/search?q=${encodeURIComponent(q)}`),
  get: (id: string) => get<PatientRecord>(`/patients/${id}`),
  register: (data: RegisterInput) => post<{ patientId: string; healthId: string; name: string }>('/patients/register', data),
  addVisit: (id: string, visit: Partial<VisitRecord>) => post<VisitRecord>(`/patients/${id}/visits`, visit),
  getRecords: (id: string, type?: string, q?: string) => {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (q)    params.set('q', q)
    return get<VisitRecord[]>(`/patients/${id}/records?${params}`)
  },
  getMedicines: (id: string) => get<MedicationEntry[]>(`/patients/${id}/medicines`),
  getReferrals: (id: string) => get<Referral[]>(`/patients/${id}/referrals`),
}

// ─── Triage ───────────────────────────────────────────────────────────────────
export const triageApi2 = {
  assess: (body: { vitals?: Record<string, string>; answers: string[]; severity?: number; duration_days?: number }) =>
    post<TriageResult>('/triage/assess', body),
  save: (session: Partial<TriageSession>) => post<{ triageId: string; savedAt: string }>('/triage/save', session),
  sessions: (patientId?: string) => get<TriageSession[]>(`/triage/sessions${patientId ? `?patientId=${patientId}` : ''}`),
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsApi = {
  facilities: () => get<FacilityWithDoctors[]>('/appointments/facilities'),
  slots: (facilityId: string, date: string) =>
    get<{ date: string; slots: string[]; doctors: Doctor[] }>(`/appointments/facilities/${facilityId}/slots?date=${date}`),
  book: (data: BookAppointmentInput) => post<Appointment>('/appointments', data),
  list: (params?: { patientId?: string; bookedBy?: string; facilityId?: string; date?: string }) => {
    const p = new URLSearchParams(params as Record<string, string>)
    return get<Appointment[]>(`/appointments?${p}`)
  },
  updateStatus: (id: string, status: string) => patch<Appointment>(`/appointments/${id}/status`, { status }),
}

// ─── Referrals ────────────────────────────────────────────────────────────────
export const referralsApi = {
  list: (params?: Record<string, string>) => {
    const p = new URLSearchParams(params)
    return get<Referral[]>(`/referrals?${p}`)
  },
  incoming: () => get<Referral[]>('/referrals/incoming'),
  outgoing: () => get<Referral[]>('/referrals/outgoing'),
  create: (data: CreateReferralInput) => post<Referral>('/referrals', data),
  accept: (id: string) => patch<Referral>(`/referrals/${id}/accept`),
  redirect: (id: string, toFacilityName?: string) => patch<Referral>(`/referrals/${id}/redirect`, { toFacilityName }),
  updateStatus: (id: string, status: string) => patch<Referral>(`/referrals/${id}/status`, { status }),
}

// ─── Follow-ups ───────────────────────────────────────────────────────────────
export const followupsApi = {
  list: (params?: { assignedTo?: string; status?: string }) => {
    const p = new URLSearchParams(params as Record<string, string>)
    return get<FollowUp[]>(`/followups?${p}`)
  },
  markDone: (id: string) => patch<FollowUp>(`/followups/${id}/done`),
  updateStatus: (id: string, status: string) => patch<FollowUp>(`/followups/${id}/status`, { status }),
}

// ─── Chronic care ─────────────────────────────────────────────────────────────
export const chronicApi = {
  list: (params?: { alertLevel?: string }) => {
    const p = new URLSearchParams(params as Record<string, string>)
    return get<ChronicPatient[]>(`/chronic?${p}`)
  },
  get: (id: string) => get<ChronicPatient>(`/chronic/${id}`),
  addReading: (id: string, reading: { value: string; numeric: number; date?: string; note?: string }) =>
    post<{ date: string; value: string; numeric: number }>(`/chronic/${id}/readings`, reading),
  acknowledge: (id: string, alertId: string) =>
    post<{ acknowledged: boolean }>(`/chronic/${id}/alerts/${alertId}/acknowledge`),
  sendSms: (id: string, message?: string) =>
    post<{ sent: boolean; to: string }>(`/chronic/${id}/sms`, { message }),
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  list: (facilityId?: string) => get<StockItem[]>(`/inventory${facilityId ? `?facilityId=${facilityId}` : ''}`),
  update: (id: string, data: Partial<StockItem>) => patch<StockItem>(`/inventory/${id}`, data),
  reorder: (id: string, quantity?: number) => post<{ ordered: boolean; item: string }>(`/inventory/${id}/reorder`, { quantity }),
  bulkReorder: (items: string[]) => post<{ ordered: boolean; count: number }>('/inventory/bulk-reorder', { items }),
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────
export const diagnosticsApi = {
  list: (params?: { facilityId?: string; status?: string; q?: string; patientId?: string }) => {
    const p = new URLSearchParams(params as Record<string, string>)
    return get<DiagOrder[]>(`/diagnostics?${p}`)
  },
  order: (data: { patientId: string; patientName: string; testName: string; facilityId?: string }) =>
    post<DiagOrder>('/diagnostics/orders', data),
  updateStatus: (id: string, data: { status: string; result?: string; flagged?: boolean }) =>
    patch<DiagOrder>(`/diagnostics/${id}/status`, data),
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export const staffApi = {
  list: () => get<FacilityWithDoctors[]>('/staff'),
  updateAvailability: (doctorId: string, available: boolean, slotsToday?: number) =>
    patch<Doctor>(`/staff/doctors/${doctorId}/availability`, { available, slotsToday }),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  overview: (facilityId?: string) => get<AdminOverview>(`/admin/overview${facilityId ? `?facilityId=${facilityId}` : ''}`),
  dashboard: () => get<AshaDashboardData>('/admin/dashboard'),
}

// ─── Teleconsult ──────────────────────────────────────────────────────────────
export const teleconsultApi = {
  availableDoctors: () => get<(Doctor & { facility: string })[]>('/teleconsult/available-doctors'),
  initiate: (patientId: string, doctorId: string) =>
    post<{ sessionId: string; roomToken: string; callUrl: string }>('/teleconsult/initiate', { patientId, doctorId }),
  saveNotes: (sessionId: string, notes: string, prescription: string) =>
    post<{ savedAt: string; sessionId: string }>(`/teleconsult/${sessionId}/notes`, { consultationNotes: notes, prescription }),
}

// ─── Escalations ──────────────────────────────────────────────────────────────
export const escalationsApi = {
  list: () => get<Escalation[]>('/escalations'),
  create: (data: { patientName: string; patientId?: string; reason: string; toFacilityId?: string; toFacilityName?: string }) =>
    post<Escalation>('/escalations', data),
  acknowledge: (id: string) => patch<Escalation>(`/escalations/${id}/acknowledge`),
  markArrived: (id: string) => patch<Escalation>(`/escalations/${id}/arrived`),
}

// ─── Kiosk ────────────────────────────────────────────────────────────────────
export const kioskApi = {
  queue: (facilityId: string) => get<KioskEntry[]>(`/kiosk/queue/${facilityId}`),
  checkin: (data: { healthId?: string; name?: string; type?: string; facilityId?: string }) =>
    post<KioskEntry>('/kiosk/checkin', data),
  call: (id: string) => patch<KioskEntry>(`/kiosk/${id}/call`),
  done: (id: string) => patch<KioskEntry>(`/kiosk/${id}/done`),
}

// ─── OCR ──────────────────────────────────────────────────────────────────────
export const ocrApi = {
  extract: (file: File, patientId?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (patientId) form.append('patientId', patientId)
    return request<OcrResult>('POST', '/ocr/extract', form, true)
  },
}

// ─── IVR ──────────────────────────────────────────────────────────────────────
export const ivrApi = {
  createCase: (data: { phone: string; answers: string[]; riskScore: number; lang?: string }) =>
    post<IvrCase>('/ivr/case', data),
  cases: () => get<IvrCase[]>('/ivr/cases'),
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
let wsInstance: WebSocket | null = null

export function connectWs(onMessage: (type: string, data: unknown) => void): WebSocket {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) return wsInstance

  wsInstance = new WebSocket('ws://localhost:4000/ws')

  wsInstance.addEventListener('open', () => {
    const token = getToken()
    if (token && wsInstance) {
      wsInstance.send(JSON.stringify({ type: 'auth', token }))
    }
  })

  wsInstance.addEventListener('message', (e) => {
    try {
      const msg = JSON.parse(e.data as string) as { type: string; data: unknown }
      onMessage(msg.type, msg.data)
    } catch {/* ignore */}
  })

  wsInstance.addEventListener('close', () => {
    wsInstance = null
    // Reconnect after 3s
    setTimeout(() => connectWs(onMessage), 3000)
  })

  return wsInstance
}

export function wsJoinRoom(room: string) {
  wsInstance?.send(JSON.stringify({ type: 'room:join', room }))
}

export function wsSend(payload: Record<string, unknown>) {
  if (wsInstance?.readyState === WebSocket.OPEN) {
    wsInstance.send(JSON.stringify(payload))
  }
}

// ─── Shared Types ─────────────────────────────────────────────────────────────
export interface PatientRecord {
  id: string; healthId: string; name: string; age: number; gender: 'M' | 'F' | 'O'
  dob: string; village: string; phone: string; language: string; bloodGroup: string
  allergies: string[]; conditions: string[]
  diseaseHistory: DiseaseEntry[]; medications: MedicationEntry[]
  noShowCount: number; totalFollowUps: number; distanceKmFromPHC: number
  visits: VisitRecord[]; createdAt: string
}
export interface DiseaseEntry { name: string; since: string; status: string; icd10?: string; notes: string }
export interface MedicationEntry { drug: string; dose: string; frequency: string; since: string; prescribedBy: string; status: string; source: string }
export interface VisitRecord { id: string; patientId: string; date: string; facility: string; tier: string; worker: string; type: string; title: string; detail: string; vitals?: Record<string, string>; riskScore?: number; riskLevel?: string; reportFile?: string }
export interface Doctor { id: string; facilityId: string; name: string; specialty: string; available: boolean; slotsToday: number }
export interface Facility { id: string; name: string; tier: string; distance: string; phone: string; address: string }
export interface FacilityWithDoctors extends Facility { doctors: Doctor[] }
export interface Appointment { id: string; patientId: string; patientName: string; facilityId: string; doctorId: string; bookedBy: string; date: string; time: string; type: string; status: string; queuePosition: number; estimatedWait: number; token: string; createdAt: string }
export interface Referral { id: string; patientId: string; patientName: string; fromFacilityId: string; toFacilityId: string; toFacilityName: string; reason: string; urgency: string; status: string; createdBy: string; createdAt: string; updatedAt: string }
export interface FollowUp { id: string; patientId: string; patientName: string; age: number; condition: string; risk: string; dueDate: string; status: string; phone: string; notes: string; lastVisit: string; nextStep: string; assignedTo: string; completedAt?: string }
export interface ChronicPatient { id: string; patientId: string; name: string; age: number; gender: string; village: string; phone: string; worker: string; condition: string; conditionLabel: string; since: string; progressionStatus: string; alertLevel: string; readings: Array<{ date: string; value: string; numeric: number; note?: string; recordedBy: string }>; checkups: ChronicCheckup[]; alerts: ChronicAlert[]; medications: string[]; missedCheckups: number; totalCheckups: number; lastContactDate: string; nextCheckupDate: string; notes: string }
export interface ChronicCheckup { id: string; chronicPatientId: string; scheduledDate: string; daysFromNow: number; type: string; status: string; completedDate?: string; result?: string; note?: string }
export interface ChronicAlert { id: string; chronicPatientId: string; level: string; message: string; action: string; triggeredBy: string; createdAt: string; acknowledged: boolean }
export interface StockItem { id: string; facilityId: string; name: string; category: string; current: number; threshold: number; unit: string; lastRestocked: string; critical: boolean }
export interface DiagOrder { id: string; patientId: string; patientName: string; test: string; orderedBy: string; facilityId: string; date: string; status: string; available: boolean; nearestAvailable?: string; result?: string; flagged?: boolean }
export interface Escalation { id: string; patientId?: string; patientName: string; reason: string; fromFacilityId: string; toFacilityId: string; toFacilityName: string; triggeredBy: string; sentTime: string; status: string; arrivedAt?: string }
export interface KioskEntry { id: string; facilityId: string; patientId?: string; name: string; type: string; token: string; time: string; status: string; queuePosition: number; estimatedWait: number }
export interface TriageResult { urgency_level: number; risk_level: string; risk_label: string; score: number; confidence: number; auto_escalate: boolean; flags: string[]; hospital_level: number; hospital_level_label: string; hospital_level_desc: string; probabilities: Record<string, number> }
export interface TriageSession { id: string; patientId?: string; workerId?: string; vitals?: Record<string, string>; answers: string[]; score: number; level: string; triggeredFlags: string[]; autoEscalate: boolean; mlUsed: boolean; confidence?: number; hospitalLevel: number; hospitalLevelLabel: string; hospitalLevelDesc: string; createdAt: string }
export interface OcrResult { raw: string; structured: { drug: string; dose: string; frequency: string; prescribedBy: string; prescribedAt: string; date: string; additionalMeds?: Array<{ drug: string; dose: string; frequency: string }> } }
export interface IvrCase { id: string; caseId: string; phone: string; answers: string[]; riskScore: number; riskLevel: string; actionAdvice: string; lang: string; createdAt: string }
export interface AdminOverview { kpis: Array<{ label: string; value: string | number; change: string; icon: string; alert?: boolean }>; footfallData: Array<{ day: string; patients: number; referrals: number }>; referralDistribution: Array<{ name: string; value: number; color: string }>; stockAlerts: StockItem[]; followUpBoard: Array<{ name: string; condition: string; due: string; status: string; asha: string }> }
export interface AshaDashboardData { activeCases: Array<{ id: string; name: string; age: number; village: string; condition: string; riskLevel: string; riskScore: number; lastSeen: string }>; todayStats: { visited: number; triages: number; referrals: number; overdueFollowUps: number } }
export interface RegisterInput { name: string; phone: string; age: string; gender: string; village: string; condition?: string; language?: string; aadhaarLast4?: string }
export interface BookAppointmentInput { patientId?: string; patientName: string; facilityId: string; doctorId: string; date: string; time: string; type?: string }
export interface CreateReferralInput { patientId?: string; patientName: string; toFacilityId?: string; toFacilityName: string; reason: string; urgency: string }
