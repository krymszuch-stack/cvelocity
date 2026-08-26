import { useCallback, useEffect, useState } from 'react';
import { ApplicationStatus, JobApplication } from '../types';
import { StorageKeys, onAppStorageWiped, readJson, writeJson } from '../lib/storage';
import { grantXp } from './useGamificationStore';

/**
 * Aplikacje w Pipeline — jedno źródło prawdy dla całego interfejsu.
 *
 * Wcześniej lista była prywatnym stanem `ApplicationTracker`: komponent czytał
 * ją z `localStorage` przy montowaniu i odsyłał z powrotem efektem. Dopóki
 * jedynym czytelnikiem był tracker, wystarczało. Przestało, gdy tej samej listy
 * potrzebują silnik „następnego kroku" i mechanizm odblokowań — stan schowany
 * w komponencie znaczyłby dla nich tyle, że rekomendacja aktualizuje się dopiero
 * po wejściu w Pipeline.
 *
 * Sklep jest bez zależności, na wzór `useAppStore`. Zapis idzie do schowka
 * natychmiast przy każdej zmianie: lista jest krótka, a jej serializacja
 * kosztuje ułamek tego co vault, więc odkładanie zapisu kupiłoby tu tylko okno
 * na utratę danych (reguła 9 w `AGENTS.md`).
 */

let applications: JobApplication[] = readJson<JobApplication[]>(StorageKeys.applications, []);
const listeners = new Set<() => void>();

/**
 * Jedna reguła dla wszystkich dróg zapisu: odrzucona aplikacja nie może
 * dalej trzymać terminu rozmowy.
 *
 * Reguła siedzi w `commit`, a nie w poszczególnych handlerach, bo ścieżek
 * zapisu jest kilka (status w wierszu, edycja w modalu, notatki) — wcześniej
 * tylko jedna z nich czyściła `interviewAt` i ta sama zmiana statusu dawała
 * różny wynik w zależności od tego, gdzie użytkownik kliknął.
 */
function withStatusRules(application: JobApplication): JobApplication {
  if (application.status === 'Odrzucona' && application.interviewAt !== undefined) {
    return { ...application, interviewAt: undefined };
  }
  return application;
}

function commit(next: JobApplication[]): void {
  applications = next.map(withStatusRules);
  writeJson(StorageKeys.applications, applications);
  listeners.forEach((notify) => notify());
}

// „Usuń moje dane" musi obejmować także tę kopię w pamięci. Bez resetu pierwszy
// zapis po wymazaniu odtworzyłby w schowku pełną sprzed-usuwania listę — dane
// wróciłyby mimo komunikatu o nieodwracalnym usunięciu. Reset czyści wyłącznie
// pamięć: klucz właśnie zniknął, a ponowny zapis nastąpi dopiero przy nowej
// akcji użytkownika.
onAppStorageWiped(() => {
  applications = [];
  listeners.forEach((notify) => notify());
});

export function useApplications() {
  const [state, setState] = useState<JobApplication[]>(applications);

  useEffect(() => {
    const listener = () => setState(applications);
    listeners.add(listener);
    // Stan mógł się zmienić między pierwszym renderem a podpięciem nasłuchu.
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  /** Dodaje albo nadpisuje wpis o tym samym identyfikatorze. */
  const saveApplication = useCallback((application: JobApplication) => {
    const index = applications.findIndex((entry) => entry.id === application.id);
    if (index === -1) {
      commit([application, ...applications]);
      // Punkty wyłącznie za nowy wpis. Gdyby liczyła się też edycja, licznik
      // rósłby od poprawiania literówki w nazwie firmy.
      // Cel roszczenia to konkretna oferta: dwa wpisy o tej samej firmie i
      // stanowisku są tym samym zgłoszeniem, nawet jeśli mają różne id.
      grantXp('application_added', `${application.company}|${application.position}`);
      return;
    }
    const next = [...applications];
    next[index] = application;
    commit(next);
  }, []);

  const removeApplication = useCallback((id: string) => {
    commit(applications.filter((entry) => entry.id !== id));
  }, []);

  const patchApplication = useCallback((id: string, changes: Partial<JobApplication>) => {
    commit(applications.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)));
  }, []);

  /**
   * Zmiana statusu przez wiersz tabeli. Reguła czyszczenia terminu rozmowy
   * obowiązuje wspólnie dla każdej drogi zapisu — patrz `withStatusRules`.
   */
  const setStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      patchApplication(id, { status });
    },
    [patchApplication]
  );

  return { applications: state, saveApplication, removeApplication, patchApplication, setStatus };
}
