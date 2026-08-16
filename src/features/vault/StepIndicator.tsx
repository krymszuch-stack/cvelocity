import React from 'react';
import { LucideIcon, Check } from 'lucide-react';
import { motion } from 'motion/react';

export interface StepItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export interface StepIndicatorProps {
  steps: StepItem[];
  activeStep: number;
  onStepClick: (index: number) => void;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  activeStep,
  onStepClick,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Progress Track */}
      <div className="relative mb-6 hidden md:block">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-line" />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-brand-600 transition-all duration-500 ease-out"
          style={{
            width: `${(activeStep / (steps.length - 1)) * 100}%`,
          }}
        />

        <div className="relative z-10 flex justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(idx)}
                className="group flex flex-col items-center focus-visible:outline-none"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'border-brand-600 bg-brand-600 text-on-brand shadow-xs'
                      : isCurrent
                      ? 'border-brand-600 bg-elevated text-brand-fg ring-4 ring-brand-500/20 shadow-raised'
                      : 'border-line bg-surface text-muted group-hover:border-brand-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <div className="mt-2 text-center">
                  <span
                    className={`block font-sans text-xs font-bold transition-colors ${
                      isCurrent ? 'text-brand-fg' : 'text-muted group-hover:text-ink'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="hidden lg:block text-[10px] text-subtle">
                      {step.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Step Counter & Progress */}
      <div className="md:hidden flex items-center justify-between mb-4 rounded-xl border border-line bg-surface p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 font-mono text-xs font-bold text-brand-600">
            {activeStep + 1}
          </span>
          <span className="text-xs font-bold text-ink">{steps[activeStep].label}</span>
        </div>
        <span className="font-mono text-[11px] text-muted">
          Krok {activeStep + 1} z {steps.length}
        </span>
      </div>
    </div>
  );
};
