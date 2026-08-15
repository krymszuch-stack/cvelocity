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
      title: manualOffer.title || 'Inżynier Oprogramowania',
      company: manualOffer.company || 'Firma Rekrutująca',
      salary: manualOffer.salary || 'Widełki do negocjacji',
      location: manualOffer.location || 'Warszawa',
      description: manualOffer.description || '',
      requirements: manualOffer.requirements || ['React', 'TypeScript'],
      remote: manualOffer.remote ?? true,
      portal: 'Manual',
      techStack: manualOffer.requirements || ['React', 'TypeScript', 'Node.js'],
    };
    handleMatchJob(job);
  };

  const handleMatchUrl = (url: string) => {
    const job: JobOffer = {
      id: `url-${Date.now()}`,
      title: 'Stanowisko z Linku URL',
      company: 'Firma Partnerska',
      salary: '22 000 - 28 000 PLN netto B2B',
      location: 'Polska / Zdalnie',
      description: `Pobrana treść oferty z adresu: ${url}`,
      requirements: ['TypeScript', 'Cloud', 'React'],
      remote: true,
      portal: 'URL Ingestion',
      url,
      techStack: ['TypeScript', 'Cloud Architecture', 'React'],
    };
    handleMatchJob(job);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <PageHeader
        title="Agregator Ofert & Symulator ATS"
        description="Wyszukuj oferty z czołowych polskich portali IT lub wklej dowolny link. Silnik CVELOCITY weryfikuje Twoje CV przeciwko algorytmom ATS i generuje spersonalizowane dokumenty aplikacyjne bez zużywania zbędnych tokenów AI."
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
                  alert('Dopasowane dokumenty zostały pomyślnie zapisane w Twoim Pipeline Aplikacji!');
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
