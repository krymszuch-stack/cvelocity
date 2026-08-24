import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDeferredPersist } from './hooks/useDeferredPersist';
import { useUnlocks } from './hooks/useUnlocks';
import { MasterVault } from './types';
import { createEmptyVault } from './lib/sampleVault';
import { mergeImportedVault } from './lib/vaultImportMerge';
import { NavTabId, isNavSectionId, resolveTabId } from './lib/navigation';
import { resolveNextAction } from './lib/nextAction';
import {
  ANONYMOUS_PROFILE_ID,
  getActiveProfile,
  loadProfileVault,
  saveProfileVault,
} from './lib/localProfile';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastHost } from './components/ui/ToastHost';
import { showToast } from './store/useToastStore';
import { useAppStore } from './store/useAppStore';
import { useApplications } from './store/useApplications';
import { AuthModal } from './features/auth/AuthModal';
import { GlobalShell } from './components/GlobalShell';
import { CommandPalette } from './components/CommandPalette';
import { Skeleton } from './components/ui/Skeleton';
import { HomeView } from './views/HomeView';
import { NextActionCard } from './components/nextaction/NextActionCard';
import { CvQuestionsCard } from './features/questions/CvQuestionsCard';
import { fetchCloudVault, saveCloudVault } from './lib/cloudVault';
import { resolveVaultOnSignIn } from './lib/vaultSync';
import { SkillBridgeMatrixModal } from './components/bridge/SkillBridgeMatrixModal';
import { ElevatorPitchModal } from './features/pitch/ElevatorPitchModal';
import { DrillModeModal } from './features/drill/DrillModeModal';

// Lazy-loaded heavy views for fast initial bundle & LCP
const JobMatcher = lazy(() => import('./features/matcher/JobMatcher').then((m) => ({ default: m.JobMatcher })));
const AtsLabView = lazy(() => import('./features/ats/AtsLabView').then((m) => ({ default: m.AtsLabView })));
const MasterVaultEditor = lazy(() => import('./features/vault/MasterVaultEditor').then((m) => ({ default: m.MasterVaultEditor })));
const ProfilerSection = lazy(() => import('./features/profiler/ProfilerSection').then((m) => ({ default: m.ProfilerSection })));
const CVParserModal = lazy(() => import('./features/parser/CVParserModal').then((m) => ({ default: m.CVParserModal })));
const GeminiAdvisorModal = lazy(() => import('./features/advisor/GeminiAdvisorModal').then((m) => ({ default: m.GeminiAdvisorModal })));
const ApplicationTracker = lazy(() => import('./features/tracker/ApplicationTracker').then((m) => ({ default: m.ApplicationTracker })));
const PricingView = lazy(() => import('./views/PricingView').then((m) => ({ default: m.PricingView })));
const DesignTokensShowcaseModal = lazy(() => import('./components/DesignTokensShowcaseModal').then((m) => ({ default: m.DesignTokensShowcaseModal })));
const InterviewCockpitView = lazy(() => import('./features/cockpit/InterviewCockpitView').then((m) => ({ default: m.InterviewCockpitView })));
const ProfileSection = lazy(() => import('./features/profile/ProfileSection').then((m) => ({ default: m.ProfileSection })));

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
    isAuthModalOpen,
    setAuthModalOpen,
    isDesignTokensOpen,
    setDesignTokensOpen,
    advisorInitialQuestion,
  } = useAppStore();

  const { userVault, saveUserVault, user, isAuthenticated, mode } = useAuth();

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

  const { applications } = useApplications();

  // Sync user vault when authenticated user changes
  useEffect(() => {
    if (userVault) {
      setVault(userVault);
    }
  }, [userVault]);

  /**
   * Pierwsze spotkanie lokalnego CV z kontem w chmurze.
   *
   * Rozstrzygnięcie żyje tutaj, a nie w `AuthContext`, bo to `MainApp` trzyma
   * vault — kontekst jest wyżej w drzewie i nie ma do niego dostępu.
   *
   * `vaultRef` zamiast `vault` w zależnościach jest konieczne: efekt ma
   * zadziałać **raz po zalogowaniu**, a nie przy każdym wpisanym znaku.
   * Wpisanie `vault` do tablicy zależności robiłoby żądanie do chmury po każdej
   * literze i nadpisywało dopiero co pobrane dane.
   */
  const vaultRef = useRef(vault);
  // Aktualizacja w efekcie, nie w trakcie renderu — ten sam wzorzec co
  // `persistRef` w `useDeferredPersist.ts`.
  useEffect(() => {
    vaultRef.current = vault;
  }, [vault]);

  const syncedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== 'cloud' || !user) return;
    if (syncedForUser.current === user.id) return;
    syncedForUser.current = user.id;

    let aktywny = true;

    void (async () => {
      try {
        const chmura = await fetchCloudVault();
        if (!aktywny) return;

        const wynik = resolveVaultOnSignIn(vaultRef.current, chmura);
        setVault(wynik.vault);

        if (wynik.shouldUpload) {
          await saveCloudVault(wynik.vault);
          if (wynik.action === 'scal-i-wyslij') {
            showToast('Połączyliśmy CV z tego urządzenia z tym z konta', {
              message: 'Nic nie zostało usunięte — wpisy z obu miejsc są na miejscu.',
              variant: 'info',
            });
          }
        }
      } catch {
        if (!aktywny) return;
        // Nieudany odczyt nie może skasować tego, co użytkownik ma na ekranie —
        // `resolveVaultOnSignIn` nigdy nie dostanie tu pustej chmury „na wszelki
        // wypadek", bo w ogóle nie dochodzi do rozstrzygnięcia.
        syncedForUser.current = null;
        showToast('Nie udało się pobrać CV z konta', {
          message: 'Pracujesz na wersji z tego urządzenia. Odśwież stronę, żeby spróbować ponownie.',
          variant: 'error',
        });
      }
    })();

    return () => {
      aktywny = false;
    };
  }, [mode, user]);

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

  const unlocks = useUnlocks(vault, applications);

  /**
   * Czas, względem którego liczone są reguły „rozmowa za mniej niż 48 h"
   * i „aplikacja bez odpowiedzi od tygodnia".
   *
   * Odświeżany przy powrocie na kartę, a nie zegarem co minutę. Karta otwarta
   * w tle przez pół dnia i tak nikomu niczego nie przypomni, a przerysowywanie
   * całego drzewa co sześćdziesiąt sekund kosztowałoby więcej niż jest warte.
   */
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setNow(new Date());
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);

  const nextAction = useMemo(
    () => resolveNextAction({ vault, applications, now }),
    [vault, applications, now]
  );

  /**
   * Jedyne wejście do zmiany sekcji.
   *
   * Tłumaczy identyfikatory sprzed konsolidacji (`vault`, `matcher`…) i pilnuje
   * odblokowań. Pasek boczny sam wyszarza zamknięte sekcje, ale nie jest
   * jedyną drogą — paleta poleceń i rekomendacje też tu trafiają, więc reguła
   * musi stać w miejscu, przez które przechodzą wszystkie.
   */
  const navigate = useCallback(
    (tab: NavTabId | string) => {
      const target = resolveTabId(tab);

      if (isNavSectionId(target) && unlocks.sections[target] === false) {
        showToast('Ta sekcja jest jeszcze zamknięta', {
          message: unlocks.reasons[target],
          variant: 'info',
        });
        return;
      }

      setActiveTab(target);
    },
    [setActiveTab, unlocks]
  );

  const handleApplyParsedVault = (parsed: Partial<MasterVault>) => {
    setVault((prev) => mergeImportedVault(prev, parsed));
  };

  const handleOpenAdvisor = (initialQuestion?: string) => {
    setAdvisorOpen(true, initialQuestion);
  };

  // Narzędzia sekcji TRENUJ. Otwierane z Kokpitu, nie z paska górnego —
  // wcześniej wisiały w globalnej nawigacji razem ze skrótami Ctrl+B/P/D,
  // widoczne od pierwszej sekundy, choć dotyczą rozmowy, której nikt jeszcze
  // nie umówił. Zasobnik Rozmowy (HUD, pętla) mieszka teraz w Pipeline.
  const [isSkillBridgeOpen, setSkillBridgeOpen] = useState(false);
  const [isPitchOpen, setPitchOpen] = useState(false);
  const [isDrillOpen, setDrillOpen] = useState(false);

  return (
    <GlobalShell
      activeTab={activeTab}
      onSelectTab={navigate}
      onOpenAdvisor={handleOpenAdvisor}
      onOpenAuthModal={() => setAuthModalOpen(true)}
      onOpenDesignTokens={() => setDesignTokensOpen(true)}
      unlockedSections={unlocks.sections}
      lockReasons={unlocks.reasons}
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
          {/* Ekran startowy: jedna rekomendacja na górze, reszta pod nią. */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <NextActionCard action={nextAction} onNavigate={navigate} />
              {/*
                Pytania uzupełniające stoją pod „następnym krokiem", a nie
                w osobnej zakładce: to ten sam ekran, na którym aplikacja mówi
                „zrób teraz to", a zakładka, do której trzeba trafić samemu,
                nie zostałaby odwiedzona. Karta znika sama, gdy nie ma o co pytać.
              */}
              <CvQuestionsCard vault={vault} onChange={setVault} />
              <HomeView
                vault={vault}
                onNavigate={navigate}
                onOpenAdvisor={handleOpenAdvisor}
                onAdoptVault={setVault}
              />
            </div>
          )}

          <Suspense fallback={<ViewLoadingFallback />}>
            {/* PROFIL — dane, import CV i preferencje jako kroki jednej sekcji */}
            {activeTab === 'profil' && (
              <ProfileSection
                vault={vault}
                onChangeVault={setVault}
                onApplyParsedVault={handleApplyParsedVault}
                onOpenAdvisor={handleOpenAdvisor}
                renderEditor={(props) => <MasterVaultEditor {...props} />}
                renderParser={(props) => <CVParserModal {...props} />}
                renderProfiler={(props) => <ProfilerSection {...props} />}
              />
            )}

            {/* APLIKUJ — oferta, dopasowanie ATS, generator dokumentów */}
            {activeTab === 'aplikuj' && (
              <JobMatcher
                vault={vault}
                onUpdateVault={setVault}
                onOpenAdvisor={handleOpenAdvisor}
              />
            )}

            {/* Tab: Laboratorium Audytu ATS 360° (Multi-Engine Consensus) */}
            {activeTab === 'ats-lab' && (
              <AtsLabView vault={vault} />
            )}

            {/* TRENUJ — przygotowanie do rozmowy */}
            {activeTab === 'trenuj' && (
              <InterviewCockpitView
                vault={vault}
                onOpenDrill={() => setDrillOpen(true)}
                onOpenPitch={() => setPitchOpen(true)}
              />
            )}

            {/* PIPELINE — wysłane aplikacje i kontekstowy Zasobnik Rozmowy */}
            {activeTab === 'pipeline' && (
              <ApplicationTracker
                vault={vault}
                interviewToolboxUnlocked={unlocks.interviewToolbox}
                showShortcutsHint={unlocks.showShortcutsHint}
                onDismissShortcutsHint={unlocks.dismissShortcutsHint}
              />
            )}

            {/* Cennik — poza czterema krokami, wchodzi się z menu konta */}
            {activeTab === 'pricing' && <PricingView />}
          </Suspense>
        </motion.div>
      </AnimatePresence>

      <Suspense fallback={null}>
        <GeminiAdvisorModal
          isOpen={isAdvisorOpen}
          onClose={() => setAdvisorOpen(false)}
          vault={vault}
          initialQuestion={advisorInitialQuestion}
        />

        <DesignTokensShowcaseModal
          isOpen={isDesignTokensOpen}
          onClose={() => setDesignTokensOpen(false)}
        />
      </Suspense>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccessVaultLoaded={(loadedVault) => {
          setVault(loadedVault);
        }}
      />

      {/* Narzędzia treningowe — otwierane z Kokpitu w sekcji TRENUJ */}
      <SkillBridgeMatrixModal
        isOpen={isSkillBridgeOpen}
        onClose={() => setSkillBridgeOpen(false)}
        vault={vault}
      />

      <ElevatorPitchModal
        isOpen={isPitchOpen}
        onClose={() => setPitchOpen(false)}
        vault={vault}
      />

      <DrillModeModal isOpen={isDrillOpen} onClose={() => setDrillOpen(false)} />

      {/* Paleta poleceń (Cmd+K) — jedyny skrót globalny, jaki został */}
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
