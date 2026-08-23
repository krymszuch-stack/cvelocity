import { useCallback, useEffect, useState } from 'react';
import { ApplicationStatus, JobApplication } from '../types';
import { StorageKeys, readJson, writeJson } from '../lib/storage';

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

function commit(next: JobApplication[]): void {
  applications = next;
  writeJson(StorageKeys.applications, next);
  listeners.forEach((notify) => notify());
}

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
   * Zmiana statusu czyści termin rozmowy, gdy rekrutacja się kończy.
   *
   * Bez tego odrzucona aplikacja z wpisanym terminem dalej podpadałaby pod
   * regułę „wyślij follow-up" i silnik doradzałby pisanie do firmy, która już
   * odmówiła.
   */
  const setStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      const closing = status === 'Odrzucona';
      patchApplication(id, closing ? { status, interviewAt: undefined } : { status });
    },
    [patchApplication]
  );

  return { applications: state, saveApplication, removeApplication, patchApplication, setStatus };
}
