/**
 * Sync Queue Manager
 * Handles automatic synchronization when online, conflict resolution, and retry logic
 */

import { offlineSyncService } from './offlineSync'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

type ConflictResolution = 'server-wins' | 'client-wins' | 'manual'

class SyncQueueManager {
  private isSyncing = false
  private syncInterval: number | null = null
  private readonly SYNC_INTERVAL_MS = 30000 // 30 seconds
  private readonly MAX_RETRIES = 3

  /**
   * Start automatic sync when online
   */
  startAutoSync(): void {
    if (this.syncInterval) return

    console.log('🔄 Starting auto-sync...')
    
    // Sync immediately
    this.syncAll()

    // Then sync periodically
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.syncAll()
      }
    }, this.SYNC_INTERVAL_MS)

    // Listen for online event
    window.addEventListener('online', () => {
      console.log('🌐 Network online - triggering sync')
      this.syncAll()
    })
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('⏸️ Stopped auto-sync')
    }
  }

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (!navigator.onLine) {
      console.log('📴 Offline - skipping sync')
      return { success: 0, failed: 0 }
    }

    if (this.isSyncing) {
      console.log('⏳ Sync already in progress...')
      return { success: 0, failed: 0 }
    }

    this.isSyncing = true
    console.log('🔄 Starting sync...')

    let successCount = 0
    let failedCount = 0

    try {
      const queueItems = await offlineSyncService.getSyncQueue()
      console.log(`📦 Found ${queueItems.length} items in sync queue`)

      for (const item of queueItems) {
        try {
          // Skip if max retries exceeded
          if (item.retryCount >= this.MAX_RETRIES) {
            console.warn(`⚠️ Max retries exceeded for ${item.id}`)
            failedCount++
            continue
          }

          // Sync item based on operation
          await this.syncItem(item)
          
          // Mark as synced in local storage
          await offlineSyncService.markAsSynced(item.resource, item.data.id)
          
          // Remove from sync queue
          await offlineSyncService.removeFromSyncQueue(item.id)
          
          successCount++
          console.log(`✅ Synced: ${item.id}`)

        } catch (error: any) {
          console.error(`❌ Failed to sync ${item.id}:`, error)
          
          // Update retry count
          await offlineSyncService.updateSyncQueueRetry(
            item.id,
            error.message || 'Unknown error'
          )
          
          failedCount++
        }
      }

      console.log(`✅ Sync complete: ${successCount} success, ${failedCount} failed`)

    } catch (error) {
      console.error('❌ Sync error:', error)
    } finally {
      this.isSyncing = false
    }

    return { success: successCount, failed: failedCount }
  }

  /**
   * Sync a single item to server
   */
  private async syncItem(item: any): Promise<void> {
    const { operation, resource, data } = item

    let endpoint = `${API_BASE}/${resource}`
    let method = 'GET'
    let body: any = undefined

    switch (operation) {
      case 'create':
        method = 'POST'
        body = data
        break
      
      case 'update':
        method = 'PATCH'
        endpoint = `${endpoint}/${data.id}`
        body = data
        break
      
      case 'delete':
        method = 'DELETE'
        endpoint = `${endpoint}/${data.id}`
        break
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Handle conflicts (when server has newer data)
   */
  async resolveConflict(
    localData: any,
    serverData: any,
    strategy: ConflictResolution = 'server-wins'
  ): Promise<any> {
    console.log(`🔀 Resolving conflict with strategy: ${strategy}`)

    switch (strategy) {
      case 'server-wins':
        // Server data takes precedence
        return serverData

      case 'client-wins':
        // Local data takes precedence
        return localData

      case 'manual':
        // Return both - let user decide
        return {
          conflict: true,
          local: localData,
          server: serverData,
          message: 'Manual conflict resolution required',
        }

      default:
        return serverData
    }
  }

  /**
   * Force sync a specific resource
   */
  async forceSyncResource(
    resource: 'patients' | 'visits' | 'referrals' | 'prescriptions'
  ): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline')
    }

    console.log(`🔄 Force syncing ${resource}...`)

    const pendingItems = await offlineSyncService.getPendingSync(resource)
    console.log(`Found ${pendingItems.length} pending ${resource}`)

    for (const item of pendingItems) {
      try {
        // Create sync queue item
        await offlineSyncService.addToSyncQueue('update', resource, item.data || item)
      } catch (error) {
        console.error(`Failed to queue ${resource}/${item.id}:`, error)
      }
    }

    // Trigger sync
    await this.syncAll()
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isOnline: boolean
    isSyncing: boolean
    pendingCount: number
    lastSyncTime: number | null
  }> {
    const stats = await offlineSyncService.getStats()
    
    return {
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
      pendingCount: stats.pendingSync,
      lastSyncTime: localStorage.getItem('lastSyncTime') 
        ? parseInt(localStorage.getItem('lastSyncTime')!) 
        : null,
    }
  }

  /**
   * Clear sync queue (for testing/reset)
   */
  async clearSyncQueue(): Promise<void> {
    const queueItems = await offlineSyncService.getSyncQueue()
    for (const item of queueItems) {
      await offlineSyncService.removeFromSyncQueue(item.id)
    }
    console.log('🧹 Cleared sync queue')
  }
}

// Export singleton instance
export const syncQueueManager = new SyncQueueManager()

// Auto-start sync when module loads
if (typeof window !== 'undefined') {
  syncQueueManager.startAutoSync()
}
