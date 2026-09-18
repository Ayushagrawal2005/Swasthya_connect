/**
 * Care Orchestration Service
 * Automatically coordinates patient care after triage based on risk level:
 * - Low/Green → Teleconsult queue (standard priority)
 * - Medium/Yellow → Teleconsult queue (priority)
 * - High/Orange → Teleconsult queue (urgent) + 24h appointment
 * - Emergency/Red → Emergency escalation + ambulance + facility alert
 */

import { v4 as uuid } from 'uuid'
import { db, type RiskLevel, type TeleconsultSession, type Appointment, type Referral, type Escalation, type Notification, type FollowUp } from '../store/index.js'

export interface TriageOrchestrationInput {
  triageId: string
  patientId: string
  patientName: string
  age: number
  phone: string
  score: number
  level: RiskLevel
  triggeredFlags: string[]
  autoEscalate: boolean
  hospitalLevel: number
  hospitalLevelLabel: string
  vitals?: Record<string, string>
  requestingUserId: string
  requestingUserName: string
}

export interface OrchestrationResult {
  triageId: string
  actions: {
    teleconsultQueued: boolean
    teleconsultSessionId?: string
    teleconsultToken?: string
    appointmentCreated: boolean
    appointmentId?: string
    appointmentDate?: string
    referralCreated: boolean
    referralId?: string
    escalationTriggered: boolean
    escalationId?: string
    ambulanceRequested: boolean
  }
  notifications: {
    patient: string[]
    asha: string[]
    doctor: string[]
    admin: string[]
  }
  nextSteps: string[]
  priority: 'routine' | 'priority' | 'urgent' | 'emergency'
}

// Track processed triages to prevent duplicates
const processedTriages = new Set<string>()

/**
 * Main orchestration entry point
 */
export async function orchestratePostTriageCare(input: TriageOrchestrationInput): Promise<OrchestrationResult> {
  // Prevent duplicate processing
  if (processedTriages.has(input.triageId)) {
    console.log(`⚠️ Triage ${input.triageId} already processed, skipping`)
    throw new Error('Triage already processed')
  }

  processedTriages.add(input.triageId)
  
  console.log(`🔄 Orchestrating care for ${input.patientName} (${input.level} risk, score: ${input.score})`)

  const result: OrchestrationResult = {
    triageId: input.triageId,
    actions: {
      teleconsultQueued: false,
      appointmentCreated: false,
      referralCreated: false,
      escalationTriggered: false,
      ambulanceRequested: false,
    },
    notifications: {
      patient: [],
      asha: [],
      doctor: [],
      admin: [],
    },
    nextSteps: [],
    priority: mapRiskToPriority(input.level),
  }

  // Branch by risk level
  switch (input.level) {
    case 'low':
      await handleLowRisk(input, result)
      break
    case 'medium':
      await handleMediumRisk(input, result)
      break
    case 'high':
      await handleHighRisk(input, result)
      break
    case 'emergency':
      await handleEmergency(input, result)
      break
  }

  // Send all notifications
  await sendNotifications(input, result)

  console.log(`✅ Care orchestration complete for ${input.patientName}`)
  return result
}

/**
 * Low risk (Green) → Standard teleconsult queue
 */
async function handleLowRisk(input: TriageOrchestrationInput, result: OrchestrationResult) {
  console.log(`🟢 Low risk: Queuing for standard teleconsult`)

  // Queue for teleconsult
  const session = await queueForTeleconsult(input, 'routine')
  result.actions.teleconsultQueued = true
  result.actions.teleconsultSessionId = session.id
  result.actions.teleconsultToken = session.roomToken

  result.nextSteps = [
    'Patient queued for teleconsultation',
    'Self-care advice provided',
    'ASHA follow-up if symptoms worsen',
  ]

  result.notifications.patient.push(
    'Your symptoms have been assessed. A doctor will connect with you via teleconsult soon.'
  )
  result.notifications.asha.push(
    `${input.patientName} assessed as low risk. Teleconsult queued. Monitor for 48 hours.`
  )
}

/**
 * Medium risk (Yellow) → Priority teleconsult queue
 */
async function handleMediumRisk(input: TriageOrchestrationInput, result: OrchestrationResult) {
  console.log(`🟡 Medium risk: Priority teleconsult queue`)

  // Queue for priority teleconsult
  const session = await queueForTeleconsult(input, 'priority')
  result.actions.teleconsultQueued = true
  result.actions.teleconsultSessionId = session.id
  result.actions.teleconsultToken = session.roomToken

  result.nextSteps = [
    'Priority teleconsultation queued',
    'Doctor will connect within 30 minutes',
    'PHC visit recommended within 24 hours',
  ]

  result.notifications.patient.push(
    '⚠️ Moderate risk detected. A doctor will connect with you via priority teleconsult within 30 minutes.'
  )
  result.notifications.asha.push(
    `${input.patientName} assessed as MODERATE risk. Priority teleconsult queued. Escort to PHC if needed.`
  )
  result.notifications.doctor.push(
    `🟡 PRIORITY: ${input.patientName}, age ${input.age}, moderate risk (score: ${input.score}). Teleconsult waiting.`
  )
}

/**
 * High risk (Orange) → Urgent teleconsult + 24h appointment + referral
 */
async function handleHighRisk(input: TriageOrchestrationInput, result: OrchestrationResult) {
  console.log(`🟠 High risk: Urgent teleconsult + appointment + referral`)

  // 1. Queue for urgent teleconsult
  const session = await queueForTeleconsult(input, 'urgent')
  result.actions.teleconsultQueued = true
  result.actions.teleconsultSessionId = session.id
  result.actions.teleconsultToken = session.roomToken

  // 2. Create appointment for tomorrow
  const appointment = await createUrgentAppointment(input)
  if (appointment) {
    result.actions.appointmentCreated = true
    result.actions.appointmentId = appointment.id
    result.actions.appointmentDate = appointment.date
  }

  // 3. Create referral to higher facility
  const referral = await createReferral(input, 'urgent')
  if (referral) {
    result.actions.referralCreated = true
    result.actions.referralId = referral.id
  }

  result.nextSteps = [
    'URGENT teleconsultation queued — doctor will connect immediately',
    `Appointment created for ${appointment?.date} at ${appointment?.time}`,
    'Referral prepared for higher facility',
    'Patient should reach PHC/District Hospital today',
  ]

  result.notifications.patient.push(
    `🟠 HIGH RISK detected. A doctor will connect immediately via teleconsult. Please reach ${input.hospitalLevelLabel} today.`
  )
  result.notifications.asha.push(
    `🟠 URGENT: ${input.patientName} is HIGH RISK (score: ${input.score}). Teleconsult queued. Escort to facility today.`
  )
  result.notifications.doctor.push(
    `🟠 URGENT: ${input.patientName}, age ${input.age}, HIGH RISK (score: ${input.score}). Teleconsult NOW. Flags: ${input.triggeredFlags.join(', ')}`
  )
}

/**
 * Emergency (Red) → Auto-escalation + ambulance + facility alert + emergency referral
 */
async function handleEmergency(input: TriageOrchestrationInput, result: OrchestrationResult) {
  console.log(`🔴 EMERGENCY: Auto-escalation triggered`)

  // 1. Create emergency escalation
  const escalation = await triggerEmergencyEscalation(input)
  result.actions.escalationTriggered = true
  result.actions.escalationId = escalation.id

  // 2. Request ambulance (simulated)
  result.actions.ambulanceRequested = true

  // 3. Create emergency referral
  const referral = await createReferral(input, 'emergency')
  if (referral) {
    result.actions.referralCreated = true
    result.actions.referralId = referral.id
  }

  // 4. Alert facility dashboard
  await alertFacilityDashboard(input, escalation)

  result.nextSteps = [
    '🚨 EMERGENCY escalation triggered',
    'Nearest facility has been notified',
    'Ambulance requested',
    'Call 104 immediately',
    'Do NOT wait for teleconsult',
  ]

  result.notifications.patient.push(
    `🚨 EMERGENCY: Call 104 NOW or reach ${input.hospitalLevelLabel} immediately. Ambulance requested. Facility has been alerted.`
  )
  result.notifications.asha.push(
    `🚨 EMERGENCY: ${input.patientName} (score: ${input.score}). Auto-escalation sent. Ambulance requested. Call 104 if patient cannot reach facility.`
  )
  result.notifications.doctor.push(
    `🚨 EMERGENCY ALERT: ${input.patientName}, age ${input.age}, CRITICAL (score: ${input.score}). Patient incoming. Flags: ${input.triggeredFlags.join(', ')}`
  )
  result.notifications.admin.push(
    `🚨 EMERGENCY: ${input.patientName} auto-escalated from ${input.requestingUserName}. Ambulance requested. Track arrival.`
  )
}

/**
 * Queue patient for teleconsultation with priority
 */
async function queueForTeleconsult(
  input: TriageOrchestrationInput,
  priority: 'routine' | 'priority' | 'urgent'
): Promise<TeleconsultSession> {
  // Find next available doctor
  const availableDoctors = db.doctors.filter(d => d.available && d.slotsToday > 0)
  const doctor = availableDoctors.length > 0 ? availableDoctors[0] : db.doctors[0]

  // Calculate queue position based on priority
  const existingSessions = db.teleconsultSessions.filter(s => 
    s.status === 'waiting' || s.status === 'active'
  )
  
  // Priority/urgent sessions go to front
  const queuePosition = priority === 'routine' 
    ? existingSessions.length + 1
    : existingSessions.filter(s => (s as any).priority === 'routine').length + 1

  const sessionId = uuid()
  const session: TeleconsultSession = {
    id: sessionId,
    patientId: input.patientId,
    doctorId: doctor.id,
    initiatedBy: input.requestingUserId,
    roomToken: `room_${sessionId.replace(/-/g, '').slice(0, 12)}`,
    startedAt: new Date().toISOString(),
    status: 'waiting',
  }

  // Store priority metadata (extend interface in production)
  ;(session as any).priority = priority
  ;(session as any).triageId = input.triageId
  ;(session as any).triageScore = input.score
  ;(session as any).queuePosition = queuePosition

  db.teleconsultSessions.push(session)

  console.log(`  ✓ Teleconsult session ${sessionId} created (${priority}, queue: ${queuePosition})`)
  return session
}

/**
 * Create urgent appointment for next available slot
 */
async function createUrgentAppointment(input: TriageOrchestrationInput): Promise<Appointment | null> {
  const facility = db.facilities.find(f => f.tier === 'phc' || f.tier === 'rural-hospital')
  if (!facility) return null

  const availableDoctors = db.doctors.filter(d => 
    d.facilityId === facility.id && d.available && d.slotsToday > 0
  )
  if (availableDoctors.length === 0) return null

  const doctor = availableDoctors[0]
  
  // Schedule for tomorrow 9 AM
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().split('T')[0]

  const queueToday = db.appointments.filter(a => a.facilityId === facility.id && a.date === dateStr).length

  const appointment: Appointment = {
    id: uuid(),
    patientId: input.patientId,
    patientName: input.patientName,
    facilityId: facility.id,
    doctorId: doctor.id,
    bookedBy: input.requestingUserId,
    date: dateStr,
    time: '09:00 AM',
    type: 'in-person',
    status: 'scheduled',
    queuePosition: queueToday + 1,
    estimatedWait: queueToday * 15,
    token: `T-${String(queueToday + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
  }

  db.appointments.push(appointment)
  
  // Update doctor slots
  if (doctor.slotsToday > 0) doctor.slotsToday--

  console.log(`  ✓ Urgent appointment created for ${dateStr} at ${facility.name}`)
  return appointment
}

/**
 * Create referral to appropriate facility
 */
async function createReferral(
  input: TriageOrchestrationInput,
  urgency: 'urgent' | 'emergency'
): Promise<Referral | null> {
  const fromFacility = db.facilities.find(f => f.tier === 'sub-centre')
  if (!fromFacility) return null

  // Map hospital level to facility tier
  const targetTier = input.hospitalLevel >= 4 ? 'district' 
                   : input.hospitalLevel >= 3 ? 'rural-hospital'
                   : 'phc'

  const toFacility = db.facilities.find(f => f.tier === targetTier)
  if (!toFacility) return null

  const referral: Referral = {
    id: uuid(),
    patientId: input.patientId,
    patientName: input.patientName,
    fromFacilityId: fromFacility.id,
    toFacilityId: toFacility.id,
    toFacilityName: toFacility.name,
    reason: `Triage score ${input.score}/100 (${input.level}). Flags: ${input.triggeredFlags.join(', ')}`,
    urgency,
    status: 'pending',
    createdBy: input.requestingUserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  db.referrals.push(referral)

  console.log(`  ✓ Referral created to ${toFacility.name} (${urgency})`)
  return referral
}

/**
 * Trigger emergency escalation
 */
async function triggerEmergencyEscalation(input: TriageOrchestrationInput): Promise<Escalation> {
  const fromFacility = db.facilities.find(f => f.tier === 'sub-centre') || db.facilities[0]
  const toFacility = db.facilities.find(f => f.tier === 'district' || f.tier === 'rural-hospital') || db.facilities[1]

  const escalation: Escalation = {
    id: uuid(),
    patientId: input.patientId,
    patientName: input.patientName,
    reason: `EMERGENCY triage score ${input.score}/100. Flags: ${input.triggeredFlags.join(', ')}. Vitals: ${JSON.stringify(input.vitals || {})}`,
    fromFacilityId: fromFacility.id,
    toFacilityId: toFacility.id,
    toFacilityName: toFacility.name,
    triggeredBy: input.requestingUserName,
    sentTime: new Date().toISOString(),
    status: 'sent',
  }

  db.escalations.push(escalation)

  console.log(`  🚨 Emergency escalation sent to ${toFacility.name}`)
  return escalation
}

/**
 * Alert facility dashboard (creates admin notification)
 */
async function alertFacilityDashboard(input: TriageOrchestrationInput, escalation: Escalation) {
  const admins = db.users.filter(u => u.role === 'admin')
  
  for (const admin of admins) {
    const notification: Notification = {
      id: uuid(),
      userId: admin.id,
      type: 'followup-escalated',
      title: '🚨 Emergency Patient Incoming',
      message: `${input.patientName}, age ${input.age}, score ${input.score}/100. Ambulance requested. ETA unknown.`,
      read: false,
      actionUrl: `/admin/escalations/${escalation.id}`,
      relatedId: escalation.id,
      relatedType: 'patient',
      createdAt: new Date().toISOString(),
    }
    db.notifications.push(notification)
  }

  console.log(`  ✓ Facility dashboard alerted`)
}

/**
 * Send notifications to all stakeholders
 */
async function sendNotifications(input: TriageOrchestrationInput, result: OrchestrationResult) {
  // Patient notifications
  const patientUser = db.users.find(u => u.patientId === input.patientId)
  if (patientUser) {
    for (const msg of result.notifications.patient) {
      db.notifications.push({
        id: uuid(),
        userId: patientUser.id,
        type: result.actions.escalationTriggered ? 'followup-escalated' : 'followup-created',
        title: result.actions.escalationTriggered ? '🚨 Emergency Alert' : 'Care Plan Created',
        message: msg,
        read: false,
        actionUrl: result.actions.teleconsultSessionId 
          ? `/patient/teleconsult` 
          : result.actions.appointmentId
          ? `/patient/appointments`
          : undefined,
        relatedId: result.actions.teleconsultSessionId || result.actions.appointmentId,
        createdAt: new Date().toISOString(),
      })
    }
  }

  // ASHA notifications
  const ashaUsers = db.users.filter(u => u.role === 'asha')
  for (const asha of ashaUsers) {
    for (const msg of result.notifications.asha) {
      db.notifications.push({
        id: uuid(),
        userId: asha.id,
        type: 'followup-created',
        title: `Triage Complete: ${input.patientName}`,
        message: msg,
        read: false,
        actionUrl: `/asha/followup`,
        relatedId: input.triageId,
        createdAt: new Date().toISOString(),
      })
    }
  }

  // Doctor notifications
  if (result.notifications.doctor.length > 0) {
    const doctors = db.users.filter(u => u.role === 'doctor')
    for (const doctor of doctors) {
      for (const msg of result.notifications.doctor) {
        db.notifications.push({
          id: uuid(),
          userId: doctor.id,
          type: 'followup-created',
          title: `${result.priority.toUpperCase()}: ${input.patientName}`,
          message: msg,
          read: false,
          actionUrl: `/doctor/teleconsult`,
          relatedId: result.actions.teleconsultSessionId,
          createdAt: new Date().toISOString(),
        })
      }
    }
  }

  // Admin notifications (already handled in alertFacilityDashboard for emergencies)
  if (result.notifications.admin.length > 0 && !result.actions.escalationTriggered) {
    const admins = db.users.filter(u => u.role === 'admin')
    for (const admin of admins) {
      for (const msg of result.notifications.admin) {
        db.notifications.push({
          id: uuid(),
          userId: admin.id,
          type: 'system',
          title: 'System Alert',
          message: msg,
          read: false,
          createdAt: new Date().toISOString(),
        })
      }
    }
  }

  console.log(`  ✓ Notifications sent to all stakeholders`)
}

/**
 * Map risk level to priority
 */
function mapRiskToPriority(level: RiskLevel): 'routine' | 'priority' | 'urgent' | 'emergency' {
  switch (level) {
    case 'low': return 'routine'
    case 'medium': return 'priority'
    case 'high': return 'urgent'
    case 'emergency': return 'emergency'
  }
}

/**
 * Get orchestration status for a triage
 */
export function getOrchestrationStatus(triageId: string): { processed: boolean } {
  return { processed: processedTriages.has(triageId) }
}

/**
 * Clear processed cache (for testing)
 */
export function clearProcessedCache() {
  processedTriages.clear()
}
