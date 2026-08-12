import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  signOut,
  Auth,
  User,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

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
let firestore: Firestore | null = null;

/**
 * Whether a real Firebase project is wired up. `apiKey` is the only field with no
 * usable default, so its absence means sign-in cannot work at all — the UI uses
 * this to disable auth entirely rather than failing after a click.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.appId);
}

// Lazily initialize Firebase on first actual use instead of at module load.
function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

/** SkillVault's single source of truth for persisted data — see src/lib/firestoreVault.ts. */
export function getFirestoreDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp());
  }
  return firestore;
}

export interface AuthUserInfo {
  uid: string;
  email: string;
  displayName: string;
}

function toAuthUserInfo(user: User): AuthUserInfo {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
  };
}

/** Fires immediately with the current user (or null), then on every sign-in/sign-out. */
export function onAuthChange(callback: (user: AuthUserInfo | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), (user) => {
    callback(user ? toAuthUserInfo(user) : null);
  });
}

export async function registerWithEmail(email: string, password: string, fullName: string): Promise<AuthUserInfo> {
  const authInstance = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(authInstance, email.trim().toLowerCase(), password);
  if (fullName.trim()) {
    await updateProfile(credential.user, { displayName: fullName.trim() });
  }
  return toAuthUserInfo(credential.user);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUserInfo> {
  const authInstance = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(authInstance, email.trim().toLowerCase(), password);
  return toAuthUserInfo(credential.user);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const authInstance = getFirebaseAuth();
  await sendPasswordResetEmail(authInstance, email.trim().toLowerCase());
}

export async function signInWithGooglePopup(): Promise<AuthUserInfo> {
  const authInstance = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(authInstance, provider);
  return toAuthUserInfo(result.user);
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
