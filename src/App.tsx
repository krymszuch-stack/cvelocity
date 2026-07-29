import React, { useState, useEffect, useRef } from 'react';
import { MasterVault, TokenStats } from './types';
import { INITIAL_SAMPLE_VAULT, createEmptyVault } from './lib/sampleVault';
import { loadVaultFromLocalStorage, saveVaultToLocalStorage } from './lib/vaultCrypto';
import { getActiveSessionUser, loadUserVault } from './lib/auth';
import { semanticCacheInstance } from './lib/semanticCache';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { TokenStatsWidget } from './components/TokenStatsWidget';
import { JobMatcher } from './components/JobMatcher';
import { MasterVaultEditor } from './components/MasterVaultEditor';
import { ProfilerSection } from './components/ProfilerSection';
import { CVParserModal } from './components/CVParserModal';
import { GeminiAdvisorModal } from './components/GeminiAdvisorModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'matcher' | 'vault' | 'parser' | 'profiler'>('matcher');
  const { userVault, saveUserVault } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorInitialQuestion, setAdvisorInitialQuestion] = useState<string | undefined>(undefined);

  const [vault, setVault] = useState<MasterVault>(() => {
    // If user is already authenticated, load their personal vault (never sample data)
    const sessionUser = getActiveSessionUser();
    if (sessionUser) {
      const userVaultData = loadUserVault(sessionUser.id);
      if (userVaultData) return userVaultData;
      // Authenticated but no vault yet - return clean empty vault
      return createEmptyVault(sessionUser.fullName, sessionUser.email);
    }
    // Unauthenticated: show demo sample vault
    const loaded = loadVaultFromLocalStorage();
    return loaded || INITIAL_SAMPLE_VAULT;
  });

  const lastUserVaultRef = useRef<MasterVault | null>(null);

  // Sync user vault when authenticated user changes
  useEffect(() => {
    if (userVault && userVault !== lastUserVaultRef.current) {
      lastUserVaultRef.current = userVault;
      setVault(userVault);
    }
  }, [userVault]);

  const [tokenStats, setTokenStats] = useState<TokenStats>(() => semanticCacheInstance.getStats());
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  // Auto-save vault on changes - only save to user storage if authenticated
  // and the vault is NOT the sample/demo vault (prevents overwriting new user's clean slate)
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) {
      // Only save to global localStorage for unauthenticated/demo mode
      saveVaultToLocalStorage(vault);
      return;
    }
    // Authenticated: save to both storages
    saveVaultToLocalStorage(vault);
    saveUserVault(vault);
  }, [vault, saveUserVault, isAuthenticated]);

  const refreshStats = () => {
    setTokenStats(semanticCacheInstance.getStats());
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
      
      // If previous history was sample data or empty, prefer parsed history
      const isPrevSample = prev.history.some((h) => h.company.includes('TechCorp') || h.company.includes('FinTech'));
      const mergedHistory = isPrevSample && parsed.history && parsed.history.length > 0
        ? parsed.history
        : [...parsed.history || [], ...prev.history.filter((h) => !(parsed.history || []).some((p) => p.company.toLowerCase().trim() === h.company.toLowerCase().trim() && p.role.toLowerCase().trim() === h.role.toLowerCase().trim()))];

      // Merge education without duplicate institution + degree
      const existingEduKeys = new Set(prev.education.map((e) => `${e.institution.toLowerCase().trim()}_${e.degree.toLowerCase().trim()}`));
      const newEdu = (parsed.education || []).filter((e) => !existingEduKeys.has(`${e.institution.toLowerCase().trim()}_${e.degree.toLowerCase().trim()}`));
      const isPrevEduSample = prev.education.some((e) => e.institution.includes('Politechnika Warszawska') && e.fieldOfStudy.includes('Informatyka'));
      const mergedEducation = isPrevEduSample && parsed.education && parsed.education.length > 0
        ? parsed.education
        : [...parsed.education || [], ...newEdu];

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tokenStats={tokenStats}
        vaultStatus={{
          isLoaded: !!vault.personalInfo.fullName,
          itemCount: vault.history.length,
          isEncrypted: false,
        }}
        onOpenTokenStats={() => setIsTokenModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAdvisor={handleOpenAdvisor}
      />

      {/* Main Content View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'matcher' && (
          <JobMatcher
            vault={vault}
            onUpdateStats={refreshStats}
            onUpdateVault={setVault}
            onOpenAdvisor={handleOpenAdvisor}
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
      </main>

      {/* Gemini AI Advisor & Samouczek Modal ("Okienko żarówki 💡") */}
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
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>SkillVault © 2026 – System Automatyzacji CV & ATS. 0-Token Local Slot Filling + Gemini Delta Prompting.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
