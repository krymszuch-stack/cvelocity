/**
 * Kalkulator opłacalności oferty: realna stawka za godzinę życia.
 *
 * Cała matematyka jest tutaj, poza komponentem, bo testy tego projektu biegną
 * w Node bez DOM-u (patrz `AGENTS.md`). Widżet ma zostać cienką warstwą, która
 * tylko podaje liczby do tych funkcji i rysuje wynik.
 *
 * Zasada nadrzędna: **nic tu nie jest zmyślone**. Podatki liczymy prawdziwym
 * algorytmem UoP, a nie mnożnikiem „×0,72". Wyceny pakietów socjalnych to
 * jawnie oznaczone **założenia** wystawione w `BENEFIT_ASSUMPTIONS` — interfejs
 * musi je pokazywać jako założenia, a nie jako pomiar, i pozwalać je nadpisać.
 * Czego nie wiemy, tego nie zgadujemy: brak danych zwraca `null`, nie liczbę.
 */

import type { ParsedJobDescription } from './jdParser';

/** Etat w miesiącu wg Kodeksu pracy w przybliżeniu rocznej średniej. */
export const NOMINAL_MONTHLY_HOURS = 168;

/** Średnia liczba tygodni roboczych w miesiącu (52 / 12 ≈ 4,33; ostrożnie 4,2). */
export const WEEKS_PER_MONTH = 4.2;

export type ContractType = 'UOP' | 'B2B';
export type WorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE';

export interface MobilityPreferences {
  /** Kwota z oferty w złotych miesięcznie: brutto dla UoP, netto dla B2B. */
  salaryAmount: number;
  contract: ContractType;
  workMode: WorkMode;
  /** Ile dni w tygodniu w biurze. Dla REMOTE zawsze 0, dla ONSITE 5. */
  officeDaysPerWeek: number;
  /** Dojazd w jedną stronę, w minutach (10–90 w interfejsie). */
  oneWayMinutes: number;
  /** Paliwo, bilety, parking — złotych miesięcznie. */
  monthlyCommuteCost: number;
}

export const DEFAULT_MOBILITY_PREFERENCES: MobilityPreferences = {
  salaryAmount: 0,
  contract: 'UOP',
  workMode: 'HYBRID',
  officeDaysPerWeek: 3,
  oneWayMinutes: 30,
  monthlyCommuteCost: 300,
};

/* ------------------------------------------------------------------ */
/* Podatki i składki                                                   */
/* ------------------------------------------------------------------ */

/** Składki pracownika: emerytalna 9,76% + rentowa 1,5% + chorobowa 2,45%. */
const ZUS_EMPLOYEE_RATE = 0.0976 + 0.015 + 0.0245;
const HEALTH_RATE = 0.09;
const PIT_RATE = 0.12;
/** Miesięczne koszty uzyskania przychodu — wariant podstawowy. */
const TAX_DEDUCTIBLE_COSTS = 250;
/** 1/12 kwoty zmniejszającej podatek (3600 zł rocznie) przy złożonym PIT-2. */
const MONTHLY_TAX_RELIEF = 300;

/**
 * Netto „na rękę" z kwoty brutto na umowie o pracę.
 *
 * Uproszczenia, których świadomie nie ukrywamy: pierwszy próg skali (12%),
 * podstawowe KUP, złożony PIT-2, brak PPK i brak ulg szczególnych. Dla drugiego
 * progu i dla PPK wynik będzie zawyżony — dlatego interfejs pisze „szacunek".
 */
export function estimateNetFromGross(gross: number): number {
  if (!Number.isFinite(gross) || gross <= 0) return 0;

  const zus = gross * ZUS_EMPLOYEE_RATE;
  const afterZus = gross - zus;
  const health = afterZus * HEALTH_RATE;
  const taxBase = Math.max(0, Math.round(afterZus - TAX_DEDUCTIBLE_COSTS));
  const advance = Math.max(0, Math.round(taxBase * PIT_RATE - MONTHLY_TAX_RELIEF));

  return Math.max(0, afterZus - health - advance);
}

/**
 * Kwota na rękę zależnie od formy zatrudnienia.
 *
 * Dla B2B **nie liczymy** ZUS-u ani podatku: stawka ryczałtu, forma
 * opodatkowania i preferencyjne składki są indywidualne, a zgadnięcie ich
 * dałoby liczbę wyglądającą na pomiar. Użytkownik B2B podaje kwotę, która
 * faktycznie zostaje mu w kieszeni.
 */
export function monthlyNetIncome(prefs: MobilityPreferences): number {
  return prefs.contract === 'UOP'
    ? estimateNetFromGross(prefs.salaryAmount)
    : Math.max(0, prefs.salaryAmount);
}

/* ------------------------------------------------------------------ */
/* Czas w drodze                                                       */
/* ------------------------------------------------------------------ */

/** Dni w biurze wynikające z trybu pracy; hybryda bierze wybór użytkownika. */
export function effectiveOfficeDays(prefs: MobilityPreferences): number {
  if (prefs.workMode === 'REMOTE') return 0;
  if (prefs.workMode === 'ONSITE') return 5;
  return Math.min(5, Math.max(0, prefs.officeDaysPerWeek));
}

/** Godziny miesięcznie spędzone w drodze — w obie strony. */
export function monthlyCommuteHours(prefs: MobilityPreferences): number {
  const days = effectiveOfficeDays(prefs);
  return (days * (prefs.oneWayMinutes * 2) * WEEKS_PER_MONTH) / 60;
}

/** Koszt dojazdu naliczamy tylko wtedy, gdy ktoś faktycznie dojeżdża. */
export function effectiveCommuteCost(prefs: MobilityPreferences): number {
  return effectiveOfficeDays(prefs) === 0 ? 0 : Math.max(0, prefs.monthlyCommuteCost);
}

/* ------------------------------------------------------------------ */
/* Benefity                                                            */
/* ------------------------------------------------------------------ */

export type BenefitKey =
  | 'SPORT'
  | 'MEDICAL'
  | 'DRIVING_LICENSE'
  | 'COMMUTE'
  | 'FOOD'
  | 'EQUIPMENT';

export interface BenefitAssumption {
  key: BenefitKey;
  label: string;
  /**
   * Ile trzeba by wydać z własnej kieszeni miesięcznie. To **założenie**
   * kalkulatora, nie dana z oferty — interfejs ma je oznaczyć i pozwolić
   * odznaczyć pozycję, jeśli użytkownik i tak by z niej nie skorzystał.
   * `null` znaczy „nie da się wycenić pieniędzmi" (np. uprawnienia).
   */
  monthlyValue: number | null;
  /** Skąd ta liczba — pokazywane w dymku, żeby nie udawała pomiaru. */
  basis: string;
  /** Frazy z ogłoszenia, po których rozpoznajemy benefit. */
  keywords: string[];
}

export const BENEFIT_ASSUMPTIONS: readonly BenefitAssumption[] = [
  {
    key: 'SPORT',
    label: 'Karta sportowa',
    monthlyValue: 150,
    basis: 'Założenie: abonament sportowy w wariancie podstawowym.',
    keywords: ['multisport', 'medicover sport', 'karta sportowa', 'siłowni', 'fitprofit', 'benefit systems'],
  },
  {
    key: 'MEDICAL',
    label: 'Opieka medyczna',
    monthlyValue: 180,
    basis: 'Założenie: prywatny pakiet medyczny dla jednej osoby.',
    keywords: ['luxmed', 'lux med', 'medicover', 'enel-med', 'opieka medyczna', 'prywatna opieka', 'pakiet medyczny'],
  },
  {
    key: 'FOOD',
    label: 'Wyżywienie',
    monthlyValue: 300,
    basis: 'Założenie: dofinansowanie lunchu w dni robocze.',
    keywords: ['karta lunch', 'lunch', 'posiłk', 'kantyn', 'owocowe czwartki', 'kawa i herbata', 'sodexo', 'edenred'],
  },
  {
    key: 'EQUIPMENT',
    label: 'Sprzęt i biurko',
    monthlyValue: 120,
    basis: 'Założenie: laptop i budżet na biurko rozłożone na 24 miesiące.',
    keywords: ['laptop', 'macbook', 'sprzęt', 'budżet na', 'home office', 'stanowisko pracy', 'monitor'],
  },
  {
    key: 'COMMUTE',
    label: 'Dojazd / parking',
    monthlyValue: 200,
    basis: 'Założenie: bilet okresowy albo miejsce parkingowe.',
    keywords: ['parking', 'bilet', 'dojazd', 'samochód służbowy', 'auto służbowe', 'zwrot kosztów dojazdu'],
  },
  {
    key: 'DRIVING_LICENSE',
    label: 'Prawo jazdy',
    monthlyValue: null,
    basis: 'To wymaganie oferty, nie benefit — nie wliczamy go do wartości pakietu.',
    keywords: ['prawo jazdy', 'kat. b', 'kategorii b', 'kat.b', 'kategoria b', 'kat. c'],
  },
] as const;

export type BenefitStatus = 'PROVIDED' | 'MISSING';

export interface DetectedBenefit {
  key: BenefitKey;
  label: string;
  status: BenefitStatus;
  monthlyValue: number | null;
  basis: string;
  /** Fragment ogłoszenia, który uruchomił dopasowanie — dowód, nie domysł. */
  matchedPhrase: string | null;
}

/**
 * Rozpoznanie benefitów w treści oferty.
 *
 * Jedno miejsce, jedna lista fraz (reguła 3): parser ogłoszeń i ten kalkulator
 * nie mogą mieć dwóch różnych zdań na temat tego, czy w ofercie jest MultiSport.
 */
export function detectBenefits(sources: Array<string | undefined | null>): DetectedBenefit[] {
  const haystack = sources
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .join(' \n ')
    .toLowerCase();

  return BENEFIT_ASSUMPTIONS.map((assumption) => {
    const matched = assumption.keywords.find((keyword) => haystack.includes(keyword)) ?? null;
    return {
      key: assumption.key,
      label: assumption.label,
      status: matched ? ('PROVIDED' as const) : ('MISSING' as const),
      monthlyValue: assumption.monthlyValue,
      basis: assumption.basis,
      matchedPhrase: matched,
    };
  });
}

/** Zbiera teksty oferty, w których szukamy benefitów. */
export function benefitSourcesFromOffer(
  offer: { description?: string; requirements?: string[]; tags?: string[] },
  parsed?: ParsedJobDescription | null
): string[] {
  return [
    offer.description ?? '',
    (offer.requirements ?? []).join(' '),
    (offer.tags ?? []).join(' '),
    (parsed?.benefits ?? []).join(' '),
    (parsed?.perksAndPlusy ?? []).join(' '),
  ].filter((entry) => entry.trim().length > 0);
}

/** Suma wycenionych, faktycznie zapewnionych pozycji pakietu. */
export function benefitPackageValue(benefits: DetectedBenefit[]): number {
  return benefits.reduce(
    (sum, benefit) =>
      benefit.status === 'PROVIDED' && benefit.monthlyValue !== null
        ? sum + benefit.monthlyValue
        : sum,
    0
  );
}

/* ------------------------------------------------------------------ */
/* Wynik                                                               */
/* ------------------------------------------------------------------ */

export interface FeasibilityResult {
  netMonthly: number;
  /** Stawka, którą widać w ogłoszeniu: netto / 168 h. Pozorna. */
  nominalHourlyRate: number;
  /** Stawka po odjęciu kosztów dojazdu i doliczeniu godzin w drodze. */
  realHourlyRate: number;
  /** Ile złotych na godzinę zjada dojazd. */
  hourlyRateLoss: number;
  commuteHours: number;
  commuteCost: number;
  /** Godziny w drodze przeliczone na 8-godzinne dni robocze. */
  commuteWorkdays: number;
  benefitValue: number;
  /** Realna stawka, gdy doliczyć wartość pakietu socjalnego. */
  realHourlyRateWithBenefits: number;
  /** Ile miesięcznie odzyskuje jeden dzień pracy zdalnej więcej. */
  savingsPerRemoteDay: { hours: number; cost: number } | null;
}

export function calculateFeasibility(
  prefs: MobilityPreferences,
  benefits: DetectedBenefit[] = []
): FeasibilityResult | null {
  const netMonthly = monthlyNetIncome(prefs);
  // Bez kwoty nie ma czego liczyć. Zero zamiast `null` byłoby stwierdzeniem,
  // że ta praca jest darmowa — a to nieprawda, tylko brak danych.
  if (netMonthly <= 0) return null;

  const commuteHours = monthlyCommuteHours(prefs);
  const commuteCost = effectiveCommuteCost(prefs);
  const benefitValue = benefitPackageValue(benefits);

  const nominalHourlyRate = netMonthly / NOMINAL_MONTHLY_HOURS;
  const realHourlyRate = (netMonthly - commuteCost) / (NOMINAL_MONTHLY_HOURS + commuteHours);
  const realHourlyRateWithBenefits =
    (netMonthly - commuteCost + benefitValue) / (NOMINAL_MONTHLY_HOURS + commuteHours);

  const days = effectiveOfficeDays(prefs);
  const savingsPerRemoteDay =
    days > 0
      ? {
          hours: (prefs.oneWayMinutes * 2 * WEEKS_PER_MONTH) / 60,
          cost: commuteCost / days,
        }
      : null;

  return {
    netMonthly,
    nominalHourlyRate,
    realHourlyRate,
    hourlyRateLoss: nominalHourlyRate - realHourlyRate,
    commuteHours,
    commuteCost,
    commuteWorkdays: commuteHours / 8,
    benefitValue,
    realHourlyRateWithBenefits,
    savingsPerRemoteDay,
  };
}

/* ------------------------------------------------------------------ */
/* Notatka doradcy                                                     */
/* ------------------------------------------------------------------ */

export interface AdvisorNote {
  headline: string;
  body: string;
  /** Konkretna rzecz do zrobienia na rozmowie. Zawsze wykonalna. */
  tactic: string;
}

const zl = (value: number) => `${Math.round(value).toLocaleString('pl-PL')} zł`;
const h = (value: number) => value.toFixed(0);

/**
 * Życzliwy doradca, nie recenzent.
 *
 * Notatka jest deterministyczna i zbudowana wyłącznie z liczb policzonych
 * wyżej. Świadomie nie ma tu porównań w rodzaju „o 15% lepiej niż rynek":
 * nie mamy danych o rynku dla tego stanowiska, więc taka zdanie byłoby
 * wymyślone (reguła 1). Gdy zbierzemy je z wiedzy zbiorowej, dopiszemy je
 * jako osobne, oznaczone źródło.
 */
export function buildAdvisorNote(
  result: FeasibilityResult,
  prefs: MobilityPreferences
): AdvisorNote {
  const days = effectiveOfficeDays(prefs);

  if (days === 0) {
    return {
      headline: 'Zdalnie — Twój czas zostaje u Ciebie',
      body: `Bez dojazdów Twoja stawka to ${result.realHourlyRate.toFixed(2)} zł za godzinę i nic jej nie uszczupla. Pakiet dokłada ${zl(result.benefitValue)} miesięcznie wartości, której nie widać w kwocie na umowie.`,
      tactic:
        'Zapytaj wprost, czy tryb zdalny jest zapisany w umowie, czy tylko w praktyce zespołu — to pytanie jest normalne i dobrze świadczy o kandydacie.',
    };
  }

  const lossShare = result.nominalHourlyRate
    ? (result.hourlyRateLoss / result.nominalHourlyRate) * 100
    : 0;

  const body =
    `Na papierze wychodzi ${result.nominalHourlyRate.toFixed(2)} zł/h. Po doliczeniu ${h(result.commuteHours)} godzin miesięcznie w drodze ` +
    `(równowartość ${result.commuteWorkdays.toFixed(1)} dnia roboczego) i ${zl(result.commuteCost)} kosztów dojazdu ` +
    `zostaje ${result.realHourlyRate.toFixed(2)} zł za godzinę Twojego życia — o ${lossShare.toFixed(0)}% mniej.`;

  const tactic = result.savingsPerRemoteDay
    ? `Jeden dodatkowy dzień zdalny w tygodniu odzyskuje ${h(result.savingsPerRemoteDay.hours)} godzin i ${zl(result.savingsPerRemoteDay.cost)} miesięcznie. To zwykle łatwiejsze do wynegocjowania niż podwyżka o tę samą kwotę — i warto o to poprosić na drugiej rozmowie, gdy już Cię chcą.`
    : 'Zapytaj o elastyczne godziny — wyjazd poza szczyt potrafi skrócić dojazd bardziej niż jakikolwiek dodatek do pensji.';

  const headline =
    lossShare >= 20
      ? 'Oferta warta rozmowy, ale dojazd kosztuje sporo'
      : 'Bilans wychodzi na plus';

  return { headline, body, tactic };
}
