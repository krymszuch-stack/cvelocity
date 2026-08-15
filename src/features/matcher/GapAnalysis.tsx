import React from 'react';
import { AtsCheckResult } from '../../types';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';

export interface GapAnalysisProps {
  result: AtsCheckResult;
  className?: string;
}

export const GapAnalysis: React.FC<GapAnalysisProps> = ({
  result,
  className = '',
}) => {
  const hardCoverage = result.layer2Nlp?.hardSkillsCoverage ?? result.keywordCoverageScore ?? 75;
  const formalCoverage = result.layer2Nlp?.formalReqsCoverage ?? 80;
  const recencyScore = result.layer3Scoring?.recencyScore ?? 85;
  const titleMatch = result.layer3Scoring?.titleMatchScore ?? 70;

  const getBarColor = (val: number) => {
    if (val >= 80) return 'bg-success';
    if (val >= 60) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
          Analiza Luk Kompetencyjnych (Gap Analysis)
        </h4>
        <p className="text-[11px] text-subtle">
          Rozkład wag składowych według algebry scoringowej ATS.
        </p>
      </div>

      <div className="space-y-3.5 rounded-2xl border border-line bg-surface p-4">
        {/* Hard Skills */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-ink">Kompetencje Twarde & Technologie (Waga 3.0x)</span>
            <span className="font-mono font-bold text-ink">{hardCoverage}%</span>
          </div>
          <ProgressBar
            value={hardCoverage}
            max={100}
            showLabel={false}
            barColor={getBarColor(hardCoverage)}
          />
        </div>

        {/* Formal Reqs */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-ink">Wymogi Formalne & Wykształcenie</span>
            <span className="font-mono font-bold text-ink">{formalCoverage}%</span>
          </div>
          <ProgressBar
            value={formalCoverage}
            max={100}
            showLabel={false}
            barColor={getBarColor(formalCoverage)}
          />
        </div>

        {/* Recency */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-ink">Świeżość Umiejętności (Recency Bias)</span>
            <span className="font-mono font-bold text-ink">{recencyScore}%</span>
          </div>
          <ProgressBar
            value={recencyScore}
            max={100}
            showLabel={false}
            barColor={getBarColor(recencyScore)}
          />
        </div>

        {/* Job Title Match */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-ink">Dopasowanie Tytułu Stanowiska (Title Density)</span>
            <span className="font-mono font-bold text-ink">{titleMatch}%</span>
          </div>
          <ProgressBar
            value={titleMatch}
            max={100}
            showLabel={false}
            barColor={getBarColor(titleMatch)}
          />
        </div>
      </div>
    </div>
  );
};
