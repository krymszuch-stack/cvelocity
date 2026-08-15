import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MasterVault, TokenStats } from './types';
import { createEmptyVault } from './lib/sampleVault';
import { loadVaultFromLocalStorage, saveVaultToLocalStorage, clearVaultLocalStorage } from './lib/vaultCrypto';
import { getActiveSessionUser, loadUserVault } from './lib/auth';
import { semanticCacheInstance } from './lib/semanticCache';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './providers/ThemeProvider';
import { useAppStore } from './store/useAppStore';
import { AuthModal } from './components/AuthModal';
import { GlobalShell, NavTabId } from './components/GlobalShell';
import { TokenStatsWidget } from './components/TokenStatsWidget';
import { CommandPalette } from './components/CommandPalette';
import { Skeleton } from './components/ui/Skeleton';
import { HomeView } from './views/HomeView';

// Lazy-loaded heavy views for fast initial bundle & LCP
const JobMatcher = lazy(() => import('./components/JobMatcher').then((m) => ({ default: m.JobMatcher })));
const MasterVaultEditor = lazy(() => import('./components/MasterVaultEditor').then((m) => ({ default: m.MasterVaultEditor })));
const ProfilerSection = lazy(() => import('./components/ProfilerSection').then((m) => ({ default: m.ProfilerSection })));
const CVParserModal = lazy(() => import('./components/CVParserModal').then((m) => ({ default: m.CVParserModal })));
const GeminiAdvisorModal = lazy(() => import('./components/GeminiAdvisorModal').then((m) => ({ default: m.GeminiAdvisorModal })));
const ApplicationTracker = lazy(() => import('./views/ApplicationTracker').then((m) => ({ default: m.ApplicationTracker })));
const PricingView = lazy(() => import('./views/PricingView').then((m) => ({ default: m.PricingView })));
const DesignTokensShowcaseModal = lazy(() => import('./components/DesignTokensShowcaseModal').then((m) => ({ default: m.DesignTokensShowcaseModal })));

const ViewLoadingFallback = () => (
  <div className="space-y-4 p-4 sm:p-6" aria-busy="true" aria-live="polite">
    <Skeleton variant="card" height={140} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton variant="card" height={200} />
      <Skeleton variant="card" height={200} />
    </div>
  </div>
);

function MainApp() {
  const {
    activeTab,
    setActiveTab,
    isAdvisorOpen,
    setAdvisorOpen,
    isTokenModalOpen,
    setTokenModalOpen,
    isAuthModalOpen,
    setAuthModalOpen,
    isDesignTokensOpen,
    setDesignTokensOpen,
    advisorInitialQuestion,
  } = useAppStore();

  const { userVault, saveUserVault, user, isAuthenticated } = useAuth();

  const [vault, setVault] = useState<MasterVault>(() => {
    const SAMPLE_EMAIL = 'jan.kowalski@example.com';

    // Authenticated user: always load their personal vault
    const sessionUser = getActiveSessionUser();
    if (sessionUser) {
      const userVaultData = loadUserVault(sessionUser.id);
      if (userVaultData && userVaultData.personalInfo.email === SAMPLE_EMAIL) {
        clearVaultLocalStorage();
        return createEmptyVault(sessionUser.fullName, sessionUser.email);
      }
      if (userVaultData) return userVaultData;
      return createEmptyVault(sessionUser.fullName, sessionUser.email);
    }

    // Unauthenticated: check global cache but never return sample data
    const loaded = loadVaultFromLocalStorage();
    if (loaded && loaded.personalInfo.email !== SAMPLE_EMAIL) {
      return loaded;
    }
    if (loaded && loaded.personalInfo.email === SAMPLE_EMAIL) {
      clearVaultLocalStorage();
    }
    return createEmptyVault();
  });

  // Sync user vault when authenticated user changes
  useEffect(() => {
    if (userVault) {
      setVault(userVault);
    }
  }, [userVault]);

  const [tokenStats, setTokenStats] = useState<TokenStats>(() => semanticCacheInstance.getStats());

  // Auto-save vault on changes
  useEffect(() => {
    saveVaultToLocalStorage(vault);
    if (isAuthenticated && user) {
      saveUserVault(vault);
    }
  }, [vault, isAuthenticated, user, saveUserVault]);

  const refreshStats = () => {
    setTokenStats(semanticCacheInstance.getStats());
  };

  const handleResetStats = () => {
    semanticCacheInstance.resetStats();
    refreshStats();
  };

  const handleApplyParsedVault = (parsed: Partial<MasterVault>) => {
    setVault((prev) => {
      const existingHistoryKeys = new Set(
        prev.history.map((h) => `${h.company.toLowerCase().trim()}_${h.role.toLowerCase().trim()}`)
      );
      const newHistory = (parsed.history || []).filter(
        (h) => !existingHistoryKeys.has(`${h.company.toLowerCase().trim()}_${h.role.toLowerCase().trim()}`)
      );

      const isPrevSample = prev.history.some((h) => h.company.includes('TechCorp') || h.company.includes('FinTech'));
      const mergedHistory = isPrevSample && parsed.history && parsed.history.length > 0
        ? parsed.history
        : [...(parsed.history || []), ...newHistory];

      const existingEduKeys = new Set(
        prev.education.map((e) => `${e.institution.toLowerCase().trim()}_${e.degree.toLowerCase().trim()}`)
      );
      const newEducation = (parsed.education || []).filter(
        (e) => !existingEduKeys.has(`${e.institution.toLowerCase().trim()}_${e.degree.toLowerCase().trim()}`)
      );

      return {
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          ...(parsed.personalInfo || {}),
        },
        skillsMatrix: {
          ...prev.skillsMatrix,
          hardSkills: Array.from(
            new Set([...(prev.skillsMatrix?.hardSkills || []), ...(parsed.skillsMatrix?.hardSkills || [])])
          ),
          softSkills: Array.from(
            new Set([...(prev.skillsMatrix?.softSkills || []), ...(parsed.skillsMatrix?.softSkills || [])])
          ),
        },
        profiler: {
          ...prev.profiler,
          languages: parsed.profiler?.languages || prev.profiler?.languages || [],
        },
        history: mergedHistory,
        education: [...prev.education, ...newEducation],
      };
    });
  };

  const handleOpenAdvisor = (initialQuestion?: string) => {
    setAdvisorOpen(true, initialQuestion);
  };

  return (
    <GlobalShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenAdvisor={handleOpenAdvisor}
      onOpenTokenStats={() => setTokenModalOpen(true)}
      onOpenAuthModal={() => setAuthModalOpen(true)}
      onOpenDesignTokens={() => setDesignTokensOpen(true)}
      tokenStats={tokenStats}
      isAuthenticated={isAuthenticated}
      userEmail={user?.email}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
        >
          {/* Tab 1: Home View (Quick Start, Stats & Career Microblog) */}
          {activeTab === 'home' && (
            <HomeView
              vault={vault}
              tokenStats={tokenStats}
              onNavigate={setActiveTab}
              onOpenAdvisor={handleOpenAdvisor}
            />
          )}

          {/* Lazy Loaded Views */}
          <Suspense fallback={<ViewLoadingFallback />}>
            {/* Tab 2: Job Matcher & ATS Simulator */}
            {activeTab === 'matcher' && (
              <JobMatcher
                vault={vault}
                onUpdateStats={refreshStats}
                onUpdateVault={setVault}
                onOpenAdvisor={handleOpenAdvisor}
              />
            )}

            {/* Tab 3: Master Vault Candidate Profile */}
            {activeTab === 'vault' && (
              <MasterVaultEditor
                vault={vault}
                onChange={setVault}
                onOpenAdvisor={handleOpenAdvisor}
              />
            )}

            {/* Tab 4: CV Parser & Import */}
            {activeTab === 'parser' && (
              <CVParserModal
                currentVault={vault}
                onApplyParsedVault={handleApplyParsedVault}
              />
            )}

            {/* Tab 5: Profiler & Preferences */}
            {activeTab === 'profiler' && (
              <ProfilerSection
                profiler={vault.profiler}
                onChange={(updatedProfiler) => setVault({ ...vault, profiler: updatedProfiler })}
              />
            )}

            {/* Tab 6: Recruitment Applications Tracker */}
            {activeTab === 'applications' && <ApplicationTracker />}

            {/* Tab 7: Pricing / Subscription Overview */}
            {activeTab === 'pricing' && <PricingView />}
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* Lazy Modals outside AnimatePresence of page content */}
      <Suspense fallback={null}>
        {/* Gemini AI Advisor Modal */}
        <GeminiAdvisorModal
          isOpen={isAdvisorOpen}
          onClose={() => setAdvisorOpen(false)}
          vault={vault}
          initialQuestion={advisorInitialQuestion}
        />

        {/* Design Tokens Showcase Modal */}
        <DesignTokensShowcaseModal
          isOpen={isDesignTokensOpen}
          onClose={() => setDesignTokensOpen(false)}
        />
      </Suspense>

      {/* Token Savings Modal */}
      <TokenStatsWidget
        isOpen={isTokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        stats={tokenStats}
        onResetStats={handleResetStats}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccessVaultLoaded={(loadedVault) => {
          setVault(loadedVault);
        }}
      />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />
    </GlobalShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
