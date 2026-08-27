import React from 'react';
import { Keyboard, Command, Sparkles } from 'lucide-react';

interface SidebarShortcutsWidgetProps {
  onTriggerPalette?: () => void;
  onTriggerAdvisor?: () => void;
  onTriggerCvPreview?: () => void;
}

/**
 * Mini-ściągawka skrótów klawiaturowych umieszczana w pasku bocznym.
 * Zwiększa efektywność pracy kandydata i promuje płynną nawigację.
 */
export const SidebarShortcutsWidget: React.FC<SidebarShortcutsWidgetProps> = ({
  onTriggerPalette,
  onTriggerAdvisor,
  onTriggerCvPreview,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      keys: [`${modKey}`, 'K'],
      label: 'Szukaj & Polecenia',
      action: onTriggerPalette || (() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))),
    },
    {
      keys: [`${modKey}`, 'P'],
      label: 'Podgląd CV',
      action: onTriggerCvPreview,
    },
  ];

  return (
    <div className="rounded-2xl border border-line/70 bg-sunken/40 p-3 space-y-2.5 transition-colors hover:border-brand-500/30">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
          <Keyboard className="h-3 w-3 text-brand-600" />
          Skróty klawiszowe
        </span>
      </div>

      <div className="space-y-1.5">
        {shortcuts.map((sc, i) => (
          <button
            key={i}
            type="button"
            onClick={sc.action}
            className="flex w-full items-center justify-between text-[11px] py-0.5 text-muted hover:text-ink transition-colors cursor-pointer group text-left"
          >
            <span className="truncate group-hover:text-brand-fg">{sc.label}</span>
            <div className="flex items-center gap-0.5 shrink-0">
              {sc.keys.map((k, idx) => (
                <kbd
                  key={idx}
                  className="rounded border border-line bg-surface px-1 py-px font-mono text-[9px] font-bold text-ink shadow-2xs"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
