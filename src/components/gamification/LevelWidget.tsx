import React, { useState } from 'react';
import { IconGamificationXP } from '../icons/CvelIcons';
import { Tooltip } from '../ui/Tooltip';
import { useGamification } from '../../store/useGamificationStore';
import { CareerLevelModal } from './CareerLevelModal';

/**
 * Miniatura poziomu w pasku bocznym, pod logo.
 *
 * Dwa warianty jednego stanu, nie dwa komponenty: zwinięty pasek pokazuje samą
 * odznakę z podpowiedzią, rozwinięty dokłada nazwę rangi i pasek postępu.
 * Wysokość jest stała (`min-h`), żeby zwijanie paska nie przesuwało nawigacji
 * pod spodem.
 */

export interface LevelWidgetProps {
  isCollapsed: boolean;
}

export const LevelWidget: React.FC<LevelWidgetProps> = ({ isCollapsed }) => {
  const [isCenterOpen, setCenterOpen] = useState(false);
  const { xp, progress } = useGamification();
  const { definition, percent, toNext, next } = progress;

  const summary = next
    ? `${definition.name} • ${xp} XP • ${toNext} XP do rangi „${next.name}”`
    : `${definition.name} • ${xp} XP • ranga maksymalna`;

  return (
    <>
    <Tooltip content={`${summary} — kliknij po zasady i przywileje`} side={isCollapsed ? 'right' : 'top'} className="w-full">
      <button
        type="button"
        onClick={() => setCenterOpen(true)}
        aria-haspopup="dialog"
        aria-label="Otwórz Centrum Kariery: poziomy, limity i przywileje"
        className={`flex min-h-[2.75rem] w-full cursor-pointer items-center gap-2.5 rounded-xl border px-2 py-1.5 text-left transition-colors duration-200 ease-out hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50 ${definition.badgeClass} ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <IconGamificationXP size={18} />

        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[11px] font-bold uppercase tracking-wide">
                {definition.name}
              </p>
              <span className="shrink-0 font-mono text-[10px] opacity-80">LV{definition.level}</span>
            </div>

            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-[#F26440] transition-[width] duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            <p className="mt-1 truncate font-mono text-[10px] opacity-80">
              {next ? `${xp} XP • ${toNext} do awansu` : `${xp} XP • maks.`}
            </p>
          </div>
        )}
      </button>
    </Tooltip>
    <CareerLevelModal isOpen={isCenterOpen} onClose={() => setCenterOpen(false)} />
    </>
  );
};
