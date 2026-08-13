import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AuthProvider, useAuth } from '../AuthContext';
import { signOutFirebaseUser } from '../../lib/firebaseClient';
import { clearLegacyLocalData } from '../../lib/legacyVaultMigration';

// Mock firebaseClient
vi.mock('../../lib/firebaseClient', () => {
  let authCallback: ((user: any) => void) | null = null;
  return {
    isFirebaseConfigured: () => true,
    onAuthChange: (cb: (user: any) => void) => {
      authCallback = cb;
      // Immediately invoke with a mock user
      cb({ uid: 'test-user-123', email: 'test@example.com', displayName: 'Test User' });
      return () => {
        authCallback = null;
      };
    },
    signOutFirebaseUser: vi.fn(() => Promise.resolve()),
    registerWithEmail: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithGooglePopup: vi.fn(),
    deleteCurrentFirebaseUser: vi.fn(),
  };
});

// Mock firestoreVault
vi.mock('../../lib/firestoreVault', () => ({
  loadVaultFromFirestore: vi.fn(() => Promise.resolve({
    version: '1',
    updatedAt: new Date().toISOString(),
    personalInfo: { fullName: 'Test User', email: 'test@example.com' },
  })),
  saveVaultToFirestore: vi.fn(() => Promise.resolve()),
  deleteVaultFromFirestore: vi.fn(() => Promise.resolve()),
}));

// Mock legacyVaultMigration
vi.mock('../../lib/legacyVaultMigration', () => ({
  findLegacyVaultForEmail: vi.fn(() => null),
  clearLegacyLocalData: vi.fn(),
}));

describe('AuthContext Logout and Cleanup', () => {
  let sessionStorageMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    let sessionStore: Record<string, string> = {
      'temp-key': 'temp-value',
    };

    sessionStorageMock = {
      getItem: (key: string) => sessionStore[key] || null,
      setItem: (key: string, val: string) => {
        sessionStore[key] = val;
      },
      removeItem: (key: string) => {
        delete sessionStore[key];
      },
      clear: vi.fn(() => {
        sessionStore = {};
      }),
    };

    vi.stubGlobal('sessionStorage', sessionStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clears sessionStorage, calls clearLegacyLocalData, and resets state on logout', async () => {
    let logoutFn: any = null;
    let currentUser: any = null;
    let currentUserVault: any = null;

    const TestConsumer = () => {
      const { logout, user, userVault } = useAuth();
      logoutFn = logout;
      currentUser = user;
      currentUserVault = userVault;
      return null;
    };

    renderToString(
      React.createElement(AuthProvider, null, React.createElement(TestConsumer))
    );

    // Call logout
    await logoutFn();

    // Verify signOutFirebaseUser was called
    expect(signOutFirebaseUser).toHaveBeenCalled();

    // Verify sessionStorage.clear was called
    expect(sessionStorageMock.clear).toHaveBeenCalled();

    // Verify clearLegacyLocalData was called
    expect(clearLegacyLocalData).toHaveBeenCalled();

    // Verify state variables are cleared immediately
    expect(currentUser).toBeNull();
    expect(currentUserVault).toBeNull();
  });
});
