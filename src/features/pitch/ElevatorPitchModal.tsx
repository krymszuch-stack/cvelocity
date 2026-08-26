import React, { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Target,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MasterVault } from '../../types';
import {
  generateElevatorPitch,
  hasVaultEvidence,
} from '../../lib/elevatorPitchEngine';
import { EditableTextWithTimer } from '../../components/pitch/EditableTextWithTimer';

export interface ElevatorPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: MasterVault;
}

export const ElevatorPitchModal: React.FC<ElevatorPitchModalProps> = ({
  isOpen,
  onClose,
  vault,
}) => {
  const [roleOverride, setRoleOverride] = useState('');

  const pitchData = useMemo(() => {
    return generateElevatorPitch(vault, roleOverride || undefined);
  }, [vault, roleOverride]);

  // Plakietka proweniencji liczy się z danych, nie jest dekoracją.
  const verifiedFromVault = useMemo(() => hasVaultEvidence(vault), [vault]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl rounded-3xl border border-line bg-elevated shadow-floating p-6 space-y-5 my-8"
      >
        {/* Header Modala */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-on-brand shadow-raised">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink tracking-tight font-mono">
                Elevator Pitch Generator (elevator-pitch-gen-v1)
              </h3>
              <p className="text-xs text-muted">
                3 precyzyjne warianty autoprezentacji oparte na faktach z MasterVault i mierzone w czasie rzeczywistym.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted hover:bg-sunken hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Konfigurator docelowej roli */}
        <div className="rounded-2xl border border-line bg-surface p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <Target className="h-4 w-4 text-brand-600" />
            <span>Docelowe stanowisko w autoprezentacji:</span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="text"
              placeholder={vault.personalInfo?.title || 'Wpisz docelową rolę...'}
              value={roleOverride}
              onChange={(e) => setRoleOverride(e.target.value)}
              className="w-full rounded-xl border border-line bg-elevated px-3 py-1.5 font-mono text-xs text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Główny komponent z timerem i 3 wersjami pitcha */}
        <EditableTextWithTimer pitchData={pitchData} verifiedFromVault={verifiedFromVault} />
      </motion.div>
    </div>
  );
};
