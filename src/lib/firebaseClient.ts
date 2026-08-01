import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, deleteUser } from 'firebase/auth';

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

export const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
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
  const currentUser = auth.currentUser;
  if (currentUser) {
    await deleteUser(currentUser);
  }
}
