import React, { useMemo } from 'react';
import { MasterVault, TailoredResume, CoverLetter, AtsCheckResult } from '../types';
import { fillSlotSentence, extractSlotsFromHighlight, eliminateSlogans } from '../lib/slotFillingEngine';
import { simulateAtsCheck } from '../lib/atsSimulator';
import { generateAntiTemplateCoverLetter } from '../lib/coverLetterEngine';
import { DocumentRenderer } from './DocumentRenderer';
import { AtsSimulatorView } from './AtsSimulatorView';
import { CoverLetterView } from './CoverLetterView';
import { CVWordBuilder } from './CVWordBuilder';
import { Eye, ShieldCheck, Layers, Type, Sparkles } from 'lucide-react';

interface RealtimeLivePreviewProps {
  vault: MasterVault;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  activeTab?: 'document' | 'builder' | 'ats' | 'coverLetter';
  onTabChange?: (tab: 'document' | 'builder' | 'ats' | 'coverLetter') => void;
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
  const [currentTab, setCurrentTab] = React.useState<'document' | 'builder' | 'ats' | 'coverLetter'>(activeTab);

  const activeView = onTabChange ? activeTab : currentTab;
  const setTab = (t: 'document' | 'builder' | 'ats' | 'coverLetter') => {
    setCurrentTab(t);
    if (onTabChange) onTabChange(t);
  };

  // Real-time dynamic calculation on keystroke/change (0-token local slot filling)
  const { tailoredResume, atsResult, coverLetter } = useMemo(() => {
    const jdKeywords = (jobDescription.toLowerCase().match(/\b[a-zA-Z0-9#+.-]{3,}\b/g) || []);

    const tailoredHighlights = vault.history.flatMap((exp) =>
      exp.highlights.map((h) => {
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
    };

    const ats = simulateAtsCheck(resume, vault, jobDescription);
    resume.atsScore = ats.overallScore;

    const cl = generateAntiTemplateCoverLetter(
      jobTitle || 'Specjalista',
      companyName || 'Pracodawca',
      jobDescription,
      vault
    );

    return {
      tailoredResume: resume,
      atsResult: ats,
      coverLetter: cl,
    };
  }, [vault, jobTitle, companyName, jobDescription]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Live Sync Status Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 px-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-800">
            Podgląd w Czasie Rzeczywistym (Real-Time Dynamic Sync)
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            0-Token Slot Filling
          </span>
        </div>

        {/* ATS Score Live Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium hidden md:inline">ATS Score Live:</span>
          <div className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 font-mono font-bold text-indigo-700 text-xs flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>{atsResult.overallScore}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setTab('builder')}
          className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs transition-colors ${
            activeView === 'builder'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Type className="w-4 h-4 text-blue-600" />
          <span>Edytor CV</span>
        </button>

        <button
          onClick={() => setTab('document')}
          className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs transition-colors ${
            activeView === 'document'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Podgląd CV</span>
        </button>

        <button
          onClick={() => setTab('ats')}
          className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs transition-colors ${
            activeView === 'ats'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Symulator ATS: {atsResult.overallScore}%</span>
        </button>

        <button
          onClick={() => setTab('coverLetter')}
          className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs transition-colors ${
            activeView === 'coverLetter'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-600" />
          <span>List Motywacyjny</span>
        </button>
      </div>

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
    </div>
  );
};
