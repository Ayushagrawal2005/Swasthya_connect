/**
 * Real-time Referral Notification Bell
 * Shows unread referral notifications with dropdown
 */

import { useState, useEffect } from 'react'
import { Bell, X, MapPin, ArrowRight, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { referralNotificationService, type ReferralNotification } from '../../services/referralManagement'
import { useNavigate } from 'react-router-dom'

export function ReferralNotificationBell() {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<ReferralNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadNotifications() {
    try {
      const count = await referralNotificationService.getUnreadCount()
      setUnreadCount(count.count)

      if (count.count > 0) {
        const notifs = await referralNotificationService.getNotifications({
          unreadOnly: true
        })
        setNotifications(notifs.slice(0, 5)) // Show latest 5
      }
    } catch (error) {
      // Silent fail - don't block UI
      console.error('Failed to load notifications:', error)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await referralNotificationService.markAsRead(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  async function markAllAsRead() {
    setLoading(true)
    try {
      await referralNotificationService.markAllAsRead()
      setNotifications([])
      setUnreadCount(0)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  function getIcon(type: ReferralNotification['type']) {
    switch (type) {
      case 'new_referral':
        return <Bell size={14} className="text-teal-600" />
      case 'urgent_action':
        return <Clock size={14} className="text-red-600" />
      case 'arrival_alert':
        return <MapPin size={14} className="text-blue-600" />
      default:
        return <Bell size={14} className="text-gray-600" />
    }
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label={`${unreadCount} unread referral notifications`}
      >
        <Bell size={20} className="text-[#5F5E5A]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border-2 border-[#D3D1C7] z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#D3D1C7]">
                <div>
                  <h3 className="font-bold text-[#2C2C2A]">Referral Notifications</h3>
                  <p className="text-xs text-[#5F5E5A]">{unreadCount} unread</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
                  >
                    {loading ? 'Marking...' : 'Mark all read'}
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[#5F5E5A]">
                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#D3D1C7]">
                    {notifications.map((notif, index) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                          notif.priority === 'high'
                            ? 'border-l-red-500'
                            : notif.priority === 'normal'
                            ? 'border-l-blue-500'
                            : 'border-l-gray-300'
                        }`}
                        onClick={() => {
                          markAsRead(notif.id)
                          // Navigate based on notification type
                          if (notif.type === 'new_referral') {
                            navigate('/doctor/referrals')
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#2C2C2A] leading-relaxed">
                              {notif.message}
                            </p>
                            <p className="text-xs text-[#5F5E5A] mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(notif.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notif.id)
                            }}
                            className="text-[#5F5E5A] hover:text-[#2C2C2A] p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-[#D3D1C7] text-center">
                  <button
                    onClick={() => {
                      navigate('/doctor/referrals')
                      setIsOpen(false)
                    }}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-1 mx-auto"
                  >
                    View all referrals
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
