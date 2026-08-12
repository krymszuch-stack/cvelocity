import React, { useState, useEffect, useRef } from 'react';
import { AppTab, ApplicationRecord, MasterVault, TokenStats } from './types';
import { createEmptyVault } from './lib/sampleVault';
import { loadVaultFromLocalStorage, saveVaultToLocalStorage, clearVaultLocalStorage } from './lib/vaultCrypto';
import { getActiveSessionUser, loadUserVault } from './lib/auth';
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
import { CVParserModal } from './components/CVParserModal';
import { GeminiAdvisorModal } from './components/GeminiAdvisorModal';
import { ApplicationTracker } from './components/ApplicationTracker';

const APPLICATIONS_STORAGE_KEY = 'skillvault_applications_v1';

function MainApp() {
  const [activeTab, setActiveTab] = useState<AppTab>('matcher');
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
  const { userVault, saveUserVault } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorInitialQuestion, setAdvisorInitialQuestion] = useState<string | undefined>(undefined);

  const [vault, setVault] = useState<MasterVault>(() => {
    // Authenticated user: load their personal vault
    const sessionUser = getActiveSessionUser();
    if (sessionUser) {
      const userVaultData = loadUserVault(sessionUser.id) || loadVaultFromLocalStorage(sessionUser.id);
      if (userVaultData) return userVaultData;
      return createEmptyVault(sessionUser.fullName, sessionUser.email);
    }

    // Unauthenticated: check global cache
    const loaded = loadVaultFromLocalStorage();
    if (loaded) {
      return loaded;
    }
    return createEmptyVault();
  });

  const lastUserVaultRef = useRef<MasterVault | null>(null);

  // Sync user vault when authenticated user changes
  useEffect(() => {
    if (userVault) {
      if (userVault !== lastUserVaultRef.current) {
        lastUserVaultRef.current = userVault;
        setVault(userVault);
      }
    } else {
      // User is logged out / unauthenticated
      lastUserVaultRef.current = null;
      const loaded = loadVaultFromLocalStorage();
      setVault(loaded || createEmptyVault());
    }
  }, [userVault]);

  // Overlap the API's cold start (Render free tier sleeps) with the user reading
  // the page, instead of with them waiting on a spinner after their first click.
  useEffect(() => {
    warmUpApi();
  }, []);

  const [tokenStats, setTokenStats] = useState<TokenStats>(() => semanticCacheInstance.getStats());
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const syncTokenStats = async () => {
    const localStats = semanticCacheInstance.getStats();
    try {
      const response = await apiFetch('/api/usage/stats');
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
    } catch {
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
  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (vault === userVault) return;

    const timer = setTimeout(() => {
      try {
        if (!isAuthenticated) {
          saveVaultToLocalStorage(vault);
        } else {
          saveVaultToLocalStorage(vault, user?.id);
          saveUserVault(vault);
        }
      } catch (err) {
        console.error('Błąd podczas autozapisu danych w localStorage:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [vault, userVault, saveUserVault, isAuthenticated, user]);

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
    setVault((prev) => {
      // Merge history without duplicate company + role entries
      const existingHistoryKeys = new Set(prev.history.map((h) => `${h.company.toLowerCase().trim()}_${h.role.toLowerCase().trim()}`));
      const newHistory = (parsed.history || []).filter((h) => !existingHistoryKeys.has(`${h.company.toLowerCase().trim()}_${h.role.toLowerCase().trim()}`));
      
      const mergedHistory = prev.history.length === 0
        ? (parsed.history || [])
        : [...(parsed.history || []), ...newHistory];

      // Merge education without duplicate institution + degree
      const existingEduKeys = new Set(prev.education.map((e) => `${e.institution.toLowerCase().trim()}_${e.degree.toLowerCase().trim()}`));
      const newEdu = (parsed.education || []).filter((e) => !existingEduKeys.has(`${e.institution.toLowerCase().trim()}_${e.degree.toLowerCase().trim()}`));
      const mergedEducation = prev.education.length === 0
        ? (parsed.education || [])
        : [...(parsed.education || []), ...newEdu];

      // Merge certifications
      const existingCertNames = new Set((prev.skillsMatrix.certifications || []).map((c) => c.name.toLowerCase().trim()));
      const newCerts = (parsed.skillsMatrix?.certifications || []).filter((c) => !existingCertNames.has(c.name.toLowerCase().trim()));
      const mergedCertifications = [...(prev.skillsMatrix.certifications || []), ...newCerts];

      // Merge projects
      const existingProjNames = new Set((prev.projects || []).map((p) => p.name.toLowerCase().trim()));
      const newProjects = (parsed.projects || []).filter((p) => !existingProjNames.has(p.name.toLowerCase().trim()));
      const mergedProjects = [...(prev.projects || []), ...newProjects];

      return {
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: parsed.personalInfo?.fullName || prev.personalInfo.fullName,
          title: parsed.personalInfo?.title || prev.personalInfo.title,
          summary: parsed.personalInfo?.summary || prev.personalInfo.summary,
          location: parsed.personalInfo?.location || prev.personalInfo.location,
          email: parsed.personalInfo?.email || prev.personalInfo.email,
          phone: parsed.personalInfo?.phone || prev.personalInfo.phone,
          linkedin: parsed.personalInfo?.linkedin || prev.personalInfo.linkedin,
        },
        skillsMatrix: {
          ...prev.skillsMatrix,
          hardSkills: Array.from(new Set([...(parsed.skillsMatrix?.hardSkills || []), ...prev.skillsMatrix.hardSkills])),
          softSkills: Array.from(new Set([...(parsed.skillsMatrix?.softSkills || []), ...prev.skillsMatrix.softSkills])),
          toolsAndTech: Array.from(new Set([...(parsed.skillsMatrix?.toolsAndTech || []), ...prev.skillsMatrix.toolsAndTech])),
          certifications: mergedCertifications,
        },
        history: mergedHistory.length > 0 ? mergedHistory : prev.history,
        education: mergedEducation.length > 0 ? mergedEducation : prev.education,
        projects: mergedProjects.length > 0 ? mergedProjects : prev.projects,
        updatedAt: new Date().toISOString(),
      };
    });
    setActiveTab('vault');
  };

  const handleOpenAdvisor = (question?: string) => {
    setAdvisorInitialQuestion(question);
    setIsAdvisorOpen(true);
  };

  const handleAddApplication = (record: ApplicationRecord) => {
    setApplications((prev) => [record, ...prev]);
  };

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
              <CVParserModal currentVault={vault} onApplyParsedVault={handleApplyParsedVault} />
            )}

            {activeTab === 'applications' && (
              <ApplicationTracker applications={applications} onAddApplication={handleAddApplication} />
            )}
          </div>
        </main>

        <footer className="border-t border-line py-5 px-6 text-center text-xs text-subtle">
          SkillVault © 2026 — Aggregator ofert + dopasowanie kompetencji do realnych wymagań.
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
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessVaultLoaded={(loadedVault) => {
          lastUserVaultRef.current = loadedVault;
          setVault(loadedVault);
        }}
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
