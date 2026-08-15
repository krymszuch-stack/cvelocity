import { useState, useEffect } from 'react';

export interface Subscription {
  status: 'free' | 'trialing' | 'active' | 'cancelled';
  customerId?: string;
  sku?: string;
  trialEndsAt?: string;
}

export interface Usage {
  importUses: number; // Free: 1 import/mc
  aiUses: number;     // Free: 5 AI/mc
  monthKey: string;   // "2026-08"
}

export interface AuthStoreState {
  user: { id: string; email: string } | null;
  subscription: Subscription;
  usage: Usage;
}

const STORAGE_KEY = 'cvelocity-auth-state';
const FREE_IMPORTS = 1;
const FREE_AI_USES = 5;

const getMonthKey = () => new Date().toISOString().slice(0, 7);

const loadInitialState = (): AuthStoreState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      subscription: { status: 'free' },
      usage: { importUses: FREE_IMPORTS, aiUses: FREE_AI_USES, monthKey: getMonthKey() },
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: AuthStoreState = JSON.parse(saved);
      // Check month reset
      if (parsed.usage.monthKey !== getMonthKey()) {
        parsed.usage = {
          importUses: FREE_IMPORTS,
          aiUses: FREE_AI_USES,
          monthKey: getMonthKey(),
        };
      }
      return parsed;
    }
  } catch {
    // fallback
  }

  return {
    user: null,
    subscription: { status: 'free' },
    usage: { importUses: FREE_IMPORTS, aiUses: FREE_AI_USES, monthKey: getMonthKey() },
  };
};

let globalAuthState: AuthStoreState = loadInitialState();
const listeners = new Set<() => void>();

function setStore(updater: (prev: AuthStoreState) => AuthStoreState) {
  globalAuthState = updater(globalAuthState);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalAuthState));
  }
  listeners.forEach((l) => l());
}

export function useAuthStore() {
  const [state, setState] = useState<AuthStoreState>(globalAuthState);

  useEffect(() => {
    const listener = () => setState(globalAuthState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setSubscription = (s: Partial<Subscription>) => {
    setStore((prev) => ({
      ...prev,
      subscription: { ...prev.subscription, ...s },
    }));
  };

  const consumeImport = (): boolean => {
    if (globalAuthState.subscription.status === 'active' || globalAuthState.subscription.status === 'trialing') {
      return true; // Pro = unlimited
    }
    if (globalAuthState.usage.importUses <= 0) {
      return false; // Limit reached -> open StripeCheckoutModal
    }
    setStore((prev) => ({
      ...prev,
      usage: { ...prev.usage, importUses: prev.usage.importUses - 1 },
    }));
    return true;
  };

  const consumeAi = (): boolean => {
    if (globalAuthState.subscription.status === 'active' || globalAuthState.subscription.status === 'trialing') {
      return true; // Pro = unlimited
    }
    if (globalAuthState.usage.aiUses <= 0) {
      return false; // Limit reached -> open StripeCheckoutModal
    }
    setStore((prev) => ({
      ...prev,
      usage: { ...prev.usage, aiUses: prev.usage.aiUses - 1 },
    }));
    return true;
  };

  const resetUsageIfNewMonth = () => {
    if (globalAuthState.usage.monthKey !== getMonthKey()) {
      setStore((prev) => ({
        ...prev,
        usage: {
          importUses: FREE_IMPORTS,
          aiUses: FREE_AI_USES,
          monthKey: getMonthKey(),
        },
      }));
    }
  };

  return {
    ...state,
    setSubscription,
    consumeImport,
    consumeAi,
    resetUsageIfNewMonth,
  };
}
