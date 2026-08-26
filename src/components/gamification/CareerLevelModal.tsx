import React from 'react';
import { Modal } from '../ui/Modal';
import {
  FEATURE_LABELS,
  LEVELS,
  LEVEL_PRIVILEGES,
  privilegesForLevel,
} from '../../lib/gamification';
import { useGamification } from '../../store/useGamificationStore';
import { DAILY_EVENT_LIMITS } from '../../lib/xpGuard';

/**
 * Centrum Kariery OS — jedyny ekran, na którym widać całą ekonomię punktów.
 *
 * Powstał jako narzędzie odciążające zgłoszenia, nie jako gablota: trzy pytania,
 * które trafiały do supportu najczęściej („czemu nie dostałem punktów”, „czy
 * punkty przepadają”, „skąd mam wiedzieć, ile mi brakuje”), mają tu odpowiedź
 * widoczną bez klikania i bez czytania regulaminu.
 *
 * Świadomie nie pokazujemy tu kodu rabatowego. Kod, którego kasa nie zna, jest
 * daną wymyśloną (reguła 1 z `AGENTS.md`) i wygenerowałby dokładnie te
 * zgłoszenia, których ten ekran ma nie dopuścić. Zniżka jest opisana jako
 * przywilej poziomu, a nalicza się przy zakupie.
 */

export interface CareerLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAILY_RULES: Array<{ label: string; limit: number }> = [
  { label: 'Wczytane ogłoszenia (min. 200 znaków treści)', limit: DAILY_EVENT_LIMITS.jd_ingested },
  { label: 'Domknięte historie STAR (min. 45 s próby)', limit: DAILY_EVENT_LIMITS.star_completed },
  { label: 'Potwierdzone wysyłki aplikacji', limit: DAILY_EVENT_LIMITS.application_added },
  { label: 'Zgłoszone widełki z ogłoszeń', limit: DAILY_EVENT_LIMITS.salary_reported },
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'Dlaczego nie dostałem punktów?',
    answer:
      'Trzy możliwe powody, wszystkie widoczne w powiadomieniu: to samo zadanie już było punktowane, wyczerpał się limit dobowy albo akcji zabrakło dowodu pracy (za krótka treść, za krótka próba STAR, niepoprawne widełki).',
  },
  {
    question: 'Czy punkty przepadają?',
    answer:
      'Nie. Suma XP i zdobyte poziomy zostają na stałe. Resetuje się wyłącznie licznik dobowy — o północy według czasu Twojego urządzenia.',
  },
  {
    question: 'Po co limit 800 XP na dobę?',
    answer:
      'Żeby poziom coś znaczył. Bez sufitu skrypt wklejający ogłoszenia w pętli dobiłby do rangi VIP w kwadrans, a przywileje przestałyby odróżniać kogokolwiek.',
  },
  {
    question: 'Nie chcę zbierać punktów — da się inaczej?',
    answer:
      'Tak. Karnet odblokowuje funkcje beta od razu, niezależnie od poziomu. Punkty są drogą dla tych, którzy wolą poświęcić czas niż pieniądze.',
  },
];

export const CareerLevelModal: React.FC<CareerLevelModalProps> = ({ isOpen, onClose }) => {
  const { xp, progress, daily } = useGamification();
  const current = progress.definition;
  const dailyPercent = Math.min(100, Math.round((daily.used / daily.cap) * 100));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kariera OS — poziomy i przywileje"
      description="Twój postęp, dobowy licznik punktów i zasady ich przyznawania."
      size="lg"
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
              {current.name} • {xp} XP
            </p>
            <p className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {progress.next
                ? `${progress.toNext} XP do rangi „${progress.next.name}”`
                : 'Ranga maksymalna'}
            </p>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Dziś zdobyto
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">
                {daily.used} / {daily.cap} XP
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={daily.used}
              aria-valuemin={0}
              aria-valuemax={daily.cap}
              aria-label="Dobowy limit punktów"
              className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            >
              <div
                className="h-full rounded-full bg-[#F26440] transition-[width] duration-200 ease-out"
                style={{ width: `${dailyPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Licznik zeruje się o północy. Powyżej limitu akcje nadal się zapisują — po prostu bez
              punktów.
            </p>
          </div>
        </section>

        <section>
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ścieżka rang
          </h3>
          <ol className="mt-2 space-y-2">
            {LEVELS.map((level) => {
              const privileges = privilegesForLevel(level.level);
              const reached = xp >= level.from;
              return (
                <li
                  key={level.level}
                  className={`rounded-xl border p-3 transition-colors duration-200 ease-out ${
                    reached
                      ? 'border-[#F26440]/40 bg-[#F26440]/5'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {level.level}. {level.name}
                    </p>
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {level.from} XP {reached ? '• zdobyte' : '• zablokowane'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {privileges.perk}
                  </p>
                  {privileges.discountPercent !== null && (
                    <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F26440]">
                      Zniżka −{privileges.discountPercent}% nalicza się w kasie
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Odblokowane funkcje
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {LEVEL_PRIVILEGES[LEVEL_PRIVILEGES.length - 1].features.map((feature) => {
              const owned = privilegesForLevel(current.level).features.includes(feature);
              return (
                <li
                  key={feature}
                  className={`rounded-xl border px-3 py-1.5 font-mono text-[11px] font-bold ${
                    owned
                      ? 'border-[#F26440] bg-[#F26440]/10 text-[#F26440]'
                      : 'border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
                  }`}
                >
                  {owned ? '✓ ' : '🔒 '}
                  {FEATURE_LABELS[feature]}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ile można zdobyć dziennie
          </h3>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {DAILY_RULES.map((rule) => (
              <li
                key={rule.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300"
              >
                <span className="min-w-0 truncate">{rule.label}</span>
                <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100">
                  {rule.limit}×
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Jak działają punkty?
          </h3>
          <div className="mt-2 space-y-2">
            {FAQ.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
              >
                <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50 dark:text-slate-100">
                  {item.question}
                </summary>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
};
