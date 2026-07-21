import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const app = isFirebaseConfigured
  ? getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  : null;

let firestoreDb = null;
if (app) {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (err) {
    console.warn("Firestore offline persistence failed, falling back to default:", err);
    firestoreDb = getFirestore(app);
  }
}

export const db   = firestoreDb;
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Analytics — only in browser environments that support it
export let analytics = null;
if (app) {
  isSupported().then((ok) => { if (ok) analytics = getAnalytics(app); });
}

// Waits for Firebase Auth to initialize before proceeding with Firestore operations
export async function ensureFirebaseSession() {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged((user) => {
      unsub();
      resolve(user);
    });
  });
}
