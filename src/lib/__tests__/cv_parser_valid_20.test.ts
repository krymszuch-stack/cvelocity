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
        city: 'Kraków',
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
      location: 'Kraków',
      title: 'Pracownik',
      summary: 'Profil bazowy.',
    },
    skillsMatrix: {
      hardSkills: ['Podstawowe narzędzia'],
      softSkills: ['Punktualność'],
      toolsAndTech: [],
      certifications: [],
    },
    history: [
      {
        id: 'base_exp_1',
        company: 'Stary Zakład',
        role: 'Pracownik pomocniczy',
        location: 'Kraków',
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

describe('20 Additional Proper & Two-Column CV Profiles', () => {
  // 1. Architekt wnętrz / Projektant CAD
  it('1. Architekt wnętrz / Projektant CAD (AutoCAD, SketchUp, ASP Kraków)', () => {
    const cv = `
    Katarzyna Projektowa
    katarzyna.wnetrza@archistudio.pl | 601 333 999 | Kraków
    Stanowisko: Architekt Wnętrz / Projektant CAD

    PODSUMOWANIE ZAWODOWE
    Architektka wnętrz z 6-letnim doświadczeniem w projektowaniu przestrzeni mieszkalnych i komercyjnych.

    DOŚWIADCZENIE ZAWODOWE
    Archi-Art Studio Kraków | Starszy Projektant Wnętrz
    04.2021 - obecnie
    - Kompleksowe projekty wykonawcze wnętrz mieszkalnych i biurowych
    - Przygotowywanie dokumentacji technicznej 2D/3D w programie AutoCAD
    - Nadzory autorskie na budowach i koordynacja prac podwykonawców

    Wnętrza Plus - Asystent Architekta (2018 - 2021)
    - Tworzenie wizualizacji 3D w SketchUp i V-Ray

    UMIEJĘTNOŚCI
    AutoCAD, SketchUp, V-Ray, Rysunek techniczny, Nadzory autorskie, Dobór materiałów wykończeniowych

    EDUKACJA
    Akademia Sztuk Pięknych w Krakowie
    Magister: Architektura Wnętrz (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Katarzyna Projektowa');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Archi-Art');
    expect(parsed.education.length).toBe(1);
    expect(parsed.hardSkills).toContain('AutoCAD');
  });

  // 2. Spawacz rurociągów naftowych / TIG 141
  it('2. Spawacz rurociągów naftowych / TIG 141 (uprawnienia TÜV, badania RT/UT)', () => {
    const cv = `
    Mariusz Przetop
    mariusz.spawacz@petro-mont.pl | 502 444 888 | Płock
    Rola: Spawacz Rurociągów Ciśnieniowych TIG 141

    DOŚWIADCZENIE ZAWODOWE
    Nafto-Montaż Płock - Spawacz TIG 141
    02.2020 – obecnie
    • Spawanie rurociągów technologicznych pod próby ciśnieniowe i badania RT/UT
    • Przetopy rur ze stali austenitycznej i kotłowej w pozycjach H-L045
    • Praca zgodnie z normą PN-EN ISO 9606-1

    Petro-Serwis - Spawacz Monter (2016 - 2020)
    • Prefabrykacja węzłów cieplnych i rurociągów parowych

    KWALIFIKACJE I UPRAWNIENIA
    Spawanie TIG, TIG 141, Spawanie rurociągów, Rysunek izometryczny, Próby ciśnieniowe

    CERTYFIKATY
    Certyfikat UDT EN ISO 9606-1 TIG 141 FM5 - 2020
    Uprawnienia TÜV Rheinland na rury ciśnieniowe - 2021

    SZKOŁY
    Zespół Szkół Zawodowych w Płocku (2013 - 2016)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Mariusz Przetop');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.hardSkills).toContain('Spawanie TIG');
  });

  // 3. Specjalista ds. logistyki (SAP ERP, WMS)
  it('3. Specjalista ds. logistyki i łańcucha dostaw (SAP ERP, WMS, planowanie)', () => {
    const cv = `
    Tomasz Magazynowy
    tomasz.logistyka@supplychain.pl | 609 555 333 | Poznań
    Tytuł: Supply Chain & Logistics Specialist

    DOŚWIADCZENIE ZAWODOWE
    Logistics Poland Poznań | Specjalista ds. Planowania Dostaw
    06.2021 - obecnie
    - Zarządzanie stanami magazynowymi w systemie SAP ERP
    - Koordynacja dostaw materiałów produkcyjnych w modelu Just-In-Time
    - Optymalizacja wskaźników rotacji zapasów i poziomu obsługi klienta

    Centrum Dystrybucyjne - Koordynator Logistyki (2018 - 2021)
    - Praca z systemem WMS i rozliczanie dyspozycji magazynowych

    UMIEJĘTNOŚCI
    SAP, System WMS, Inwentaryzacja, Planowanie zapasów, Excel zaawansowany

    EDUKACJA
    Uniwersytet Ekonomiczny w Poznaniu
    Magister: Logistyka Międzynarodowa (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Tomasz Magazynowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.hardSkills).toContain('SAP');
    expect(parsed.hardSkills).toContain('System WMS');
  });

  // 4. Cieśla szalunkowy / Zbrojarz
  it('4. Cieśla szalunkowy / Zbrojarz (szalunki Peri, Doka, montaż zbrojenia)', () => {
    const cv = `
    Grzegorz Budowlany
    grzegorz.szalunki@budopol.pl | 511 222 333 | Warszawa
    Stanowisko: Cieśla Szalunkowy / Zbrojarz

    DOŚWIADCZENIE ZAWODOWE
    Budopol Warszawa | Brygadzista Cieśli Szalunkowych
    05.2020 - obecnie
    • Montaż szalunków ściennych i stropowych systemów Peri oraz Doka
    • Prefabrykacja i wiązanie szkieletów zbrojeniowych zgodnie z projektem
    • Nadzór nad zalewaniem elementów betonowych i wibrowaniem mieszanki

    Beton-Stal - Cieśla Konstrukcyjny (2016 - 2020)
    • Montaż szalunków tradycyjnych drewnianych i schodowych

    KWALIFIKACJE
    Szalunki Peri, Szalunki Doka, Montaż zbrojenia, Rysunek zbrojeniowy, Wibrowanie betonu

    SZKOŁY
    Zasadnicza Szkoła Zawodowa Budowlana w Radomiu (2013 - 2016)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Grzegorz Budowlany');
    expect(parsed.history.length).toBe(2);
    expect(parsed.education.length).toBe(1);
  });

  // 5. Inżynier DevOps / Cloud Architect
  it('5. Inżynier DevOps / Cloud Architect (Kubernetes, Terraform, AWS, CI/CD)', () => {
    const cv = `
    Michał Chmurowy
    michal.devops@cloudinfra.io | +48 508 999 111 | Warszawa
    Stanowisko: Senior DevOps Engineer

    DOŚWIADCZENIE ZAWODOWE
    CloudTech Solutions - Senior DevOps Engineer
    03.2021 – obecnie
    - Budowa i utrzymanie klastrów Kubernetes (EKS) na platformie AWS
    - Automatyzacja infrastruktury za pomocą Terraform i Terragrunt
    - Konfiguracja potoków CI/CD w GitHub Actions oraz ArgoCD

    Fintech Software - DevOps Specialist (2018 - 2021)
    - Wdrażanie mikroserwisów w kontenerach Docker i monitoring w Prometheus/Grafana

    UMIEJĘTNOŚCI
    Kubernetes, Docker, Terraform, AWS, CI/CD, Linux, Python, Git, Prometheus, Grafana

    CERTYFIKATY
    AWS Certified Solutions Architect – Associate - 2021
    Certified Kubernetes Administrator (CKA) - 2022

    EDUKACJA
    Politechnika Warszawska
    Magister Inżynier: Informatyka (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Michał Chmurowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.hardSkills).toContain('Kubernetes');
    expect(parsed.hardSkills).toContain('Terraform');
  });

  // 6. Kosztorysant budowlany
  it('6. Kosztorysant budowlany (Norma PRO, przedmiary robót, KNR)', () => {
    const cv = `
    Ewa Kosztorysowa
    ewa.kosztorysy@inwestycje.pl | 602 111 555 | Poznań
    Rola: Kosztorysant Budowlany

    DOŚWIADCZENIE ZAWODOWE
    Inwest-Bud Poznań | Główny Kosztorysant
    01.2020 - obecnie
    - Sporządzanie kosztorysów inwestorskich, ofertowych i powykonawczych w programie Norma PRO
    - Analiza dokumentacji projektowej i wykonywanie szczegółowych przedmiarów robót
    - Weryfikacja cen materiałów, sprzętu i stawek robocizny zgodnie z KNR

    Generalny Wykonawca - Asystent Kosztorysanta (2017 - 2020)
    - Przygotowywanie wycen pod przetargi publiczne

    KOMPETENCJE
    Norma PRO, Przedmiary robót, Kosztorysowanie, KNR, AutoCAD, Excel, Prawo budowlane

    EDUKACJA
    Politechnika Poznańska
    Inżynier: Budownictwo Ogólne (2013 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Ewa Kosztorysowa');
    expect(parsed.history.length).toBe(2);
    expect(parsed.education.length).toBe(1);
  });

  // 7. Monter turbin wiatrowych / Technik OZE
  it('7. Monter turbin wiatrowych / Technik OZE (GWO BST, turbiny morskie, SEP)', () => {
    const cv = `
    Dominik Wiatrowy
    dominik.oze@windpower.pl | 604 777 222 | Koszalin
    Specjalność: Technik Turbin Wiatrowych / Serwisant OZE

    DOŚWIADCZENIE ZAWODOWE
    Wind-Service Poland | Serwisant Turbin Wiatrowych
    08.2020 – obecnie
    • Przeglądy okresowe i serwis mechaniczny turbin wiatrowych Vestas i Siemens
    • Diagnostyka przekładni głównych, łożysk generatora i układów hydrauliki
    • Praca na wysokościach do 120m na farmach wiatrowych on-shore i off-shore

    OZE-Montaż - Monter Farm Wiatrowych (2018 - 2020)
    • Montaż komponentów wież wiatrowych i instalacji teletechnicznych

    UPRAWNIENIA I CERTYFIKATY
    Certyfikat GWO BST (Global Wind Organisation) - 2020
    Uprawnienia SEP E+D do 1kV - 2021

    KWALIFIKACJE
    Serwis turbin wiatrowych, Hydraulika siłowa, Praca na wysokości, Uprawnienia SEP

    SZKOŁY
    Technikum Energetyczne w Koszalinie (2014 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Dominik Wiatrowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.hardSkills).toContain('Uprawnienia SEP');
  });

  // 8. Lekarz stomatolog / Dentysta
  it('8. Lekarz stomatolog (leczenie kanałowe pod mikroskopem, protetyka, ŚUM)', () => {
    const cv = `
    Magdalena Dentystyczna
    magda.stomatolog@klinika-usmiechu.pl | 506 333 111 | Katowice
    Tytuł: Lekarz Dentysta

    DOŚWIADCZENIE ZAWODOWE
    Klinika Stomatologiczna Katowice | Lekarz Stomatolog
    10.2020 - obecnie
    - Leczenie endodontyczne powikłanych zębów pod mikroskopem zabiegowym
    - Wykonywanie uzupełnień protetycznych (korony, mosty cyrkonowe, licówki)
    - Stomatologia zachowawcza i estetyczna z odbudową kompozytową

    Praktyka Stomatologiczna - Lekarz Stażysta (2019 - 2020)
    - Prowadzenie stażu podyplomowego lekarza dentysty

    UMIEJĘTNOŚCI
    Endodoncja mikroskopowa, Protetyka stomatologiczna, Stomatologia zachowawcza, Znieczulenia miejscowe

    EDUKACJA
    Śląski Uniwersytet Medyczny w Katowicach
    Kierunek Lekarsko-Dentystyczny (2014 - 2019)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Magdalena Dentystyczna');
    expect(parsed.history.length).toBe(2);
    expect(parsed.education.length).toBe(1);
  });

  // 9. Operator koparki / Maszyn roboczych
  it('9. Operator koparki (klasa I IMBiGS, koparki jednonaczyniowe)', () => {
    const cv = `
    Rafał Ziemny
    rafal.koparka@drogbud.pl | 501 888 222 | Kielce
    Stanowisko: Operator Koparki Gąsienicowej i Kołowej

    DOŚWIADCZENIE ZAWODOWE
    Drog-Bud Kielce | Operator Ciężkiego Sprzętu Budowlanego
    03.2019 – obecnie
    • Wykopy pod fundamenty, kanalizację i sieci gazowe koparkami 20-35 ton (CAT, Volvo)
    • Skarpowanie nasypów, profilowanie terenu z użyciem systemów 3D GPS
    • Bieżąca konserwacja i smarowanie układów hydraulicznych maszyny

    Roboty Ziemne Kielce - Operator Koparko-Ładowarki (2016 - 2019)
    • Prace załadunkowe kruszywa i korytowanie pod drogi

    UPRAWNIENIA
    Uprawnienia IMBiGS Operatora Koparek Jednonaczyniowych kl. I (bez ograniczeń) - 2019
    Prawo jazdy kat. B i C - 2015

    KWALIFIKACJE
    Obsługa koparki, Roboty ziemne, Hydraulika siłowa, Odczyt planów niwelacyjnych

    SZKOŁY
    Zespół Szkół Zawodowych w Kielcach (2012 - 2015)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Rafał Ziemny');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
  });

  // 10. Doradca klienta bankowego / Bankier
  it('10. Doradca klienta bankowego (kredyty hipoteczne, MIFID II, finanse)', () => {
    const cv = `
    Monika Bankowa
    monika.finanse@bankpolska.pl | 603 222 777 | Wrocław
    Stanowisko: Doradca Klienta Indywidualnego i Biznesowego

    DOŚWIADCZENIE ZAWODOWE
    Bank Polska Wrocław | Starszy Doradca Finansowy
    07.2020 – obecnie
    - Kompleksowa obsługa wniosków o kredyty hipoteczne i gotówkowe
    - Doradztwo w zakresie produktów inwestycyjnych i depozytowych
    - Realizacja celów sprzedażowych na poziomie 115%

    Credit Plus - Młodszy Doradca Klienta (2017 - 2020)
    - Bieżąca obsługa rachunków bankowych i transakcji kasowych

    CERTYFIKATY
    Certyfikat Europejski Doradca Finansowy EFG - 2021
    Uprawnienia MIFID II - 2020

    UMIEJĘTNOŚCI
    Kredyty hipoteczne, Produkty inwestycyjne, MIFID II, Negocjacje finansowe, Obsługa klienta

    EDUKACJA
    Uniwersytet Ekonomiczny we Wrocławiu
    Magister: Bankowość i Rynki Finansowe (2012 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Monika Bankowa');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
  });

  // 11. Mechatronik / Serwisant automatyki
  it('11. Mechatronik / Serwisant automatyki (falowniki, linie produkcyjne, czujniki)', () => {
    const cv = `
    Kamil Mechatronik
    kamil.automatyka@serwis-przemyslowy.pl | 505 111 666 | Gliwice
    Rola: Inżynier Serwisu Automatyki i Mechatroniki

    DOŚWIADCZENIE ZAWODOWE
    Serwis Przemysłowy Gliwice - Inżynier Serwisu
    04.2021 - obecnie
    • Usuwanie awarii linii produkcyjnych, robotów KUKA i podajników
    • Parametryzacja falowników i serwonapędów Siemens, Danfoss, SEW
    • Wymiana i kalibracja czujników optycznych, indukcyjnych i enkoderów

    Automatyka-Tech - Technik Mechatronik (2018 - 2021)
    • Montaż i okablowanie szaf automatyki przemysłowej

    KWALIFIKACJE
    Automatyka przemysłowa, Programowanie PLC, Falowniki, Roboty KUKA, Pomiary elektryczne

    CERTYFIKATY
    Świadectwo SEP E+D do 1kV - 2021

    EDUKACJA
    Politechnika Śląska w Gliwicach
    Inżynier: Mechatronika Przemysłowa (2014 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Kamil Mechatronik');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.hardSkills).toContain('Automatyka przemysłowa');
  });

  // 12. Pielęgniarz anestezjologiczny
  it('12. Pielęgniarz anestezjologiczny (asysta przy znieczuleniach, intubacja, OIT)', () => {
    const cv = `
    Piotr Anestezjologiczny
    piotr.anestezja@szpital-wojewodzki.pl | 509 666 444 | Lublin
    Stanowisko: Pielęgniarz Anestezjologiczny i Intensywnej Terapii

    DOŚWIADCZENIE ZAWODOWE
    Szpital Wojewódzki w Lublinie | Pielęgniarz Anestezjologiczny
    02.2019 - obecnie
    - Asysta lekarzowi anestezjologowi przy znieczuleniach ogólnych i przewodowych
    - Przygotowanie aparatury anestezjologicznej, leków narkotycznych i zestawów intubacyjnych
    - Opieka nad pacjentem na sali wybudzeń i oddziale intensywnej terapii

    Szpital Miejski Lublin - Pielęgniarz Odcinkowy (2016 - 2019)
    - Dyżury na oddziale kardiologicznym

    CERTYFIKATY
    Specjalizacja w dziedzinie pielęgniarstwa anestezjologicznego i intensywnej opieki - 2021
    Prawo Wykonywania Zawodu Pielęgniarza - 2016

    UMIEJĘTNOŚCI
    Asysta anestezjologiczna, Intubacja, Obsługa respiratora, Podawanie leków, Kaniulacja żył

    EDUKACJA
    Uniwersytet Medyczny w Lublinie
    Magister: Pielęgniarstwo (2014 - 2016)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Piotr Anestezjologiczny');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
  });

  // 13. Specjalista ds. kadr i płac
  it('13. Specjalista ds. kadr i płac (Enova 365, Płatnik, PPK, rozliczenia)', () => {
    const cv = `
    Halina Kadrowa
    halina.kadry@hr-serwis.pl | 601 999 444 | Łódź
    Stanowisko: Starszy Specjalista ds. Kadr i Płac

    DOŚWIADCZENIE ZAWODOWE
    HR-Serwis Łódź | Specjalista ds. Kadr i Płac
    09.2020 – obecnie
    • Samodzielne naliczanie wynagrodzeń dla 300 pracowników w systemie Enova 365
    • Sporządzanie deklaracji rozliczeniowych ZUS DRA w programie Płatnik
    • Prowadzenie akt osobowych i rozliczanie umów o pracę, zlecenia, PPK

    Biuro Rachunkowe Łódź - Asystent ds. Kadr (2017 - 2020)
    • Ewidencja czasu pracy i rozliczanie urlopów

    KOMPETENCJE
    Płatnik, Enova, Kadry i płace, Deklaracje ZUS, Rozliczanie PPK, Kodeks Pracy

    EDUKACJA
    Uniwersytet Łódzki
    Licencjat: Zarządzanie Zasobami Ludzkimi (2014 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Halina Kadrowa');
    expect(parsed.history.length).toBe(2);
    expect(parsed.hardSkills).toContain('Płatnik');
    expect(parsed.hardSkills).toContain('Enova');
  });

  // 14. Monter konstrukcji stalowych / Alpinista przemysłowy
  it('14. Monter konstrukcji stalowych / Alpinista przemysłowy (IRATA, maszty GSM)', () => {
    const cv = `
    Krzysztof Wysoki
    krzysztof.alpinista@rope-access.pl | 512 777 999 | Gdynia
    Stanowisko: Alpinista Przemysłowy / Monter Konstrukcji Stalowych

    DOŚWIADCZENIE ZAWODOWE
    Rope-Access Poland Gdynia - Monter Wysokościowy
    06.2020 - obecnie
    - Montaż konstrukcji stalowych i anten GSM na masztach radiowych
    - Czyszczenie ciśnieniowe i malowanie antykorozyjne konstrukcji stoczniowych
    - Wykonywanie prac w technikach dostępu linowego IRATA

    Stal-Bud - Monter Konstrukcji (2017 - 2020)
    - Skręcanie konstrukcji hal magazynowych

    CERTYFIKATY
    Certyfikat Dostęp Linowy IRATA Level 1 - 2020
    Uprawnienia do montażu połączeń śrubowych sprężanych (HV) - 2021

    KWALIFIKACJE
    Techniki linowe IRATA, Praca na wysokości, Montaż konstrukcji stalowych, Antykorozja

    SZKOŁY
    Zespół Szkół Technicznych w Gdyni (2013 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Krzysztof Wysoki');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
  });

  // 15. Data Scientist / ML Engineer
  it('15. Data Scientist / ML Engineer (Python, PyTorch, SQL, Pandas)', () => {
    const cv = `
    Artur Danowy
    artur.ml@data-science.io | +48 504 111 888 | Warszawa
    Stanowisko: Senior Data Scientist

    DOŚWIADCZENIE ZAWODOWE
    AI Analytics Warszawa | Data Scientist
    02.2021 – obecnie
    • Trenowanie modeli uczenia maszynowego (PyTorch, Scikit-learn) do detekcji fraudów
    • Budowa potoków przetwarzania danych w Pythonie i zapytaniach PostgreSQL
    • Wdrażanie modeli w architekturze mikroserwisowej z FastAPI i Dockerem

    Fintech Data - Junior Data Analyst (2018 - 2021)
    • Analiza zachowań użytkowników i raportowanie w Tableau

    UMIEJĘTNOŚCI
    Python, SQL, PostgreSQL, Docker, FastAPI, PyTorch, Pandas, Scikit-learn, Git

    EDUKACJA
    Uniwersytet Warszawski
    Magister: Matematyka Stosowana i Data Science (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Artur Danowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.hardSkills).toContain('Python');
    expect(parsed.hardSkills).toContain('SQL');
  });

  // 16. Ślusarz maszynowy / Mechanik UR
  it('16. Ślusarz maszynowy / Mechanik UR (hydraulika siłowa, pneumatyka)', () => {
    const cv = `
    Bogusław Mechaniczny
    boguslaw.ur@fabryka-maszyn.pl | 600 333 888 | Bydgoszcz
    Rola: Mechanik Utrzymania Ruchu (UR)

    DOŚWIADCZENIE ZAWODOWE
    Fabryka Mebli Bydgoszcz | Ślusarz / Mechanik UR
    05.2019 - obecnie
    - Diagnostyka i naprawa układów hydrauliki siłowej i pneumatyki Festo
    - Wymiana łożysk, pasów napędowych, przekładni i pomp próżniowych
    - Dorabianie elementów mechanicznych na tokarce i frezarce konwencjonalnej

    Metal-Remont - Pomocnik Ślusarza (2016 - 2019)
    - Demontaż i regeneracja podzespołów maszyn produkcyjnych

    KWALIFIKACJE
    Hydraulika siłowa, Pneumatyka, Rysunek techniczny, Tokarka konwencjonalna, Spawanie MAG

    SZKOŁY
    Technikum Mechaniczne w Bydgoszczy (2012 - 2016)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Bogusław Mechaniczny');
    expect(parsed.history.length).toBe(2);
    expect(parsed.education.length).toBe(1);
  });

  // 17. Programista Java / Backend Developer
  it('17. Programista Java / Backend Developer (Spring Boot, Kafka, Docker)', () => {
    const cv = `
    Paweł Javowy
    pawel.backend@softwarehub.pl | 502 666 111 | Kraków
    Stanowisko: Senior Java Developer

    DOŚWIADCZENIE ZAWODOWE
    SoftwareHub Kraków - Senior Java Developer
    01.2021 – obecnie
    • Rozwój systemów bankowości internetowej w oparciu o Java 17 i Spring Boot
    • Implementacja komunikacji asynchronicznej z wykorzystaniem Apache Kafka
    • Tworzenie testów integracyjnych i optymalizacja zapytań Hibernate / PostgreSQL

    CodeCraft - Java Developer (2018 - 2020)
    • Budowa interfejsów REST API i konteneryzacja w Dockerze

    UMIEJĘTNOŚCI
    Java, Spring Boot, PostgreSQL, Docker, Git, Kafka, REST API, Microservices, Jira

    EDUKACJA
    Akademia Górniczo-Hutnicza w Krakowie
    Magister Inżynier: Informatyka Stosowana (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Paweł Javowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.hardSkills).toContain('Java');
    expect(parsed.hardSkills).toContain('Spring Boot');
  });

  // 18. Fizjoterapeuta / Rehabilitant
  it('18. Fizjoterapeuta / Rehabilitant (terapia manualna, prawo wykonywania zawodu KIF)', () => {
    const cv = `
    Aleksandra Zdrowa
    aleksandra.fizjo@centrum-rehabilitacji.pl | 609 444 888 | Wrocław
    Tytuł: Magister Fizjoterapii

    DOŚWIADCZENIE ZAWODOWE
    Centrum Rehabilitacji Wrocław | Fizjoterapeuta
    10.2020 - obecnie
    - Prowadzenie terapii manualnej pacjentów po urazach ortopedycznych i operacjach
    - Kinezyterapia indywidualna oraz dobór ćwiczeń stabilizacyjnych
    - Wykonywanie zabiegów fizykoterapii (laseroterapia, elektroterapia, krioterapia)

    Ośrodek Zdrowia - Fizjoterapeuta Stażysta (2019 - 2020)
    - Rehabilitacja pacjentów geriatrycznych

    CERTYFIKATY
    Certyfikat Terapii Manualnej według koncepcji Kaltenborn-Evjenth - 2021
    Prawo Wykonywania Zawodu Fizjoterapeuty (Krajowa Izba Fizjoterapeutów) - 2019

    UMIEJĘTNOŚCI
    Terapia manualna, Kinezyterapia, Fizykoterapia, Masaż leczniczy, Kinesiotaping

    EDUKACJA
    Akademia Wychowania Fizycznego we Wrocławiu
    Magister: Fizjoterapia (2014 - 2019)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Aleksandra Zdrowa');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
  });

  // 19. Kierownik budowy / Inżynier budowy
  it('19. Kierownik budowy / Inżynier budowy (uprawnienia budowlane bez ograniczeń)', () => {
    const cv = `
    Stanisław Inżynierski
    stanislaw.budowa@generalny-wykonawca.pl | 601 555 888 | Gdańsk
    Stanowisko: Kierownik Budowy

    DOŚWIADCZENIE ZAWODOWE
    Generalny Wykonawca Północ Gdańsk | Kierownik Budowy
    03.2020 – obecnie
    • Prowadzenie budowy osiedla mieszkaniowego wielorodzinnego (kubatura 45 000 m3)
    • Nadzór nad jakością robót, harmonogramem prac i budżetem inwestycji
    • Koordynacja pracy 15 podwykonawców oraz odbiory techniczne z inspektorami nadzoru

    Gdańsk-Bud - Inżynier Budowy (2016 - 2020)
    • Nadzór nad robotami żelbetowymi i montażem stolarki

    CERTYFIKATY
    Uprawnienia budowlane do kierowania robotami budowlanymi bez ograniczeń w specjalności konstrukcyjno-budowlanej - 2020
    Członek Polskiej Izby Inżynierów Budownictwa (PIIB) - 2020

    KWALIFIKACJE
    Zarządzanie budową, Uprawnienia budowlane, Harmonogramowanie, Kosztorysowanie, AutoCAD

    EDUKACJA
    Politechnika Gdańska
    Magister Inżynier: Budownictwo Lądowe (2011 - 2016)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Stanisław Inżynierski');
    expect(parsed.history.length).toBe(2);
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.education.length).toBe(1);
  });

  // 20. Standardowy format dwukolumnowy
  it('20. Standardowy układ dwukolumnowy (dane i skille po lewej, historia po prawej)', () => {
    const cv = `
    Krzysztof Kolumnowy
    krzysztof.kolumny@firma.pl
    Tel: 700 800 900
    Lokalizacja: Warszawa

    UMIEJĘTNOŚCI
    React, TypeScript, Node.js, SQL, Docker, Git

    JĘZYKI
    Angielski - C1
    Niemiecki - B2

    CERTYFIKATY
    Certyfikat Professional Scrum Master I - 2021

    DOŚWIADCZENIE ZAWODOWE
    TechStudio Warszawa | Lead Developer
    06.2021 - obecnie
    - Zarządzanie 5-osobowym zespołem programistów
    - Projektowanie architektury aplikacji webowych

    DevHouse - Frontend Developer (2018 - 2021)
    - Tworzenie komponentów UI w React i Tailwind

    EDUKACJA
    Politechnika Warszawska
    Magister Inżynier: Informatyka (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Krzysztof Kolumnowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.education.length).toBe(1);
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.languages?.length).toBe(2);
    expect(parsed.hardSkills).toContain('React');
    expect(parsed.hardSkills).toContain('TypeScript');

    // Scalenie z MasterVault
    const base = createMockVault('Krzysztof');
    const merged = mergeImportedVault(base, {
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
    expect(merged.history.length).toBe(3);
    expect(merged.skillsMatrix.certifications.length).toBe(1);
  });
});
