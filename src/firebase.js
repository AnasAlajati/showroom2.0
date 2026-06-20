import { initializeApp } from 'firebase/app'
import { getFirestore }  from 'firebase/firestore'
import { getStorage }    from 'firebase/storage'

// Paste your Firebase project config here
// Firebase console → Project Settings → Your apps → SDK setup → Config
const firebaseConfig = {
  apiKey: "AIzaSyDXrX2k9hlAprM-R8ZR0eF_4AVt-SW5D7Y",
  authDomain: "showroom2-fc0f9.firebaseapp.com",
  projectId: "showroom2-fc0f9",
  storageBucket: "showroom2-fc0f9.firebasestorage.app",
  messagingSenderId: "468852512430",
  appId: "1:468852512430:web:9491b879480cff1c39bf3f",
  measurementId: "G-900DS1X2DB"
};

const app = initializeApp(firebaseConfig)
export const db      = getFirestore(app)
export const storage = getStorage(app)
