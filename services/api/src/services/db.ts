/**
 * Firestore Database Service Layer
 *
 * RULE: Never use orderBy() after where() — Firestore requires composite
 * indexes for that and they take time to build. Instead, fetch with just
 * where() and sort in memory. Only use orderBy() on collection-level
 * queries with NO where() clauses (those use the default single-field index).
 */

import { db } from '../firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// ─── helpers ────────────────────────────────────────────────────────────────

function sortByCreatedAt(docs: any[], dir: 'asc' | 'desc' = 'desc') {
  return docs.sort((a, b) => {
    const ta = a.createdAt?._seconds ?? 0
    const tb = b.createdAt?._seconds ?? 0
    return dir === 'desc' ? tb - ta : ta - tb
  })
}

function sortByField(docs: any[], field: string, dir: 'asc' | 'desc' = 'asc') {
  return docs.sort((a, b) => {
    const va = a[field] ?? ''
    const vb = b[field] ?? ''
    return dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })
}

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

export const usersDb = {
  async create(data: any) {
    const ref = await db.collection('users').add({
      ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async findByUsername(username: string) {
    const snap = await db.collection('users').where('username', '==', username).limit(1).get()
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  },
  async findByEmail(email: string) {
    const snap = await db.collection('users').where('email', '==', email).limit(1).get()
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  },
  async findById(id: string) {
    const doc = await db.collection('users').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },
  async getAll() {
    const snap = await db.collection('users').get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },
  async update(id: string, data: any) {
    await db.collection('users').doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() })
    return this.findById(id)
  },
  async getByRole(role: string) {
    const snap = await db.collection('users').where('role', '==', role).get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },
  async getByPatientId(patientId: string) {
    const snap = await db.collection('users').where('patientId', '==', patientId).limit(1).get()
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  }
}

// ═══════════════════════════════════════════════════════════════
// PATIENTS
// ═══════════════════════════════════════════════════════════════

export const patientsDb = {
  async create(data: any) {
    const ref = await db.collection('patients').add({
      ...data, visits: [], medications: [], diseaseHistory: [],
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async findById(id: string) {
    const doc = await db.collection('patients').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },
  async search(query: string) {
    const snap = await db.collection('patients').get()
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    if (!query) return all
    const q = query.toLowerCase()
    return all.filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      p.healthId?.toLowerCase().includes(q) ||
      p.phone?.includes(query)
    )
  },
  async addVisit(patientId: string, visitData: any) {
    // Vitals recorded in a visit are valid for 10 days then considered stale.
    // We store an explicit expiresAt ISO string so the read side can filter easily.
    const VITALS_TTL_DAYS = 10
    const expiresAt = new Date(Date.now() + VITALS_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const ref = await db.collection('visits').add({
      ...visitData,
      patientId,
      expiresAt,                           // 10-day TTL on vitals
      createdAt: FieldValue.serverTimestamp(),
    })
    await db.collection('patients').doc(patientId).update({ updatedAt: FieldValue.serverTimestamp() })
    return { id: ref.id, ...visitData, expiresAt }
  },
  async getVisits(patientId: string) {
    const snap = await db.collection('visits').where('patientId', '==', patientId).get()
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    // Filter out visits whose vitals have expired (expiresAt in the past).
    // Visits without an expiresAt field (legacy) are kept.
    const now = new Date().toISOString()
    const valid = docs.filter((d: any) => !d.expiresAt || d.expiresAt > now)
    return sortByField(valid, 'date', 'desc')
  },
  async getLatestVitals(patientId: string) {
    // Return the most-recent non-expired visit that actually carries vitals.
    const snap = await db.collection('visits').where('patientId', '==', patientId).get()
    const now   = new Date().toISOString()
    const docs  = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(d => d.vitals && Object.keys(d.vitals).length > 0)   // must have vitals
      .filter(d => !d.expiresAt || d.expiresAt > now)               // must not be expired
    if (docs.length === 0) return null
    // Sort newest first by date or createdAt
    docs.sort((a: any, b: any) => {
      const ta = a.date || (a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000).toISOString() : '')
      const tb = b.date || (b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000).toISOString() : '')
      return tb > ta ? 1 : -1
    })
    const latest = docs[0]
    return {
      vitals:    latest.vitals,
      date:      latest.date || null,
      expiresAt: latest.expiresAt || null,
      visitId:   latest.id,
    }
  },
  async update(id: string, data: any) {
    await db.collection('patients').doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() })
    return this.findById(id)
  }
}

// ═══════════════════════════════════════════════════════════════
// FACILITIES
// ═══════════════════════════════════════════════════════════════

export const facilitiesDb = {
  async create(data: any) {
    const ref = await db.collection('facilities').add({ ...data, createdAt: FieldValue.serverTimestamp() })
    return { id: ref.id, ...data }
  },
  async getAll() {
    const snap = await db.collection('facilities').get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },
  async getAllWithDoctors() {
    const facilities = await this.getAll()
    return Promise.all(facilities.map(async (f: any) => ({
      ...f, doctors: await doctorsDb.getByFacility(f.id)
    })))
  },
  async findById(id: string) {
    const doc = await db.collection('facilities').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  }
}

// ═══════════════════════════════════════════════════════════════
// DOCTORS
// ═══════════════════════════════════════════════════════════════

export const doctorsDb = {
  async create(data: any) {
    const ref = await db.collection('doctors').add({ ...data, createdAt: FieldValue.serverTimestamp() })
    return { id: ref.id, ...data }
  },
  async getByFacility(facilityId: string) {
    // Single where() — no orderBy needed, no composite index required
    const snap = await db.collection('doctors').where('facilityId', '==', facilityId).get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },
  async findById(id: string) {
    const doc = await db.collection('doctors').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },
  async updateAvailability(id: string, available: boolean, slotsToday?: number) {
    await db.collection('doctors').doc(id).update({
      available,
      ...(slotsToday !== undefined && { slotsToday }),
      updatedAt: FieldValue.serverTimestamp()
    })
    return this.findById(id)
  },
  async getAll() {
    const snap = await db.collection('doctors').get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }
}

// ═══════════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════════

export const appointmentsDb = {
  async create(data: any) {
    const ref = await db.collection('appointments').add({
      ...data, status: data.status || 'scheduled', createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async findById(id: string) {
    const doc = await db.collection('appointments').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },
  async list(filters: any = {}) {
    // Build query with ONLY where() clauses — no orderBy to avoid index requirement
    let query: any = db.collection('appointments')
    if (filters.patientId)  query = query.where('patientId',  '==', filters.patientId)
    if (filters.bookedBy)   query = query.where('bookedBy',   '==', filters.bookedBy)
    if (filters.facilityId) query = query.where('facilityId', '==', filters.facilityId)
    if (filters.date)       query = query.where('date',       '==', filters.date)

    const snap = await query.get()
    const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    return sortByCreatedAt(docs, 'desc')
  },
  async updateStatus(id: string, status: string) {
    await db.collection('appointments').doc(id).update({ status, updatedAt: FieldValue.serverTimestamp() })
    return this.findById(id)
  },
  async getQueuePosition(facilityId: string, date: string) {
    const snap = await db.collection('appointments')
      .where('facilityId', '==', facilityId)
      .where('date', '==', date)
      .get()
    return snap.size + 1
  }
}

// ═══════════════════════════════════════════════════════════════
// TRIAGE SESSIONS
// ═══════════════════════════════════════════════════════════════

export const triageDb = {
  async create(data: any) {
    const ref = await db.collection('triage_sessions').add({ ...data, createdAt: FieldValue.serverTimestamp() })
    return { id: ref.id, ...data }
  },
  async findById(id: string) {
    const doc = await db.collection('triage_sessions').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },
  async getByPatient(patientId: string) {
    const snap = await db.collection('triage_sessions').where('patientId', '==', patientId).get()
    return sortByCreatedAt(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'desc')
  },
  async getAll() {
    // No where() so a single orderBy is fine (uses default index)
    const snap = await db.collection('triage_sessions').orderBy('createdAt', 'desc').limit(100).get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }
}

// ═══════════════════════════════════════════════════════════════
// REFERRALS
// ═══════════════════════════════════════════════════════════════

export const referralsDb = {
  async create(data: any) {
    const ref = await db.collection('referrals').add({
      ...data, status: data.status || 'pending',
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async findById(id: string) {
    const doc = await db.collection('referrals').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },
  async list(filters: any = {}) {
    let query: any = db.collection('referrals')
    if (filters.toFacilityId)   query = query.where('toFacilityId',   '==', filters.toFacilityId)
    if (filters.fromFacilityId) query = query.where('fromFacilityId', '==', filters.fromFacilityId)
    if (filters.patientId)      query = query.where('patientId',      '==', filters.patientId)
    if (filters.status)         query = query.where('status',         '==', filters.status)
    // No orderBy — sort in memory
    const snap = await query.get()
    return sortByCreatedAt(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })), 'desc')
  },
  async updateStatus(id: string, status: string) {
    await db.collection('referrals').doc(id).update({ status, updatedAt: FieldValue.serverTimestamp() })
    return this.findById(id)
  },
  async accept(id: string) { return this.updateStatus(id, 'accepted') }
}

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UPS
// ═══════════════════════════════════════════════════════════════

export const followupsDb = {
  async create(data: any) {
    const ref = await db.collection('followups').add({
      ...data, status: data.status || 'pending', createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async list(filters: any = {}) {
    let query: any = db.collection('followups')
    if (filters.assignedTo) query = query.where('assignedTo', '==', filters.assignedTo)
    if (filters.status)     query = query.where('status',     '==', filters.status)
    // No orderBy — sort by dueDate in memory
    const snap = await query.get()
    const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    return sortByField(docs, 'dueDate', 'asc')
  },
  async updateStatus(id: string, status: string) {
    const update: any = { status, updatedAt: FieldValue.serverTimestamp() }
    if (status === 'completed') update.completedAt = FieldValue.serverTimestamp()
    await db.collection('followups').doc(id).update(update)
    const doc = await db.collection('followups').doc(id).get()
    return { id: doc.id, ...doc.data() }
  },
  async markDone(id: string) { return this.updateStatus(id, 'completed') },
  async getByAssignee(userId: string) {
    const snap = await db.collection('followups').where('assignedTo', '==', userId).get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }
}

// ═══════════════════════════════════════════════════════════════
// CONSULTATIONS
// ═══════════════════════════════════════════════════════════════

export const consultationsDb = {
  async create(data: any) {
    const ref = await db.collection('consultations').add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { id: ref.id, ...data }
  },
  async getByPatient(patientId: string) {
    const snap = await db.collection('consultations')
      .where('patientId', '==', patientId)
      .get()
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return sortByCreatedAt(docs, 'desc')
  },
  async findById(id: string) {
    const doc = await db.collection('consultations').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },
  async update(id: string, data: any) {
    await db.collection('consultations').doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })
    const doc = await db.collection('consultations').doc(id).get()
    return { id: doc.id, ...doc.data() }
  },
}

// ═══════════════════════════════════════════════════════════════
// MEDICAL RECORDS
// ═══════════════════════════════════════════════════════════════

export const medicalRecordsDb = {
  async create(data: any) {
    const ref = await db.collection('medical_records').add({ ...data, createdAt: FieldValue.serverTimestamp() })
    return { id: ref.id, ...data }
  },
  async getByPatient(patientId: string, type?: string) {
    let query: any = db.collection('medical_records').where('patientId', '==', patientId)
    if (type) query = query.where('type', '==', type)
    // No orderBy — sort in memory
    const snap = await query.get()
    return sortByCreatedAt(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })), 'desc')
  }
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════

export const inventoryDb = {
  async create(data: any) {
    const ref = await db.collection('inventory').add({ ...data, createdAt: FieldValue.serverTimestamp() })
    return { id: ref.id, ...data }
  },
  async list(facilityId?: string) {
    let query: any = db.collection('inventory')
    if (facilityId) query = query.where('facilityId', '==', facilityId)
    const snap = await query.get()
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
  },
  async update(id: string, data: any) {
    await db.collection('inventory').doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() })
    const doc = await db.collection('inventory').doc(id).get()
    return { id: doc.id, ...doc.data() }
  }
}

// ═══════════════════════════════════════════════════════════════
// CHRONIC PATIENTS
// ═══════════════════════════════════════════════════════════════

export const chronicDb = {
  async create(data: any) {
    const ref = await db.collection('chronic_patients').add({
      ...data, readings: [], checkups: [], alerts: [], createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async findById(id: string) {
    const doc = await db.collection('chronic_patients').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },
  async list(filters: any = {}) {
    let query: any = db.collection('chronic_patients')
    if (filters.alertLevel) query = query.where('alertLevel', '==', filters.alertLevel)
    const snap = await query.get()
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
  },
  async addReading(id: string, reading: any) {
    await db.collection('chronic_patients').doc(id).update({
      readings: FieldValue.arrayUnion(reading), updatedAt: FieldValue.serverTimestamp()
    })
    return this.findById(id)
  }
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTIC ORDERS
// ═══════════════════════════════════════════════════════════════

export const diagnosticsDb = {
  async create(data: any) {
    const ref = await db.collection('diagnostic_orders').add({
      ...data, status: data.status || 'pending', createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async list(filters: any = {}) {
    let query: any = db.collection('diagnostic_orders')
    if (filters.facilityId) query = query.where('facilityId', '==', filters.facilityId)
    if (filters.status)     query = query.where('status',     '==', filters.status)
    if (filters.patientId)  query = query.where('patientId',  '==', filters.patientId)
    const snap = await query.get()
    return sortByCreatedAt(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })), 'desc')
  },
  async updateStatus(id: string, data: any) {
    await db.collection('diagnostic_orders').doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() })
    const doc = await db.collection('diagnostic_orders').doc(id).get()
    return { id: doc.id, ...doc.data() }
  }
}

// ═══════════════════════════════════════════════════════════════
// ESCALATIONS
// ═══════════════════════════════════════════════════════════════

export const escalationsDb = {
  async create(data: any) {
    const ref = await db.collection('escalations').add({
      ...data, status: 'pending', createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async list() {
    // No where() — single orderBy is fine
    const snap = await db.collection('escalations').orderBy('createdAt', 'desc').limit(50).get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },
  async acknowledge(id: string) {
    await db.collection('escalations').doc(id).update({
      status: 'acknowledged', acknowledgedAt: FieldValue.serverTimestamp()
    })
    const doc = await db.collection('escalations').doc(id).get()
    return { id: doc.id, ...doc.data() }
  },
  async markArrived(id: string) {
    await db.collection('escalations').doc(id).update({
      status: 'arrived', arrivedAt: FieldValue.serverTimestamp()
    })
    const doc = await db.collection('escalations').doc(id).get()
    return { id: doc.id, ...doc.data() }
  }
}

// ═══════════════════════════════════════════════════════════════
// IVR CASES
// ═══════════════════════════════════════════════════════════════

export const ivrDb = {
  async create(data: any) {
    const ref = await db.collection('ivr_cases').add({
      ...data, caseId: `IVR${Date.now()}`, createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async list() {
    // No where() — single orderBy is fine
    const snap = await db.collection('ivr_cases').orderBy('createdAt', 'desc').limit(100).get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }
}

// ═══════════════════════════════════════════════════════════════
// WELLNESS - FAMILY MEMBERS
// ═══════════════════════════════════════════════════════════════

export const familyMembersDb = {
  async create(data: any) {
    const ref = await db.collection('family_members').add({
      ...data, createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async getByGuardian(guardianPatientId: string) {
    const snap = await db.collection('family_members')
      .where('guardianPatientId', '==', guardianPatientId)
      .get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },
  async getById(id: string) {
    const doc = await db.collection('family_members').doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() }
  },
  async delete(id: string, guardianPatientId: string) {
    // Verify ownership before delete
    const doc = await db.collection('family_members').doc(id).get()
    if (!doc.exists) return false
    const data = doc.data()
    if (data?.guardianPatientId !== guardianPatientId) return false
    await db.collection('family_members').doc(id).delete()
    return true
  }
}

// ═══════════════════════════════════════════════════════════════
// WELLNESS - MENSTRUAL CYCLES
// ═══════════════════════════════════════════════════════════════

export const menstrualCyclesDb = {
  async create(data: any) {
    const ref = await db.collection('menstrual_cycles').add({
      ...data, createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async getByPatient(patientId: string) {
    const snap = await db.collection('menstrual_cycles')
      .where('patientId', '==', patientId)
      .get()
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return sortByField(docs, 'startDate', 'desc')
  },
  async delete(id: string, patientId: string) {
    // Verify ownership before delete
    const doc = await db.collection('menstrual_cycles').doc(id).get()
    if (!doc.exists) return false
    const data = doc.data()
    if (data?.patientId !== patientId) return false
    await db.collection('menstrual_cycles').doc(id).delete()
    return true
  }
}

// ═══════════════════════════════════════════════════════════════
// WELLNESS - PREGNANCY TRACKERS
// ═══════════════════════════════════════════════════════════════

export const pregnancyTrackersDb = {
  async create(data: any) {
    const ref = await db.collection('pregnancy_trackers').add({
      ...data,
      checkups: [],
      complications: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async getByPatient(patientId: string) {
    const snap = await db.collection('pregnancy_trackers')
      .where('patientId', '==', patientId)
      .get()
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return sortByCreatedAt(docs, 'desc')
  },
  async update(id: string, patientId: string, data: any) {
    // Verify ownership
    const doc = await db.collection('pregnancy_trackers').doc(id).get()
    if (!doc.exists) return null
    const existing = doc.data()
    if (existing?.patientId !== patientId) return null
    
    await db.collection('pregnancy_trackers').doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    })
    const updated = await db.collection('pregnancy_trackers').doc(id).get()
    return { id: updated.id, ...updated.data() }
  },
  async getById(id: string) {
    const doc = await db.collection('pregnancy_trackers').doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() }
  }
}

// ═══════════════════════════════════════════════════════════════
// WELLNESS - VACCINATIONS
// ═══════════════════════════════════════════════════════════════

export const vaccinationsDb = {
  async create(data: any) {
    const ref = await db.collection('vaccinations').add({
      ...data, createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async getByPatientAndFamily(patientId: string, familyMemberIds: string[]) {
    // Get self vaccinations
    const selfSnap = await db.collection('vaccinations')
      .where('patientId', '==', patientId)
      .get()
    const selfVax = selfSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    // Get family vaccinations if any family members exist
    let familyVax: any[] = []
    if (familyMemberIds.length > 0) {
      // Firestore 'in' query supports max 10 values
      const chunks = []
      for (let i = 0; i < familyMemberIds.length; i += 10) {
        chunks.push(familyMemberIds.slice(i, i + 10))
      }
      
      for (const chunk of chunks) {
        const snap = await db.collection('vaccinations')
          .where('familyMemberId', 'in', chunk)
          .get()
        familyVax.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }
    }
    
    const all = [...selfVax, ...familyVax]
    return sortByField(all, 'dueDate', 'asc')
  },
  async update(id: string, patientId: string, familyMemberIds: string[], data: any) {
    // Verify ownership
    const doc = await db.collection('vaccinations').doc(id).get()
    if (!doc.exists) return null
    const existing = doc.data()
    
    const isOwned = existing?.patientId === patientId || 
                    (existing?.familyMemberId && familyMemberIds.includes(existing.familyMemberId))
    
    if (!isOwned) return null
    
    await db.collection('vaccinations').doc(id).update(data)
    const updated = await db.collection('vaccinations').doc(id).get()
    return { id: updated.id, ...updated.data() }
  }
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export const notificationsDb = {
  async create(data: any) {
    const ref = await db.collection('notifications').add({
      ...data,
      read: false,
      createdAt: FieldValue.serverTimestamp()
    })
    return { id: ref.id, ...data }
  },
  async getByUser(userId: string, limit: number = 50) {
    const snap = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },
  async markAsRead(id: string, userId: string) {
    // Verify ownership
    const doc = await db.collection('notifications').doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()
    if (data?.userId !== userId) return null
    
    await db.collection('notifications').doc(id).update({ read: true })
    return { id, ...data, read: true }
  },
  async markAllAsRead(userId: string) {
    const snap = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get()
    
    const batch = db.batch()
    snap.docs.forEach(doc => {
      batch.update(doc.ref, { read: true })
    })
    await batch.commit()
    return snap.size
  }
}


// ─── default export ──────────────────────────────────────────────────────────

export default {
  users:            usersDb,
  patients:         patientsDb,
  facilities:       facilitiesDb,
  doctors:          doctorsDb,
  appointments:     appointmentsDb,
  triage:           triageDb,
  referrals:        referralsDb,
  followups:        followupsDb,
  consultations:    consultationsDb,
  medicalRecords:   medicalRecordsDb,
  inventory:        inventoryDb,
  chronic:          chronicDb,
  diagnostics:      diagnosticsDb,
  escalations:      escalationsDb,
  ivr:              ivrDb,
  familyMembers:    familyMembersDb,
  menstrualCycles:  menstrualCyclesDb,
  pregnancyTrackers: pregnancyTrackersDb,
  vaccinations:     vaccinationsDb,
  notifications:    notificationsDb,
}


// ═══════════════════════════════════════════════════════════════
// CONSENTS
// ═══════════════════════════════════════════════════════════════

export const consentsDb = {
  async create(data: any) {
    const ref = await db.collection('consents').add({
      ...data,
      status: data.status || 'ACTIVE',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { id: ref.id, ...data }
  },

  async findById(id: string) {
    const doc = await db.collection('consents').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },

  async getByPatient(patientId: string, includeHistory = false) {
    let query: any = db.collection('consents').where('patientId', '==', patientId)
    
    if (!includeHistory) {
      // Only active consents
      query = query.where('status', 'in', ['ACTIVE', 'PENDING'])
    }

    const snap = await query.get()
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return sortByCreatedAt(docs, 'desc')
  },

  async getActiveConsent(
    patientId: string,
    recipientId: string,
    dataCategory: string
  ): Promise<any | null> {
    try {
      const snap = await db
        .collection('consents')
        .where('patientId', '==', patientId)
        .where('recipientId', '==', recipientId)
        .where('dataCategory', '==', dataCategory)
        .where('status', '==', 'ACTIVE')
        .limit(1)
        .get()

      if (snap.empty) return null

      const consent = { id: snap.docs[0].id, ...snap.docs[0].data() }

      // Check if expired
      if (consent.expiresAt) {
        const expiryDate = new Date(consent.expiresAt)
        if (expiryDate < new Date()) {
          // Auto-expire
          await this.expireConsent(consent.id)
          return null
        }
      }

      return consent
    } catch (error) {
      console.error('Error checking consent:', error)
      return null
    }
  },

  async revokeConsent(consentId: string, revokedBy: string) {
    await db.collection('consents').doc(consentId).update({
      status: 'REVOKED',
      revokedAt: FieldValue.serverTimestamp(),
      revokedBy,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return this.findById(consentId)
  },

  async expireConsent(consentId: string) {
    await db.collection('consents').doc(consentId).update({
      status: 'EXPIRED',
      updatedAt: FieldValue.serverTimestamp(),
    })
    return this.findById(consentId)
  },

  async update(id: string, data: any) {
    await db.collection('consents').doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return this.findById(id)
  },

  /**
   * Check if a user has valid consent to access patient data
   */
  async hasValidConsent(
    patientId: string,
    recipientId: string,
    dataCategory: string
  ): Promise<boolean> {
    const consent = await this.getActiveConsent(patientId, recipientId, dataCategory)
    return consent !== null
  },
}

// ═══════════════════════════════════════════════════════════════
// SCHEMES
// ═══════════════════════════════════════════════════════════════

export const schemesDb = {
  async create(data: any) {
    const ref = await db.collection('schemes').add({
      ...data,
      active: data.active !== undefined ? data.active : true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { id: ref.id, ...data }
  },

  async findById(id: string) {
    const doc = await db.collection('schemes').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },

  async getAllActive() {
    const snap = await db.collection('schemes').where('active', '==', true).get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async getByState(state: string) {
    const snap = await db
      .collection('schemes')
      .where('active', '==', true)
      .where('state', 'in', [state, 'ALL', 'National', ''])
      .get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async update(id: string, data: any) {
    await db.collection('schemes').doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return this.findById(id)
  },

  async bulkCreate(schemes: any[]) {
    const batch = db.batch()
    const refs: any[] = []

    for (const scheme of schemes) {
      const ref = db.collection('schemes').doc()
      batch.set(ref, {
        ...scheme,
        active: scheme.active !== undefined ? scheme.active : true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      refs.push({ id: ref.id, ...scheme })
    }

    await batch.commit()
    return refs
  },
}
