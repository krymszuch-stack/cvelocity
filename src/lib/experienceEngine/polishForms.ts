import { GrammarNarrativeStyle } from './types';

export interface ActionFormMapping {
  noun: string; // Bezokolicznik / Rzeczownik odsłowny (np. Projektowanie)
  male: string; // 1 os. lp męski (np. Projektowałem)
  female: string; // 1 os. lp żeński (np. Projektowałam)
}

export const POLISH_VERB_FORMS: Record<string, ActionFormMapping> = {
  projektowałem: { noun: 'Projektowanie', male: 'Projektowałem', female: 'Projektowałam' },
  implementowałem: { noun: 'Implementacja', male: 'Implementowałem', female: 'Implementowałam' },
  rozwijałem: { noun: 'Rozwój', male: 'Rozwijałem', female: 'Rozwijałam' },
  wdrażałem: { noun: 'Wdrażanie', male: 'Wdrażałem', female: 'Wdrażałam' },
  optymalizowałem: { noun: 'Optymalizacja', male: 'Optymalizowałem', female: 'Optymalizowałam' },
  konfigurowałem: { noun: 'Konfiguracja', male: 'Konfigurowałem', female: 'Konfigurowałam' },
  integrowałem: { noun: 'Integracja', male: 'Integrowałem', female: 'Integrowałam' },
  utrzymywałem: { noun: 'Utrzymanie', male: 'Utrzymywałem', female: 'Utrzymywałam' },
  testowałem: { noun: 'Testowanie', male: 'Testowałem', female: 'Testowałam' },
  automatyzowałem: { noun: 'Automatyzacja', male: 'Automatyzowałem', female: 'Automatyzowałam' },
  monitorowałem: { noun: 'Monitoring', male: 'Monitorowałem', female: 'Monitorowałam' },
  skalowałem: { noun: 'Skalowanie', male: 'Skalowałem', female: 'Skalowałam' },
  zabezpieczałem: { noun: 'Zabezpieczanie', male: 'Zabezpieczałem', female: 'Zabezpieczałam' },
  montowałem: { noun: 'Montaż', male: 'Montowałem', female: 'Montowałam' },
  diagnozowałem: { noun: 'Diagnostyka', male: 'Diagnozowałem', female: 'Diagnozowałam' },
  naprawiałem: { noun: 'Naprawa', male: 'Naprawiałem', female: 'Naprawiałam' },
  kalibrowałem: { noun: 'Kalibracja', male: 'Kalibrowałem', female: 'Kalibrowałam' },
  prowadziłem: { noun: 'Prowadzenie', male: 'Prowadziłem', female: 'Prowadziłam' },
  wykonywałem: { noun: 'Wykonywanie', male: 'Wykonywałem', female: 'Wykonywałam' },
  koordynowałem: { noun: 'Koordynacja', male: 'Koordynowałem', female: 'Koordynowałam' },
  zarządzałem: { noun: 'Zarządzanie', male: 'Zarządzałem', female: 'Zarządzałam' },
  analizowałem: { noun: 'Analiza', male: 'Analizowałem', female: 'Analizowałam' },
  doradzałem: { noun: 'Doradztwo', male: 'Doradzałem', female: 'Doradzałam' },
  tworzyłem: { noun: 'Tworzenie', male: 'Tworzyłem', female: 'Tworzyłam' },
};

/**
 * Zwraca właściwą formę czasownika wg wybranego stylu narracji.
 */
export function formatActionWord(action: string, style: GrammarNarrativeStyle): string {
  const norm = action.trim().toLowerCase();
  const mapping = POLISH_VERB_FORMS[norm];
  if (!mapping) {
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  if (style === 'impersonal') return mapping.noun;
  if (style === 'first_person_f') return mapping.female;
  return mapping.male;
}

/**
 * Łączy listę obiektów lub technologii w naturalny polski ciąg (np. "A, B oraz C").
 */
export function joinWithPolishConjunction(items: string[], conjunction: 'oraz' | 'i' = 'oraz'): string {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}
