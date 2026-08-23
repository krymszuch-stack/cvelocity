import claimConsistencyGuardPrompt from './prompts/claim-consistency-guard.prompt';
import { AntigravitySkill, createSkillFromPrompt, ag } from './liveHudSkill';
import { MasterVault } from '../types';
import {
  validateConsistency,
  renderCvFromClaims,
  renderHudFromClaims,
  renderPitchFromClaims,
  renderLinkedInFromClaims,
} from '../lib/consistencyGuard';

export const ClaimConsistencyGuard: AntigravitySkill = createSkillFromPrompt({
  id: claimConsistencyGuardPrompt.id,
  name: claimConsistencyGuardPrompt.name,
  version: claimConsistencyGuardPrompt.version,
  description: claimConsistencyGuardPrompt.description,
  dependencies: [...claimConsistencyGuardPrompt.dependencies],
  ui: 'ConsistencyLockBadge',
  activation: {
    hotkey: 'Ctrl+G',
    events: [...claimConsistencyGuardPrompt.triggers],
    clickAction: 'onClick("ConsistencyLockBadge")',
  },
  permissions: ['storage', 'overlay'],
  systemPrompt: claimConsistencyGuardPrompt.systemPrompt,
});

// Rejestracja skilla w rejestrze ag
ag.registerSkill(ClaimConsistencyGuard);

// Nasłuchiwanie przed generowaniem CV
ag.listen('before-generate-cv', () => ag.invokeSkill('claim-consistency-guard-v1'));

// Nasłuchiwanie wyzwalaczy: onSave, onExport, onGenerate
ag.listen('onSave', (data: unknown) => {
  if (data && typeof data === 'object' && 'vault' in data) {
    const vault = (data as { vault: MasterVault }).vault;
    invokeClaimConsistencyGuard({ action: 'validate', vault });
  }
});

ag.listen('onExport', (data: unknown) => {
  if (data && typeof data === 'object' && 'vault' in data) {
    const vault = (data as { vault: MasterVault }).vault;
    invokeClaimConsistencyGuard({ action: 'validate', vault });
  }
});

ag.listen('onGenerate', (data: unknown) => {
  if (data && typeof data === 'object' && 'vault' in data) {
    const vault = (data as { vault: MasterVault }).vault;
    invokeClaimConsistencyGuard({ action: 'validate', vault });
  }
});

export interface ConsistencyInvocationPayload {
  action?: 'validate' | 'renderCv' | 'renderHud' | 'renderPitch' | 'renderLinkedIn';
  vault?: MasterVault;
  claimIds?: string[];
}

/**
 * Wywołanie skilla Claim Consistency Guard
 */
export function invokeClaimConsistencyGuard(
  payload?: ConsistencyInvocationPayload
): unknown {
  if (!payload || !payload.vault) {
    return { isConsistent: true, alerts: [] };
  }

  const { vault, action = 'validate', claimIds = [] } = payload;

  switch (action) {
    case 'validate':
      return validateConsistency(vault, {
        claimIdsToCheck: claimIds.length > 0 ? claimIds : undefined,
      });

    case 'renderCv':
      return renderCvFromClaims(vault, claimIds);

    case 'renderHud':
      return renderHudFromClaims(vault, claimIds);

    case 'renderPitch':
      return renderPitchFromClaims(vault, claimIds);

    case 'renderLinkedIn':
      return renderLinkedInFromClaims(vault, claimIds);

    default:
      return validateConsistency(vault, {
        claimIdsToCheck: claimIds.length > 0 ? claimIds : undefined,
      });
  }
}
