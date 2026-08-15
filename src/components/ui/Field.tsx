import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ElementType;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      icon: Icon,
      error,
      hint,
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-muted uppercase tracking-wider"
          >
            {label}
            {props.required && <span className="ml-1 text-danger-fg">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-muted">
              <Icon className="h-4 w-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            className={`w-full rounded-2xl border bg-sunken py-2.5 text-xs font-medium text-ink placeholder:text-subtle transition-colors focus-visible:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
              Icon ? 'pl-10 pr-3.5' : 'px-3.5'
            } ${
              error ? 'border-danger/60 focus:ring-danger/20' : 'border-line'
            } ${className}`}
            {...props}
          />
        </div>

        {error && (
          <p className="text-[11px] font-semibold text-danger-fg">{error}</p>
        )}

        {!error && hint && (
          <p className="text-[11px] text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      className = '',
      containerClassName = '',
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-muted uppercase tracking-wider"
          >
            {label}
            {props.required && <span className="ml-1 text-danger-fg">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={!!error}
          className={`w-full rounded-2xl border bg-sunken p-3 text-xs font-medium text-ink placeholder:text-subtle transition-colors focus-visible:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-danger/60 focus:ring-danger/20' : 'border-line'
          } ${className}`}
          {...props}
        />

        {error && (
          <p className="text-[11px] font-semibold text-danger-fg">{error}</p>
        )}

        {!error && hint && (
          <p className="text-[11px] text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-muted uppercase tracking-wider"
          >
            {label}
            {props.required && <span className="ml-1 text-danger-fg">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={`w-full rounded-2xl border bg-sunken py-2.5 px-3.5 text-xs font-medium text-ink transition-colors focus-visible:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-danger/60 focus:ring-danger/20' : 'border-line'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-[11px] font-semibold text-danger-fg">{error}</p>
        )}

        {!error && hint && (
          <p className="text-[11px] text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
