import { Router } from 'express'
import db from '../services/db.js'
import { requireAuth } from '../middleware/auth.js'
import { generatePregnancyFollowups, generateNewbornFollowups } from '../services/maternalFollowup.js'

const router = Router()

// ═══════════════════════════════════════════════════════════════
// FAMILY MEMBERS
// ═══════════════════════════════════════════════════════════════

router.get('/family', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const members = await db.familyMembers.getByGuardian(patientId)
    res.json(members)
  } catch (error) {
    console.error('Error fetching family members:', error)
    res.status(500).json({ error: 'Failed to fetch family members' })
  }
})

router.post('/family', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const member = await db.familyMembers.create({
      guardianPatientId: patientId,
      name: req.body.name,
      relationship: req.body.relationship,
      gender: req.body.gender,
      dob: req.body.dob,
      age: req.body.age || 0,
      bloodGroup: req.body.bloodGroup,
      allergies: req.body.allergies || [],
    })
    
    // 🆕 AUTO-GENERATE FOLLOW-UPS FOR NEWBORNS (under 1 year)
    if (req.body.relationship === 'child' && req.body.age < 1) {
      try {
        await generateNewbornFollowups(member.id, patientId)
        console.log(`✅ Auto-generated follow-ups for newborn: ${member.id}`)
      } catch (err) {
        console.error('Failed to generate newborn follow-ups:', err)
      }
    }
    
    res.status(201).json(member)
  } catch (error) {
    console.error('Error creating family member:', error)
    res.status(500).json({ error: 'Failed to create family member' })
  }
})

router.delete('/family/:id', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const success = await db.familyMembers.delete(req.params.id, patientId)
    if (!success) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting family member:', error)
    res.status(500).json({ error: 'Failed to delete family member' })
  }
})

// ═══════════════════════════════════════════════════════════════
// MENSTRUAL CYCLE TRACKER (Female patients only)
// ═══════════════════════════════════════════════════════════════

router.get('/menstrual', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const patient = await db.patients.findById(patientId) as any
    if (!patient || patient.gender !== 'F') {
      return res.status(403).json({ error: 'Access denied' })
    }
    const cycles = await db.menstrualCycles.getByPatient(patientId)
    res.json(cycles)
  } catch (error) {
    console.error('Error fetching menstrual cycles:', error)
    res.status(500).json({ error: 'Failed to fetch menstrual cycles' })
  }
})

router.post('/menstrual', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const patient = await db.patients.findById(patientId) as any
    if (!patient || patient.gender !== 'F') {
      return res.status(403).json({ error: 'Access denied' })
    }
    const cycle = await db.menstrualCycles.create({
      patientId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      cycleLength: req.body.cycleLength,
      flowIntensity: req.body.flowIntensity,
      symptoms: req.body.symptoms || [],
      notes: req.body.notes,
    })
    res.status(201).json(cycle)
  } catch (error) {
    console.error('Error creating menstrual cycle:', error)
    res.status(500).json({ error: 'Failed to create menstrual cycle' })
  }
})

router.delete('/menstrual/:id', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const success = await db.menstrualCycles.delete(req.params.id, patientId)
    if (!success) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting menstrual cycle:', error)
    res.status(500).json({ error: 'Failed to delete menstrual cycle' })
  }
})

// ═══════════════════════════════════════════════════════════════
// PREGNANCY TRACKER (Female patients only)
// ═══════════════════════════════════════════════════════════════

router.get('/pregnancy', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const patient = await db.patients.findById(patientId) as any
    if (!patient || patient.gender !== 'F') {
      return res.status(403).json({ error: 'Access denied' })
    }
    let trackers = await db.pregnancyTrackers.getByPatient(patientId)
    
    // Recalculate current week for active trackers
    trackers = trackers.map((tracker: any) => {
      if (tracker.status === 'active' && tracker.lmp) {
        const lmpDate = new Date(tracker.lmp)
        const now = new Date()
        const diffMs = now.getTime() - lmpDate.getTime()
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
        const currentWeek = Math.max(0, Math.floor(diffDays / 7))
        return { ...tracker, currentWeek }
      }
      return tracker
    })
    
    res.json(trackers)
  } catch (error) {
    console.error('Error fetching pregnancy trackers:', error)
    res.status(500).json({ error: 'Failed to fetch pregnancy trackers' })
  }
})

router.post('/pregnancy', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const patient = await db.patients.findById(patientId) as any
    if (!patient || patient.gender !== 'F') {
      return res.status(403).json({ error: 'Access denied' })
    }
    const tracker = await db.pregnancyTrackers.create({
      patientId,
      lmp: req.body.lmp,
      edd: req.body.edd,
      currentWeek: req.body.currentWeek || 0,
      status: 'active',
    })
    
    // 🆕 AUTO-GENERATE FOLLOW-UPS
    try {
      await generatePregnancyFollowups(tracker.id, patientId)
      console.log(`✅ Auto-generated follow-ups for pregnancy tracker: ${tracker.id}`)
    } catch (err) {
      console.error('Failed to generate pregnancy follow-ups:', err)
      // Don't fail the request if follow-up generation fails
    }
    
    res.status(201).json(tracker)
  } catch (error) {
    console.error('Error creating pregnancy tracker:', error)
    res.status(500).json({ error: 'Failed to create pregnancy tracker' })
  }
})

router.patch('/pregnancy/:id', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const tracker = await db.pregnancyTrackers.update(req.params.id, patientId, req.body)
    if (!tracker) return res.status(404).json({ error: 'Not found' })
    res.json(tracker)
  } catch (error) {
    console.error('Error updating pregnancy tracker:', error)
    res.status(500).json({ error: 'Failed to update pregnancy tracker' })
  }
})

// ═══════════════════════════════════════════════════════════════
// VACCINATION TRACKER (Self + Family)
// ═══════════════════════════════════════════════════════════════

router.get('/vaccinations', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const familyMembers = await db.familyMembers.getByGuardian(patientId)
    const familyMemberIds = familyMembers.map((m: any) => m.id)
    
    const vaccinations = await db.vaccinations.getByPatientAndFamily(patientId, familyMemberIds)
    res.json(vaccinations)
  } catch (error) {
    console.error('Error fetching vaccinations:', error)
    res.status(500).json({ error: 'Failed to fetch vaccinations' })
  }
})

router.post('/vaccinations', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    
    // Validate family member access if provided
    if (req.body.familyMemberId) {
      const members = await db.familyMembers.getByGuardian(patientId)
      const member = members.find((m: any) => m.id === req.body.familyMemberId)
      if (!member) return res.status(403).json({ error: 'Access denied' })
    }
    
    const vaccination = await db.vaccinations.create({
      patientId: req.body.familyMemberId ? undefined : patientId,
      familyMemberId: req.body.familyMemberId,
      vaccineName: req.body.vaccineName,
      scheduledDate: req.body.scheduledDate,
      dueDate: req.body.dueDate,
      status: req.body.status || 'upcoming',
      notes: req.body.notes,
    })
    res.status(201).json(vaccination)
  } catch (error) {
    console.error('Error creating vaccination:', error)
    res.status(500).json({ error: 'Failed to create vaccination' })
  }
})

router.patch('/vaccinations/:id', requireAuth, async (req, res) => {
  try {
    const patientId = req.user!.patientId || req.user!.userId
    const familyMembers = await db.familyMembers.getByGuardian(patientId)
    const familyMemberIds = familyMembers.map((m: any) => m.id)
    
    const vaccination = await db.vaccinations.update(req.params.id, patientId, familyMemberIds, req.body)
    if (!vaccination) return res.status(404).json({ error: 'Not found' })
    
    res.json(vaccination)
  } catch (error) {
    console.error('Error updating vaccination:', error)
    res.status(500).json({ error: 'Failed to update vaccination' })
  }
})

export default router
