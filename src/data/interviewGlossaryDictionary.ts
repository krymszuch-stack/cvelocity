/**
 * Lokalny słownik definicji pojęć branżowych/technicznych używany przez
 * interviewCheatSheetEngine.ts do budowy sekcji "Glosariusz" bez wywołania Gemini.
 * Klucze porównywane są case-insensitive (patrz lookupGlossaryDefinition).
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

  // Spawalnictwo i obróbka metali
  'mig': 'Metal Inert Gas — metoda spawania łukiem elektrycznym w osłonie gazu obojętnego (argon), popularna przy aluminium i stali nierdzewnej.',
  'mag': 'Metal Active Gas — metoda spawania łukiem elektrycznym w osłonie gazu aktywnego (CO₂ lub mieszanki), najczęściej stosowana w przemyśle stalowym.',
  'tig': 'Tungsten Inert Gas — precyzyjna metoda spawania elektrodą wolframową w osłonie argonu, stosowana tam, gdzie liczy się estetyka i jakość spoiny.',
  'mig/mag': 'Spawanie łukowe w osłonie gazów — MIG (gaz obojętny) i MAG (gaz aktywny). Najczęściej spotykane metody spawania w przemyśle.',
  'spawanie': 'Proces trwałego łączenia metali przez stopienie krawędzi elementów, często z użyciem materiału dodatkowego (drutu/elektrody).',

  // Uprawnienia i certyfikaty przemysłowe
  'udt': 'Urząd Dozoru Technicznego — instytucja wydająca uprawnienia do obsługi urządzeń technicznych (wózki widłowe, suwnice, żurawie, dźwigi).',
  'sep': 'Stowarzyszenie Elektryków Polskich — wydaje świadectwa kwalifikacyjne E (eksploatacja) i D (dozór) uprawniające do pracy przy urządzeniach elektrycznych.',
  'sep e': 'Świadectwo kwalifikacyjne SEP kategorii E (eksploatacja) — uprawnia do obsługi i konserwacji urządzeń elektroenergetycznych.',
  'sep d': 'Świadectwo kwalifikacyjne SEP kategorii D (dozór) — uprawnia do nadzorowania pracy urządzeń elektroenergetycznych.',

  // Bezpieczeństwo żywności i gastronomia
  'haccp': 'Hazard Analysis and Critical Control Points — system zapewnienia bezpieczeństwa żywności przez identyfikację i kontrolę zagrożeń na każdym etapie produkcji.',
  'ghp': 'Good Hygiene Practice — Dobra Praktyka Higieniczna, zestaw zasad zapewniających higieniczne warunki produkcji żywności.',
  'gmp': 'Good Manufacturing Practice — Dobra Praktyka Produkcyjna, system zapewnienia jakości w produkcji (żywność, farmacja, kosmetyki).',
  'sanepid': 'Stacja Sanitarno-Epidemiologiczna — organ kontrolujący warunki higieniczne i sanitarne w zakładach pracy, gastronomii i handlu.',

  // BHP i prawo pracy
  'bhp': 'Bezpieczeństwo i Higiena Pracy — zbiór przepisów i zasad zapobiegania wypadkom i chorobom zawodowym w miejscu pracy.',
  'ppoż': 'Ochrona przeciwpożarowa — zasady, przepisy i środki techniczne zapobiegające pożarom i ograniczające ich skutki.',
  'ohsas': 'Occupational Health and Safety Assessment Series — międzynarodowy standard zarządzania bezpieczeństwem i higieną pracy (obecnie zastąpiony przez ISO 45001).',
  'iso 45001': 'Międzynarodowy standard systemu zarządzania bezpieczeństwem i higieną pracy, następca OHSAS 18001.',

  // Logistyka i magazynowanie
  'wms': 'Warehouse Management System — system informatyczny do zarządzania pracą magazynu (przyjęcia, wydania, lokalizacje, inwentaryzacja).',
  'wózek widłowy': 'Pojazd do transportu i podnoszenia ładunków w magazynach — do obsługi wymagane uprawnienia UDT.',
  'fifo': 'First In, First Out — zasada rotacji zapasów: towar przyjęty najwcześniej jest wydawany jako pierwszy.',
  'lifo': 'Last In, First Out — zasada rotacji zapasów: towar przyjęty najpóźniej jest wydawany jako pierwszy.',
  'supply chain': 'Łańcuch dostaw — cały przepływ towarów od surowca przez produkcję, magazynowanie, transport aż do klienta końcowego.',

  // Budownictwo
  'kosztorys': 'Dokument określający przewidywane koszty robót budowlanych na podstawie przedmiaru i cen jednostkowych.',
  'uprawnienia budowlane': 'Kwalifikacje nadawane przez izbę inżynierów, uprawniające do projektowania lub kierowania robotami budowlanymi.',

  // Księgowość i finanse (rozszerzenie)
  'kpir': 'Księga Przychodów i Rozchodów — uproszczona forma ewidencji podatkowej dla małych przedsiębiorstw.',
  'vat': 'Value Added Tax — podatek od towarów i usług doliczany do ceny na każdym etapie obrotu.',
  'pit': 'Personal Income Tax — podatek dochodowy od osób fizycznych odprowadzany od wynagrodzeń i dochodów.',
  'cit': 'Corporate Income Tax — podatek dochodowy od osób prawnych (spółek, fundacji itp.).',
  'zus': 'Zakład Ubezpieczeń Społecznych — instytucja obsługująca składki i świadczenia z ubezpieczeń społecznych (emerytury, renty, zasiłki).',

  // Opieka zdrowotna
  'opieka paliatywna': 'Specjalistyczna opieka medyczna nad pacjentami z zaawansowanymi chorobami, nastawiona na łagodzenie bólu i poprawę jakości życia.',
  'triażowanie': 'Segregacja pacjentów według pilności stanu zdrowia w celu ustalenia kolejności udzielania pomocy medycznej.',
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
