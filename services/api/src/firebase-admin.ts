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
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://swasthyaconnect-4bfa1-default-rtdb.firebaseio.com',
    storageBucket: 'swasthyaconnect-4bfa1.firebasestorage.app'
  })
  console.log('✓ Firebase Admin initialized with service account')
}

export const db = getFirestore()
export const auth = getAuth()
export const storage = getStorage()

// Firestore settings
db.settings({ ignoreUndefinedProperties: true })
