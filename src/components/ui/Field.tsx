import React, { useId } from 'react';

/**
 * Wspólny szkielet pól formularza: etykieta + kontrolka + komunikaty.
 *
 * Kontrakt dostępności (wcześniej rozjechany między Input/Textarea/Select):
 * - id pola pochodzi z useId, nie z nazwy etykiety — dwa pola „Firma" na jednym
 *   ekranie generowały identyczne id i label wskazywał na losowy z nich;
 * - error/hint mają własne id i są wiązane aria-describedby — czytnik ekranu
 *   odczytuje błąd razem z polem, nie dopiero po tabnięciu dalej;
 * - error dostaje role="alert", więc ogłasza się też wtedy, gdy pojawił się
 *   bez przenoszenia fokusu.
 */

interface FieldChromeProps {
  inputId: string;
  messageId?: string;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

function FieldChrome({ inputId, messageId, label, required, error, hint }: FieldChromeProps) {
  return (
    <>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-muted uppercase tracking-wider"
        >
          {label}
          {required && <span className="ml-1 text-danger-fg">*</span>}
        </label>
      )}

      {error && (
        <p id={messageId} role="alert" className="text-[11px] font-semibold text-danger-fg">
          {error}
        </p>
      )}

      {!error && hint && (
        <p id={messageId} className="text-[11px] text-muted">
          {hint}
        </p>
      )}
    </>
  );
}

const CONTROL_BASE =
  'w-full rounded-xl border bg-sunken text-xs font-medium text-ink placeholder:text-subtle transition-colors focus-visible:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50';

function controlBorder(error?: string): string {
  return error ? 'border-danger/60 focus:ring-danger/20' : 'border-line';
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ElementType;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, hint, className = '', containerClassName = '', id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = useId();
    const describedBy = error || hint ? messageId : undefined;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        <FieldChrome
          inputId={inputId}
          messageId={messageId}
          label={label}
          required={props.required}
          error={error}
          hint={hint}
        />

        <div className="relative flex items-center">
          {Icon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-muted">
              <Icon className="h-4 w-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy}
            className={`${CONTROL_BASE} py-2.5 ${
              Icon ? 'pl-10 pr-3.5' : 'px-3.5'
            } ${controlBorder(error)} ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', containerClassName = '', id, rows = 4, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = useId();
    const describedBy = error || hint ? messageId : undefined;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        <FieldChrome
          inputId={inputId}
          messageId={messageId}
          label={label}
          required={props.required}
          error={error}
          hint={hint}
        />

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={`${CONTROL_BASE} p-3 ${controlBorder(error)} ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = '', containerClassName = '', id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = useId();
    const describedBy = error || hint ? messageId : undefined;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        <FieldChrome
          inputId={inputId}
          messageId={messageId}
          label={label}
          required={props.required}
          error={error}
          hint={hint}
        />

        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={`${CONTROL_BASE} py-2.5 px-3.5 ${controlBorder(error)} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
