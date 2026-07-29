import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Real Firebase project config for skillvault-99a72
const firebaseConfig = {
  apiKey: "AIzaSyDBE_a8xB4m0_-WJr_EhARoxJsBpybaXos",
  authDomain: "skillvault-99a72.firebaseapp.com",
  projectId: "skillvault-99a72",
  storageBucket: "skillvault-99a72.firebasestorage.app",
  messagingSenderId: "119882965044",
  appId: "1:119882965044:web:3f44122d880bdd87c8ea61",
  measurementId: "G-9FC7HQRSVT",
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
