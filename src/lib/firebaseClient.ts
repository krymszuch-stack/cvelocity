import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSySkillVaultDummyKey",
  authDomain: "skillvault-99a72.firebaseapp.com",
  projectId: "skillvault-99a72",
  storageBucket: "skillvault-99a72.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:skillvault123"
};

export const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  const result = await signInWithPopup(auth, provider);
  return {
    email: result.user.email || '',
    displayName: result.user.displayName || 'Użytkownik Google',
    photoURL: result.user.photoURL || '',
    uid: result.user.uid
  };
}
