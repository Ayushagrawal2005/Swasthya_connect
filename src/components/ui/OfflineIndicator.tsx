/**
 * Offline Indicator Component
 * Shows online/offline status and sync progress
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { syncQueueManager } from '../../services/syncQueue'
import { offlineSyncService } from '../../services/offlineSync'
import { useTranslation } from 'react-i18next'

export function OfflineIndicator() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Poll sync status
  useEffect(() => {
    const updateSyncStatus = async () => {
      try {
        const status = await syncQueueManager.getSyncStatus()
        setIsSyncing(status.isSyncing)
        setPendingCount(status.pendingCount)
        setLastSyncTime(status.lastSyncTime)
      } catch (error) {
        console.error('Failed to get sync status:', error)
      }
    }

    updateSyncStatus()
    const interval = setInterval(updateSyncStatus, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Manual sync trigger
  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return
    
    setIsSyncing(true)
    try {
      await syncQueueManager.syncAll()
      setLastSyncTime(Date.now())
      localStorage.setItem('lastSyncTime', Date.now().toString())
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Format last sync time
  const getLastSyncText = () => {
    if (!lastSyncTime) return t('offline.never')
    
    const seconds = Math.floor((Date.now() - lastSyncTime) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Main Indicator Badge */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
            transition-all duration-300 cursor-pointer
            ${isOnline 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl' 
              : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-xl'
            }
          `}
        >
          {/* Icon */}
          <motion.div
            animate={{ rotate: isSyncing ? 360 : 0 }}
            transition={{ duration: 1, repeat: isSyncing ? Infinity : 0, ease: 'linear' }}
          >
            {isSyncing ? (
              <RefreshCw size={16} />
            ) : isOnline ? (
              <Wifi size={16} />
            ) : (
              <WifiOff size={16} />
            )}
          </motion.div>

          {/* Status Text */}
          <span className="text-sm font-medium">
            {isSyncing 
              ? t('offline.syncInProgress')
              : isOnline 
                ? t('common.online') || 'Online'
                : t('offline.youAreOffline')
            }
          </span>

          {/* Pending Count Badge */}
          {pendingCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-white text-red-600 rounded-full px-2 py-0.5 text-xs font-bold"
            >
              {pendingCount}
            </motion.span>
          )}
        </button>

        {/* Detailed Status Panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div className={`p-4 ${isOnline ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {t('offline.title')}
                  </h3>
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 space-y-3">
                {/* Connection Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* Pending Changes */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock size={14} />
                    {t('offline.pendingChanges')}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {pendingCount}
                  </span>
                </div>

                {/* Last Sync */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <CheckCircle size={14} />
                    {t('offline.lastSync')}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {getLastSyncText()}
                  </span>
                </div>

                {/* Sync Button */}
                <button
                  onClick={handleManualSync}
                  disabled={!isOnline || isSyncing}
                  className={`
                    w-full mt-2 py-2 rounded-lg font-medium text-sm
                    transition-all duration-200 flex items-center justify-center gap-2
                    ${isOnline && !isSyncing
                      ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? t('offline.syncInProgress') : t('offline.syncNow')}
                </button>

                {/* Info Message */}
                {!isOnline && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      {t('offline.dataWillSync')}
                    </p>
                  </div>
                )}

                {isOnline && pendingCount === 0 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800">
                      {t('offline.syncSuccess')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
