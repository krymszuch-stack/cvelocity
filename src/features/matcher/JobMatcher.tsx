import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  RotateCcw,
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
import { ParsedJobDescription } from '../../types/api';
import { parseJobDescriptionLocal } from '../../lib/jdParser';
import { JDInputModes } from './JDInputModes';
import { JobBoard } from './JobBoard';
import { RealtimeLivePreview } from './RealtimeLivePreview';
import { useJobs } from '../../hooks/useJobs';
import { simulateAtsCheck } from '../../lib/atsSimulator';
import { generateAntiTemplateCoverLetter } from '../../lib/coverLetterEngine';
import { semanticCacheInstance } from '../../lib/semanticCache';
import { triggerConfetti } from '../../lib/confetti';
import { AtsSimulatorView } from '../../components/AtsSimulatorView';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { showToast } from '../../store/useToastStore';

export interface JobMatcherProps {
  vault: MasterVault;
  onUpdateStats: () => void;
  onUpdateVault?: (updated: MasterVault) => void;
  onOpenAdvisor?: (initialQuestion?: string) => void;
  className?: string;
}

export const JobMatcher: React.FC<JobMatcherProps> = ({
  vault,
  onUpdateStats,
  onUpdateVault,
  onOpenAdvisor,
  className = '',
}) => {
  const [searchParams, setSearchParams] = useState({
    keywords: 'React Developer',
    location: 'Warszawa',
    remoteOnly: false,
    seniority: 'ALL',
    portal: 'ALL',
  });

  const { jobs, isLoading, refetch } = useJobs({
    keywords: searchParams.keywords,
    location: searchParams.location,
    remoteOnly: searchParams.remoteOnly,
    portal: searchParams.portal,
    seniority: searchParams.seniority,
  });

  // ATS Matching State
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [atsResult, setAtsResult] = useState<AtsCheckResult | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);

  const handleSearchLive = (params: typeof searchParams) => {
    setSearchParams(params);
  };

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
      semanticCacheInstance.recordSlotFillingHit();
      onUpdateStats();
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
      const fetchResponse = await fetch('/api/fetch-jd-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const fetched = await fetchResponse.json();

      if (!fetchResponse.ok || !fetched.success) {
        setUrlError(fetched.error || 'Nie udało się pobrać oferty z podanego adresu URL.');
        return;
      }

      // Structure the scraped text via the AI parser, falling back to the local heuristic.
      let parsed: Partial<ParsedJobDescription> = {};
      try {
        const parseResponse = await fetch('/api/parse-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawJdText: fetched.descriptionRaw }),
        });
        const parseData = await parseResponse.json();
        parsed = parseData.success && parseData.parsedJd
          ? parseData.parsedJd
          : parseJobDescriptionLocal(fetched.descriptionRaw);
      } catch {
        parsed = parseJobDescriptionLocal(fetched.descriptionRaw);
      }

      const job: JobOffer = {
        id: `url-${Date.now()}`,
        title: parsed.title || fetched.title || 'Oferta z adresu URL',
        company: parsed.company || fetched.company || '',
        salary: parsed.salary || '',
        location: '',
        description: fetched.descriptionRaw,
        requirements: parsed.requirements || [],
        remote: false,
        portal: 'URL',
        url,
        techStack: parsed.techStack || [],
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
        description="Wklej link do oferty lub jej treść — silnik CVELOCITY zweryfikuje Twoje CV przeciwko algorytmom ATS i wygeneruje spersonalizowane dokumenty aplikacyjne. Lista poniżej zawiera oferty przykładowe (dane demonstracyjne), a nie wyniki wyszukiwania na żywo."
        badge="Zero-Token Slot Engine"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={() => refetch()}
            >
              Odśwież Oferty
            </Button>
          </div>
        }
      />

      {/* Input Modes (Live / URL / Manual) */}
      <JDInputModes
        onSearchLive={handleSearchLive}
        onMatchManual={handleMatchManual}
        onMatchUrl={handleMatchUrl}
        isSearching={isLoading}
        isFetchingUrl={isFetchingUrl}
        urlError={urlError}
      />

      {/* Job Board with Spotlight Cards */}
      <JobBoard
        jobs={jobs}
        isLoading={isLoading}
        onMatchJob={handleMatchJob}
        onResetFilters={() =>
          setSearchParams({
            keywords: '',
            location: '',
            remoteOnly: false,
            seniority: 'ALL',
            portal: 'ALL',
          })
        }
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
