import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, deleteUser, Auth } from 'firebase/auth';

// Firebase project configuration loaded securely from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "skillvault-99a72.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "skillvault-99a72",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "skillvault-99a72.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Whether a real Firebase project is wired up. `apiKey` is the only field with no
 * usable default, so its absence means Google sign-in cannot work at all — the UI
 * uses this to disable the button up front rather than failing after a click.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.appId);
}

// Lazily initialize Firebase on first actual use instead of at module load.
// With no VITE_FIREBASE_API_KEY configured (e.g. a fresh checkout with no .env),
// getAuth() throws synchronously — doing that eagerly at module scope used to
// crash the entire app before React ever rendered anything.
function getFirebaseAuth(): Auth {
  if (!auth) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
}

export async function signInWithGooglePopup() {
  const authInstance = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(authInstance, provider);
  return {
    email: result.user.email || '',
    displayName: result.user.displayName || 'Użytkownik Google',
    photoURL: result.user.photoURL || '',
    uid: result.user.uid,
  };
}

/**
 * Delete current Firebase Auth user (removes account from Firebase Auth)
 */
export async function deleteCurrentFirebaseUser(): Promise<void> {
  if (!firebaseConfig.apiKey) return; // Firebase not configured — nothing to delete there
  const authInstance = getFirebaseAuth();
  const currentUser = authInstance.currentUser;
  if (currentUser) {
    await deleteUser(currentUser);
  }
}
