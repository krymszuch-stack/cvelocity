import { useCallback } from 'react';
import { MasterVault } from '../types';
import { useApplications } from '../store/useApplications';
import { FormSuggestion, SuggestionField, suggestForField } from '../lib/formSuggestions';

/**
 * Podaje formularzom gotową funkcję podpowiadającą.
 *
 * Aplikacje z Pipeline dociągane są tutaj, a nie przekazywane propsami przez
 * cztery poziomy komponentów: `useApplications` czyta sklep modułowy, więc
 * każdy komponent może go użyć bez przewlekania listy przez interfejsy, które
 * nic o niej nie wiedzą.
 *
 * Warstwa chmurowa (`corpus`) jeszcze nie jest podpięta — jej wypełnienie
 * wymaga logowania, którego w kliencie nie ma. Do tego czasu podpowiedzi
 * pochodzą z własnej historii, katalogu branż i słowników.
 */
export type SuggestFn = (
  field: SuggestionField,
  query: string,
  excluded?: readonly string[]
) => FormSuggestion[];

export function useFieldSuggestions(vault: MasterVault): SuggestFn {
  const { applications } = useApplications();

  return useCallback(
    (field, query, excluded = []) =>
      suggestForField(field, query, { vault, applications, excluded }),
    [vault, applications]
  );
}
