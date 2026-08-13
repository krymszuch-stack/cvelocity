import React from 'react';
import { Zap, Cpu, DollarSign, RotateCcw, Activity, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { TokenStats } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { StatTile, Alert } from './ui/Feedback';

interface TokenStatsWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  stats: TokenStats;
  onResetStats: () => void;
  isConnected?: boolean;
}

export const TokenStatsWidget: React.FC<TokenStatsWidgetProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats,
  isConnected = true,
}) => {
  const displayStats = isConnected && stats
    ? stats
    : {
        apiPromptTokens: 0,
        apiOutputTokens: 0,
        apiTotalTokens: 0,
        geminiDeltaCalls: 0,
        apiCostUSD: 0,
        lastSyncedAt: undefined,
        providerName: stats?.providerName || 'Google Gemini',
      };

  const formattedCost = `$${(displayStats.apiCostUSD ?? 0).toFixed(6)}`;
  const formattedPrompt = (displayStats.apiPromptTokens ?? 0).toLocaleString('pl-PL');
  const formattedOutput = (displayStats.apiOutputTokens ?? 0).toLocaleString('pl-PL');
  const formattedTotal = (displayStats.apiTotalTokens ?? 0).toLocaleString('pl-PL');
  const formattedRequests = (displayStats.geminiDeltaCalls ?? 0).toLocaleString('pl-PL');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Statystyki i Zużycie Tokenów API"
      subtitle="Rzeczywiste zużycie i koszty zapytań do Google AI Studio (Gemini)"
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
        {!isConnected && (
          <Alert variant="warning" title="Brak połączenia z API">
            Nie można pobrać najnowszych statystyk z serwera. Wyświetlane są wartości zerowe.
          </Alert>
        )}

        {/* Core Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatTile
            icon={Cpu}
            label="Zużyte Tokeny (Suma)"
            value={<span className="sv-tnum">{formattedTotal}</span>}
            accent="brand"
            hint="Suma tokenów wejściowych i wyjściowych"
          />

          <StatTile
            icon={DollarSign}
            label="Rzeczywisty Koszt"
            value={<span className="sv-tnum">{formattedCost}</span>}
            accent="warning"
            hint="Szacowany koszt wg cennika Gemini 1.5/2.5 Flash"
          />
        </div>

        {/* Detailed Metrics Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-sunken border border-line rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.16em] text-subtle flex items-center justify-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-brand-fg" />
              <span>Prompt</span>
            </div>
            <div className="mt-1 font-mono font-extrabold text-ink sv-tnum text-sm">
              {formattedPrompt}
            </div>
          </div>

          <div className="bg-sunken border border-line rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.16em] text-subtle flex items-center justify-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-success-fg" />
              <span>Output</span>
            </div>
            <div className="mt-1 font-mono font-extrabold text-ink sv-tnum text-sm">
              {formattedOutput}
            </div>
          </div>

          <div className="bg-sunken border border-line rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.16em] text-subtle flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-warning-fg" />
              <span>Zapytania</span>
            </div>
            <div className="mt-1 font-mono font-extrabold text-ink sv-tnum text-sm">
              {formattedRequests}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-muted border-t border-line pt-3 gap-1">
          <div>
            Dostawca:{' '}
            <span className="font-semibold text-ink">
              {displayStats.providerName || 'Google Gemini'}
            </span>
          </div>
          <div>
            Ostatnia synchronizacja:{' '}
            <span className="font-mono font-semibold text-ink sv-tnum">
              {displayStats.lastSyncedAt
                ? new Date(displayStats.lastSyncedAt).toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
