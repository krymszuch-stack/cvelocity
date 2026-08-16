import { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
}

/** How long a toast stays on screen before it starts animating out. */
const TOAST_TTL_MS = 3600;

let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/**
 * Queues a toast. Replaces browser `alert()`, which blocks the main thread and
 * cannot be styled — both fatal in a product that should feel polished.
 */
export function showToast(
  title: string,
  options: { message?: string; variant?: ToastVariant } = {}
) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  toasts = [...toasts, { id, title, message: options.message, variant: options.variant ?? 'success' }];
  emit();

  setTimeout(() => dismissToast(id), TOAST_TTL_MS);
  return id;
}

export function useToasts(): Toast[] {
  const [state, setState] = useState<Toast[]>(toasts);

  useEffect(() => {
    const listener = () => setState(toasts);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}
