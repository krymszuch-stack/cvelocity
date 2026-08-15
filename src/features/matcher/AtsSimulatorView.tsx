import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AtsCheckResult } from '../../types';
import { ScoreRing } from './ScoreRing';
import { GapAnalysis } from './GapAnalysis';
import { DealbreakerList } from './DealbreakerList';
import { Card } from '../../components/ui/Card';

export interface AtsSimulatorViewProps {
  result: AtsCheckResult;
  onAddToVault?: (item: string) => void;
  className?: string;
}

export const AtsSimulatorView: React.FC<AtsSimulatorViewProps> = ({
  result,
  onAddToVault,
  className = '',
}) => {
  const systemScores = [
    { name: 'Workday', score: Math.min(100, Math.round(result.overallScore * 0.92 + result.structureScore * 0.08)), desc: 'Parsowanie nagłówków i dat' },
    { name: 'Greenhouse', score: Math.min(100, Math.round((result.layer2Nlp?.hardSkillsCoverage || result.keywordCoverageScore) * 0.85 + result.formattingScore * 0.15)), desc: 'Lematyzacja słów kluczowych' },
    { name: 'Lever', score: Math.min(100, Math.round(result.keywordCoverageScore * 0.8 + result.structureScore * 0.2)), desc: 'Struktura jednokolumnowa' },
    { name: 'Taleo / Oracle', score: Math.min(100, Math.round(result.structureScore * 0.5 + result.keywordCoverageScore * 0.5)), desc: 'Tradycyjny parser korporacyjny' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink">Symulator ATS: Audyt Zgodności z Ofertą</h3>
          <p className="text-xs text-muted">
            Ocena lematyczna z uwzględnieniem wag technologii twardych (3.0x), świeżości doświadczenia oraz struktury dokumentu.
          </p>
        </div>
      </div>

      {/* 2-Column Dashboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Score Ring & Corporate Engines */}
        <div className="lg:col-span-5 space-y-4">
          <Card tone="raised" className="flex flex-col items-center justify-center text-center p-6 space-y-4">
            <ScoreRing score={result.overallScore} size={150} />

            <div className="w-full border-t border-line/60 pt-3">
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                Rozbicie Algebry Ważonej
              </span>
              <p className="font-mono text-[10px] text-subtle leading-tight">
                {result.layer3Scoring?.formulaBreakdown || 'Score = (3.0 × Hard Skills) + (1.5 × Recency) + (1.5 × Title)'}
              </p>
            </div>
          </Card>

          {/* Corporate ATS Systems Preview */}
          <Card tone="raised" className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Estymacja Kompatybilności w Systemach ATS
            </h4>

            <div className="space-y-2">
              {systemScores.map((sys) => (
                <div
                  key={sys.name}
                  className="flex items-center justify-between rounded-xl border border-line/60 bg-surface p-2.5 text-xs"
                >
                  <div>
                    <span className="font-bold text-ink">{sys.name}</span>
                    <span className="block font-mono text-[10px] text-muted">{sys.desc}</span>
                  </div>
                  <span className={`font-mono text-xs font-bold ${
                    sys.score >= 80 ? 'text-success-fg' : sys.score >= 60 ? 'text-warning-fg' : 'text-danger-fg'
                  }`}>
                    {sys.score}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Gap Analysis & Dealbreaker List */}
        <div className="lg:col-span-7 space-y-5">
          <GapAnalysis result={result} />

          <DealbreakerList
            missingItems={result.missingHardSkills || []}
            onAddToVault={onAddToVault}
          />
        </div>
      </div>

      {/* Actionable Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card tone="raised" className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning-fg" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
              Rekomendacje Optymalizacji ATS (Actionable Tips)
            </h4>
          </div>

          <div className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-line/60 bg-surface p-3 text-xs leading-relaxed text-ink"
              >
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
