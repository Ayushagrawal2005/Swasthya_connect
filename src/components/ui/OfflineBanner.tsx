import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export function OfflineBanner() {
  const { pendingSyncCount } = useApp()

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <WifiOff size={14} aria-hidden="true" />
      <span>Offline mode</span>
      <span className="mx-1 opacity-40">·</span>
      {pendingSyncCount > 0 ? (
        <span className="inline-flex items-center gap-1 text-amber-100">
          <RefreshCw size={12} className="animate-spin" aria-hidden="true" />
          {pendingSyncCount} action{pendingSyncCount > 1 ? 's' : ''} queued — will sync when connected
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-amber-100">
          <CheckCircle size={12} aria-hidden="true" />
          All records saved locally — syncing when connected
        </span>
      )}
    </div>
  )
}
