import React from 'react';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  disabled = false,
  className = '',
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || unit) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-bold text-ink">{label}</span>}
          <span className="font-mono font-bold text-brand-fg">
            {value} {unit}
          </span>
        </div>
      )}

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-sunken accent-brand-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, var(--brand-600) 0%, var(--brand-600) ${percentage}%, var(--border-line) ${percentage}%, var(--border-line) 100%)`,
          }}
        />
      </div>

      <div className="flex justify-between text-[10px] font-mono text-subtle">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
};
