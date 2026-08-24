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
        city: 'Warszawa',
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
      location: 'Warszawa',
      title: 'Pracownik',
      summary: 'Profil istniejący w bazie.',
    },
    skillsMatrix: {
      hardSkills: ['Ogólne prace techniczne'],
      softSkills: ['Komunikatywność'],
      toolsAndTech: [],
      certifications: [],
    },
    history: [
      {
        id: 'existing_exp_1',
        company: 'Stary Zakład Pracy',
        role: 'Pomocnik',
        location: 'Warszawa',
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

describe('5 Failproof Adversarial CV Parser & Merger Tests', () => {
  // Test 1: Brak polskich znaków, literówki, format "od 05/2019 do teraz", sklejone myślniki, znaki >>>
  it('Adversarial 1: Brak polskich znaków, prefiksy od/do, znaki >>>, format nieregularny', () => {
    const rawCv = `
    >>> CV - KANDYDAT DO PRACY <<<
    Janusz Kowalski (mail: j.kowalski@poczta.fm, tel 500-600-700, lodz)

    DOSWIADCZENIE ZAWODOWE:
    Firma: Pol-Trans Sp. z o.o.
    Rola: Kierowca kat. C+E
    od 05/2019 do teraz
    Trasy miedzynarodowe po calej Europie, obsluga naczep firanek, wypelnianie dokumentow CMR.

    Auto-Sped Lodz - Kierowca kat. C (od 2016r do 2019r)
    Dystrybucja towarow po wojewodztwie lodzkim.

    CO POTRAFIE:
    Prawo jazdy kat. C+E, KOD 95, Karta kierowcy, ADR podstawowy, Tachograf cyfrowy

    CERTYFIKATY / UPRAWNIENIA:
    Kwalifikacja wstepna przyspieszona (kod 95) - 2019 r.
    Zaswiadczenie ADR - 2020

    SZKOLY:
    Zespol Szkol Ponadgimnazjalnych w Lodzi (2012-2015)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Janusz Kowalski');
    expect(parsed.personalInfo.email).toBe('j.kowalski@poczta.fm');
    expect(parsed.personalInfo.phone).toContain('500');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Pol-Trans');
    expect(parsed.history[0].startDate).toBe('05-2019');
    expect(parsed.history[0].endDate).toBe('Obecnie');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.education.length).toBe(1);
    expect(parsed.hardSkills).toContain('Prawo jazdy kat. C+E');

    const merged = mergeImportedVault(createMockVault('Janusz'), {
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
    expect(merged.history.length).toBe(3); // 1 base + 2 imported
    expect(merged.skillsMatrix.certifications.length).toBe(2);
  });

  // Test 2: Tabulatory, myślniki bez spacji SoftCloud-Senior Developer, sklejone daty 2020.03-obecnie
  it('Adversarial 2: Tabulatory, myślniki bez spacji w firmie-roli, potoczne nagłówki GDZIE PRACOWALEM', () => {
    const rawCv = `
    TOMASZ NOWAK		email: tomasz.it@cloud.com	telefon: +48 777-888-999	Wroclaw

    PODSUMOWANIE ZAWODOWE:
    Senior developer z wieloletnim doswiadczeniem w architekturze mikrouslug.

    GDZIE PRACOWALEM:
    SoftCloud Solutions - Senior Software Engineer (2020.03-obecnie)
    - Projektowanie API w Node.js i TypeScript
    - Wdrazanie kontenerow Docker w chmurze AWS
    - Optymalizacja zapytan w PostgreSQL

    WebDev Sp.k. | Fullstack Developer (od styczen 2017 r. do luty 2020 r.)
    - Tworzenie aplikacji React i Vue

    ZNAJOMOSC NARZEDZI I TECHNOLOGII:
    React, TypeScript, Node.js, Docker, AWS, PostgreSQL, Git, Redis, Jira, REST API

    JEZYKI:
    Angielski (C1)
    Niemiecki (B1)

    CO UKONCZYLEM:
    Politechnika Wroclawska | Inzynier Informatyki (2013-2017)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('TOMASZ NOWAK');
    expect(parsed.personalInfo.email).toBe('tomasz.it@cloud.com');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('SoftCloud');
    expect(parsed.history[0].startDate).toBe('03-2020');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.languages?.length).toBe(2);
    expect(parsed.languages?.[0].level).toBe('C1');
    expect(parsed.education.length).toBe(1);
    expect(parsed.hardSkills).toContain('TypeScript');
  });

  // Test 3: Odwrócona kolejność sekcji, najpierw RODO, potem edukacja, potem umiejętności i historia
  it('Adversarial 3: Odwrócona kolejność sekcji (RODO na początku, potem edukacja, potem historia)', () => {
    const rawCv = `
    KLAUZULA RODO:
    Wyrazam zgode na przetwarzanie moich danych osobowych dla potrzeb rekrutacji.

    Anna Kwiatkowska
    Kontakt: a.kwiatkowska@biuro-rachunkowe.pl | 602 333 444 | Poznan

    WYKSZTALCENIE:
    Uniwersytet Ekonomiczny w Poznaniu
    Magister: Finanse i Rachunkowosc (2014 - 2019)

    KWALIFIKACJE I UMIEJETNOSCI:
    Pelna ksiegowosc, Program Platnik, Symfonia, Enova, Deklaracje VAT i ZUS, Podatki CIT/PIT, Excel

    CERTYFIKACJE:
    Certyfikat Ksiegowego SKwP (Stowarzyszenie Ksiegowych w Polsce) - 2020

    HISTORIA ZATRUDNIENIA:
    Biuro Rachunkowe Bilans Poznan | Samodzielna Ksiegowa
    od 09.2019 do dzisiaj
    * Prowadzenie ksiag handlowych spolek z o.o.
    * Sporzadzanie sprawozdan finansowych i bilansow rocznych
    * Rozliczanie deklaracji podatkowych VAT-7, CIT-8, JPK_V7

    Kancelaria Podatkowa Poznan - Mlodsza Ksiegowa (2017.06 - 2019.08)
    * Wprowadzanie dokumentow kosztowych do systemu Enova
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Anna Kwiatkowska');
    expect(parsed.personalInfo.email).toBe('a.kwiatkowska@biuro-rachunkowe.pl');
    expect(parsed.education.length).toBe(1);
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('Biuro Rachunkowe Bilans');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.certifications.length).toBe(1);
    expect(parsed.hardSkills).toContain('Enova');
  });

  // Test 4: Zniszczone spacje, numeracje 1) 2) 3), angielskie Present, nagłówki ===
  it('Adversarial 4: Zniszczone formatowanie, nawiasy numeracji 1) 2), format 2020-01 - Present', () => {
    const rawCv = `
    === CURRICULUM VITAE ===

    Marek Budowlany
    Email: marek.monter@instalacje.pl  |  Tel: 609 888 123  |  Katowice

    PROFILE:
    Doswiadczony monter rurociagow i instalacji HVAC.

    1) MIEJSCA PRACY
    Instal-Tech Katowice | Monter Instalacji Sanitarnych i HVAC
    2020-01 - Present
    - Montaz rurociagow ze stali weglowej i kwasoodpornej
    - Lutowanie twarde instalacji chlodniczych i pomp ciepla
    - Obsluga palnikow acetylenowo-tlenowych

    Termo-Mont Slask - Pomocnik Montera (2016-2019)
    - Prace slusarsko-monterskie na budowach przemyslowych

    2) UPRAWNIENIA I CERTYFIKATY
    Certyfikat F-Gazy dla personelu kat. I - UDT - 2021
    Swiadectwo SEP Grupa 2 (Cieplne) - 2020

    3) UMIEJETNOSCI
    Montaz instalacji sanitarnych, Pompy ciepla, Klimatyzacja, Lutowanie twarde, Uprawnienia SEP, F-Gazy

    4) SZKOLY
    Zespol Szkol Budowlanych w Katowicach (2013-2016)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Marek Budowlany');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].startDate).toBe('01-2020');
    expect(parsed.history[0].endDate).toBe('Obecnie');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.certifications.length).toBe(2);
    expect(parsed.education.length).toBe(1);
    expect(parsed.hardSkills).toContain('Pompy ciepla');
  });

  // Test 5: Ekstremalny chaos, fale tyld ~~~, wielolinijkowe podsumowanie, brak dwukropków
  it('Adversarial 5: Fale tyld ~~~, wieloliniowe O MNIE, potoczne CO POTRAFIE, Sinumerik CNC', () => {
    const rawCv = `
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Zdzislaw Operator
    Telefon: 512 654 321, E-mail: zdzichu.cnc@fabryka.pl, Miejscowosc: Mielec
    Stanowisko: Operator Frezarki i Tokarki CNC
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    O MNIE
    Jestem operatorem obrabiarek CNC z 7-letnim doswiadczeniem.
    Specjalizuje sie w obrobce skrawaniem detali ze stali nierdzewnej i aluminium.
    Pracuje na sterowaniach Sinumerik oraz Heidenhain.
    Posiadam wlasny transport i jestem dyspozycyjny do pracy 3-zmianowej.

    PRZEBIEG PRACY
    PZL Mielec Sp. z o.o. | Operator / Programista Maszyn CNC
    od 02.2021 do obecnie
    • Samodzielne ustawianie i przezbrajanie frezarek 5-osiowych
    • Korekta programow w sterowaniu Sinumerik 840D
    • Pomiary detali mikrometrem, suwmiarka i srednicowka wg rysunku technicznego

    Aero-Tech Mielec - Ustawiacz Maszyn CNC (2017 - 2021)
    • Dobor narzedzi skrawajacych i plytek skrawajacych

    CO POTRAFIE
    Obsluga maszyn CNC, Sinumerik, Heidenhain, Rysunek techniczny, Suwmiarka, Pomiary warsztatowe

    SZKOLY I UCZELNIE
    Technikum Mechaniczne w Mielcu
    Dyplom: Technik Mechanik Obrobki Skrawaniem (2013 - 2017)
    `;

    const parsed = parseTextToMasterVault(rawCv, 'TXT');
    expect(parsed.personalInfo.fullName).toBe('Zdzislaw Operator');
    expect(parsed.personalInfo.email).toBe('zdzichu.cnc@fabryka.pl');
    expect(parsed.personalInfo.phone).toContain('512');
    expect(parsed.personalInfo.summary).toContain('Sinumerik');
    expect(parsed.history.length).toBe(2);
    expect(parsed.history[0].company).toContain('PZL Mielec');
    expect(parsed.history[0].startDate).toBe('02-2021');
    expect(parsed.history[0].isCurrent).toBe(true);
    expect(parsed.education.length).toBe(1);
    expect(parsed.hardSkills).toContain('Rysunek techniczny');

    // Test bezpiecznego scalenia z MasterVault
    const baseVault = createMockVault('Zdzisław');
    const mergedVault = mergeImportedVault(baseVault, {
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
    expect(mergedVault.personalInfo.fullName).toBe('Zdzislaw Operator');
    expect(mergedVault.history.length).toBe(3);
    expect(mergedVault.education.length).toBe(1);
  });
});
