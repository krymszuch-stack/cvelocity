import { GoogleGenAI, Type } from "@google/genai";
import { MasterVault } from "../types";
import { UNIVERSAL_CV_REFRAMING_SYSTEM_PROMPT } from "../data/universalCvReframingPrompt";
import { ATS_CV_REFRAMING_SYSTEM_PROMPT } from "../data/atsCvReframingPrompt";
import { INTERVIEW_CHEAT_SHEET_SYSTEM_PROMPT } from "../data/interviewCheatSheetPrompt";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * Server-side function: Parse raw resume/bio text into normalized Master Vault structure.
 */
export async function parseRawCvToVault(rawText: string): Promise<Partial<MasterVault>> {
  const ai = getGeminiClient();

  const prompt = `
Jesteś precyzyjnym parserem dokumentów rekrutacyjnych, profili i eksportów PDF z LinkedIn oraz życiorysów CV.
Twoim cel jest DOKŁADNE i BEZBŁĘDNE wyekstrahowanie WSZYSTKICH DANYCH z poniższego tekstu do ustrukturyzowanego obiektu JSON.

BARDZO WAŻNE WSKAZÓWKI PARSERA DLA TEKSTÓW Z LINKEDIN:
1. Tekst może zawierać podziały stron i nagłówki z eksportu LinkedIn PDF (np. "Page 1 of 3", "Page 2 of 3", "(Home)", "(LinkedIn)", "(3 mies.)", "Główne umiejętności", "Languages"). IGNORUJ TE NUMERY STRON I PRZYPISY!
2. DANE OSOBOWE: Wyciągnij Imię i Nazwisko (fullName), e-mail (email), telefon (phone), miasto/region (location), nagłówek/tytuł zawodowy (title), odnośnik do profilu (linkedin) oraz pełny opis z podsumowania (summary).
3. UMIEJĘTNOŚCI I JĘZYKI: Przeanalizuj sekcje "Główne umiejętności", "Languages" oraz treść opisu. Dodaj twarde umiejętności, miękkie i języki (np. "polski (Native)", "rosyjski (Professional)", "angielski (Professional)") do odpowiednich tablic (hardSkills, softSkills, toolsAndTech).
4. DOŚWIADCZENIE ZAWODOWE (history): Przeanalizuj WSZYSTKIE FIRMY I STANOWISKA z sekcji "Doświadczenie"! NIE POMIJAJ ŻADNEJ FIRMY!
   Dla każdego stanowiska wyciągnij:
   - company: Nazwa firmy (np. "Bank Pekao S.A.", "Serwis Kotłów I Term Gazowych Gromgaz", "PartWork", "Interia.pl")
   - role: Rola/Stanowisko (np. "Inspektor", "Pracownik biurowy", "Asystent Content Marketingu", "Wsparcie techniczne")
   - location: Miasto/Lokalizacja (np. "Kraków")
   - startDate & endDate: Daty w czytelnym formacie (np. "05.2026", "10.2023" lub "Obecnie")
   - isCurrent: true jeśli pracuje nadal (np. "Present" / "Obecnie"), false w przeciwnym razie
   - highlights: Tablica z obiektem { text: "..." } zawierająca PEŁNY OPIS OBSZARU OBSŁUGI, ZADAŃ, OBOWIĄZKÓW I OSIĄGNIĘĆ z podanej roli! Wklej pełną treść opisu roli!
5. WYKSZTAŁCENIE (education): Przeanalizuj WSZYSTKIE UCZELNIE I SZKOŁY z sekcji "Wykształcenie"! NIE POMIJAJ ŻADNEJ UCZELNI!
   Dla każdej uczelni wyciągnij:
   - institution: Nazwa uczelni/szkoły (np. "Uniwersytet Pedagogiczny im. Komisji Edukacji Narodowej w Krakowie", "Zespół Szkół Elektrycznych nr 2 w Krakowie")
   - degree: Stopień/Tytuł (np. "Baccalauréat / Licencjat", "Technik informatyk")
   - fieldOfStudy: Kierunek (np. "filologia rosyjska", "Informatyka")
   - startDate & endDate: Daty (np. "10.2020", "09.2024")

Tekst do przeanalizowania:
"""
${rawText}
"""
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          personalInfo: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              location: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              linkedin: { type: Type.STRING },
            },
            required: ["fullName", "email", "phone", "location", "title", "summary", "linkedin"],
          },
          skillsMatrix: {
            type: Type.OBJECT,
            properties: {
              hardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              toolsAndTech: { type: Type.ARRAY, items: { type: Type.STRING } },
              certifications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    date: { type: Type.STRING },
                    url: { type: Type.STRING },
                  },
                  required: ["name", "issuer", "date", "url"],
                },
              },
            },
            required: ["hardSkills", "softSkills", "toolsAndTech", "certifications"],
          },
          history: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                company: { type: Type.STRING },
                role: { type: Type.STRING },
                location: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                isCurrent: { type: Type.BOOLEAN },
                highlights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      action: { type: Type.STRING },
                      target: { type: Type.STRING },
                      tool: { type: Type.STRING },
                      metric: { type: Type.STRING },
                      keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["text"],
                  },
                },
              },
              required: ["company", "role", "location", "startDate", "endDate", "isCurrent", "highlights"],
            },
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                institution: { type: Type.STRING },
                degree: { type: Type.STRING },
                fieldOfStudy: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["institution", "degree", "fieldOfStudy", "startDate", "endDate", "description"],
            },
          },
          projects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                description: { type: Type.STRING },
                techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                metrics: { type: Type.STRING },
                link: { type: Type.STRING },
              },
              required: ["name", "role", "description", "techStack", "metrics", "link"],
            },
          },
        },
        required: ["personalInfo", "skillsMatrix", "history", "education", "projects"],
      },
    },
  });

  const jsonStr = response.text || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Gemini output JSON:", jsonStr);
    parsed = {};
  }

  // Assign IDs and defaults to ensure type safety
  if (parsed.history && Array.isArray(parsed.history)) {
    parsed.history = parsed.history.map((exp: any, idx: number) => ({
      id: exp.id || `exp_parsed_${Date.now()}_${idx}`,
      company: exp.company || 'Firma z dokumentu/LinkedIn',
      role: exp.role || 'Specjalista',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || 'Obecnie',
      isCurrent: typeof exp.isCurrent === 'boolean' ? exp.isCurrent : (exp.endDate === 'Obecnie' || !exp.endDate),
      highlights: (exp.highlights || []).map((h: any, hIdx: number) => ({
        id: h.id || `h_parsed_${Date.now()}_${idx}_${hIdx}`,
        text: h.text || '',
        action: h.action || '',
        target: h.target || '',
        tool: h.tool || '',
        metric: h.metric || '',
        keywords: Array.isArray(h.keywords) ? h.keywords : [],
      })),
    }));
  }

  if (parsed.education && Array.isArray(parsed.education)) {
    parsed.education = parsed.education.map((edu: any, idx: number) => ({
      id: edu.id || `edu_parsed_${Date.now()}_${idx}`,
      institution: edu.institution || 'Uczelnia / Szkoła Wyższa',
      degree: edu.degree || 'Dyplom',
      fieldOfStudy: edu.fieldOfStudy || 'Kierunek Studiów',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      description: edu.description || '',
    }));
  }

  if (parsed.projects && Array.isArray(parsed.projects)) {
    parsed.projects = parsed.projects.map((proj: any, idx: number) => ({
      id: proj.id || `proj_parsed_${Date.now()}_${idx}`,
      name: proj.name || 'Projekt',
      role: proj.role || '',
      description: proj.description || '',
      techStack: Array.isArray(proj.techStack) ? proj.techStack : [],
      metrics: proj.metrics || '',
      link: proj.link || '',
    }));
  }

  if (parsed.skillsMatrix?.certifications && Array.isArray(parsed.skillsMatrix.certifications)) {
    parsed.skillsMatrix.certifications = parsed.skillsMatrix.certifications.map((c: any, idx: number) => ({
      id: c.id || `cert_parsed_${Date.now()}_${idx}`,
      name: c.name || 'Certyfikat',
      issuer: c.issuer || '',
      date: c.date || '',
      url: c.url || '',
    }));
  }

  return parsed;
}

/**
 * Server-side Delta Prompting: Generate ONLY delta optimizations for missing job requirements.
 * Token-Optimized: Sends minimal context string instead of whole resume.
 */
export async function optimizeDeltaPhrases(
  missingKeywords: string[],
  existingBullet: string,
  targetRole: string
): Promise<{ optimizedText: string; keywordsMatched: string[] }> {
  const ai = getGeminiClient();

  const prompt = `
${UNIVERSAL_CV_REFRAMING_SYSTEM_PROMPT}

${ATS_CV_REFRAMING_SYSTEM_PROMPT}

ZADANIE SILNIKA REFRAMINGU FREAZY (7 KROKÓW):
Masz istniejący punktor doświadczenia kandydata oraz listę brakujących słów kluczowych / uprawnień z oferty pracy (${targetRole}).

Brakujące słowa kluczowe / uprawnienia: ${missingKeywords.join(", ")}
Obecny punktor: "${existingBullet}"

INSTRUKCJA (KROK 5 - REFRAMING FAZ):
1. Zgodnie z KROKIEM 0-5 obu systemów: Dla korporacji (Tryb A) dopasowuj precyzyjnie słowa kluczowe. Dla rzemiosła/usług (Tryb B) zachowaj prosty, bezpośredni język fachowca.
2. BEZWZGLĘDNY ZAKAZ HALUCYNACJI (KROK 5c): Nie wymyślaj fikcyjnych doświadczeń ani uprawnień, których kandydat nie ma.
3. BEZWZGLĘDNE ZACHOWANIE LICZB I DOWODÓW (KROK 5d): Wszystkie wyniki i wskaźniki podawaj w formie cyfrowej (np. "4,40/5").
4. Zwróć obiekt JSON z polem "optimizedText" oraz "keywordsMatched".
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          optimizedText: { type: Type.STRING },
          keywordsMatched: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["optimizedText", "keywordsMatched"],
      },
    },
  });

  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
}

/**
 * Server-side function: Parse Job Description text into structured requirements JSON
 */
export async function parseJobDescriptionWithGemini(rawJdText: string): Promise<any> {
  const ai = getGeminiClient();

  const prompt = `
Jesteś zaawansowanym analitykiem rekrutacyjnym i systemem PRECYZYJNEJ EKSTRAKCJI TREŚCI OGŁOSZEŃ O PRACĘ.
Twoim zadaniem jest przeanalizować podaną treść ogłoszenia i wypreparować WYŁĄCZNIE merytoryczną treść oferty, CAŁKOWICIE ODRZUCAJĄC nawigacyjny szum portali pracy (np. Pracuj.pl, NoFluffJobs, JustJoin.it, LinkedIn, Olx).

BEZWZGLĘDNE SELEKCJONOWANIE I FILTROWANIE NOISE/BLUFU:
1. IGNORUJ I USUŃ: wszelkie teksty nawigacyjne serwisu, przyciski i odnośniki, np. "Zobacz ofertę", "Aplikuj teraz", "Aplikuj", "Pobierz aplikację", "Polityka prywatności", "Regulamin", "Podobne oferty", "Obserwuj firmę", "Zapisz ofertę", "Zgłoś ogłoszenie", "Strona główna", "Dla pracodawców", "Kategorie", "Zaloguj się", "Udostępnij".
2. SKUPIJ SIĘ WYŁĄCZNIE NA FAZYCH BODY OFERTY:
   - companyName: Nazwa firmy/pracodawcy, który REKRUTUJE (np. "Google", "Comarch", "Bank Pekao"), a NIE nazwa portalu ogłoszeniowego!
   - jobTitle: Oficjalny tytuł stanowiska (np. "Senior Frontend Developer").
   - companyDescription: Krótki opis czym zajmuje się firma / o firmie (np. "Międzynarodowy software house tworzący systemy AI...").
   - seniorityLevel: Jedna z wartości: ENTRY, MID, SENIOR, LEAD, EXECUTIVE.
   - requiredHardSkills: Lista twardych umiejętności i technologii.
   - requiredSoftSkills: Lista kompetencji miękkich.
   - toolsAndTech: Narzędzia, chmury, systemy CI/CD, bazy danych.
   - languagesRequired: Języki obce z poziomem.
   - coreResponsibilities: Kluczowe obowiązki (max 6 zwięzłych punktów).
   - keyKeywords: Frazy kluczowe dla ATS (max 15 haseł).
   - benefits: Oferowane benefity i pakiety.
   - perksAndPlusy: Dodatkowe udogodnienia i atuty.
   - mandatoryRequirements: Wymogi bezwzględnie konieczne (krytyczne dealbreakery).
   - salaryRange: Widełki wynagrodzenia (np. "18 000 - 24 000 PLN B2B") lub "".
   - workModel: Zdalna, Hybrydowa lub Stacjonarna.
   - recruitmentMode: Zgodnie z KROKIEM 0 systemu ("ATS_CORPORATE" dla korporacji/masowych, "CRAFT_LOCAL" dla rzemiosła/usług/warsztatów/lokalnych, "HYBRID" dla średnich sieci).
   - recruitmentModeReason: Krótkie uzasadnienie wyboru trybu odbiorcy.
   - cleanBodyText: Czysta, uporządkowana merytorycznie treść całego ogłoszenia (Opis firmy, Obowiązki, Wymagania, Benefity), spformatowana czytelnie z nagłówkami SEKCJONOWANYMI, całkowicie pozbawiona śmieciowych linków i przycisków!

Treść Ogłoszenia do Przeanalizowania:
"""
${rawJdText}
"""
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          jobTitle: { type: Type.STRING },
          companyName: { type: Type.STRING },
          companyDescription: { type: Type.STRING },
          seniorityLevel: { type: Type.STRING },
          requiredHardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          requiredSoftSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          toolsAndTech: { type: Type.ARRAY, items: { type: Type.STRING } },
          languagesRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
          coreResponsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
          perksAndPlusy: { type: Type.ARRAY, items: { type: Type.STRING } },
          mandatoryRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
          salaryRange: { type: Type.STRING },
          workModel: { type: Type.STRING },
          recruitmentMode: { type: Type.STRING },
          recruitmentModeReason: { type: Type.STRING },
          cleanBodyText: { type: Type.STRING },
        },
        required: [
          "jobTitle",
          "companyName",
          "companyDescription",
          "seniorityLevel",
          "requiredHardSkills",
          "requiredSoftSkills",
          "toolsAndTech",
          "languagesRequired",
          "coreResponsibilities",
          "keyKeywords",
          "benefits",
          "perksAndPlusy",
          "mandatoryRequirements",
          "salaryRange",
          "workModel",
          "recruitmentMode",
          "recruitmentModeReason",
          "cleanBodyText",
        ],
      },
    },
  });

  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
}

/**
 * Server-side Gemini Educational Advisor ("Okienko Doradcy"):
 * Educates the user on ATS rules, why slang/jargon was replaced, how keywords work,
 * and answers user queries about building an effective CV.
 */
export async function getAdvisorEducationalAdvice(
  question: string,
  cvContext?: string,
  jobContext?: string
): Promise<{ explanation: string; tips: string[]; slangAnalysis?: string; actionItems: string[] }> {
  const ai = getGeminiClient();

  const prompt = `
Jesteś cierpliwym, niezwykle merytorycznym Doradcą Rekrutacyjnym i Ekspertem ds. Systemów ATS (Applicant Tracking Systems) oraz Budowy CV.
Twoją rolą w aplikacji SkillVault jest SERWOWANIE JAKO EDUKACYJNY SAMOUCZEK DLA UŻYTKOWNIKA ("Okienko Doradcy").

Wyjaśnij użytkownikowi w jasny, przystępny sposób:
1. "Czemu tak, a nie inaczej" - dlaczego pewne sformułowania w CV są lepsze od potocznych lub branżowego slangu (np. dlaczego "Infolinia Banku Pekao" zamieniamy na "Pekao Direct", dlaczego "klepanie kodu" obniża wynik, dlaczego używanie wskaźników ROI/procentowych zwiększa czytelność).
2. Jak systemy rekrutacyjne ATS skanują CV i skąd biorą się punkty dopasowania.
3. Odpowiedz precyzyjnie na pytania użytkownika i podaj konkretne, wykonalne ulepszenia (Action Items).

Kontekst CV Kandydata:
${cvContext || "Brak szczegółowego CV lub podstawowy profil kandydata."}

Kontekst Oferty Pracy:
${jobContext || "Brak podanej oferty (ogólne zasady budowy CV)."}

Pytanie Użytkownika / Temat do Wyjaśnienia:
"${question}"

Zwróć odpowiedź WYŁĄCZNIE jako obiekt JSON z polami:
- explanation: Czytelne wyjaśnienie w formacie Markdown (z pogrubieniami i nagłówkami). Wyjaśnij powody ("Czemu tak a nie tak"), dlaczego unika się slangu i co daje dane sformułowanie.
- tips: Tablica 3-4 praktycznych wskazówek edukacyjnych dla użytkownika.
- slangAnalysis: Opcjonalne zdanie wyjaśniające specyficzne slangowe określenie, jeśli pytanie o nie dotyczy.
- actionItems: Tablica 3 konkretnych kroków, które użytkownik powinien teraz wykonać w swoim CV.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          slangAnalysis: { type: Type.STRING },
          actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["explanation", "tips", "actionItems"],
      },
    },
  });

  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
}

/**
 * Server-side Gemini Flash Cover Letter Generator:
 * Generates an Anti-Template, business-driven 3-section Cover Letter based on uploaded/created CV data (MasterVault)
 * and Job Offer details, using the fast and economical Gemini Flash model.
 */
export async function generateCoverLetterWithFlash(
  vault: Partial<MasterVault>,
  targetRole: string,
  companyName: string,
  jobDescription: string
): Promise<{ hook: string; proofPoints: string[]; callToAction: string; fullText: string; targetJobTitle: string; companyName: string }> {
  const ai = getGeminiClient();

  const company = companyName || "Państwa Firmie";
  const role = targetRole || "oferowanym stanowisku";

  const prompt = `
Jesteś ekspertowym doradcą rekrutacyjnym. Twoim zadaniem jest stworzenie ultra-skutecznego, biznesowego LISTU MOTYWACYJNEGO w formacie ANTI-TEMPLATE dla kandydata na stanowisko "${role}" w firmie "${company}".

ZASADY ANTI-TEMPLATE:
1. Zero pustych sloganów ("Jestem zmotywowany", "Z przyjemnością aplikuję").
2. Bazuj WYŁĄCZNIE na PRAWDZIWYCH danych z MasterVault kandydata (doświadczenie, konkretne liczby/procenty, narzędzia, projekty).
3. Wygeneruj 3 przejrzyste sekcje:
   - hook (Haczyk): 2-3 zdania bezpośrednio nawiązujące do wyzwań i wymagań podanych w ogłoszeniu pracy oraz do profilu kandydata.
   - proofPoints: Tablica 3 ustrukturyzowanych punktów (zaczynających się od kropki "• ") zawierających mierzone osiągnięcia kandydata z jego historii pracy/projektów.
   - callToAction (CTA): Krótkie zaproszenie do rozmowy kwalifikacyjnej.
   - fullText: Pełny tekst listu gotowy do skopiowania lub wysłania, zawierający nagłówek z danymi kandydata (${vault.personalInfo?.fullName || 'Kandydat'}).

Dane Kandydata z CV (MasterVault):
- Imię i Nazwisko: ${vault.personalInfo?.fullName || ''}
- Tytuł/Stanowisko: ${vault.personalInfo?.title || ''}
- Podsumowanie: ${vault.personalInfo?.summary || ''}
- Umiejętności: ${[...(vault.skillsMatrix?.hardSkills || []), ...(vault.skillsMatrix?.toolsAndTech || [])].join(', ')}
- Doświadczenie zawodowe: ${JSON.stringify(vault.history || [])}
- Projekty: ${JSON.stringify(vault.projects || [])}

Treść Ogłoszenia o Pracę (${company}):
"""
${jobDescription || 'Standardowe ogłoszenie o pracę na stanowisku ' + role}
"""

Zwróć odpowiedź WYŁĄCZNIE jako ustrukturyzowany obiekt JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING },
          proofPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          callToAction: { type: Type.STRING },
          fullText: { type: Type.STRING },
        },
        required: ["hook", "proofPoints", "callToAction", "fullText"],
      },
    },
  });

  const jsonStr = response.text || "{}";
  const parsed = JSON.parse(jsonStr);

  return {
    targetJobTitle: role,
    companyName: company,
    hook: parsed.hook || '',
    proofPoints: Array.isArray(parsed.proofPoints) ? parsed.proofPoints : [],
    callToAction: parsed.callToAction || '',
    fullText: parsed.fullText || `${parsed.hook}\n\n${(parsed.proofPoints || []).join('\n')}\n\n${parsed.callToAction}`,
  };
}

/**
 * Server-side Gemini Flash Interview Cheat Sheet Enrichment:
 * Generates ONLY the parts of the interview cheat sheet that genuinely need
 * personalization — STAR talking points grounded in the candidate's real work
 * history, a "why this role/company" framing, and tone/language-matched
 * emergency phrases. Everything else (glossary, red flags, Q&A bank, questions
 * to ask) is built with zero tokens client-side in interviewCheatSheetEngine.ts.
 */
export async function generateInterviewCheatSheetEnrichmentWithFlash(
  vault: Partial<MasterVault>,
  targetRole: string,
  companyName: string,
  jobDescription: string,
  topRequirements: string[]
): Promise<{
  starTalkingPoints: Array<{
    relatedRequirement: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    sourceExperienceId?: string;
  }>;
  personalizedFraming: string;
  emergencyPhrases: Array<{ scenario: string; phrasePL: string; phraseEN?: string }>;
}> {
  const ai = getGeminiClient();

  const company = companyName || "Państwa Firmie";
  const role = targetRole || "oferowanym stanowisku";

  const prompt = `
${INTERVIEW_CHEAT_SHEET_SYSTEM_PROMPT}

ZADANIE:
Przygotuj materiał do przećwiczenia rozmowy kwalifikacyjnej na stanowisko "${role}" w firmie "${company}".

Kluczowe wymagania z oferty (topRequirements): ${topRequirements.join(", ") || "brak — użyj ogólnego kontekstu oferty"}

Dane Kandydata z CV (MasterVault):
- Imię i Nazwisko: ${vault.personalInfo?.fullName || ''}
- Tytuł/Stanowisko: ${vault.personalInfo?.title || ''}
- Podsumowanie: ${vault.personalInfo?.summary || ''}
- Umiejętności: ${[...(vault.skillsMatrix?.hardSkills || []), ...(vault.skillsMatrix?.toolsAndTech || [])].join(', ')}
- Doświadczenie zawodowe: ${JSON.stringify(vault.history || [])}
- Projekty: ${JSON.stringify(vault.projects || [])}

Treść Ogłoszenia o Pracę (${company}):
"""
${jobDescription || 'Standardowe ogłoszenie o pracę na stanowisku ' + role}
"""

Zwróć odpowiedź WYŁĄCZNIE jako ustrukturyzowany obiekt JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          starTalkingPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                relatedRequirement: { type: Type.STRING },
                situation: { type: Type.STRING },
                task: { type: Type.STRING },
                action: { type: Type.STRING },
                result: { type: Type.STRING },
                sourceExperienceId: { type: Type.STRING },
              },
              required: ["relatedRequirement", "situation", "task", "action", "result"],
            },
          },
          personalizedFraming: { type: Type.STRING },
          emergencyPhrases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scenario: { type: Type.STRING },
                phrasePL: { type: Type.STRING },
                phraseEN: { type: Type.STRING },
              },
              required: ["scenario", "phrasePL"],
            },
          },
        },
        required: ["starTalkingPoints", "personalizedFraming", "emergencyPhrases"],
      },
    },
  });

  const jsonStr = response.text || "{}";
  const parsed = JSON.parse(jsonStr);

  return {
    starTalkingPoints: Array.isArray(parsed.starTalkingPoints) ? parsed.starTalkingPoints : [],
    personalizedFraming: parsed.personalizedFraming || '',
    emergencyPhrases: Array.isArray(parsed.emergencyPhrases) ? parsed.emergencyPhrases : [],
  };
}

