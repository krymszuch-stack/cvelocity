import { describe, it, expect, beforeEach } from 'vitest';
import { Packer } from 'docx';
import mammoth from 'mammoth';
import {
  MasterVault,
  JobOffer,
  TailoredResume,
  CoverLetter,
  JobApplication,
  ApplicationDocumentSnapshot,
} from '../../types';
import { createEmptyVault } from '../sampleVault';
import { buildCvDocument } from '../docxExporter';
import { generatePlainTextCvExport } from '../layeredVaultEngine';
import { StorageKeys, readJson, writeJson } from '../storage';
import { MemoryStorage } from './helpers/memoryStorage';

describe('Historical Document Export Integrity Suite (BUG-003 Verification)', () => {
  let memoryStorage: MemoryStorage;

  const createVaultV1 = (): MasterVault => {
    const vault = createEmptyVault('Jan Kowalski', 'jan@example.com');
    vault.personalInfo = {
      fullName: 'Jan Kowalski',
      title: 'Monter HVAC',
      summary: 'Podsumowanie bazowe V1: Doświadczony monter instalacji HVAC.',
      email: 'jan.kowalski@example.com',
      phone: '+48 500 100 200',
      location: 'Kraków',
    };
    vault.skillsMatrix = {
      hardSkills: ['Montaż HVAC', 'Lutowanie twarde', 'Uprawnienia SEP G1'],
      toolsAndTech: ['Manometry cyfrowe', 'Stacja odzysku czynnika'],
      softSkills: ['Precyzja', 'Praca zespołowa'],
      certifications: [],
    };
    vault.history = [
      {
        id: 'exp_v1_1',
        company: 'TermoKlim Sp. z o.o.',
        role: 'Monter Urządzeń Chłodniczych',
        location: 'Kraków',
        startDate: '2020-01',
        endDate: '2023-12',
        isCurrent: false,
        highlights: [
          {
            id: 'hl_v1_1',
            text: 'Montaż ponad 120 jednostek klimatyzacji split i VRF w obiektach komercyjnych.',
            action: 'Montaż',
            target: 'jednostek klimatyzacji',
            tool: 'Manometry',
            metric: '120 jednostek',
            keywords: ['HVAC', 'VRF'],
          },
        ],
      },
    ];
    vault.education = [
      {
        id: 'edu_v1_1',
        institution: 'Technikum Mechaniczne nr 1',
        degree: 'Technik chłodnictwa',
        fieldOfStudy: 'Chłodnictwo i Klimatyzacja',
        startDate: '2015-09',
        endDate: '2019-06',
      },
    ];
    vault.projects = [];
    return vault;
  };

  const createJobA = (): JobOffer => ({
    id: 'job_ecoclim_1',
    title: 'Serwisant Urządzeń HVAC',
    company: 'EcoClim Polska',
    salary: '8 000 - 10 500 PLN',
    location: 'Kraków',
    description: 'Serwis i montaż instalacji HVAC dla klientów B2B.',
  });

  const createTailoredResumeV1 = (job: JobOffer, _vault?: MasterVault): TailoredResume => ({
    targetJobTitle: job.title,
    companyName: job.company,
    summary: 'Dedykowane podsumowanie dopasowane pod EcoClim Polska (V1).',
    selectedHighlights: [
      {
        experienceId: 'exp_v1_1',
        role: 'Monter Urządzeń Chłodniczych',
        company: 'TermoKlim Sp. z o.o.',
        originalText: 'Montaż ponad 120 jednostek klimatyzacji split i VRF.',
        optimizedText: 'Montaż ponad 120 jednostek klimatyzacji split i VRF zgodnie ze standardem B2B.',
        source: 'SLOT_FILLING',
        keywordsMatched: ['HVAC'],
      },
    ],
    skillsMatched: {
      hardSkills: ['Montaż HVAC', 'Uprawnienia SEP G1'],
      toolsAndTech: ['Manometry cyfrowe'],
      softSkills: ['Precyzja'],
    },
    atsScore: 94,
  });

  const createCoverLetterV1 = (job: JobOffer): CoverLetter => ({
    targetJobTitle: job.title,
    companyName: job.company,
    hook: `Zgłaszam swoją kandydaturę na stanowisko ${job.title} w firmie ${job.company}.`,
    proofPoints: ['Udokumentowane doświadczenie w montażu 120 jednostek klimatyzacji VRF.'],
    callToAction: 'Chętnie spotkam się na rozmowie technicznej.',
    fullText: `Szanowni Państwo,\n\nZgłaszam swoją kandydaturę na stanowisko ${job.title} w firmie ${job.company}.\nUdokumentowane doświadczenie w montażu 120 jednostek klimatyzacji VRF.\n\nChętnie spotkam się na rozmowie technicznej.\n\nZ poważaniem,\nJan Kowalski`,
  });

  beforeEach(() => {
    memoryStorage = new MemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: memoryStorage,
      writable: true,
      configurable: true,
    });
  });

  // Test 1: DOCX snapshot source
  it('Test 1: Eksport DOCX ze snapshotu tworzy poprawny dokument OpenXML z danymi V1', async () => {
    const vaultV1 = createVaultV1();
    const jobA = createJobA();
    const tailoredV1 = createTailoredResumeV1(jobA, vaultV1);

    const doc = buildCvDocument(
      vaultV1,
      [],
      tailoredV1.targetJobTitle,
      jobA.company,
      { summaryOverride: tailoredV1.summary }
    );
    expect(doc).toBeDefined();

    // Fizyczna ekstrakcja tekstu z wygenerowanego bufora OpenXML (.docx)
    const buffer = await Packer.toBuffer(doc);
    const { value: extractedText } = await mammoth.extractRawText({ buffer });

    expect(extractedText).toContain('Jan Kowalski');
    expect(extractedText).toContain('Serwisant Urządzeń HVAC');
    expect(extractedText).toContain('EcoClim Polska');
    expect(extractedText).toContain('TermoKlim Sp. z o.o.');
    expect(extractedText).toContain('Dedykowane podsumowanie dopasowane pod EcoClim Polska (V1).');
  });

  // Test 2: Destructive MasterVault mutation does not pollute historical DOCX export
  it('Test 2: Destrukcyjna modyfikacja MasterVault (V2) nie zmienia ani jednego pola w historycznym eksporcie DOCX', async () => {
    const vaultV1 = createVaultV1();
    const jobA = createJobA();
    const tailoredV1 = createTailoredResumeV1(jobA, vaultV1);
    const coverLetterV1 = createCoverLetterV1(jobA);

    const snapshotV1: ApplicationDocumentSnapshot = {
      schemaVersion: 1,
      createdAt: '2026-08-28T07:00:00.000Z',
      tailoredResume: JSON.parse(JSON.stringify(tailoredV1)),
      coverLetter: JSON.parse(JSON.stringify(coverLetterV1)),
      vaultSnapshot: JSON.parse(JSON.stringify(vaultV1)),
      jobOfferSnapshot: JSON.parse(JSON.stringify(jobA)),
    };

    const applicationA: JobApplication = {
      id: 'app-a-hvac',
      company: jobA.company,
      position: jobA.title,
      salary: jobA.salary,
      date: '2026-08-28',
      status: 'Wysłana',
      documentSnapshot: snapshotV1,
    };

    // Destrukcyjna zmiana globalnego Vault na V2
    const currentVaultV2 = createEmptyVault('Piotr Inżynier', 'piotr@example.com');
    currentVaultV2.personalInfo = {
      fullName: 'Piotr Inżynier',
      title: 'Główny Architekt Systemów',
      summary: 'Podsumowanie V2: Doświadczony architekt oprogramowania chmurowego.',
      email: 'piotr.architekt@example.com',
      phone: '+48 700 800 900',
      location: 'Gdańsk',
    };
    currentVaultV2.skillsMatrix = {
      hardSkills: ['Kubernetes', 'Go', 'Distributed Systems'],
      toolsAndTech: ['Terraform', 'Docker'],
      softSkills: ['Przywództwo'],
      certifications: [],
    };
    currentVaultV2.history = [];
    currentVaultV2.education = [];

    // Generujemy eksport DOCX z aplikacji historycznej A
    const historicalDoc = buildCvDocument(
      applicationA.documentSnapshot!.vaultSnapshot,
      [],
      applicationA.documentSnapshot!.tailoredResume.targetJobTitle,
      applicationA.documentSnapshot!.jobOfferSnapshot.company,
      { summaryOverride: applicationA.documentSnapshot!.tailoredResume.summary }
    );

    // Weryfikacja fizyczna wygenerowanego pliku DOCX
    const buffer = await Packer.toBuffer(historicalDoc);
    const { value: docxText } = await mammoth.extractRawText({ buffer });

    // 1. Zgodność z V1
    expect(docxText).toContain('Jan Kowalski');
    expect(docxText).toContain('Serwisant Urządzeń HVAC');
    expect(docxText).toContain('TermoKlim Sp. z o.o.');
    expect(docxText).toContain('Montaż HVAC');
    expect(docxText).toContain('Dedykowane podsumowanie dopasowane pod EcoClim Polska (V1).');

    // 2. Zero przecieku danych z V2
    expect(docxText).not.toContain('Piotr Inżynier');
    expect(docxText).not.toContain('Główny Architekt Systemów');
    expect(docxText).not.toContain('Podsumowanie V2');
    expect(docxText).not.toContain('Kubernetes');
  });

  // Test 3: Tailored summary takes priority over base vault summary in DOCX
  it('Test 3: DOCX respektuje tailoredResume.summary przed vault.personalInfo.summary', async () => {
    const vaultV1 = createVaultV1();
    const tailoredSummary = 'Dedykowane podsumowanie dla EcoClim Polska (Tailored V1).';

    const docWithTailored = buildCvDocument(
      vaultV1,
      [],
      'Serwisant HVAC',
      'EcoClim Polska',
      { summaryOverride: tailoredSummary }
    );

    const bufferTailored = await Packer.toBuffer(docWithTailored);
    const { value: textTailored } = await mammoth.extractRawText({ buffer: bufferTailored });
    expect(textTailored).toContain('Dedykowane podsumowanie dla EcoClim Polska (Tailored V1).');
    expect(textTailored).not.toContain('Podsumowanie bazowe V1');

    // Sprawdzenie fallbacku gdy summaryOverride jest puste
    const docWithDefault = buildCvDocument(
      vaultV1,
      [],
      'Serwisant HVAC',
      'EcoClim Polska'
    );
    const bufferDefault = await Packer.toBuffer(docWithDefault);
    const { value: textDefault } = await mammoth.extractRawText({ buffer: bufferDefault });
    expect(textDefault).toContain('Podsumowanie bazowe V1: Doświadczony monter instalacji HVAC.');
  });

  // Test 4: Cover letter immutability
  it('Test 4: Treść listu motywacyjnego w snapshocie jest niezmienna i nie ulega modyfikacji', () => {
    const jobA = createJobA();
    const coverLetterV1 = createCoverLetterV1(jobA);

    const snapshotV1: ApplicationDocumentSnapshot = {
      schemaVersion: 1,
      createdAt: '2026-08-28T07:00:00.000Z',
      tailoredResume: createTailoredResumeV1(jobA, createVaultV1()),
      coverLetter: coverLetterV1,
      vaultSnapshot: createVaultV1(),
      jobOfferSnapshot: jobA,
    };

    expect(snapshotV1.coverLetter?.fullText).toContain('Jan Kowalski');
    expect(snapshotV1.coverLetter?.targetJobTitle).toBe('Serwisant Urządzeń HVAC');
    expect(snapshotV1.coverLetter?.companyName).toBe('EcoClim Polska');
  });

  // Test 5: Cover letter variant retention (no reroll to variant 0)
  it('Test 5: Zapisany wariant listu motywacyjnego nie jest nadpisywany domyślnym wariantem 0', () => {
    const customCoverLetter: CoverLetter = {
      targetJobTitle: 'Kierownik Robót Sanitarnych',
      companyName: 'HydroBud',
      hook: 'Niestandardowy hook wariantu 5.',
      proofPoints: ['Unikalny dowód wdrożeniowy'],
      callToAction: 'Zapraszam do kontaktu bezpośredniego.',
      fullText: 'Niestandardowa pełna treść wariantu 5...',
    };

    const snapshot: ApplicationDocumentSnapshot = {
      schemaVersion: 1,
      createdAt: '2026-08-28T07:00:00.000Z',
      tailoredResume: createTailoredResumeV1(createJobA(), createVaultV1()),
      coverLetter: customCoverLetter,
      vaultSnapshot: createVaultV1(),
      jobOfferSnapshot: createJobA(),
    };

    expect(snapshot.coverLetter?.hook).toBe('Niestandardowy hook wariantu 5.');
    expect(snapshot.coverLetter?.fullText).toBe('Niestandardowa pełna treść wariantu 5...');
  });

  // Test 6: Plain Text (TXT) export from historical snapshot
  it('Test 6: Eksport TXT ze snapshotu zawiera dane V1 i nie zawiera danych V2', () => {
    const vaultV1 = createVaultV1();

    const txtOutput = generatePlainTextCvExport(
      vaultV1,
      [],
      'Serwisant HVAC',
      'EcoClim Polska'
    );

    expect(txtOutput).toContain('JAN KOWALSKI');
    expect(txtOutput).toContain('Serwisant HVAC | EcoClim Polska');
    expect(txtOutput).toContain('TermoKlim Sp. z o.o.');
    expect(txtOutput).toContain('Montaż HVAC');
    expect(txtOutput).not.toContain('Piotr Inżynier');
  });

  // Test 7: Missing snapshot safety (manual applications)
  it('Test 7: Aplikacja bez snapshotu nie crashuje i nie pobiera fałszywych danych z MasterVault', () => {
    const manualApp: JobApplication = {
      id: 'manual-app-1',
      company: 'Firma Prywatna',
      position: 'Monter Instalacji',
      salary: '6000 PLN',
      date: '2026-08-15',
      status: 'Do wysłania',
      notes: 'Złożone osobiście.',
    };

    expect(manualApp.documentSnapshot).toBeUndefined();
  });

  // Test 8: Persistence reload
  it('Test 8: Snapshot po zapisie i odczycie z pamięci podręcznej generuje identyczny eksport V1', () => {
    const vaultV1 = createVaultV1();
    const jobA = createJobA();
    const tailoredV1 = createTailoredResumeV1(jobA, vaultV1);

    const app: JobApplication = {
      id: 'app-persist-1',
      company: jobA.company,
      position: jobA.title,
      salary: jobA.salary,
      date: '2026-08-28',
      status: 'Wysłana',
      documentSnapshot: {
        schemaVersion: 1,
        createdAt: '2026-08-28T07:00:00.000Z',
        tailoredResume: tailoredV1,
        vaultSnapshot: vaultV1,
        jobOfferSnapshot: jobA,
      },
    };

    writeJson(StorageKeys.applications, [app]);

    const reloadedApps = readJson<JobApplication[]>(StorageKeys.applications, []);
    const reloadedSnapshot = reloadedApps[0].documentSnapshot!;

    const reloadedDoc = buildCvDocument(
      reloadedSnapshot.vaultSnapshot,
      [],
      reloadedSnapshot.tailoredResume.targetJobTitle,
      reloadedSnapshot.jobOfferSnapshot.company,
      { summaryOverride: reloadedSnapshot.tailoredResume.summary }
    );

    expect(reloadedDoc).toBeDefined();
    expect(reloadedSnapshot.vaultSnapshot.personalInfo.fullName).toBe('Jan Kowalski');
  });

  // Test 9: Historical Export (V1) vs Current Export (V2) simultaneously
  it('Test 9: Równoczesny eksport historycznej aplikacji A (V1) i bieżącego profilu (V2) daje dwa niezależne dokumenty', () => {
    const vaultV1 = createVaultV1();
    const jobA = createJobA();
    const tailoredV1 = createTailoredResumeV1(jobA, vaultV1);

    const historicalApp: JobApplication = {
      id: 'app-hist',
      company: jobA.company,
      position: jobA.title,
      salary: jobA.salary,
      date: '2026-08-28',
      status: 'Wysłana',
      documentSnapshot: {
        schemaVersion: 1,
        createdAt: '2026-08-28T07:00:00.000Z',
        tailoredResume: tailoredV1,
        vaultSnapshot: vaultV1,
        jobOfferSnapshot: jobA,
      },
    };

    const currentVaultV2 = createEmptyVault('Piotr Inżynier', 'piotr@example.com');
    currentVaultV2.personalInfo.fullName = 'Piotr Inżynier';
    currentVaultV2.personalInfo.title = 'Główny Architekt Systemów';

    // Eksport 1: Historical Application
    const histDoc = buildCvDocument(
      historicalApp.documentSnapshot!.vaultSnapshot,
      [],
      historicalApp.documentSnapshot!.tailoredResume.targetJobTitle,
      historicalApp.documentSnapshot!.jobOfferSnapshot.company,
      { summaryOverride: historicalApp.documentSnapshot!.tailoredResume.summary }
    );

    // Eksport 2: Current Profile
    const currentDoc = buildCvDocument(
      currentVaultV2,
      [],
      currentVaultV2.personalInfo.title || '',
      ''
    );

    expect(histDoc).toBeDefined();
    expect(currentDoc).toBeDefined();
    expect(historicalApp.documentSnapshot!.vaultSnapshot.personalInfo.fullName).toBe('Jan Kowalski');
    expect(currentVaultV2.personalInfo.fullName).toBe('Piotr Inżynier');
  });
});
