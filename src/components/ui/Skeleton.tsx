import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'card' | 'rectangle';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'card':
        return 'rounded-3xl h-36 w-full';
      case 'rectangle':
        return 'rounded-2xl h-10 w-full';
      case 'text':
      default:
        return 'rounded-lg h-4 w-full';
    }
  };

  const elements = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="space-y-2 w-full" aria-busy="true" aria-live="polite">
      {elements.map((idx) => (
        <div
          key={idx}
          className={`animate-shimmer border border-line/40 ${getVariantStyles()} ${className}`}
          style={{
            width: width,
            height: height,
          }}
        />
      ))}
    </div>
  );
};
