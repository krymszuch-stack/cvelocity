import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  MasterVault,
  TailoredResume,
  CoverLetter,
  AtsCheckResult,
  JobOffer,
} from '../../types';
import type { FetchJdUrlResponse } from '../../types/api';
import { ApiError, api } from '../../lib/apiClient';
import type { ParsedJobDescription } from '../../lib/jdParser';
import { parseJobDescriptionResponse } from '../../lib/jdSchema';
import { parseJobDescriptionLocal } from '../../lib/jdParser';
import { JDInputModes } from './JDInputModes';
import { JobFeasibilityAdvisor } from './JobFeasibilityAdvisor';
import type { MobilityPreferences } from '../../lib/commuteCalculator';
import { RealtimeLivePreview } from './RealtimeLivePreview';
import { simulateAtsCheck } from '../../lib/atsSimulator';
import { generateAntiTemplateCoverLetter } from '../../lib/coverLetterEngine';
import { triggerConfetti } from '../../lib/confetti';
import { grantXp } from '../../store/useGamificationStore';
import { consumeAiLocally } from '../../store/useEntitlements';
import { contributeJobIntel } from '../../lib/crowdsourceIntel';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useApplications } from '../../store/useApplications';
import { JobApplication } from '../../types';
import { showToast } from '../../store/useToastStore';

export interface JobMatcherProps {
  vault: MasterVault;
  onUpdateVault?: (updated: MasterVault) => void;
  className?: string;
}

export const JobMatcher: React.FC<JobMatcherProps> = ({
  vault,
  onUpdateVault,
  className = '',
}) => {
  // ATS Matching State
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [atsResult, setAtsResult] = useState<AtsCheckResult | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [parsedJd, setParsedJd] = useState<ParsedJobDescription | null>(null);
  // Błąd dopasowania musiałby widzieć modal — wcześniej catch tylko logował,
  // a modal czekał na wyniki w nieskończoność.
  const [matchError, setMatchError] = useState<string | null>(null);

  // Preferencje dojazdu żyją w vaulcie, a nie w stanie widoku: kalkulator ma
  // pamiętać, jak daleko użytkownik mieszka, przy każdej kolejnej ofercie.
  const handleMobilityChange = (mobilityPreferences: MobilityPreferences) => {
    onUpdateVault?.({ ...vault, mobilityPreferences });
  };
  const [isTailoring, setIsTailoring] = useState(false);

  const { saveApplication } = useApplications();

  const handleMatchJob = async (job: JobOffer) => {
    setSelectedJob(job);
    setIsTailoring(true);
    setMatchError(null);
    setIsAtsModalOpen(true);

    try {
      const jdText = job.description || job.requirements?.join(' ') || job.title;

      // 1. Create Tailored Resume
      const tailored: TailoredResume = {
        targetJobTitle: job.title,
        companyName: job.company,
        summary: `Dopasowany profil inżynierski pod stanowisko ${job.title} w firmie ${job.company}.`,
        selectedHighlights: vault.history.flatMap((h) =>
          h.highlights.map((hl) => ({
            experienceId: h.id,
            role: h.role,
            company: h.company,
            originalText: hl.text,
            optimizedText: hl.text,
            source: 'SLOT_FILLING' as const,
            keywordsMatched: hl.keywords || [],
          }))
        ),
        skillsMatched: {
          hardSkills: vault.skillsMatrix?.hardSkills || [],
          toolsAndTech: vault.skillsMatrix?.toolsAndTech || [],
          softSkills: vault.skillsMatrix?.softSkills || [],
        },
        // Wypełniane zaraz po symulacji. Stała w tym miejscu była wartością
        // wymyśloną, którą łatwo przeoczyć przy refaktorze i wypuścić na ekran.
        atsScore: 0,
      };

      // 2. Run Slot Filling & ATS Simulation
      const ats = simulateAtsCheck(tailored, vault, jdText);
      tailored.atsScore = ats.overallScore;
      setAtsResult(ats);

      // Punkty za realny wynik symulatora, nie za samo kliknięcie. Próg jest
      // w `XP_EVENTS`, tutaj zostaje wyłącznie warunek — gdyby nagradzać każde
      // dopasowanie, licznik przestałby cokolwiek znaczyć.
      if (ats.overallScore >= 85) {
        grantXp('ats_high_score', `${job.company}|${job.title}`);
      }

      if (ats.overallScore >= 90) {
        triggerConfetti({ count: 90, durationMs: 3000 });
      }


      // 3. Generate Anti-Template Cover Letter
      const cl = generateAntiTemplateCoverLetter(job.title, job.company, jdText, vault);
      setCoverLetter(cl);

      setTailoredResume(tailored);
    } catch (err) {
      console.error('Błąd dopasowywania oferty:', err);
      // Bez tego modal wisiał na spinnerze „Kalkulacja..." do zamknięcia ręcznego.
      setMatchError(
        'Nie udało się policzyć dopasowania dla tej oferty. Spróbuj ponownie albo uzupełnij profil w sekcji PROFIL.'
      );
    } finally {
      setIsTailoring(false);
    }
  };

  const handleMatchManual = (manualOffer: Partial<JobOffer>) => {
    const job: JobOffer = {
      id: manualOffer.id || `manual-${Date.now()}`,
      title: manualOffer.title || '',
      company: manualOffer.company || '',
      salary: manualOffer.salary || '',
      location: manualOffer.location || '',
      description: manualOffer.description || '',
      requirements: manualOffer.requirements || [],
      remote: manualOffer.remote ?? false,
      portal: 'Manual',
      techStack: manualOffer.requirements || [],
    };
    handleMatchJob(job);
  };

  const handleMatchUrl = async (url: string) => {
    setUrlError(null);
    setIsFetchingUrl(true);

    try {
      let fetched: FetchJdUrlResponse & { success: true };
      try {
        fetched = await api.post<FetchJdUrlResponse & { success: true }>('/api/fetch-jd-url', { url });
      } catch (err) {
        setUrlError(
          err instanceof ApiError
            ? err.message
            : 'Nie udało się pobrać oferty z podanego adresu URL.'
        );
        return;
      }

      // Structure the scraped text via the AI parser, falling back to the local
      // heuristic. The response is validated rather than trusted: `res.json()` is
      // `any`, so a shape mismatch would otherwise pass typecheck and leave every
      // field undefined — throwing away a result we paid the model for.
      let parsed: ParsedJobDescription;
      // Podpowiedź licznika na zero = strzał skazany na 402; lokalny parser
      // daje od razu gorszy, ale uczciwy wynik. Prawdę o limicie i tak zna
      // serwer — tu decydujemy tylko, czy warto wysyłać.
      const aiAvailable = consumeAiLocally();
      try {
        if (!aiAvailable) throw new Error('lokalny limit AI wyczerpany');
        const parseData = await api.post<{ parsedJd: unknown }>('/api/parse-jd', {
          rawJdText: fetched.descriptionRaw,
        });
        parsed =
          parseJobDescriptionResponse(parseData.parsedJd) ||
          parseJobDescriptionLocal(fetched.descriptionRaw);
      } catch {
        // Model bywa niedostępny, a limit kwot bywa wyczerpany. Lokalny parser
        // heurystyczny daje gorszy wynik, ale zawsze jakiś — użytkownik nie
        // zostaje z pustym ekranem po tym, jak ofertę udało się już pobrać.
        parsed = parseJobDescriptionLocal(fetched.descriptionRaw);
      }

      // Gdy portal udostępnia dane strukturalne (schema.org/JobPosting), mają one
      // pierwszeństwo przed wynikiem modelu: pochodzą wprost od wystawiającego
      // ofertę, więc tytuł, firma, widełki i tryb pracy są faktem, a nie
      // odczytem z tekstu. Model uzupełnia wtedy tylko to, czego w nich nie ma.
      const fromPortal = fetched.extraction?.structured === true;

      const job: JobOffer = {
        id: `url-${Date.now()}`,
        title: (fromPortal && fetched.title) || parsed.jobTitle || fetched.title || 'Oferta z adresu URL',
        company: (fromPortal && fetched.company) || parsed.companyName || fetched.company || '',
        salary: fetched.salary || parsed.salaryRange || '',
        location: fetched.location || '',
        description: fetched.descriptionRaw,
        requirements: parsed.requiredHardSkills?.length
          ? parsed.requiredHardSkills
          : (fetched.skills ?? []),
        remote: fetched.remote ?? parsed.workModel === 'REMOTE',
        portal: 'URL',
        url,
        techStack: parsed.toolsAndTech?.length ? parsed.toolsAndTech : (fetched.skills ?? []),
      };

      // Ogłoszenie zostało rozpoznane — to jest moment, w którym coś realnie
      // powstało, więc tu idą punkty i tu idzie cegiełka do wspólnej bazy.
      // Wysyłka jest anonimowa i „best effort": jej błąd nie może przerwać
      // dopasowania, które użytkownik właśnie uruchomił.
      // Dowód pracy: adres ogłoszenia jako cel (drugie wklejenie tego samego
      // linku nic nie daje) i długość treści, bo trzy zdania to nie ogłoszenie.
      grantXp('jd_ingested', url, { chars: (fetched.descriptionRaw ?? '').trim().length });
      contributeJobIntel({ ...parsed, sourceUrl: url });
      setParsedJd(parsed);

      handleMatchJob(job);
    } catch (err) {
      console.error('Błąd pobierania oferty z URL:', err);
      setUrlError('Błąd połączenia podczas pobierania oferty. Spróbuj wkleić treść ogłoszenia ręcznie.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <PageHeader
        title="Dopasowanie Ofert & Symulator ATS"
        description="Wklej link do oferty lub jej treść — symulator ATS sprawdzi pokrycie wymagań Twojego CV, a dokumenty aplikacyjne przygotujesz na tej podstawie."
        badge="Analiza bez tokenów AI"
      />

      {/* Input Modes (Live / URL / Manual) */}
      <JDInputModes
        onMatchManual={handleMatchManual}
        onMatchUrl={handleMatchUrl}
        isFetchingUrl={isFetchingUrl}
        urlError={urlError}
      />


      {/* Kalkulator opłacalności — pokazuje się dopiero, gdy jest co liczyć. */}
      {selectedJob && (
        <JobFeasibilityAdvisor
          offer={selectedJob}
          parsed={parsedJd}
          preferences={vault.mobilityPreferences}
          onPreferencesChange={handleMobilityChange}
        />
      )}

      {/* ATS Simulator & Tailored Resume Modal */}
      {selectedJob && (
        <Modal
          isOpen={isAtsModalOpen}
          onClose={() => setIsAtsModalOpen(false)}
          title={`Dopasowanie ATS dla: ${selectedJob.title} (${selectedJob.company})`}
          size="xl"
        >
          <div className="space-y-6">
            {matchError ? (
              <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                <p className="max-w-md text-sm font-semibold text-danger-fg">{matchError}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RefreshCw}
                    onClick={() => handleMatchJob(selectedJob)}
                    disabled={isTailoring}
                  >
                    Spróbuj ponownie
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsAtsModalOpen(false)}>
                    Zamknij
                  </Button>
                </div>
              </div>
            ) : atsResult && tailoredResume && coverLetter ? (
              <RealtimeLivePreview
                vault={vault}
                jobOffer={selectedJob}
                atsResult={atsResult}
                tailoredResume={tailoredResume}
                coverLetter={coverLetter}
                onSaveTailoredCV={() => {
                  // Przycisk wcześniej wyłącznie pokazywał komunikat „Zapisano
                  // w pipeline". Nic nie zapisywał — użytkownik wracał do
                  // Pipeline i nie zastawał tam niczego. To jest ten zapis.
                  //
                  // Wynik ATS i braki idą z tej samej symulacji, którą widać
                  // obok na ekranie, więc reguła „popraw dopasowanie" na
                  // ekranie startowym opiera się na liczbie faktycznie
                  // zmierzonej, a nie oszacowanej po fakcie.
                  const application: JobApplication = {
                    id: `app-${Date.now()}`,
                    company: selectedJob.company,
                    position: selectedJob.title,
                    salary: selectedJob.salary || '',
                    date: new Date().toISOString().slice(0, 10),
                    status: 'Wysłana',
                    jobUrl: selectedJob.url,
                    atsScore: atsResult.overallScore,
                    missingKeywords: atsResult.missingHardSkills,
                  };

                  saveApplication(application);
                  showToast('Zapisano w Pipeline', {
                    message: `${selectedJob.title} — dopasowanie ${atsResult.overallScore}%.`,
                  });
                  setIsAtsModalOpen(false);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Sparkles className="h-8 w-8 animate-spin text-brand-600 mb-3" />
                <p className="font-sans text-sm font-bold text-ink">
                  Kalkulacja dopasowania ATS i generowanie dokumentów aplikacyjnych...
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
