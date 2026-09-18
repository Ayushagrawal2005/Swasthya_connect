/**
 * Follow-up Status Updater
 * Runs periodically to update followup statuses based on dueDate
 */
import { db } from '../store/index.js'
import { notifyFollowUpDueSoon, notifyFollowUpOverdue } from './notifications.js'

export function updateFollowUpStatuses(): void {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()
  
  db.followUps.forEach(f => {
    // Skip completed/cancelled/escalated
    if (f.status === 'completed' || f.status === 'cancelled' || f.status === 'escalated') {
      return
    }
    
    const wasOverdue = f.status === 'overdue'
    const wasDueToday = f.status === 'due-today'
    
    // Update status based on dueDate
    if (f.dueDate < today) {
      f.status = 'overdue'
      f.updatedAt = now
      // Notify if newly overdue
      if (!wasOverdue) {
        notifyFollowUpOverdue(f)
      }
    } else if (f.dueDate === today) {
      f.status = 'due-today'
      f.updatedAt = now
    } else {
      f.status = 'upcoming'
      f.updatedAt = now
    }
    
    // Check reminder schedule
    if (f.reminderSchedule?.includes(today)) {
      const alreadySent = f.lastReminderSentAt?.split('T')[0] === today
      if (!alreadySent) {
        notifyFollowUpDueSoon(f)
        f.lastReminderSentAt = now
        f.reminderCount = (f.reminderCount || 0) + 1
      }
    }
  })
}

// Run every 6 hours
export function startFollowUpUpdater(): NodeJS.Timeout {
  updateFollowUpStatuses() // Run immediately
  return setInterval(updateFollowUpStatuses, 6 * 60 * 60 * 1000)
}
