/**
 * Firebase Admin SDK Configuration
 * Used by the backend for server-side Firestore operations
 *
 * Supports two modes:
 * 1. Local dev: reads serviceAccountKey.json file
 * 2. Production (Render): reads FIREBASE_SERVICE_ACCOUNT_KEY env var (base64 encoded JSON)
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import * as path from 'path'
import * as fs from 'fs'

// ─── Load service account ────────────────────────────────────────────────────
let serviceAccount: object

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // Production: base64-encoded JSON set as environment variable on Render
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
    serviceAccount = JSON.parse(decoded)
    console.log('✓ Firebase service account loaded from environment variable')
  } catch (e) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var:', e)
    throw e
  }
} else {
  // Local dev: read from file
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json')
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `serviceAccountKey.json not found at ${serviceAccountPath}.\n` +
      `For production, set the FIREBASE_SERVICE_ACCOUNT_KEY environment variable.\n` +
      `For local dev, place serviceAccountKey.json in services/api/`
    )
  }
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
  console.log('✓ Firebase service account loaded from file')
}

// ─── Initialize Firebase Admin ───────────────────────────────────────────────
if (getApps().length === 0) {
  try {
    initializeApp({
      credential: cert(serviceAccount as any),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://swasthyaconnect-4bfa1-default-rtdb.firebaseio.com',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'swasthyaconnect-4bfa1.firebasestorage.app'
    })
    console.log('✓ Firebase Admin initialized with service account')
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error)
    throw error
  }
}

export const db = getFirestore()
export const auth = getAuth()
export const storage = getStorage()

// Firestore settings
db.settings({
  ignoreUndefinedProperties: true,
  maxIdleChannels: 1,
  keepaliveTime: 30000,
})

// Test connection with retry logic
async function testFirestoreConnection(retries = 3, delay = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await db.collection('_connection_test').limit(1).get()
      console.log('✓ Firestore connection verified')
      return
    } catch (error: any) {
      console.warn(`⚠️ Firestore connection attempt ${attempt}/${retries} failed:`, error.message)
      if (attempt < retries) {
        console.log(`   Retrying in ${delay/1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        console.error('❌ Firestore connection failed after all retries')
        console.log('   → Application will continue but database operations may fail')
      }
    }
  }
}

testFirestoreConnection().catch(() => {
  console.log('⚠️ Warning: Firestore connection test failed.')
})
