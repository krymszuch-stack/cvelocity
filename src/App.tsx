import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDeferredPersist } from './hooks/useDeferredPersist';
import { MasterVault } from './types';
import { createEmptyVault } from './lib/sampleVault';
import { mergeImportedVault } from './lib/vaultImportMerge';
import {
  ANONYMOUS_PROFILE_ID,
  getActiveProfile,
  loadProfileVault,
  saveProfileVault,
} from './lib/localProfile';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastHost } from './components/ui/ToastHost';
import { useAppStore } from './store/useAppStore';
import { AuthModal } from './features/auth/AuthModal';
import { GlobalShell, NavTabId } from './components/GlobalShell';
import { CommandPalette } from './components/CommandPalette';
import { Skeleton } from './components/ui/Skeleton';
import { HomeView } from './views/HomeView';
import { ReactFloatingPanel } from './components/hud/ReactFloatingPanel';
import { SkillBridgeMatrixModal } from './components/bridge/SkillBridgeMatrixModal';
import { ElevatorPitchModal } from './features/pitch/ElevatorPitchModal';
import { InterviewLoopModal } from './features/loop/InterviewLoopModal';
import { DrillModeModal } from './features/drill/DrillModeModal';

// Lazy-loaded heavy views for fast initial bundle & LCP
const JobMatcher = lazy(() => import('./features/matcher/JobMatcher').then((m) => ({ default: m.JobMatcher })));
const MasterVaultEditor = lazy(() => import('./features/vault/MasterVaultEditor').then((m) => ({ default: m.MasterVaultEditor })));
const ProfilerSection = lazy(() => import('./features/profiler/ProfilerSection').then((m) => ({ default: m.ProfilerSection })));
const CVParserModal = lazy(() => import('./features/parser/CVParserModal').then((m) => ({ default: m.CVParserModal })));
const GeminiAdvisorModal = lazy(() => import('./features/advisor/GeminiAdvisorModal').then((m) => ({ default: m.GeminiAdvisorModal })));
const ApplicationTracker = lazy(() => import('./features/tracker/ApplicationTracker').then((m) => ({ default: m.ApplicationTracker })));
const PricingView = lazy(() => import('./views/PricingView').then((m) => ({ default: m.PricingView })));
const DesignTokensShowcaseModal = lazy(() => import('./components/DesignTokensShowcaseModal').then((m) => ({ default: m.DesignTokensShowcaseModal })));
const InterviewCockpitView = lazy(() => import('./features/cockpit/InterviewCockpitView').then((m) => ({ default: m.InterviewCockpitView })));

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
    // Ślad po danych demonstracyjnych, które kiedyś wgrywały się same. Wpis
    // z tym adresem nie jest niczyim CV, więc jest odrzucany zamiast wczytany.
    const SAMPLE_EMAIL = 'jan.kowalski@example.com';

    const profile = getActiveProfile();
    const storedVault = loadProfileVault(profile?.id ?? ANONYMOUS_PROFILE_ID);

    if (storedVault && storedVault.personalInfo.email !== SAMPLE_EMAIL) {
      return storedVault;
    }

    return createEmptyVault(profile?.name, profile?.email);
  });

  // Sync user vault when authenticated user changes
  useEffect(() => {
    if (userVault) {
      setVault(userVault);
    }
  }, [userVault]);


  // Jeden zapis, pod jednym kluczem. Wcześniej każda zmiana trafiała naraz do
  // klucza globalnego i do klucza profilu, więc te same dane leżały w schowku
  // w dwóch kopiach, które potrafiły się rozjechać.
  //
  // Zapis jest odłożony w czasie, bo utrwalanie to pełna serializacja drzewa,
  // a edytor tworzy nowy obiekt vaultu przy każdej edycji pola — bez odłożenia
  // `JSON.stringify` całych 38 kB wykonywał się przy każdym wpisanym znaku.
  // `useDeferredPersist` dosyła zaległy zapis przy ukryciu karty, zamknięciu
  // strony i odmontowaniu, więc opóźnienie nie tworzy okna utraty danych.
  const persistVault = useCallback(
    (current: MasterVault) => {
      if (isAuthenticated && user) {
        saveUserVault(current);
      } else {
        saveProfileVault(ANONYMOUS_PROFILE_ID, current);
      }
    },
    [isAuthenticated, user, saveUserVault]
  );

  useDeferredPersist(vault, persistVault);

  const handleApplyParsedVault = (parsed: Partial<MasterVault>) => {
    setVault((prev) => mergeImportedVault(prev, parsed));
  };

  const handleOpenAdvisor = (initialQuestion?: string) => {
    setAdvisorOpen(true, initialQuestion);
  };

  const [isHUDOpen, setHUDOpen] = useState(false);
  const [isSkillBridgeOpen, setSkillBridgeOpen] = useState(false);
  const [isPitchOpen, setPitchOpen] = useState(false);
  const [isLoopOpen, setLoopOpen] = useState(false);
  const [isDrillOpen, setDrillOpen] = useState(false);

  // Globalne skróty Ctrl+H (Live HUD), Ctrl+B (Skill Bridge), Ctrl+P (Elevator Pitch), Ctrl+L (Interview Loop), Cmd+D (Practice / DrillMode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          setHUDOpen((prev) => !prev);
        } else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          setSkillBridgeOpen((prev) => !prev);
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setPitchOpen((prev) => !prev);
        } else if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          setLoopOpen((prev) => !prev);
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setDrillOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <GlobalShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenAdvisor={handleOpenAdvisor}
      onOpenAuthModal={() => setAuthModalOpen(true)}
      onOpenDesignTokens={() => setDesignTokensOpen(true)}
      onOpenHUD={() => setHUDOpen(true)}
      onOpenPitch={() => setPitchOpen(true)}
      onOpenDrill={() => setDrillOpen(true)}
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
              onNavigate={setActiveTab}
              onOpenAdvisor={handleOpenAdvisor}
              onAdoptVault={setVault}
            />
          )}

          {/* Lazy Loaded Views */}
          <Suspense fallback={<ViewLoadingFallback />}>
            {/* Tab 2: Job Matcher & ATS Simulator */}
            {activeTab === 'matcher' && (
              <JobMatcher
                vault={vault}
                onUpdateVault={setVault}
                onOpenAdvisor={handleOpenAdvisor}
              />
            )}

            {/* Tab: Kokpit Rozmowy (Interview Playbook & Tactical Cockpit) */}
            {activeTab === 'cockpit' && (
              <InterviewCockpitView
                vault={vault}
                onOpenDrill={() => setDrillOpen(true)}
                onOpenHUD={() => setHUDOpen(true)}
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


      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccessVaultLoaded={(loadedVault) => {
          setVault(loadedVault);
        }}
      />

      {/* Live HUD Teleprompter Floating Panel (Ctrl+H) */}
      <ReactFloatingPanel
        isOpen={isHUDOpen}
        onClose={() => setHUDOpen(false)}
        vault={vault}
      />

      {/* Skill Bridge Matrix Modal (Ctrl+B) */}
      <SkillBridgeMatrixModal
        isOpen={isSkillBridgeOpen}
        onClose={() => setSkillBridgeOpen(false)}
        vault={vault}
      />

      {/* Elevator Pitch Generator Modal (Ctrl+P) */}
      <ElevatorPitchModal
        isOpen={isPitchOpen}
        onClose={() => setPitchOpen(false)}
        vault={vault}
      />

      {/* Interview Loop Manager Modal (Ctrl+L) */}
      <InterviewLoopModal
        isOpen={isLoopOpen}
        onClose={() => setLoopOpen(false)}
        vault={vault}
      />

      {/* Mock Drill Mode Modal (Cmd+D / Practice) */}
      <DrillModeModal
        isOpen={isDrillOpen}
        onClose={() => setDrillOpen(false)}
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
        <ToastHost />
      </AuthProvider>
    </ThemeProvider>
  );
}
