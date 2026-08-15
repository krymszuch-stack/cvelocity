import React from 'react';
import { LucideIcon, Check } from 'lucide-react';
import { motion } from 'motion/react';

export interface StepItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  activeStep: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  onStepClick,
  className = '',
}) => {
  const activeIndex = steps.findIndex((s) => s.id === activeStep);

  return (
    <nav aria-label="Kroki formularza" className={`w-full ${className}`}>
      <ol className="flex w-full items-center justify-between gap-2 overflow-x-auto pb-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          const isCompleted = idx < activeIndex;
          const isClickable = onStepClick !== undefined;

          return (
            <li key={step.id} className="flex flex-1 items-center gap-2 min-w-[130px]">
              <motion.button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                whileHover={isClickable ? { scale: 1.02 } : undefined}
                whileTap={isClickable ? { scale: 0.98 } : undefined}
                transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
                className={`group flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none ${
                  isActive
                    ? 'border-brand-200 bg-brand-50 text-brand-fg shadow-xs'
                    : isCompleted
                    ? 'border-line bg-elevated text-ink hover:border-brand-200'
                    : 'border-line/60 bg-sunken/60 text-muted'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Step Circle Icon */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : isCompleted
                      ? 'bg-success-soft text-success-fg border border-success/30'
                      : 'bg-surface text-subtle border border-line'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>

                {/* Step Label */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold leading-tight">
                    {step.label}
                  </div>
                  <div className="font-mono text-[10px] text-subtle">
                    Krok {idx + 1}/{steps.length}
                  </div>
                </div>
              </motion.button>

              {/* Connecting Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`hidden h-0.5 w-4 shrink-0 rounded-full lg:block ${
                    isCompleted ? 'bg-success' : 'bg-line'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
