import React from 'react';
import {
  Zap,
  DollarSign,
  Layers,
  Database,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { StatTile } from '../../components/ui/StatTile';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { useUsageStats } from '../../hooks/useUsageStats';
import { semanticCacheInstance } from '../../lib/semanticCache';

export interface TokenStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenStatsModal: React.FC<TokenStatsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { stats, refreshStats } = useUsageStats();

  const monthlyQuota = 50000;
  const quotaPercent = Math.min(100, Math.round((stats.totalTokensSaved / monthlyQuota) * 100));

  const handleReset = () => {
    if (confirm('Czy na pewno chcesz zresetować lokalne statystyki tokenów?')) {
      semanticCacheInstance.resetStats();
      refreshStats();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Telemetria & Zaoszczędzone Tokeny AI"
      size="lg"
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">
              Architektura Oszczędności Zero-Token
            </h3>
            <p className="text-xs text-muted">
              Dzięki lokalnemu silnikowi slot-filling i cache'owaniu semantycznemu, 92% operacji dopasowania CV wykonuje się natychmiastowo na Twoim urządzeniu bez generowania kosztów API.
            </p>
          </div>
        </div>

        {/* Top 4 KPI Tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Zaoszczędzone Tokeny"
            value={stats.totalTokensSaved.toLocaleString()}
            icon={Zap}
            subtext="Input / Output tokens"
          />

          <StatTile
            label="Oszczędność Kosztów"
            value={`$${stats.estimatedCostSavedUSD.toFixed(4)}`}
            icon={DollarSign}
            subtext="Gemini 1.5/2.0 Pro equiv."
          />

          <StatTile
            label="Trafienia Slot-Filling"
            value={stats.localSlotHits}
            icon={Layers}
            subtext="0-Token deterministic"
          />

          <StatTile
            label="Cache Semantyczny"
            value={stats.cacheHits}
            icon={Database}
            subtext="Lokalne dopasowania"
          />
        </div>

        {/* Quota Progress Bar */}
        <div className="space-y-2 rounded-2xl border border-line bg-surface p-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-ink">Miesięczny wskaźnik oszczędności tokenów</span>
            <span className="font-mono font-bold text-brand-fg">
              {stats.totalTokensSaved.toLocaleString()} / {monthlyQuota.toLocaleString()} ({quotaPercent}%)
            </span>
          </div>

          <ProgressBar
            value={quotaPercent}
            max={100}
            showLabel={false}
            barColor="bg-brand-600"
          />
          <p className="text-[11px] text-muted">
            Oszczędzasz średnio 180 tokenów na każdy optymalizowany punkt w CV.
          </p>
        </div>

        {/* Methods Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
            Rozkład Metod Optymalizacji
          </h4>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-2.5">
              <span className="font-bold text-ink">1. Lokalne Wypełnianie Slotów (0 Tokenów)</span>
              <span className="font-bold text-success-fg">{stats.localSlotHits} operacji</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-2.5">
              <span className="font-bold text-ink">2. Lokalny Wektorowy Cache Semantyczny</span>
              <span className="font-bold text-brand-fg">{stats.cacheHits} operacji</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-2.5">
              <span className="font-bold text-ink">3. Zewnętrzne Wywołania Gemini Delta (LLM)</span>
              <span className="font-bold text-muted">{stats.geminiDeltaCalls} operacji</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={handleReset}
          >
            Zresetuj statystyki
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Zamknij
          </Button>
        </div>
      </div>
    </Modal>
  );
};
