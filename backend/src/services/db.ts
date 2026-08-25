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
  async findById(id: string) {
    const doc = await db.collection('users').doc(id).get()
    return doc.exists ? { id: doc.id, ...doc.data() } : null
  },
  async getAll() {
    const snap = await db.collection('users').get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
    const ref = await db.collection('visits').add({
      ...visitData, patientId, createdAt: FieldValue.serverTimestamp()
    })
    await db.collection('patients').doc(patientId).update({ updatedAt: FieldValue.serverTimestamp() })
    return { id: ref.id, ...visitData }
  },
  async getVisits(patientId: string) {
    const snap = await db.collection('visits').where('patientId', '==', patientId).get()
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return sortByField(docs, 'date', 'desc')
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
  async markDone(id: string) { return this.updateStatus(id, 'completed') }
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

// ─── default export ──────────────────────────────────────────────────────────

export default {
  users:          usersDb,
  patients:       patientsDb,
  facilities:     facilitiesDb,
  doctors:        doctorsDb,
  appointments:   appointmentsDb,
  triage:         triageDb,
  referrals:      referralsDb,
  followups:      followupsDb,
  medicalRecords: medicalRecordsDb,
  inventory:      inventoryDb,
  chronic:        chronicDb,
  diagnostics:    diagnosticsDb,
  escalations:    escalationsDb,
  ivr:            ivrDb,
}
