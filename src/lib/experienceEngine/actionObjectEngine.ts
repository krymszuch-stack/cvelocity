export const ACTION_OBJECT_AFFINITY: Record<string, string[]> = {
  projektowałem: [
    'architekturę aplikacji',
    'mikroserwisy',
    'schematy baz danych',
    'struktury systemowe',
    'rozwiązania techniczne',
    'instalacje techniczne',
  ],
  implementowałem: [
    'nowe funkcjonalności',
    'endpointy API REST',
    'moduły biznesowe',
    'mechanizmy autoryzacji',
    'komponenty UI',
    'algorytmy i procesy',
  ],
  rozwijałem: [
    'istniejące aplikacje webowe',
    'usługi backendowe',
    'moduły systemu',
    'narzędzia wewnętrzne',
  ],
  wdrażałem: [
    'pipeline’y CI/CD',
    'aplikacje produkcyjne',
    'środowiska chmurowe',
    'standardy i procedury',
    'nowe instalacje',
  ],
  optymalizowałem: [
    'zapytania i bazy danych SQL',
    'wydajność i czas odpowiedzi API',
    'zużycie zasobów chmurowych',
    'procesy operacyjne',
    'czas ładowania aplikacji',
  ],
  konfigurowałem: [
    'serwery i środowiska',
    'narzędzia monitoringu',
    'sterowniki PLC',
    'rozdzielnice i aparaturę',
    'kontenery Docker',
  ],
  montowałem: [
    'instalacje sanitarne i grzewcze',
    'urządzenia HVAC i pompy ciepła',
    'rozdzielnice elektryczne',
    'podzespoły mechaniczne',
  ],
  diagnozowałem: [
    'usterki i awarie układów',
    'błędy w działaniu systemów',
    'nieprawidłowości parametrów pracy',
  ],
};

/**
 * Zwraca preferowane obiekty powiązane z danym czasownikiem.
 */
export function getAffinityObjects(action: string, fallbackObjects: string[] = []): string[] {
  const normAction = action.trim().toLowerCase();
  const matched = ACTION_OBJECT_AFFINITY[normAction];
  if (matched && matched.length > 0) {
    return matched;
  }
  return fallbackObjects;
}
