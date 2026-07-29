import React, { useState } from 'react';
import { MasterVault } from '../types';
import { parseJobDescriptionLocal, analyzeJdMatchWithVault, ParsedJobDescription, JDVaultMatchAnalysis } from '../lib/jdParser';
import { Search, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, X, PlusCircle, Check, Target, Link, Globe, Gift, DollarSign, ShieldAlert, AlertCircle, Building, Briefcase } from 'lucide-react';

interface JDParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: MasterVault;
  initialJdText?: string;
  onApplyParsedData: (data: {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    updatedVault?: MasterVault;
  }) => void;
}

export const JDParserModal: React.FC<JDParserModalProps> = ({
  isOpen,
  onClose,
  vault,
  initialJdText = '',
  onApplyParsedData,
}) => {
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [jdUrl, setJdUrl] = useState('');
  const [jdText, setJdText] = useState(initialJdText);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<JDVaultMatchAnalysis | null>(null);
  const [appliedSkills, setAppliedSkills] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunUrlParser = async () => {
    if (!jdUrl.trim() || !jdUrl.startsWith('http')) {
      alert('Wklej prawidłowy adres URL ogłoszenia (np. https://pracuj.pl/... lub https://nofluffjobs.com/...)');
      return;
    }

    setIsAnalyzing(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/fetch-jd-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jdUrl.trim() }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.parsedJd) {
        if (data.rawJdText) setJdText(data.rawJdText);
        const result = analyzeJdMatchWithVault(data.parsedJd, vault);
        setAnalysis(result);
      } else {
        if (response.status === 403 || data.is403Blocked) {
          setInputMode('text');
          setFetchError(
            '⚠️ Portal (np. Pracuj.pl, LinkedIn) zablokował bezpośrednie pobieranie ze względu na zabezpieczenia (403 Forbidden). Przełączono Cię na zakładkę "Wklej Treść Ogłoszenia" – po prostu skopiuj i wklej tekst oferty poniżej!'
          );
        } else {
          throw new Error(data.error || 'Nie udało się pobrać oferty z podanego adresu URL.');
        }
      }
    } catch (err: any) {
      console.warn('URL Fetch error:', err);
      const is403 = err?.message?.includes('403') || err?.message?.includes('Forbidden');
      if (is403) {
        setInputMode('text');
        setFetchError(
          '⚠️ Portal ogłoszeń zablokował automatyczne pobieranie (403 Forbidden). Przełączono na kartę "Wklej Treść Ogłoszenia" – skopiuj tekst oferty i wklej go poniżej.'
        );
      } else {
        setFetchError(err?.message || 'Błąd pobierania z adresu URL. Spróbuj przełączyć na zakładkę "Wklej Tekst" i wkleić treść oferty.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunTextParser = async () => {
    if (!jdText.trim()) {
      alert('Wklej treść ogłoszenia o pracę.');
      return;
    }

    setIsAnalyzing(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/parse-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawJdText: jdText }),
      });

      const data = await response.json();
      if (data.success && data.parsedJd) {
        const result = analyzeJdMatchWithVault(data.parsedJd, vault);
        setAnalysis(result);
      } else {
        const localParsed = parseJobDescriptionLocal(jdText);
        const result = analyzeJdMatchWithVault(localParsed, vault);
        setAnalysis(result);
      }
    } catch (err) {
      console.warn('Fallback to local JD parser:', err);
      const localParsed = parseJobDescriptionLocal(jdText);
      const result = analyzeJdMatchWithVault(localParsed, vault);
      setAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddMissingSkillToVault = (skill: string) => {
    if (appliedSkills.includes(skill)) return;
    setAppliedSkills([...appliedSkills, skill]);
  };

  const handleApplyAll = () => {
    if (!analysis) return;

    let updatedVault = { ...vault };
    if (appliedSkills.length > 0) {
      updatedVault = {
        ...vault,
        skillsMatrix: {
          ...vault.skillsMatrix,
          hardSkills: Array.from(new Set([...vault.skillsMatrix.hardSkills, ...appliedSkills])),
        },
        updatedAt: new Date().toISOString(),
      };
    }

    onApplyParsedData({
      jobTitle: analysis.parsedJD.jobTitle,
      companyName: analysis.parsedJD.companyName,
      jobDescription: jdText || jdUrl,
      updatedVault: appliedSkills.length > 0 ? updatedVault : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 text-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Inteligentny Ekstraktor Ofert z URL & Treści (JD Scraper)
            </h3>
            <p className="text-xs text-slate-500">
              Pobierz ofertę bezpośrednio z linku lub wklej tekst, aby wyekstrahować słowa kluczowe, benefity oraz wykryć ostrzeżenia/dealbreakery
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 space-x-4 mb-4">
          <button
            onClick={() => setInputMode('url')}
            className={`flex items-center space-x-2 pb-2 text-xs font-bold border-b-2 transition-colors ${
              inputMode === 'url'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Wklej Link z Ogłoszeniem URL</span>
          </button>

          <button
            onClick={() => setInputMode('text')}
            className={`flex items-center space-x-2 pb-2 text-xs font-bold border-b-2 transition-colors ${
              inputMode === 'text'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Wklej Treść Ogłoszenia Tekst</span>
          </button>
        </div>

        {/* Input Views */}
        {inputMode === 'url' ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Podaj link do ogłoszenia (np. Pracuj.pl, NoFluffJobs, JustJoin.it, LinkedIn):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={jdUrl}
                onChange={(e) => setJdUrl(e.target.value)}
                placeholder="https://www.pracuj.pl/praca/senior-react-developer..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
              <button
                onClick={handleRunUrlParser}
                disabled={isAnalyzing}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center space-x-2 shrink-0 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Pobieranie strony...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Pobierz i Przeanalizuj Ofertę</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 System automatycznie połączy się z portalem, oczyści kod HTML i wyekstrahuje kluczowe dane, widełki płacowe oraz benefity.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Wklej surową treść ogłoszenia o pracę (Job Description):
            </label>
            <textarea
              rows={5}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="np. Poszukujemy Senior React Engineer. Wymagania: TypeScript, Docker, Prawo jazdy kat. B, Angielski C1. Oferujemy: LuxMed, MultiSport, B2B 18 000 - 24 000 PLN..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
            <button
              onClick={handleRunTextParser}
              disabled={isAnalyzing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analizowanie wymóg oferty...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Przeanalizuj i Wyekstrahuj Słowa Kluczowe</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Alert */}
        {fetchError && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Analysis Results View */}
        {analysis && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-6">
            {/* Header Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-700">Dopasowanie z Vault</span>
                <div className="text-2xl font-extrabold text-indigo-600 font-mono mt-0.5">
                  {analysis.overallMatchPercentage}%
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Tytuł & Poziom</span>
                <div className="text-xs font-bold text-slate-800 truncate mt-1">
                  {analysis.parsedJD.jobTitle} ({analysis.parsedJD.seniorityLevel})
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Widełki / Wynagrodzenie</span>
                <div className="text-xs font-bold text-emerald-700 truncate mt-1">
                  {analysis.parsedJD.salaryRange || 'Brak danych w ofercie'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Tryb Pracy</span>
                <div className="text-xs font-bold text-slate-700 truncate mt-1">
                  {analysis.parsedJD.workModel || 'Hybrydowa / Zdalna'}
                </div>
              </div>
            </div>

            {/* Dealbreaker & Mandatory Requirements Warnings */}
            {analysis.dealbreakerWarnings && analysis.dealbreakerWarnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Audyt Wymagań Bezwzględnie Koniecznych:</span>
                </h4>
                <div className="space-y-2">
                  {analysis.dealbreakerWarnings.map((warn) => {
                    const isAdded = appliedSkills.includes(warn.quickAddValue);
                    return (
                      <div
                        key={warn.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                          warn.missingInVault && !isAdded
                            ? 'bg-red-50 border-red-200 text-red-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {warn.missingInVault && !isAdded ? (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="font-semibold">{warn.message}</span>
                        </div>

                        {warn.canQuickAdd && !isAdded && (
                          <button
                            type="button"
                            onClick={() => handleAddMissingSkillToVault(warn.quickAddValue)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition-colors shadow-2xs flex items-center space-x-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ Dodaj '{warn.quickAddValue}' do Vault</span>
                          </button>
                        )}

                        {isAdded && (
                          <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Dodano do Master Vault</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extracted Benefits & Perks Section */}
            {analysis.benefitsList && analysis.benefitsList.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <span>Benefity i Plusy Oferty Pracy:</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.benefitsList.map((benefit, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium rounded-lg text-xs flex items-center space-x-1.5"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{benefit}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Skill Chips Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Wyryte Umiejętności Twarde & Narzędzia:</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.parsedJD.requiredHardSkills.concat(analysis.parsedJD.toolsAndTech).map((skill, idx) => {
                  const isAlreadyInVault = analysis.matchedSkills.includes(skill);
                  const isAdded = appliedSkills.includes(skill);

                  return (
                    <button
                      key={idx}
                      onClick={() => !isAlreadyInVault && handleAddMissingSkillToVault(skill)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                        isAlreadyInVault
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 cursor-default'
                          : isAdded
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {isAlreadyInVault ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isAdded ? (
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{skill}</span>
                      {!isAlreadyInVault && !isAdded && (
                        <span className="text-[9px] uppercase font-mono text-amber-700 font-normal ml-1">
                          (+Dodaj do Vault)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Recommendations */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Rekomendowane Akcje Dopasowujące:</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Apply & Sync Button */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Anuluj
              </button>

              <button
                onClick={handleApplyAll}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-2"
              >
                <span>Użyj Sparsowanych Danych i Przejdź do Generatora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

