import { DynamicTokenInterviewQuestion } from './types';

/**
 * 25 pytań szablonowych z pauzą na tokeny (Dynamic API Injection / Slot-filling).
 * Wypełniane na żywo zmiennymi z profilu kandydata, ogłoszenia o pracę (JD) lub wywołania API.
 */
export const TOKEN_INJECTED_INTERVIEW_QUESTIONS: DynamicTokenInterviewQuestion[] = [
  // =========================================================================
  // 1-5: LUKI KOMPETENCYJNE I DOWODZENIE EKWIWALENCJI
  // =========================================================================
  {
    id: 'token_q01',
    template: 'W ogłoszeniu na stanowisko {{rola}} kluczowym wymaganiem jest {{luka_kompetencyjna}}. Jakie masz doświadczenie z tą technologią lub jej bezpośrednim odpowiednikiem?',
    requiredTokens: ['rola', 'luka_kompetencyjna'],
    category: 'TECHNICAL',
    intent: 'Bada czy kandydat potrafi w ułamku sekundy obronić lukę kompetencyjną, wskazując ekwiwalencję pojęciową i narzędzia bliźniacze.',
    starFrameworkGuide: 'Przyznaj punkt wyjścia -> Wskaż narzędzie równoważne (np. PostgreSQL vs MySQL, TIG vs MAG) -> Udowodnij szybkość wdrożenia.',
    fallbackQuestion: 'W ogłoszeniu pojawia się technologia, której nie wymieniłeś w CV. W jaki sposób szybko nadrabiasz tę kompetencję?',
    defaultTokens: {
      rola: 'specjalisty',
      luka_kompetencyjna: 'wymagana technologia',
    },
    tags: ['skill_bridge', 'luka', 'ekwiwalencja'],
  },
  {
    id: 'token_q02',
    template: 'Pracując jako {{rola}}, jak radziłeś sobie z operacjami na {{obiekt}} przy użyciu {{narzedzie}}?',
    requiredTokens: ['rola', 'obiekt', 'narzedzie'],
    category: 'TECHNICAL',
    intent: 'Weryfikuje autentyczność doświadczenia i twardą biegłość w posługiwaniu się narzędziami branżowymi.',
    starFrameworkGuide: 'Kontekst zlecenia -> Specyfika obiektu -> Dokładna procedura i parametry narzędzia -> Wynik kontroli jakości.',
    fallbackQuestion: 'Jak w praktyce posługujesz się swoimi głównymi narzędziami pracy w codziennych zadaniach?',
    defaultTokens: {
      rola: 'specjalista',
      obiekt: 'systemy operacyjne',
      narzedzie: 'dedykowane oprogramowanie',
    },
    tags: ['narzedzia', 'praktyka', 'obiekt'],
  },
  {
    id: 'token_q03',
    template: 'W firmie {{firma}} osiągnąłeś wynik: {{metryka}}. Jakie konkretne decyzje pod Twoim nadzorem doprowadziły do tej liczby?',
    requiredTokens: ['firma', 'metryka'],
    category: 'BEHAVIORAL',
    intent: 'Sprawdza sprawczość (I vs We) i czy liczba w CV to autentyczna zasługa kandydata, a nie dzieło przypadku.',
    starFrameworkGuide: 'Punkt wyjścia przed zmianą -> Twoje autorskie działania -> Wskaźnik {{metryka}} jako efekt końcowy.',
    fallbackQuestion: 'Opowiedz o metryce lub wyniku liczbowym ze swojego CV i jak go wypracowałeś.',
    defaultTokens: {
      firma: 'poprzedniej firmie',
      metryka: 'znacząca poprawa efektywności',
    },
    tags: ['metryki', 'sprawczość', 'kpi'],
  },
  {
    id: 'token_q04',
    template: 'W jaki sposób wykorzystywałeś uprawnienie {{uprawnienie}} podczas realizacji zadań obejmujących {{obiekt}}?',
    requiredTokens: ['uprawnienie', 'obiekt'],
    category: 'TRADE',
    intent: 'Bada legalność i bezpieczeństwo prac podlegających pod dozór techniczny, energetyczny lub formalny.',
    starFrameworkGuide: 'Zakres odpowiedzialności wynikający z uprawnienia -> Zastosowanie procedur -> Bezpieczny odbiór prac.',
    fallbackQuestion: 'Jak Twoje certyfikaty i uprawnienia przekładają się na codzienne bezpieczeństwo na stanowisku pracy?',
    defaultTokens: {
      uprawnienie: 'uprawnienia zawodowe',
      obiekt: 'instalacje specjalistyczne',
    },
    tags: ['uprawnienia', 'sep', 'udt', 'certyfikaty'],
  },
  {
    id: 'token_q05',
    template: 'Podczas projektu {{projekt}} na stanowisku {{rola}}, co było największym wyzwaniem technicznym i jak je rozwiązałeś?',
    requiredTokens: ['projekt', 'rola'],
    category: 'TECHNICAL',
    intent: 'Bada głębokość zaangażowania w konkretne wdrożenie z portfolio kandydata.',
    starFrameworkGuide: 'Skala projektu -> Przeszkoda krytyczna -> Zaprojektowane rozwiązanie -> Sukces wdrożenia.',
    fallbackQuestion: 'Opowiedz o najbardziej złożonym projekcie ze swojego portfolio i jak nim zarządzałeś.',
    defaultTokens: {
      projekt: 'kluczowego wdrożenia',
      rola: 'odpowiedzialnego inżyniera',
    },
    tags: ['projekty', 'portfolio', 'wyzwania'],
  },

  // =========================================================================
  // 6-10: DIAGNOSTYKA, SLA, AWARIE I CZAS REAKCJI
  // =========================================================================
  {
    id: 'token_q06',
    template: 'Gdy {{obiekt}} uległ nagłej awarii, a czas reakcji wynosił {{czas_reakcji}}, jakie kroki diagnostyczne podjąłeś za pomocą {{narzedzie}}?',
    requiredTokens: ['obiekt', 'czas_reakcji', 'narzedzie'],
    category: 'TECHNICAL',
    intent: 'Bada opanowanie i algorytmiczne podejście do gaszenia incydentów krytycznych pod presją SLA.',
    starFrameworkGuide: 'Otrzymanie alertu (SLA {{czas_reakcji}}) -> Szybka izolacja usterki narzędziem {{narzedzie}} -> Naprawa i weryfikacja.',
    fallbackQuestion: 'Jak postępujesz w przypadku awarii o najwyższym priorytecie z krótkim czasem na reakcję?',
    defaultTokens: {
      obiekt: 'główny moduł produkcyjny',
      czas_reakcji: 'poniżej 15 minut',
      narzedzie: 'aparatury diagnostycznej',
    },
    tags: ['sla', 'awaria', 'czas_reakcji'],
  },
  {
    id: 'token_q07',
    template: 'W jaki sposób procedura {{procedura}} chroniła procesy w {{firma}} przed błędami operacyjnymi?',
    requiredTokens: ['procedura', 'firma'],
    category: 'TRADE',
    intent: 'Bada szacunek do procedur standardowych (SOP/BHP) i świadomość ryzyk operacyjnych.',
    starFrameworkGuide: 'Zagrożenie wyjściowe -> Zastosowanie procedury {{procedura}} -> Efekt w postaci bezawaryjnej pracy.',
    fallbackQuestion: 'Jakie standardowe procedury jakościowe lub bezpieczeństwa są dla Ciebie kluczowe w pracy?',
    defaultTokens: {
      procedura: 'kontroli jakości',
      firma: 'Twoim zespole',
    },
    tags: ['procedury', 'sop', 'bezpieczeństwo'],
  },
  {
    id: 'token_q08',
    template: 'Opowiedz o sytuacji, gdy klient {{klient}} zażądał niestandardowej modyfikacji w obrębie {{obiekt}}. Jak poprowadziłeś te uzgodnienia?',
    requiredTokens: ['klient', 'obiekt'],
    category: 'CLIENT',
    intent: 'Bada umiejętność zarządzania zakresem i kompromisami bez psucia relacji z partnerem zewnętrznym.',
    starFrameworkGuide: 'Żądanie klienta {{klient}} -> Ocena wykonalności technicznej dla {{obiekt}} -> Wypracowanie konsensusu.',
    fallbackQuestion: 'Jak rozmawiasz z wymagającym klientem, który oczekuje zmian wykraczających poza standard?',
    defaultTokens: {
      klient: 'strategiczny kontrahent',
      obiekt: 'wdrażanego rozwiązania',
    },
    tags: ['klient', 'zakres', 'negocjacje'],
  },
  {
    id: 'token_q09',
    template: 'Aplikując na rolę {{rola}}, jak planujesz wykorzystać swoje dotychczasowe doświadczenie z {{narzedzie}} w pierwszych 30 dniach pracy?',
    requiredTokens: ['rola', 'narzedzie'],
    category: 'BEHAVIORAL',
    intent: 'Bada wizję wdrożenia (plan 30-60-90) i szybki zwrot z inwestycji w kandydata.',
    starFrameworkGuide: 'Diagnoza stanu obecnego -> Wykorzystanie {{narzedzie}} do szybkiego sukcesu (quick win) -> Skalowanie procesów.',
    fallbackQuestion: 'Jaki jest Twój plan działania na pierwsze tygodnie po objęciu nowego stanowiska?',
    defaultTokens: {
      rola: 'nowe stanowisko',
      narzedzie: 'znanych narzędzi specjalistycznych',
    },
    tags: ['onboarding', 'plan', 'quick_wins'],
  },
  {
    id: 'token_q10',
    template: 'Czy podczas pracy nad {{projekt}} zidentyfikowałeś dług technologiczny lub ryzyko w obszarze {{obiekt}}? Jak temu zaradziłeś?',
    requiredTokens: ['projekt', 'obiekt'],
    category: 'TECHNICAL',
    intent: 'Bada myślenie długoterminowe i dbałość o jakość utrzymaniową.',
    starFrameworkGuide: 'Wykrycie słabego punktu w {{obiekt}} -> Zgłoszenie ryzyka -> Refaktoryzacja/modernizacja.',
    fallbackQuestion: 'Jak identyfikujesz i eliminujesz dług techniczny lub ryzyka w swoich projektach?',
    defaultTokens: {
      projekt: 'poprzednich wdrożeń',
      obiekt: 'kluczowej infrastruktury',
    },
    tags: ['dług_techniczny', 'refaktoryzacja', 'ryzyko'],
  },

  // =========================================================================
  // 11-15: OPTYMALIZACJE, KOSZTY, STANDARDY BRANŻOWE
  // =========================================================================
  {
    id: 'token_q11',
    template: 'W jaki sposób wdrożenie narzędzia {{narzedzie}} pozwoliło Ci zoptymalizować wskaźnik {{metryka}}?',
    requiredTokens: ['narzedzie', 'metryka'],
    category: 'TECHNICAL',
    intent: 'Łączy technologię z twardym zwrotem z inwestycji (ROI).',
    starFrameworkGuide: 'Wąskie gardło przed wdrożeniem -> Konfiguracja {{narzedzie}} -> Osiągnięcie {{metryka}}.',
    fallbackQuestion: 'W jaki sposób nowe technologie, które wdrażałeś, wpłynęły na wymierne wyniki Twojej pracy?',
    defaultTokens: {
      narzedzie: 'nowoczesnego narzędzia',
      metryka: 'czas realizacji zadań',
    },
    tags: ['optymalizacja', 'roi', 'kpi'],
  },
  {
    id: 'token_q12',
    template: 'Jakie normy i wymogi prawne regulują Twoją pracę z {{obiekt}} pod kątem certyfikatu {{uprawnienie}}?',
    requiredTokens: ['obiekt', 'uprawnienie'],
    category: 'TRADE',
    intent: 'Bada formalne przygotowanie zawodowe i rygor prawny w pracach technicznych.',
    starFrameworkGuide: 'Wskazanie normy (PN-EN / ISO / Rozporządzenie) -> Procedura weryfikacji -> Czysty protokół.',
    fallbackQuestion: 'Jakie normy prawne i techniczne są kluczowe w Twojej codziennej pracy specjalistycznej?',
    defaultTokens: {
      obiekt: 'instalacjami technicznymi',
      uprawnienie: 'uprawnień zawodowych',
    },
    tags: ['normy', 'prawo', 'uprawnienia'],
  },
  {
    id: 'token_q13',
    template: 'Gdy w {{firma}} doszło do rozbieżności z procedurą {{procedura}}, jakie działania korygujące podjąłeś jako {{rola}}?',
    requiredTokens: ['firma', 'procedura', 'rola'],
    category: 'LEADERSHIP',
    intent: 'Bada asertywność jakościową i korygowanie nieprawidłowości w procesie.',
    starFrameworkGuide: 'Wykrycie odchylenia od {{procedura}} -> Rozmowa z odpowiedzialnymi osobami -> Wdrożenie korekty.',
    fallbackQuestion: 'Co robisz, gdy zauważasz, że w zespole nie są przestrzegane ustalone standardy?',
    defaultTokens: {
      firma: 'poprzedniej pracy',
      procedura: 'obowiązującą procedurą',
      rola: 'specjalista',
    },
    tags: ['leadership', 'korekta', 'jakość'],
  },
  {
    id: 'token_q14',
    template: 'Opowiedz jak budowałeś zaufanie i relacje partnerskie z {{klient}} podczas realizacji wdrożenia {{projekt}}.',
    requiredTokens: ['klient', 'projekt'],
    category: 'CLIENT',
    intent: 'Bada umiejętność budowy długoterminowych relacji B2B i rzetelnej komunikacji.',
    starFrameworkGuide: 'Oczekiwania {{klient}} -> Transparentne raportowanie postępów {{projekt}} -> Odbiór bez zastrzeżeń.',
    fallbackQuestion: 'W jaki sposób budujesz długofalowe relacje i zaufanie z kluczowymi partnerami biznesowymi?',
    defaultTokens: {
      klient: 'głównym klientem',
      projekt: 'kluczowego kontraktu',
    },
    tags: ['relacje', 'klient', 'zaufanie'],
  },
  {
    id: 'token_q15',
    template: 'Jakie ograniczenia techniczne napotkałeś w pracy z {{narzedzie}} i czym uzupełniłeś jego funkcjonalność?',
    requiredTokens: ['narzedzie'],
    category: 'TECHNICAL',
    intent: 'Bada dogłębną znajomość narzędzia – nie tylko zalet marketingowych, ale i wad oraz przypadków brzegowych.',
    starFrameworkGuide: 'Słaby punkt {{narzedzie}} -> Własne obejście (workaround) / moduł uzupełniający -> Stabilny proces.',
    fallbackQuestion: 'Jakie są największe wady Twojego głównego narzędzia pracy i jak sobie z nimi radzisz?',
    defaultTokens: {
      narzedzie: 'głównym oprogramowaniem',
    },
    tags: ['narzedzia', 'edge_cases', 'architektura'],
  },

  // =========================================================================
  // 16-20: SKALOWALNOŚĆ, BEZPIECZEŃSTWO I REAKCJA NA KRYZYS
  // =========================================================================
  {
    id: 'token_q16',
    template: 'W jaki sposób skalowałeś wydajność {{obiekt}}, gdy obciążenie w {{firma}} wzrosło wielokrotnie?',
    requiredTokens: ['obiekt', 'firma'],
    category: 'TECHNICAL',
    intent: 'Bada projektowanie pod dużą skalę, eliminację wąskich gardeł i odporność na przeciążenia.',
    starFrameworkGuide: 'Wzrost wolumenu -> Analiza obciążenia {{obiekt}} -> Optymalizacja i stabilizacja.',
    fallbackQuestion: 'Jak radzisz sobie ze skalowaniem procesów i systemów przy gwałtownym wzroście skali działania?',
    defaultTokens: {
      obiekt: 'systemów i procesów',
      firma: 'organizacji',
    },
    tags: ['skalowanie', 'wydajność', 'high_load'],
  },
  {
    id: 'token_q17',
    template: 'Jakie zabezpieczenia wdrożyłeś dla {{obiekt}}, aby spełnić wymogi procedury {{procedura}}?',
    requiredTokens: ['obiekt', 'procedura'],
    category: 'TRADE',
    intent: 'Bada prewencję techniczną i audytowalność rozwiązań.',
    starFrameworkGuide: 'Wymagania {{procedura}} -> Konfiguracja zabezpieczeń dla {{obiekt}} -> Wynik audytu.',
    fallbackQuestion: 'Jak projektujesz zabezpieczenia i mechanizmy kontroli w swoich codziennych zadaniach?',
    defaultTokens: {
      obiekt: 'stanowiska pracy',
      procedura: 'bezpieczeństwa',
    },
    tags: ['bezpieczeństwo', 'audyt', 'zgodność'],
  },
  {
    id: 'token_q18',
    template: 'Biorąc pod uwagę Twoją rolę {{rola}}, jak poradziłeś sobie z redukcją czasu {{czas_reakcji}} w sytuacjach kryzysowych?',
    requiredTokens: ['rola', 'czas_reakcji'],
    category: 'BEHAVIORAL',
    intent: 'Bada optymalizację czasu reakcji i eliminację przestojów operacyjnych.',
    starFrameworkGuide: 'Stan wyjściowy -> Automatyzacja powiadomień i procedur -> Osiągnięcie {{czas_reakcji}}.',
    fallbackQuestion: 'W jaki sposób skracasz czas reakcji na nieprzewidziane incydenty i zgłoszenia?',
    defaultTokens: {
      rola: 'lidera operacyjnego',
      czas_reakcji: 'czasu obsługi zgłoszenia',
    },
    tags: ['reakcja', 'kryzys', 'czas'],
  },
  {
    id: 'token_q19',
    template: 'Jak Twoje doświadczenie z {{luka_kompetencyjna}} w połączeniu ze znajomością {{narzedzie}} pozwoli Ci rozwiązać wyzwania w naszej firmie?',
    requiredTokens: ['luka_kompetencyjna', 'narzedzie'],
    category: 'TECHNICAL',
    intent: 'Mostkuje profil kandydata bezpośrednio z potrzebami rekrutującej firmy.',
    starFrameworkGuide: 'Ekwiwalencja {{luka_kompetencyjna}} i {{narzedzie}} -> Przykłady z przeszłości -> Wartość dodana dla firmy.',
    fallbackQuestion: 'W jaki sposób Twoje unikalne połączenie umiejętności wyróżnia Cię spośród innych kandydatów?',
    defaultTokens: {
      luka_kompetencyjna: 'nowymi technologiami',
      narzedzie: 'sprawdzonym warsztatem',
    },
    tags: ['dopasowanie', 'wartość', 'rekrutacja'],
  },
  {
    id: 'token_q20',
    template: 'Opowiedz o sytuacji, gdy pracując na {{obiekt}} w {{firma}}, musiałeś przekazać trudną informację techniczną osobom nietechnicznym.',
    requiredTokens: ['obiekt', 'firma'],
    category: 'BEHAVIORAL',
    intent: 'Bada umiejętność tłumaczenia skomplikowanego żargonu technicznego na prosty język korzyści i ryzyk biznesowych.',
    starFrameworkGuide: 'Problem z {{obiekt}} -> Użycie prostych analogii i faktów -> Zrozumienie i zgoda decydentów.',
    fallbackQuestion: 'Jak tłumaczysz skomplikowane zagadnienia techniczne klientom lub zarządowi?',
    defaultTokens: {
      obiekt: 'infrastrukturze',
      firma: 'poprzedniej pracy',
    },
    tags: ['komunikacja', 'żargon', 'prezentacja'],
  },

  // =========================================================================
  // 21-25: ZARZĄDZANIE PROJEKTEM, KPI I DOWODY OSIĄGNIĘĆ
  // =========================================================================
  {
    id: 'token_q21',
    template: 'Jakie kluczowe kamienie milowe w projekcie {{projekt}} zrealizowałeś przed czasem i dzięki jakim decyzjom?',
    requiredTokens: ['projekt'],
    category: 'LEADERSHIP',
    intent: 'Bada metodykę zarządzania harmonogramem (Scrum, Kanban, Critical Path) i proaktywne usuwanie blokerów.',
    starFrameworkGuide: 'Harmonogram {{projekt}} -> Identyfikacja ścieżki krytycznej -> Dowiezienie etapu przed terminem.',
    fallbackQuestion: 'W jaki sposób dbasz o terminowość i dotrzymywanie kamieni milowych w swoich projektach?',
    defaultTokens: {
      projekt: 'wdrożeniowym',
    },
    tags: ['harmonogram', 'terminy', 'kamienie_milowe'],
  },
  {
    id: 'token_q22',
    template: 'W jaki sposób weryfikujesz poprawność wykonania prac na {{obiekt}} przed podpisaniem protokołu odbioru?',
    requiredTokens: ['obiekt'],
    category: 'TRADE',
    intent: 'Bada odpowiedzialność za podpis pod protokołem i rygor badań odbiorczych.',
    starFrameworkGuide: 'Checklista odbiorcza dla {{obiekt}} -> Przeprowadzenie prób i testów -> Podpisanie protokołu bez usterek.',
    fallbackQuestion: 'Jak wygląda Twoja checklista odbiorcza przed ostatecznym oddaniem prac?',
    defaultTokens: {
      obiekt: 'gotowej instalacji',
    },
    tags: ['odbiory', 'protokoły', 'odpowiedzialność'],
  },
  {
    id: 'token_q23',
    template: 'Gdybyś miał od zera wdrożyć {{narzedzie}} w nowym zespole, od jakich 3 kroków byś zaczął?',
    requiredTokens: ['narzedzie'],
    category: 'LEADERSHIP',
    intent: 'Bada wiedzę wdrożeniową, zarządzanie zmianą (change management) i szkolenie ludzi.',
    starFrameworkGuide: 'Krok 1: Analiza potrzeb -> Krok 2: PoC i standardy -> Krok 3: Warsztaty i monitoring adopcji.',
    fallbackQuestion: 'Jak wprowadzasz nowe narzędzie lub technologię do zespołu, który jest przyzwyczajony do starych metod?',
    defaultTokens: {
      narzedzie: 'nowy standard techniczny',
    },
    tags: ['change_management', 'wdrożenie', 'szkolenie'],
  },
  {
    id: 'token_q24',
    template: 'Jaki wpływ na wynik {{metryka}} miało Twoje zaangażowanie w procedurę {{procedura}} w firmie {{firma}}?',
    requiredTokens: ['metryka', 'procedura', 'firma'],
    category: 'BEHAVIORAL',
    intent: 'Weryfikuje korelację między przestrzeganiem standardów a wymiernym sukcesem biznesowym.',
    starFrameworkGuide: 'Wdrożenie {{procedura}} w {{firma}} -> Egzekucja standardu -> Osiągnięcie {{metryka}}.',
    fallbackQuestion: 'W jaki sposób Twoja dbałość o procedury przełożyła się na wymierne wyniki firmy?',
    defaultTokens: {
      metryka: 'spadek wskaźnika awaryjności',
      procedura: 'prewencyjnego utrzymania',
      firma: 'poprzedniej organizacji',
    },
    tags: ['metryki', 'procedury', 'sukces'],
  },
  {
    id: 'token_q25',
    template: 'Aplikując jako {{rola}}, jakie doświadczenie zdobyte w {{firma}} uważasz za swoją największą przewagę konkurencyjną?',
    requiredTokens: ['rola', 'firma'],
    category: 'BEHAVIORAL',
    intent: 'Pozwala kandydatowi sformułować mocny Elevator Pitch podsumowujący unikalną wartość dla nowego pracodawcy.',
    starFrameworkGuide: 'Doświadczenie z {{firma}} -> Kluczowe unikalne kompetencje -> Bezpośrednia korzyść na stanowisku {{rola}}.',
    fallbackQuestion: 'Co uważasz za swoją największą przewagę konkurencyjną na to stanowisko?',
    defaultTokens: {
      rola: 'kandydata na to stanowisko',
      firma: 'dotychczasowej karierze',
    },
    tags: ['pitch', 'przewaga', 'wartość'],
  },
];
