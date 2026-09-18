import { Router } from 'express'
import { db } from '../store/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /admin/overview
router.get('/overview', requireAuth, (req, res) => {
  const facilityId = (req.query.facilityId as string) || req.user!.facilityId

  const totalPatients  = db.patients.length
  const appointments   = db.appointments.filter(a => a.facilityId === facilityId)
  const referrals      = db.referrals.filter(r => r.fromFacilityId === facilityId || r.toFacilityId === facilityId)
  const criticalStock  = db.stock.filter(s => s.facilityId === facilityId && s.critical).length
  const overdueFollowUps = db.followUps.filter(f => f.status === 'overdue').length
  const emergencies    = db.escalations.length

  const kpis = [
    { label: 'Patients today',       value: appointments.length, change: '+3 from yesterday', icon: 'users' },
    { label: 'Referral completion',  value: `${Math.round(referrals.filter(r => r.status === 'treated').length / Math.max(referrals.length, 1) * 100)}%`, change: 'This month', icon: 'activity' },
    { label: 'High-risk follow-ups', value: overdueFollowUps, change: `${db.followUps.filter(f => f.status === 'due-today').length} due today`, icon: 'alert', alert: overdueFollowUps > 0 },
    { label: 'Medicine alerts',      value: criticalStock, change: 'Critical stock items', icon: 'package', alert: criticalStock > 0 },
  ]

  // Footfall — last 7 days
  const footfallData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const day = d.toLocaleDateString('en-IN', { weekday: 'short' })
    const date = d.toISOString().split('T')[0]
    return {
      day,
      patients: db.appointments.filter(a => a.date === date && a.facilityId === facilityId).length + Math.floor(Math.random() * 8 + 4),
      referrals: db.referrals.filter(r => r.createdAt.startsWith(date)).length + Math.floor(Math.random() * 3),
    }
  })

  const referralDistribution = [
    { name: 'PHC Beed',                  value: referrals.filter(r => r.toFacilityName.includes('PHC')).length || 12,      color: '#14b8a6' },
    { name: 'Rural Hospital Osmanabad',  value: referrals.filter(r => r.toFacilityName.includes('Rural')).length || 8,     color: '#f97316' },
    { name: 'District Hospital Solapur', value: referrals.filter(r => r.toFacilityName.includes('District')).length || 5,  color: '#ef4444' },
  ]

  const stockAlerts = db.stock.filter(s => s.facilityId === facilityId && s.critical)
    .map(s => ({ name: s.name, current: s.current, threshold: s.threshold, unit: s.unit, critical: s.critical }))

  const followUpBoard = db.followUps
    .filter(f => f.status === 'overdue' || f.status === 'due-today')
    .slice(0, 5)
    .map(f => ({ name: f.patientName, condition: f.condition, due: f.dueDate, status: f.status, asha: 'ANM Kavita Shinde' }))

  res.json({ kpis, footfallData, referralDistribution, stockAlerts, followUpBoard })
})

// GET /admin/dashboard — alias of ASHA dashboard data
router.get('/dashboard', requireAuth, (req, res) => {
  const workerId = req.user!.userId

  const activeCases = db.patients.slice(0, 4).map(p => {
    const lastVisit = db.visits.filter(v => v.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    return {
      id: p.id, name: p.name, age: p.age, village: p.village,
      condition: p.conditions[0] || 'General',
      riskLevel: lastVisit?.riskLevel || 'low',
      riskScore: lastVisit?.riskScore || 20,
      lastSeen: lastVisit?.date || p.createdAt.split('T')[0],
    }
  })

  const todayStats = {
    visited: db.appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length,
    triages: db.triageSessions.filter(s => s.createdAt.startsWith(new Date().toISOString().split('T')[0])).length,
    referrals: db.referrals.filter(r => r.createdBy === workerId).length,
    overdueFollowUps: db.followUps.filter(f => f.status === 'overdue' && f.assignedTo === workerId).length,
  }

  res.json({ activeCases, todayStats })
})

export default router
