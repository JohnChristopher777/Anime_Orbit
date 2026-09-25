import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';

const requiredPublicConfig = (name: string, value: unknown) => {
  const normalized = String(value || "").trim();
  if (!normalized) throw new Error(`Missing required Firebase configuration: ${name}`);
  return normalized;
};

const projectId = requiredPublicConfig(
  "VITE_FIREBASE_PROJECT_ID",
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
);
const configuredAuthDomain = String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim();

// Keep OAuth on Firebase's canonical helper domain. The application itself
// remains on animeorbit.web.app, but Google validates this exact callback:
// https://<project-id>.firebaseapp.com/__/auth/handler
// A web.app value is ignored here because it causes redirect_uri_mismatch
// unless that second callback was manually added to the Google OAuth client.
const canonicalAuthDomain = `${projectId}.firebaseapp.com`;
const authDomain = configuredAuthDomain.endsWith(".firebaseapp.com")
  ? configuredAuthDomain
  : canonicalAuthDomain;

const firebaseConfig = {
    apiKey: requiredPublicConfig("VITE_FIREBASE_API_KEY", import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain,
    projectId,
    storageBucket: requiredPublicConfig("VITE_FIREBASE_STORAGE_BUCKET", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: requiredPublicConfig("VITE_FIREBASE_MESSAGING_SENDER_ID", import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: requiredPublicConfig("VITE_FIREBASE_APP_ID", import.meta.env.VITE_FIREBASE_APP_ID),
    measurementId: String(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "").trim() || undefined,
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
