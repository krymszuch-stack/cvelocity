import { useState, useEffect, useCallback } from 'react';
import { NavTabId } from '../components/GlobalShell';

const SIDEBAR_STORAGE_KEY = 'cvelocity_sidebar_collapsed';
const USER_STORAGE_KEY = 'cvelocity_user_session';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
}

interface AppStoreState {
  activeTab: NavTabId;
  sidebarCollapsed: boolean;
  isAdvisorOpen: boolean;
  isTokenModalOpen: boolean;
  isAuthModalOpen: boolean;
  isDesignTokensOpen: boolean;
  advisorInitialQuestion?: string;
  user: UserSession | null;
}

const initialUser: UserSession | null = (() => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();

// In-memory global state subscribers for zero-dependency store
let globalState: AppStoreState = {
  activeTab: 'home',
  sidebarCollapsed: typeof window !== 'undefined'
    ? localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true' ||
      (window.innerWidth >= 1024 && window.innerWidth < 1280)
    : false,
  isAdvisorOpen: false,
  isTokenModalOpen: false,
  isAuthModalOpen: false,
  isDesignTokensOpen: false,
  advisorInitialQuestion: undefined,
  user: initialUser,
};

const listeners = new Set<() => void>();

function setStoreState(updater: Partial<AppStoreState> | ((prev: AppStoreState) => Partial<AppStoreState>)) {
  const nextPartial = typeof updater === 'function' ? updater(globalState) : updater;
  globalState = { ...globalState, ...nextPartial };

  if (nextPartial.sidebarCollapsed !== undefined && typeof window !== 'undefined') {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(globalState.sidebarCollapsed));
  }

  if (nextPartial.user !== undefined && typeof window !== 'undefined') {
    if (nextPartial.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextPartial.user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
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

  const setUser = useCallback((user: UserSession | null) => {
    setStoreState({ user });
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
    setUser,
  };
}
