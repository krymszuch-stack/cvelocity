import React, { useId } from 'react';
import { LucideIcon } from 'lucide-react';

const CONTROL_BASE =
  'w-full bg-surface text-ink placeholder:text-subtle border border-line rounded-[10px] ' +
  'transition-all duration-150 hover:border-line-strong ' +
  'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 focus:outline-none ' +
  'disabled:opacity-50 disabled:bg-sunken disabled:cursor-not-allowed';

interface LabelWrapProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/** Shared label/hint/error scaffold so every control lines up identically. */
export const FieldWrap: React.FC<LabelWrapProps> = ({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className = '',
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label htmlFor={htmlFor} className="text-xs font-semibold text-muted flex items-center gap-1">
        {label}
        {required && <span className="text-danger-500">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs text-danger-fg font-medium">{error}</p>
    ) : (
      hint && <p className="text-xs text-subtle leading-relaxed">{hint}</p>
    )}
  </div>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  suffix?: React.ReactNode;
  wrapClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  icon: Icon,
  suffix,
  className = '',
  wrapClassName = '',
  id,
  ...rest
}) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={rest.required}
      htmlFor={fieldId}
      className={wrapClassName}
    >
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-3 w-4 h-4 text-subtle pointer-events-none" />}
        <input
          id={fieldId}
          className={[
            CONTROL_BASE,
            'h-10 text-sm',
            Icon ? 'pl-9' : 'pl-3',
            suffix ? 'pr-10' : 'pr-3',
            error ? 'border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/12' : '',
            className,
          ].join(' ')}
          {...rest}
        />
        {suffix && <div className="absolute right-2 flex items-center">{suffix}</div>}
      </div>
    </FieldWrap>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  hint,
  error,
  className = '',
  wrapClassName = '',
  id,
  ...rest
}) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={rest.required}
      htmlFor={fieldId}
      className={wrapClassName}
    >
      <textarea
        id={fieldId}
        className={[
          CONTROL_BASE,
          'px-3 py-2.5 text-sm leading-relaxed resize-y min-h-[90px]',
          error ? 'border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/12' : '',
          className,
        ].join(' ')}
        {...rest}
      />
    </FieldWrap>
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  hint,
  error,
  className = '',
  wrapClassName = '',
  id,
  children,
  ...rest
}) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={rest.required}
      htmlFor={fieldId}
      className={wrapClassName}
    >
      <select
        id={fieldId}
        className={[CONTROL_BASE, 'h-10 px-3 text-sm cursor-pointer', className].join(' ')}
        {...rest}
      >
        {children}
      </select>
    </FieldWrap>
  );
};

/** Accessible switch — the label is clickable and the control is a real checkbox. */
export const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, description, disabled }) => (
  <label
    className={`flex items-start gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer group'}`}
  >
    <span className="relative inline-flex shrink-0 mt-0.5">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className="w-10 h-[22px] rounded-full bg-line-strong peer-checked:bg-brand-600 transition-colors duration-200
                   peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/25"
      />
      <span
        className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-surface shadow-sm
                   transition-transform duration-200 peer-checked:translate-x-[18px]"
      />
    </span>
    {(label || description) && (
      <span className="min-w-0">
        {label && <span className="block text-sm font-semibold text-ink leading-tight">{label}</span>}
        {description && <span className="block text-xs text-muted mt-0.5 leading-relaxed">{description}</span>}
      </span>
    )}
  </label>
);
