import React, { useState, useEffect, useRef } from 'react';
import { AppTab, ApplicationRecord, MasterVault, TokenStats } from './types';
import { createEmptyVault } from './lib/sampleVault';
import { mergeParsedVaultIntoMaster } from './lib/layeredVaultEngine';
import { semanticCacheInstance } from './lib/semanticCache';
import { apiFetch, warmUpApi } from './lib/apiClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/shell/Sidebar';
import { Topbar } from './components/shell/Topbar';
import { TokenStatsWidget } from './components/TokenStatsWidget';
import { JobMatcher } from './components/JobMatcher';
import { MasterVaultEditor } from './components/MasterVaultEditor';
import { ProfilerSection } from './components/ProfilerSection';
const CVParserModal = React.lazy(() => import('./components/CVParserModal').then(module => ({ default: module.CVParserModal })));
import { GeminiAdvisorModal } from './components/GeminiAdvisorModal';
import { ApplicationTracker } from './components/ApplicationTracker';
import { LandingPage } from './components/LandingPage';

const APPLICATIONS_STORAGE_KEY = 'skillvault_applications_v1';

function MainApp() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = window.localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored) as ApplicationRecord[];
    } catch {
      return [];
    }
  });
  const { userVault, saveCurrentVault, isAuthenticated, authLoading, vaultLoading, firebaseConfigured } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorInitialQuestion, setAdvisorInitialQuestion] = useState<string | undefined>(undefined);

  const [vault, setVault] = useState<MasterVault>(() => userVault || createEmptyVault());
  const lastUserVaultRef = useRef<MasterVault | null>(null);

  // Pick up the vault Firestore just resolved (initial load, migration, or a fresh sign-in).
  useEffect(() => {
    if (userVault && userVault !== lastUserVaultRef.current) {
      lastUserVaultRef.current = userVault;
      setVault(userVault);
    }
  }, [userVault]);

  // Overlap the API's cold start (Render free tier sleeps) with the user reading
  // the page, instead of with them waiting on a spinner after their first click.
  useEffect(() => {
    warmUpApi();
  }, []);

  const [tokenStats, setTokenStats] = useState<TokenStats>(() => semanticCacheInstance.getStats());
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isStatsConnected, setIsStatsConnected] = useState(false);

  const syncTokenStats = async () => {
    const localStats = semanticCacheInstance.getStats();
    try {
      const response = await apiFetch('/api/usage/stats');
      if (!response.ok) {
        throw new Error('API request failed');
      }
      const payload = await response.json();
      const providerStats = payload?.stats ?? {};
      setTokenStats({
        ...localStats,
        ...providerStats,
        totalTokensSaved: localStats.totalTokensSaved,
        estimatedCostSavedUSD: localStats.estimatedCostSavedUSD,
        geminiDeltaCalls: Number(providerStats.geminiDeltaCalls ?? localStats.geminiDeltaCalls ?? 0),
        apiPromptTokens: Number(providerStats.apiPromptTokens ?? localStats.apiPromptTokens ?? 0),
        apiOutputTokens: Number(providerStats.apiOutputTokens ?? localStats.apiOutputTokens ?? 0),
        apiTotalTokens: Number(providerStats.apiTotalTokens ?? localStats.apiTotalTokens ?? 0),
        apiCostUSD: Number(providerStats.apiCostUSD ?? localStats.apiCostUSD ?? 0),
        lastSyncedAt: providerStats.lastSyncedAt || localStats.lastSyncedAt || new Date().toISOString(),
        providerName: providerStats.providerName || localStats.providerName || 'Google Gemini',
      });
      setIsStatsConnected(true);
    } catch {
      setIsStatsConnected(false);
      setTokenStats(localStats);
    }
  };

  useEffect(() => {
    void syncTokenStats();
    const intervalId = window.setInterval(() => {
      void syncTokenStats();
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Auto-save vault on changes with 500ms debounce to avoid performance degradation (ADR-79)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (vault === userVault) return;

    const timer = setTimeout(() => {
      void saveCurrentVault(vault).catch((err) => {
        console.error('Błąd podczas autozapisu vaulta do Firestore:', err);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [vault, userVault, saveCurrentVault, isAuthenticated]);

  useEffect(() => {
    try {
      window.localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
    } catch (err) {
      console.error('Błąd podczas zapisu aplikacji w localStorage:', err);
    }
  }, [applications]);

  const refreshStats = () => {
    void syncTokenStats();
  };

  const handleResetStats = () => {
    semanticCacheInstance.resetStats();
    refreshStats();
  };

  const handleApplyParsedVault = (parsed: Partial<MasterVault>) => {
    setVault((prev) => mergeParsedVaultIntoMaster(prev, parsed));
    setActiveTab('vault');
  };

  const handleOpenAdvisor = (question?: string) => {
    setAdvisorInitialQuestion(question);
    setIsAdvisorOpen(true);
  };

  const handleAddApplication = (record: ApplicationRecord) => {
    setApplications((prev) => [record, ...prev]);
  };

  if (!firebaseConfigured) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface border border-line rounded-2xl p-6 text-center space-y-3 shadow-xs">
          <h1 className="text-sm font-bold text-ink">Brak konfiguracji Firebase</h1>
          <p className="text-xs text-muted leading-relaxed">
            CVELOCITY potrzebuje projektu Firebase (Auth + Firestore), żeby działać — konto i
            vault nie mają już lokalnego zapasowego magazynu. Uzupełnij zmienne <code className="font-mono text-[11px] bg-sunken px-1 rounded">VITE_FIREBASE_*</code> w
            pliku <code className="font-mono text-[11px] bg-sunken px-1 rounded">.env</code> (zobacz <code className="font-mono text-[11px] bg-sunken px-1 rounded">.env.example</code>) i uruchom ponownie.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading || (isAuthenticated && vaultLoading)) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-line-strong border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // SkillVault's vault lives in Firestore now, keyed by account — there's no local
    // fallback, so using the app at all starts with signing in.
    return <AuthModal isOpen onClose={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex selection:bg-brand-500/25">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={isNavCollapsed}
        onToggleCollapse={() => setIsNavCollapsed((c) => !c)}
        vaultReady={!!vault.personalInfo.fullName}
        mobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        onOpenAdvisor={handleOpenAdvisor}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          activeTab={activeTab}
          tokenStats={tokenStats}
          onOpenTokenStats={() => setIsTokenModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        {/* Remounting per tab replays the entrance animation and drops stale view state. */}
        <main key={activeTab} className="flex-1 px-4 sm:px-6 lg:px-8 py-7 animate-fade-in">
          <div className="max-w-[1400px] mx-auto">
            {activeTab === 'home' && <LandingPage onEnterApp={() => setActiveTab('matcher')} />}

            {activeTab === 'matcher' && (
              <JobMatcher
                vault={vault}
                onUpdateStats={refreshStats}
                onUpdateVault={setVault}
                onOpenAdvisor={handleOpenAdvisor}
                onSwitchTab={setActiveTab}
                onAddApplication={handleAddApplication}
              />
            )}

            {activeTab === 'vault' && (
              <MasterVaultEditor vault={vault} onChange={setVault} onOpenAdvisor={handleOpenAdvisor} />
            )}

            {activeTab === 'profiler' && (
              <ProfilerSection
                profiler={vault.profiler}
                onChange={(updatedProfiler) => setVault({ ...vault, profiler: updatedProfiler })}
              />
            )}

            {activeTab === 'parser' && (
              <React.Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-line-strong border-t-brand-600 rounded-full animate-spin" />
                  </div>
                }
              >
                <CVParserModal currentVault={vault} onApplyParsedVault={handleApplyParsedVault} />
              </React.Suspense>
            )}

            {activeTab === 'applications' && (
              <ApplicationTracker applications={applications} onAddApplication={handleAddApplication} />
            )}
          </div>
        </main>

        <footer className="border-t border-line py-5 px-6 text-center text-xs text-subtle space-y-1">
          <p>CVELOCITY © 2026 — 0-Token Local Slot Filling + Gemini Delta Prompting.</p>
          <p>
            Stworzone przez{' '}
            <a href="https://oathcry.com" target="_blank" rel="noreferrer" className="font-semibold text-brand-fg hover:underline">
              Adriana Kozińskiego
            </a>
            {' · '}
            <a href="https://github.com/krymszuch-stack" target="_blank" rel="noreferrer" className="hover:underline">
              GitHub
            </a>
            {' · '}
            <a href="https://www.linkedin.com/in/adrian-kozi%C5%84ski-6847162a6/" target="_blank" rel="noreferrer" className="hover:underline">
              LinkedIn
            </a>
          </p>
        </footer>
      </div>

      {/* Gemini AI Advisor & Samouczek Modal ("Okienko Doradcy") */}
      <GeminiAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        vault={vault}
        initialQuestion={advisorInitialQuestion}
      />

      {/* Token Savings Modal */}
      <TokenStatsWidget
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        stats={tokenStats}
        onResetStats={handleResetStats}
        isConnected={isStatsConnected}
      />

      {/* Auth Modal (account management — already signed in here) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
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
