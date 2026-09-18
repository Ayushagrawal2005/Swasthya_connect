import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { notificationsApi, type Notification } from '../../services/api'
import { useNavigate } from 'react-router-dom'

export function NotificationBell() {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  async function fetchUnreadCount() {
    try {
      const { count } = await notificationsApi.getUnreadCount()
      setUnreadCount(count)
    } catch {}
  }

  async function fetchNotifications() {
    setLoading(true)
    try {
      const data = await notificationsApi.list(10)
      setNotifications(data)
    } catch {}
    finally {
      setLoading(false)
    }
  }

  function handleToggle() {
    if (!isOpen) {
      fetchNotifications()
    }
    setIsOpen(!isOpen)
  }

  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  function handleNotificationClick(notif: Notification) {
    if (!notif.read) {
      handleMarkRead(notif.id)
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
      setIsOpen(false)
    }
  }

  const typeIcons: Record<string, string> = {
    'followup-created': '📋',
    'followup-due': '⏰',
    'followup-overdue': '⚠️',
    'followup-completed': '✅',
    'followup-escalated': '🚨',
    'referral-update': '🔄',
    'appointment-reminder': '📅',
    'system': '🔔',
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[#5F5E5A]" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-[#D3D1C7] overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-3 border-b border-[#D3D1C7]">
              <h3 className="font-semibold text-sm text-[#2C2C2A]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-[#5F5E5A]">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-[#5F5E5A]">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <motion.button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full p-3 text-left border-b border-[#D3D1C7]/50 hover:bg-gray-50 transition-colors ${
                      !notif.read ? 'bg-teal-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0 mt-0.5">{typeIcons[notif.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-xs text-[#2C2C2A] truncate">{notif.title}</p>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[#5F5E5A] line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-[#5F5E5A] mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkRead(notif.id)
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                          aria-label="Mark as read"
                        >
                          <X size={14} className="text-[#5F5E5A]" />
                        </button>
                      )}
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
