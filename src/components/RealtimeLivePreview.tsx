import React, { useMemo } from 'react';
import { MasterVault, TailoredResume, CoverLetter, AtsCheckResult, InterviewCheatSheet } from '../types';
import { fillSlotSentence, extractSlotsFromHighlight, eliminateSlogans } from '../lib/slotFillingEngine';
import { rankExperienceByRelevance, rankHighlightsByRelevance } from '../lib/relevanceRanking';
import { simulateAtsCheck } from '../lib/atsSimulator';
import { generateAntiTemplateCoverLetter } from '../lib/coverLetterEngine';
import { parseJobDescriptionLocal } from '../lib/jdParser';
import { buildLocalInterviewCheatSheet } from '../lib/interviewCheatSheetEngine';
import { DocumentRenderer } from './DocumentRenderer';
import { AtsSimulatorView } from './AtsSimulatorView';
import { CoverLetterView } from './CoverLetterView';
import { CVWordBuilder } from './CVWordBuilder';
import { InterviewCheatSheetView } from './InterviewCheatSheetView';
import { Eye, ShieldCheck, Layers, Type, Sparkles, GraduationCap } from 'lucide-react';
import { Tabs } from './ui/Tabs';
import { StatusBadge } from './ui/StatusBadge';

type PreviewTab = 'document' | 'builder' | 'ats' | 'coverLetter' | 'cheatsheet';

interface RealtimeLivePreviewProps {
  vault: MasterVault;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  activeTab?: PreviewTab;
  onTabChange?: (tab: PreviewTab) => void;
  onUpdateVault?: (updated: MasterVault) => void;
  onOpenAdvisor?: (question?: string) => void;
}

export const RealtimeLivePreview: React.FC<RealtimeLivePreviewProps> = ({
  vault,
  jobTitle,
  companyName,
  jobDescription,
  activeTab = 'builder',
  onTabChange,
  onUpdateVault,
  onOpenAdvisor,
}) => {
  const [currentTab, setCurrentTab] = React.useState<PreviewTab>(activeTab);

  const activeView = onTabChange ? activeTab : currentTab;
  const setTab = (t: PreviewTab) => {
    setCurrentTab(t);
    if (onTabChange) onTabChange(t);
  };

  // Real-time dynamic calculation on keystroke/change (0-token local slot filling)
  const { tailoredResume, atsResult, coverLetter, cheatSheet } = useMemo(() => {
    const jdKeywords = (jobDescription.toLowerCase().match(/\b[a-zA-Z0-9#+.-]{3,}\b/g) || []);

    // 0-token relevance ranking, same as the full hybrid pipeline in JobMatcher.tsx
    const rankedExperience = rankExperienceByRelevance(vault.history, jdKeywords, jobTitle || '');
    const experienceOrder = rankedExperience.map((r) => r.experience.id);

    const tailoredHighlights = rankedExperience.flatMap(({ experience: exp }) =>
      rankHighlightsByRelevance(exp.highlights, jdKeywords).map(({ highlight: h }) => {
        const slot = extractSlotsFromHighlight(h);
        const filled = fillSlotSentence(slot, jdKeywords, 'ACTION_FIRST');
        return {
          experienceId: exp.id,
          role: exp.role,
          company: exp.company,
          originalText: h.text,
          optimizedText: filled,
          source: 'SLOT_FILLING' as const,
          keywordsMatched: slot.keywords,
        };
      })
    );

    const resume: TailoredResume = {
      targetJobTitle: jobTitle || 'Specjalista / Engineer',
      companyName: companyName || 'Docelowy Pracodawca',
      summary: eliminateSlogans(vault.personalInfo.summary || '').purifiedText,
      selectedHighlights: tailoredHighlights,
      skillsMatched: {
        hardSkills: vault.skillsMatrix.hardSkills,
        toolsAndTech: vault.skillsMatrix.toolsAndTech,
        softSkills: vault.skillsMatrix.softSkills,
      },
      atsScore: 0,
      experienceOrder,
    };

    const ats = simulateAtsCheck(resume, vault, jobDescription);
    resume.atsScore = ats.overallScore;

    const cl = generateAntiTemplateCoverLetter(
      jobTitle || 'Specjalista',
      companyName || 'Pracodawca',
      jobDescription,
      vault
    );

    // Pass the user's title as-is: the parser treats a supplied title as authoritative
    // and only sniffs one from the text when the user left the field empty.
    const parsedJdLocal = parseJobDescriptionLocal(jobDescription, jobTitle);
    const cs = buildLocalInterviewCheatSheet(parsedJdLocal, vault, jobTitle, companyName);

    return {
      tailoredResume: resume,
      atsResult: ats,
      coverLetter: cl,
      cheatSheet: cs,
    };
  }, [vault, jobTitle, companyName, jobDescription]);

  const scoreVariant =
    atsResult.overallScore >= 75 ? 'success' : atsResult.overallScore >= 45 ? 'warning' : 'danger';

  return (
    <div className="space-y-4">
      {/* Live sync status */}
      <div className="bg-surface border border-line rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-70" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-500" />
          </span>
          <span className="text-xs font-bold text-ink truncate">Podgląd w czasie rzeczywistym</span>
          <StatusBadge variant="success" size="sm" showIcon={false} className="hidden sm:inline-flex">
            <Sparkles className="w-3 h-3" /> 0 tokenów
          </StatusBadge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted font-medium hidden md:inline">Wynik ATS na żywo</span>
          <StatusBadge variant={scoreVariant} showIcon={false}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="sv-tnum">{atsResult.overallScore}%</span>
          </StatusBadge>
        </div>
      </div>

      <Tabs
        variant="underline"
        active={activeView}
        onChange={setTab}
        items={[
          { id: 'builder', label: 'Edytor CV', icon: Type },
          { id: 'document', label: 'Podgląd CV', icon: Eye },
          { id: 'ats', label: `Symulator ATS · ${atsResult.overallScore}%`, icon: ShieldCheck },
          { id: 'coverLetter', label: 'List motywacyjny', icon: Layers },
          { id: 'cheatsheet', label: 'Ściąga na Rozmowę', icon: GraduationCap },
        ]}
      />

      {/* View Output */}
      {activeView === 'builder' && (
        <CVWordBuilder
          vault={vault}
          jobDescription={jobDescription}
          jobTitle={jobTitle}
          companyName={companyName}
          onUpdateVault={onUpdateVault || (() => {})}
          onOpenAdvisor={onOpenAdvisor}
        />
      )}

      {activeView === 'document' && (
        <DocumentRenderer resume={tailoredResume} vault={vault} />
      )}

      {activeView === 'ats' && (
        <AtsSimulatorView result={atsResult} />
      )}

      {activeView === 'coverLetter' && (
        <CoverLetterView
          coverLetter={coverLetter}
          vault={vault}
          jobTitle={jobTitle}
          companyName={companyName}
          jobDescription={jobDescription}
          onOpenAdvisor={onOpenAdvisor}
        />
      )}

      {activeView === 'cheatsheet' && (
        <InterviewCheatSheetView
          cheatSheet={cheatSheet}
          vault={vault}
          jobTitle={jobTitle}
          companyName={companyName}
          jobDescription={jobDescription}
          onOpenAdvisor={onOpenAdvisor}
        />
      )}
    </div>
  );
};
