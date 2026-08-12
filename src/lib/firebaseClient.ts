import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, deleteUser, signOut, Auth } from 'firebase/auth';

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
 * Sign out Firebase user on logout (ADR-81)
 */
export async function signOutFirebaseUser(): Promise<void> {
  if (!firebaseConfig.apiKey) return;
  const authInstance = getFirebaseAuth();
  if (authInstance.currentUser) {
    await signOut(authInstance);
  }
}

/**
 * Delete current Firebase Auth user with email verification safety check (ADR-81)
 */
export async function deleteCurrentFirebaseUser(expectedEmail?: string): Promise<void> {
  if (!firebaseConfig.apiKey) return;
  const authInstance = getFirebaseAuth();
  const currentUser = authInstance.currentUser;
  if (currentUser) {
    if (expectedEmail && currentUser.email && currentUser.email.toLowerCase() !== expectedEmail.toLowerCase()) {
      console.warn(`Pominęto usunięcie konta Firebase: currentUser (${currentUser.email}) nie zgadza się z kasowanym kontem (${expectedEmail}).`);
      return;
    }
    await deleteUser(currentUser);
  }
}
