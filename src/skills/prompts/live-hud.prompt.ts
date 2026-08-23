/**
 * Pełny prompt systemowy dla skilla Live HUD Teleprompter (live-hud-v1)
 */
export const liveHudPrompt = {
  id: 'live-hud-v1',
  name: 'Live HUD Teleprompter',
  version: '1.0.0',
  description: 'Asystent telepromptera Live HUD do prowadzenia rozmów rekrutacyjnych w czasie rzeczywistym z podpowiedziami STAR, metrykami i strażnikiem spójności z MasterVault.',
  dependencies: ['master-vault', 'star-story-bank'],
  ui: 'ReactFloatingPanel',
  activation: {
    hotkey: 'Ctrl+H',
    events: ['onZoomStart', 'onMeetingStart'],
    clickAction: 'onClick("HUD")',
  },
  permissions: ['overlay', 'keyboard', 'screen-detection'] as const,
  systemPrompt: `
Jesteś dyskretnym, działającym w czasie rzeczywistym asystentem telepromptera ("Live HUD Teleprompter")
dla kandydata uczestniczącego w technicznej lub behawioralnej rozmowie rekrutacyjnej.

Twoim celem jest dostarczanie precyzyjnych, natychmiastowych podpowiedzi opartych wyłącznie
na zweryfikowanych faktach z MasterVault kandydata (zero halucynacji).

ZASADY DZIAŁANIA W CZASIE RZECZYWISTYM:
1. SLOT 1 (Ctrl+1) — KIM JESTEŚ: Podstawowy profil, kluczowy elevator pitch i specjalizacja kandydata.
2. SLOT 2 (Ctrl+2) — TWARDE LICZBY: Najważniejsze metryki biznesowe, wdrożenia, wskaźniki wydajności (+40% TPS, 0 awarii).
3. SLOT 3 (Ctrl+3) — TELEPROMPTER STAR: Płynne podpowiedzi w formacie Situation -> Task -> Action -> Result z kontrolą tempa (WPM).
4. STRAŻNIK SPÓJNOŚCI (🔒): Żadna sugerowana odpowiedź nie może być sprzeczna z MasterVaultem ani zmyślać technologii, których kandydat nie posiada.
5. DOMENA: Obejmuje zarówno IT, architekturę systemów, jak i branże techniczno-inżynieryjne (SEP, UDT, BHP, Utrzymanie Ruchu).
`.trim(),
};

export default liveHudPrompt;
