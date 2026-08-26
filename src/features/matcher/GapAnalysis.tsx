import React from 'react';
import { AtsCheckResult } from '../../types';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';

export interface GapAnalysisProps {
  result: AtsCheckResult;
  className?: string;
}

/**
 * Jeden wiersz analizy luk. `value === undefined` znaczy „ta warstwa nie
 * przeliczyła się dla tej oferty" i pokazujemy brak danych, a nie liczbę.
 * Wcześniej w tym miejscu stały stałe 75/80/85/70 — użytkownik widział konkretne
 * procenty, których nikt nie policzył (reguła 1).
 */
const GapRow: React.FC<{ label: string; value?: number }> = ({ label, value }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs font-semibold">
      <span className="text-ink">{label}</span>
      {value === undefined ? (
        <span className="font-mono text-muted">brak danych</span>
      ) : (
        <span className="font-mono font-bold text-ink">{value}%</span>
      )}
    </div>
    {value !== undefined && (
      <ProgressBar
        value={value}
        max={100}
        showLabel={false}
        barColor={
          value >= 80 ? 'bg-success' : value >= 60 ? 'bg-warning' : 'bg-danger'
        }
      />
    )}
  </div>
);

export const GapAnalysis: React.FC<GapAnalysisProps> = ({
  result,
  className = '',
}) => {
  // Pokrycie twardej wiedzy ma dwa źródła: warstwę NLP albo mierzalne
  // pokrycie słów kluczowych z szybkiego sprawdzenia. Gdy nie ma żadnego,
  // zostaje undefined — nie wymyślamy liczby.
  const hardCoverage =
    result.layer2Nlp?.hardSkillsCoverage ?? result.keywordCoverageScore;

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
          Analiza Luk Kompetencyjnych (Gap Analysis)
        </h4>
        <p className="text-[11px] text-subtle">
          Rozkład wag składowych według algebry scoringowej ATS. Wiersze oznaczone
          „brak danych" nie zostały policzone dla tej oferty.
        </p>
      </div>

      <div className="space-y-3.5 rounded-2xl border border-line bg-surface p-4">
        <GapRow
          label="Kompetencje Twarde & Technologie"
          value={hardCoverage}
        />
        <GapRow
          label="Wymogi Formalne & Wykształcenie"
          value={result.layer2Nlp?.formalReqsCoverage}
        />
        <GapRow
          label="Świeżość Umiejętności (Recency Bias)"
          value={result.layer3Scoring?.recencyScore}
        />
        <GapRow
          label="Dopasowanie Tytułu Stanowiska (Title Density)"
          value={result.layer3Scoring?.titleMatchScore}
        />
      </div>
    </div>
  );
};
