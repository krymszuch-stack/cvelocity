import { describe, it, expect } from 'vitest';
import { parseTextToMasterVault } from '../cvUniversalParser';
import { mergeImportedVault } from '../vaultImportMerge';
import { MasterVault } from '../../types';

function createMockVault(fullName = 'Użytkownik Bazowy'): MasterVault {
  return {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    profiler: {
      flags: ['PHYSICAL'],
      experienceLevel: 'MID',
      location: {
        city: 'Katowice',
        radiusKm: 30,
        willingnessToTravel: false,
        hybridWork: false,
        remoteOnly: false,
      },
      languages: [],
    },
    personalInfo: {
      fullName,
      email: 'bazowy@example.com',
      phone: '123 456 789',
      location: 'Katowice',
      title: 'Pracownik',
      summary: 'Profil bazowy.',
    },
    skillsMatrix: {
      hardSkills: ['Podstawowe prace warsztatowe'],
      softSkills: ['Punktualność'],
      toolsAndTech: [],
      certifications: [],
    },
    history: [
      {
        id: 'base_exp_adv_1',
        company: 'Stara Fabryka',
        role: 'Pomocnik',
        location: 'Katowice',
        startDate: '2015',
        endDate: '2016',
        isCurrent: false,
        highlights: [],
      },
    ],
    education: [],
    projects: [],
  };
}

describe('20 Additional Adversarial, Distorted & Chaotic CV Parser Tests', () => {
  // 1. Interleaved 2-Column with Pipe Separator |
  it('1. Interleaved 2-column side-by-side layout with pipe separators |', () => {
    const rawCv = `
    Tomasz Dwukolumnowy | DOŚWIADCZENIE ZAWODOWE
    tomasz.2col@firma.pl | Tech-Corp Warszawa - Senior Developer
    Tel: 601 222 333 | 2020 - obecnie
    Warszawa | - Architektura systemów chmurowych AWS
    | - Optymalizacja zapytań w bazie PostgreSQL
    UMIEJĘTNOŚCI |
    React, Node.js, SQL, TypeScript | Web-Studio - Fullstack Dev (2017 - 2020)
    Docker, Git, AWS | - Budowa serwisów internetowych
    |
    JĘZYKI | EDUKACJA
    Angielski (C1) | Politechnika Warszawska
    Niemiecki (B1) | Magister Inżynier: Informatyka (2012 - 2017)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Tomasz Dwukolumnowy');
    expect(parsed.personalInfo.email).toBe('tomasz.2col@firma.pl');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Tech-Corp');
    expect(parsed.history[0].startDate).toBe('2020');
    expect(parsed.history[0].endDate).toBe('Obecnie');
    expect(parsed.education.length).toBe(1);
    expect(parsed.hardSkills).toContain('React');
  });

  // 2. Brak spacji wokół znaków interpunkcyjnych
  it('2. Brak spacji po kropkach, przecinkach i dwukropkach', () => {
    const rawCv = `
    Marek.Ścisły,email:marek.scisly@poczta.onet.pl,tel:500600700,miejscowość:Kraków

    DOŚWIADCZENIE:
    Elektro-Bud Sp. z o.o.|Elektromonter
    01.2020-obecnie
    -Montaż rozdzielnic elektrycznych
    -Pomiary instalacji odbiorczych

    El-Mont Kraków-Pomocnik Elektryka(2017-2019)
    -Układanie kabli i tras kablowych

    UMIEJĘTNOŚCI:
    Pomiary elektryczne,Uprawnienia SEP,Montaż rozdzielnic,Czytanie schematów

    CERTYFIKATY:
    Świadectwo SEP E do 1kV-2020

    SZKOŁY:
    Technikum Elektryczne w Krakowie(2013-2017)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Marek.Ścisły');
    expect(parsed.personalInfo.email).toBe('marek.scisly@poczta.onet.pl');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Elektro-Bud');
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.education.length).toBe(1);
  });

  // 3. ALL CAPS format (wszystko wielkimi literami)
  it('3. Dokument sformatowany w całości wielkimi literami (ALL CAPS)', () => {
    const rawCv = `
    KRZYSZTOF WIELKOLITEROWY
    EMAIL: KRZYSZTOF.CAPS@BUDOWLANKA.PL | TEL: +48 602 111 222 | WROCŁAW
    STANOWISKO: MONTER INSTALACJI SANITARNYCH

    DOSWIADCZENIE ZAWODOWE:
    INSTAL-WROCŁAW SP. Z O.O. - MONTER HVAC
    04.2021 - OBECNIE
    • MONTAŻ POMP CIEPŁA I KOTŁÓW GAZOWYCH
    • PRÓBY CIŚNIENIOWE INSTALACJI HYDRAULICZNYCH

    TERMO-SYSTEM - HYDRAULIK (2017 - 2021)
    • ZGRZEWANIE RUR PP I LUTOWANIE MIEDZI

    UMIEJETNOSCI:
    MONTAŻ INSTALACJI SANITARNYCH, KOCIOŁ GAZOWY, POMPY CIEPŁA, LUTOWANIE TWARDE

    CERTYFIKATY:
    UPRAWNIENIA F-GAZY KAT. I - 2021
    SWIADECTWO KWALIFIKACYJNE SEP G3 - 2022

    SZKOLY:
    ZESPÓŁ SZKÓŁ BUDOWLANYCH WE WROCŁAWIU (2013 - 2017)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('KRZYSZTOF WIELKOLITEROWY');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('INSTAL-WROCŁAW');
    expect(parsed.certifications.length).toBe(2);
  });

  // 4. Emotikony i nowoczesne ikony w nagłówkach
  it('4. Emotikony i ikony Unicode w nagłówkach i treści (🚀, 🛠️, 🎓, 📞)', () => {
    const rawCv = `
    🚀 Janusz Nowoczesny 👨‍💻
    📞 Tel: 509 888 777 | ✉️ E-mail: janusz.emoji@dev.io | 📍 Gdańsk
    💼 Rola: Fullstack Developer

    🚀 DOŚWIADCZENIE ZAWODOWE 🛠️
    Web-Tech Gdańsk | Fullstack Developer
    03.2021 – obecnie
    ✨ Tworzenie aplikacji w ekosystemie React i Node.js
    🔥 Konteneryzacja środowisk w Dockerze i chmurze AWS

    App-Studio - Junior Dev (2019 - 2021)
    ⭐ Prace front-endowe w JavaScript i CSS

    🛠️ UMIEJĘTNOŚCI I TECHNOLOGIE 💻
    React, TypeScript, Node.js, Docker, AWS, Git, SQL

    🎓 SZKOŁY I EDUKACJA 📚
    Politechnika Gdańska (2015 - 2019)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toContain('Janusz Nowoczesny');
    expect(parsed.personalInfo.email).toBe('janusz.emoji@dev.io');
    expect(parsed.history.length).toBe(2);
    expect(parsed.education.length).toBe(1);
    expect(parsed.hardSkills).toContain('React');
  });

  // 5. Mieszane daty po polsku i angielsku w jednym dokumencie
  it('5. Mieszane daty po polsku i angielsku (styczeń 2018 - March 2021, from 04.2021 to now)', () => {
    const rawCv = `
    Adam Dwujęzyczny
    adam.bilingual@global.com | 600 123 456 | Warszawa

    DOŚWIADCZENIE ZAWODOWE
    Global Corp Poland - Project Lead
    from 04.2021 to now
    - Zarządzanie międzynarodowymi projektami IT w metodykach Agile/Scrum

    Euro-Soft - Senior Analyst
    styczeń 2018 - March 2021
    - Analiza wymagań biznesowych i modelowanie procesów BPMN

    UMIEJĘTNOŚCI
    Agile, Scrum, Zarządzanie projektami, Jira, SQL, Python

    WYKSZTAŁCENIE
    Szkoła Główna Handlowa w Warszawie (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Adam Dwujęzyczny');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].startDate).toBe('04-2021');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.history[1].startDate).toBe('01-2018');
    expect(parsed.history[1].endDate).toBe('03-2021');
  });

  // 6. Słowne zapisy lat z sufiksami roku / r.
  it('6. Słowne zapisy dat (od roku 2019 do 2022 roku, od 2015 do teraz)', () => {
    const rawCv = `
    Piotr Czasowy
    piotr.czas@transport.pl | 511 666 999 | Łódź

    HISTORIA PRACY
    Trans-Pol Łódź | Spedytor Krajowy
    od 2019 roku do teraz
    - Planowanie tras pojazdów ciężarowych

    Sped-Grup - Asystent Spedytora (od 2015 do 2019 roku)
    - Weryfikacja dokumentów CMR

    KOMPETENCJE
    Planowanie transportu, Rozliczanie kierowców, System WMS, Excel

    SZKOŁY
    Uniwersytet Łódzki (2012 - 2015)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Piotr Czasowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].startDate).toBe('2019');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.history[1].startDate).toBe('2015');
    expect(parsed.history[1].endDate).toBe('2019');
  });

  // 7. Znaczniki HTML / XML w tekście CV
  it('7. Znaczniki HTML / XML (<b>, <i>, <experience>, <span>)', () => {
    const rawCv = `
    <b>Michał Znacznikowy</b><br>
    <span>Email: michal.html@web.pl | Tel: 601 777 888 | Poznań</span>

    <experience>
    <b>Doświadczenie zawodowe:</b>
    Tech-Web Poznań | <i>Frontend Developer</i>
    02.2021 - obecnie
    • <span>Tworzenie interfejsów w React i TypeScript</span>

    Web-Studio - Junior Dev (2018 - 2021)
    • Cięcie szablonów HTML i CSS
    </experience>

    <skills>
    <b>Umiejętności:</b>
    React, TypeScript, JavaScript, HTML, CSS, Git
    </skills>

    <education>
    <b>Edukacja:</b>
    Politechnika Poznańska (2014 - 2018)
    </education>
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Michał Znacznikowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.education.length).toBe(1);
    expect(parsed.hardSkills).toContain('React');
  });

  // 8. OCR-owe znaki punktacji i symbole specjalne (¬, §, ¤, », •)
  it('8. Specjalne znaki OCR (¬, §, ¤, », •) w nagłówkach i punktorach', () => {
    const rawCv = `
    § Barbara Znakowa §
    ¤ E-mail: barbara.ocr@firma.pl | Tel: 504 333 222 | Katowice

    » DOŚWIADCZENIE ZAWODOWE
    Stal-Met Katowice | Kontroler Jakości
    05.2020 – obecnie
    ¬ Pomiary suwmiarką i mikrometrem
    ¬ Weryfikacja zgodności z rysunkiem technicznym

    Huta Katowice - Pomocnik Kontrolera (2017 - 2020)
    ¬ Kontrola wizualna wyrobów hutniczych

    » KWALIFIKACJE
    Suwmiarka, Rysunek techniczny, Pomiary warsztatowe, Badania wizualne VT2

    » CERTYFIKATY
    Certyfikat Badań Nieniszczących VT2 - 2021

    » EDUKACJA
    Technikum Mechaniczne w Katowicach (2013 - 2017)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Barbara Znakowa');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.education.length).toBe(1);
  });

  // 9. Numer telefonu w formacie stacjonarnym z myślnikami obok dat
  it('9. Telefon stacjonarny z prefiksem +48 (22) 888-99-00 i myślnikami', () => {
    const rawCv = `
    Stanisław Stacjonarny
    stanislaw.biuro@warszawa.pl
    Tel: +48 (22) 888-99-00
    Warszawa

    PRZEBIEG PRACY
    Biuro Rachunkowe Warszawa | Księgowy
    01.2021 - obecnie
    - Prowadzenie ewidencji ryczałtu i KPiR

    Kancelaria Finansowa - Asystent Księgowego (2018 - 2021)
    - Wprowadzanie faktur do programu Symfonia

    UMIEJĘTNOŚCI
    Księgowość pełna, Płatnik, Symfonia, Podatki VAT, Excel

    SZKOŁY
    SGH w Warszawie (2014 - 2018)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Stanisław Stacjonarny');
    expect(parsed.history.length).toBe(2);
    expect(parsed.hardSkills).toContain('Symfonia');
  });

  // 10. Slash-separated skills bez spacji (PHP/SQL/Docker/Kubernetes)
  it('10. Umiejętności rozdzielone ukośnikami bez spacji (PHP/SQL/Docker/AWS)', () => {
    const rawCv = `
    Damian Ukośnik
    damian.dev@software.pl | 609 111 888 | Poznań
    Stanowisko: Backend Developer

    DOŚWIADCZENIE
    Software Solutions Poznań | Backend Developer
    03.2020 - obecnie
    • Tworzenie API w Pythonie i Django

    WebDev - Junior Dev (2018 - 2020)
    • Utrzymanie baz danych PostgreSQL

    UMIEJĘTNOŚCI
    Python/SQL/PostgreSQL/Docker/Kubernetes/Git/AWS/FastAPI/Linux

    SZKOŁY
    Politechnika Poznańska (2014 - 2018)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Damian Ukośnik');
    expect(parsed.history.length).toBe(2);
    expect(parsed.hardSkills).toContain('Python');
    expect(parsed.hardSkills).toContain('Docker');
    expect(parsed.hardSkills).toContain('Kubernetes');
  });

  // 11. Długie, wieloczłonowe nazwy firm ze spójnikami & i formami prawnymi
  it('11. Wieloczłonowe nazwy firm (Przedsiębiorstwo Robót Inżynieryjnych & Budowlanych Sp. z o.o. Sp. k.)', () => {
    const rawCv = `
    Andrzej Korporacyjny
    andrzej.korpo@inzynieria.pl | 501 555 444 | Katowice
    Stanowisko: Inżynier Budowy

    HISTORIA ZATRUDNIENIA
    Przedsiębiorstwo Robót Inżynieryjnych & Budowlanych Sp. z o.o. Sp. k. w Katowicach | Inżynier Budowy
    06.2020 – obecnie
    - Nadzór nad robotami mostowymi i fundamentami specjalnymi

    Śląskie Przedsiębiorstwo Mostowe S.A. - Asystent Inżyniera (2017 - 2020)
    - Pomiary geodezyjne i kontrola zbrojenia

    KWALIFIKACJE
    Nadzór budowlany, Rysunek konstrukcyjny, AutoCAD, Prawo budowlane

    SZKOŁY
    Politechnika Śląska (2012 - 2017)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Andrzej Korporacyjny');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Przedsiębiorstwo Robót Inżynieryjnych');
  });

  // 12. Paginacja wklejona w środku tekstu (Strona 1 z 2, Strona 2 z 2)
  it('12. Nagłówki paginacji PDF (Strona 1 z 2, Page 2 of 2) rozbijające tekst', () => {
    const rawCv = `
    Kamil Paginacja
    kamil.kartka@druk.pl | 602 888 111 | Kraków

    DOŚWIADCZENIE ZAWODOWE
    Druk-Polska Kraków | Operator Maszyn Drukarskich
    01.2021 - obecnie
    - Obsługa maszyn offsetowych Heidelberg

    Strona 1 z 2

    Poligrafia Kraków - Pomocnik Maszynisty (2018 - 2021)
    - Przygotowywanie farb i płyt offsetowych

    Strona 2 z 2

    UMIEJĘTNOŚCI
    Druk offsetowy, Maszyny Heidelberg, Przygotowanie płyt, Kontrola barwy

    SZKOŁY
    Technikum Poligraficzne w Krakowie (2014 - 2018)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Kamil Paginacja');
    expect(parsed.history.length).toBe(2);
    expect(parsed.education.length).toBe(1);
  });

  // 13. Zwarte linie oddzielone średnikami (Format CSV-like)
  it('13. Format ze średnikami rozdzielającymi dane', () => {
    const rawCv = `
    Grzegorz Średnik; grzegorz.srednik@magazyn.pl; 700 800 900; Szczecin

    DOŚWIADCZENIE ZAWODOWE:
    Port Szczecin Logistyka; Operator Suwnicy; 05.2020 - obecnie;
    - Przeładunek kontenerów morskich suwnicami nabrzeżowymi

    Morski Terminal; Magazynier; 2017 - 2020;
    - Obsługa wózków widłowych

    UPRAWNIENIA:
    Uprawnienia UDT na suwnice pomostowe i bramowe - 2020;
    Uprawnienia na wózki widłowe UDT - 2017;

    SZKOŁY:
    Zespół Szkół Morskich w Szczecinie (2013 - 2017)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Grzegorz Średnik');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
  });

  // 14. Podwójne nawiasy i skróty certyfikacji w tytule stanowiska
  it('14. Złożone tytuły stanowisk z nawiasami (Kierownik Projektu (PMP/Scrum Master) [IT])', () => {
    const rawCv = `
    Klaudia Złożona
    klaudia.pm@fintech.io | 509 333 111 | Warszawa

    PRZEBIEG PRACY
    Fintech Cloud Poland | Kierownik Projektu (PMP / Agile Coach) [Dział IT]
    09.2020 – obecnie
    - Prowadzenie projektów transformacji chmurowej

    Software House - Scrum Master (2017 - 2020)
    - Facylitacja ceremonii Scrum dla 3 zespołów dev

    CERTYFIKATY
    Project Management Professional (PMP) - PMI - 2020
    Professional Scrum Master II (PSM II) - Scrum.org - 2021

    UMIEJĘTNOŚCI
    Zarządzanie projektami, Scrum, Agile, Jira, PMP, Budżetowanie

    EDUKACJA
    SGH w Warszawie (2012 - 2017)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Klaudia Złożona');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].role).toContain('Kierownik Projektu');
    expect(parsed.certifications.length).toBe(2);
  });

  // 15. Brak słowa "rok" / "r." – same liczby i myślniki 2019-2022
  it('15. Daty w formacie samych lat ze spłaszczonymi myślnikami 2019-2023', () => {
    const rawCv = `
    Radosław Prosty
    radoslaw.prosty@produkcja.pl | 600 444 888 | Rzeszów

    MIEJSCA PRACY
    Wytwórnia Sprzętu Rzeszów | Tokarz CNC
    2019-2023
    - Obróbka elementów lotniczych na tokarce CNC Okuma

    Metal-Styl - Frezer (2016-2019)
    - Frezowanie korpusów pomp

    KWALIFIKACJE
    Obsługa maszyn CNC, Tokarka CNC, Rysunek techniczny, Suwmiarka

    SZKOŁY
    ZST w Rzeszowie (2012-2016)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Radosław Prosty');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].startDate).toBe('2019');
    expect(parsed.history[0].endDate).toBe('2023');
  });

  // 16. Wklejony fragment z JSON / Notatnika programisty
  it('16. Wklejone struktury słownikowe z formatu tekstowego', () => {
    const rawCv = `
    Jan Developer
    Email: jan.dev@coding.com
    Telefon: +48 505 606 707
    Lokalizacja: Lublin

    DOŚWIADCZENIE:
    Company: CyberTech Lublin
    Role: Senior Python Developer
    Period: 01.2021 - Present
    - Backend development in Django and FastAPI
    - Microservices architecture with Docker

    Company: CodeBase - Junior Dev (2018 - 2021)
    - Writing unit tests and REST APIs

    SKILLS:
    Python, Django, FastAPI, Docker, PostgreSQL, Redis, Git

    EDUCATION:
    Politechnika Lubelska (2014 - 2018)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Jan Developer');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].startDate).toBe('01-2021');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.hardSkills).toContain('Python');
  });

  // 17. Sekcja umiejętności zapisana w formie długich zdań
  it('17. Umiejętności opisane pełnymi zdaniami w punktach', () => {
    const rawCv = `
    Beata Konsultant
    beata.konsultant@hr.pl | 601 234 567 | Warszawa

    DOŚWIADCZENIE ZAWODOWE
    HR Advisory Warszawa | Rekruter IT
    05.2020 - obecnie
    - Prowadzenie procesów rekrutacyjnych end-to-end na stanowiska inżynierskie

    Job-Agency - Asystent HR (2018 - 2020)
    - Weryfikacja profili kandydatów na LinkedIn

    UMIEJĘTNOŚCI
    Biegła znajomość platformy LinkedIn Recruiter, Prowadzenie rozmów kwalifikacyjnych, Negocjacje ofert, Excel

    SZKOŁY
    Uniwersytet Warszawski (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Beata Konsultant');
    expect(parsed.history.length).toBe(2);
  });

  // 18. Hybryda polsko-angielska w nagłówkach i opisach
  it('18. Hybrydowe nazewnictwo polsko-angielskie (Work Experience & Edukacja)', () => {
    const rawCv = `
    Wiktor Hybrydowy
    wiktor.hybrid@tech.pl | 512 888 333 | Kraków

    PROFESSIONAL EXPERIENCE
    Fintech Lab Kraków | Java Developer
    03.2021 - Present
    • Developing microservices with Spring Boot and Kafka
    • Optymalizacja zapytań w bazie PostgreSQL

    Software Solutions - Junior Developer (2018 - 2021)
    • Bug fixing and code refactoring

    TECHNICAL SKILLS
    Java, Spring Boot, Kafka, PostgreSQL, Docker, Git

    WYKSZTAŁCENIE
    AGH w Krakowie
    Magister Inżynier: Informatyka (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Wiktor Hybrydowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.hardSkills).toContain('Java');
    expect(parsed.education.length).toBe(1);
  });

  // 19. Duża liczba certyfikatów z różnymi formatami dat
  it('19. Wiele certyfikatów z różnymi formatami dat (miesiące, lata w nawiasach)', () => {
    const rawCv = `
    Krzysztof Certyfikowany
    krzysztof.certs@security.pl | 609 777 444 | Warszawa

    DOŚWIADCZENIE ZAWODOWE
    Sec-Ops Warszawa | Security Consultant
    01.2021 - obecnie
    - Audyty bezpieczeństwa infrastruktury sieciowej

    Net-Sec - Administrator Sieci (2018 - 2021)
    - Zarządzanie firewallami Cisco i Palo Alto

    CERTYFIKATY
    Cisco Certified Network Associate (CCNA) - 2019
    CompTIA Security+ (05.2021)
    Certified Information Systems Security Professional (CISSP) - 2022

    UMIEJĘTNOŚCI
    Bezpieczeństwo sieci, Cisco, Firewalle, Linux, Wireshark, Python

    SZKOŁY
    WAT w Warszawie (2014 - 2018)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Krzysztof Certyfikowany');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(3);
  });

  // 20. Ekstremalny chaos + Pełne scalenie z MasterVault
  it('20. Ekstremalny chaos ze scaleniem z MasterVault i zachowaniem integralności', () => {
    const rawCv = `
    === KANDYDAT ===
    Bogusław Wszystko-W-Jednym
    Email: boguslaw.all@budownictwo.pl, Tel: 501 999 000, Miasto: Katowice
    Stanowisko: Monter Instalacji i Automatyk

    O MNIE:
    Wszechstronny specjalista z uprawnieniami SEP, F-Gazy i doświadczeniem budowlanym.

    MIEJSCA PRACY:
    Instal-Katowice Sp. z o.o. | Monter / Automatyk
    04.2020 – dzisiaj
    - Montaż instalacji HVAC, pomp ciepła i kotłowni
    - Programowanie prostych sterowników PLC

    Bud-Serwis - Pomocnik Montera (od 2016r do 2020r)
    - Prace instalacyjne i montaż tras kablowych

    KWALIFIKACJE I UPRAWNIENIA:
    Uprawnienia SEP E+D do 1kV - 2020
    Certyfikat F-Gazy personelu - 2021
    Prawo jazdy kat. B i C - 2015

    UMIEJĘTNOŚCI:
    Montaż instalacji sanitarnych, Pompy ciepła, Kocioł gazowy, Automatyka przemysłowa, Lutowanie twarde

    SZKOŁY:
    Zespół Szkół Technicznych w Katowicach (2012 - 2016)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Bogusław Wszystko-W-Jednym');
    expect(parsed.personalInfo.email).toBe('boguslaw.all@budownictwo.pl');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].startDate).toBe('04-2020');
    expect(parsed.history[0].endDate).toBe('Obecnie');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.certifications.length).toBe(3);
    expect(parsed.education.length).toBe(1);

    // Weryfikacja scalania z MasterVault
    const baseVault = createMockVault('Bogusław');
    const merged = mergeImportedVault(baseVault, {
      personalInfo: parsed.personalInfo,
      skillsMatrix: {
        hardSkills: parsed.hardSkills,
        softSkills: parsed.softSkills,
        toolsAndTech: parsed.toolsAndTech,
        certifications: parsed.certifications,
      },
      history: parsed.history,
      education: parsed.education,
    });

    expect(merged.personalInfo.fullName).toBe('Bogusław Wszystko-W-Jednym');
    expect(merged.history.length).toBe(3); // 1 base + 2 imported
    expect(merged.education.length).toBe(1);
    expect(merged.skillsMatrix.certifications.length).toBe(3);
  });
});
