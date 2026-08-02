import React, { useState } from 'react';
import { MasterVault, TailoredResume, CoverLetter, AtsCheckResult, TailoredHighlight } from '../types';
import { Zap, Sparkles, Cpu, CheckCircle2, AlertCircle, FileCheck, Layers, Eye, RefreshCw, BarChart, Search, Radio, Link, Globe, Gift, ShieldAlert, PlusCircle, Check, DollarSign, Briefcase, Type } from 'lucide-react';
import { AdvisorButton } from './ui/AdvisorButton';
import { fillSlotSentence, extractSlotsFromHighlight, eliminateSlogans } from '../lib/slotFillingEngine';
import { semanticCacheInstance } from '../lib/semanticCache';
import { simulateAtsCheck } from '../lib/atsSimulator';
import { generateAntiTemplateCoverLetter } from '../lib/coverLetterEngine';
import { analyzeJdMatchWithVault, parseJobDescriptionLocal, JDVaultMatchAnalysis } from '../lib/jdParser';
import { rankExperienceByRelevance, rankHighlightsByRelevance } from '../lib/relevanceRanking';
import { AtsSimulatorView } from './AtsSimulatorView';
import { CoverLetterView } from './CoverLetterView';
import { DocumentRenderer } from './DocumentRenderer';
import { JDParserModal } from './JDParserModal';
import { RealtimeLivePreview } from './RealtimeLivePreview';
import { CVWordBuilder } from './CVWordBuilder';
import { AutocompleteInput } from './AutocompleteInput';
import { SUGGESTED_JOB_TITLES } from '../lib/autocompleteSuggestions';

interface JobMatcherProps {
  vault: MasterVault;
  onUpdateStats: () => void;
  onUpdateVault?: (updated: MasterVault) => void;
  onOpenAdvisor?: (question?: string) => void;
}

export const JobMatcher: React.FC<JobMatcherProps> = ({ vault, onUpdateStats, onUpdateVault, onOpenAdvisor }) => {
  const [jobTitle, setJobTitle] = useState('Senior Full-Stack Engineer & Cloud Systems Architect');
  const [companyName, setCompanyName] = useState('TechGrowth Inc.');
  const [jobDescription, setJobDescription] = useState(
    `Poszukujemy doświadczonego Inżyniera Oprogramowania (Senior Full-Stack Engineer), który dołączy do naszego zespołu.

Wymagania kluczowe:
- Min. 5 lat doświadczenia w TypeScript, React.js oraz Node.js (Express).
- Doświadczenie w optymalizacji zapytań SQL, baz danych PostgreSQL i Redis.
- Znajomość architektury mikroserwisów, konteneryzacji (Docker, Kubernetes) oraz CI/CD.
- Znajomość systemów chmurowych (AWS/GCP).
- Umiejętność kierowania zespołem technologicznym (Tech Lead) i wprowadzania praktyk Code Review.
- Język angielski na poziomie C1.
- Prawo jazdy kat. B (Wymóg konieczny).`
  );

  // Direct Scraper & Audit States
  const [jdUrlInput, setJdUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [scraperError, setScraperError] = useState<string | null>(null);
  const [matchAudit, setMatchAudit] = useState<JDVaultMatchAnalysis | null>(null);
  const [addedSkills, setAddedSkills] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeViewTab, setActiveViewTab] = useState<'document' | 'builder' | 'ats' | 'coverLetter'>('builder');
  const [isJdParserOpen, setIsJdParserOpen] = useState(false);
  const [isLivePreviewMode, setIsLivePreviewMode] = useState(true);

  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [atsResult, setAtsResult] = useState<AtsCheckResult | null>(null);

  // Quick Scraper Handler directly from main URL input
  const handleFetchOfferUrl = async () => {
    if (!jdUrlInput.trim() || !jdUrlInput.startsWith('http')) {
      alert('Wklej prawidłowy link do oferty pracy (np. https://pracuj.pl/... lub https://nofluffjobs.com/...)');
      return;
    }

    setIsFetchingUrl(true);
    setScraperError(null);

    try {
      const response = await fetch('/api/fetch-jd-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jdUrlInput.trim() }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.parsedJd) {
        if (data.parsedJd.jobTitle) setJobTitle(data.parsedJd.jobTitle);
        if (data.parsedJd.companyName) setCompanyName(data.parsedJd.companyName);
        if (data.rawJdText) setJobDescription(data.rawJdText);

        // Run audit against vault
        const audit = analyzeJdMatchWithVault(data.parsedJd, vault);
        setMatchAudit(audit);
      } else {
        if (response.status === 403 || data.is403Blocked) {
          setScraperError(
            'Portal ogłoszeń (np. Pracuj.pl, LinkedIn) zablokował automatyczne pobieranie (403 Forbidden). Skopiuj tekst ze strony oferty i wklej go w polu "Treść Ogłoszenia o Pracę" poniżej.'
          );
        } else {
          throw new Error(data.error || 'Nie udało się pobrać treści oferty z podanego URL.');
        }
      }
    } catch (err: any) {
      console.warn('URL Scraper Error:', err);
      const is403 = err?.message?.includes('403') || err?.message?.includes('Forbidden');
      if (is403) {
        setScraperError(
          'Portal ogłoszeń zablokował automatyczny dostęp (403 Forbidden). Skopiuj tekst oferty ze strony i wklej go bezpośrednio w polu "Treść Ogłoszenia o Pracę" poniżej.'
        );
      } else {
        setScraperError(err?.message || 'Nie udało się połączyć ze stroną. Możesz wkleić surowy tekst ogłoszenia ręcznie w polu poniżej.');
      }
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Run audit on manual text change if requested
  const handleAnalyzeText = () => {
    if (!jobDescription.trim()) return;
    const localParsed = parseJobDescriptionLocal(jobDescription);
    const audit = analyzeJdMatchWithVault(localParsed, vault);
    setMatchAudit(audit);
  };

  const handleQuickAddSkillToVault = (skill: string) => {
    if (!onUpdateVault) return;

    const updatedVault: MasterVault = {
      ...vault,
      skillsMatrix: {
        ...vault.skillsMatrix,
        hardSkills: vault.skillsMatrix.hardSkills.includes(skill)
          ? vault.skillsMatrix.hardSkills
          : [...vault.skillsMatrix.hardSkills, skill],
      },
    };

    onUpdateVault(updatedVault);
    setAddedSkills((prev) => [...prev, skill]);
  };

  const runHybridPipeline = async () => {
    if (!jobDescription.trim()) {
      alert('Wprowadź treść ogłoszenia o pracę (Job Description).');
      return;
    }

    setIsGenerating(true);
    setLogs([]);
    const executionLogs: string[] = [];

    const addLog = (msg: string) => {
      executionLogs.push(`[${new Date().toLocaleTimeString('pl-PL')}] ${msg}`);
      setLogs([...executionLogs]);
    };

    addLog('Rozpoczęcie hybrydowej transformacji CV pod ofertę pracy...');

    // Extract Keywords from JD
    const jdKeywords = jobDescription
      .toLowerCase()
      .match(/\b[a-zA-Z0-9#+.-]{3,}\b/g) || [];

    const tailoredHighlights: TailoredHighlight[] = [];

    // Step 0: Rank experience blocks & their bullets by JD keyword relevance (0 tokens, pure math).
    // This decides *which* history to foreground for this offer without ever calling AI.
    const rankedExperience = rankExperienceByRelevance(vault.history, jdKeywords, jobTitle);
    const experienceOrder = rankedExperience.map((r) => r.experience.id);
    addLog(`Ustalono kolejność trafności doświadczenia (0 tokenów): ${rankedExperience.map((r) => r.experience.company).join(' > ')}`);

    // Process Work History, most relevant first
    for (const { experience: exp } of rankedExperience) {
      addLog(`Przetwarzanie historii stanowiska: ${exp.role} w ${exp.company}...`);

      const rankedHighlights = rankHighlightsByRelevance(exp.highlights, jdKeywords);
      for (const { highlight: h } of rankedHighlights) {
        // Step 1: Check Local Semantic Cache (>0.88 similarity)
        const cacheHit = semanticCacheInstance.findMatch(h.text, 0.88);

        if (cacheHit.match) {
          addLog(`TRAFIENIE CACHE (0 tokenów! Podobieństwo: ${Math.round(cacheHit.similarity * 100)}%): "${cacheHit.match.optimizedText.slice(0, 45)}..."`);
          tailoredHighlights.push({
            experienceId: exp.id,
            role: exp.role,
            company: exp.company,
            originalText: h.text,
            optimizedText: cacheHit.match.optimizedText,
            source: 'SEMANTIC_CACHE',
            keywordsMatched: cacheHit.match.keywords,
          });
          continue;
        }

        // Step 2: Local Slot Filling Engine (0 tokens)
        const slot = extractSlotsFromHighlight(h);
        const slotFilled = fillSlotSentence(slot, jdKeywords, 'ACTION_FIRST');
        semanticCacheInstance.recordSlotFillingHit();

        addLog(`LOCAL SLOT FILLING (0 tokenów): "${slotFilled.slice(0, 50)}..."`);

        tailoredHighlights.push({
          experienceId: exp.id,
          role: exp.role,
          company: exp.company,
          originalText: h.text,
          optimizedText: slotFilled,
          source: 'SLOT_FILLING',
          keywordsMatched: slot.keywords,
        });
      }
    }

    // Step 3: Check for Delta Prompting if needed
    const tempResume: TailoredResume = {
      targetJobTitle: jobTitle,
      companyName,
      summary: eliminateSlogans(vault.personalInfo.summary).purifiedText,
      selectedHighlights: tailoredHighlights,
      skillsMatched: {
        hardSkills: vault.skillsMatrix.hardSkills,
        toolsAndTech: vault.skillsMatrix.toolsAndTech,
        softSkills: vault.skillsMatrix.softSkills,
      },
      atsScore: 0,
    };

    const initialAtsCheck = simulateAtsCheck(tempResume, vault, jobDescription);
    addLog(`Wstępny wynik ATS Match Score: ${initialAtsCheck.overallScore}%`);

    if (initialAtsCheck.missingHardSkills.length > 0) {
      addLog(`Wykryto brakujące słowa klucze: ${initialAtsCheck.missingHardSkills.slice(0, 3).join(', ')}. Inicjalizacja Delta Prompting przez Gemini API...`);

      try {
        const topBullet = tailoredHighlights[0];
        if (topBullet) {
          semanticCacheInstance.recordGeminiDeltaCall();
          const res = await fetch('/api/delta-optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              missingKeywords: initialAtsCheck.missingHardSkills.slice(0, 4),
              existingBullet: topBullet.originalText,
              targetRole: jobTitle,
            }),
          });

          const data = await res.json();
          if (data.success && data.optimizedText) {
            addLog(`GEMINI DELTA PROMPTING ZAKOŃCZONE: Dokonano precyzyjnej mikromodyfikacji frazy bez halucynacji!`);
            tailoredHighlights[0] = {
              ...topBullet,
              optimizedText: data.optimizedText,
              source: 'GEMINI_DELTA',
              keywordsMatched: data.keywordsMatched || [],
            };

            semanticCacheInstance.addPhraseToCache(
              topBullet.originalText,
              data.optimizedText,
              data.keywordsMatched || []
            );
          }
        }
      } catch (err) {
        addLog(`Uwaga: Wywołanie Delta Prompting pominie się. Użyto lokalnych szablonów slotów.`);
      }
    }

    // Final Resume Assembly
    const finalResume: TailoredResume = {
      targetJobTitle: jobTitle,
      companyName,
      summary: eliminateSlogans(vault.personalInfo.summary).purifiedText,
      selectedHighlights: tailoredHighlights,
      skillsMatched: {
        hardSkills: vault.skillsMatrix.hardSkills,
        toolsAndTech: vault.skillsMatrix.toolsAndTech,
        softSkills: vault.skillsMatrix.softSkills,
      },
      atsScore: 0,
      experienceOrder,
    };

    const finalAtsResult = simulateAtsCheck(finalResume, vault, jobDescription);
    finalResume.atsScore = finalAtsResult.overallScore;

    // Generate Anti-Template Cover Letter
    const generatedCoverLetter = generateAntiTemplateCoverLetter(
      jobTitle,
      companyName,
      jobDescription,
      vault
    );

    setTailoredResume(finalResume);
    setAtsResult(finalAtsResult);
    setCoverLetter(generatedCoverLetter);

    addLog(`ZAKOŃCZONO: Wygenerowano dopasowane CV (ATS Score: ${finalAtsResult.overallScore}%) oraz List Motywacyjny.`);
    setIsGenerating(false);
    onUpdateStats();
  };

  return (
    <div className="space-y-6">
      {/* PROMINENT JOB OFFER SCRAPER & URL INPUT CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-cyan-400 shrink-0">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Wklej URL Oferty Pracy
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 font-bold text-[10px] uppercase">
                  Auto-Tailor
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Wklej link do oferty, aby automatycznie dopasować swoje CV.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onOpenAdvisor && (
              <AdvisorButton onClick={() => onOpenAdvisor(`Jak najlepiej przygotować CV pod stanowisko "${jobTitle}"?`)} />
            )}

            <button
              type="button"
              onClick={() => setIsJdParserOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95"
              title="Zaawansowana analiza treści oferty"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Analizuj Tekst</span>
            </button>
          </div>
        </div>

        {/* Live URL Scraper Input Row */}
        <div className="mt-4 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={jdUrlInput}
                onChange={(e) => setJdUrlInput(e.target.value)}
                placeholder="https://www.pracuj.pl/praca/senior-developer..."
                className="w-full bg-slate-950 border border-emerald-900/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono shadow-xs"
              />
              <Link className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
            </div>

            <button
              onClick={handleFetchOfferUrl}
              disabled={isFetchingUrl}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-900/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shrink-0"
            >
              {isFetchingUrl ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Pobieranie...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Pobierz & Dopasuj</span>
                </>
              )}
            </button>
          </div>

          {scraperError && (
            <div className="p-3 bg-amber-950/70 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{scraperError}</span>
            </div>
          )}
        </div>

        {/* Match Audit & Dealbreakers Summary Banner (If Scraped or Analyzed) */}
        {matchAudit && (
          <div className="mt-4 p-4 bg-slate-950/90 border border-indigo-800/80 rounded-xl space-y-3 animate-fade-in text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-slate-100">
                  Wynik Audytu Wymogów Bezpośrednio z Oferty:
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-indigo-900 border border-indigo-700 text-cyan-300 font-mono font-bold">
                Dopasowanie z Vault: {matchAudit.overallMatchPercentage}%
              </span>
            </div>

            {/* Dealbreakers Alert List */}
            {matchAudit.dealbreakerWarnings && matchAudit.dealbreakerWarnings.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px] uppercase">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Wykryte Wymogi Bezwzględnie Konieczne i Ostrzeżenia:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {matchAudit.dealbreakerWarnings.map((warn) => {
                    const isAdded = addedSkills.includes(warn.quickAddValue);
                    return (
                      <div
                        key={warn.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                          warn.missingInVault && !isAdded
                            ? 'bg-red-950/60 border-red-800 text-red-200'
                            : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                        }`}
                      >
                        <span className="text-[11px] font-medium leading-tight">{warn.message}</span>
                        {warn.canQuickAdd && !isAdded && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddSkillToVault(warn.quickAddValue)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[10px] shrink-0 transition-colors"
                          >
                            + Dodaj
                          </button>
                        )}
                        {isAdded && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200 text-[10px] font-bold">
                            <Check className="w-3 h-3 shrink-0" />
                            Dodano
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Job Details Collapsible Accordion / Fields */}
      <details className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-100 shadow-lg group">
        <summary className="cursor-pointer font-bold text-xs text-slate-300 hover:text-white flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Szczegóły Stanowiska i Treść Ogłoszenia, kliknij aby modyfikować</span>
          </div>
          <span className="text-slate-500 text-[11px] group-open:rotate-180 transition-transform">▼</span>
        </summary>

        <div className="mt-4 space-y-4 pt-3 border-t border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AutocompleteInput
                label="Docelowe Stanowisko (Job Title)"
                value={jobTitle}
                onChange={(val) => setJobTitle(val)}
                suggestions={SUGGESTED_JOB_TITLES}
                placeholder="np. Senior Full-Stack Engineer"
                showQuickPills
                maxPills={4}
                darkTheme
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nazwa Firmy / Pracodawcy</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="np. TechCorp Global"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Treść Ogłoszenia o Pracę (Job Description):
              </label>
              <button
                type="button"
                onClick={handleAnalyzeText}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1"
              >
                <Search className="w-3 h-3" />
                <span>Przeanalizuj Tekst Ogłoszenia</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Wklej pełny tekst wymagań i zakresu zadań..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </details>

      {/* Output Views: Either Real-Time Live Dynamic Preview or Manual Generation Results */}
      {isLivePreviewMode ? (
        <RealtimeLivePreview
          vault={vault}
          jobTitle={jobTitle}
          companyName={companyName}
          jobDescription={jobDescription}
          onUpdateVault={onUpdateVault}
        />
      ) : (
        tailoredResume && (
          <div className="space-y-4">
            <div className="flex border-b border-slate-800 space-x-3 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveViewTab('builder')}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs sm:text-sm transition-all active:scale-95 ${
                  activeViewTab === 'builder'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Type className="w-4 h-4 text-blue-400" />
                <span>Edytor CV</span>
              </button>

              <button
                onClick={() => setActiveViewTab('document')}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs sm:text-sm transition-all active:scale-95 ${
                  activeViewTab === 'document'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Podgląd i PDF</span>
              </button>

              <button
                onClick={() => setActiveViewTab('ats')}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs sm:text-sm transition-all active:scale-95 ${
                  activeViewTab === 'ats'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart className="w-4 h-4 text-cyan-400" />
                <span>Symulator ATS: {atsResult?.overallScore || 0}%</span>
              </button>

              <button
                onClick={() => setActiveViewTab('coverLetter')}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-bold text-xs sm:text-sm transition-all active:scale-95 ${
                  activeViewTab === 'coverLetter'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>List Motywacyjny</span>
              </button>
            </div>

            {/* Active View Display */}
            {activeViewTab === 'builder' && (
              <CVWordBuilder
                vault={vault}
                jobDescription={jobDescription}
                jobTitle={jobTitle}
                companyName={companyName}
                onUpdateVault={onUpdateVault || (() => {})}
                onOpenAdvisor={onOpenAdvisor}
              />
            )}

            {activeViewTab === 'document' && (
              <DocumentRenderer resume={tailoredResume} vault={vault} />
            )}

            {activeViewTab === 'ats' && atsResult && (
              <AtsSimulatorView result={atsResult} />
            )}

            {activeViewTab === 'coverLetter' && coverLetter && (
              <CoverLetterView
                coverLetter={coverLetter}
                vault={vault}
                jobTitle={jobTitle}
                companyName={companyName}
                jobDescription={jobDescription}
                onUpdateCoverLetter={setCoverLetter}
                onOpenAdvisor={onOpenAdvisor}
              />
            )}
          </div>
        )
      )}

      {/* JD Parser Modal */}
      <JDParserModal
        isOpen={isJdParserOpen}
        onClose={() => setIsJdParserOpen(false)}
        vault={vault}
        initialJdText={jobDescription}
        onApplyParsedData={(parsed) => {
          if (parsed.jobTitle) setJobTitle(parsed.jobTitle);
          if (parsed.companyName) setCompanyName(parsed.companyName);
          if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
          if (parsed.updatedVault && onUpdateVault) {
            onUpdateVault(parsed.updatedVault);
          }
        }}
      />
    </div>
  );
};

