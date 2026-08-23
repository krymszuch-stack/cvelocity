/**
 * Lokalny słownik definicji pojęć branżowych/technicznych używany przez
 * interviewCheatSheetEngine.ts do budowy sekcji "Glosariusz" bez wywołania Gemini.
 * Klucze porównywane są case-insensitive (patrz lookupGlossaryDefinition).
 *
 * Słownik obejmuje zawody fizyczne na równi z IT (reguła 8 w AGENTS.md).
 * Kandydat na montera odpada na SEP-ie, UDT i F-Gazie, nie na Kubernetesie —
 * glosariusz złożony wyłącznie z terminów programistycznych byłby dla niego
 * pusty, a to jego rozmowa jest za tydzień. Które uprawnienia w ogóle istnieją,
 * mówi `src/data/licenses.ts`; tutaj jest wyłącznie to, co znaczą.
 */
export const INTERVIEW_GLOSSARY_DICTIONARY: Record<string, string> = {
  'typescript': 'Nadzbiór JavaScriptu z systemem statycznych typów — wyłapuje błędy już na etapie kompilacji, a nie dopiero w przeglądarce.',
  'javascript': 'Język programowania działający w przeglądarce i na serwerze (Node.js) — podstawa większości nowoczesnych aplikacji webowych.',
  'react': 'Biblioteka JavaScript do budowy interfejsów użytkownika oparta o komponenty i deklaratywne opisywanie widoku.',
  'react.js': 'Biblioteka JavaScript do budowy interfejsów użytkownika oparta o komponenty i deklaratywne opisywanie widoku.',
  'node.js': 'Środowisko uruchomieniowe JavaScript po stronie serwera, pozwalające pisać backend w tym samym języku co frontend.',
  'express': 'Minimalistyczny framework webowy dla Node.js do budowy API i serwerów HTTP.',
  'python': 'Uniwersalny język programowania popularny w backendzie, analizie danych i automatyzacji.',
  'java': 'Silnie typowany, obiektowy język programowania szeroko stosowany w systemach korporacyjnych i bankowości.',
  'c#': 'Obiektowy język programowania firmy Microsoft, używany głównie w ekosystemie .NET.',
  '.net': 'Platforma programistyczna Microsoftu do budowy aplikacji webowych, desktopowych i usług backendowych.',
  'postgresql': 'Zaawansowana, otwartoźródłowa relacyjna baza danych ceniona za niezawodność i zgodność ze standardem SQL.',
  'sql': 'Język zapytań do relacyjnych baz danych — służy do odczytu, zapisu i modyfikacji danych w tabelach.',
  'mysql': 'Popularna, otwartoźródłowa relacyjna baza danych, często wykorzystywana w aplikacjach webowych.',
  'mongodb': 'Nierelacyjna (dokumentowa) baza danych przechowująca dane w strukturze podobnej do JSON.',
  'redis': 'Bardzo szybka baza danych typu klucz-wartość trzymana w pamięci — używana m.in. do cache\'owania i kolejek.',
  'docker': 'Narzędzie do konteneryzacji aplikacji — pozwala uruchamiać oprogramowanie w izolowanym, przenośnym środowisku.',
  'kubernetes': 'System do automatycznego wdrażania, skalowania i zarządzania aplikacjami w kontenerach.',
  'aws': 'Amazon Web Services — chmura obliczeniowa Amazona oferująca serwery, bazy danych i usługi sieciowe na żądanie.',
  'gcp': 'Google Cloud Platform — chmura obliczeniowa Google z usługami hostingu, danych i sztucznej inteligencji.',
  'azure': 'Chmura obliczeniowa Microsoftu, popularna zwłaszcza w środowiskach korzystających z technologii .NET.',
  'graphql': 'Język zapytań do API, w którym klient sam określa, jakie dokładnie dane chce otrzymać z serwera.',
  'rest api': 'Architektoniczny styl budowy API oparty o standardowe metody HTTP (GET, POST, PUT, DELETE) i zasoby identyfikowane adresem URL.',
  'ci/cd': 'Ciągła integracja i ciągłe dostarczanie — automatyzacja testowania i wdrażania kodu przy każdej zmianie.',
  'git': 'Rozproszony system kontroli wersji — śledzi historię zmian w kodzie i umożliwia pracę zespołową nad tym samym projektem.',
  'agile': 'Zwinne podejście do zarządzania projektami oparte o krótkie iteracje, częstą informację zwrotną i elastyczność.',
  'scrum': 'Popularny framework Agile z rolami (Product Owner, Scrum Master), sprintami i codziennymi spotkaniami zespołu.',
  'jira': 'Narzędzie do zarządzania zadaniami i projektami, powszechnie używane w zespołach Agile/Scrum.',
  'kyc': 'Know Your Customer — proces weryfikacji tożsamości klienta wymagany m.in. w sektorze finansowym.',
  'aml': 'Anti-Money Laundering — przeciwdziałanie praniu pieniędzy; zestaw procedur wykrywających podejrzane transakcje finansowe.',
  'ats': 'Applicant Tracking System — system rekrutacyjny automatycznie skanujący i filtrujący CV pod kątem słów kluczowych.',
  'roi': 'Return on Investment — wskaźnik zwrotu z inwestycji, mierzący opłacalność podjętych działań.',
  'kpi': 'Key Performance Indicator — kluczowy wskaźnik efektywności używany do mierzenia realizacji celów biznesowych.',
  'sla': 'Service Level Agreement — umowa określająca gwarantowany poziom jakości/dostępności usługi.',
  'crm': 'Customer Relationship Management — system do zarządzania relacjami i historią kontaktów z klientami.',
  'erp': 'Enterprise Resource Planning — zintegrowany system zarządzania zasobami i procesami całej organizacji.',

  // ---------- Uprawnienia i pojęcia zawodów fizycznych ----------
  'sep': 'Uprawnienia energetyczne (SEP) potwierdzające prawo do pracy przy urządzeniach elektrycznych, cieplnych lub gazowych. Na rozmowie podaj grupę (G1 elektryczne, G2 cieplne, G3 gazowe), zakres — eksploatacja czy dozór — i termin ważności.',
  'sep g1': 'Uprawnienia SEP grupy 1 — urządzenia i instalacje elektryczne, najczęściej do 1 kV. Rozróżnij eksploatację (E) od dozoru (D): pracodawcy pytają o to wprost.',
  'sep g2': 'Uprawnienia SEP grupy 2 — urządzenia wytwarzające, przetwarzające i przesyłające ciepło, w tym kotły i sieci cieplne.',
  'sep g3': 'Uprawnienia SEP grupy 3 — urządzenia i instalacje gazowe: sieci, kotłownie, przyłącza.',
  'udt': 'Uprawnienia wydawane przez Urząd Dozoru Technicznego na obsługę urządzeń podlegających dozorowi — wózków widłowych, suwnic, podestów, urządzeń ciśnieniowych. Podaj kategorię i datę ważności, bo uprawnienie wygasa.',
  'wózek widłowy': 'Obsługa wózka jezdniowego podnośnikowego wymaga uprawnień UDT w odpowiedniej kategorii (np. II WJO). Przy wymianie butli gazowej potrzebne bywa osobne uprawnienie.',
  'f-gaz': 'Certyfikat F-Gaz — uprawnienia do pracy z fluorowanymi gazami cieplarnianymi w klimatyzacji, chłodnictwie i pompach ciepła. Wymóg formalny, którego nie zastąpi doświadczenie.',
  'mig': 'Spawanie MIG (131) — metoda elektrodą topliwą w osłonie gazu obojętnego, stosowana głównie do aluminium i stopów nieżelaznych.',
  'mag': 'Spawanie MAG (135) — elektroda topliwa w osłonie gazu aktywnego, podstawowa metoda przy stali konstrukcyjnej. Najczęściej wymagana w ogłoszeniach produkcyjnych.',
  'tig': 'Spawanie TIG (141) — elektroda nietopliwa w osłonie argonu, ceniona za jakość i estetykę spoiny; typowa przy stali nierdzewnej i aluminium.',
  'mma': 'Spawanie MMA (111) — elektrodą otuloną, metoda uniwersalna i odporna na warunki polowe, częsta na budowach i przy montażu konstrukcji.',
  'haccp': 'Analiza Zagrożeń i Krytyczne Punkty Kontroli — obowiązkowy system bezpieczeństwa żywności. Przygotuj przykład punktu krytycznego ze swojego stanowiska, np. kontroli temperatury.',
  'gmp': 'Dobra Praktyka Produkcyjna — zasady utrzymania powtarzalnej jakości i higieny produkcji, wymagane w branży spożywczej, farmaceutycznej i kosmetycznej.',
  'sanepid': 'Orzeczenie do celów sanitarno-epidemiologicznych — badanie dopuszczające do pracy przy żywności lub z ludźmi. Wymóg formalny, sprawdzany na starcie.',
  'bhp': 'Bezpieczeństwo i higiena pracy — szkolenia okresowe i zasady bezpiecznego wykonywania zadań. Bądź gotów opisać, jak reagujesz na zagrożenie na stanowisku.',
  'praca na wysokości': 'Praca powyżej 1 m nad poziomem terenu wymaga orzeczenia lekarskiego i szkolenia; powyżej 3 m obowiązują dodatkowe środki ochrony przed upadkiem.',
  'utrzymanie ruchu': 'Dział odpowiedzialny za sprawność maszyn: przeglądy zapobiegawcze, usuwanie awarii i minimalizowanie przestojów linii produkcyjnej.',
  '5s': 'Metoda organizacji stanowiska pracy w pięciu krokach (selekcja, systematyka, sprzątanie, standaryzacja, samodyscyplina) — podstawa lean w zakładach produkcyjnych.',
  'kaizen': 'Filozofia ciągłego doskonalenia małymi krokami — na rozmowie w produkcji warto mieć przykład własnego usprawnienia stanowiska.',
  'iso 9001': 'Norma systemu zarządzania jakością — określa, jak firma dokumentuje procesy i reaguje na niezgodności.',
  'wms': 'Warehouse Management System — system zarządzania magazynem sterujący przyjęciami, kompletacją i inwentaryzacją.',
  'kompletacja': 'Zbieranie towarów z magazynu według zamówienia (picking). Pracodawcy pytają o wydajność i dokładność — przygotuj liczby, jeśli je znasz.',
};

/** Czy słownik zna ten termin (case-insensitive). */
export function hasGlossaryDefinition(term: string): boolean {
  return Boolean(INTERVIEW_GLOSSARY_DICTIONARY[term.trim().toLowerCase()]);
}

/**
 * Zwraca definicję dla danego terminu (case-insensitive), a jeśli go nie ma w słowniku —
 * generyczny fallback, żeby sekcja glosariusza nigdy nie zawierała pustego opisu.
 */
export function lookupGlossaryDefinition(term: string, jobTitle: string): string {
  const key = term.trim().toLowerCase();
  const known = INTERVIEW_GLOSSARY_DICTIONARY[key];
  if (known) return known;
  return `Kluczowy termin z oferty na stanowisko ${jobTitle || 'to, na które aplikujesz'} — upewnij się, że potrafisz go wyjaśnić własnymi słowami podczas rozmowy.`;
}
