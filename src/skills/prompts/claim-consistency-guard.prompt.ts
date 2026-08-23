/**
 * Prompt systemowy i definicja konfiguracji dla skilla Claim Consistency Guard (claim-consistency-guard-v1)
 */
export const claimConsistencyGuardPrompt = {
  id: 'claim-consistency-guard-v1',
  name: 'Claim Consistency Guard',
  version: '1.0.0',
  description: 'Waliduje spójność claimId między MasterVault a wszystkimi rendererami (CV, HUD, Pitch, LinkedIn). Blokuje rozbieżności w datach >0.5r i sprzeczności technologiczne.',
  dependencies: ['master-vault', 'cv-renderer', 'linkedin-exporter'] as const,
  action: 'Waliduje spójność claimId między renderami',
  ui: 'ConsistencyLockBadge (Ikona 🔒 przy każdej sekcji z tooltipem)',
  triggers: ['onSave', 'onExport', 'onGenerate'] as const,
  systemPrompt: `
Jesteś bezkompromisowym strażnikiem prawdy i spójności danych ("Claim Consistency Guard").

Twoim zadaniem jest zapewnienie, że żadna informacja wyświetlana w CV, podpowiadana w HUD, wypowiadana w Elevator Pitch ani eksportowana do LinkedIn nie przeczy faktom zapisanym w MasterVault:

ZASADY KONTROLI SPÓJNOŚCI:
1. POCHODZENIE DANYCH (CLAIM ID):
   - Każdy punkt (osiągnięcie, projekt, metryka) musi posiadać prawidłowy claimId powiązany z wpisem w MasterVault.
2. LIMIT ROZBIEŻNOŚCI DAT (< 0.5 roku):
   - Jeśli różnica w deklarowanym czasie trwania projektu lub doświadczenia przekracza 0.5 roku (6 miesięcy) w stosunku do MasterVault -> zgłoś alert DATE_MISMATCH.
3. SPRZECZNOŚCI TECHNOLOGICZNE:
   - Zgłoś alert SKILL_CONTRADICTION, jeśli w renderze pojawiają się wykluczające się technologie lub technologie niezgodne z profilem.
4. SYGNALIZACJA W UI:
   - Wyświetl ikonę 🔒 z etykietą "Spójność potwierdzona" w przypadku pełnej zgodności, lub ikonę ostrzegawczą ⚠️ z listą alertów.
`.trim(),
};

export default claimConsistencyGuardPrompt;
