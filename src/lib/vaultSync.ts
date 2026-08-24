import { MasterVault } from '../types';
import { isVaultEmpty } from './vaultCompleteness';
import { mergeImportedVault } from './vaultImportMerge';

/**
 * Rozstrzygnięcie konfliktu przy pierwszym zalogowaniu.
 *
 * Sytuacja jest nieunikniona: aplikacja działa bez konta, więc zanim ktokolwiek
 * się zaloguje, ma już w przeglądarce swoje CV. W chwili logowania istnieją
 * naraz dwie wersje — lokalna i ta, którą konto może mieć z innego urządzenia.
 *
 * **Reguła nadrzędna: nigdy nie nadpisujemy niepustej chmury pustym vaultem.**
 * To jedyny scenariusz, w którym ta funkcja mogłaby komuś skasować dorobek —
 * dlatego jest wykluczony wprost, osobnym warunkiem i osobnym testem, a nie
 * przez to, że „tak akurat wychodzi z kolejności ifów".
 *
 * Czysta funkcja: nie dotyka sieci ani schowka, więc da się ją przetestować
 * w Node bez atrapy czegokolwiek.
 */

export type VaultSyncAction =
  /** Chmura była pusta — wysyłamy to, co użytkownik zdążył zrobić lokalnie. */
  | 'wyslij-lokalny'
  /** Chmura ma treść, lokalnie pusto — po prostu ją pokazujemy. */
  | 'uzyj-chmury'
  /** Obie strony mają treść — scalamy i odsyłamy wynik. */
  | 'scal-i-wyslij'
  /** Nie ma czego przenosić. */
  | 'nic';

export interface VaultSyncResult {
  /** Vault, który ma trafić na ekran. */
  vault: MasterVault;
  action: VaultSyncAction;
  /** Czy wynik trzeba odesłać do chmury. Wyliczone tu, żeby wywołujący nie zgadywał. */
  shouldUpload: boolean;
}

/**
 * `local` jest wymagany, a nie `MasterVault | null`, bo w tej aplikacji zawsze
 * istnieje: `App.tsx` trzyma go w `useState<MasterVault>` i przy braku danych
 * podstawia `createEmptyVault()`. Wymuszenie tego w typie usuwa z tej funkcji
 * ścieżkę „obie strony puste", której i tak nie da się sensownie obsłużyć.
 *
 * `cloud` bywa `null`, gdy konto jest świeże albo gdy odczyt się nie powiódł —
 * i to drugie jest powodem, dla którego brak chmury **nigdy** nie kasuje
 * lokalnej pracy, tylko ją wysyła.
 */
export function resolveVaultOnSignIn(
  local: MasterVault,
  cloud: MasterVault | null
): VaultSyncResult {
  const lokalnyPusty = isVaultEmpty(local);
  const chmuraPusta = !cloud || isVaultEmpty(cloud);

  // Obie strony puste — nowe konto i nic wcześniej nie zrobiono.
  if (lokalnyPusty && chmuraPusta) {
    return { vault: cloud ?? local, action: 'nic', shouldUpload: false };
  }

  // Chmura ma treść, lokalnie pusto. Świeża przeglądarka, konto ze stażem.
  if (lokalnyPusty && !chmuraPusta) {
    return { vault: cloud!, action: 'uzyj-chmury', shouldUpload: false };
  }

  // Lokalnie jest praca, w chmurze nie ma nic. To jest migracja dotychczasowej
  // pracy na konto — najczęstszy przypadek przy pierwszym logowaniu.
  if (!lokalnyPusty && chmuraPusta) {
    return { vault: local, action: 'wyslij-lokalny', shouldUpload: true };
  }

  // Obie strony mają treść. Scalamy istniejącym mechanizmem zamiast pisać drugi
  // (reguła 3): `mergeImportedVault` dokłada wpisy i deduplikuje po kluczu
  // złożonym, więc nic nie ginie. Chmura jest podstawą, bo zawiera też pracę
  // z innych urządzeń; `personalInfo` wygrywa lokalne, bo to je użytkownik
  // widział na ekranie przed chwilą.
  return {
    vault: mergeImportedVault(cloud!, local),
    action: 'scal-i-wyslij',
    shouldUpload: true,
  };
}
