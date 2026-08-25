import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /**
   * Tekst pomocniczy wiązany przez `aria-describedby` — czytniki ekranu
   * odczytają go zaraz po tytule, zanim wejdą w treść.
   */
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  className = '',
}) => {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  // Statyczne id („modal-title") kolidowałyby przy dwóch modalach naraz
  // — np. parser CV otwarty ponad modalem autoryzacji. useId daje każdej
  // instancji własną przestrzeń identyfikatorów.
  const titleId = useId();
  const descriptionId = useId();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
            className={`relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-6 text-ink shadow-floating sm:p-7 ${sizeClasses[size]} ${className}`}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
              {title ? (
                <h3
                  id={titleId}
                  className="text-base font-bold text-ink sm:text-lg"
                >
                  {title}
                </h3>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Zamknij okno dialogowe"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            {description && (
              <p id={descriptionId} className="-mt-2 mb-4 text-sm text-ink-muted">
                {description}
              </p>
            )}
            <div>{children}</div>

            {/* Optional Footer */}
            {footer && (
              <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-line pt-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
