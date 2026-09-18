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
  apiKey: "AIzaSyCaixDjVKhA8W4viJk4kNGaFbHViy0H0Us",
  authDomain: "swasthyaconnect-4bfa1.firebaseapp.com",
  databaseURL: "https://swasthyaconnect-4bfa1-default-rtdb.firebaseio.com",
  projectId: "swasthyaconnect-4bfa1",
  storageBucket: "swasthyaconnect-4bfa1.firebasestorage.app",
  messagingSenderId: "783756925629",
  appId: "1:783756925629:web:addb9275a5637760eff5d4",
  measurementId: "G-LZLGD6WC4P"
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
