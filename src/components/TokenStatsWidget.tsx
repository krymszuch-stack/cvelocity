import React from 'react';
import { Zap, Cpu, DollarSign, RotateCcw } from 'lucide-react';
import { TokenStats } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { StatTile } from './ui/Feedback';

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
          <StatTile
            icon={Cpu}
            label="Tokeny Zaoszczędzone"
            value={<span className="font-mono text-success-fg">{stats.totalTokensSaved.toLocaleString()}</span>}
            hint="Oszczędność 0-Token Slot Filling"
            accent="success"
          />
          <StatTile
            icon={DollarSign}
            label="Koszt Zredukowany $"
            value={<span className="font-mono text-warning-fg">${stats.estimatedCostSavedUSD.toFixed(5)}</span>}
            hint="Stawka Gemini 2.5 Flash API"
            accent="warning"
          />
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
              <span>Local Slot: <span className="sv-tnum">{stats.localSlotHits}</span></span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-brand-500 inline-block"></span>
              <span>Cache: <span className="sv-tnum">{stats.cacheHits}</span></span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-warning-500 inline-block"></span>
              <span>Gemini: <span className="sv-tnum">{stats.geminiDeltaCalls}</span></span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl border border-line bg-sunken p-3 text-[11px] text-muted">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">Prompt</div>
            <div className="mt-1 font-mono font-bold text-ink sv-tnum">{(stats.apiPromptTokens ?? 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">Output</div>
            <div className="mt-1 font-mono font-bold text-ink sv-tnum">{(stats.apiOutputTokens ?? 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">Live sync</div>
            <div className="mt-1 font-mono font-bold text-ink sv-tnum">{stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
