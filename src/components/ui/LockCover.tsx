import React from 'react';
import { Lock } from 'lucide-react';

export interface LockCoverProps {
  /**
   * `data` blurs hard (3px) — for content the user is paying to read, where the
   * shape stays visible but the values do not.
   * `cosmetic` blurs barely (1px) — for things like template previews that should
   * stay readable, since the user is buying the ability to use them, not to see them.
   */
  intensity?: 'data' | 'cosmetic';
  label?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps gated content and veils it in place. The content underneath renders
 * normally — a backdrop blur is what obscures it — so the user can see the shape of
 * what they would get instead of being shown an empty box.
 *
 * This is presentation only. Access must always be enforced server-side; anything
 * hidden purely by this component is still in the DOM.
 */
export const LockCover: React.FC<LockCoverProps> = ({
  intensity = 'data',
  label,
  action,
  children,
  className = '',
}) => {
  const isData = intensity === 'data';

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${isData ? 'border border-dashed border-line-strong' : ''} ${className}`}
    >
      <div aria-hidden="true">{children}</div>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl text-center"
        style={{
          backdropFilter: isData ? 'blur(3px)' : 'blur(1px)',
          background: isData
            ? 'color-mix(in srgb, var(--elevated) 72%, transparent)'
            : 'color-mix(in srgb, var(--surface) 55%, transparent)',
        }}
      >
        {isData ? (
          <>
            <Lock className="h-[22px] w-[22px] text-muted" aria-hidden="true" />
            {label && <p className="max-w-[26ch] px-3 text-xs text-muted">{label}</p>}
            {action}
          </>
        ) : (
          <span className="shadow-raised flex h-[30px] w-[30px] items-center justify-center rounded-full border border-line bg-elevated text-muted">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
};
