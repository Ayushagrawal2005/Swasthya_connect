/**
 * Offline Sync Service
 * Manages IndexedDB storage and background sync for offline-first functionality
 */

import { openDB, type IDBPDatabase } from 'idb'

type SyncStatus = 'pending' | 'synced'
type DataStore = 'patients' | 'visits' | 'referrals' | 'prescriptions'

interface BaseRecord {
  id: string
  data: any
  syncStatus: SyncStatus
  lastModified: number
}

interface VisitRecord {
  id: string
  ashaId: string
  date: string
  visits: any[]
  syncStatus: SyncStatus
  lastModified: number
}

interface SyncQueueItem {
  id: string
  operation: 'create' | 'update' | 'delete'
  resource: DataStore
  data: any
  timestamp: number
  retryCount: number
  error?: string
}

class OfflineSyncService {
  private db: IDBPDatabase<any> | null = null
  private readonly DB_NAME = 'swasthya-connect-db'
  private readonly DB_VERSION = 1

  async init(): Promise<void> {
    try {
      this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('patients'))      db.createObjectStore('patients', { keyPath: 'id' })
          if (!db.objectStoreNames.contains('visits'))        db.createObjectStore('visits', { keyPath: 'id' })
          if (!db.objectStoreNames.contains('referrals'))     db.createObjectStore('referrals', { keyPath: 'id' })
          if (!db.objectStoreNames.contains('prescriptions')) db.createObjectStore('prescriptions', { keyPath: 'id' })
          if (!db.objectStoreNames.contains('syncQueue'))     db.createObjectStore('syncQueue', { keyPath: 'id' })
        },
      })
      console.log('✅ Offline database initialized')
    } catch (error) {
      console.error('❌ Failed to initialize offline database:', error)
    }
  }

  private ensureDb(): IDBPDatabase<any> {
    if (!this.db) throw new Error('DB not initialized — call offlineSyncService.init() first')
    return this.db
  }

  async save(store: DataStore, id: string, data: any, syncStatus: SyncStatus = 'pending'): Promise<void> {
    const db = this.ensureDb()
    const record: BaseRecord = { id, data, syncStatus, lastModified: Date.now() }
    await db.put(store, record)
  }

  async get(store: DataStore, id: string): Promise<BaseRecord | null> {
    const db = this.ensureDb()
    return (await db.get(store, id)) ?? null
  }

  async getAll(store: DataStore): Promise<BaseRecord[]> {
    const db = this.ensureDb()
    return await db.getAll(store)
  }

  async getPendingSync(store: DataStore): Promise<BaseRecord[]> {
    const all = await this.getAll(store)
    return all.filter(item => item.syncStatus === 'pending')
  }

  async delete(store: DataStore, id: string): Promise<void> {
    const db = this.ensureDb()
    await db.delete(store, id)
  }

  async addToSyncQueue(
    operation: 'create' | 'update' | 'delete',
    resource: DataStore,
    data: any
  ): Promise<void> {
    const db = this.ensureDb()
    const item: SyncQueueItem = {
      id: `${resource}-${operation}-${Date.now()}`,
      operation, resource, data,
      timestamp: Date.now(),
      retryCount: 0,
    }
    await db.add('syncQueue', item)
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = this.ensureDb()
    return await db.getAll('syncQueue')
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const db = this.ensureDb()
    await db.delete('syncQueue', id)
  }

  async updateSyncQueueRetry(id: string, error: string): Promise<void> {
    const db = this.ensureDb()
    const item: SyncQueueItem | undefined = await db.get('syncQueue', id)
    if (item) {
      item.retryCount += 1
      item.error = error
      await db.put('syncQueue', item)
    }
  }

  async markAsSynced(store: DataStore, id: string): Promise<void> {
    const db = this.ensureDb()
    const record: BaseRecord | undefined = await db.get(store, id)
    if (record) {
      record.syncStatus = 'synced'
      record.lastModified = Date.now()
      await db.put(store, record)
    }
  }

  async getStats(): Promise<{ patients: number; visits: number; referrals: number; prescriptions: number; pendingSync: number }> {
    const db = this.ensureDb()
    const [patients, visits, referrals, prescriptions, syncQueue] = await Promise.all([
      db.count('patients'), db.count('visits'), db.count('referrals'),
      db.count('prescriptions'), db.count('syncQueue'),
    ])
    return { patients, visits, referrals, prescriptions, pendingSync: syncQueue }
  }

  async clearAll(): Promise<void> {
    const db = this.ensureDb()
    await Promise.all([
      db.clear('patients'), db.clear('visits'), db.clear('referrals'),
      db.clear('prescriptions'), db.clear('syncQueue'),
    ])
  }
}

export const offlineSyncService = new OfflineSyncService()
