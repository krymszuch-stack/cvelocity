import React, { useState } from 'react';
import { apiFetch } from '../lib/apiClient';
import { MasterVault } from '../types';
import { parseJobDescriptionLocal, analyzeJdMatchWithVault, JDVaultMatchAnalysis } from '../lib/jdParser';
import { Search, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, PlusCircle, Check, Target, Link, Globe, Gift, ShieldAlert, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Alert } from './ui/Feedback';
import { Tabs } from './ui/Tabs';
import { Input, Textarea } from './ui/Field';

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

  React.useEffect(() => {
    if (isOpen) {
      setJdText(initialJdText);
    }
  }, [isOpen, initialJdText]);

  const handleRunUrlParser = async () => {
    if (!jdUrl.trim() || !jdUrl.startsWith('http')) {
      alert('Wklej prawidłowy adres URL ogłoszenia (np. https://pracuj.pl/... lub https://nofluffjobs.com/...)');
      return;
    }

    setIsAnalyzing(true);
    setFetchError(null);

    try {
      const response = await apiFetch('/api/fetch-jd-url', {
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
            'Portal (np. Pracuj.pl, LinkedIn) zablokował bezpośrednie pobieranie ze względu na zabezpieczenia (403 Forbidden). Przełączono Cię na zakładkę "Wklej Treść Ogłoszenia" – po prostu skopiuj i wklej tekst oferty poniżej!'
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
          'Portal ogłoszeń zablokował automatyczne pobieranie (403 Forbidden). Przełączono na kartę "Wklej Treść Ogłoszenia" – skopiuj tekst oferty i wklej go poniżej.'
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
      const response = await apiFetch('/api/parse-jd', {
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
      jobDescription: jdText.trim() || '',
      updatedVault: appliedSkills.length > 0 ? updatedVault : undefined,
    });

    onClose();
  };

  const tabItems = [
    { id: 'url' as const, label: 'Wklej Link z Ogłoszeniem URL', icon: Link },
    { id: 'text' as const, label: 'Wklej Treść Ogłoszenia Tekst', icon: Search },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inteligentny Ekstraktor Ofert z URL & Treści (JD Scraper)"
      subtitle="Pobierz ofertę bezpośrednio z linku lub wklej tekst, aby wyekstrahować słowa kluczowe, benefity oraz wykryć ostrzeżenia/dealbreakery"
      icon={Globe}
      size="xl"
    >
      {/* Mode Selector Tabs */}
      <Tabs
        items={tabItems}
        active={inputMode}
        onChange={setInputMode}
        variant="underline"
        className="mb-4"
      />

      {/* Input Views */}
      {inputMode === 'url' ? (
        <div className="space-y-3">
          <Input
            type="url"
            label="Podaj link do ogłoszenia (np. Pracuj.pl, NoFluffJobs, JustJoin.it, LinkedIn):"
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
            placeholder="https://www.pracuj.pl/praca/senior-react-developer..."
            suffix={
              <Button
                variant="primary"
                size="sm"
                loading={isAnalyzing}
                onClick={handleRunUrlParser}
              >
                {!isAnalyzing && <Sparkles className="w-4 h-4 shrink-0" />}
                <span>Pobierz i Przeanalizuj Ofertę</span>
              </Button>
            }
          />
          <p className="text-[11px] text-muted flex items-start gap-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-fg" />
            System automatycznie połączy się z portalem, oczyści kod HTML i wyekstrahuje kluczowe dane, widełki płacowe oraz benefity.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            rows={5}
            label="Wklej surową treść ogłoszenia o pracę (Job Description):"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="np. Poszukujemy Senior React Engineer. Wymagania: TypeScript, Docker, Prawo jazdy kat. B, Angielski C1. Oferujemy: LuxMed, MultiSport, B2B 18 000 - 24 000 PLN..."
            className="font-mono"
          />
          <Button
            variant="primary"
            size="md"
            fullWidth
            loading={isAnalyzing}
            onClick={handleRunTextParser}
          >
            {!isAnalyzing && <Sparkles className="w-4 h-4 text-warning-fg" />}
            <span>{isAnalyzing ? 'Analizowanie wymóg oferty...' : 'Przeanalizuj i Wyekstrahuj Słowa Kluczowe'}</span>
          </Button>
        </div>
      )}

      {/* Error Alert */}
      {fetchError && (
        <Alert variant="warning" className="mt-4">
          <span>{fetchError}</span>
        </Alert>
      )}

      {/* Analysis Results View */}
      {analysis && (
        <div className="mt-6 pt-6 border-t border-line space-y-6">
          {/* Header Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-brand-soft border border-brand-300 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-brand-fg">Dopasowanie z Vault</span>
              <div className="text-2xl font-extrabold text-brand-fg font-mono mt-0.5 sv-tnum">
                {analysis.overallMatchPercentage}%
              </div>
            </div>

            <div className="p-3.5 bg-sunken border border-line rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-muted">Tytuł & Poziom</span>
              <div className="text-xs font-bold text-ink truncate mt-1">
                {analysis.parsedJD.jobTitle} ({analysis.parsedJD.seniorityLevel})
              </div>
            </div>

            <div className="p-3.5 bg-sunken border border-line rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-muted">Widełki / Wynagrodzenie</span>
              <div className="text-xs font-bold text-success-fg truncate mt-1">
                {analysis.parsedJD.salaryRange || 'Brak danych w ofercie'}
              </div>
            </div>

            <div className="p-3.5 bg-sunken border border-line rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-muted">Tryb Pracy</span>
              <div className="text-xs font-bold text-ink truncate mt-1">
                {analysis.parsedJD.workModel || 'Hybrydowa / Zdalna'}
              </div>
            </div>
          </div>

          {/* Dealbreaker & Mandatory Requirements Warnings */}
          {analysis.dealbreakerWarnings && analysis.dealbreakerWarnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-ink flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-danger-fg" />
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
                          ? 'bg-danger-soft border-danger-500/30 text-danger-fg'
                          : 'bg-success-soft border-success-500/30 text-success-fg'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {warn.missingInVault && !isAdded ? (
                          <AlertCircle className="w-4 h-4 text-danger-fg shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-success-fg shrink-0" />
                        )}
                        <span className="font-semibold">{warn.message}</span>
                      </div>

                      {warn.canQuickAdd && !isAdded && (
                        <Button
                          variant="danger"
                          size="xs"
                          icon={PlusCircle}
                          onClick={() => handleAddMissingSkillToVault(warn.quickAddValue)}
                        >
                          <span>Dodaj '{warn.quickAddValue}' do Vault</span>
                        </Button>
                      )}

                      {isAdded && (
                        <span className="px-2.5 py-0.5 rounded bg-success-soft text-success-fg font-bold text-[11px] flex items-center space-x-1">
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
              <h4 className="text-xs font-bold text-ink flex items-center space-x-2">
                <Gift className="w-4 h-4 text-success-fg" />
                <span>Benefity i Plusy Oferty Pracy:</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.benefitsList.map((benefit, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-success-soft border border-success-500/30 text-success-fg font-medium rounded-lg text-xs flex items-center space-x-1.5"
                  >
                    <Check className="w-3 h-3" />
                    <span>{benefit}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Skill Chips Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-fg" />
              <span>Wykryte Umiejętności Twarde & Narzędzia:</span>
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
                        ? 'bg-success-soft border-success-500/25 text-success-fg cursor-default'
                        : isAdded
                        ? 'bg-brand-soft border-brand-200 text-brand-fg'
                        : 'bg-warning-soft border-warning-500/25 text-warning-fg hover:bg-warning-soft/80'
                    }`}
                  >
                    {isAlreadyInVault ? (
                      <Check className="w-3.5 h-3.5 text-success-fg" />
                    ) : isAdded ? (
                      <Check className="w-3.5 h-3.5 text-brand-fg" />
                    ) : (
                      <PlusCircle className="w-3.5 h-3.5 text-warning-fg" />
                    )}
                    <span>{skill}</span>
                    {!isAlreadyInVault && !isAdded && (
                      <span className="text-[9px] uppercase font-mono text-warning-fg font-normal ml-1">
                        (+Dodaj do Vault)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Recommendations */}
          <div className="bg-sunken border border-line rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-ink flex items-center space-x-2">
              <Target className="w-4 h-4 text-brand-fg" />
              <span>Rekomendowane Akcje Dopasowujące:</span>
            </h4>
            <ul className="list-disc list-inside text-xs text-muted space-y-1">
              {analysis.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Apply & Sync Button */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Anuluj
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={handleApplyAll}
            >
              Użyj Sparsowanych Danych i Przejdź do Generatora
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
