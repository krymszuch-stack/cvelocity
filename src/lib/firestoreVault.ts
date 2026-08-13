import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from './firebaseClient';
import { MasterVault } from '../types';

/**
 * SkillVault's single persisted vault store. One document per signed-in user,
 * keyed by their Firebase Auth uid — see firestore.rules for the access rule
 * that keeps a user's document readable/writable only by that same uid.
 */
const VAULTS_COLLECTION = 'vaults';

export async function loadVaultFromFirestore(uid: string): Promise<MasterVault | null> {
  const ref = doc(getFirestoreDb(), VAULTS_COLLECTION, uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  // The doc wraps the vault under `vault` alongside bookkeeping fields (updatedAt server timestamp).
  return (data?.vault as MasterVault) ?? null;
}

export async function saveVaultToFirestore(uid: string, vault: MasterVault): Promise<void> {
  const ref = doc(getFirestoreDb(), VAULTS_COLLECTION, uid);
  await setDoc(ref, { vault, updatedAt: serverTimestamp() });
}

export async function deleteVaultFromFirestore(uid: string): Promise<void> {
  const ref = doc(getFirestoreDb(), VAULTS_COLLECTION, uid);
  await deleteDoc(ref);
}
