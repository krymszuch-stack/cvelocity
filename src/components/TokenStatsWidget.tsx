import React from 'react';
import { Zap, Cpu, DollarSign, RotateCcw, CheckCircle2, Layers } from 'lucide-react';
import { TokenStats } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface TokenStatsWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  stats: TokenStats;
  onResetStats: () => void;
}

export const TokenStatsWidget: React.FC<TokenStatsWidgetProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats,
}) => {
  if (!isOpen) return null;

  const totalHits = stats.localSlotHits + stats.cacheHits + stats.geminiDeltaCalls || 1;
  const zeroTokenHits = stats.localSlotHits + stats.cacheHits;
  const zeroTokenPercent = Math.round((zeroTokenHits / totalHits) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Analityka Zużycia Tokenów AI"
      size="md"
    >
      <div className="space-y-6">
        {/* Subtitle description */}
        <p className="text-xs text-muted">
          Silnik optymalizacji kosztów CVELOCITY wykorzystuje lokalne dopasowywanie (Slot Filling) oraz pamięć podręczną, redukując zapytania do Gemini API.
        </p>

        {/* Big Counter Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-line bg-surface p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-bold text-muted">
              <Cpu className="h-3.5 w-3.5 text-brand-600" />
              <span>Zaoszczędzone Tokeny</span>
            </div>
            <div className="font-mono text-2xl font-black text-success-fg">
              {stats.totalTokensSaved.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-subtle">0-Token Slot Filling</div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-xs font-bold text-muted">
              <DollarSign className="h-3.5 w-3.5 text-warning-fg" />
              <span>Zredukowany Koszt</span>
            </div>
            <div className="font-mono text-2xl font-black text-warning-fg">
              ${stats.estimatedCostSavedUSD.toFixed(5)}
            </div>
            <div className="mt-1 text-[10px] text-subtle">Stawka Gemini 2.5 Flash</div>
          </div>
        </div>

        {/* Ratio Progress Bar */}
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-bold text-ink">Wskaźnik Wywołań Bez-Tokenowych</span>
            <span className="font-mono font-bold text-brand-fg">{zeroTokenPercent}%</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full bg-success transition-all duration-300"
              style={{ width: `${(stats.localSlotHits / totalHits) * 100}%` }}
              title={`Lokalny Slot-Filling: ${stats.localSlotHits}`}
            />
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${(stats.cacheHits / totalHits) * 100}%` }}
              title={`Pamięć Semantyczna: ${stats.cacheHits}`}
            />
            <div
              className="h-full bg-warning transition-all duration-300"
              style={{ width: `${(stats.geminiDeltaCalls / totalHits) * 100}%` }}
              title={`Gemini Delta API: ${stats.geminiDeltaCalls}`}
            />
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="space-y-2 rounded-2xl border border-line bg-surface p-4 text-xs font-mono">
          <div className="flex justify-between border-b border-line pb-1.5 font-bold text-ink">
            <span>Metoda Optymalizacji</span>
            <span>Trafienia</span>
          </div>
          <div className="flex justify-between text-slate-700 dark:text-slate-300">
            <span>1. Lokalne Wypełnianie Slotów (0 tok.)</span>
            <span className="font-bold text-success-fg">{stats.localSlotHits}</span>
          </div>
          <div className="flex justify-between text-slate-700 dark:text-slate-300">
            <span>2. Pamięć Podręczna Cache (0 tok.)</span>
            <span className="font-bold text-brand-fg">{stats.cacheHits}</span>
          </div>
          <div className="flex justify-between text-slate-700 dark:text-slate-300">
            <span>3. Zapytania Gemini Delta API</span>
            <span className="font-bold text-warning-fg">{stats.geminiDeltaCalls}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={onResetStats}
            title="Zresetuj licznik statystyk"
          >
            Zresetuj Licznik
          </Button>

          <Button variant="secondary" size="md" onClick={onClose}>
            Zamknij
          </Button>
        </div>
      </div>
    </Modal>
  );
};
