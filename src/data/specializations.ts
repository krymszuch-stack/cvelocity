export interface ProfessionSubRole {
  id: string;
  title: string;
  description: string;
  brandsAndManufacturers?: string[]; // np. Ariston, Junkers, Vaillant / React, Trados
  certificationsAndQualifications: string[]; // np. Uprawnienia SEP G3, Wpis na Listę Tłumaczy Przysięgłych MS
  specializedVocabulary: string[]; // np. Analiza spalin, Tłumaczenia kabinowe w czasie rzeczywistym
  suggestedTools: string[];
  suggestedHardSkills: string[];
  suggestedSoftSkills: string[];
  sampleCompany?: string;
  samplePeriod?: { start: string; end: string };
  sampleMetrics?: string[];
}

export interface SectorCategory {
  id: string;
  name: string;
  iconName: string;
  badgeColor: string;
  description: string;
  subRoles: ProfessionSubRole[];
}

export const SECTOR_CATEGORIES: SectorCategory[] = [
  {
    id: 'hvac_installations',
    name: 'Instalacje, Serwis Gazowy & HVAC',
    iconName: 'Flame',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Montaż, konserwacja, przeglądy okresowe oraz serwis urządzeń grzewczych, gazowych i klimatyzacji.',
    subRoles: [
      {
        id: 'gas_heating_technician',
        title: 'Monter & Serwisant Piecyków i Kotłów Gazowych',
        description: 'Diagnostyka awarii, przeglądy okresowe, próby szczelności instalacji gazowych oraz czyszczenie i regulacja palników.',
        brandsAndManufacturers: ['Junkers / Bosch', 'Ariston', 'Vaillant', 'Viessmann', 'Termet', 'Beretta', 'Saunier Duval', 'De Dietrich'],
        certificationsAndQualifications: ['Uprawnienia SEP G3 (Dozór i Eksploatacja Gazowa)', 'Certyfikat F-Gaz', 'Uprawnienia UDT na Urządzenia Ciśnieniowe', 'Autoryzacja Serwisowa Producenta', 'Uprawnienia SEP G1 (Elektryczne do 1kV)'],
        specializedVocabulary: ['Analiza spalin analizatorem Testo', 'Próba szczelności instalacji gazowej', 'Wymiana wymiennika ciepła', 'Regulacja armatury gazowej', 'Czyszczenie palnika i komory spalania', 'Protokół odbioru gazowego'],
        suggestedTools: ['Analizator Spalin Testo 300', 'Detektor Nieszczelności Gazowej', 'Manometr U-rurkowy', 'Zestaw Kluczy Dynamometrycznych', 'Pompa Próżniowa'],
        suggestedHardSkills: ['Diagnostyka Pieców Gazowych', 'Próby Szczelności Gazowej', 'Analiza Spalin i Emisji', 'Serwis Wymienników Warmia', 'Procedury Bezpieczeństwa Gazowego'],
        suggestedSoftSkills: ['Odpowiedzialność', 'Szybka Diagnoza w Terenie', 'Kultura Osobista u Klienta'],
        sampleCompany: 'Serwis Gazowy / Junkers-Ariston Tech',
        samplePeriod: { start: '2021', end: 'obecnie' },
        sampleMetrics: ['Ponad 450 wykonanych przeglądów z certyfikatem', 'Czas reakcji na awarię < 2h'],
      },
      {
        id: 'hvac_klimatyzacja',
        title: 'Technik Chłodnictwa i Klimatyzacji (HVAC)',
        description: 'Montaż klimatyzatorów Split/Multi-Split, napełnianie czynnikiem chłodniczym, próby ciśnieniowe azotem i dezynfekcja.',
        brandsAndManufacturers: ['Daikin', 'Mitsubishi Electric', 'LG Climate', 'Gree', 'Rotenso', 'Kaisai'],
        certificationsAndQualifications: ['Certyfikat F-Gazowy (F-GAS Personel)', 'Uprawnienia SEP G1 Dozór i Eksploatacja', 'Szkolenie Wysokościowe (BHP praca na wysokości)'],
        specializedVocabulary: ['Próżniowanie układu chłodniczego', 'Próba ciśnieniowa azotem (40 bar)', 'Odzysk czynnika chłodniczego R32/R410A', 'Kielichowanie rur miedzianych', 'Odgrzybianie metodą ozonowania'],
        suggestedTools: ['Stacja do odzysku czynnika', 'Waga elektroniczna do czynnika', 'Kielicharka akumulatorowa', 'Detektor wycieków freonu'],
        suggestedHardSkills: ['Montaż Klimatyzatorów Split', 'Lutowanie Twarde Rur Miedzianych', 'Próżniowanie i Napełnianie Układu', 'Serwis Pomp Ciepła'],
        suggestedSoftSkills: ['Precyzja montażu', 'Komunikatywność z inwestorem'],
      },
    ],
  },
  {
    id: 'translation_languages',
    name: 'Języki, Przekładoznawstwo & Tłumaczenia',
    iconName: 'Languages',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Tłumaczenia przysięgłe, symultaniczne, techniczne oraz lokalizacja oprogramowania i treści.',
    subRoles: [
      {
        id: 'sworn_translator',
        title: 'Tłumacz Przysięgły (Wpis na Listę Ministra Sprawiedliwości)',
        description: 'Poświadczanie dokumentów procesowych, aktów stanu cywilnego, umów spółek oraz tłumaczenia ustne w sądach i urzędach.',
        brandsAndManufacturers: ['Ministerstwo Sprawiedliwości', 'Izba Tłumaczy Przysięgłych TEPIS', 'Krajowa Szkoła Sądownictwa'],
        certificationsAndQualifications: ['Wpis na Listę Tłumaczy Przysięgłych MS', 'Egzamin Państwowy na Tłumacza Przysięgłego', 'Certyfikat Językowy C2 / Master of Arts'],
        specializedVocabulary: ['Klauzula poświadczeniowa', 'Repertorium tłumacza przysięgłego', 'Tłumaczenie poświadczone dokumentów', 'Terminologia sądowo-procesowa', 'Przekład aktów notarialnych i stanu cywilnego'],
        suggestedTools: ['Pieczęć Urzędowa Tłumacza', 'Trados Studio 2024', 'memoQ Project Manager', 'Słowniki Prawnicze i Handlowe Lex'],
        suggestedHardSkills: ['Tłumaczenia Poświadczone', 'Terminologia Prawnicza & Sądowa', 'Prowadzenie Repertorium', 'Lokalizacja Dokumentów Urzędowych'],
        suggestedSoftSkills: ['Absolutna poufność', 'Precyzja co do słowa', 'Odporność na presję w sądzie'],
        sampleCompany: 'Kancelaria Tłumacza Przysięgłego / takŻe.pro',
        samplePeriod: { start: '2023', end: 'obecnie' },
        sampleMetrics: ['Ponad 1200 wpisów w repertorium bez zastrzeżeń', 'Certyfikowany przekład umów handlowych'],
      },
      {
        id: 'simultaneous_interpreter',
        title: 'Tłumacz Symultaniczny & Kabinowy (Konferencyjny)',
        description: 'Tłumaczenia ustne w czasie rzeczywistym w kabinie na konferencjach międzynarodowych, szczytach dyplomatycznych i wydarzeniach biznesowych.',
        brandsAndManufacturers: ['Systemy Kabinowe ISO 4043', 'Sennheiser Tourguide', 'Bosch DCN Conference Systems', 'Audipack Booths'],
        certificationsAndQualifications: ['Akredytacja Unii Europejskiej (AIIC)', 'Dyplom Tłumacza Konferencyjnego', 'Certyfikat C2 Proficient Native level'],
        specializedVocabulary: ['Przekład kabinowy w czasie rzeczywistym', 'Shadowing i dekompresja myślenia', 'Notacja tłumaczeniowa (Consecutive note-taking)', 'Praca w zespole dwuosobowym w kabinie', 'Relay interpreting (tłumaczenie przez język pośredni)'],
        suggestedTools: ['Konsola Tłumacza Bosch', 'Słuchawki Sennheiser HD 25', 'Mikrofon Gęsia Szyja', 'Tablet z notatnikiem seryjnym'],
        suggestedHardSkills: ['Tłumaczenie Kabinowe w Rzeczywistym Czasie', 'Dzielenie Uwagi Słuch-Mowa', 'Notacja Konsekutywna', 'Dynamiczne Słownictwo Dyplomatyczne'],
        suggestedSoftSkills: ['Brak oporu psychicznego przed mikrofonem', 'Piorunujący czas reakcji', 'Wysokie skupienie przez 45 min'],
      },
    ],
  },
  {
    id: 'banking_finance',
    name: 'Bankowość, Finanse & Contact Center',
    iconName: 'Building2',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Procedury bankowe, wsparcie operacyjne klientów indywidualnych i firmowych, KYC/AML oraz zarządzanie zgłoszeniami SLA.',
    subRoles: [
      {
        id: 'pekao_bank_inspector',
        title: 'Inspektor ds. Obsługi Klienta i Procedur Bankowych',
        description: 'Weryfikacja tożsamości klienta, obsługa transakcji i zastrzeżeń kartowych, praca na dedykowanych systemach bankowych w reżimie procedur NBP.',
        brandsAndManufacturers: ['Bank Pekao S.A.', 'NBP (Narodowy Bank Polski)', 'BIK (Biuro Informacji Kredytowej)', 'KNF'],
        certificationsAndQualifications: ['Certyfikat Procedur Bezpieczeństwa Bankowego', 'Szkolenie Ochrony Danych Osobowych RODO', 'Uprawnienia Weryfikacji Autentyczności Dokumentów'],
        specializedVocabulary: ['Weryfikacja KYC (Know Your Customer)', 'Deeskalacja trudnych incydentów klienta', 'Zastrzeganie kart i tożsamości', 'Obsługa procedur bezpieczeństwa AML', 'Procedowanie reklamacji bankowych wg SLA'],
        suggestedTools: ['Systemy CRM Bankowe (Pekao System)', 'Centrala Telefoniczna Avaya / Genesys', 'Narzędzia BIK / KNF', 'MS Office Advanced'],
        suggestedHardSkills: ['Reżim Procedur Bankowych Pekao', 'Weryfikacja Dokumentów i Tożsamości', 'Deeskalacja Sytuacji Stresowych', 'Standardy SLA Contact Center'],
        suggestedSoftSkills: ['Empatia i Opanowanie', 'Bezkonfliktowa Komunikacja', 'Ścisłe przestrzeganie procedur'],
        sampleCompany: 'Bank Pekao S.A.',
        samplePeriod: { start: '05.2026', end: '07.2026' },
        sampleMetrics: ['Wskaźnik Jakości Obsługi: 4.40 / 5.00', 'Obsługa kilkudziesięciu zgłoszeń dziennie wg procedur Pekao'],
      },
    ],
  },
  {
    id: 'software_it',
    name: 'IT, Software Engineering & Infrastructure',
    iconName: 'Code',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Inżynieria oprogramowania, rozwój aplikacji React/Node, diagnostyka sieci i hardware E.12/E.13.',
    subRoles: [
      {
        id: 'react_frontend_engineer',
        title: 'Frontend Developer (React 19, TypeScript & Tailwind CSS)',
        description: 'Projektowanie i wdrażanie szybkich, powtarzalnych interfejsów użytkownika z architekturą Type-Safe, Tailwind v4 i integracją REST/Firebase.',
        brandsAndManufacturers: ['React 19', 'TypeScript', 'Tailwind CSS v4', 'Vite', 'Firebase', 'Next.js', 'Redux Toolkit / Zustand'],
        certificationsAndQualifications: ['TypeScript Certified Professional', 'Meta Front-End Developer Certificate', 'AWS Certified Cloud Practitioner'],
        specializedVocabulary: ['Type-Safety i genereryki w TypeScript', 'Zarządzanie stanem z Zustand/React Context', 'Optymalizacja re-renderów React.memo', 'Server-Side Rendering (SSR) & SPA', 'Zgodność z WCAG 2.1 AA'],
        suggestedTools: ['VS Code', 'Git / GitHub Enterprise', 'Vite Build Tool', 'Postman / Bruno', 'Chrome DevTools'],
        suggestedHardSkills: ['React 19 Hooks & Patterns', 'TypeScript Strict Mode', 'Tailwind CSS Utility Design', 'Integracja REST API & Firebase'],
        suggestedSoftSkills: ['Dbałość o architekturę kodu', 'Komunikacja z designerami UX/UI'],
      },
      {
        id: 'hardware_helpdesk_tech',
        title: 'Technik IT & Serwisant Hardware/OS (E.12 / E.13)',
        description: 'Diagnostyka i naprawa sprzętu komputerowego, konfiguracja sieci strukturatywnej LAN/WAN, montaż podzespołów oraz wsparcie użytkowników.',
        brandsAndManufacturers: ['Interia.pl / Grupa Polsat', 'Dell / HP Enterprise', 'Cisco Systems', 'MikroTik', 'Windows Server / Linux Debian'],
        certificationsAndQualifications: ['Kwalifikacja E.12 (Montaż i eksploatacja komputerów)', 'Kwalifikacja E.13 (Projektowanie i sieci komputerowe)', 'Cisco CCNA (Routing & Switching)'],
        specializedVocabulary: ['Diagnostyka usterek płyty głównej i ramu', 'Karbielowanie rur i układanie skrętek Cat 6', 'Zarządzanie kontami w Active Directory', 'Konfiguracja podsieci VLAN i DHCP', 'Serwis peryferii biurowych i drukarek sieciowych'],
        suggestedTools: ['Tester Kabli RJ45', 'Zestaw Wkrętaków Precyzyjnych', 'Active Directory Administrative Center', 'Software PuTTY / Wireshark'],
        suggestedHardSkills: ['Diagnostyka Usterki Sprzętu (E.12)', 'Zarządzanie Siecią LAN (E.13)', 'Konfiguracja Windows Server / Active Directory', 'Zdalna Pomoc RDP / TeamViewer'],
        suggestedSoftSkills: ['Cierpliwość do użytkownika końcowego', 'Systematyczne podejście do problemu'],
        sampleCompany: 'Interia.pl / Grupa Polsat-Interia',
        samplePeriod: { start: '2018', end: '2018' },
        sampleMetrics: ['Średni czas diagnozy usterki hardware < 15 minut', 'Ocena satysfakcji użytkowników 4.9 / 5.0'],
      },
    ],
  },
  {
    id: 'electrical_energy',
    name: 'Elektryka, Automatyka & Energetyka',
    iconName: 'Zap',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    description: 'Pomiary elektryczne, wytyczanie tras kablowych, prefabrykacja szaf sterowniczych i uprawnienia SEP G1.',
    subRoles: [
      {
        id: 'electrician_sep_g1',
        title: 'Elektryk Pomiarowiec & Monter Instalacji (SEP G1)',
        description: 'Pomiary ochrony przeciwporażeniowej, montaż rozdzielnic, tras kablowych i odbioru instalacji 1kV.',
        brandsAndManufacturers: ['Eaton', 'Legrand', 'Schneider Electric', 'Sonel', 'Hager', 'Wago'],
        certificationsAndQualifications: ['Uprawnienia SEP G1 Dozór i Eksploatacja z Pomiarami', 'Uprawnienia UDT na Podnośniki Koszowe', 'Uprawnienia Budowlane Instalacyjne'],
        specializedVocabulary: ['Pomiary pętli zwarcia miernikiem Sonel', 'Badanie rezystancji izolacji', 'Prefabrykacja rozdzielnic nn', 'Próba wyzwalania różnicówek RCD', 'Protokoły pomiarowe odbiorcze'],
        suggestedTools: ['Miernik Sonel MPI-530', 'Zdzierak Izolacji Jokari', 'Zaciskarka Tulejek Wago', 'Kamera Termowizyjna FLIR'],
        suggestedHardSkills: ['Pomiary Elektryczne Sonel', 'Montaż Rozdzielnic Schneider', 'Czytanie Schematów Eplan', 'Weryfikacja RCD i Uziemień'],
        suggestedSoftSkills: ['Brak kompromisów w bezpieczeństwie', 'Precyzja monterska'],
      },
    ],
  },
  {
    id: 'logistics_ecom',
    name: 'Logistyka, Transport & E-Commerce',
    iconName: 'Truck',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    description: 'Zarządzanie flotą, obsługa ERP/WMS, odprawy celne oraz koordynacja wysyłek międzynarodowych.',
    subRoles: [
      {
        id: 'logistics_dispatcher',
        title: 'Spedytor Międzynarodowy & Dysponent Floty',
        description: 'Organizacja przewozów FTL/LTL, giełdy transportowe Timocom/Trans.eu, rozliczanie czasu pracy kierowców i odprawy celne.',
        brandsAndManufacturers: ['Trans.eu', 'TimoCom', 'CargoCore', 'SAP WMS', 'Baselinker', 'InPost'],
        certificationsAndQualifications: ['Certyfikat Kompetencji Zawodowych (CKZ)', 'Uprawnienia Agenta Celnego', 'Szkolenie ADR Przewóz Towarów Niebezpiecznych'],
        specializedVocabulary: ['Optymalizacja załadunku FTL/LTL', 'Rozliczanie czasu pracy tachografu (AETR)', 'Procedura odprawy celnej TIR/SAD', 'Kalkulacja stawki frachtowej per km', 'Monitoring GPS floty w czasie rzeczywistym'],
        suggestedTools: ['Giełda Trans.eu', 'TimoCom Messenger', 'System ERP SAP WMS', 'Mapy Google Business Pro'],
        suggestedHardSkills: ['Planowanie Tras FTL/LTL', 'Obsługa Giełd Transportowych', 'Znajomość Konwencji CMR', 'Negocjacje Stawek Frachtowych'],
        suggestedSoftSkills: ['Odporność na stres', 'Decyzyjność w sytuacjach kryzysowych'],
      },
      {
        id: 'warehouse_forklift_operator',
        title: 'Operator Wózka Widłowego UDT & Magazynier WMS',
        description: 'Załadunek i rozładunek naczep, wysoki skład paletowy, obsługa skanerów kodów kreskowych i systemów WMS.',
        brandsAndManufacturers: ['Linde Material Handling', 'Toyota Material Handling', 'Jungheinrich', 'Still', 'System SAP WMS'],
        certificationsAndQualifications: ['Uprawnienia UDT na Wózki Jezdniowe (I WJO / II WJO)', 'Uprawnienia Wymiany Butli LPG'],
        specializedVocabulary: ['Składowanie w regałach wysokiego składowania', 'Kompletacja zamówień (Pick & Pack)', 'Etykietowanie palet w standardzie GS1', 'Inwentaryzacja ciągła i okresowa'],
        suggestedTools: ['Wózek widłowy czołowy / Reach Truck Linde', 'Terminal Skaner Zebra', 'Foliarka automatyczna'],
        suggestedHardSkills: ['Obsługa Wózków Widłowych UDT', 'Praca ze Skanerem Kodów Zebra', 'Załadunki Naczep TIR', 'Obsługa Systemu WMS'],
        suggestedSoftSkills: ['Dbałość o BHP na magazynie', 'Szybkość i dokładność w pickingu'],
      },
    ],
  },
  {
    id: 'construction_finishing',
    name: 'Budownictwo, Wykończenia & Maszyny',
    iconName: 'HardHat',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    description: 'Prace wykończeniowe, glazurnictwo, obsługa maszyn budowlanych i nadzór inwestorski.',
    subRoles: [
      {
        id: 'tiler_renovation_expert',
        title: 'Glazurnik & Fachowiec Prac Wykończeniowych',
        description: 'Układanie płyt wielkoformatowych, hydroizolacja łazienek, szlifowanie krawędzi do kąta 45° i poziomowanie wylewek.',
        brandsAndManufacturers: ['Knauf', 'Mapei', 'Atlas', 'Raimondi', 'Rubi', 'DeWalt', 'Festool'],
        certificationsAndQualifications: ['Certyfikat Autoryzowanego Glazurnika Mapei/Knauf', 'Szkolenie Wykonawstwa Hydroizolacji Powłokowych'],
        specializedVocabulary: ['Szlifowanie gresu pod kątem 45 stopni (Jolly)', 'Hydroizolacja folią w płynie i taśmami uszczelniającymi', 'Układanie płyt wielkoformatowych (Slim 120x240cm)', 'Systemy poziomowania płytek (Klinowy / Raimondi)'],
        suggestedTools: ['Maszynka do cięcia płyt Rubi TX-MAX', 'Przecinarka wodna z tarczą diamentową', 'Mieszadło elektryczne Collomix', 'Laser krzyżowy Bosch Professional'],
        suggestedHardSkills: ['Glazurnictwo Wielkoformatowe', 'Hydroizolacja Łazienek Mapei', 'Precyzyjne Układanie Gresu', 'Szlifowanie Krawędzi 45°'],
        suggestedSoftSkills: ['Estetyka i czystość na budowie', 'Dokładność wymiarowa'],
      },
      {
        id: 'excavator_operator',
        title: 'Operator Koparko-Ładowarki & Maszyn Budowlanych (UDT)',
        description: 'Wykopy pod fundamenty i sieci gazowo-wodociągowe, niwelacja terenu z wykorzystaniem laserowych systemów niwelacji.',
        brandsAndManufacturers: ['JCB (3CX/4CX)', 'Caterpillar (CAT)', 'Komatsu', 'Takeuchi', 'Topcon Laser'],
        certificationsAndQualifications: ['Uprawnienia I/II Klasy na Koparko-Ładowarki', 'Uprawnienia na Koparki Jednonaczyniowe do 25t'],
        specializedVocabulary: ['Skarpowanie terenu z dokł. do 1cm', 'Wykopy pod sieci uzbrojenia terenu', 'Praca z systemem niwelacji laserowej 3D', 'Wymiana osprzętu szybkozłączem hydraulicznym'],
        suggestedTools: ['Koparko-ładowarka JCB 4CX', 'Niwelator Laserowy Topcon', 'Łyżka skarpowa uchylna'],
        suggestedHardSkills: ['Precyzyjne Wykopy Budowlane', 'Niwelacja Terenu Laserowa', 'Obsługa Maszyn JCB / CAT', 'Prace pod Nadzorem Nadzoru'],
        suggestedSoftSkills: ['Wyobraźnia przestrzenna', 'Bezpieczeństwo w otoczeniu wykopu'],
      },
    ],
  },
  {
    id: 'automotive_repair',
    name: 'Motoryzacja, Mechanika & Diagnostyka',
    iconName: 'Wrench',
    badgeColor: 'bg-red-100 text-red-900 border-red-300',
    description: 'Diagnostyka komputerowa pojazdów, wymiana rozrządów, naprawa układów hamulcowych i elektromechanika.',
    subRoles: [
      {
        id: 'auto_mechanic',
        title: 'Mechanik Samochodowy & Diagnosta KTS',
        description: 'Diagnostyka silników benzynowych i Diesla, wymiana układów rozrządu, regeneracja zawieszenia i obsługa testerów diagnostycznych.',
        brandsAndManufacturers: ['Bosch Car Service', 'Texa', 'Autel', 'Launch', 'VAG (Audi/VW)', 'BMW ISID', 'Snap-on Tools'],
        certificationsAndQualifications: ['Certyfikat Diagnosty Samochodowego KTS', 'Uprawnienia SEP G1 na Obsługę Pojazdów Elektrycznych i Hybrydowych (EV/HEV)'],
        specializedVocabulary: ['Diagnostyka magistrali CAN/LIN testerem', 'Wymiana mokrego/suchego paska rozrządu', 'Regeneracja wtryskiwaczy Common Rail', 'Statyczna i dynamiczna wymiana oleju w skrzyni biegów', 'Ustawianie geometrii zawieszenia 3D'],
        suggestedTools: ['Tester diagnostyczny Bosch KTS 590', 'Stok narzędziowy Hazet / King Tony', 'Urządzenie do geometrii 3D Hunter'],
        suggestedHardSkills: ['Diagnostyka Komputerowa KTS/Texa', 'Wymiana Rozrządów i Sprzęgieł', 'Naprawa Układów Hamulcowych', 'Regulacja Geometrii 3D'],
        suggestedSoftSkills: ['Logiczne wyciąganie wniosków technicznych', 'Skrupulatność w dokręcaniu śrub'],
      },
      {
        id: 'auto_electrician',
        title: 'Elektromechanik & Specjalista ds. Elektroniki Pojazdowej',
        description: 'Wykrywanie zwarć i przerw w instalacji elektrycznej aut, naprawa sterowników ECU, immobilizerów oraz systemów ADAS.',
        brandsAndManufacturers: ['Bosch', 'Continental VDO', 'Denso', 'Autel MaxiSys ADAS', 'Abrites AVDI'],
        certificationsAndQualifications: ['Uprawnienia Stowarzyszenia Elektryków Polskich SEP G1 do 1kV', 'Certyfikat Kalibracji Kamer i Radarów ADAS'],
        specializedVocabulary: ['Kodowanie i wgrywanie wsadu sterowników ECU', 'Kalibracja radarów i kamer ADAS po wymianie szyby', 'Diagnostyka pętli światłowodowej MOST', 'Wykrywanie pasożytniczego poboru prądu na postoju'],
        suggestedTools: ['Oscyloskop motoryzacyjny PicoScope', 'Programator ECU Flex / Magicmotorsport', 'Multimetr Fluke 88V'],
        suggestedHardSkills: ['Diagnostyka Oscyloskopowa PicoScope', 'Lutowanie i Naprawa Sterowników ECU', 'Kalibracja Systemów ADAS', 'Lokalizacja Zwarć Instalacji'],
        suggestedSoftSkills: ['Dociekliwość analityczna', 'Precyzja manualna'],
      },
    ],
  },
  {
    id: 'production_cnc',
    name: 'Produkcja, Obróbka CNC & Spawalnictwo',
    iconName: 'Cog',
    badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
    description: 'Programowanie obrabiarek CNC, spawanie TIG/MAG 135/141 oraz kontrola jakości wymiarowej.',
    subRoles: [
      {
        id: 'cnc_operator_programmer',
        title: 'Operator & Programista Obrabiarek CNC (Sinumerik / Fanuc)',
        description: 'Uzbrajanie tokarek i frezarek CNC, pisanie i edycja kodu G-code, dobór parametrów skrawania i pomiar detali suwmiarką/mikrometrem.',
        brandsAndManufacturers: ['Siemens Sinumerik 840D', 'Fanuc Controls', 'Heidenhain TNC', 'Haas Automation', 'DMG MORI', 'Mazak'],
        certificationsAndQualifications: ['Certyfikat Programowania CNC Sinumerik/Heidenhain', 'Uprawnienia na Suwnice z Poziomu 0 (UDT)'],
        specializedVocabulary: ['Programowanie z ręki w kodzie G-Code (G0, G1, G2, G3)', 'Korekcja promienia i długości narzędzi (G41/G42)', 'Pomiar detali mikrometrem i średnicówką', 'Dobór prędkości skrawania Vc i posuwu F'],
        suggestedTools: ['Suwmiarka cyfrowa Mitutoyo', 'Mikrometr zewnętrzny 0-25mm', 'Średnicówka dwupunktowa', 'Klucz dynamometryczny'],
        suggestedHardSkills: ['Programowanie CNC Sinumerik/Fanuc', 'Ręczna Edycja G-Code', 'Pomiar Detali Mitutoyo', 'Dobór Narzędzi Skrawających'],
        suggestedSoftSkills: ['Wyjątkowa dbałość o jakość powierzchni', 'Dyscyplina techniczna'],
      },
      {
        id: 'welder_tig_mag',
        title: 'Spawacz TIG 141 & MAG 135 (Certyfikat UDT / TÜV)',
        description: 'Spawanie konstrukcji stalowych i rurociągów ze stali nierdzewnej, przygotowanie krawędzi spoin i kontrola defektoskopowa.',
        brandsAndManufacturers: ['Fronius', 'Kemppi', 'Lincoln Electric', 'Esab', 'EWM Welding'],
        certificationsAndQualifications: ['Certyfikat Spawalniczy UDT/TÜV ISO 9606-1 (FM1 / FM5)', 'Uprawnienia VT2 (Badania Wizualne Spoin)'],
        specializedVocabulary: ['Spawanie w osłonie argonu 99.99% (TIG 141)', 'Wytwarzanie przetopu i lica spoiny', 'Badanie wizualne VT2 i penetracyjne PT', 'Ukosowanie krawędzi pod spoinę V/Y'],
        suggestedTools: ['Spawarka TIG Fronius MagicWave', 'Przyłbica automatyczna Optrel / 3M Speedglas', 'Młotek spawalniczy i szczotka kwasoodporna'],
        suggestedHardSkills: ['Spawanie TIG 141 Rur Nierdzewnych', 'Spawanie MAG 135 Konstrukcji', 'Wizualna Kontrola Spoin VT2', 'Przygotowanie Krawędzi Złącza'],
        suggestedSoftSkills: ['Precyzja prowadzenia palnika', 'Cierpliwość przy przetopach'],
      },
    ],
  },
  {
    id: 'medical_healthcare',
    name: 'Medycyna, Farmacja & Pielęgniarstwo',
    iconName: 'Activity',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Nadzór nad pacjentem, podawanie leków, zabiegi rehabilitacyjne oraz apteczne wydawanie specyfików.',
    subRoles: [
      {
        id: 'nurse_specialist',
        title: 'Pielęgniarka / Pielęgniarz Dyżurny (Prawo Wykonywania Zawodu)',
        description: 'Podawanie leków drogą dożylną, zakładanie wkłuć obwodowych, pielęgnacja ran i obsługa aparatury ratującej życie na oddziale.',
        brandsAndManufacturers: ['KRAUM (Krajowa Rada Pielęgniarek)', 'BD Medical', 'Fresenius Kabi', 'B. Braun', 'Mindray Patient Monitors'],
        certificationsAndQualifications: ['Prawo Wykonywania Zawodu Pielęgniarki (PWZ)', 'Kurs Specjalistyczny Wykonywania i Interpretacji EKG', 'Kurs RKO / ALS (Advanced Life Support)'],
        specializedVocabulary: ['Kaniulacja żył obwodowych (Wkłucia kanulą)', 'Obsługa pomp infuzyjnych strzykawkowych i objętościowych', 'Toaleta drzewa oskrzelowego i odsysanie rurki', 'Prowadzenie dokumentacji medycznej w systemie Asseco/Kamsoft'],
        suggestedTools: ['Kardiomonitor Mindray', 'Pompa Infuzyjna Fresenius', 'Stetoskop Littmann Classic III', 'Aparat EKG Bionet'],
        suggestedHardSkills: ['Kaniulacja Żył Obwodowych', 'Obsługa Pomp Infuzyjnych', 'Interpretacja Zapisu EKG', 'Pielęgnacja Ran i Opatrunki'],
        suggestedSoftSkills: ['Wyjątkowa empatia', 'Chłodna głowa w sytuacjach nagłych'],
      },
      {
        id: 'physiotherapist',
        title: 'Fizjoterapeuta / Terapeuta Manualny (PWZFiz)',
        description: 'Rehabilitacja ortopedyczna i neurologiczna pacjentów, terapia tkanek miękkich, igłoterapia oraz suche igłowanie.',
        brandsAndManufacturers: ['KIF (Krajowa Izba Fizjoterapeutów)', 'BTL Medical', 'Chattanooga', 'RockTape'],
        certificationsAndQualifications: ['Prawo Wykonywania Zawodu Fizjoterapeuty (PWZFiz)', 'Certyfikat Terapii Manualnej wg Koncepcji Maitlanda / Mulligana', 'Certyfikat Kinesiotapingu Podstawowego i Zaawansowanego'],
        specializedVocabulary: ['Mobilizacja i manipulacja stawowa', 'Suche igłowanie (Dry Needling) punktów spustowych', 'Terapia powięziowa FDM (Fascial Distortion Model)', 'Badanie funkcjonalne wg skali FMS'],
        suggestedTools: ['Aparat do fali uderzeniowej BTL', 'Igły do suchego igłowania Seirin', 'Taśmy do Kinesiotapingu RockTape'],
        suggestedHardSkills: ['Terapia Manualna Stawów', 'Suche Igłowanie Punktów Spustowych', 'Rehabilitacja Ortopedyczna', 'Kinesiotaping Medyczny'],
        suggestedSoftSkills: ['Umiejętność słuchania pacjenta', 'Cierpliwość procesowa'],
      },
    ],
  },
  {
    id: 'sales_customer_service',
    name: 'Sprzedaż, Handel & Obsługa Klienta',
    iconName: 'ShoppingBag',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Pozyskiwanie klientów B2B, negocjacje handlowe, merchandising oraz doradztwo w salonach.',
    subRoles: [
      {
        id: 'b2b_sales_representative',
        title: 'Przedstawiciel Handlowy B2B & Key Account Manager',
        description: 'Aktywne pozyskiwanie partnerów biznesowych (cold calling, networking), prezentacje handlowe i domykanie kontraktów.',
        brandsAndManufacturers: ['Salesforce CRM', 'HubSpot', 'Pipedrive', 'LinkedIn Sales Navigator', 'Livespace CRM'],
        certificationsAndQualifications: ['Certyfikat Technik Negocjacji Sandlera (Sandler Sales Institute)', 'Szkolenie Sprzedaży Doradczej SPIN Selling'],
        specializedVocabulary: ['Prospection i kwalifikacja leadów (BANT)', 'Kalkulacja marży i przychodu (MRR/ARR)', 'Przygotowywanie ofert przetargowych (RFP/RFQ)', 'Prezentacja wartości biznesowej Value Proposition'],
        suggestedTools: ['Salesforce Sales Cloud', 'LinkedIn Sales Navigator', 'Pipedrive CRM', 'Zoom Pro / MS Teams'],
        suggestedHardSkills: ['Negocjacje Handlowe B2B', 'Obsługa CRM Salesforce/Pipedrive', 'Prospection Cold Outreach', 'Prezentacje Ofertowe'],
        suggestedSoftSkills: ['Orientacja na realizację celu', 'Odporność na odmowę klienta'],
      },
    ],
  },
  {
    id: 'hr_recruitment',
    name: 'HR, Rekrutacja & Kadry-Płace',
    iconName: 'Users',
    badgeColor: 'bg-pink-100 text-pink-900 border-pink-300',
    description: 'Pozyskiwanie talentów IT/Blue-collar, rozliczanie czasów pracy, Płatnik i optymalizacja procesów HR.',
    subRoles: [
      {
        id: 'it_recruiter_talent',
        title: 'IT Recruiter & Talent Acquisition Specialist',
        description: 'Prowadzenie rekrutacji na stanowiska inżynieryjne (Software, DevOps), direct search na LinkedIn, screening techniczny i weryfikacja dopasowania.',
        brandsAndManufacturers: ['LinkedIn Recruiter', 'Traffit ATS', 'eRecruiter', 'GitHub Search', 'Hirenami'],
        certificationsAndQualifications: ['Certyfikat LinkedIn Recruiter Expert', 'Szkolenie Wywiad Behawioralny STAR'],
        specializedVocabulary: ['Wyszukiwanie boolowskie (Boolean Search Operators)', 'Wskaźnik Response Rate wiadomości InMail', 'Wywiad kompetencyjny metodą STAR', 'Nadzór nad wskaźnikiem Time-to-Hire i Cost-per-Hire'],
        suggestedTools: ['LinkedIn Recruiter Corporate', 'Traffit ATS System', 'Calendly / Google Workspace'],
        suggestedHardSkills: ['Boolean Search na LinkedIn/GitHub', 'Weryfikacja Profilu IT', 'Obsługa ATS eRecruiter/Traffit', 'Wywiad Behawioralny STAR'],
        suggestedSoftSkills: ['Budowanie relacji z kandydatami', 'Przekonujący networking'],
      },
    ],
  },
];

export interface DictionaryCategory {
  title: string;
  type: 'licenses' | 'brands_tools' | 'terminology_skills' | 'metrics';
  items: string[];
}

export interface SpecializationRole extends ProfessionSubRole {
  category?: string;
  shortCode?: string;
  detailedDictionary?: DictionaryCategory[];
}

export interface DomainSubCategory {
  id: string;
  name: string;
  roles: SpecializationRole[];
}

export interface DomainCategory {
  id: string;
  name: string;
  iconName: string;
  badgeColor: string;
  description: string;
  subCategories: DomainSubCategory[];
}

export interface IndustryCategory {
  id: string;
  name: string;
  badgeColor: string;
  rolesCount: number;
  roles: SpecializationRole[];
}

// Map SectorCategory to DomainCategory for progressive disclosure UI
export const DOMAIN_SPECIALIZATIONS: DomainCategory[] = SECTOR_CATEGORIES.map((sec) => ({
  id: sec.id,
  name: sec.name,
  iconName: sec.iconName,
  badgeColor: sec.badgeColor,
  description: sec.description,
  subCategories: [
    {
      id: `${sec.id}_sub`,
      name: sec.name,
      roles: sec.subRoles.map((role) => ({
        ...role,
        category: sec.name,
        shortCode: role.id.toUpperCase().slice(0, 6),
        detailedDictionary: [
          {
            title: '📜 Uprawnienia, Certyfikaty i Wpisy Urzędowe',
            type: 'licenses',
            items: role.certificationsAndQualifications,
          },
          {
            title: '🏭 Marki, Sprzęt & Narzędzia Pracy',
            type: 'brands_tools',
            items: (role.brandsAndManufacturers || []).concat(role.suggestedTools),
          },
          {
            title: '⚙️ Specjalistyczna Terminologia & Czynności',
            type: 'terminology_skills',
            items: role.specializedVocabulary.concat(role.suggestedHardSkills),
          },
          ...(role.sampleMetrics && role.sampleMetrics.length > 0
            ? [
                {
                  title: '📊 Wskaźniki Jakości & Osiągnięcia',
                  type: 'metrics' as const,
                  items: role.sampleMetrics,
                },
              ]
            : []),
        ],
      })),
    },
  ],
}));

export const SPECIALIZATION_CATEGORIES: IndustryCategory[] = SECTOR_CATEGORIES.map((sec) => ({
  id: sec.id,
  name: sec.name,
  badgeColor: sec.badgeColor,
  rolesCount: sec.subRoles.length,
  roles: sec.subRoles.map((role) => ({
    ...role,
    category: sec.name,
  })),
}));

import { findPositionAliases, normalizeTerm } from './synonymsDictionary';

export const searchDeepMindMap = (query: string): ProfessionSubRole[] => {
  if (!query || query.trim().length === 0) return [];
  const rawQ = query.trim();
  const normQ = normalizeTerm(rawQ);
  const { allAliases } = findPositionAliases(rawQ);
  const normAliases = allAliases.map(normalizeTerm);

  const results: ProfessionSubRole[] = [];

  SECTOR_CATEGORIES.forEach((sec) => {
    sec.subRoles.forEach((role) => {
      const normTitle = normalizeTerm(role.title);
      const normDesc = normalizeTerm(role.description);
      const normBrands = (role.brandsAndManufacturers || []).map(normalizeTerm);
      const normCerts = role.certificationsAndQualifications.map(normalizeTerm);
      const normVocab = role.specializedVocabulary.map(normalizeTerm);
      const normSkills = [...role.suggestedHardSkills, ...role.suggestedTools].map(normalizeTerm);

      const allSearchableFields = [normTitle, normDesc, ...normBrands, ...normCerts, ...normVocab, ...normSkills];

      // Direct query match or synonym alias match
      const matchDirect = allSearchableFields.some(field => field.includes(normQ));
      const matchSynonym = normAliases.some(alias => 
        alias.length > 2 && allSearchableFields.some(field => field.includes(alias) || alias.includes(field))
      );

      if (matchDirect || matchSynonym) {
        results.push(role);
      }
    });
  });

  return results;
};

export const searchSpecializations = (query: string): SpecializationRole[] => {
  return searchDeepMindMap(query).map((role) => ({
    ...role,
    category: 'Słownik Specjalizacji',
  }));
};

