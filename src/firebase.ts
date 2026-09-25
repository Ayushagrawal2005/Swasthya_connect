/**
 * Firebase Client Configuration
 * Used by the frontend React app for authentication and Firestore access
 */

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCaixDjVKhA8W4viJk4kNGaFbHViy0H0Us",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "swasthyaconnect-4bfa1.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://swasthyaconnect-4bfa1-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "swasthyaconnect-4bfa1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "swasthyaconnect-4bfa1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "783756925629",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:783756925629:web:addb9275a5637760eff5d4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LZLGD6WC4P"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize Analytics only in browser (not during SSR)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
