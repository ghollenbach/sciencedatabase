import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD8ShwPzLbUN9zPs-F3UGepQeNbyyBpAMk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'science-inventory-1bea5.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'science-inventory-1bea5',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'science-inventory-1bea5.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1007462763984',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1007462763984:web:dd26a20bfbc6eea112bdd5',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }
