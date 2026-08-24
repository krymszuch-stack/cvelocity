import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { JobApplication, MasterVault } from '../types';
import { UnlockState, deriveUnlocks } from '../lib/uxMilestones';
import {
  getMilestones,
  markShortcutsHintSeen,
  subscribeMilestones,
  syncMilestones,
} from '../store/milestonesStore';

/**
 * Cienkie spięcie logiki odblokowań z Reactem.
 *
 * Cała decyzyjność siedzi w `src/lib/uxMilestones.ts` i jest tam przetestowana
 * bez DOM-u; utrwalanie w `src/store/milestonesStore.ts`. Tutaj zostaje samo
 * połączenie jednego z drugim.
 */
export interface UseUnlocksResult extends UnlockState {
  /** Odhacza jednorazową podpowiedź o skrótach klawiszowych. */
  dismissShortcutsHint: () => void;
}

export function useUnlocks(vault: MasterVault, applications: JobApplication[]): UseUnlocksResult {
  const milestones = useSyncExternalStore(subscribeMilestones, getMilestones, getMilestones);

  // Efekt wyłącznie zgłasza stan sklepowi. Nie ustawia stanu Reacta — o tym,
  // czy trzeba przerysować, decyduje sklep, gdy faktycznie coś dopisze.
  useEffect(() => {
    syncMilestones({ vault, applications });
  }, [vault, applications]);

  const dismissShortcutsHint = useCallback(() => markShortcutsHintSeen(), []);
  const unlocks = useMemo(() => deriveUnlocks(milestones), [milestones]);

  return { ...unlocks, dismissShortcutsHint };
}
