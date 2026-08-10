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
};

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
