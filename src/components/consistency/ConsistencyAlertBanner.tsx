import React from 'react';
import { AlertTriangle, Clock, Zap, XCircle, Info } from 'lucide-react';
import { ConsistencyAlert } from '../../lib/consistencyGuard';
import { formatDecimalPl } from '../../lib/pluralFormat';

export interface ConsistencyAlertBannerProps {
  alerts: ConsistencyAlert[];
  onDismiss?: (alertId: string) => void;
  className?: string;
}

export const ConsistencyAlertBanner: React.FC<ConsistencyAlertBannerProps> = ({
  alerts,
  className = '',
}) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {alerts.map((alert) => {
        const isDateMismatch = alert.type === 'DATE_MISMATCH';
        const isSkillContradiction = alert.type === 'SKILL_CONTRADICTION';

        return (
          <div
            key={alert.id}
            className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft/60 p-3.5 shadow-xs transition-all animate-fadeIn"
            role="alert"
          >
            <div className="mt-0.5 shrink-0 rounded-lg bg-warning/20 p-1.5 text-warning-fg">
              {isDateMismatch && <Clock className="h-4 w-4" />}
              {isSkillContradiction && <Zap className="h-4 w-4" />}
              {!isDateMismatch && !isSkillContradiction && <AlertTriangle className="h-4 w-4" />}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span>{alert.title}</span>
                  {alert.claimId && (
                    <span className="rounded bg-sunken px-1.5 py-0.2 font-mono text-[10px] text-muted">
                      {alert.claimId}
                    </span>
                  )}
                </span>
                <span className="rounded-full bg-warning/20 px-2 py-0.5 font-mono text-[10px] font-bold text-warning-fg uppercase tracking-wider">
                  {alert.type}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-ink/90">{alert.message}</p>

              {alert.details && (
                <div className="mt-2 rounded-lg bg-surface/80 p-2 text-[11px] font-mono text-muted space-y-0.5 border border-line">
                  {alert.details.differenceYears !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Różnica w latach:</span>
                      {/* Przecinek dziesiętny (pl-PL) zamiast kropki z `toFixed`. */}
                      <span className="font-bold text-warning-fg">
                        {formatDecimalPl(alert.details.differenceYears, 2)} lat (&gt; 0,5 roku)
                      </span>
                    </div>
                  )}
                  {alert.details.sourceDurationYears !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Czas w MasterVault:</span>
                      <span>{formatDecimalPl(alert.details.sourceDurationYears, 2)} lat</span>
                    </div>
                  )}
                  {alert.details.claimedDurationYears !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Czas w projekcji:</span>
                      <span>{formatDecimalPl(alert.details.claimedDurationYears, 2)} lat</span>
                    </div>
                  )}
                  {alert.details.claimedTags && alert.details.claimedTags.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      <span className="text-subtle">Tagi:</span>
                      {alert.details.claimedTags.map((t, idx) => (
                        <span key={idx} className="rounded bg-sunken px-1 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
