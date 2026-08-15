import React, { useRef, useState, useCallback, memo } from 'react';
import {
  Sparkles,
  ExternalLink,
  MapPin,
  Building2,
  DollarSign,
  Briefcase,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { JobOffer } from '../../types';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';

export interface JobCardProps {
  job: JobOffer;
  onMatch: (job: JobOffer) => void;
  className?: string;
}

export const JobCard: React.FC<JobCardProps> = memo(({
  job,
  onMatch,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : 'J';

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-elevated p-5 shadow-raised transition-all duration-200 hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 ${className}`}
    >
      {/* 60fps Spotlight Radial Glow Gradient */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isHovered
            ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 80%)`
            : undefined,
        }}
      />

      {/* Top Header: Monogram, Title, Company */}
      <div className="relative z-10 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* 40px Company Monogram Container */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface font-sans text-sm font-extrabold text-ink shadow-xs transition-transform duration-200 group-hover:scale-105">
              {companyInitial}
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-sans text-sm font-bold text-ink group-hover:text-brand-fg">
                {job.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="truncate font-medium">{job.company}</span>
                {job.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] truncate">
                      <MapPin className="h-3 w-3 text-subtle" />
                      {job.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {job.portal && (
            <span className="shrink-0 rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[10px] font-bold text-muted uppercase">
              {job.portal}
            </span>
          )}
        </div>

        {/* Salary Range Box */}
        <div className="rounded-xl border border-line/60 bg-sunken p-2.5 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-ink">
              {job.salary || 'Wynagrodzenie do negocjacji'}
            </span>
            <span className="font-mono text-[10px] text-muted">
              {job.remote ? '100% Zdalnie' : 'Hybrydowo / Biuro'}
            </span>
          </div>
        </div>

        {/* Tech Stack Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {(job.techStack || job.requirements || []).slice(0, 5).map((tech, i) => (
            <Chip key={i} variant={i === 0 ? 'brand' : 'neutral'} className="text-[11px] py-0.5">
              {tech}
            </Chip>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="relative z-10 mt-5 flex items-center justify-between gap-2 border-t border-line/60 pt-3.5">
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand-300 hover:text-ink focus-visible:outline-none"
            title="Otwórz oryginalne ogłoszenie"
          >
            <span>Oferta</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <div />
        )}

        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={() => onMatch(job)}
        >
          Dopasuj CV & ATS
        </Button>
      </div>
    </motion.div>
  );
});

JobCard.displayName = 'JobCard';
