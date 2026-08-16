import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToasts, dismissToast, ToastVariant } from '../../store/useToastStore';

const VARIANT_ICON: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  success: 'border-l-success text-success-fg',
  error: 'border-l-danger text-danger-fg',
  info: 'border-l-brand-600 text-brand-fg',
};

/**
 * Renders the toast stack. Mounted once, near the app root.
 * `role="status"` + `aria-live="polite"` so screen readers announce toasts
 * without interrupting whatever the user is doing.
 */
export const ToastHost: React.FC = () => {
  const toasts = useToasts();

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[120] flex flex-col gap-2.5"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = VARIANT_ICON[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className={`shadow-floating pointer-events-auto flex min-w-[260px] max-w-[360px] items-start gap-2.5 rounded-xl border border-line border-l-[3px] bg-elevated p-3 pr-2.5 ${VARIANT_ACCENT[toast.variant]}`}
            >
              <Icon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-[13px] font-bold text-ink">{toast.title}</p>
                {toast.message && <p className="mt-px text-xs text-muted">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Zamknij powiadomienie"
                className="rounded-md p-0.5 text-subtle transition-colors hover:bg-sunken hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
