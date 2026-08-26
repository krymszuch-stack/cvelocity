import React from 'react';
import {
  FEATURE_LABELS,
  FeatureKey,
  hasFeatureAccess,
  xpRequiredForFeature,
} from '../../lib/gamification';
import { useGamification } from '../../store/useGamificationStore';
import { Button } from '../ui/Button';

/**
 * Bramka funkcji beta — zamiast błędu 403 karta z wyjściem awaryjnym.
 *
 * Zablokowany ekran ma powiedzieć trzy rzeczy naraz: czego dotyczy, ile brakuje
 * i co zrobić teraz. Sam komunikat „brak dostępu” jest zaproszeniem do napisania
 * do supportu, a tego chcemy uniknąć.
 *
 * To warstwa interfejsu, nie kontrola dostępu (reguła 2 z `AGENTS.md`): o tym,
 * czy żądanie do modelu przejdzie, decyduje serwer. Tutaj chowamy wyłącznie
 * widok, żeby nie obiecywać czegoś, czego backend i tak nie wyda.
 */

export interface FeatureGateProps {
  feature: FeatureKey;
  /** Karnet kupiony za pieniądze przechodzi obok poziomu. */
  hasPaidPass?: boolean;
  /** Skrót, po co ta funkcja jest — jedno zdanie, językiem użytkownika. */
  pitch: string;
  /** Skok do treningu STAR: najszybsza legalna droga po punkty. */
  onTrain?: () => void;
  /** Przejście do cennika. */
  onBuyPass?: () => void;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  hasPaidPass = false,
  pitch,
  onTrain,
  onBuyPass,
  children,
}) => {
  const { xp } = useGamification();

  if (hasFeatureAccess(xp, feature, { hasPaidPass })) return <>{children}</>;

  const required = xpRequiredForFeature(feature);
  const missing = required === null ? null : Math.max(0, required - xp);

  return (
    <section
      role="note"
      aria-label={`Funkcja zablokowana: ${FEATURE_LABELS[feature]}`}
      className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900/60"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F26440]">
        Funkcja eksperymentalna
      </p>
      <h2 className="mt-1.5 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
        {FEATURE_LABELS[feature]}
      </h2>
      <p className="mx-auto mt-2 max-w-prose text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {pitch}
      </p>
      <p className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">
        {required === null
          ? 'Dostępna wyłącznie w ramach Karnetu.'
          : `Dostępna od ${required} XP lub w ramach Karnetu. Brakuje Ci ${missing} XP.`}
      </p>

      <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
        {onTrain && (
          <Button type="button" variant="secondary" size="sm" onClick={onTrain}>
            Trenuj pytania STAR (+300 XP)
          </Button>
        )}
        {onBuyPass && (
          <Button type="button" variant="primary" size="sm" onClick={onBuyPass}>
            Kup Karnet i odblokuj od razu
          </Button>
        )}
      </div>
    </section>
  );
};
