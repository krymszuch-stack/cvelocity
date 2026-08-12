import React, { useState } from 'react';
import { apiFetch } from '../lib/apiClient';
import { MasterVault } from '../types';
import {
  Sparkles, AlertCircle, Search, Link as LinkIcon, Globe, ShieldAlert, Check, ChevronDown, Building2,
} from 'lucide-react';
import { AdvisorButton } from './ui/AdvisorButton';
import { Button } from './ui/Button';
import { Card, CardHeader } from './ui/Card';
import { Input, Textarea } from './ui/Field';
import { Alert, ProgressBar } from './ui/Feedback';
import { StatusBadge } from './ui/StatusBadge';
import { analyzeJdMatchWithVault, parseJobDescriptionLocal, JDVaultMatchAnalysis } from '../lib/jdParser';
import { JDParserModal } from './JDParserModal';
import { RealtimeLivePreview } from './RealtimeLivePreview';
import { AutocompleteInput } from './AutocompleteInput';
import { SUGGESTED_JOB_TITLES } from '../lib/autocompleteSuggestions';

interface JobMatcherProps {
  vault: MasterVault;
  onUpdateStats: () => void;
  onUpdateVault?: (updated: MasterVault) => void;
  onOpenAdvisor?: (question?: string) => void;
}

export const JobMatcher: React.FC<JobMatcherProps> = ({ vault, onUpdateStats, onUpdateVault, onOpenAdvisor }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const handleLoadSampleOffer = () => {
    setJobTitle('Senior Full-Stack Engineer & Cloud Systems Architect');
    setCompanyName('TechGrowth Inc.');
    setJobDescription(
      `Poszukujemy doświadczonego Inżyniera Oprogramowania (Senior Full-Stack Engineer), który dołączy do naszego zespołu.\n\nWymagania kluczowe:\n- Min. 5 lat doświadczenia w TypeScript, React.js oraz Node.js (Express).\n- Doświadczenie w optymalizacji zapytań SQL, baz danych PostgreSQL i Redis.\n- Znajomość architektury mikroserwisów, konteneryzacji (Docker, Kubernetes) oraz CI/CD.\n- Znajomość systemów chmurowych (AWS/GCP).\n- Umiejętność kierowania zespołem technologicznym (Tech Lead) i wprowadzania praktyk Code Review.\n- Język angielski na poziomie C1.\n- Prawo jazdy kat. B (Wymóg konieczny).`
    );
  };

  const [jdUrlInput, setJdUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [scraperError, setScraperError] = useState<string | null>(null);
  const [matchAudit, setMatchAudit] = useState<JDVaultMatchAnalysis | null>(null);
  const [addedSkills, setAddedSkills] = useState<string[]>([]);
  const [isJdParserOpen, setIsJdParserOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleFetchOfferUrl = async () => {
    if (!jdUrlInput.trim() || !jdUrlInput.startsWith('http')) {
      setScraperError('Wklej prawidłowy link do oferty pracy (np. https://pracuj.pl/... lub https://nofluffjobs.com/...).');
      return;
    }

    setIsFetchingUrl(true);
    setScraperError(null);

    try {
      const response = await apiFetch('/api/fetch-jd-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jdUrlInput.trim() }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.parsedJd) {
        if (data.parsedJd.jobTitle) setJobTitle(data.parsedJd.jobTitle);
        if (data.parsedJd.companyName) setCompanyName(data.parsedJd.companyName);
        if (data.rawJdText) setJobDescription(data.rawJdText);

        setMatchAudit(analyzeJdMatchWithVault(data.parsedJd, vault));
        // The scrape consumed Gemini budget — refresh the header's savings widget.
        onUpdateStats();
      } else if (response.status === 403 || data.is403Blocked) {
        setScraperError(
          'Portal ogłoszeń (np. Pracuj.pl, LinkedIn) zablokował automatyczne pobieranie (403 Forbidden). Skopiuj tekst ze strony oferty i wklej go w polu „Treść ogłoszenia” poniżej.'
        );
      } else {
        throw new Error(data.error || 'Nie udało się pobrać treści oferty z podanego URL.');
      }
    } catch (err: any) {
      console.warn('URL Scraper Error:', err);
      const is403 = err?.message?.includes('403') || err?.message?.includes('Forbidden');
      setScraperError(
        is403
          ? 'Portal ogłoszeń zablokował automatyczny dostęp (403 Forbidden). Skopiuj tekst oferty i wklej go bezpośrednio w polu „Treść ogłoszenia” poniżej.'
          : err?.message || 'Nie udało się połączyć ze stroną. Możesz wkleić surowy tekst ogłoszenia ręcznie poniżej.'
      );
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleAnalyzeText = () => {
    if (!jobDescription.trim()) return;
    setMatchAudit(analyzeJdMatchWithVault(parseJobDescriptionLocal(jobDescription), vault));
    setIsDetailsOpen(true);
  };

  const handleQuickAddSkillToVault = (skill: string) => {
    if (!onUpdateVault) return;
    onUpdateVault({
      ...vault,
      skillsMatrix: {
        ...vault.skillsMatrix,
        hardSkills: vault.skillsMatrix.hardSkills.includes(skill)
          ? vault.skillsMatrix.hardSkills
          : [...vault.skillsMatrix.hardSkills, skill],
      },
    });
    setAddedSkills((prev) => [...prev, skill]);
  };

  return (
    <div className="space-y-5">
      {/* ---------- Offer intake ---------- */}
      <Card className="overflow-hidden relative">
        {/* Ambient brand wash, purely decorative */}
        <div
          aria-hidden
          className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none"
        />

        <div className="relative">
          <CardHeader
            icon={Globe}
            title="Wklej link do oferty pracy"
            subtitle="Pobierzemy treść ogłoszenia i od razu dopasujemy Twoje CV."
            actions={
              <>
                {onOpenAdvisor && (
                  <AdvisorButton
                    onClick={() => onOpenAdvisor(`Jak najlepiej przygotować CV pod stanowisko "${jobTitle}"?`)}
                  />
                )}
                <Button size="sm" icon={Search} onClick={() => setIsJdParserOpen(true)}>
                  Analizuj tekst
                </Button>
              </>
            }
          />

          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <Input
              type="url"
              value={jdUrlInput}
              onChange={(e) => setJdUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchOfferUrl()}
              placeholder="https://www.pracuj.pl/praca/senior-developer..."
              icon={LinkIcon}
              wrapClassName="flex-1"
              className="font-mono text-xs"
            />
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={handleFetchOfferUrl}
              loading={isFetchingUrl}
              className="sm:self-start shrink-0"
            >
              {isFetchingUrl ? 'Pobieranie…' : 'Pobierz i dopasuj'}
            </Button>
          </div>

          {scraperError && (
            <Alert variant="warning" className="mt-3">
              {scraperError}
            </Alert>
          )}

          {/* ---------- Requirements audit ---------- */}
          {matchAudit && (
            <div className="mt-5 rounded-xl border border-line bg-sunken p-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-warning-500" />
                  <span className="text-sm font-bold text-ink">Audyt wymagań z oferty</span>
                </div>
                <StatusBadge
                  variant={
                    matchAudit.overallMatchPercentage >= 75
                      ? 'success'
                      : matchAudit.overallMatchPercentage >= 45
                        ? 'warning'
                        : 'danger'
                  }
                  showIcon={false}
                >
                  Dopasowanie: {matchAudit.overallMatchPercentage}%
                </StatusBadge>
              </div>

              <ProgressBar
                value={matchAudit.overallMatchPercentage}
                showValue={false}
                className="mt-3"
              />

              {matchAudit.dealbreakerWarnings && matchAudit.dealbreakerWarnings.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Wymogi konieczne i ostrzeżenia
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 stagger">
                    {matchAudit.dealbreakerWarnings.map((warn, i) => {
                      const isAdded = addedSkills.includes(warn.quickAddValue);
                      const isMissing = warn.missingInVault && !isAdded;
                      return (
                        <div
                          key={warn.id}
                          style={{ ['--i' as string]: i }}
                          className={`flex items-center justify-between gap-2.5 rounded-lg border px-3 py-2.5 ${
                            isMissing
                              ? 'bg-danger-soft border-danger-500/25'
                              : 'bg-success-soft border-success-500/25'
                          }`}
                        >
                          <span className={`text-xs leading-snug ${isMissing ? 'text-danger-fg' : 'text-success-fg'}`}>
                            {warn.message}
                          </span>
                          {warn.canQuickAdd && !isAdded && (
                            <Button
                              size="xs"
                              variant="danger"
                              onClick={() => handleQuickAddSkillToVault(warn.quickAddValue)}
                            >
                              Dodaj
                            </Button>
                          )}
                          {isAdded && (
                            <StatusBadge variant="success" size="sm" showIcon={false} className="shrink-0">
                              <Check className="w-3 h-3" /> Dodano
                            </StatusBadge>
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
      </Card>

      {/* ---------- Offer details (collapsible) ---------- */}
      <Card padded={false}>
        <button
          onClick={() => setIsDetailsOpen((o) => !o)}
          aria-expanded={isDetailsOpen}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-sunken transition-colors rounded-card"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-[10px] bg-brand-soft text-brand-fg flex items-center justify-center shrink-0">
              <Building2 className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink truncate">Szczegóły stanowiska i treść ogłoszenia</p>
              <p className="text-xs text-muted truncate">
                {jobTitle} · {companyName}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-subtle shrink-0 transition-transform duration-300 ${isDetailsOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isDetailsOpen && (
          <div className="px-5 pb-5 pt-1 space-y-4 border-t border-line animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <AutocompleteInput
                label="Docelowe stanowisko"
                value={jobTitle}
                onChange={setJobTitle}
                suggestions={SUGGESTED_JOB_TITLES}
                placeholder="np. Senior Full-Stack Engineer"
                showQuickPills
                maxPills={4}
              />
              <Input
                label="Nazwa firmy / pracodawcy"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="np. TechCorp Global"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted">Treść ogłoszenia o pracę</span>
                <button
                  type="button"
                  onClick={handleLoadSampleOffer}
                  className="text-xs font-medium text-brand-500 hover:underline"
                >
                  Wypełnij przykładową ofertą (IT)
                </button>
              </div>
              <Textarea
                rows={7}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Wklej tutaj pełną treść ogłoszenia o pracę..."
                className="font-mono text-xs"
              />
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="outline" icon={Search} onClick={handleAnalyzeText}>
                Przeanalizuj tekst ogłoszenia
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ---------- Live tailored output ---------- */}
      <RealtimeLivePreview
        vault={vault}
        jobTitle={jobTitle}
        companyName={companyName}
        jobDescription={jobDescription}
        onUpdateVault={onUpdateVault}
      />

      <JDParserModal
        isOpen={isJdParserOpen}
        onClose={() => setIsJdParserOpen(false)}
        vault={vault}
        initialJdText={jobDescription}
        onApplyParsedData={(parsed) => {
          if (parsed.jobTitle) setJobTitle(parsed.jobTitle);
          if (parsed.companyName) setCompanyName(parsed.companyName);
          if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
          if (parsed.updatedVault && onUpdateVault) onUpdateVault(parsed.updatedVault);
        }}
      />
    </div>
  );
};
