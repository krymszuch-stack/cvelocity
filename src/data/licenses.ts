/**
 * Uprawnienia formalne — jedno źródło prawdy.
 *
 * Ta lista była wcześniej stałą lokalną w `LicenseGrid.tsx`, więc silnik
 * knock-outów nie miał jak sprawdzić, czy odwołuje się do istniejących
 * identyfikatorów. Rozjazd byłby cichy i objawiłby się użytkownikowi jako
 * „nie masz uprawnienia, które przed chwilą zaznaczyłeś" — czyli w miejscu,
 * w którym najtrudniej się go domyślić.
 *
 * Ikony zostają po stronie interfejsu: to jest moduł danych i nie ma powodu,
 * żeby wciągał `lucide-react` do każdego miejsca, które chce sprawdzić
 * identyfikator uprawnienia.
 */

export type LicenseCategory = 'Kierowca' | 'Techniczne' | 'Sanitarne' | 'IT / Zarządzanie';

export interface LicenseDefinition {
  id: string;
  label: string;
  category: LicenseCategory;
  /** Nazwa ikony z `lucide-react`, rozwiązywana przy renderowaniu. */
  iconName: string;
}

export const LICENSE_CATEGORIES: LicenseCategory[] = [
  'Kierowca',
  'Techniczne',
  'Sanitarne',
  'IT / Zarządzanie',
];

export const ALL_LICENSES: LicenseDefinition[] = [
  { id: 'b_license', label: 'Prawo Jazdy Kat. B', category: 'Kierowca', iconName: 'Car' },
  { id: 'a_license', label: 'Prawo Jazdy Kat. A (Motocykl)', category: 'Kierowca', iconName: 'Car' },
  { id: 'c_license', label: 'Prawo Jazdy Kat. C / C+E', category: 'Kierowca', iconName: 'Truck' },
  { id: 'd_license', label: 'Prawo Jazdy Kat. D (Autobusy)', category: 'Kierowca', iconName: 'Truck' },
  { id: 'udt_forklift', label: 'Uprawnienia UDT (Wózki Widłowe)', category: 'Techniczne', iconName: 'HardHat' },
  { id: 'udt_crane', label: 'Uprawnienia UDT (Suwnice / Dźwigi)', category: 'Techniczne', iconName: 'HardHat' },
  { id: 'sep_1kv', label: 'Uprawnienia SEP (Grupa 1 do 1kV)', category: 'Techniczne', iconName: 'Zap' },
  { id: 'welding_tig_mig', label: 'Certyfikat Spawalniczy TIG/MAG', category: 'Techniczne', iconName: 'Flame' },
  { id: 'sanepid', label: 'Orzeczenie Sanepid', category: 'Sanitarne', iconName: 'ShieldCheck' },
  { id: 'haccp', label: 'Certyfikat HACCP / GMP', category: 'Sanitarne', iconName: 'ShieldCheck' },
  { id: 'cloud_cert', label: 'Certyfikat AWS / GCP / Azure', category: 'IT / Zarządzanie', iconName: 'Award' },
  { id: 'scrum_master', label: 'Scrum Master (PSM I / CSM)', category: 'IT / Zarządzanie', iconName: 'Sparkles' },
  { id: 'cisco_ccna', label: 'Certyfikat Cisco CCNA', category: 'IT / Zarządzanie', iconName: 'Network' },

  // Pozycje dodane razem z silnikiem knock-outów. Wcześniej ogłoszenie mogło
  // wymagać SEP G3 albo uprawnień F-Gaz, a użytkownik nie miał jak zaznaczyć,
  // że je posiada — mimo że `specializations.ts` wymienia je przy monterach
  // i technikach HVAC jako podstawowe kwalifikacje.
  { id: 'sep_g2', label: 'Uprawnienia SEP G2 (Cieplne / Energetyczne)', category: 'Techniczne', iconName: 'Flame' },
  { id: 'sep_g3', label: 'Uprawnienia SEP G3 (Gazowe)', category: 'Techniczne', iconName: 'Flame' },
  { id: 'fgas', label: 'Certyfikat F-Gaz (Personel)', category: 'Techniczne', iconName: 'Wind' },
  { id: 'udt_lift', label: 'Uprawnienia UDT (Podesty Ruchome)', category: 'Techniczne', iconName: 'HardHat' },
  { id: 'udt_pressure', label: 'Uprawnienia UDT (Urządzenia Ciśnieniowe)', category: 'Techniczne', iconName: 'Sliders' },
  { id: 'height_work', label: 'Szkolenie: Praca na Wysokości', category: 'Techniczne', iconName: 'HardHat' },
  { id: 'medical_clearance', label: 'Aktualne Orzeczenie Lekarskie (Badania)', category: 'Sanitarne', iconName: 'ShieldCheck' },
];

const LICENSE_IDS = new Set(ALL_LICENSES.map((license) => license.id));

/** Pilnuje, żeby odwołania z silnika knock-outów wskazywały istniejące pozycje. */
export function isKnownLicenseId(id: string): boolean {
  return LICENSE_IDS.has(id);
}

export function findLicenseById(id: string): LicenseDefinition | undefined {
  return ALL_LICENSES.find((license) => license.id === id);
}
