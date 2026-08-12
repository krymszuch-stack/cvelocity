import React from 'react';
import { Zap, Cpu, DollarSign, RotateCcw } from 'lucide-react';
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
  const totalHits = stats.localSlotHits + stats.cacheHits + stats.geminiDeltaCalls || 1;
  const zeroTokenHits = stats.localSlotHits + stats.cacheHits;
  const zeroTokenPercent = Math.round((zeroTokenHits / totalHits) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hybrid-Cache & Token Metrics"
      subtitle="Silnik optymalizacji kosztów zapytania do Google AI Studio (Gemini)"
      icon={Zap}
      size="md"
      footer={
        <div className="flex justify-between items-center w-full">
          <Button
            variant="danger"
            size="sm"
            icon={RotateCcw}
            onClick={onResetStats}
          >
            Zresetuj Statystyki
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Zamknij
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Big Counter Banner */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-sunken border border-line rounded-xl p-4 text-center">
            <div className="text-xs text-muted mb-1 flex items-center justify-center space-x-1 font-bold">
              <Cpu className="w-3.5 h-3.5 text-brand-fg" />
              <span>Tokeny Zaoszczędzone</span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-success-fg sv-tnum">
              {stats.totalTokensSaved.toLocaleString()}
            </div>
            <div className="text-[10px] text-subtle mt-1">Oszczędność 0-Token Slot Filling</div>
          </div>

          <div className="bg-sunken border border-line rounded-xl p-4 text-center">
            <div className="text-xs text-muted mb-1 flex items-center justify-center space-x-1 font-bold">
              <DollarSign className="w-3.5 h-3.5 text-warning-fg" />
              <span>Koszt Zredukowany $</span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-warning-fg sv-tnum">
              ${stats.estimatedCostSavedUSD.toFixed(5)}
            </div>
            <div className="text-[10px] text-subtle mt-1">Stawka Gemini 2.5 Flash API</div>
          </div>
        </div>

        {/* Ratio Progress Bar */}
        <div className="bg-sunken p-4 rounded-xl border border-line">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-bold text-ink">Wskaźnik Wywołań Bez-Tokenowych</span>
            <span className="font-mono font-bold text-brand-fg sv-tnum">{zeroTokenPercent}%</span>
          </div>
          <div className="w-full h-3 bg-line-strong rounded-full overflow-hidden flex">
            <div
              className="bg-success-500 h-full transition-all"
              style={{ width: `${(stats.localSlotHits / totalHits) * 100}%` }}
              title="Local Slot Filling"
            ></div>
            <div
              className="bg-brand-500 h-full transition-all"
              style={{ width: `${(stats.cacheHits / totalHits) * 100}%` }}
              title="Semantic Cache"
            ></div>
            <div
              className="bg-warning-500 h-full transition-all"
              style={{ width: `${(stats.geminiDeltaCalls / totalHits) * 100}%` }}
              title="Gemini Delta Calls"
            ></div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted mt-2 font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-success-500 inline-block"></span>
              <span>Local Slot: {stats.localSlotHits}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-brand-500 inline-block"></span>
              <span>Cache: {stats.cacheHits}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-warning-500 inline-block"></span>
              <span>Gemini: {stats.geminiDeltaCalls}</span>
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
