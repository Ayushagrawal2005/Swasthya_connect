/**
 * Maternal & Child Health Follow-up Automation
 * Generates follow-ups every 15 days for:
 * - Pregnant women
 * - Newborn children (0-1 year)
 */

import db from './db.js'
import { FieldValue } from 'firebase-admin/firestore'

// Get an available ASHA worker (round-robin or least loaded)
export async function getAvailableAshaWorker() {
  const ashas = await db.users.getByRole('asha')
  if (ashas.length === 0) {
    throw new Error('No ASHA workers available')
  }
  
  // Get follow-up counts for each ASHA
  const ashaCounts = await Promise.all(
    ashas.map(async (asha: any) => {
      const followups = await db.followups.getByAssignee(asha.id) // Use 'id' not 'userId'
      const pending = followups.filter((f: any) => f.status === 'pending').length
      return { asha, pending }
    })
  )
  
  // Return ASHA with least pending follow-ups
  ashaCounts.sort((a, b) => a.pending - b.pending)
  return ashaCounts[0].asha
}

// Create notification for user
export async function createNotification(userId: string, data: {
  type: string
  title: string
  message: string
  actionUrl?: string
  relatedId?: string
  relatedType?: string
}) {
  await db.notifications.create({
    userId,
    type: data.type,
    title: data.title,
    message: data.message,
    read: false,
    actionUrl: data.actionUrl,
    relatedId: data.relatedId,
    relatedType: data.relatedType,
    createdAt: new Date().toISOString()
  })
}

// Generate pregnancy follow-ups (every 15 days until delivery)
export async function generatePregnancyFollowups(trackerId: string, patientId: string) {
  try {
    console.log(`🤰 Generating pregnancy follow-ups for tracker: ${trackerId}`)
    
    // Get tracker details
    const tracker = await db.pregnancyTrackers.getById(trackerId) as any
    if (!tracker || tracker.status !== 'active') {
      console.log('Tracker not active, skipping')
      return
    }
    
    // Get patient details
    const patient = await db.patients.findById(patientId) as any
    if (!patient) {
      console.log('Patient not found')
      return
    }
    
    // Get assigned ASHA worker
    const asha = await getAvailableAshaWorker() as any
    
    // Calculate weeks pregnant
    const lmp = new Date(tracker.lmp)
    const edd = new Date(tracker.edd)
    const now = new Date()
    const weeksPregnant = Math.floor((now.getTime() - lmp.getTime()) / (7 * 24 * 60 * 60 * 1000))
    
    // Generate follow-ups every 15 days (2 weeks) until delivery
    const followups = []
    let nextDate = new Date(now)
    nextDate.setDate(nextDate.getDate() + 15) // First follow-up in 15 days
    
    // Create 6 follow-ups (covering ~3 months)
    for (let i = 0; i < 6; i++) {
      if (nextDate < edd) {
        const followup = await db.followups.create({
          patientId,
          patientName: patient.name,
          age: patient.age,
          phone: patient.phone,
          condition: `Pregnancy - Week ${weeksPregnant + (i * 2)}`,
          risk: weeksPregnant >= 35 ? 'high' : 'medium',
          dueDate: nextDate.toISOString().split('T')[0],
          status: 'pending',
          notes: `Routine antenatal checkup. Monitor health, provide nutrition advice, check for complications.`,
          nextStep: 'Home visit for health assessment',
          lastVisit: new Date().toISOString().split('T')[0],
          assignedTo: asha.userId,
          assignedToName: asha.name,
          sourcePortal: 'maternal-health',
          sourceId: trackerId,
          createdAt: new Date().toISOString()
        })
        
        followups.push(followup)
        nextDate = new Date(nextDate.getTime() + 15 * 24 * 60 * 60 * 1000)
      }
    }
    
    console.log(`✅ Created ${followups.length} pregnancy follow-ups`)
    
    // Notify ASHA worker
    await createNotification(asha.id, {
      type: 'followup_assigned',
      title: '🤰 New Pregnancy Follow-ups Assigned',
      message: `${followups.length} follow-ups created for ${patient.name} (pregnant, week ${weeksPregnant})`,
      actionUrl: '/asha/followup',
      relatedId: trackerId,
      relatedType: 'pregnancy_tracker'
    })
    
    // Notify patient (if they have a user account)
    const patientUser = await db.users.getByPatientId(patientId) as any
    if (patientUser) {
      await createNotification(patientUser.id, {
        type: 'followup_scheduled',
        title: '📅 Health Check-ups Scheduled',
        message: `Your ASHA worker ${asha.name} will visit every 15 days for antenatal care`,
        actionUrl: '/patient/home',
        relatedId: trackerId,
        relatedType: 'pregnancy_tracker'
      })
    }
    
    return followups
  } catch (error) {
    console.error('Error generating pregnancy follow-ups:', error)
    throw error
  }
}

// Generate newborn follow-ups (every 15 days for first 6 months)
export async function generateNewbornFollowups(familyMemberId: string, guardianPatientId: string) {
  try {
    console.log(`👶 Generating newborn follow-ups for child: ${familyMemberId}`)
    
    // Get child details
    const child = await db.familyMembers.getById(familyMemberId) as any
    if (!child) {
      console.log('Child not found')
      return
    }
    
    // Get guardian details
    const guardian = await db.patients.findById(guardianPatientId) as any
    if (!guardian) {
      console.log('Guardian not found')
      return
    }
    
    // Check if child is under 1 year old
    const dob = new Date(child.dob)
    const ageMonths = Math.floor((Date.now() - dob.getTime()) / (30 * 24 * 60 * 60 * 1000))
    
    console.log(`   Child age: ${ageMonths} months`)
    
    if (ageMonths > 12) {
      console.log('Child is over 1 year old, skipping automatic follow-ups')
      return
    }
    
    // Get assigned ASHA worker
    const asha = await getAvailableAshaWorker() as any
    
    // Generate follow-ups every 15 days for 6 months
    const followups = []
    let nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 15)
    
    console.log(`   Generating 12 follow-ups starting from ${nextDate.toISOString().split('T')[0]}`)
    
    for (let i = 0; i < 12; i++) { // 12 follow-ups = 6 months
      console.log(`   Creating follow-up ${i + 1}/12...`)
      const followup = await db.followups.create({
        patientId: guardianPatientId,
        patientName: `${child.name} (child of ${guardian.name})`,
        age: child.age,
        phone: guardian.phone,
        condition: `Newborn Care - ${ageMonths + i} months`,
        risk: ageMonths < 2 ? 'high' : 'medium',
        dueDate: nextDate.toISOString().split('T')[0],
        status: 'pending',
        notes: `Newborn health checkup. Monitor growth, feeding, vaccinations. Check for danger signs.`,
        nextStep: 'Home visit for child health assessment',
        lastVisit: new Date().toISOString().split('T')[0],
        assignedTo: asha.id,
        assignedToName: asha.name,
        sourcePortal: 'child-health',
        sourceId: familyMemberId,
        createdAt: new Date().toISOString()
      })
      
      followups.push(followup)
      nextDate = new Date(nextDate.getTime() + 15 * 24 * 60 * 60 * 1000)
    }
    
    console.log(`✅ Created ${followups.length} newborn follow-ups`)
    
    // Notify ASHA worker
    await createNotification(asha.id, {
      type: 'followup_assigned',
      title: '👶 New Newborn Follow-ups Assigned',
      message: `${followups.length} follow-ups created for ${child.name} (${ageMonths} months old)`,
      actionUrl: '/asha/followup',
      relatedId: familyMemberId,
      relatedType: 'family_member'
    })
    
    // Notify guardian
    const guardianUser = await db.users.getByPatientId(guardianPatientId) as any
    if (guardianUser) {
      await createNotification(guardianUser.id, {
        type: 'followup_scheduled',
        title: '📅 Baby Health Check-ups Scheduled',
        message: `ASHA worker ${asha.name} will visit every 15 days to check ${child.name}'s health`,
        actionUrl: '/patient/family',
        relatedId: familyMemberId,
        relatedType: 'family_member'
      })
    }
    
    return followups
  } catch (error) {
    console.error('Error generating newborn follow-ups:', error)
    throw error
  }
}
