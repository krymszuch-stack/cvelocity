export const ACTION_OBJECT_AFFINITY: Record<string, string[]> = {
  // IT & Architektura
  projektowałem: [
    'architekturę aplikacji i mikroserwisów',
    'schematy baz danych relacyjnych i NoSQL',
    'struktury systemowe i modele danych',
    'rozwiązania techniczne i integracyjne',
    'instalacje techniczne i schematy wykonawcze',
  ],
  implementowałem: [
    'nowe funkcjonalności biznesowe',
    'endpointy API REST i GraphQL',
    'mechanizmy autoryzacji i bezpieczeństwa',
    'komponenty interfejsu użytkownika (UI)',
    'algorytmy przetwarzania danych',
  ],
  rozwijałem: [
    'aplikacje webowe i usługi backendowe',
    'moduły systemów produkcyjnych',
    'narzędzia wewnętrzne i automatyzacje',
  ],
  wdrażałem: [
    'pipeline’y CI/CD i procesy automatyzacji',
    'środowiska chmurowe AWS / GCP',
    'standardy i procedury jakościowe',
    'nowe instalacje i systemy sterowania',
  ],
  optymalizowałem: [
    'zapytania i indeksy w bazach danych SQL',
    'wydajność i czas odpowiedzi systemów',
    'zużycie zasobów i koszty chmurowe',
    'procesy operacyjne i czas realizacji zadań',
    'czas cyklu obróbczego i czasy przezbrojeń',
  ],
  konfigurowałem: [
    'serwery produkcyjne i środowiska wdrożeniowe',
    'narzędzia monitoringu Prometheus i Grafana',
    'sterowniki PLC i falowniki napędowe',
    'rozdzielnice elektryczne i aparaturę modułową',
    'kontenery Docker i klastry Kubernetes',
  ],

  // Techniczne, Monter, Elektryk, Spawacz
  montowałem: [
    'kotły gazowe kondensacyjne i pompy ciepła',
    'rozdzielnice elektryczne i szafy sterownicze',
    'instalacje sanitarne, grzewcze i trasy rurociągów',
    'podzespoły mechaniczne i armaturę przemysłową',
    'konstrukcje stalowe i obudowy urządzeń',
  ],
  diagnozowałem: [
    'usterki i awarie układów mechanicznych i elektrycznych',
    'kody błędów i parametry pracy w oparciu o DTR',
    'nieszczelności instalacji gazowych i chłodniczych',
    'błędy w magistralach komunikacyjnych CAN/LIN',
  ],
  naprawiałem: [
    'podzespoły mechaniczne i układy zasilania',
    'armaturę hydrauliczną, zawory i wymienniki',
    'wiązki elektryczne i moduły sterowników',
  ],
  'wykonywałem pomiary': [
    'impedancji pętli zwarcia i rezystancji izolacji miernikiem Sonel',
    'parametrów spalin analizatorem Testo',
    'wymiarów detali mikrometrem i średnicówką z dokładnością do 0.01 mm',
  ],
  'spawałem metodą tig 141': [
    'rurociągi ciśnieniowe ze stali nierdzewnej pod RTG',
    'cienkościenne rury i kształtki ze stali kwasoodpornej',
    'złącza doczołowe w pozycjach przymusowych (HL-045)',
  ],
  'spawałem metodą mag 135/136': [
    'wielkogabarytowe konstrukcje stalowe',
    'spoiny pachwinowe i doczołowe z pełnym przetopem',
    'profile hutnicze i ramy nośne maszyn',
  ],

  // Magazyn & Logistyka
  kompletowałem: [
    'zamówienia e-commerce i B2B ze skanerem radiowym Zebra',
    'artykuły według zoptymalizowanej ścieżki pickingu',
    'przesyłki paletowe i drobnicowe',
  ],
  'obsługiwałem wózki udt': [
    'wózki widłowe czołowe i wysokiego składu Reach Truck',
    'załadunki i rozładunki naczep TIR',
    'gniazda regałowe na wysokości do 10m',
  ],
  'ewidencjonowałem w wms': [
    'stany magazynowe w systemie SAP WMS / Baselinker',
    'przyjęcia dostaw surowców i towarów (dokumenty PZ/WZ)',
    'lokalizacje magazynowe i przesunięcia międzymagazynowe (MM)',
  ],

  // Transport & Kierowca
  'prowadziłem zestawy ciężarowe': [
    'zestawy ciągnik siodłowy z naczepą typu firanka / chłodnia',
    'przewozy międzynarodowe na trasach UE',
    'ładunki całopojazdowe FTL i częściowe LTL',
  ],
  'zabezpieczałem ładunek': [
    'pasy transportowe, narożniki ochronne i maty antypoślizgowe',
    'ładunki niebezpieczne objęte procedurami ADR',
    'równomierny rozkład masy na osie pojazdu',
  ],

  // Motoryzacja
  'diagnozowałem testerem': [
    'sterowniki silnika ECU testerem Bosch KTS / Autel',
    'parametry bieżące wtryskiwaczy i ciśnienia doładowania',
    'błędy w magistrali danych CAN i LIN',
  ],
  'wymieniałem elementy zawieszenia': [
    'wahacze, amortyzatory, sprężyny i tuleje metalowo-gumowe',
    'tarcze i klocki hamulcowe z elektrycznym hamulcem EPB',
  ],

  // CNC & Produkcja
  'pisałem programy g-code': [
    'programy obróbcze na sterowniki Sinumerik / Fanuc / Heidenhain',
    'cykle toczenia, frezowania i gwintowania',
    'trajektorie narzędzi z korekcją promienia G41/G42',
  ],
  'mierzyłem detale': [
    'wymiary detali za pomocą mikrometrów i średnicówek Mitutoyo',
    'tolerancje geometryczne i chropowatość powierzchni Ra',
  ],

  // Finanse & Księgowość
  księgowałem: [
    'faktury kosztowe i zakupowe zgodnie z planem kont',
    'wyciągi bankowe, raporty kasowe i rozliczenia delegacji',
    'dokumenty obrotu magazynowego i środki trwałe',
  ],
  'sporządzałem deklaracje vat/cit': [
    'deklaracje podatkowe VAT-7, CIT-8 oraz pliki JPK_V7',
    'deklaracje rozliczeniowe w programie ZUS Płatnik',
  ],
  'tworzyłem sprawozdania finansowe': [
    'bilans, rachunek zysków i strat (RZiS) oraz zestawienia obrotów i sald',
    'raporty zarządcze dla zarządu i audytorów zewnętrznych',
  ],

  // Sprzedaż B2B & Obsługa Klienta
  'pozyskiwałem klientów': [
    'nowych partnerów biznesowych w segmencie B2B',
    'klientów kluczowych poprzez cold outreach i networking',
  ],
  'negocjowałem warunki umów': [
    'kontrakty handlowe, rabaty i terminy płatności',
    'umowy ramowe i oferty przetargowe B2B',
  ],
  'doradzałem klientom': [
    'zapytania produktowe, techniczne i ofertowe',
    'dobór optymalnych rozwiązań dla klientów indywidualnych i firmowych',
  ],
  'rozpatrywałem reklamacje': [
    'zgłoszenia reklamacyjne i wnioski kompensacyjne',
    'sprawy sporne z zachowaniem najwyższych standardów satysfakcji klienta',
  ],

  // Medycyna
  'podawałem leki': [
    'farmakoterapię drogą dożylną, domięśniową i doustną',
    'wlewy kroplowe i leki przez pompy infuzyjne',
  ],
  'wykonywałem badania ekg': [
    '12-odprowadzeniowe zapisy EKG i monitorowanie kardiomonitorami',
    'pomiary parametrów życiowych (ciśnienie, saturacja SpO2, tętno)',
  ],
  'prowadziłem elektroniczną dokumentację (edm)': [
    'historię choroby pacjenta w systemach Asseco AMMS / Kamsoft',
    'karty zleceń lekarskich i protokoły zabiegowe',
  ],

  // Zarządzanie & Administracja
  'zarządzałem projektami': [
    'złożone projekty biznesowe i technologiczne',
    'harmonogramy prac (Gantt) i budżety projektowe',
    'zespoły wielodyscyplinarne i alokację zasobów',
  ],
  'koordynowałem': [
    'obieg dokumentów i procesy biurowe',
    'harmonogramy spotkań i kontakt z kontrahentami',
  ],
};

/**
 * Zwraca preferowane obiekty powiązane z danym czasownikiem.
 */
export function getAffinityObjects(action: string, fallbackObjects: string[] = []): string[] {
  if (!action) return fallbackObjects;
  const normAction = action.trim().toLowerCase();
  const matched = ACTION_OBJECT_AFFINITY[normAction];
  if (matched && matched.length > 0) {
    return matched;
  }
  return fallbackObjects;
}
