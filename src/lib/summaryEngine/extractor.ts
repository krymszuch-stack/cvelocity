import { MasterVault } from '../../types';
import { ExtractedProfileData, SeniorityLevel } from './types';
import { detectIndustryFromRole } from '../starContextHelper';

/**
 * Oblicza łączny staż pracy w latach na podstawie wpisów w historii.
 * Jeśli daty są niepełne lub brak historii, zwraca 0.
 */
export function calculateYearsOfExperience(history: MasterVault['history']): number {
  if (!history || history.length === 0) return 0;

  let totalMonths = 0;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  for (const item of history) {
    if (!item.startDate) continue;

    const startMatch = item.startDate.match(/(?:(\d{1,2})[/.-])?(\d{4})/);
    if (!startMatch) continue;

    const startYear = parseInt(startMatch[2], 10);
    const startM = startMatch[1] ? parseInt(startMatch[1], 10) : 1;

    let endYear = currentYear;
    let endM = currentMonth;

    if (!item.isCurrent && item.endDate) {
      const endMatch = item.endDate.match(/(?:(\d{1,2})[/.-])?(\d{4})/);
      if (endMatch) {
        endYear = parseInt(endMatch[2], 10);
        endM = endMatch[1] ? parseInt(endMatch[1], 10) : 12;
      }
    }

    const months = (endYear - startYear) * 12 + (endM - startM);
    if (months > 0) {
      totalMonths += months;
    }
  }

  // Zwracamy zaokrąglone lata (min. 1 jeśli jest jakikolwiek staż)
  const years = Math.floor(totalMonths / 12);
  return totalMonths > 0 && years === 0 ? 1 : years;
}

/**
 * Wyznacza poziom seniority na podstawie stażu i słów kluczowych w tytule.
 */
export function determineSeniority(title: string, years: number): SeniorityLevel {
  const lower = title.toLowerCase();

  if (lower.includes('lead') || lower.includes('principal') || lower.includes('head') || lower.includes('dyrektor') || lower.includes('kierownik') || years >= 9) {
    return 'lead';
  }
  if (lower.includes('senior') || lower.includes('starszy') || lower.includes('główny') || years >= 5) {
    return 'senior';
  }
  if (lower.includes('junior') || lower.includes('młodszy') || lower.includes('stażysta') || lower.includes('praktykant') || years <= 1) {
    return 'junior';
  }
  return 'mid';
}

/**
 * Ekstrahuje domenę biznesową / obszar z profilu.
 */
export function inferDomain(title: string, industry: string, topSkills: string[]): string {
  const lower = title.toLowerCase();

  if (lower.includes('frontend') || lower.includes('react') || lower.includes('angular')) {
    return 'nowoczesnych aplikacjach webowych i architekturze frontendu';
  }
  if (lower.includes('backend') || lower.includes('node') || lower.includes('java') || lower.includes('python')) {
    return 'skalowalnych systemach backendowych i mikroserwisach';
  }
  if (lower.includes('cloud') || lower.includes('devops') || lower.includes('aws') || lower.includes('azure')) {
    return 'infrastrukturze chmurowej i automatyzacji CI/CD';
  }
  if (lower.includes('monter') || lower.includes('instalator') || lower.includes('hydraulik')) {
    return 'instalacjach technicznych, montażu i serwisie urządzeń';
  }
  if (lower.includes('elektryk') || lower.includes('automatyk')) {
    return 'układach automatyki przemysłowej, zasilaniu i diagnostyce';
  }
  if (lower.includes('magazyn') || lower.includes('logistyk')) {
    return 'gospodarce magazynowej, logistyce i obsłudze systemów WMS';
  }
  if (lower.includes('lekarz') || lower.includes('medyc') || lower.includes('pielęg')) {
    return 'opiece klinicznej, diagnostyce i procedurach medycznych';
  }
  if (lower.includes('handlowiec') || lower.includes('sales') || lower.includes('sprzeda')) {
    return 'rozwoju sprzedaży B2B i budowaniu długofalowych relacji';
  }

  if (topSkills.length > 0) {
    return `obszarze technologii ${topSkills.slice(0, 2).join(' oraz ')}`;
  }

  return 'swojej dziedzinie zawodowej';
}

/**
 * Główna funkcja ekstraktora: wyciąga ustrukturyzowane fakty z MasterVault.
 */
export function extractProfileFromVault(vault: MasterVault): ExtractedProfileData {
  const title = vault.personalInfo?.title || vault.history[0]?.role || 'Specjalista';
  const years = calculateYearsOfExperience(vault.history);
  const location = vault.personalInfo?.location || '';
  const topSkills = (vault.skillsMatrix?.hardSkills || []).slice(0, 6);
  const seniority = determineSeniority(title, years);
  const starContext = detectIndustryFromRole(title);
  const mappedIndustry = starContext === 'tech' ? 'trades' : starContext;
  const industry = (['it', 'trades', 'medical', 'sales'].includes(mappedIndustry) ? mappedIndustry : 'general') as ExtractedProfileData['industry'];
  const domain = inferDomain(title, industry, topSkills);

  return {
    title,
    yearsOfExperience: years,
    location,
    topSkills,
    domain,
    seniority,
    industry,
  };
}
