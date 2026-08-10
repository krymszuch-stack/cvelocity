import React, { useState, useEffect } from 'react';
import { InterviewCheatSheet, MasterVault } from '../types';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Star,
  MessagesSquare,
  AlertTriangle,
  LifeBuoy,
  HelpCircle,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader } from './ui/Card';
import { StatusBadge, Chip } from './ui/StatusBadge';
import { Button } from './ui/Button';
import { Alert, EmptyState } from './ui/Feedback';
import { generateCheatSheetEnrichmentWithAI, mergeGeminiCheatSheetEnrichment } from '../lib/interviewCheatSheetEngine';

interface InterviewCheatSheetViewProps {
  cheatSheet: InterviewCheatSheet;
  vault: MasterVault;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  onOpenAdvisor?: (question?: string) => void;
}

export const InterviewCheatSheetView: React.FC<InterviewCheatSheetViewProps> = ({
  cheatSheet: initialSheet,
  vault,
  jobTitle,
  companyName,
  jobDescription,
}) => {
  const [sheet, setSheet] = useState<InterviewCheatSheet>(initialSheet);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // Resync to the freshly-computed local skeleton whenever offer/vault change upstream.
  useEffect(() => {
    setSheet(initialSheet);
    setFromCache(false);
  }, [initialSheet]);

  const handleGenerateEnrichment = async () => {
    setIsEnriching(true);
    setEnrichError(null);
    try {
      const topRequirements = [
        ...sheet.glossary.filter((g) => g.source === 'JD_HARD_SKILL').map((g) => g.term),
        ...sheet.redFlagsChecklist.filter((r) => r.severity === 'MUST_KNOW').map((r) => r.label),
      ].slice(0, 8);

      const { enrichment, fromCache: cached } = await generateCheatSheetEnrichmentWithAI(
        jobTitle,
        companyName,
        jobDescription,
        vault,
        topRequirements
      );
      setSheet(mergeGeminiCheatSheetEnrichment(sheet, enrichment));
      setFromCache(cached);
    } catch (err: any) {
      setEnrichError(err?.message || 'Nie udało się wzbogacić ściągi przez Gemini Flash.');
    } finally {
      setIsEnriching(false);
    }
  };

  const handlePrint = () => window.print();

  const hasVaultHistory = vault?.history && vault.history.length > 0;

  return (
    <div className="space-y-4 cheatsheet-printable-area">
      <div className="bg-surface border border-line rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand-fg flex items-center justify-center shrink-0">
            <GraduationCap className="w-[18px] h-[18px]" />
          </span>
          <span className="text-sm font-bold text-ink truncate">Ściąga na Rozmowę Kwalifikacyjną</span>
          <StatusBadge variant={sheet.generationMode === 'GEMINI_ENRICHED' ? 'brand' : 'success'} size="sm">
            {sheet.generationMode === 'GEMINI_ENRICHED' ? 'Gemini Flash' : '0 tokenów'}
          </StatusBadge>
          {fromCache && (
            <StatusBadge variant="neutral" size="sm" showIcon={false}>
              z pamięci podręcznej
            </StatusBadge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
            Drukuj
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={sheet.generationMode === 'GEMINI_ENRICHED' ? RefreshCw : Sparkles}
            loading={isEnriching}
            disabled={!hasVaultHistory}
            onClick={handleGenerateEnrichment}
          >
            {sheet.generationMode === 'GEMINI_ENRICHED' ? 'Odśwież przez AI' : 'Wzbogać o AI'}
          </Button>
        </div>
      </div>

      {enrichError && (
        <Alert variant="danger" title="Błąd generowania">
          {enrichError}
        </Alert>
      )}

      {!hasVaultHistory && (
        <Alert variant="info" title="Uzupełnij historię pracy">
          Punkty STAR i wzbogacenie przez AI potrzebują przynajmniej jednego wpisu w historii zawodowej Master Vault.
        </Alert>
      )}

      {sheet.personalizedFraming && (
        <Alert variant="info" title="Dlaczego ta rola / firma">
          {sheet.personalizedFraming}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader icon={BookOpen} title="Glosariusz" subtitle="Kluczowe pojęcia z oferty" />
          <div className="mt-4 space-y-3">
            {sheet.glossary.length === 0 ? (
              <p className="text-sm text-muted">Brak wykrytych terminów w tej ofercie.</p>
            ) : (
              sheet.glossary.map((g) => (
                <div key={g.id}>
                  <p className="text-sm font-semibold text-ink">{g.term}</p>
                  <p className="text-xs text-muted leading-relaxed">{g.definition}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader icon={Star} title="STAR — Punkty do Opowiedzenia" subtitle="Sytuacja / Zadanie / Akcja / Rezultat" />
          <div className="mt-4 space-y-4">
            {sheet.starTalkingPoints.length === 0 ? (
              <EmptyState
                icon={Star}
                title="Brak jeszcze punktów STAR"
                description="Dodaj doświadczenie zawodowe do Master Vault albo kliknij „Wzbogać o AI”, żeby wygenerować spersonalizowane punkty."
              />
            ) : (
              sheet.starTalkingPoints.map((s) => (
                <div key={s.id} className="border border-line rounded-lg p-3 bg-sunken">
                  <Chip variant="brand" className="mb-2">
                    {s.relatedRequirement}
                  </Chip>
                  <div className="space-y-1.5 text-xs text-muted">
                    <p><span className="font-bold text-ink">S:</span> {s.situation}</p>
                    <p><span className="font-bold text-ink">T:</span> {s.task}</p>
                    <p><span className="font-bold text-ink">A:</span> {s.action}</p>
                    <p><span className="font-bold text-ink">R:</span> {s.result}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader icon={MessagesSquare} title="Pytania i Odpowiedzi" subtitle="Bank pytań rekrutacyjnych" />
          <div className="mt-4 space-y-3">
            {sheet.qaBank.map((qa) => (
              <div key={qa.id}>
                <p className="text-sm font-semibold text-ink">{qa.question}</p>
                <p className="text-xs text-muted leading-relaxed mt-0.5">{qa.modelAnswer}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader icon={AlertTriangle} title="Na Co Uważać / Kluczowe Pojęcia" subtitle="Wymagania i obowiązki z oferty" accent="warning" />
          <div className="mt-4 space-y-2.5">
            {sheet.redFlagsChecklist.length === 0 ? (
              <p className="text-sm text-muted">Brak wykrytych wymagań krytycznych w tej ofercie.</p>
            ) : (
              sheet.redFlagsChecklist.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <StatusBadge variant={r.severity === 'MUST_KNOW' ? 'danger' : 'warning'} size="sm" showIcon={false}>
                    {r.severity === 'MUST_KNOW' ? 'Musisz znać' : 'Warto znać'}
                  </StatusBadge>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{r.label}</p>
                    <p className="text-xs text-muted">{r.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader icon={LifeBuoy} title="Frazy Ratunkowe" subtitle="Kupowanie czasu do namysłu" />
          <div className="mt-4 space-y-2.5">
            {sheet.emergencyPhrases.map((p) => (
              <div key={p.id} className="border-l-4 border-brand-500 pl-3">
                <p className="text-xs text-subtle">{p.scenario}</p>
                <p className="text-sm italic text-ink">„{p.phrasePL}”</p>
                {p.phraseEN && <p className="text-xs italic text-muted">„{p.phraseEN}”</p>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader icon={HelpCircle} title="Pytania do Rekrutera" subtitle="Zadaj pod koniec rozmowy" />
          <div className="mt-4 space-y-3">
            {sheet.questionsToAsk.map((q) => (
              <div key={q.id}>
                <p className="text-sm font-semibold text-ink">{q.question}</p>
                <p className="text-xs text-subtle mt-0.5">{q.rationale}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
