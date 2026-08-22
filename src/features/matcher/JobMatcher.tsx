import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  FileCheck,
  Eye,
  Sliders,
  Briefcase,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
import { RealtimeLivePreview } from './RealtimeLivePreview';
import { simulateAtsCheck } from '../../lib/atsSimulator';
import { generateAntiTemplateCoverLetter } from '../../lib/coverLetterEngine';
import { triggerConfetti } from '../../lib/confetti';
import { AtsSimulatorView } from './AtsSimulatorView';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { showToast } from '../../store/useToastStore';

export interface JobMatcherProps {
  vault: MasterVault;
  onUpdateVault?: (updated: MasterVault) => void;
  onOpenAdvisor?: (initialQuestion?: string) => void;
  className?: string;
}

export const JobMatcher: React.FC<JobMatcherProps> = ({
  vault,
  onUpdateVault,
  onOpenAdvisor,
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
  const [isTailoring, setIsTailoring] = useState(false);

  const handleMatchJob = async (job: JobOffer) => {
    setSelectedJob(job);
    setIsTailoring(true);
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
        atsScore: 92,
      };

      // 2. Run Slot Filling & ATS Simulation
      const ats = simulateAtsCheck(tailored, vault, jdText);
      tailored.atsScore = ats.overallScore;
      setAtsResult(ats);

      if (ats.overallScore >= 90) {
        triggerConfetti({ count: 90, durationMs: 3000 });
      }

      // 3. Generate Anti-Template Cover Letter
      const cl = generateAntiTemplateCoverLetter(job.title, job.company, jdText, vault);
      setCoverLetter(cl);

      setTailoredResume(tailored);
    } catch (err) {
      console.error('Błąd dopasowywania oferty:', err);
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
      try {
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
        description="Wklej link do oferty lub jej treść — silnik CVELOCITY zweryfikuje Twoje CV przeciwko algorytmom ATS i wygeneruje spersonalizowane dokumenty aplikacyjne."
        badge="Zero-Token Slot Engine"
      />

      {/* Input Modes (Live / URL / Manual) */}
      <JDInputModes
        onMatchManual={handleMatchManual}
        onMatchUrl={handleMatchUrl}
        isFetchingUrl={isFetchingUrl}
        urlError={urlError}
      />


      {/* ATS Simulator & Tailored Resume Modal */}
      {selectedJob && (
        <Modal
          isOpen={isAtsModalOpen}
          onClose={() => setIsAtsModalOpen(false)}
          title={`Dopasowanie ATS dla: ${selectedJob.title} (${selectedJob.company})`}
          size="xl"
        >
          <div className="space-y-6">
            {atsResult && tailoredResume && coverLetter ? (
              <RealtimeLivePreview
                vault={vault}
                jobOffer={selectedJob}
                atsResult={atsResult}
                tailoredResume={tailoredResume}
                coverLetter={coverLetter}
                onSaveTailoredCV={() => {
                  showToast('Zapisano w pipeline', { message: 'Dopasowane dokumenty trafiły do Twoich aplikacji.' });
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
