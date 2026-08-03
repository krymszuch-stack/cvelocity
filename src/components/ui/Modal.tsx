import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, LucideIcon } from 'lucide-react';
import { IconButton } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[95vw]',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  size?: ModalSize;
  /** Sticky action bar pinned to the bottom of the shell. */
  footer?: React.ReactNode;
  /** Set false for flows the user must resolve explicitly (e.g. 2FA challenge). */
  dismissable?: boolean;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = 'md',
  footer,
  dismissable = true,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc to close + lock the page behind the overlay.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, dismissable]);

  // Move focus into the dialog so keyboard users don't stay stranded on the trigger.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-sm animate-fade-in"
        onClick={() => dismissable && onClose()}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${SIZES[size]} max-h-[92vh] flex flex-col
                    bg-surface border border-line rounded-2xl shadow-xl
                    animate-scale-in overflow-hidden focus:outline-none`}
      >
        {(title || dismissable) && (
          <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line shrink-0">
            <div className="flex items-start gap-3.5 min-w-0">
              {Icon && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-md shadow-brand-600/25">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                {title && <h2 className="text-lg font-bold text-ink tracking-tight leading-tight">{title}</h2>}
                {subtitle && <p className="text-xs text-muted mt-1 leading-relaxed">{subtitle}</p>}
              </div>
            </div>
            {dismissable && <IconButton icon={X} title="Zamknij" size="sm" onClick={onClose} />}
          </header>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-line bg-sunken shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};
