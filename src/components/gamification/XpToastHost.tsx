import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconGamificationXP } from '../icons/CvelIcons';
import { dismissXpNotice, useXpNotices } from '../../store/useGamificationStore';

/**
 * Pływające powiadomienia o punktach i awansie.
 *
 * Osobny host od `ToastHost`, mimo podobieństwa: zwykły toast informuje
 * (zapisano, nie udało się), ten nagradza. Wspólny kontener zmusiłby jeden
 * komponent do dwóch różnych zachowań wizualnych, a i tak stoją w innych
 * rogach ekranu — nagroda przy pasku bocznym, komunikat przy treści.
 *
 * Bez dźwięku. Automatyczne odtwarzanie audio w karcie, której użytkownik
 * o to nie prosił, jest wyłączane przez przeglądarki i irytujące, gdy się uda;
 * fanfarę robi animacja i cząsteczki.
 */

const PARTICLES = [-46, -26, -8, 12, 32, 50];

export const XpToastHost: React.FC = () => {
  const notices = useXpNotices();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2"
    >
      <AnimatePresence initial={false}>
        {notices.map((notice) => (
          <motion.button
            key={notice.id}
            type="button"
            onClick={() => dismissXpNotice(notice.id)}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="pointer-events-auto relative cursor-pointer overflow-hidden rounded-2xl border border-[#F26440]/40 bg-slate-900/90 px-4 py-3 text-left shadow-[0_0_30px_rgba(242,100,64,0.25)] backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50"
          >
            {/* Cząsteczki: sześć iskier wybiegających spod odznaki. Czysty
                dekor, więc `aria-hidden` i zero wpływu na układ. */}
            <span aria-hidden className="pointer-events-none absolute inset-0">
              {PARTICLES.map((offset, index) => (
                <motion.span
                  key={offset}
                  initial={{ opacity: 0.9, x: 24, y: 18, scale: 1 }}
                  animate={{ opacity: 0, x: 24 + offset, y: -14 - index * 3, scale: 0.4 }}
                  transition={{ duration: 0.9, delay: index * 0.04, ease: 'easeOut' }}
                  className="absolute h-1 w-1 rounded-full bg-[#F26440]"
                />
              ))}
            </span>

            <div className="relative flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F26440]/15 text-[#F26440]">
                <IconGamificationXP size={20} />
              </span>

              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-[#F26440]">
                  {notice.leveledUpTo ? `LEVEL UP • ${notice.leveledUpTo.name}` : `+${notice.points} XP`}
                </p>
                <p className="truncate text-xs text-slate-300">
                  {notice.achievements.length > 0
                    ? `Osiągnięcie: ${notice.achievements.map((a) => a.name).join(', ')}`
                    : notice.label}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};
