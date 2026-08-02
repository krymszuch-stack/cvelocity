import React, { useState, useMemo } from 'react';
import { MasterVault } from '../types';
import {
  Sparkles,
  Check,
  X,
  CheckCheck,
  RefreshCw,
  FileText,
  Edit3,
  Download,
  Eye,
  Sliders,
  Type,
  ArrowRight,
  Info,
  CheckCircle2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Wand2,
  Ruler,
} from 'lucide-react';
import { eliminateSlogans } from '../lib/slotFillingEngine';
import { AdvisorButton } from './ui/AdvisorButton';

interface WordSubstitution {
  id: string;
  section: 'summary' | 'title' | 'experience' | 'skills';
  experienceId?: string;
  originalPhrase: string;
  suggestedPhrase: string;
  reason: string;
  accepted: boolean | null; // null = pending, true = accepted, false = rejected
}

interface CVWordBuilderProps {
  vault: MasterVault;
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  onUpdateVault: (updated: MasterVault) => void;
  onOpenAdvisor?: (question?: string) => void;
}

// Synonyms & Industry Term Upgrades for Word-style Substitution Engine
const VOCAB_REPLACEMENTS: Array<{
  pattern: RegExp;
  replacement: string;
  reason: string;
}> = [
  {
    pattern: /kodowanie|pisanie kodu/gi,
    replacement: 'projektowanie i implementacja skalowalnego kodu źródłowego',
    reason: 'Podnosi jakość opisu tworzenia oprogramowania do poziomu inżynieryjnego',
  },
  {
    pattern: /tworzenie stron|robienie aplikacji/gi,
    replacement: 'rozwój nowoczesnych aplikacji internetowych i architektury systemowej',
    reason: 'Używa profesjonalnej terminologii inżynierii oprogramowania',
  },
  {
    pattern: /poprawianie błędów|szukanie błędów/gi,
    replacement: 'refaktoryzacja, debugowanie i optymalizacja wydajnościowa kodu',
    reason: 'Wskazuje na zaawansowany proces dbałości o jakość oprogramowania',
  },
  {
    pattern: /praca w zespole|praca zespołowa/gi,
    replacement: 'ścisła współpraca w zespole interdyscyplinarnym w zwinnej metodyce (Agile/Scrum)',
    reason: 'Podkreśla znajomość wiodących metodyk zarządzania projektami',
  },
  {
    pattern: /pracownik biurowy/gi,
    replacement: 'Koordynator Obsługi Zgłoszeń i Działań Serwisowych',
    reason: 'Podnosi rangę stanowiska do poziomu koordynatora działań operacyjnych',
  },
  {
    pattern: /obsługa zgłoszeń/gi,
    replacement: 'zarządzanie procesem zgłoszeń i obsługa zgłoszeń klientów w reżimie SLA',
    reason: 'Dodaje wskaźnik jakościowy SLA zgodny z wymogami korporacyjnymi',
  },
  {
    pattern: /kontakt telefoniczny/gi,
    replacement: 'bezpośrednia komunikacja telefoniczna oraz deeskalacja trudnych sytuacji',
    reason: 'Wskazuje na zaawansowane umiejętności komunikacyjne i deeskalacyjne',
  },
  {
    pattern: /pisanie maili|kontakt mailowy/gi,
    replacement: 'prowadzenie profesjonalnej korespondencji biznesowej i operacyjnej',
    reason: 'Profesjonalizuje język opisu codziennej komunikacji',
  },
  {
    pattern: /tłumaczenie|tłumaczeniami/gi,
    replacement: 'lokalizacja językowa oraz adaptacja kulturowa komunikatów',
    reason: 'Opisuje tłumaczenia w terminologii nowoczesnego marketingu i komunikacji',
  },
  {
    pattern: /pomoc w biurze|wsparcie w biurze/gi,
    replacement: 'kompleksowe wsparcie operacyjne i administracyjne procesów firmowych',
    reason: 'Zastępuje ogólne słowa językiem popartym terminologią biznesową',
  },
  {
    pattern: /robienie napraw|naprawianie/gi,
    replacement: 'diagnostyka techniczna, serwis i konserwacja urządzeń IT',
    reason: 'Podkreśla analityczny i techniczny charakter wykonywanych czynności',
  },
  {
    pattern: /praktyki zawodowe|praktyki/gi,
    replacement: 'Praktyka Zawodowa / Staż Specjalistyczny',
    reason: 'Ujednolica i wzmacnia brzmienie okresu praktyk w CV',
  },
  {
    pattern: /pomagałem zespołowi|wspierałem zespół/gi,
    replacement: 'efektywnie współdziałałem z zespołem operacyjnym w celu realizacji celów',
    reason: 'Brzmi bardziej proaktywnie i nastawienie na cele zespołu',
  },
];

export const CVWordBuilder: React.FC<CVWordBuilderProps> = ({
  vault,
  jobDescription,
  jobTitle,
  companyName,
  onUpdateVault,
  onOpenAdvisor,
}) => {
  const [substitutions, setSubstitutions] = useState<WordSubstitution[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [promotionPrompt, setPromotionPrompt] = useState<{
    isOpen: boolean;
    editedText: string;
    field: string;
    onConfirmPermanent: () => void;
  } | null>(null);
  // Holds a "this offer only" edit that hasn't (or won't) be promoted to the MasterVault,
  // so the contentEditable field doesn't snap back to the old vault text when the promotion modal opens.
  const [localSummaryOverride, setLocalSummaryOverride] = useState<string | null>(null);
  const displaySummary = localSummaryOverride ?? (vault.personalInfo.summary || '');

  // Manual Inline Edit Handlers for full Word-like freedom
  const handleUpdatePersonalInfoField = (field: 'fullName' | 'title' | 'email' | 'phone' | 'location', text: string) => {
    onUpdateVault({
      ...vault,
      personalInfo: {
        ...vault.personalInfo,
        [field]: text.trim(),
      },
    });
  };

  const handleUpdateSummaryText = (text: string) => {
    const currentSummary = vault.personalInfo.summary || '';
    if (text === currentSummary) {
      setLocalSummaryOverride(null);
      return;
    }
    // Apply immediately so the visible text survives the modal's re-render,
    // regardless of which option the user ends up choosing.
    setLocalSummaryOverride(text);
    setPromotionPrompt({
      isOpen: true,
      editedText: text,
      field: 'Podsumowanie Zawodowe',
      onConfirmPermanent: () => {
        onUpdateVault({
          ...vault,
          personalInfo: {
            ...vault.personalInfo,
            summary: text,
          },
        });
        setLocalSummaryOverride(null);
      },
    });
  };

  const handleUpdateExperienceHighlightText = (expId: string, hIndex: number, newText: string) => {
    const updatedHistory = vault.history.map((exp) => {
      if (exp.id === expId) {
        const updatedHighlights = exp.highlights.map((h, idx) => {
          if (idx === hIndex) {
            return typeof h === 'string'
              ? { id: 'm_' + Date.now() + '_' + idx, text: newText, action: 'Wykonanie', target: 'Zadania', tool: '', metric: '', keywords: [] }
              : { ...h, text: newText };
          }
          return h;
        });
        return { ...exp, highlights: updatedHighlights };
      }
      return exp;
    });
    onUpdateVault({ ...vault, history: updatedHistory });
  };

  // Generate substitutions based on Vault text & JD
  const generateSubstitutions = () => {
    const list: WordSubstitution[] = [];
    const lowerJd = jobDescription.toLowerCase();

    // 1. Title substitution if jobTitle differs
    if (jobTitle && vault.personalInfo.title !== jobTitle) {
      list.push({
        id: 'sub_title',
        section: 'title',
        originalPhrase: vault.personalInfo.title || 'Specjalista',
        suggestedPhrase: jobTitle,
        reason: `Dopasowanie nagłówka stanowiska bezpośrednio do oferty: "${jobTitle}"`,
        accepted: null,
      });
    }

    // 2. Summary word substitutions
    const currentSummary = vault.personalInfo.summary || '';
    VOCAB_REPLACEMENTS.forEach((item, idx) => {
      item.pattern.lastIndex = 0;
      if (item.pattern.test(currentSummary)) {
        item.pattern.lastIndex = 0;
        const matches = currentSummary.match(item.pattern);
        if (matches && matches[0]) {
          list.push({
            id: `sub_summary_${idx}`,
            section: 'summary',
            originalPhrase: matches[0],
            suggestedPhrase: item.replacement,
            reason: item.reason,
            accepted: null,
          });
        }
      }
    });

    // 3. Experience highlights substitutions
    vault.history.forEach((exp) => {
      exp.highlights.forEach((h, hIdx) => {
        const text = typeof h === 'string' ? h : h.text;
        VOCAB_REPLACEMENTS.forEach((item, rIdx) => {
          item.pattern.lastIndex = 0;
          if (item.pattern.test(text)) {
            item.pattern.lastIndex = 0;
            const matches = text.match(item.pattern);
            if (matches && matches[0]) {
              list.push({
                id: `sub_exp_${exp.id}_${hIdx}_${rIdx}`,
                section: 'experience',
                experienceId: exp.id,
                originalPhrase: matches[0],
                suggestedPhrase: item.replacement,
                reason: `${exp.company} (${exp.role}): ${item.reason}`,
                accepted: null,
              });
            }
          }
        });
      });
    });

    // 4. Dynamic JD keyword injection suggestions
    const rawTokens: string[] = jobDescription.match(/\b[a-zA-Z0-9#+.-]{3,}\b/g) || [];
    const stopWords = new Set(['oraz', 'pracy', 'dla', 'firme', 'firmy', 'jest', 'naszym', 'szukamy', 'osoby', 'opisie', 'stanowiska', 'wymagania', 'oferujemy', 'praca', 'współpraca', 'będziesz', 'zespół', 'prosimy']);
    const candidateKeywords = Array.from(new Set(rawTokens.filter((t: string) => !stopWords.has(t.toLowerCase()) && t.length > 2)));

    const existingSkills = new Set([
      ...vault.skillsMatrix.hardSkills.map(s => s.toLowerCase()),
      ...(vault.skillsMatrix.toolsAndTech || []).map(t => t.toLowerCase()),
    ]);

    const missingInVault = candidateKeywords.filter((kw: string) => !existingSkills.has(kw.toLowerCase()));

    if (missingInVault.length > 0) {
      missingInVault.slice(0, 4).forEach((kw: string, idx: number) => {
        list.push({
          id: `sub_skill_${idx}`,
          section: 'skills',
          originalPhrase: '[Słowo Kluczowe z Oferty Pracy]',
          suggestedPhrase: kw,
          reason: `Wykryto słowo kluczowe w ogłoszeniu: "${kw}" - zalecane wstrzyknięcie do sekcji Umiejętności`,
          accepted: null,
        });
      });
    }

    setSubstitutions(list);
    setIsGenerated(true);
  };

  // Initial generation on component load or JD change
  React.useEffect(() => {
    generateSubstitutions();
  }, [jobDescription, jobTitle]);

  // Handle Accept Single Substitution
  const handleAcceptSingle = (id: string) => {
    const target = substitutions.find((s) => s.id === id);
    if (!target) return;

    // Apply to vault
    let updatedVault = { ...vault };

    if (target.section === 'title') {
      updatedVault.personalInfo = {
        ...updatedVault.personalInfo,
        title: target.suggestedPhrase,
      };
    } else if (target.section === 'summary') {
      const summary = updatedVault.personalInfo.summary || '';
      const updatedSummary = summary.replace(
        new RegExp(target.originalPhrase, 'gi'),
        target.suggestedPhrase
      );
      updatedVault.personalInfo = {
        ...updatedVault.personalInfo,
        summary: updatedSummary,
      };
    } else if (target.section === 'experience' && target.experienceId) {
      updatedVault.history = updatedVault.history.map((exp) => {
        if (exp.id === target.experienceId) {
          const updatedHighlights = exp.highlights.map((h, idx) => {
            const hText = typeof h === 'string' ? h : h.text;
            const replaced = hText.replace(
              new RegExp(target.originalPhrase, 'gi'),
              target.suggestedPhrase
            );
            return typeof h === 'string'
              ? { id: 'm_' + Date.now() + '_' + idx, text: replaced, action: 'Wykonanie', target: 'Zadania', tool: '', metric: '', keywords: [] }
              : { ...h, text: replaced };
          });
          return { ...exp, highlights: updatedHighlights };
        }
        return exp;
      });
    } else if (target.section === 'skills') {
      if (!updatedVault.skillsMatrix.hardSkills.includes(target.suggestedPhrase)) {
        updatedVault.skillsMatrix = {
          ...updatedVault.skillsMatrix,
          hardSkills: [...updatedVault.skillsMatrix.hardSkills, target.suggestedPhrase],
        };
      }
    }

    onUpdateVault(updatedVault);

    // Update local state
    setSubstitutions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accepted: true } : s))
    );
  };

  // Handle Reject Single
  const handleRejectSingle = (id: string) => {
    setSubstitutions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accepted: false } : s))
    );
  };

  // Handle Accept All
  const handleAcceptAll = () => {
    let updatedVault = { ...vault };

    substitutions.forEach((target) => {
      if (target.accepted === false) return; // skip manually rejected

      if (target.section === 'title') {
        updatedVault.personalInfo.title = target.suggestedPhrase;
      } else if (target.section === 'summary') {
        const summary = updatedVault.personalInfo.summary || '';
        updatedVault.personalInfo.summary = summary.replace(
          new RegExp(target.originalPhrase, 'gi'),
          target.suggestedPhrase
        );
      } else if (target.section === 'experience' && target.experienceId) {
        updatedVault.history = updatedVault.history.map((exp) => {
          if (exp.id === target.experienceId) {
            const updatedHighlights = exp.highlights.map((h, idx) => {
              const hText = typeof h === 'string' ? h : h.text;
              const replaced = hText.replace(
                new RegExp(target.originalPhrase, 'gi'),
                target.suggestedPhrase
              );
              return typeof h === 'string'
                ? { id: 'm_' + Date.now() + '_' + idx, text: replaced, action: 'Wykonanie', target: 'Zadania', tool: '', metric: '', keywords: [] }
                : { ...h, text: replaced };
            });
            return { ...exp, highlights: updatedHighlights };
          }
          return exp;
        });
      } else if (target.section === 'skills') {
        if (!updatedVault.skillsMatrix.hardSkills.includes(target.suggestedPhrase)) {
          updatedVault.skillsMatrix.hardSkills.push(target.suggestedPhrase);
        }
      }
    });

    onUpdateVault(updatedVault);

    setSubstitutions((prev) =>
      prev.map((s) => ({ ...s, accepted: true }))
    );
  };

  // Render text with Word-style inline tracked changes
  const renderTrackedText = (text: string, section: 'summary' | 'experience', expId?: string) => {
    if (!text) return null;

    let resultElements: React.ReactNode[] = [text];

    const activeSubs = substitutions.filter(
      (s) => s.section === section && (!expId || s.experienceId === expId)
    );

    activeSubs.forEach((sub) => {
      const regex = new RegExp(`(${sub.originalPhrase})`, 'gi');

      const nextElements: React.ReactNode[] = [];

      resultElements.forEach((node, nodeIdx) => {
        if (typeof node !== 'string') {
          nextElements.push(node);
          return;
        }

        const parts = node.split(regex);
        parts.forEach((part, pIdx) => {
          if (part.toLowerCase() === sub.originalPhrase.toLowerCase()) {
            // Render Track Changes Diff
            if (sub.accepted === true) {
              nextElements.push(
                <span key={`${sub.id}_${nodeIdx}_${pIdx}`} className="bg-emerald-100 text-emerald-900 border-b-2 border-emerald-600 font-bold px-1 rounded mx-0.5">
                  {sub.suggestedPhrase}
                </span>
              );
            } else if (sub.accepted === false) {
              nextElements.push(
                <span key={`${sub.id}_${nodeIdx}_${pIdx}`} className="text-slate-800">
                  {part}
                </span>
              );
            } else {
              // Pending suggestion popover / inline badge
              nextElements.push(
                <span
                  key={`${sub.id}_${nodeIdx}_${pIdx}`}
                  className="inline-flex flex-wrap items-center gap-1 bg-amber-50 border border-amber-300 rounded p-1 mx-0.5 my-0.5 shadow-2xs"
                >
                  <span className="line-through text-red-600 font-medium px-1 bg-red-50 rounded">
                    {part}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.5 rounded text-xs border border-emerald-300">
                    {sub.suggestedPhrase}
                  </span>
                  <button
                    onClick={() => handleAcceptSingle(sub.id)}
                    className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] flex items-center space-x-0.5 shadow-2xs transition-all"
                    title="Zaakceptuj podmianę wyrazu"
                  >
                    <Check className="w-3 h-3" />
                    <span>Tak</span>
                  </button>
                  <button
                    onClick={() => handleRejectSingle(sub.id)}
                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-[10px] transition-all"
                    title="Odrzuć propozycję"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            }
          } else if (part) {
            nextElements.push(part);
          }
        });
      });

      resultElements = nextElements;
    });

    return <>{resultElements}</>;
  };

  const pendingCount = substitutions.filter((s) => s.accepted === null).length;
  const acceptedCount = substitutions.filter((s) => s.accepted === true).length;

  const handleExecFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  return (
    <div className="space-y-6">
      {/* Control Banner - Word Style Track Changes Mode */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 shrink-0">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  CV Builder (Śledzenie Zmian)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
                  Track Changes
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Edycja i dopasowanie sformułowań w Twoim CV.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onOpenAdvisor && (
              <AdvisorButton onClick={() => onOpenAdvisor('Jak edytować i szlifować sformułowania w tym dokumencie CV w trybie Word?')} />
            )}

            <button
              onClick={handleAcceptAll}
              disabled={pendingCount === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Zaakceptuj Wszystkie: {pendingCount}</span>
            </button>

            <button
              onClick={generateSubstitutions}
              className="p-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl transition-all border border-slate-300"
              title="Odśwież propozycje"
              aria-label="Odśwież propozycje podmieniające frazy"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-slate-700">
              Oczekujące podmiany: <strong className="text-amber-600">{pendingCount}</strong>
            </span>
            <span className="font-semibold text-slate-700">
              Zaakceptowane: <strong className="text-emerald-600">{acceptedCount}</strong>
            </span>
            <span className="font-semibold text-slate-700">
              Łącznie znaleziono: <strong>{substitutions.length}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-slate-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            <Edit3 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span><strong>Ręczna edycja Word:</strong> Kliknij dowolny tekst na arkuszu A4 poniżej, aby bezpośrednio pisać i zmieniać treść!</span>
          </div>
        </div>
      </div>

      {/* Main Document Canvas with Tracked Changes & Live Word Editing */}
      <div className="bg-slate-200/80 p-4 sm:p-8 rounded-2xl border border-slate-300 flex flex-col items-center overflow-x-auto space-y-4">
        {/* Sticky MS Word / Paint Style Ribbon Toolbar */}
        <div className="sticky top-4 z-30 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-slate-700 shadow-2xl flex flex-wrap items-center justify-between gap-3 max-w-[210mm] w-full">
          <div className="flex items-center space-x-1 border-r border-slate-700 pr-3">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 mr-1 flex items-center gap-1">
              <Type className="w-3.5 h-3.5" /> Word Toolbar:
            </span>
            <button
              type="button"
              onClick={() => handleExecFormat('bold')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Pogrubienie (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleExecFormat('italic')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Kursywa (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleExecFormat('underline')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Podkreślenie (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 border-r border-slate-700 pr-3">
            <button
              type="button"
              onClick={() => handleExecFormat('justifyLeft')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Wyrównaj do lewej"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleExecFormat('justifyCenter')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Wyśrodkuj"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleExecFormat('justifyRight')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Wyrównaj do prawej"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 border-r border-slate-700 pr-3">
            <button
              type="button"
              onClick={() => handleExecFormat('undo')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Cofnij (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleExecFormat('redo')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Ponów (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-md flex items-center space-x-1">
              <Ruler className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Format A4 (210 × 297 mm)</span>
            </span>
          </div>
        </div>

        <div className="w-[210mm] min-h-[297mm] p-10 bg-white shadow-2xl rounded-sm font-sans text-xs text-slate-900 space-y-6">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <h1
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleUpdatePersonalInfoField('fullName', e.currentTarget.innerText)}
              className="text-2xl font-extrabold uppercase tracking-tight text-slate-900 hover:bg-slate-100/80 focus:bg-amber-50 focus:outline-2 focus:outline-amber-400 rounded px-1 transition-colors cursor-text"
              title="Kliknij, aby zmienić Imię i Nazwisko"
            >
              {vault.personalInfo.fullName}
            </h1>
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleUpdatePersonalInfoField('title', e.currentTarget.innerText)}
              className="text-sm font-bold text-indigo-700 mt-1 hover:bg-indigo-50/80 focus:bg-amber-50 focus:outline-2 focus:outline-amber-400 rounded px-1 transition-colors cursor-text"
              title="Kliknij, aby edytować nagłówek stanowiska"
            >
              {substitutions.some((s) => s.section === 'title' && s.accepted === true)
                ? jobTitle
                : vault.personalInfo.title}
            </p>

            {/* Title track changes badge if pending */}
            {substitutions
              .filter((s) => s.section === 'title' && s.accepted === null)
              .map((sub) => (
                <div key={sub.id} className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between gap-2">
                  <div className="text-[11px]">
                    <span className="line-through text-red-600 font-semibold">{sub.originalPhrase}</span>
                    <ArrowRight className="inline w-3 h-3 text-slate-400 mx-1" />
                    <span className="bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                      {sub.suggestedPhrase}
                    </span>
                    <span className="text-slate-500 ml-2">- {sub.reason}</span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleAcceptSingle(sub.id)}
                      className="px-2 py-1 bg-emerald-600 text-white font-bold rounded text-[10px]"
                    >
                      Zaakceptuj
                    </button>
                    <button
                      onClick={() => handleRejectSingle(sub.id)}
                      className="px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded text-[10px]"
                    >
                      Odrzuć
                    </button>
                  </div>
                </div>
              ))}

            <div className="text-slate-600 text-xs mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                Email:{' '}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdatePersonalInfoField('email', e.currentTarget.innerText)}
                  className="hover:bg-slate-100 focus:bg-amber-50 focus:outline-1 focus:outline-amber-400 rounded px-1"
                >
                  {vault.personalInfo.email}
                </span>
              </span>
              <span>
                Tel:{' '}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdatePersonalInfoField('phone', e.currentTarget.innerText)}
                  className="hover:bg-slate-100 focus:bg-amber-50 focus:outline-1 focus:outline-amber-400 rounded px-1"
                >
                  {vault.personalInfo.phone}
                </span>
              </span>
              <span>
                Lokalizacja:{' '}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdatePersonalInfoField('location', e.currentTarget.innerText)}
                  className="hover:bg-slate-100 focus:bg-amber-50 focus:outline-1 focus:outline-amber-400 rounded px-1"
                >
                  {vault.personalInfo.location}
                </span>
              </span>
            </div>
          </div>

          {/* Podsumowanie Zawodowe */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 border-indigo-600 text-indigo-800">
              Podsumowanie Zawodowe
            </h2>
            {/* Tracked Changes Suggestions for Summary */}
            {substitutions
              .filter((s) => s.section === 'summary' && s.accepted === null)
              .map((sub) => (
                <div key={sub.id} className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px]">
                    <span className="line-through text-red-600 font-semibold">{sub.originalPhrase}</span>
                    <ArrowRight className="inline w-3 h-3 text-slate-400 mx-1" />
                    <span className="bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                      {sub.suggestedPhrase}
                    </span>
                    <span className="text-slate-500 ml-2">- {sub.reason}</span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleAcceptSingle(sub.id)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px]"
                    >
                      Zaakceptuj
                    </button>
                    <button
                      onClick={() => handleRejectSingle(sub.id)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-[10px]"
                    >
                      Odrzuć
                    </button>
                  </div>
                </div>
              ))}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateSummaryText(e.currentTarget.innerText)}
              className="text-slate-800 leading-relaxed text-justify hover:bg-slate-50 focus:bg-amber-50 focus:outline-2 focus:outline-amber-400 rounded p-1 transition-colors cursor-text"
              title="Kliknij, aby swobodnie edytować treść podsumowania zawodowego"
            >
              {displaySummary}
            </div>
          </div>

          {/* Doświadczenie Zawodowe */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 border-indigo-600 text-indigo-800">
              Doświadczenie Zawodowe
            </h2>
            <div className="space-y-4">
              {vault.history.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span>
                      {exp.role} | {exp.company}
                    </span>
                    <span className="text-slate-600 font-normal font-mono text-[11px]">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] italic">{exp.location}</div>

                  {/* Tracked Changes Suggestions for Experience */}
                  {substitutions
                    .filter((s) => s.section === 'experience' && s.experienceId === exp.id && s.accepted === null)
                    .map((sub) => (
                      <div key={sub.id} className="p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between gap-2 text-xs my-1">
                        <div className="text-[11px]">
                          <span className="line-through text-red-600 font-semibold">{sub.originalPhrase}</span>
                          <ArrowRight className="inline w-3 h-3 text-slate-400 mx-1" />
                          <span className="bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                            {sub.suggestedPhrase}
                          </span>
                          <span className="text-slate-500 ml-2">- {sub.reason}</span>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleAcceptSingle(sub.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px]"
                          >
                            Zaakceptuj
                          </button>
                          <button
                            onClick={() => handleRejectSingle(sub.id)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-[10px]"
                          >
                            Odrzuć
                          </button>
                        </div>
                      </div>
                    ))}

                  <ul className="list-disc list-inside text-slate-800 space-y-1 pl-1">
                    {exp.highlights.map((h, i) => {
                      const text = typeof h === 'string' ? h : h.text;
                      return (
                        <li key={i} className="text-xs leading-relaxed">
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdateExperienceHighlightText(exp.id, i, e.currentTarget.innerText)}
                            className="hover:bg-slate-50 focus:bg-amber-50 focus:outline-1 focus:outline-amber-400 rounded px-1 cursor-text"
                            title="Kliknij, aby zedytować ten punkt doświadczenia"
                          >
                            {text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Umiejętności & Narzędzia */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 border-indigo-600 text-indigo-800">
              Umiejętności & Narzędzia
            </h2>

            {/* Pending skill suggestions */}
            {substitutions
              .filter((s) => s.section === 'skills' && s.accepted === null)
              .map((sub) => (
                <div key={sub.id} className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between gap-2">
                  <div className="text-[11px]">
                    <span className="text-slate-700 font-medium">Propozycja dodania słowa kluczowego z oferty: </span>
                    <span className="bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                      + {sub.suggestedPhrase}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleAcceptSingle(sub.id)}
                      className="px-2 py-1 bg-emerald-600 text-white font-bold rounded text-[10px]"
                    >
                      + Dodaj
                    </button>
                    <button
                      onClick={() => handleRejectSingle(sub.id)}
                      className="px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded text-[10px]"
                    >
                      Odrzuć
                    </button>
                  </div>
                </div>
              ))}

            <div className="space-y-1 text-slate-800">
              <div>
                <span className="font-bold">Umiejętności Twarde: </span>
                <span>{vault.skillsMatrix.hardSkills.join(', ')}</span>
              </div>
              <div>
                <span className="font-bold">Narzędzia i Technologie: </span>
                <span>{vault.skillsMatrix.toolsAndTech.join(', ')}</span>
              </div>
              <div>
                <span className="font-bold">Kompetencje Miękkie: </span>
                <span>{vault.skillsMatrix.softSkills.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Wykształcenie */}
          {vault.education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 border-indigo-600 text-indigo-800">
                Wykształcenie
              </h2>
              <div className="space-y-2">
                {vault.education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {edu.degree} - {edu.fieldOfStudy}
                      </div>
                      <div className="text-slate-600">{edu.institution}</div>
                    </div>
                    <div className="font-mono text-slate-500 text-[11px]">
                      {edu.startDate} - {edu.endDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Promotion to MasterVault Modal (Dyrektywa 4) */}
      {promotionPrompt && promotionPrompt.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center space-x-3 text-amber-600">
              <Sparkles className="w-6 h-6 shrink-0 text-amber-500" />
              <h3 className="text-base font-bold">Awansowanie Poprawki do MasterVault</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Zmieniłeś treść pola <strong>{promotionPrompt.field}</strong>. Czy jest to poprawka wyłącznie pod tę ofertę pracy ({companyName || 'Pracodawca'}), czy chcesz zaktualizować ten fakt <strong>na stałe w Twoim głównym MasterVault</strong>?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono text-amber-900 max-h-32 overflow-y-auto">
              "{promotionPrompt.editedText}"
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPromotionPrompt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Tylko dla tej oferty
              </button>
              <button
                type="button"
                onClick={() => {
                  promotionPrompt.onConfirmPermanent();
                  setPromotionPrompt(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
              >
                Zaktualizuj w MasterVault na stałe ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
