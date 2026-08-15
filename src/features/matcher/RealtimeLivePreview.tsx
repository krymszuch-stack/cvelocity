import React, { useState } from 'react';
import {
  Eye,
  FileEdit,
  ShieldCheck,
  FileText,
  BookOpen,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MasterVault,
  JobOffer,
  AtsCheckResult,
  TailoredResume,
  CoverLetter,
} from '../../types';
import { DocumentRenderer } from './DocumentRenderer';
import { CVWordBuilder } from './CVWordBuilder';
import { AtsSimulatorView } from './AtsSimulatorView';
import { CoverLetterView } from './CoverLetterView';
import { InterviewCheatSheetView } from './InterviewCheatSheetView';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';

export type SubTabId = 'preview' | 'editor' | 'report' | 'coverLetter' | 'cheatSheet';

export interface RealtimeLivePreviewProps {
  vault: MasterVault;
  jobOffer: JobOffer;
  atsResult: AtsCheckResult;
  tailoredResume: TailoredResume;
  coverLetter: CoverLetter;
  onSaveTailoredCV?: () => void;
  className?: string;
}

export const RealtimeLivePreview: React.FC<RealtimeLivePreviewProps> = ({
  vault,
  jobOffer,
  atsResult,
  tailoredResume,
  coverLetter,
  onSaveTailoredCV,
  className = '',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('preview');

  const subTabs = [
    { id: 'preview' as SubTabId, label: 'Podgląd CV (A4)', icon: Eye },
    { id: 'editor' as SubTabId, label: 'Edytor Dokumentu', icon: FileEdit },
    { id: 'report' as SubTabId, label: 'Raport ATS & Wynik', icon: ShieldCheck },
    { id: 'coverLetter' as SubTabId, label: 'List Motywacyjny', icon: FileText },
    { id: 'cheatSheet' as SubTabId, label: 'Ściąga na Rozmowę', icon: BookOpen },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Underline Sub-Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-2">
        <Tabs<SubTabId>
          items={subTabs}
          active={activeSubTab}
          onChange={setActiveSubTab}
          variant="underline"
        />

        {onSaveTailoredCV && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={CheckCircle2}
            onClick={onSaveTailoredCV}
          >
            Zapisz w Pipeline Aplikacji
          </Button>
        )}
      </div>

      {/* Sub-Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
        >
          {activeSubTab === 'preview' && (
            <DocumentRenderer
              vault={vault}
              tailoredResume={tailoredResume}
            />
          )}

          {activeSubTab === 'editor' && (
            <CVWordBuilder
              vault={vault}
            />
          )}

          {activeSubTab === 'report' && (
            <AtsSimulatorView
              result={atsResult}
            />
          )}

          {activeSubTab === 'coverLetter' && (
            <CoverLetterView
              coverLetter={coverLetter}
            />
          )}

          {activeSubTab === 'cheatSheet' && (
            <InterviewCheatSheetView
              vault={vault}
              jobOffer={jobOffer}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
