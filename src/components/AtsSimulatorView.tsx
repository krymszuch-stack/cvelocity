import React from 'react';
import { AtsCheckResult } from '../types';
import { ShieldCheck, CheckCircle2, FileText, Calendar, Target, Cpu, Check, X, Layers, Sparkles, Binary, Award, Info, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';

interface AtsSimulatorViewProps {
  result: AtsCheckResult;
}

export const AtsSimulatorView: React.FC<AtsSimulatorViewProps> = ({ result }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-700 border-success-500/30 bg-success-50';
    if (score >= 60) return 'text-warning-700 border-warning-500/30 bg-warning-50';
    return 'text-danger-700 border-danger-500/30 bg-danger-50';
  };

  // Estimate compatibility across popular corporate ATS engines
  const systemScores = [
    { name: 'Workday', score: Math.min(100, Math.round(result.overallScore * 0.9 + result.structureScore * 0.1)), desc: 'Rygorystyczny dla formatowania dat i nagłówków' },
    { name: 'Greenhouse', score: Math.min(100, Math.round((result.layer2Nlp?.hardSkillsCoverage || result.keywordCoverageScore) * 0.8 + result.formattingScore * 0.2)), desc: 'Kładzie nacisk na lematyzację i zwięzłość' },
    { name: 'Lever', score: Math.min(100, Math.round(result.keywordCoverageScore * 0.75 + result.structureScore * 0.25)), desc: 'Szybkie parsowanie jednokolumnowe' },
    { name: 'Taleo / Oracle', score: Math.min(100, Math.round(result.structureScore * 0.5 + result.keywordCoverageScore * 0.5)), desc: 'Tradycyjny parser korporacyjny' },
    { name: 'iCIMS', score: Math.min(100, Math.round(result.overallScore * 0.95)), desc: 'Weryfikator wagi świeżości i gęstości słów' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 text-slate-900 shadow-xs space-y-5 animate-fade-in">
      <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Symulator ATS: Audyt Zgodności</h2>
          <p className="text-xs text-slate-500">
            Ocena dopasowania lematycznego, struktury oraz słów kluczowych pod kątem systemów rekrutacyjnych.
          </p>
        </div>
      </div>

      {/* Main Score Gauge Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border text-center font-mono ${getScoreColor(result.overallScore)}`}>
          <div className="text-xs uppercase tracking-wider text-slate-600 font-sans font-bold mb-1">Wynik Kompatybilności</div>
          <div className="text-4xl font-extrabold">{result.overallScore}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Wyliczenie algebry ważonej</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
          <div className="text-xs text-slate-500 font-medium mb-1">Umiejętności Twarde (Sh - 3x)</div>
          <div className="text-2xl font-bold font-mono text-indigo-600">
            {result.layer3Scoring?.hardSkillScore ?? result.keywordCoverageScore}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Dopasowanie z lematyzacją</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
          <div className="text-xs text-slate-500 font-medium mb-1">Świeżość Umiejętności (Sr - 1.5x)</div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {result.layer3Scoring?.recencyScore ?? 80}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Waga nowszych stanowisk</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
          <div className="text-xs text-slate-500 font-medium mb-1">Zgodność Tytułu (St - 1.5x)</div>
          <div className="text-2xl font-bold font-mono text-purple-600">
            {result.layer3Scoring?.titleMatchScore ?? 75}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Gęstość nagłówka vs JD</div>
        </div>
      </div>

      {/* Algebra Formula Breakdown Banner */}
      {result.layer3Scoring?.formulaBreakdown && (
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-cyan-300 flex items-center space-x-2">
          <Binary className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{result.layer3Scoring.formulaBreakdown}</span>
        </div>
      )}

      {/* 3-Layer Visual Architecture Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Layer 1: Structure */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs border-b border-slate-200 pb-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>WARSTWA 1: Struktura & Układ</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>Standardyzacja Nagłówków:</span>
              <span className="font-bold font-mono text-indigo-600">
                {result.layer1Structure?.headerNormalizationScore ?? result.structureScore}%
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Bezpieczeństwo Jednokolumnowe:</span>
              <StatusBadge variant={result.layer1Structure?.isSingleColumnCompliant ? 'success' : 'warning'}>
                {result.layer1Structure?.isSingleColumnCompliant ? 'TAK' : 'ZŁOŻONE'}
              </StatusBadge>
            </div>
            <div className="pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Wykryte sekcje:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(result.layer1Structure?.detectedSections || ['Doświadczenie', 'Wykształcenie', 'Umiejętności', 'Kontakt']).map((sec) => (
                  <span key={sec} className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded text-[10px]">
                    {sec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Layer 2: NLP & Lemmatization */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs border-b border-slate-200 pb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>WARSTWA 2: NLP & Lematyzacja</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>Wykryte Frazy z Oferty:</span>
              <span className="font-bold font-mono text-purple-600">
                {result.layer2Nlp?.extractedJdPhrasesCount || result.matchedKeywords.length}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Pokrycie Wymagań Formalnych:</span>
              <span className="font-bold font-mono text-emerald-600">
                {result.layer2Nlp?.formalReqsCoverage ?? 100}%
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Słowa Miękkie, Szum Odfiltrowany:</span>
              <span className="font-bold font-mono text-slate-500">
                {result.layer2Nlp?.softSkillsFilterCount ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Layer 3: Weighted Scoring Logic */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs border-b border-slate-200 pb-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>WARSTWA 3: Algebra Punktacji</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>Waga Hard Skills 3.0x:</span>
              <span className="font-bold font-mono text-indigo-600">
                {result.layer3Scoring?.hardSkillScore ?? result.keywordCoverageScore}%
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Waga Świeżości 1.5x:</span>
              <span className="font-bold font-mono text-emerald-600">
                {result.layer3Scoring?.recencyScore ?? 80}%
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Zgodność Tytułu 1.5x:</span>
              <span className="font-bold font-mono text-purple-600">
                {result.layer3Scoring?.titleMatchScore ?? 75}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate ATS Engine Compatibility Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold tracking-wide uppercase text-slate-200">
            Szacowana Kompatybilność z Systemami Rekrutacyjnymi
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {systemScores.map((sys) => (
            <div key={sys.name} className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-lg space-y-1">
              <div className="text-[11px] font-bold text-slate-300">{sys.name}</div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-extrabold font-mono text-cyan-400">{sys.score}%</span>
                {sys.score >= 80 ? (
                  <span className="text-[10px] text-emerald-400 font-medium">Wysoka</span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-medium">Średnia</span>
                )}
              </div>
              <div className="text-[9px] text-slate-400 leading-tight">{sys.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords Breakdown (Matched vs Missing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched Keywords */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Wykryte Słowa Kluczowe z Lematyzacją: {result.matchedKeywords.length}</span>
          </h3>
          {result.matchedKeywords.length === 0 ? (
            <p className="text-xs text-slate-500">Brak dopasowanych słów z ogłoszenia.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.matchedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success-50 border border-success-500/30 text-success-700 font-mono text-[11px] font-medium"
                >
                  <Check className="w-3 h-3 shrink-0" />
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Keywords */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <X className="w-4 h-4 text-rose-600" />
            <span>Brakujące Umiejętności z Ogłoszenia: {result.missingHardSkills.length}</span>
          </h3>
          {result.missingHardSkills.length === 0 ? (
            <p className="text-xs text-emerald-700 font-medium">Brak luk – 100% kluczowych umiejętności znajduje się w CV!</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.missingHardSkills.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-danger-50 border border-danger-500/30 text-danger-700 font-mono text-[11px] font-medium"
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
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
            <Target className="w-4 h-4 text-amber-600" />
            <span>Rekomendacje Optymalizacyjne Dla ATS</span>
          </h3>
          <ul className="list-disc list-inside text-xs text-amber-900 space-y-1 pl-1">
            {result.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* OCR & Date Format Check Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Formatowanie Dat Standard ATS</span>
          </h4>
          {result.badDateFormats.length === 0 ? (
            <div className="text-xs text-emerald-700 font-medium flex items-center space-x-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Wszystkie daty używają czytelnego formatu MM/YYYY.</span>
            </div>
          ) : (
            <div className="space-y-1">
              {result.badDateFormats.map((err, i) => (
                <div key={i} className="text-xs text-danger-700 bg-danger-50 p-2 rounded border border-danger-500/30 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Sprawdzanie Struktur OCR</span>
          </h4>
          {result.ocrWarnings.length === 0 && (!result.layer1Structure?.unparsableElementsWarnings || result.layer1Structure.unparsableElementsWarnings.length === 0) ? (
            <div className="text-xs text-emerald-700 font-medium flex items-center space-x-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Brak tabel, grafik, nieczytelnych fontów. 100% kompatybilności z parserami OCR.</span>
            </div>
          ) : (
            <div className="space-y-1">
              {result.ocrWarnings.map((warn, i) => (
                <div key={i} className="text-xs text-warning-700 bg-warning-50 p-2 rounded border border-warning-500/30 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
              {result.layer1Structure?.unparsableElementsWarnings.map((warn, i) => (
                <div key={`u-${i}`} className="text-xs text-danger-700 bg-danger-50 p-2 rounded border border-danger-500/30 flex items-start gap-1.5">
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

