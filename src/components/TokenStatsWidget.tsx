import React from 'react';
import { Cpu, DollarSign, RotateCcw, CheckCircle2, Zap } from 'lucide-react';
import { TokenStats } from '../types';
import { Modal } from './ui/Modal';
import { StatTile } from './ui/Feedback';
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
      title="Hybrid-Cache & Token Metrics"
      subtitle="Silnik optymalizacji kosztów zapytania do Google AI Studio (Gemini)"
      icon={Zap}
      size="md"
      footer={
        <div className="flex w-full justify-between items-center">
          <button
            onClick={onResetStats}
            className="flex items-center space-x-1.5 text-xs text-danger-500 font-bold hover:text-danger-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zresetuj Statystyki</span>
          </button>

          <Button
            onClick={onClose}
            variant="primary"
            size="sm"
          >
            Zamknij
          </Button>
        </div>
      }
    >
      {/* Big Counter Banner */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatTile
          icon={Cpu}
          label="Tokeny Zaoszczędzone"
          value={stats.totalTokensSaved.toLocaleString()}
          hint="Oszczędność 0-Token Slot Filling"
          accent="success"
        />
        <StatTile
          icon={DollarSign}
          label="Koszt Zredukowany $"
          value={`$${stats.estimatedCostSavedUSD.toFixed(5)}`}
          hint="Stawka Gemini 2.5 Flash API"
          accent="warning"
        />
      </div>

      {/* Ratio Progress Bar */}
      <div className="mb-6 bg-sunken p-4 rounded-lg border border-line">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-bold text-muted">Wskaźnik Wywołań Bez-Tokenowych</span>
          <span className="font-mono font-bold text-brand-fg sv-tnum">{zeroTokenPercent}%</span>
        </div>
        <div className="w-full h-3 bg-line rounded-full overflow-hidden flex">
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

        <div className="flex items-center justify-between text-[11px] text-muted font-medium mt-3 pt-2 border-t border-line">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success-500"></span>
            <span>Local Slot Filling: <span className="sv-tnum">{stats.localSlotHits}</span></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
            <span>Semantic Cache: <span className="sv-tnum">{stats.cacheHits}</span></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning-500"></span>
            <span>Gemini Delta: <span className="sv-tnum">{stats.geminiDeltaCalls}</span></span>
          </div>
        </div>
      </div>

      {/* Feature Explainer */}
      <div className="space-y-2 text-xs text-muted mb-6 bg-sunken p-3 rounded-lg border border-line">
        <div className="flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-0.5" />
          <p>
            <strong>Local Slot Filling:</strong> Podstawia synonimy i odwraca szyk zdań w przeglądarce bez odpytywania API.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
          <p>
            <strong>Semantic Cache:</strong> Pobiera wcześniej zatwierdzone bloki z lokalnej bazy przy podobieństwie &gt;0.88.
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-warning-500 shrink-0 mt-0.5" />
          <p>
            <strong>Gemini Delta Prompting:</strong> Wysyła do API wyłącznie brakujące pojedyncze frazy, oszczędzając do <span className="sv-tnum">90%</span> tokenów.
          </p>
        </div>
      </div>
    </Modal>
  );
};
