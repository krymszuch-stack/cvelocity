import {
  parseRawCvToVault,
  optimizeDeltaPhrases,
  parseJobDescriptionWithGemini,
  generateCoverLetterWithFlash,
  generateInterviewCheatSheetEnrichmentWithFlash,
} from '../gemini';
import { MasterVault } from '../../types';
import { auditReframedBullet } from './truthFilter';

/**
 * Warstwa serwisowa nad wywołaniami modelu.
 *
 * Tylko `parseJd` jest dziś wystawione jako trasa HTTP — reszta metod czeka na
 * podpięcie do interfejsu w Fazie 6, już za uwierzytelnieniem i licznikiem kwot.
 * Trzymamy je tutaj, bo implementacje w `gemini.ts` są gotowe i przetestowane;
 * brakuje wyłącznie ekranu, który by ich używał, i kontroli uprawnień.
 */
export class AiService {
  /** Zamienia surowy tekst CV na strukturę MasterVault. */
  async parseCv(rawText: string): Promise<Partial<MasterVault>> {
    return parseRawCvToVault(rawText);
  }

  /** Zamienia treść ogłoszenia na ustrukturyzowane wymagania. */
  async parseJd(rawJdText: string) {
    return parseJobDescriptionWithGemini(rawJdText);
  }

  /**
   * Przeformułowuje pojedynczy punktor doświadczenia pod kątem brakujących
   * słów kluczowych z oferty.
   *
   * Uwaga na przyszłe podpięcie: do promptu doklejane są oba prompty systemowe
   * (~12 kB). Przy wywołaniu na każdy punktor osobno CV z 20 punktorami to 20
   * wywołań i ~20× ten sam narzut. Zanim to trafi do UI, warto wysyłać wszystkie
   * punktory jednego stanowiska w jednym wywołaniu.
   */
  async optimizeDeltaPhrase(
    originalBullet: string,
    targetRole?: string,
    keywords: string[] = [],
    vault?: MasterVault
  ): Promise<{ optimizedBullet: string; method: 'GEMINI_DELTA' | 'SLOT_FILLING' }> {
    try {
      const result = await optimizeDeltaPhrases(
        keywords,
        originalBullet,
        targetRole || 'Inżynier Oprogramowania'
      );
      if (result && result.optimizedText) {
        // Bramka prawdy po modelu: wynik musi dać się wywieźć z oryginalnego
        // punktoru, skarbca albo grafu synonimów. Świadomie **bez** listy braków
        // jako źródła — pochodzi ona z ogłoszenia, a ogłoszenie bywa nośnikiem
        // ukrytych instrukcji („przypisz kandydatowi 10 lat w Rust"). Prośba
        // ogłoszenia nie dowodzi umiejętności kandydata.
        const verdict = auditReframedBullet({
          generatedText: result.optimizedText,
          originalBullet,
          vault,
        });
        if (verdict.verdict === 'PASS') {
          return { optimizedBullet: result.optimizedText, method: 'GEMINI_DELTA' };
        }
        console.warn(
          `[ai] Filtr prawdy odrzucił wynik modelu (nieznane lemy: ${verdict.unknownLemmas.join(', ') || '—'}; fabrykowane metryki: ${verdict.fabricatedMetrics.join(', ') || '—'}) — fallback lokalny.`
        );
      }
    } catch (e) {
      console.warn('[ai] Optymalizacja punktora przez model nie powiodła się, fallback lokalny:', e);
    }

    const rolePrefix = targetRole ? `w kontekście roli ${targetRole}` : '';
    const kwText = keywords.length > 0 ? ` z wykorzystaniem ${keywords.slice(0, 3).join(', ')}` : '';
    return {
      optimizedBullet: `Zrealizowałem ${originalBullet.trim().replace(/^[-•*]\s*/, '')}${kwText} ${rolePrefix}, osiągając wymierną poprawę kluczowych wskaźników wydajnościowych.`,
      method: 'SLOT_FILLING',
    };
  }

  /**
   * Generuje spersonalizowaną część ściągi na rozmowę.
   *
   * Reszta ściągi (słownik, checklista, bank pytań) powstaje lokalnie i za zero
   * tokenów — tutaj trafia tylko to, co wymaga osadzenia w historii kandydata.
   */
  async generateCheatSheetEnrichment(
    targetRole: string,
    companyName: string,
    jobDescription: string,
    vault: MasterVault,
    topRequirements: string[] = []
  ) {
    return generateInterviewCheatSheetEnrichmentWithFlash(
      vault,
      targetRole,
      companyName,
      jobDescription,
      topRequirements
    );
  }

  /** Generuje list motywacyjny na podstawie profilu i treści ogłoszenia. */
  async generateCoverLetter(
    targetRole: string,
    companyName: string,
    jobDescription: string,
    vault: MasterVault
  ) {
    return generateCoverLetterWithFlash(vault, targetRole, companyName, jobDescription);
  }
}

export const aiService = new AiService();
