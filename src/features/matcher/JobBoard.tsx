import React from 'react';
import { Briefcase, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobOffer } from '../../types';
import { JobCard } from './JobCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export interface JobBoardProps {
  jobs: JobOffer[];
  isLoading?: boolean;
  onMatchJob: (job: JobOffer) => void;
  onResetFilters?: () => void;
  className?: string;
}

export const JobBoard: React.FC<JobBoardProps> = ({
  jobs,
  isLoading = false,
  onMatchJob,
  onResetFilters,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-brand-600" />
          <h3 className="font-sans text-sm font-bold text-ink">
            Dostępne Oferty Pracy ({isLoading ? '...' : jobs.length})
          </h3>
        </div>

        <span className="font-mono text-xs text-muted">
          Aktualizacja w czasie rzeczywistym
        </span>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-line bg-elevated p-5 space-y-4 shadow-raised"
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="rectangle" width={40} height={40} className="rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton variant="text" width="80%" height={16} />
                  <Skeleton variant="text" width="50%" height={12} />
                </div>
              </div>
              <Skeleton variant="rectangle" height={36} className="rounded-xl" />
              <div className="flex gap-1.5">
                <Skeleton variant="rectangle" width={60} height={22} className="rounded-lg" />
                <Skeleton variant="rectangle" width={70} height={22} className="rounded-lg" />
                <Skeleton variant="rectangle" width={50} height={22} className="rounded-lg" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-line/60">
                <Skeleton variant="rectangle" width={70} height={32} className="rounded-xl" />
                <Skeleton variant="rectangle" width={110} height={32} className="rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={Search}
          title="Brak ofert spełniających podane kryteria"
          description="Spróbuj zmienić słowa kluczowe, rozszerzyć promień dojazdu lub wyłączyć filtr pracy w 100% zdalnej."
          action={
            onResetFilters && (
              <Button variant="secondary" size="md" onClick={onResetFilters}>
                Zresetuj wszystkie filtry
              </Button>
            )
          }
        />
      ) : (
        /* Grid of Job Cards */
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onMatch={onMatchJob}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
