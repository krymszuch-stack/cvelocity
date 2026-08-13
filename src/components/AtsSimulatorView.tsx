import React from 'react';
import { AtsCheckResult } from '../types';
import { ShieldCheck, CheckCircle2, FileText, Calendar, Target, Cpu, Check, X, Layers, Sparkles, Binary, Award, Info, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';

interface AtsSimulatorViewProps {
  result: AtsCheckResult;
}

export const AtsSimulatorView: React.FC<AtsSimulatorViewProps> = ({ result }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-fg border-success-500/30 bg-success-soft';
    if (score >= 60) return 'text-warning-fg border-warning-500/30 bg-warning-soft';
    return 'text-danger-fg border-danger-500/30 bg-danger-soft';
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 text-ink shadow-xs space-y-5 animate-fade-in">
      <div className="flex items-center space-x-3 border-b border-line pb-4">
        <div className="p-2.5 bg-brand-soft border border-brand-200 rounded-xl text-brand-fg">
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
        <div className={`p-4 rounded-xl border text-center font-mono ${getScoreColor(result.overallScore)}`}>
          <div className="text-xs uppercase tracking-wider text-muted font-sans font-bold mb-1">Wynik Kompatybilności</div>
          <div className="text-4xl font-extrabold sv-tnum">{result.overallScore}%</div>
          <div className="text-[10px] text-subtle mt-1">Wyliczenie algebry ważonej</div>
        </div>

        <div className="bg-sunken border border-line p-4 rounded-xl text-center">
          <div className="text-xs text-muted font-medium mb-1">Umiejętności Twarde (Sh - 3x)</div>
          <div className="text-2xl font-bold font-mono text-brand-fg sv-tnum">
            {result.layer3Scoring?.hardSkillScore ?? result.keywordCoverageScore}%
          </div>
          <div className="text-[10px] text-subtle mt-1">Dopasowanie z lematyzacją</div>
        </div>

        <div className="bg-sunken border border-line p-4 rounded-xl text-center">
          <div className="text-xs text-muted font-medium mb-1">Świeżość Umiejętności (Sr - 1.5x)</div>
          <div className="text-2xl font-bold font-mono text-success-fg sv-tnum">
            {result.layer3Scoring?.recencyScore ?? 80}%
          </div>
          <div className="text-[10px] text-subtle mt-1">Waga nowszych stanowisk</div>
        </div>

        <div className="bg-sunken border border-line p-4 rounded-xl text-center">
          <div className="text-xs text-muted font-medium mb-1">Zgodność Tytułu (St - 1.5x)</div>
          <div className="text-2xl font-bold font-mono text-brand-fg sv-tnum">
            {result.layer3Scoring?.titleMatchScore ?? 75}%
          </div>
          <div className="text-[10px] text-subtle mt-1">Gęstość nagłówka vs JD</div>
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
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted">
              <span>Standardyzacja Nagłówków:</span>
              <span className="font-bold font-mono text-brand-fg sv-tnum">
                {result.layer1Structure?.headerNormalizationScore ?? result.structureScore}%
              </span>
            </div>
            <div className="flex justify-between items-center text-muted">
              <span>Bezpieczeństwo Jednokolumnowe:</span>
              <StatusBadge variant={result.layer1Structure?.isSingleColumnCompliant ? 'success' : 'warning'}>
                {result.layer1Structure?.isSingleColumnCompliant ? 'TAK' : 'ZŁOŻONE'}
              </StatusBadge>
            </div>
            <div className="pt-1">
              <span className="text-[11px] text-subtle font-medium">Wykryte sekcje:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(result.layer1Structure?.detectedSections || ['Doświadczenie', 'Wykształcenie', 'Umiejętności', 'Kontakt']).map((sec) => (
                  <span key={sec} className="px-1.5 py-0.5 bg-brand-soft border border-brand-200 text-brand-fg rounded text-[10px]">
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
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted">
              <span>Wykryte Frazy z Oferty:</span>
              <span className="font-bold font-mono text-brand-fg sv-tnum">
                {result.layer2Nlp?.extractedJdPhrasesCount || result.matchedKeywords.length}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted">
              <span>Pokrycie Wymagań Formalnych:</span>
              <span className="font-bold font-mono text-success-fg sv-tnum">
                {result.layer2Nlp?.formalReqsCoverage ?? 100}%
              </span>
            </div>
            <div className="flex justify-between items-center text-muted">
              <span>Słowa Miękkie, Szum Odfiltrowany:</span>
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
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted">
              <span>Waga Hard Skills 3.0x:</span>
              <span className="font-bold font-mono text-brand-fg sv-tnum">
                {result.layer3Scoring?.hardSkillScore ?? result.keywordCoverageScore}%
              </span>
            </div>
            <div className="flex justify-between items-center text-muted">
              <span>Waga Świeżości 1.5x:</span>
              <span className="font-bold font-mono text-success-fg sv-tnum">
                {result.layer3Scoring?.recencyScore ?? 80}%
              </span>
            </div>
            <div className="flex justify-between items-center text-muted">
              <span>Zgodność Tytułu 1.5x:</span>
              <span className="font-bold font-mono text-brand-fg sv-tnum">
                {result.layer3Scoring?.titleMatchScore ?? 75}%
              </span>
            </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-sunken border border-line p-3 rounded-lg space-y-1">
            <div className="text-[11px] font-bold text-ink">Wymagania Twarde</div>
            <div className="text-lg font-extrabold font-mono text-brand-fg sv-tnum">{result.layer3Scoring?.hardSkillScore ?? result.keywordCoverageScore}%</div>
            <div className="text-[9px] text-muted leading-tight">Pokrycie umiejętności z oferty (waga 3x)</div>
          </div>
          <div className="bg-sunken border border-line p-3 rounded-lg space-y-1">
            <div className="text-[11px] font-bold text-ink">Świeżość Wiedzy</div>
            <div className="text-lg font-extrabold font-mono text-brand-fg sv-tnum">{result.layer3Scoring?.recencyScore ?? 0}%</div>
            <div className="text-[9px] text-muted leading-tight">Obecność w najnowszych stanowiskach (waga 1.5x)</div>
          </div>
          <div className="bg-sunken border border-line p-3 rounded-lg space-y-1">
            <div className="text-[11px] font-bold text-ink">Zgodność Tytułu</div>
            <div className="text-lg font-extrabold font-mono text-brand-fg sv-tnum">{result.layer3Scoring?.titleMatchScore ?? 0}%</div>
            <div className="text-[9px] text-muted leading-tight">Zbieżność z nazwą stanowiska (waga 1.5x)</div>
          </div>
          <div className="bg-sunken border border-line p-3 rounded-lg space-y-1">
            <div className="text-[11px] font-bold text-ink">Układ & Daty</div>
            <div className="text-lg font-extrabold font-mono text-brand-fg sv-tnum">{result.structureScore}%</div>
            <div className="text-[9px] text-muted leading-tight">Jednokolumnowy układ i standardowe daty</div>
          </div>
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success-soft border border-success-500/30 text-success-fg font-mono text-[11px] font-medium"
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-danger-soft border border-danger-500/30 text-danger-fg font-mono text-[11px] font-medium"
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
        <div className="bg-warning-soft border border-warning-500/30 rounded-xl p-4 space-y-2">
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
                <div key={i} className="text-xs text-danger-fg bg-danger-soft p-2 rounded border border-danger-500/30 flex items-start gap-1.5">
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
                <div key={i} className="text-xs text-warning-fg bg-warning-soft p-2 rounded border border-warning-500/30 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
              {result.layer1Structure?.unparsableElementsWarnings.map((warn, i) => (
                <div key={`u-${i}`} className="text-xs text-danger-fg bg-danger-soft p-2 rounded border border-danger-500/30 flex items-start gap-1.5">
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


