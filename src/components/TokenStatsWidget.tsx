import React from 'react';
import { X, Zap, Cpu, DollarSign, Database, RotateCcw, CheckCircle2 } from 'lucide-react';
import { TokenStats } from '../types';

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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 text-slate-900 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Hybrid-Cache & Token Metrics</h3>
            <p className="text-xs text-slate-500">
              Silnik optymalizacji kosztów zapytania do Google AI Studio (Gemini)
            </p>
          </div>
        </div>

        {/* Big Counter Banner */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <div className="text-xs text-slate-600 mb-1 flex items-center justify-center space-x-1 font-bold">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tokeny Zaoszczędzone</span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-600">
              {stats.totalTokensSaved.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Oszczędność 0-Token Slot Filling</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <div className="text-xs text-slate-600 mb-1 flex items-center justify-center space-x-1 font-bold">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              <span>Koszt Zredukowany $</span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-amber-700">
              ${stats.estimatedCostSavedUSD.toFixed(5)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Stawka Gemini 2.5 Flash API</div>
          </div>
        </div>

        {/* Ratio Progress Bar */}
        <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-bold text-slate-700">Wskaźnik Wywołań Bez-Tokenowych</span>
            <span className="font-mono font-bold text-indigo-600">{zeroTokenPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${(stats.localSlotHits / totalHits) * 100}%` }}
              title="Local Slot Filling"
            ></div>
            <div
              className="bg-indigo-500 h-full transition-all"
              style={{ width: `${(stats.cacheHits / totalHits) * 100}%` }}
              title="Semantic Cache"
            ></div>
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${(stats.geminiDeltaCalls / totalHits) * 100}%` }}
              title="Gemini Delta Calls"
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium mt-3 pt-2 border-t border-slate-200">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Local Slot Filling: {stats.localSlotHits}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>Semantic Cache: {stats.cacheHits}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Gemini Delta: {stats.geminiDeltaCalls}</span>
            </div>
          </div>
        </div>

        {/* Feature Explainer */}
        <div className="space-y-2 text-xs text-slate-700 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Local Slot Filling:</strong> Podstawia synonimy i odwraca szyk zdań w przeglądarce bez odpytywania API.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              <strong>Semantic Cache:</strong> Pobiera wcześniej zatwierdzone bloki z lokalnej bazy przy podobieństwie &gt;0.88.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Gemini Delta Prompting:</strong> Wysyła do API wyłącznie brakujące pojedyncze frazy, oszczędzając do 90% tokenów.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={onResetStats}
            className="flex items-center space-x-1.5 text-xs text-rose-600 font-bold hover:underline transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zresetuj Statystyki</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
