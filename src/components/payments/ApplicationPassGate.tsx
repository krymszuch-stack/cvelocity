import React from 'react';
import { Button } from '../ui/Button';

/**
 * Bramka funkcji dostępnej w Karnecie Aplikacyjnym.
 *
 * To czytelna informacja w interfejsie, nie granica bezpieczeństwa. Stan jest
 * odświeżany z `/api/me`, ale jego kopia do szybkiego renderu żyje także w
 * przeglądarce. Operacje generujące koszt nadal muszą sprawdzać uprawnienie na
 * backendzie; ten komponent jedynie nie pokazuje płatnego widoku przypadkiem.
 */
export interface ApplicationPassGateProps {
  hasActivePass: boolean;
  pitch: string;
  onBuyPass?: () => void;
  children: React.ReactNode;
}

export const ApplicationPassGate: React.FC<ApplicationPassGateProps> = ({
  hasActivePass,
  pitch,
  onBuyPass,
  children,
}) => {
  if (hasActivePass) return <>{children}</>;

  return (
    <section
      role="note"
      aria-label="Funkcja dostępna w Karnecie Aplikacyjnym"
      className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900/60"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F26440]">
        Karnet Aplikacyjny
      </p>
      <h2 className="mt-1.5 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
        Teleprompter Live HUD
      </h2>
      <p className="mx-auto mt-2 max-w-prose text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {pitch}
      </p>
      <p className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">
        Funkcja jest dostępna w aktywnym Karnecie Aplikacyjnym.
      </p>

      {onBuyPass && (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="primary" size="sm" onClick={onBuyPass}>
            Zobacz Karnet
          </Button>
        </div>
      )}
    </section>
  );
};
