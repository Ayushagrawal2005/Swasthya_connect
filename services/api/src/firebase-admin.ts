/**
 * Firebase Admin SDK Configuration
 * Used by the backend for server-side Firestore operations
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import * as path from 'path'
import * as fs from 'fs'

// Load service account key
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json')
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

// Initialize Firebase Admin with service account
if (getApps().length === 0) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: 'https://swasthyaconnect-4bfa1-default-rtdb.firebaseio.com',
      storageBucket: 'swasthyaconnect-4bfa1.firebasestorage.app'
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

// Firestore settings with retry configuration
db.settings({ 
  ignoreUndefinedProperties: true,
  // Add connection retry settings
  maxIdleChannels: 1,
  keepaliveTime: 30000, // 30 seconds
})

// Test connection with retry logic
async function testFirestoreConnection(retries = 3, delay = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Try a simple read operation
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
        console.log('   → Check internet connection and Firebase project status')
        console.log('   → Application will continue but database operations may fail')
      }
    }
  }
}

// Test connection on startup (non-blocking)
testFirestoreConnection().catch(() => {
  console.log('⚠️ Warning: Firestore connection test failed. App will continue but may have database issues.')
})
