import { MasterVault } from '../types';

/**
 * Scalanie profilu odczytanego z CV z profilem, który użytkownik już ma.
 *
 * Poprzednia wersja tej logiki gubiła dane: przy niepustej historii wynikiem
 * było `[...parsed.history, ...newHistory]`, czyli dotychczasowe wpisy
 * wypadały w całości, a te zaimportowane, które nie były duplikatami,
 * pojawiały się dwa razy. Import CV kasował więc doświadczenie wpisane ręcznie
 * i jednocześnie dublował to, co wczytał.
 *
 * Reguła jest teraz jedna dla wszystkich kolekcji: to, co użytkownik ma,
 * zostaje i zachowuje kolejność; z importu dochodzi wyłącznie to, czego
 * jeszcze nie ma. Scalanie nigdy nie usuwa wpisu.
 */

/** Klucz porównania — bez rozróżniania wielkości liter i nadmiarowych spacji. */
function toKey(value: string | undefined): string {
  return (value || '').toLowerCase().trim();
}

function compositeKey(...parts: Array<string | undefined>): string {
  const key = parts.map(toKey).join('|');
  // Sam separator oznacza, że żadna część nie miała treści.
  return key.replace(/\|/g, '') === '' ? '' : key;
}

/**
 * Zachowuje `base` w całości i dokłada z `incoming` te pozycje, których klucza
 * jeszcze nie ma.
 *
 * Pozycja z importu bez żadnej treści w polach kluczowych jest pomijana — nie
 * da się jej z niczym porównać, a jest to zwykle artefakt parsowania. Pozycje
 * użytkownika przechodzą zawsze, nawet puste: to jego dane, nie nasze.
 */
export function mergeUnique<T>(base: T[], incoming: T[], keyFn: (item: T) => string): T[] {
  const result = [...base];
  const seen = new Set(base.map(keyFn).filter((key) => key !== ''));

  for (const item of incoming) {
    const key = keyFn(item);
    if (key === '' || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

/** Suma zbiorów tekstowych z zachowaniem kolejności i bez duplikatów. */
function mergeStringSets(base: string[] = [], incoming: string[] = []): string[] {
  return Array.from(new Set([...base, ...incoming]));
}

/**
 * Nakłada profil odczytany z CV na obecny Master Vault.
 *
 * `personalInfo` jest jedynym miejscem, gdzie import nadpisuje: pola z CV są
 * świeższe niż to, co zostało wpisane wcześniej, a użytkownik i tak widzi
 * wynik w edytorze przed zapisem. Wszystko inne wyłącznie się dokłada.
 */
export function mergeImportedVault(prev: MasterVault, parsed: Partial<MasterVault>): MasterVault {
  const safePrev = prev || ({} as MasterVault);
  return {
    ...safePrev,
    personalInfo: {
      ...(safePrev.personalInfo || {}),
      ...(parsed?.personalInfo || {}),
    },
    skillsMatrix: {
      ...(safePrev.skillsMatrix || {}),
      hardSkills: mergeStringSets(safePrev.skillsMatrix?.hardSkills, parsed?.skillsMatrix?.hardSkills),
      softSkills: mergeStringSets(safePrev.skillsMatrix?.softSkills, parsed?.skillsMatrix?.softSkills),
      toolsAndTech: mergeStringSets(
        safePrev.skillsMatrix?.toolsAndTech,
        parsed?.skillsMatrix?.toolsAndTech
      ),
      certifications: mergeUnique(
        safePrev.skillsMatrix?.certifications || [],
        parsed?.skillsMatrix?.certifications || [],
        (item) => compositeKey(item?.name)
      ),
    },
    profiler: {
      ...(safePrev.profiler || {}),
      languages: parsed?.profiler?.languages || safePrev.profiler?.languages || [],
    },
    history: mergeUnique(safePrev.history || [], parsed?.history || [], (item) =>
      compositeKey(item?.company, item?.role)
    ),
    education: mergeUnique(safePrev.education || [], parsed?.education || [], (item) =>
      compositeKey(item?.institution, item?.degree)
    ),
    projects: mergeUnique(safePrev.projects || [], parsed?.projects || [], (item) =>
      compositeKey(item?.name)
    ),
    updatedAt: new Date().toISOString(),
  };
}
