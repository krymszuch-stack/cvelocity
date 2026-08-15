import React from 'react';
import { motion } from 'motion/react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  barColor?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = 'h-2',
  barColor = 'bg-brand-600',
  showLabel = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs font-mono font-medium text-muted">
          <span>Postęp</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full border border-line/60 bg-sunken ${className}`}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
        />
      </div>
    </div>
  );
};
