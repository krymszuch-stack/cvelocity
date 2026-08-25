/**
 * Wynik ekstrakcji ogłoszenia ze strony.
 *
 * Pola opcjonalne są opcjonalne naprawdę — jeśli źródło ich nie podaje, zostają
 * puste. Uzupełnianie ich prawdopodobnie brzmiącą wartością było źródłem
 * większości „błędów parsera" zgłaszanych wcześniej.
 */
export interface ExtractedJob {
  title: string;
  company: string;
  /** Treść ogłoszenia jako czysty tekst, bez znaczników. */
  description: string;

  location?: string;
  /** `true` wyłącznie gdy źródło jawnie deklaruje pracę zdalną. */
  remote?: boolean;
  /** Znormalizowane do wielkich liter, np. FULL_TIME, CONTRACTOR. */
  employmentType?: string;
  /** Gotowy do wyświetlenia zapis widełek, np. „12 000 – 17 000 PLN / mies.". */
  salary?: string;
  seniority?: string;
  skills?: string[];
  benefits?: string[];
  /** ISO 8601, tak jak podało źródło. */
  datePosted?: string;
  validThrough?: string;
}

/**
 * Szczebel drabiny, który dostarczył dane. Wszystkie są deterministyczne
 * i darmowe; do modelu schodzimy dopiero, gdy wszystkie zawiodą.
 */
export type ExtractionTier = 'json-ld' | 'hydration' | 'open-graph' | 'main-content' | 'none';

export interface ExtractionResult {
  job: ExtractedJob;
  tier: ExtractionTier;
  /**
   * `true`, gdy dane strukturalne wystarczą i nie trzeba dopytywać modelu
   * o tytuł, firmę czy widełki. Model bywa wtedy potrzebny najwyżej do
   * rozbicia samego opisu na wymagania i obowiązki.
   */
  structured: boolean;
}
