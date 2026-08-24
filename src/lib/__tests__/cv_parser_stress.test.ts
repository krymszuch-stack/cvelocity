import { describe, it, expect } from 'vitest';
import { parseTextToMasterVault } from '../cvUniversalParser';
import { mergeImportedVault } from '../vaultImportMerge';
import { MasterVault } from '../../types';

function createMockVault(fullName = 'Użytkownik Testowy'): MasterVault {
  return {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    profiler: {
      flags: ['PHYSICAL'],
      experienceLevel: 'MID',
      location: {
        city: 'Łódź',
        radiusKm: 25,
        willingnessToTravel: false,
        hybridWork: false,
        remoteOnly: false,
      },
      languages: [],
    },
    personalInfo: {
      fullName,
      email: 'test@example.com',
      phone: '500 600 700',
      location: 'Łódź',
      title: 'Pracownik',
      summary: 'Profil bazowy.',
    },
    skillsMatrix: {
      hardSkills: ['Podstawowe narzędzia warsztatowe'],
      softSkills: ['Punktualność'],
      toolsAndTech: [],
      certifications: [],
    },
    history: [
      {
        id: 'hist_base_1',
        company: 'Firma Startowa Sp. z o.o.',
        role: 'Praktykant',
        location: 'Łódź',
        startDate: '2016',
        endDate: '2017',
        isCurrent: false,
        highlights: [],
      },
    ],
    education: [
      {
        id: 'edu_base_1',
        institution: 'Szkoła Podstawowa',
        degree: 'Podstawowe',
        fieldOfStudy: '',
        startDate: '2008',
        endDate: '2014',
      },
    ],
    projects: [],
  };
}

describe('20 Extensive Stress-Test CV Generations & Vault Merging', () => {
  // 1. Stolarz / Cieśla konstrukcyjny
  it('1. Stolarz / Cieśla konstrukcyjny (format z gwiazdkami, obróbka drewna, szkoła zawodowa)', () => {
    const cv = `
    Stanisław Drewniak
    stanislaw.stolarz@onet.pl | 601 222 333 | Zakopane
    Stanowisko: Cieśla konstrukcyjny / Stolarz

    *** PROFIL ZAWODOWY ***
    Doświadczony cieśla z 10-letnim stażem przy wznoszeniu konstrukcji dachowych i domów drewnianych.

    *** HISTORIA PRACY ***
    06.2020 - obecnie
    Drewno-Styl Sp. z o.o. - Mistrz Ciesielski
    • Montaż tradycyjnych więźb dachowych i domów z bali
    • Obsługa maszyn stolarskich: grubościówki, frezarki, pilarki formatowej
    • Czytanie rysunku ciesielskiego i trasowanie elementów

    2015 - 2020
    Cieśla Budowlany | Tartak i Usługi Ciesielskie Podhale
    • Wznoszenie szalunków systemowych i konstrukcji drewnianych

    *** UMIEJĘTNOŚCI ***
    Obróbka drewna, Rysunek techniczny, Montaż więźby dachowej, Obsługa pilarek, Szalunki drewniane

    *** CERTYFIKATY ***
    Uprawnienia do pracy na wysokości powyżej 3m - 2021

    *** SZKOŁY ***
    Zasadnicza Szkoła Zawodowa w Nowym Targu
    Zawód: Cieśla / Stolarz (2012 - 2015)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Stanisław Drewniak');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Drewno-Styl');
    expect(parsed.history[0].role).toContain('Ciesielski');
    expect(parsed.education.length).toBe(1);
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.hardSkills).toContain('Rysunek techniczny');

    const merged = mergeImportedVault(createMockVault(), {
      personalInfo: parsed.personalInfo,
      skillsMatrix: { hardSkills: parsed.hardSkills, softSkills: parsed.softSkills, toolsAndTech: parsed.toolsAndTech, certifications: parsed.certifications },
      history: parsed.history,
      education: parsed.education,
    });
    expect(merged.history.length).toBe(3);
  });

  // 2. Mechanik samochodowy / Diagnosta SKP
  it('2. Mechanik samochodowy / Diagnosta SKP (uprawnienia TDT, oscyloskop, format z pionowymi kreskami)', () => {
    const cv = `
    Grzegorz Warsztatowy
    grzegorz.mechanik@wp.pl | 700 800 900 | Gliwice
    Rola: Diagnosta Samochodowy / Mechanik

    DOŚWIADCZENIE ZAWODOWE
    Auto-Centrum Gliwice | Uprawniony Diagnosta SKP
    01.2019 – obecnie
    - Przeprowadzanie okresowych badań technicznych pojazdów
    - Diagnostyka komputerowa OBD-II i pomiary oscyloskopem
    - Weryfikacja geometrii zawieszenia 3D

    Bosch Service Katowice - Mechanik Samochodowy (2015.06 - 2018.12)
    - Naprawa układów hamulcowych, kierowniczych i zawieszenia

    KWALIFIKACJE ZAWODOWE
    Diagnostyka komputerowa, Pomiary oscyloskopem, Geometria zawieszenia, Układy hamulcowe, Wymiana rozrządu

    UPRAWNIENIA
    Imienne Uprawnienie Diagnosty Pojazdowego (TDT) - 2019
    Prawo jazdy kat. B - 2014

    EDUKACJA
    Technikum Samochodowe w Gliwicach
    Technik Pojazdów Samochodowych (2011 - 2015)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Grzegorz Warsztatowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Auto-Centrum');
    expect(parsed.history[0].role).toContain('Diagnosta');
    expect(parsed.education.length).toBe(1);
    expect(parsed.certifications.length).toBe(2);
  });

  // 3. Pielęgniarka / Położna
  it('3. Pielęgniarka / Położna (prawo wykonywania zawodu PWZ, szpital, format z ukośnikami //)', () => {
    const cv = `
    Joanna Medyczna
    joanna.pielegniarka@szpital.pl | 504 111 222 | Kraków
    Tytuł: Pielęgniarka Oddziałowa

    // PODSUMOWANIE
    Pielęgniarka z 8-letnim doświadczeniem w opiece pooperacyjnej i intensywnej terapii.

    // PRZEBIEG KARIERY
    Szpital Uniwersytecki w Krakowie
    Pielęgniarka Specjalistka (03.2019 - obecnie)
    • Podawanie leków drogą dożylną i domięśniową
    • Obsługa kardiomonitorów, pomp infuzyjnych i respiratorów
    • Prowadzenie dokumentacji medycznej pacjentów

    Szpital Miejski Kraków - Pielęgniarka Odcinkowa (2016 - 2019)
    • Bieżąca opieka nad pacjentami oddziału chirurgii

    // UMIEJĘTNOŚCI
    Podawanie leków, Obsługa pomp infuzyjnych, Kaniulacja żył, RKO, Dokumentacja medyczna

    // CERTYFIKATY
    Kurs Resuscytacji Krążeniowo-Oddechowej (BLS/ALS) - 2022
    Prawo Wykonywania Zawodu Pielęgniarki (PWZ) - 2016

    // SZKOŁY I UCZELNIE
    Uniwersytet Jagielloński - Collegium Medicum
    Magister: Pielęgniarstwo (2014 - 2016)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Joanna Medyczna');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Szpital Uniwersytecki');
    expect(parsed.history[0].role).toContain('Pielęgniarka');
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.education.length).toBe(1);
  });

  // 4. Kucharz / Szef kuchni
  it('4. Kucharz / Szef kuchni (HACCP, food cost, format z myślnikami ---)', () => {
    const cv = `
    Robert Patelnia
    robert.szef@restauracja.pl | 512 345 678 | Gdańsk
    Stanowisko: Szef Kuchni

    --- DOŚWIADCZENIE ---
    Restauracja Portowa Gdańsk - Szef Kuchni
    04.2021 – obecnie
    - Układanie autorskiego menu rybnego i kalkulacja food cost
    - Nadzór nad 8-osobowym zespołem kucharzy i procedurami HACCP
    - Kontrola jakości dostaw świeżych ryb i owoców morza

    Hotel Grand Sopot | Zastępca Szefa Kuchni (Sous Chef)
    2018 - 2021
    - Przygotowywanie dań kuchni europejskiej à la carte

    --- UMIEJĘTNOŚCI ---
    Kuchnia polska, Kuchnia śródziemnomorska, Zarządzanie zespołem, Kalkulacja food cost, Wdrażanie HACCP

    --- KURSY ---
    Szkolenie Zaawansowane Techniki Kulinarne Sous-Vide - 2022

    --- EDUKACJA ---
    Zespół Szkół Gastronomiczno-Hotelarskich w Gdańsku
    Zawód: Kucharz Małej Gastronomii (2015 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Robert Patelnia');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Restauracja Portowa');
    expect(parsed.history[0].role).toContain('Szef Kuchni');
    expect(parsed.education.length).toBe(1);
    expect(parsed.certifications.length).toBe(1);
  });

  // 5. Operator żurawia wieżowego
  it('5. Operator żurawia wieżowego (UDT I Ż, budownictwo wysokościowe, format z rzymską numeracją)', () => {
    const cv = `
    Andrzej Dźwigowy
    andrzej.zuraw@budimex-kontakt.pl | 605 999 111 | Warszawa
    Stanowisko: Operator Żurawia Wieżowego

    I. DOŚWIADCZENIE ZAWODOWE
    Bud-Grup Warszawa | Operator Żurawia Wieżowego
    maj 2019 - obecnie
    - Obsługa żurawi wieżowych górnoobrotowych (Liebherr, Potain)
    - Transport pionowy materiałów budowlanych na budowach wieżowców
    - Codzienna kontrola stanu technicznego lin, haków i zbloczy

    Erbud S.A. - Hakowy / Sygnalista (2017 - 2019)
    - Prawidłowe zawieszanie ładunków i łączność radiowa z operatorem

    II. KWALIFIKACJE
    Obsługa żurawi wieżowych, Uprawnienia UDT, Łączność radiowa, Praca na wysokości

    III. UPRAWNIENIA
    Uprawnienia UDT kat. I Ż na żurawie wieżowe i szybkomontujące - 2019

    IV. SZKOŁY
    Szkoła Branżowa w Warszawie (2014 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Andrzej Dźwigowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Bud-Grup');
    expect(parsed.history[0].role).toContain('Operator');
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.education.length).toBe(1);
  });

  // 6. Grafik komputerowy / UI Designer
  it('6. Grafik komputerowy / UI Designer (Figma, Photoshop, Illustrator, portfolio)', () => {
    const cv = `
    Karolina Piksel
    karolina.design@creativestudio.pl | 501 777 888 | Wrocław
    Tytuł: UI/UX Designer

    DOŚWIADCZENIE
    Creative Agency Wrocław - Senior UI Designer
    02.2021 - obecnie
    • Projektowanie interfejsów aplikacji webowych i mobilnych w Figmie
    • Tworzenie systemów wzornictwa (Design Systems) i prototypów
    • Przygotowywanie materiałów wektorowych w Illustratorze

    Studio Reklamy Wrocław - Grafik Komputerowy (2018 - 2021)
    • Skład DTP i przygotowanie materiałów do druku wielkoformatowego

    UMIEJĘTNOŚCI
    Figma, Adobe Photoshop, Adobe Illustrator, Design Systems, Prototypowanie, UI Design

    JĘZYKI
    Angielski - C1

    EDUKACJA
    Akademia Sztuk Pięknych we Wrocławiu
    Magister: Grafika i Wzornictwo (2013 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Karolina Piksel');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Creative Agency');
    expect(parsed.hardSkills).toContain('Figma');
    expect(parsed.languages?.length).toBe(1);
    expect(parsed.education.length).toBe(1);
  });

  // 7. Przedstawiciel handlowy B2B
  it('7. Przedstawiciel handlowy B2B (CRM Salesforce, targety, strzałkowe punktery ►)', () => {
    const cv = `
    Marcin Sprzedażowy
    marcin.sales@biznes.pl | +48 603 444 555 | Poznań
    Stanowisko: Key Account Manager B2B

    ► DOŚWIADCZENIE ZAWODOWE
    Tech-Hurt Poznań - Key Account Manager
    06.2020 – obecnie
    - Aktywne pozyskiwanie klientów biznesowych i realizacja planów sprzedaży na poziomie 120%
    - Prowadzenie negocjacji handlowych i przygotowywanie ofert przetargowych
    - Praca w systemie CRM Salesforce

    Pol-Dystrybucja - Przedstawiciel Handlowy (2017 - 2020)
    - Obsługa sieci sklepów na terenie Wielkopolski

    ► KOMPETENCJE
    Negocjacje handlowe, Obsługa CRM, Salesforce, Pozyskiwanie klientów, Prezentacje biznesowe

    ► WYKSZTAŁCENIE
    Uniwersytet Ekonomiczny w Poznaniu
    Magister: Zarządzanie i Marketing (2012 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Marcin Sprzedażowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Tech-Hurt');
    expect(parsed.history[0].role).toContain('Key Account Manager');
    expect(parsed.education.length).toBe(1);
  });

  // 8. Automatyk budynkowy / Instalator Smart Home
  it('8. Automatyk budynkowy / Instalator Smart Home (KNX, Modbus, SEP, format [ ])', () => {
    const cv = `
    Radosław Inteligentny
    r.inteligentny@smarthome.pl | 609 111 444 | Rzeszów
    Specjalność: Instalator Systemów Smart Home

    [DOŚWIADCZENIE ZAWODOWE]
    SmartHouse Rzeszów | Inżynier Automatyki Budynkowej
    03.2021 - obecnie
    • Programowanie i uruchamianie instalacji w standardzie KNX
    • Integracja systemów oświetlenia DALI i klimatyzacji Modbus
    • Montaż i konfiguracja rozdzielnic automatyki domowej

    Elektro-Instal Rzeszów - Instalator Teletechniczny (2018 - 2021)
    • Okablowanie strukturalne i instalacje alarmowe SSWiN

    [UMIEJĘTNOŚCI I PROGRAMY]
    KNX, Modbus, DALI, Uprawnienia SEP, Pomiary elektryczne, AutoCAD, Okablowanie strukturalne

    [CERTYFIKATY]
    Certyfikat KNX Partner (KNX Association) - 2021
    Uprawnienia SEP E+D do 1kV - 2022

    [EDUKACJA]
    Politechnika Rzeszowska
    Inżynier: Elektrotechnika i Automatyka (2014 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Radosław Inteligentny');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('SmartHouse');
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.education.length).toBe(1);
  });

  // 9. Brukarz / Brygadzista robót drogowych
  it('9. Brukarz / Brygadzista robót drogowych (niwelator, zagęszczarki, spacje w datach 04 . 2019)', () => {
    const cv = `
    Kazimierz Bruk
    kazimierz.bruk@interia.pl | 508 333 222 | Kielce
    Stanowisko: Brygadzista Brukarski

    DOŚWIADCZENIE
    04 . 2019 - obecnie
    Drog-Bud Kielce | Brygadzista Robót Brukarskich
    - Pomiary niwelatorem optycznym i wyznaczanie spadków terenu
    - Układanie kostki granitowej i betonowej na placach przemysłowych
    - Nadzór nad zagęszczaniem podbudowy i pracą 6-osobowej brygady

    Bruk-Art Kielce - Brukarz (2016 - 2019)
    - Układanie chodników i krawężników drogowych

    KWALIFIKACJE
    Obsługa niwelatora, Zagęszczarki gruntu, Układanie kostki, Prawo jazdy kat. B, Prawo jazdy kat. C

    UPRAWNIENIA
    Prawo jazdy kat. C - 2018
    Uprawnienia na zagęszczarki i ubijaki wibracyjne - 2017

    SZKOŁY
    Zespół Szkół Budowlanych w Kielcach (2013 - 2016)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Kazimierz Bruk');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Drog-Bud');
    expect(parsed.history[0].role).toContain('Brygadzista');
    expect(parsed.education.length).toBe(1);
    expect(parsed.certifications.length).toBe(2);
  });

  // 10. Specjalista ds. marketingu internetowego / SEO
  it('10. Specjalista ds. marketingu internetowego / SEO (Google Ads, GA4, angielskie nagłówki)', () => {
    const cv = `
    Natalia Marketingowa
    natalia.seo@agencja.pl | +48 607 888 999 | Toruń
    Rola: SEO & Performance Specialist

    WORK EXPERIENCE
    Digital Agency Toruń - Senior SEO Specialist
    May 2021 - Present
    • Conducting technical SEO audits and keyword research using Semrush
    • Managing Google Ads campaigns with monthly budgets over 50k PLN
    • Tracking conversion metrics in Google Analytics 4 (GA4)

    Media-Net - Junior Marketing Specialist (Jan 2019 - Apr 2021)
    • Copywriting and content marketing

    TECHNICAL SKILLS
    Google Ads, Meta Ads, GA4, Semrush, SEO, Copywriting, WordPress

    EDUCATION
    Uniwersytet Mikołaja Kopernika w Toruniu
    Magister: Komunikacja i Media (2014 - 2019)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Natalia Marketingowa');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Digital Agency');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.education.length).toBe(1);
  });

  // 11. Technik farmaceutyczny
  it('11. Technik farmaceutyczny (Kamsoft, leki robione, kropkowane nagłówki ...)', () => {
    const cv = `
    Agnieszka Apteczna
    agnieszka.farmacja@med.pl | 506 222 777 | Białystok
    Tytuł: Technik Farmaceutyczny

    ... HISTORIA PRACY ...
    Apteka Słoneczna Białystok | Technik Farmaceutyczny
    10.2018 - obecnie
    - Wydawanie leków na receptę i preparatów OTC
    - Sporządzanie leków magistralnych (maści, roztwory, czopki) w recepturze
    - Obsługa aptecznego systemu komputerowego Kamsoft

    Apteka Zdrowie - Stażysta Farmaceutyczny (2017 - 2018)
    - Przyjmowanie dostaw hurtowych i weryfikacja terminów ważności

    ... UMIEJĘTNOŚCI ...
    Obsługa Kamsoft, Receptura apteczna, Leki robione, Farmakologia, Doradztwo farmaceutyczne

    ... SZKOŁY ...
    Medyczna Szkoła Policealna w Białymstoku
    Dyplom: Technik Farmaceutyczny (2015 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Agnieszka Apteczna');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Apteka Słoneczna');
    expect(parsed.education.length).toBe(1);
  });

  // 12. Monter rusztowań / Rusztowaniowiec
  it('12. Monter rusztowań (uprawnienia IMBiGS, montaż Layher, polskie miesiące)', () => {
    const cv = `
    Wojciech Wysokościowy
    wojtek.rusztowania@budowlanka.pl | 694 555 123 | Szczecin
    Stanowisko: Monter Rusztowań Przemysłowych

    DOŚWIADCZENIE ZAWODOWE
    Scaff-Mont Szczecin - Monter Rusztowań
    wrzesień 2019 - grudzień 2023
    - Montaż i demontaż rusztowań modułowych Layher i ramowych Plettac
    - Kotwienie rusztowań i montaż siatek ochronnych
    - Praca na stoczniach i obiektach przemysłowych na wysokości powyżej 30m

    Budostal Szczecin - Pomocnik Montera (2017 - 2019)
    - Załadunek i transport elementów rusztowaniowych

    KWALIFIKACJE
    Montaż rusztowań, Rusztowania Layher, Praca na wysokości, Uprawnienia IMBiGS

    CERTYFIKATY
    Książka Operatora IMBiGS - Montażysta Rusztowań Metalowych - 2019

    SZKOŁY
    Szkoła Zawodowa w Szczecinie (2014 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Wojciech Wysokościowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].startDate).toBe('09-2019');
    expect(parsed.history[0].endDate).toBe('12-2023');
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.education.length).toBe(1);
  });

  // 13. Spedytor międzynarodowy
  it('13. Spedytor międzynarodowy (Trans.eu, TimoCom, czas pracy kierowców, język niemiecki)', () => {
    const cv = `
    Piotr Spedycyjny
    piotr.forwarder@logistics.pl | +48 600 321 654 | Gdynia
    Stanowisko: Spedytor Międzynarodowy

    HISTORIA ZATRUDNIENIA
    Baltic Freight Gdynia | Starszy Spedytor Międzynarodowy
    01.2021 - obecnie
    • Organizacja transportów drogowych FTL i LTL na terenie UE
    • Praca na giełdach transportowych Trans.eu oraz TimoCom
    • Kontrola czasu pracy kierowców i rentowności zleceń

    Omega Logistics - Młodszy Spedytor (2018 - 2020)
    • Pozyskiwanie przewoźników i monitoring dostaw

    UMIEJĘTNOŚCI
    Trans.eu, TimoCom, Spedycja międzynarodowa, Negocjacje stawek, Rozliczanie kierowców

    JĘZYKI OBCE
    Niemiecki - C1 (biegły w mowie i piśmie)
    Angielski - B2

    WYKSZTAŁCENIE
    Uniwersytet Gdański
    Licencjat: Transport i Logistyka (2015 - 2018)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Piotr Spedycyjny');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Baltic Freight');
    expect(parsed.languages?.length).toBe(2);
    expect(parsed.languages?.[0].level).toBe('C1');
    expect(parsed.education.length).toBe(1);
  });

  // 14. Dekarz / Blacharz dachowy
  it('14. Dekarz / Blacharz dachowy (obróbki blacharskie, dachówka ceramiczna, wklejenie z notatnika)', () => {
    const cv = `
    Marek Dach
    marek.dekarz@poczta.fm
    Tel. 503 999 444
    Miejscowość: Częstochowa

    PRZEBIEG PRACY
    Dach-Pol Częstochowa - Mistrz Dekarski
    2018 - obecnie
    - Krycie dachów dachówką ceramiczną, cementową oraz blachodachówką
    - Wykonywanie obróbek blacharskich (kosze, okapy, wiatrownice)
    - Zgrzewanie papy termozgrzewalnej na dachach płaskich

    Dachy Śląskie - Pomocnik Dekarza (2015 - 2018)
    - Montaż łat i kontrłat, układanie folii paroprzepuszczalnej

    UMIEJĘTNOŚCI
    Krycie dachów, Obróbki blacharskie, Papa termozgrzewalna, Rysunek techniczny, Zgrzewanie papy

    SZKOŁY
    Zespół Szkół Rzemieślniczych w Częstochowie (2012 - 2015)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Marek Dach');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Dach-Pol');
    expect(parsed.history[0].role).toContain('Dekarski');
    expect(parsed.education.length).toBe(1);
  });

  // 15. Inżynier jakości w automotive
  it('15. Inżynier jakości w automotive (IATF 16949, 8D, FMEA, Politechnika Śląska)', () => {
    const cv = `
    Barbara Jakościowa
    b.jakosc@automotive.pl | 602 123 789 | Bielsko-Biała
    Stanowisko: Inżynier Jakości Automotive

    DOŚWIADCZENIE ZAWODOWE
    Marelli Poland Bielsko-Biała | Inżynier Jakości Procesu
    08.2020 – obecnie
    • Prowadzenie analizy przyczyn źródłowych reklamacji klienta (metodologia 8D, 5Why, Ishikawa)
    • Tworzenie i aktualizacja dokumentacji FMEA oraz planów kontroli Control Plan
    • Udział w audytach wewnętrznych systemu IATF 16949 i VDA 6.3

    Brembo Poland - Kontroler Jakości (2017 - 2020)
    • Pomiary detali na maszynie współrzędnościowej CMM

    KOMPETENCJE TECHNICZNE
    IATF 16949, Metodologia 8D, FMEA, APQP, Audyt VDA 6.3, Rysunek techniczny, Suwmiarka

    CERTYFIKATY
    Certyfikat Audytora Wewnętrznego IATF 16949 (TÜV SÜD) - 2021

    EDUKACJA
    Politechnika Śląska w Gliwicach
    Inżynier: Zarządzanie i Inżynieria Produkcji (2013 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Barbara Jakościowa');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Marelli');
    expect(parsed.history[0].role).toContain('Inżynier Jakości');
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.education.length).toBe(1);
  });

  // 16. Operator wózka wysokiego składu Reach Truck
  it('16. Operator Reach Truck (UDT I WJO, praca w chłodni, prefiksy Rola / Firma)', () => {
    const cv = `
    Łukasz Chłodniczy
    lukasz.reachtruck@logistyka.pl | 510 888 111 | Piotrków Trybunalski
    Rola: Operator Wózka Wysokiego Składu (Reach Truck)

    HISTORIA ZATRUDNIENIA
    Firma: Eurocash Dystrybucja Piotrków
    Rola: Operator Wózka Bocznego Wysokiego Składu
    Data: 02.2020 - obecnie
    - Składowanie palet w regałach wysokiego składu do wysokości 11m
    - Praca w strefie kontrolowanej temperatury (chłodnia / mroźnia)
    - Obsługa terminali radiowych WMS

    Firma: Jysk Dystrybucja Radomsko - Magazynier (2017 - 2020)
    - Rozładunek kontenerów i foliowanie palet

    UMIEJĘTNOŚCI
    Wózki widłowe, Wózek widłowy UDT, Reach Truck, System WMS, Inwentaryzacja

    UPRAWNIENIA
    Zaświadczenie UDT kat. I WJO na wózki jezdniowe specjalizowane (wysoki skład) - 2019

    SZKOŁY
    Zespół Szkół Ponadgimnazjalnych w Piotrkowie Trybunalskim (2013 - 2017)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Łukasz Chłodniczy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Eurocash');
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.education.length).toBe(1);
  });

  // 17. Ślusarz narzędziowy / Formiernik wtryskowy
  it('17. Ślusarz narzędziowy / Formiernik (formy wtryskowe, szlifowanie, mikrometry)', () => {
    const cv = `
    Janusz Narzędziowy
    janusz.narzedziowiec@metal.pl | 601 777 333 | Bydgoszcz
    Stanowisko: Ślusarz Narzędziowy

    DOŚWIADCZENIE ZAWODOWE
    Erg-Plast Bydgoszcz - Ślusarz Narzędziowy
    2019 - obecnie
    - Regeneracja, polerowanie i spasowywanie form wtryskowych
    - Szlifowanie precyzyjne na płasko i na okrągło
    - Pomiary mikrometrem, czujnikiem zegarowym i średnicówką

    Form-Tech Bydgoszcz - Ślusarz Maszynowy (2015 - 2019)
    - Montaż podzespołów mechanicznych i obróbka skrawaniem

    KWALIFIKACJE
    Rysunek techniczny, Obsługa szlifierek, Formy wtryskowe, Pomiary warsztatowe, Suwmiarka

    SZKOŁY
    Technikum Mechaniczne w Bydgoszczy
    Dyplom: Technik Mechanik (2011 - 2015)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Janusz Narzędziowy');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Erg-Plast');
    expect(parsed.history[0].role).toContain('Ślusarz');
    expect(parsed.education.length).toBe(1);
  });

  // 18. Lekarz stażysta / Rezydent
  it('18. Lekarz stażysta / Rezydent (LEK, staż podyplomowy, Uniwersytet Medyczny)', () => {
    const cv = `
    Mateusz Medyk
    mateusz.lekarz@szpital-kliniczny.pl | 608 444 111 | Poznań
    Tytuł: Lekarz w trakcie specjalizacji

    DOŚWIADCZENIE ZAWODOWE
    Ginekologiczno-Położniczy Szpital Kliniczny w Poznaniu
    Lekarz Rezydent (10.2022 - obecnie)
    • Prowadzenie pacjentów na oddziale ginekologii
    • Asystowanie przy zabiegach operacyjnych i cesarskich cięciach
    • Pełnienie samodzielnych dyżurów medycznych

    Szpital Miejski w Poznaniu - Lekarz Stażysta (2021 - 2022)
    • Realizacja podyplomowego stażu lekarskiego

    UMIEJĘTNOŚCI
    Diagnostyka ultrasonograficzna USG, Szycie chirurgiczne, Kwalifikacja do zabiegów, Język angielski medyczny

    JĘZYKI
    Angielski - C1

    EDUKACJA
    Uniwersytet Medyczny im. Karola Marcinkowskiego w Poznaniu
    Kierunek Lekarski (2015 - 2021)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Mateusz Medyk');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Szpital Kliniczny');
    expect(parsed.history[0].role).toContain('Lekarz');
    expect(parsed.education.length).toBe(1);
  });

  // 19. Specjalista ds. cyberbezpieczeństwa / SOC Analyst
  it('19. Specjalista ds. cyberbezpieczeństwa / SOC Analyst (SIEM, Splunk, CompTIA Security+)', () => {
    const cv = `
    Damian Cyber
    damian.security@soc-center.io | +48 505 123 987 | Warszawa
    Stanowisko: Security Operations Center (SOC) Analyst

    PROFESSIONAL EXPERIENCE
    CyberDefense Poland | SOC Analyst L2
    03.2021 - Present
    - Monitoring security incidents and analyzing SIEM alerts (Splunk, QRadar)
    - Investigating phishing campaigns, malware samples and network anomalies
    - Automating alert triage using Python and Bash scripts

    IT-Sec Solutions - Junior Security Administrator (2019 - 2021)
    - Firewall management and vulnerability scanning with Nessus

    TECHNICAL SKILLS
    Python, Linux, Docker, Splunk, SIEM, Wireshark, Bash, Network Security, Git

    CERTIFICATIONS
    CompTIA Security+ - CompTIA - 2021
    Certified Ethical Hacker (CEH) - EC-Council - 2022

    EDUCATION
    Wojskowa Akademia Techniczna w Warszawie
    Inżynier: Kryptologia i Cyberbezpieczeństwo (2015 - 2019)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Damian Cyber');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('CyberDefense');
    expect(parsed.hardSkills).toContain('Python');
    expect(parsed.hardSkills).toContain('Linux');
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.education.length).toBe(1);
  });

  // 20. Hydraulik / Instalator sieci gazowych i CO
  it('20. Hydraulik / Instalator sieci gazowych i CO (zgrzewanie rur PE, próby gazowe, SEP G3, ###)', () => {
    const cv = `
    Bogdan Hydraulik
    bogdan.instalator@poczta.onet.pl | 600 987 654 | Sosnowiec
    Specjalność: Monter Instalacji Gazowych i Sanitarnych

    ### PRZEBIEG PRACY ###
    Gaz-System Śląsk - Monter Sieci Gazowych
    05.2020 - obecnie
    - Zgrzewanie doczołowe i elektrooporowe rur polietylenowych PE
    - Montaż skrzynek gazowych, reduktorów i zaworów głównych
    - Wykonywanie głównych prób szczelności instalacji gazowych

    Instal-San Sosnowiec - Hydraulik (2016 - 2020)
    - Montaż instalacji wodociągowych, kanalizacyjnych i grzejnikowych

    ### UMIEJĘTNOŚCI ###
    Zgrzewanie rur PE, Próby ciśnieniowe, Montaż instalacji sanitarnych, Kocioł gazowy, Pomiary szczelności

    ### CERTYFIKATY ###
    Uprawnienia zgrzewacza rur termoplastycznych (UDT) - 2021
    Świadectwo kwalifikacyjne SEP Grupa 3 (Gazowe) - 2022

    ### SZKOŁY ###
    Technikum Budowlane w Sosnowcu
    Dyplom: Technik Inżynierii Środowiska i Melioracji (2012 - 2016)
    `;

    const parsed = parseTextToMasterVault(cv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Bogdan Hydraulik');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Gaz-System');
    expect(parsed.history[0].role).toContain('Monter');
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.education.length).toBe(1);
    expect(parsed.hardSkills).toContain('Próby ciśnieniowe');
    expect(parsed.hardSkills).toContain('Kocioł gazowy');

    // Weryfikacja scalenia z MasterVault
    const base = createMockVault('Bogdan');
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

    expect(merged.personalInfo.fullName).toBe('Bogdan Hydraulik');
    expect(merged.history.length).toBe(3); // 1 base + 2 imported
    expect(merged.education.length).toBe(2); // 1 base + 1 imported
    expect(merged.skillsMatrix.certifications.length).toBe(2);
  });
});
