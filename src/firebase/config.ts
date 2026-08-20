import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';

// Resilient Firebase configuration with embedded default keys ensuring zero invalid-api-key errors across all deployments
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBhH8xG5J5cz3E6KGKbqJ3bC-i64WSLyXA",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shonen-anime-db.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shonen-anime-db",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shonen-anime-db.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "467498744963",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:467498744963:web:047174d1607200734cafb6",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SZP17R9Z4T"
};

// Initialize Firebase safely
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Initialize Cloud Firestore with resilient long-polling to prevent network assertion drops
export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    });
  } catch {
    return getFirestore(app);
  }
})();

export default app;
