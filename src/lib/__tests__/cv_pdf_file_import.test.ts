import { describe, it, expect } from 'vitest';
import { parseTextToMasterVault } from '../cvUniversalParser';
import { mergeImportedVault } from '../vaultImportMerge';
import { createEmptyVault } from '../sampleVault';

describe('Real CV Extraction and Master Vault Ingestion', () => {
  const sampleItCvText = `
MAREK KOWALCZYK
Wsparcie Klienta i IT · Administracja · Analiza Danych
Kraków, Polska | +48 501 234 567 | marek.kowalczyk.test@example.com
linkedin.com/in/marek-kowalczyk | portfolio.example.com | Dostępność: natychmiastowa

PROFIL ZAWODOWY
Specjalista łączący obsługę klienta, wsparcie techniczne IT i administrację procesami. Technik informatyk z 
kwalifikacjami E.12–E.14 (sprzęt komputerowy, sieci LAN, bazy danych) oraz absolwent filologii. Praktyczne 
doświadczenie w pracy na pierwszej i drugiej linii wsparcia, obsłudze zgłoszeń w systemach ticketowych i CRM, 
weryfikacji danych oraz monitorowaniu zgłoszeń fraudowych w środowisku bankowym objętym procedurami SLA. 
Średnia ocena jakości obsługi klienta: 4,40/5. Dokładny, odporny na presję czasu, konsekwentny w dokumentowaniu 
pracy.

KLUCZOWE KOMPETENCJE
• Wsparcie IT (Helpdesk / Service Desk): diagnostyka sprzętu i oprogramowania, wsparcie 1. i 2. linii, systemy 
ticketowe, dokumentacja techniczna i baza wiedzy, konfiguracja stanowisk pracy, sieci LAN, VPN, Windows, MS 
Office
• Obsługa klienta i komunikacja: kontakt telefoniczny (inbound i outbound), e-mail i czat, deeskalacja trudnych 
zgłoszeń, praca zgodnie z SLA (Service Level Agreement), systemy CRM, obsługa klientów obcojęzycznych
• Administracja i procesy: prowadzenie i archiwizacja dokumentacji, triaż i kategoryzacja zgłoszeń, priorytetyzacja, 
harmonogramowanie pracy zespołu, koordynacja obiegu informacji między działami, MS Excel, Google Workspace
• Analiza danych i zgodność: weryfikacja poprawności i spójności danych, wykrywanie anomalii i niezgodności, 
monitorowanie zgłoszeń fraudowych, raportowanie, praca na dużych zbiorach danych w MS Excel
• Technologie: Windows, MS Office (Excel, Word, Outlook), Google Workspace, systemy CRM i ticketowe, SQL i 
relacyjne bazy danych, HTML, CSS, JavaScript, narzędzia AI w pracy operacyjnej

DOŚWIADCZENIE ZAWODOWE
Inspektor ds. Obsługi Klienta 05.2026 – 07.2026
Bank Pekao S.A. · Kraków
• Wsparcie klientów w rozwiązywaniu problemów z systemami bankowymi zgodnie ze standardami jakości i 
procedurami SLA — średnia ocena jakości obsługi 4,40/5
• Diagnozowanie zgłoszeń, weryfikacja danych klientów i eskalacja incydentów technicznych do właściwych działów
• Monitorowanie i reagowanie na zgłoszenia dotyczące zagrożeń oraz działań fraudowych
• Praca w systemie CRM: zarządzanie relacjami z klientami, aktualizacja i kontrola spójności danych
• Prowadzenie jasnej i kompletnej dokumentacji zgłoszeń oraz komunikacji z klientem

Pracownik Administracyjno-Biurowy 04.2026 – 05.2026
GROMGAZ, firma handlowo-usługowa · Kraków
• Triaż i kategoryzacja zgłoszeń technicznych: zbieranie wywiadu od klientów, ocena stanu urządzeń i wstępna 
weryfikacja specyfikacji modeli
• Planowanie i harmonogramowanie pracy serwisantów w Google Calendar — dopasowanie uprawnień techników do
typu usterki i optymalizacja tras dojazdowych
• Zarządzanie częściami zamiennymi: weryfikacja dostępności w magazynie i zamawianie komponentów pod 
konkretne zlecenia
• Obsługa zgłoszeń awaryjnych, priorytetyzacja i deeskalacja trudnych incydentów oraz prowadzenie dokumentacji 
serwisowej

Sprzedawca 10.2025 – 02.2026
Auchan Polska Sp. z o.o. · Kraków
• Bieżące doradztwo i wsparcie klientów na hali sprzedażowej
• Kontrola rotacji towaru (FIFO), weryfikacja spójności cen i oznaczeń oraz organizacja ekspozycji zgodnie ze 
standardami sieci

Koordynator Zgłoszeń, Danych i Procesów (staż) 10.2023 – 11.2023
PartWork · Kraków
• Weryfikacja poprawności danych i dokumentacji: kontrola spójności aplikacji, kategoryzacja zgłoszeń i nadzór nad 
obiegiem informacji między działami
• Obsługa korespondencji e-mail oraz wsparcie kandydatów i klientów obcojęzycznych w procesach rekrutacyjnych 
na stanowiska techniczne

Specjalista Wsparcia Technicznego / IT Support (staż) 09.2018 – 10.2018
INTERIA.PL Sp. z o.o. · Kraków
• Obsługa zgłoszeń i incydentów w systemie ticketowym na pierwszej i drugiej linii wsparcia — diagnozowanie i 
rozwiązywanie problemów sprzętowych oraz programowych
• Zaawansowane prace serwisowe: rozbudowa i naprawa laptopów, naprawa urządzeń peryferyjnych, klonowanie 
dysków, odzyskiwanie danych
• Prace infrastrukturalne: układanie i montaż okablowania sieciowego oraz przygotowanie stanowisk pracy pod 
kątem technicznym

WYKSZTAŁCENIE
Filologia, specjalność przekładoznawcza — licencjat 2020 – 2024
Uniwersytet Pedagogiczny im. KEN · Kraków
Praca dyplomowa obroniona na ocenę 5. Kwalifikacje do wykonywania tłumaczeń zwykłych ustnych i pisemnych.

Technik informatyk — wykształcenie średnie techniczne 09.2016 – 04.2020
Zespół Szkół Elektrycznych nr 2 · Kraków

CERTYFIKATY I SZKOLENIA
• Kwalifikacja E.12 (CKE): montaż i eksploatacja komputerów osobistych oraz urządzeń peryferyjnych
• Kwalifikacja E.13 (CKE): projektowanie lokalnych sieci komputerowych (LAN) i administrowanie sieciami
• Kwalifikacja E.14 (CKE): tworzenie aplikacji internetowych i baz danych oraz administrowanie bazami (SQL)
• Umiejętności Jutra AI 3.0 — Google: pięciotygodniowy program wykorzystania sztucznej inteligencji (AI) w pracy i 
rozwoju firmy
• Kurs: tworzenie statycznych stron internetowych w Magento

JĘZYKI OBCE
• Polski — język ojczysty
• Rosyjski — C1 (zaawansowany)
• Angielski — C1 (zaawansowany; swobodna komunikacja ustna i pisemna, dokumentacja techniczna)
• Hiszpański — A2 (podstawowy)
`;

  it('w 100% poprawnie parsuje złożone CV techniczne do struktury Master Vault', () => {
    const parsed = parseTextToMasterVault(sampleItCvText);

    // Personal Info
    expect(parsed.personalInfo.fullName).toBe('MAREK KOWALCZYK');
    expect(parsed.personalInfo.email).toBe('marek.kowalczyk.test@example.com');
    expect(parsed.personalInfo.phone).toBe('+48 501 234 567');
    expect(parsed.personalInfo.location).toContain('Kraków');
    expect(parsed.personalInfo.summary).toContain('Specjalista łączący obsługę klienta');

    // Experience: 5 jobs
    expect(parsed.history.length).toBeGreaterThanOrEqual(4);
    const companies = parsed.history.map((h) => h.company);
    expect(companies.some((c) => c.includes('Pekao'))).toBe(true);
    expect(companies.some((c) => c.includes('GROMGAZ'))).toBe(true);
    expect(companies.some((c) => c.includes('Auchan'))).toBe(true);

    // Education
    expect(parsed.education.length).toBeGreaterThanOrEqual(1);
    expect(parsed.education.some((e) => e.institution.includes('Pedagogiczny') || e.degree.includes('Filologia'))).toBe(true);

    // Certifications
    expect(parsed.certifications.length).toBeGreaterThanOrEqual(3);
    expect(parsed.certifications.some((c) => c.name.includes('E.12') || c.name.includes('E.13') || c.name.includes('Google'))).toBe(true);

    // Skills
    const allSkills = [...parsed.hardSkills, ...parsed.toolsAndTech];
    expect(allSkills.length).toBeGreaterThanOrEqual(5);

    // Languages
    expect(parsed.languages?.length).toBeGreaterThanOrEqual(2);

    // Merge into vault
    const emptyVault = createEmptyVault();
    const mergedVault = mergeImportedVault(emptyVault, {
      personalInfo: parsed.personalInfo,
      skillsMatrix: {
        hardSkills: parsed.hardSkills,
        softSkills: parsed.softSkills,
        toolsAndTech: parsed.toolsAndTech,
        certifications: parsed.certifications,
      },
      history: parsed.history,
      education: parsed.education,
      profiler: {
        ...emptyVault.profiler,
        languages: parsed.languages || [],
      },
    });

    expect(mergedVault.personalInfo.fullName).toBe('MAREK KOWALCZYK');
    expect(mergedVault.personalInfo.email).toBe('marek.kowalczyk.test@example.com');
    expect(mergedVault.history.length).toBeGreaterThanOrEqual(4);
    expect(mergedVault.education.length).toBeGreaterThanOrEqual(1);
  });
});
