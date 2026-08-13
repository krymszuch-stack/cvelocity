import React, { useState, useEffect, useRef } from 'react';
import { AppTab, ApplicationRecord, MasterVault, TokenStats } from './types';
import { createEmptyVault } from './lib/sampleVault';
import { loadVaultFromLocalStorage, saveVaultToLocalStorage, clearVaultLocalStorage, isLocalVaultLocked } from './lib/vaultCrypto';
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
  const { userVault, saveUserVault, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVaultLocked, setIsVaultLocked] = useState(() => {
    const sessionUser = getActiveSessionUser();
    if (sessionUser) {
      const encryptedKey = `skillvault_vault_encrypted_${sessionUser.id}`;
      const hasEncrypted = typeof window !== 'undefined' && !!localStorage.getItem(encryptedKey);
      const userVaultData = loadUserVault(sessionUser.id);
      return hasEncrypted && !userVaultData;
    } else {
      return isLocalVaultLocked();
    }
  });
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorInitialQuestion, setAdvisorInitialQuestion] = useState<string | undefined>(undefined);

  const [vault, setVault] = useState<MasterVault>(() => {
    // Authenticated user: load their personal vault
    const sessionUser = getActiveSessionUser();
    if (sessionUser) {
      const userVaultData = loadUserVault(sessionUser.id);
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

  const handleResetLockedVault = () => {
    if (window.confirm('Czy na pewno chcesz usunąć zablokowane dane i zacząć od nowa? Tej operacji nie można cofnąć.')) {
      if (isAuthenticated) {
        logout();
      } else {
        clearVaultLocalStorage();
      }
      setIsVaultLocked(false);
      setVault(createEmptyVault());
      window.location.reload();
    }
  };

  const handleImportBackupOnLock = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string) as MasterVault;
          if (parsed && parsed.personalInfo) {
            setVault(parsed);
            if (!isAuthenticated) {
              saveVaultToLocalStorage(parsed);
            } else {
              saveUserVault(parsed);
            }
            setIsVaultLocked(false);
            alert('Kopia zapasowa została pomyślnie zaimportowana!');
          } else {
            alert('Nieprawidłowy format pliku kopii zapasowej.');
          }
        } catch {
          alert('Błąd odczytu pliku kopii zapasowej.');
        }
      };
      reader.readAsText(file);
    } catch {
      alert('Nie udało się zaimportować pliku.');
    }
  };

  // Auto-save vault on changes with 500ms debounce to avoid performance degradation (ADR-79)
  useEffect(() => {
    if (isVaultLocked) return; // Do not overwrite locked vault
    if (vault === userVault) return;

    const timer = setTimeout(() => {
      try {
        if (!isAuthenticated) {
          saveVaultToLocalStorage(vault);
        } else {
          saveVaultToLocalStorage(vault);
          saveUserVault(vault);
        }
      } catch (err) {
        console.error('Błąd podczas autozapisu danych w localStorage:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [vault, userVault, saveUserVault, isAuthenticated, isVaultLocked]);

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
            {isVaultLocked ? (
              <div className="max-w-md mx-auto my-12 p-6 bg-surface border border-line rounded-2xl shadow-lg space-y-4 text-center">
                <div className="w-12 h-12 bg-danger-soft border border-danger-500/30 rounded-full flex items-center justify-center mx-auto text-danger-fg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m3-9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <h3 className="text-sm font-extrabold text-ink">Profil jest zablokowany</h3>
                <p className="text-xs text-subtle leading-relaxed">
                  {isAuthenticated
                    ? 'Klucz deszyfrujący Twoją sesję wygasł lub został usunięty. Zaloguj się ponownie, aby bezpiecznie odblokować swoje dane.'
                    : 'Wykryto zaszyfrowany profil lokalny, ale klucz sesji wygasł (np. sesja wygasła lub zamknięto przeglądarkę). Aby zapobiec nadpisaniu danych, wgraj plik kopii zapasowej lub wyczyść dane, aby zacząć od nowa.'}
                </p>

                <div className="pt-2 space-y-2">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      Zaloguj się ponownie
                    </button>
                  ) : (
                    <label className="block w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md text-center cursor-pointer transition-all">
                      Wgraj kopię zapasową (.json)
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackupOnLock}
                        className="hidden"
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={handleResetLockedVault}
                    className="w-full py-2 bg-sunken hover:bg-danger-soft hover:text-danger-fg text-subtle border border-line rounded-xl text-xs font-semibold transition-all"
                  >
                    Wyczyść zablokowane dane i zacznij od nowa
                  </button>
                </div>
              </div>
            ) : (
              <>
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
              </>
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
