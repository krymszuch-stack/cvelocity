import React from 'react';
import { AtsCheckResult } from '../types';
import { ShieldCheck, CheckCircle2, FileText, Calendar, Target, Cpu, Check, X, Layers, Sparkles, Binary, Award, Info, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';
import { ScoreRing, ProgressBar, StatTile } from './ui/Feedback';

interface AtsSimulatorViewProps {
  result: AtsCheckResult;
}

export const AtsSimulatorView: React.FC<AtsSimulatorViewProps> = ({ result }) => {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 text-ink shadow-xs space-y-5 animate-fade-in">
      <div className="flex items-center space-x-3 border-b border-line pb-4">
        <div className="p-2.5 bg-brand-soft border border-brand-500/25 rounded-xl text-brand-fg">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-ink">Symulator ATS: Audyt Zgodności</h2>
          <p className="text-xs text-muted">
            Ocena dopasowania lematycznego, struktury oraz słów kluczowych pod kątem systemów rekrutacyjnych.
          </p>
        </div>
      </div>

      {/* Main Score Gauge Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-sunken border border-line p-4 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="text-xs uppercase tracking-wider text-muted font-sans font-bold mb-3">Wynik Kompatybilności</div>
          <ScoreRing value={result.overallScore} size={110} label="ATS" />
          <div className="text-[10px] text-subtle mt-3">Wyliczenie algebry ważonej</div>
        </div>

        <div className="bg-sunken border border-line p-4 rounded-xl flex flex-col justify-between">
          <ProgressBar
            label="Umiejętności Twarde (Sh - 3x)"
            value={result.layer3Scoring?.hardSkillScore ?? result.keywordCoverageScore}
            tone="auto"
          />
          <div className="text-[10px] text-subtle mt-2">Dopasowanie z lematyzacją</div>
        </div>

        <div className="bg-sunken border border-line p-4 rounded-xl flex flex-col justify-between">
          <ProgressBar
            label="Świeżość Umiejętności (Sr - 1.5x)"
            value={result.layer3Scoring?.recencyScore ?? 80}
            tone="auto"
          />
          <div className="text-[10px] text-subtle mt-2">Waga nowszych stanowisk</div>
        </div>

        <div className="bg-sunken border border-line p-4 rounded-xl flex flex-col justify-between">
          <ProgressBar
            label="Zgodność Tytułu (St - 1.5x)"
            value={result.layer3Scoring?.titleMatchScore ?? 75}
            tone="auto"
          />
          <div className="text-[10px] text-subtle mt-2">Gęstość nagłówka vs JD</div>
        </div>
      </div>

      {/* Algebra Formula Breakdown Banner */}
      {result.layer3Scoring?.formulaBreakdown && (
        <div className="bg-sunken border border-line-strong p-3.5 rounded-xl text-xs font-mono text-brand-fg flex items-center space-x-2">
          <Binary className="w-4 h-4 text-brand-fg shrink-0" />
          <span>{result.layer3Scoring.formulaBreakdown}</span>
        </div>
      )}

      {/* 3-Layer Visual Architecture Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Layer 1: Structure */}
        <div className="bg-sunken border border-line rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-brand-fg font-bold text-xs border-b border-line pb-2">
            <Layers className="w-4 h-4 text-brand-fg" />
            <span>WARSTWA 1: Struktura & Układ</span>
          </div>
          <div className="space-y-3 text-xs">
            <ProgressBar
              label="Standardyzacja Nagłówków"
              value={result.layer1Structure?.headerNormalizationScore ?? result.structureScore}
              tone="brand"
            />
            <div className="flex justify-between items-center text-muted">
              <span className="font-semibold text-muted">Bezpieczeństwo Jednokolumnowe:</span>
              <StatusBadge variant={result.layer1Structure?.isSingleColumnCompliant ? 'success' : 'warning'}>
                {result.layer1Structure?.isSingleColumnCompliant ? 'TAK' : 'ZŁOŻONE'}
              </StatusBadge>
            </div>
            <div className="pt-1">
              <span className="text-[11px] text-subtle font-medium">Wykryte sekcje:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(result.layer1Structure?.detectedSections || ['Doświadczenie', 'Wykształcenie', 'Umiejętności', 'Kontakt']).map((sec) => (
                  <span key={sec} className="px-1.5 py-0.5 bg-brand-soft border border-brand-500/25 text-brand-fg rounded text-[10px]">
                    {sec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Layer 2: NLP & Lemmatization */}
        <div className="bg-sunken border border-line rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-brand-fg font-bold text-xs border-b border-line pb-2">
            <Sparkles className="w-4 h-4 text-brand-fg" />
            <span>WARSTWA 2: NLP & Lematyzacja</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center text-muted">
              <span className="font-semibold text-muted">Wykryte Frazy z Oferty:</span>
              <span className="font-bold font-mono text-brand-fg sv-tnum">
                {result.layer2Nlp?.extractedJdPhrasesCount || result.matchedKeywords.length}
              </span>
            </div>
            <ProgressBar
              label="Pokrycie Wymagań Formalnych"
              value={result.layer2Nlp?.formalReqsCoverage ?? 100}
              tone="auto"
            />
            <div className="flex justify-between items-center text-muted">
              <span className="font-semibold text-muted">Słowa Miękkie, Szum Odfiltrowany:</span>
              <span className="font-bold font-mono text-subtle sv-tnum">
                {result.layer2Nlp?.softSkillsFilterCount ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Layer 3: Weighted Scoring Logic */}
        <div className="bg-sunken border border-line rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-warning-fg font-bold text-xs border-b border-line pb-2">
            <Award className="w-4 h-4 text-warning-fg" />
            <span>WARSTWA 3: Algebra Punktacji</span>
          </div>
          <div className="space-y-3 text-xs">
            <ProgressBar
              label="Waga Hard Skills 3.0x"
              value={result.layer3Scoring?.hardSkillScore ?? result.keywordCoverageScore}
              tone="brand"
            />
            <ProgressBar
              label="Waga Świeżości 1.5x"
              value={result.layer3Scoring?.recencyScore ?? 80}
              tone="auto"
            />
            <ProgressBar
              label="Zgodność Tytułu 1.5x"
              value={result.layer3Scoring?.titleMatchScore ?? 75}
              tone="brand"
            />
          </div>
        </div>
      </div>

      {/* ATS Evaluation Factors Summary */}
      <div className="bg-raised border border-line rounded-xl p-5 text-ink space-y-3">
        <div className="flex items-center space-x-2 border-b border-line pb-2">
          <Cpu className="w-4 h-4 text-brand-fg" />
          <h3 className="text-xs font-bold tracking-wide uppercase text-muted">
            Analizowane Czynniki Zgodności ATS
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <StatTile
            icon={Target}
            accent="brand"
            label="Wymagania Twarde"
            value={`${result.layer3Scoring?.hardSkillScore ?? result.keywordCoverageScore}%`}
            hint="Pokrycie umiejętności z oferty (waga 3x)"
          />
          <StatTile
            icon={Calendar}
            accent="success"
            label="Świeżość Wiedzy"
            value={`${result.layer3Scoring?.recencyScore ?? 0}%`}
            hint="Obecność w najnowszych stanowiskach (waga 1.5x)"
          />
          <StatTile
            icon={Award}
            accent="brand"
            label="Zgodność Tytułu"
            value={`${result.layer3Scoring?.titleMatchScore ?? 0}%`}
            hint="Zbieżność z nazwą stanowiska (waga 1.5x)"
          />
          <StatTile
            icon={FileText}
            accent="neutral"
            label="Układ & Daty"
            value={`${result.structureScore}%`}
            hint="Jednokolumnowy układ i standardowe daty"
          />
        </div>
      </div>

      {/* Keywords Breakdown (Matched vs Missing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched Keywords */}
        <div className="bg-sunken border border-line rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-ink flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-success-fg" />
            <span>Wykryte Słowa Kluczowe z Lematyzacją: <span className="sv-tnum">{result.matchedKeywords.length}</span></span>
          </h3>
          {result.matchedKeywords.length === 0 ? (
            <p className="text-xs text-muted">Brak dopasowanych słów z ogłoszenia.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.matchedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success-soft border border-success-500/25 text-success-fg font-mono text-[11px] font-medium"
                >
                  <Check className="w-3 h-3 shrink-0" />
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Keywords */}
        <div className="bg-sunken border border-line rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-ink flex items-center space-x-1.5">
            <X className="w-4 h-4 text-danger-fg" />
            <span>Brakujące Umiejętności z Ogłoszenia: <span className="sv-tnum">{result.missingHardSkills.length}</span></span>
          </h3>
          {result.missingHardSkills.length === 0 ? (
            <p className="text-xs text-success-fg font-medium">Brak luk – 100% kluczowych umiejętności znajduje się w CV!</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.missingHardSkills.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-danger-soft border border-danger-500/25 text-danger-fg font-mono text-[11px] font-medium"
                >
                  <X className="w-3 h-3 shrink-0" />
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Box */}
      {result.recommendations.length > 0 && (
        <div className="bg-warning-soft border border-warning-500/25 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-warning-fg flex items-center space-x-1.5">
            <Target className="w-4 h-4 text-warning-fg" />
            <span>Rekomendacje Optymalizacyjne Dla ATS</span>
          </h3>
          <ul className="list-disc list-inside text-xs text-warning-fg space-y-1 pl-1">
            {result.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* OCR & Date Format Check Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-sunken border border-line p-4 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-ink flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-brand-fg" />
            <span>Formatowanie Dat Standard ATS</span>
          </h4>
          {result.badDateFormats.length === 0 ? (
            <div className="text-xs text-success-fg font-medium flex items-center space-x-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Wszystkie daty używają czytelnego formatu MM/YYYY.</span>
            </div>
          ) : (
            <div className="space-y-1">
              {result.badDateFormats.map((err, i) => (
                <div key={i} className="text-xs text-danger-fg bg-danger-soft p-2 rounded border border-danger-500/25 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-sunken border border-line p-4 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-ink flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-fg" />
            <span>Sprawdzanie Struktur OCR</span>
          </h4>
          {result.ocrWarnings.length === 0 && (!result.layer1Structure?.unparsableElementsWarnings || result.layer1Structure.unparsableElementsWarnings.length === 0) ? (
            <div className="text-xs text-success-fg font-medium flex items-center space-x-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Struktura dokumentu wolna od tabel i skomplikowanych grafik (wysoka czytelność OCR).</span>
            </div>
          ) : (
            <div className="space-y-1">
              {result.ocrWarnings.map((warn, i) => (
                <div key={i} className="text-xs text-warning-fg bg-warning-soft p-2 rounded border border-warning-500/25 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
              {result.layer1Structure?.unparsableElementsWarnings.map((warn, i) => (
                <div key={`u-${i}`} className="text-xs text-danger-fg bg-danger-soft p-2 rounded border border-danger-500/25 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


