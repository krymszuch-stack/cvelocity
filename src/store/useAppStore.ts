import { useState, useEffect, useCallback } from 'react';
import { NavTabId } from '../components/GlobalShell';
import { StorageKeys, readRaw, writeRaw } from '../lib/storage';

/**
 * Stan interfejsu: co jest otwarte i która zakładka jest aktywna.
 *
 * Świadomie **nie ma tu nic o użytkowniku**. Był tu wcześniej `UserSession`
 * zapisywany do `localStorage` — trzecie źródło prawdy o tożsamości, obok
 * `AuthContext` i sklepu z uprawnieniami. Nic go nie czytało, ale samo jego
 * istnienie już raz doprowadziło do rozjazdu opisanego w `AuthContext.tsx`:
 * modal logowania zapisywał użytkownika w jednym miejscu, a pasek górny czytał
 * go z innego i dalej pokazywał „Zaloguj się".
 *
 * Kto korzysta z aplikacji, wie wyłącznie `src/context/AuthContext.tsx`.
 */
interface AppStoreState {
  activeTab: NavTabId;
  sidebarCollapsed: boolean;
  isAdvisorOpen: boolean;
  isTokenModalOpen: boolean;
  isAuthModalOpen: boolean;
  isDesignTokensOpen: boolean;
  advisorInitialQuestion?: string;
}

// In-memory global state subscribers for zero-dependency store
let globalState: AppStoreState = {
  activeTab: 'home',
  sidebarCollapsed:
    typeof window !== 'undefined'
      ? readRaw(StorageKeys.sidebarCollapsed) === 'true' ||
        (window.innerWidth >= 1024 && window.innerWidth < 1280)
      : false,
  isAdvisorOpen: false,
  isTokenModalOpen: false,
  isAuthModalOpen: false,
  isDesignTokensOpen: false,
  advisorInitialQuestion: undefined,
};

const listeners = new Set<() => void>();

function setStoreState(updater: Partial<AppStoreState> | ((prev: AppStoreState) => Partial<AppStoreState>)) {
  const nextPartial = typeof updater === 'function' ? updater(globalState) : updater;
  globalState = { ...globalState, ...nextPartial };

  if (nextPartial.sidebarCollapsed !== undefined) {
    writeRaw(StorageKeys.sidebarCollapsed, String(globalState.sidebarCollapsed));
  }

  listeners.forEach((listener) => listener());
}

export function useAppStore() {
  const [state, setState] = useState<AppStoreState>(globalState);

  useEffect(() => {
    const listener = () => setState(globalState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setActiveTab = useCallback((activeTab: NavTabId) => {
    setStoreState({ activeTab });
  }, []);

  const toggleSidebar = useCallback(() => {
    setStoreState((prev) => ({ sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const setSidebarCollapsed = useCallback((sidebarCollapsed: boolean) => {
    setStoreState({ sidebarCollapsed });
  }, []);

  const setAdvisorOpen = useCallback((isAdvisorOpen: boolean, advisorInitialQuestion?: string) => {
    setStoreState({ isAdvisorOpen, advisorInitialQuestion });
  }, []);

  const setTokenModalOpen = useCallback((isTokenModalOpen: boolean) => {
    setStoreState({ isTokenModalOpen });
  }, []);

  const setAuthModalOpen = useCallback((isAuthModalOpen: boolean) => {
    setStoreState({ isAuthModalOpen });
  }, []);

  const setDesignTokensOpen = useCallback((isDesignTokensOpen: boolean) => {
    setStoreState({ isDesignTokensOpen });
  }, []);

  return {
    ...state,
    setActiveTab,
    toggleSidebar,
    setSidebarCollapsed,
    setAdvisorOpen,
    setTokenModalOpen,
    setAuthModalOpen,
    setDesignTokensOpen,
  };
}
