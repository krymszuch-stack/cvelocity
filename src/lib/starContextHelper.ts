/**
 * starContextHelper.ts — Logika dynamicznego dobierania kontekstu STAR
 * na podstawie nazwy stanowiska (Lekarz, Monter, Magazynier, Handlowiec, IT itp.)
 */

export type IndustryDomain = 'medical' | 'tech' | 'logistics' | 'sales' | 'mgmt' | 'it' | 'general';

export interface StarContextConfig {
  domain: IndustryDomain;
  domainLabel: string;
  placeholder: string;
  defaultVerbs: string[];
}

export function detectIndustryFromRole(roleTitle?: string): IndustryDomain {
  if (!roleTitle || typeof roleTitle !== 'string') return 'general';
  const norm = roleTitle.toLowerCase();

  // Medycyna / Zdrowie
  if (
    /(lekarz|doktor|pielęgniar|ratownik|medyc|farmaceut|fizjoterapeut|rehabilitant|szpital|przychodni|dentyst|stomatolog|położn|diagnost)/i.test(
      norm
    )
  ) {
    return 'medical';
  }

  // Techniczne / Monter / Spawacz / Utrzymanie Ruchu / Budownictwo
  if (
    /(monter|spawacz|instalator|elektryk|mechanik|serwisant|technik|budowl|operator maszyn|utrzyman|tokarz|ślusarz|cieśla|hydraulik|automatyk)/i.test(
      norm
    )
  ) {
    return 'tech';
  }

  // Magazyn / Logistyka / Kierowca
  if (
    /(magazyn|wózk|logist|kierowca|spedytor|kurier|dyspozytor|zaopatrzeni|wms|dostawc)/i.test(
      norm
    )
  ) {
    return 'logistics';
  }

  // Sprzedaż / Obsługa klienta / Gastronomia
  if (
    /(sprzeda|handlow|account|doradca|kasjer|kelner|barista|recepcjon|b2b|call center|obsług|przedstawiciel|reprezentant)/i.test(
      norm
    )
  ) {
    return 'sales';
  }

  // Zarządzanie / HR / Finanse / Administracja
  if (
    /(menedżer|manager|kierownik|dyrektor|lider|koordynator|rekruter|księgow|analityk|administracj|hr|kadrow)/i.test(
      norm
    )
  ) {
    return 'mgmt';
  }

  // IT & Software
  if (
    /(developer|programist|inżynier oprogramowania|frontend|backend|fullstack|devops|tester|qa|data|software|administrator it|sieciow)/i.test(
      norm
    )
  ) {
    return 'it';
  }

  return 'general';
}

export function getStarContextConfig(roleTitle?: string): StarContextConfig {
  const domain = detectIndustryFromRole(roleTitle);

  switch (domain) {
    case 'medical':
      return {
        domain: 'medical',
        domainLabel: 'Medycyna & Zdrowie',
        placeholder:
          'np. Przeprowadziłem 200+ procedur diagnostycznych na oddziale, skracając czas oczekiwania pacjentów o 25% przy 100% zgodności z procedurami NFZ...',
        defaultVerbs: [
          'Przeprowadziłem procedury',
          'Wdrożyłem procedurę triage',
          'Zdiagnozowałem i zabezpieczyłem',
          'Skróciłem czas oczekiwania pacjentów o',
          'Skoordynowałem dyżur medyczny',
          'Nadzorowałem opiekę nad',
        ],
      };

    case 'tech':
      return {
        domain: 'tech',
        domainLabel: 'Techniczne & Produkcja',
        placeholder:
          'np. Zdiagnozowałem i naprawiłem 120+ awarii pieców kondensacyjnych Vaillant, uzyskując 98% napraw przy 1. wizycie i 0 reklamacji protokołów SEP...',
        defaultVerbs: [
          'Zmontowałem i podłączyłem',
          'Zdiagnozowałem i naprawiłem',
          'Wykonałem spawy (TIG/MAG)',
          'Skróciłem czas przestoju linii o',
          'Przeprowadziłem próby ciśnieniowe',
          'Wdrożyłem plan prewencji TPM',
        ],
      };

    case 'logistics':
      return {
        domain: 'logistics',
        domainLabel: 'Magazyn & Logistyka',
        placeholder:
          'np. Obsługiwałem wózek wysokiego składu (UDT) w systemie SAP WMS, osiągając średnio 45 pobrań/h przy 0 błędach kompletacji...',
        defaultVerbs: [
          'Zoptymalizowałem strefę w WMS',
          'Obsługiwałem wózek (UDT)',
          'Zredukowałem uszkodzenia palet o',
          'Zwiększyłem wydajność pobrań do',
          'Skoordynowałem odprawę aut ciężarowych',
          'Przeprowadziłem inwentaryzację',
        ],
      };

    case 'sales':
      return {
        domain: 'sales',
        domainLabel: 'Sprzedaż & Klient',
        placeholder:
          'np. Wynegocjowałem warunki handlowe z 20 kluczowymi kontrahentami, realizując 125% rocznego planu sprzedaży B2B...',
        defaultVerbs: [
          'Wynegocjowałem warunki',
          'Zwiększyłem sprzedaż o',
          'Pozyskałem nowych klientów kluczowych',
          'Podniosłem wskaźnik satysfakcji CSAT do',
          'Skróciłem czas finalizacji transakcji o',
          'Wdrożyłem standardy obsługi',
        ],
      };

    case 'mgmt':
      return {
        domain: 'mgmt',
        domainLabel: 'Zarządzanie & Operacje',
        placeholder:
          'np. Zreorganizowałem obieg dokumentów i procedury akceptacji, skracając czas realizacji spraw z 7 dni do 24 godzin w 12-osobowym zespole...',
        defaultVerbs: [
          'Zreorganizowałem proces',
          'Wynegocjowałem oszczędności na poziomie',
          'Wdrożyłem system obiegu zadań',
          'Skoordynowałem zespół realizujący',
          'Przeprowadziłem audyt zgodności',
          'Zoptymalizowałem budżet operacyjny o',
        ],
      };

    case 'it':
      return {
        domain: 'it',
        domainLabel: 'IT & Software',
        placeholder:
          'np. Zaprojektowałem architekturę mikroserwisów w Node.js/TypeScript, redukując średni czas odpowiedzi API z 450ms do 80ms...',
        defaultVerbs: [
          'Zaprojektowałem i wdrożyłem',
          'Zoptymalizowałem zapytania SQL/indeksy',
          'Zautomatyzowałem potok CI/CD',
          'Zrefaktoryzowałem kluczowy moduł',
          'Zredukowałem czas ładowania (LCP) o',
          'Zmigrowałem infrastrukturę do',
        ],
      };

    default:
      return {
        domain: 'general',
        domainLabel: 'Wzorce Uniwersalne',
        placeholder:
          'np. Zrealizowałem [zadanie/projekt] z użyciem [narzędzia/metody], osiągając [mierzalny rezultat, np. wzrost o 25%, skrócenie czasu o 40%, 0 reklamacji]...',
        defaultVerbs: [
          'Zoptymalizowałem',
          'Wdrożyłem',
          'Zdiagnozowałem i naprawiłem',
          'Zrealizowałem projekt',
          'Zredukowałem czas/koszty o',
          'Skoordynowałem działania',
        ],
      };
  }
}
